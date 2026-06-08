import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, StatusBar, Alert, Platform, TextInput, Modal, RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// Fallback for newer Expo SDKs where constants might be moved or namespaced differently in types
const { documentDirectory, downloadAsync } = FileSystem as any;
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { useOrderUpdates } from '../hooks/useOrderUpdates';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetails'>;

interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    productImageUrl: string;
    condition: string;
    color: string;
    quantity: number;
    priceAtPurchase: number;
    isReturnable?: boolean;
}

interface Order {
    id: number;
    subtotal: number;
    taxAmount: number;
    shippingFee: number;
    grandTotal: number;
    status: string;
    orderDate: string;
    customerName: string;
    shippingAddress: string;
    city: string;
    state: string;
    pincode: string;
    isOwner: boolean;
    items: OrderItem[];
    // Fitting fields
    deliveryType: 'HOME_DELIVERY' | 'GARAGE_FITTING';
    fittingGarageId?: number;
    fittingStatus?: 'PENDING_INVOICE' | 'PENDING_INSPECTION' | 'INSPECTED' | 'FITTING_IN_PROGRESS' | 'COMPLETED';
    // Rating fields
    partRating?: number;
    deliveryRating?: number;
    platformFee?: number;
    ratingComment?: string;
    // Garage details (included in DTO if fitting)
    fittingGarageName?: string;
    fittingGarageAddress?: string;
    // Discount fields
    appliedCouponCode?: string;
    discountAmount?: number;
    totalSavings?: number;
    
    // Mapped Return Fields
    activeReturnId?: number;
    returnStatus?: string;
    returnReason?: string;
    returnRequestType?: string;
    returnDescription?: string;
    returnAdminNote?: string;
}

export default function OrderDetailsScreen({ route, navigation }: Props) {
    const { orderId } = route.params;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    
    // Rating state
    const [tempPartRating, setTempPartRating] = useState(0);
    const [tempDeliveryRating, setTempDeliveryRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);

    // Return System State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState('WRONG_FITMENT');
    const [returnType, setReturnType] = useState('REPLACEMENT');
    const [returnDescription, setReturnDescription] = useState('');
    const [returnItems, setReturnItems] = useState<{orderItemId: number, quantity: number, maxQuantity: number, partName: string, price: number}[]>([]);
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const [activeReturn, setActiveReturn] = useState<any>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');

    const { isDark } = useThemeStore();
    const { role, user: currentUser } = useAuthStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    useOrderUpdates(orderId, (updatedOrder) => {
        setOrder(updatedOrder);
        if (updatedOrder.activeReturnId) {
            setActiveReturn({
                id: updatedOrder.activeReturnId,
                status: updatedOrder.returnStatus,
                reason: updatedOrder.returnReason,
                description: updatedOrder.returnDescription,
                requestType: updatedOrder.returnRequestType,
                orderId: updatedOrder.id,
                requestedAt: updatedOrder.orderDate,
                adminNote: updatedOrder.adminNote
            });
        }
    });

    const [updating, setUpdating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrderDetails();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchOrderDetails();
    }, []);

    const fetchOrderDetails = async () => {
        try {
            const response = await apiClient.get(`/orders/${orderId}`);
            setOrder(response.data);
            // If already rated, populate temp states (though UI will show readonly version)
            if (response.data.partRating) {
                setTempPartRating(response.data.partRating);
                setTempDeliveryRating(response.data.deliveryRating);
                setRatingComment(response.data.ratingComment || '');
            }
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            Alert.alert('Error', 'Could not retrieve order details.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveReturn = async () => {
        if (!order?.activeReturnId) return;
        try {
            const response = await apiClient.get('/returns/my');
            const request = response.data.find((r: any) => Number(r.orderId) === Number(order.id));
            if (request) {
                setActiveReturn(request);
            }
        } catch (error) {
            console.error('Failed to fetch detailed active return:', error);
            // Fallback to minimal mapped data
            setActiveReturn({
                id: order.activeReturnId,
                orderId: order.id,
                status: order.returnStatus,
                reason: order.returnReason,
                requestType: order.returnRequestType || 'REFUND',
                description: order.returnDescription || '',
                adminNote: order.returnAdminNote || ''
            });
        }
    };

    useEffect(() => {
        if (order) {
            if (order.activeReturnId) {
                fetchActiveReturn();
            } else {
                setActiveReturn(null);
            }
        }
    }, [order]);

    const openReturnModal = () => {
        if (order?.items) {
            const initialItems = order.items
                .filter((item: any) => item.isReturnable)
                .map((item: any) => ({
                    orderItemId: item.id,
                    quantity: 0,
                    maxQuantity: item.quantity,
                    partName: item.productName || 'Unknown Product',
                    price: item.priceAtPurchase || 0
                }));
            setReturnItems(initialItems);
        }
        setIsReturnModalOpen(true);
    };

    const handleSubmitReturn = async () => {
        if (submittingReturn) return;
        if (!returnDescription.trim()) {
            Alert.alert('Required', 'Please provide a description for the return.');
            return;
        }

        const selectedItems = returnItems.filter(item => item.quantity > 0).map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity
        }));

        if (selectedItems.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one item to return and specify the quantity.');
            return;
        }

        setSubmittingReturn(true);
        try {
            await apiClient.post('/returns', {
                orderId: orderId,
                reason: returnReason,
                requestType: returnType,
                description: returnDescription,
                imageUrls: [],
                items: selectedItems
            });
            setIsReturnModalOpen(false);
            Alert.alert('Success', 'Return protocol has been transmitted successfully.');
            fetchOrderDetails();
        } catch (error) {
            console.error('Return submission failed:', error);
            Alert.alert('Error', 'Failed to submit return request.');
        } finally {
            setSubmittingReturn(false);
        }
    };

    const handleSubmitRating = async () => {
        if (!tempPartRating || !tempDeliveryRating) {
            Alert.alert('Selection Required', 'Please provide a rating for both Part and Delivery.');
            return;
        }

        setSubmittingRating(true);
        try {
            await apiClient.post(`/orders/${orderId}/rating`, {
                partRating: tempPartRating,
                deliveryRating: tempDeliveryRating,
                comment: ratingComment
            });
            
            Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
            // Refresh order details to show the locked-in rating UI
            fetchOrderDetails();
        } catch (error: any) {
            console.error('Rating submission failed:', error);
            const msg = error.response?.data?.message || 'Could not submit your feedback. Please try again.';
            Alert.alert('Submission Failed', msg);
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        setUpdating(true);
        try {
            await apiClient.put(`/orders/${orderId}/status?status=${status}`);
            Alert.alert('Success', `Order status updated to ${status.replace(/_/g, ' ')}.`);
            fetchOrderDetails();
        } catch (error: any) {
            console.error('Status update failed:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update order status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateFittingStatus = async (status: string) => {
        setUpdating(true);
        try {
            await apiClient.patch(`/orders/${orderId}/fitting-status?status=${status}`);
            Alert.alert('Success', `Fitting stage updated: ${status.replace(/_/g, ' ')}.`);
            fetchOrderDetails();
        } catch (error: any) {
            console.error('Fitting status update failed:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update fitting status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleReturnAction = async (action: 'approve' | 'reject' | 'picked-up' | 'finalize', note?: string) => {
        if (!activeReturn) return;
        setUpdating(true);
        try {
            const endpoint = action === 'picked-up' ? 'picked-up' : (action === 'finalize' ? 'finalize' : action);
            const query = action === 'reject' ? `?note=${encodeURIComponent(note || 'Policy')}` : '';
            await apiClient.put(`/returns/admin/${activeReturn.id}/${endpoint}${query}`);
            Alert.alert('Success', `Return ${action.replace(/-/g, ' ')} successfully`);
            fetchOrderDetails();
        } catch (error: any) {
            console.error('Return action failed:', error);
            Alert.alert('Action Failed', error.response?.data?.message || 'Could not process return status update.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        setDownloading(true);

        try {
            const fileName = `Invoice_${orderId}.pdf`;
            const fileUri = `${documentDirectory}${fileName}`;

            // We need to pass the auth token since it's a direct URL download
            const token = useAuthStore.getState().token;
            
            const downloadRes = await downloadAsync(
                `${apiClient.defaults.baseURL}/orders/${orderId}/invoice`,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (downloadRes.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert('Success', 'Invoice downloaded to ' + fileUri);
                }
            } else {
                throw new Error('Failed to download PDF');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Download Failed', 'Could not download the invoice. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerBox, { backgroundColor: T.bg }]}>
                <ActivityIndicator size="large" color="#DF2324" />
            </View>
        );
    }

    if (!order) return null;

    const { subtotal, taxAmount, shippingFee, platformFee, grandTotal } = order;

    return (
        <View style={[styles.container, { backgroundColor: T.bg, paddingTop: Math.max(insets.top, 10) }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>Digital Receipt</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#DF2324']}
                        tintColor="#DF2324"
                    />
                }
            >
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                    <View style={styles.receiptHeader}>
                        <View>
                            <Text style={[styles.brandText, { color: '#DF2324' }]}>MAD GARAGE</Text>
                            <Text style={[styles.receiptSub, { color: T.subText }]}>Performance Parts Shop</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '22' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.orderInfoRow}>
                        <View>
                            <Text style={[styles.infoLabel, { color: T.subText }]}>ORDER ID</Text>
                            <Text style={[styles.infoValue, { color: T.text }]}>#{order.id}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.infoLabel, { color: T.subText }]}>DATE</Text>
                            <Text style={[styles.infoValue, { color: T.text }]}>
                                {new Date(order.orderDate).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Shipping Section */}
                <View style={[styles.statusCard, { backgroundColor: T.card, borderColor: T.cardBorder, marginTop: 0 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.infoLabel, { color: T.subText, marginBottom: 0 }]}>
                            {order.deliveryType === 'GARAGE_FITTING' ? 'FITTING DETAILS' : 'SHIPPING DETAILS'}
                        </Text>
                        <View style={[styles.deliveryTypeBadge, { backgroundColor: order.deliveryType === 'GARAGE_FITTING' ? '#DF232422' : T.statBg }]}>
                            <Text style={[styles.deliveryTypeText, { color: order.deliveryType === 'GARAGE_FITTING' ? '#DF2324' : T.subText }]}>
                                {order.deliveryType === 'GARAGE_FITTING' ? 'GARAGE FIT' : 'HOME DELIVERY'}
                            </Text>
                        </View>
                    </View>

                    {order.deliveryType === 'GARAGE_FITTING' ? (
                        <>
                            <Text style={[styles.infoValue, { color: T.text, fontSize: 16 }]}>{order.fittingGarageName || 'Selected Garage'}</Text>
                            <View style={styles.fittingStatusRow}>
                                <Ionicons name="cog-outline" size={14} color="#DF2324" />
                                <Text style={[styles.fittingStatusLabel, { color: T.subText }]}>FITTING STATUS: </Text>
                                <Text style={[styles.fittingStatusValue, { color: '#DF2324' }]}>{order.fittingStatus?.replace(/_/g, ' ') || 'PENDING'}</Text>
                            </View>
                            <Text style={[styles.receiptSub, { color: T.subText, marginTop: 8, lineHeight: 18 }]}>
                                {order.fittingGarageAddress || order.city + ', ' + order.state}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.infoValue, { color: T.text, fontSize: 16 }]}>{order.customerName}</Text>
                            <Text style={[styles.receiptSub, { color: T.subText, marginTop: 4, lineHeight: 18 }]}>
                                {order.shippingAddress}{'\n'}
                                {order.city}, {order.state} - {order.pincode}
                            </Text>
                        </>
                    )}
                </View>

                {/* Items Section */}
                <Text style={[styles.sectionTitle, { color: T.text }]}>ORDERED ITEMS</Text>
                {order.items.map((item) => (
                    <View key={item.id} style={[styles.itemRow, { borderBottomColor: T.cardBorder }]}>
                        <View style={styles.itemMain}>
                            <Text style={[styles.itemName, { color: T.text }]}>{item.productName || 'Unknown Part'}</Text>
                            <View style={styles.itemSpecs}>
                                <View style={[styles.specBadge, { backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0' }]}>
                                    <Text style={[styles.specText, { color: T.subText }]}>
                                        {item.condition?.toUpperCase() || 'NEW'}
                                    </Text>
                                </View>
                                <View style={[styles.specBadge, { backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0' }]}>
                                    <Text style={[styles.specText, { color: T.subText }]}>
                                        {item.color?.toUpperCase() || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.itemQty, { color: T.subText }]}>x{item.quantity}</Text>
                            <Text style={[styles.itemPrice, { color: T.text }]}>₹{(item.priceAtPurchase ?? 0).toLocaleString()}</Text>
                            {item.isReturnable === false && (
                                <View style={[styles.specBadge, { backgroundColor: '#FF444422', marginTop: 4 }]}>
                                    <Text style={[styles.specText, { color: '#FF4444', fontSize: 8 }]}>NON-RETURNABLE</Text>
                                </View>
                            )}
                        </View>
                    </View>
                ))}

                {/* Summary Section */}
                <View style={[styles.summaryBox, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: T.subText }]}>Subtotal</Text>
                        <Text style={[styles.summaryValue, { color: T.text }]}>₹{(subtotal ?? 0).toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: T.subText }]}>Shipping Fee</Text>
                        <Text style={[styles.summaryValue, { color: T.text }]}>₹{(shippingFee ?? 0).toLocaleString()}</Text>
                    </View>
                    {shippingFee > 150 && (
                        <View style={[styles.summaryRow, { marginTop: -4, paddingLeft: 12 }]}>
                            <Text style={[styles.summaryLabel, { color: '#FF9800', fontSize: 12 }]}>• Freight / Fragile Surcharge</Text>
                            <Text style={[styles.summaryValue, { color: '#FF9800', fontSize: 12 }]}>₹{(shippingFee - 150).toLocaleString()}</Text>
                        </View>
                    )}
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: T.subText }]}>Platform Fee</Text>
                        <Text style={[styles.summaryValue, { color: T.text }]}>₹{(platformFee ?? 0).toLocaleString()}</Text>
                    </View>
                    {(order.totalSavings ?? 0) > 0 && (
                        <View style={styles.summaryRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="trending-down" size={14} color="#00FF00" style={{ marginRight: 4 }} />
                                <Text style={[styles.summaryLabel, { color: '#00FF00', fontWeight: '900' }]}>Retail Discount</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: '#00FF00', fontWeight: '900' }]}>- ₹{order.totalSavings?.toLocaleString()}</Text>
                        </View>
                    )}
                    {order.appliedCouponCode && (
                        <View style={styles.summaryRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="pricetag-outline" size={14} color="#4CAF50" style={{ marginRight: 4 }} />
                                <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Coupon ({order.appliedCouponCode})</Text>
                            </View>
                            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>- ₹{(order.discountAmount ?? 0).toLocaleString()}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={[styles.totalLabel, { color: T.text }]}>Grand Total</Text>
                        <Text style={[styles.totalValue, { color: '#DF2324' }]}>₹{(grandTotal ?? 0).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Download PDF Invoice - always available */}
                <TouchableOpacity 
                    style={[styles.downloadBtn, { opacity: downloading ? 0.7 : 1 }]}
                    onPress={handleDownloadInvoice}
                    disabled={downloading}
                >
                    {downloading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="cloud-download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.downloadBtnText}>Download PDF Invoice</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Rating Section - Only visible to the purchaser */}
                {(order.status === 'PAID' || order.status === 'DELIVERED') && order.isOwner ? (
                    <View style={[styles.summaryBox, { marginTop: 20, backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: T.text, marginBottom: 15 }]}>
                            {order.partRating ? 'Your Feedback' : 'Rate Your Build'}
                        </Text>
                        
                        <View style={styles.ratingGroup}>
                            <Text style={[styles.ratingLabel, { color: T.subText }]}>Part Quality</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity 
                                        key={star} 
                                        disabled={!!order.partRating || submittingRating}
                                        onPress={() => setTempPartRating(star)}
                                    >
                                        <Ionicons 
                                            name={star <= (order.partRating || tempPartRating) ? "star" : "star-outline"} 
                                            size={24} 
                                            color="#FFD700" 
                                            style={{ marginRight: 4 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.ratingGroup}>
                            <Text style={[styles.ratingLabel, { color: T.subText }]}>Delivery Experience</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity 
                                        key={star} 
                                        disabled={!!order.deliveryRating || submittingRating}
                                        onPress={() => setTempDeliveryRating(star)}
                                    >
                                        <Ionicons 
                                            name={star <= (order.deliveryRating || tempDeliveryRating) ? "star" : "star-outline"} 
                                            size={24} 
                                            color="#FFD700" 
                                            style={{ marginRight: 4 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {!order.partRating ? (
                            <>
                                <View style={[styles.commentBox, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                    <TextInput
                                        style={[styles.commentInput, { color: T.text }]}
                                        placeholder="Add a comment (optional)..."
                                        placeholderTextColor={T.placeholder}
                                        value={ratingComment}
                                        onChangeText={setRatingComment}
                                        multiline
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={styles.submitRatingBtn}
                                    disabled={submittingRating}
                                    onPress={handleSubmitRating}
                                >
                                    {submittingRating ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.submitRatingText}>SUBMIT FEEDBACK</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={[styles.submittedFeedback, { borderTopColor: T.cardBorder }]}>
                                <Text style={[styles.feedbackComment, { color: T.text }]}>
                                    "{order.ratingComment || 'No comment provided.'}"
                                </Text>
                                <Text style={[styles.feedbackDate, { color: T.subText }]}>Thank you for your feedback!</Text>
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Active Return Display */}
                {activeReturn && (
                    <View style={[styles.summaryBox, { marginTop: 20, backgroundColor: T.card, borderColor: '#DF232444', borderWidth: 1 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="refresh-circle" size={24} color="#DF2324" />
                            <Text style={[styles.sectionTitle, { color: T.text, marginBottom: 0, marginLeft: 8 }]}>RETURN PROTOCOL ACTIVE</Text>
                        </View>

                        <View style={{ backgroundColor: '#DF232411', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: T.text, lineHeight: 20 }}>
                                {activeReturn.requestType === 'REFUND' 
                                    ? "Refund will be processed automatically after the product is picked up and returned to the seller for verification."
                                    : "Replacement parts will be dispatched once the original items are collected by our fulfillment agent."}
                            </Text>
                        </View>
                        
                        <View style={styles.returnInfoRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.infoLabel, { color: T.subText }]}>RESOLUTION</Text>
                                <Text style={[styles.infoValue, { color: T.text }]}>{activeReturn.requestType}</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text style={[styles.infoLabel, { color: T.subText }]}>STATUS</Text>
                                <Text style={[styles.statusText, { color: '#DF2324' }]}>{activeReturn.status}</Text>
                            </View>
                        </View>

                        <View style={{ marginTop: 12, padding: 12, backgroundColor: T.bg, borderRadius: 8 }}>
                            <Text style={[styles.infoLabel, { color: T.subText }]}>REASON: {activeReturn.reason?.replace(/_/g, ' ')}</Text>
                            <Text style={[styles.feedbackComment, { color: T.text, fontSize: 12, marginTop: 4 }]}>"{activeReturn.description}"</Text>
                        </View>

                        {activeReturn.items && activeReturn.items.length > 0 && (
                            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: T.cardBorder, paddingTop: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                                    <Text style={[styles.infoLabel, { color: '#DF2324', marginBottom: 0 }]}>ITEMIZED RECEIPT</Text>
                                    {activeReturn.refundAmount != null && (
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.infoLabel, { color: T.subText, fontSize: 8 }]}>TOTAL REFUND</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '900', color: T.text, fontStyle: 'italic' }}>₹{activeReturn.refundAmount.toLocaleString()}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={{ gap: 8 }}>
                                    {activeReturn.items.map((item: any, idx: number) => (
                                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.inputBg, padding: 10, borderRadius: 8 }}>
                                            <Text style={{ flex: 1, fontSize: 11, fontWeight: '800', color: T.text, textTransform: 'uppercase' }}>{item.partName}</Text>
                                            <View style={{ backgroundColor: '#DF232411', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#DF232422' }}>
                                                <Text style={{ fontSize: 10, fontWeight: '900', color: '#DF2324' }}>QTY: {item.quantity}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {activeReturn.adminNote && (
                            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: T.cardBorder, paddingTop: 12 }}>
                                <Text style={[styles.infoLabel, { color: '#DF2324' }]}>ADMIN MESSAGE</Text>
                                <Text style={[styles.feedbackComment, { color: T.text, fontSize: 12, marginTop: 4 }]}>"{activeReturn.adminNote}"</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Customer Delivery Confirmation */}
                {(order.status === 'SHIPPED' || order.status === 'ARRIVED_AT_GARAGE') && order.isOwner && (
                    <TouchableOpacity 
                        style={[styles.downloadBtn, { backgroundColor: '#4CAF50', marginTop: 20 }]}
                        onPress={() => handleUpdateStatus('DELIVERED')}
                        disabled={updating}
                    >
                        {updating ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="checkmark-done-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.downloadBtnText}>CONFIRM DELIVERY RECEIVED</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Return Request Button - Show if Delivered OR if Requested but record is missing (Repair Protocol) */}
                {(order.status === 'DELIVERED' || (order.status === 'RETURN_REQUESTED' && !activeReturn)) && order.isOwner && (
                    <TouchableOpacity 
                        style={[styles.returnBtn, { borderColor: order.items?.some(i => i.isReturnable === true) ? '#DF2324' : T.cardBorder, opacity: order.items?.some(i => i.isReturnable === true) ? 1 : 0.5 }]}
                        onPress={openReturnModal}
                        disabled={!order.items?.some(i => i.isReturnable === true)}
                    >
                        <Ionicons name="reload-outline" size={18} color={order.items?.some(i => i.isReturnable === true) ? '#DF2324' : T.subText} />
                        <Text style={[styles.returnBtnText, { color: order.items?.some(i => i.isReturnable === true) ? '#DF2324' : T.subText }]}>
                            {order.items?.some(i => i.isReturnable === true) ? 'INITIATE RETURN / REPLACEMENT' : 'RETURNS UNAVAILABLE (FINAL SALE)'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Seller/Garage/Admin/Worker Action Center */}
                {(role === 'ROLE_SELLER' || role === 'ROLE_ADMIN' || role === 'ROLE_GARAGE' || role === 'ROLE_WORKER') && (
                    <View style={styles.actionCenter}>
                        <Text style={[styles.sectionTitle, { color: T.text, marginTop: 20 }]}>Status Actions</Text>
                        
                        {(role === 'ROLE_ADMIN' || role === 'ROLE_WORKER') && order.status === 'RETURN_REQUESTED' && activeReturn && activeReturn.status === 'PENDING' && (
                            <View style={{ gap: 10, marginTop: 12 }}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                                    onPress={() => handleReturnAction('approve')}
                                    disabled={updating}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>APPROVE RETURN PROTOCOL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
                                    onPress={() => {
                                        setRejectionNote('Request does not meet return policy criteria.');
                                        setIsRejectModalOpen(true);
                                    }}
                                    disabled={updating}
                                >
                                    <Ionicons name="close-circle-outline" size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>REJECT RETURN REQUEST</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(role === 'ROLE_ADMIN' || role === 'ROLE_WORKER') && activeReturn && activeReturn.status === 'APPROVED' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#2196F3', marginTop: 12 }]}
                                onPress={() => handleReturnAction('picked-up')}
                                disabled={updating}
                            >
                                <Ionicons name="cube-outline" size={20} color="#FFF" />
                                <Text style={styles.actionBtnText}>MARK AS PICKED UP</Text>
                            </TouchableOpacity>
                        )}

                        {(role === 'ROLE_ADMIN' || role === 'ROLE_WORKER') && activeReturn && activeReturn.status === 'PICKED_UP' && activeReturn.requestType === 'REFUND' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#9C27B0', marginTop: 12 }]}
                                onPress={() => handleReturnAction('finalize')}
                                disabled={updating}
                            >
                                <Ionicons name="cash-outline" size={20} color="#FFF" />
                                <Text style={styles.actionBtnText}>FINALIZE REFUND</Text>
                            </TouchableOpacity>
                        )}

                        {role === 'ROLE_SELLER' && order.status === 'PAID' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
                                onPress={() => handleUpdateStatus('SHIPPED')}
                                disabled={updating}
                            >
                                {updating ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <Ionicons name="airplane-outline" size={20} color="#FFF" />
                                        <Text style={styles.actionBtnText}>MARK AS SHIPPED</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {role === 'ROLE_GARAGE' && order.deliveryType === 'GARAGE_FITTING' && (
                            <View style={{ gap: 10 }}>
                                {order.status === 'SHIPPED' && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { backgroundColor: '#00BCD4' }]}
                                        onPress={() => handleUpdateFittingStatus('ARRIVED_AT_GARAGE')}
                                        disabled={updating}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                                        <Text style={styles.actionBtnText}>VERIFY ARRIVAL</Text>
                                    </TouchableOpacity>
                                )}
                                {order.status === 'ARRIVED_AT_GARAGE' && order.fittingStatus === 'PENDING_INSPECTION' && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
                                        onPress={() => handleUpdateFittingStatus('INSPECTED')}
                                        disabled={updating}
                                    >
                                        <Ionicons name="search-outline" size={20} color="#FFF" />
                                        <Text style={styles.actionBtnText}>MARK AS INSPECTED</Text>
                                    </TouchableOpacity>
                                )}
                                {order.fittingStatus === 'INSPECTED' && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                                        onPress={() => handleUpdateFittingStatus('COMPLETED')}
                                        disabled={updating}
                                    >
                                        <Ionicons name="build-outline" size={20} color="#FFF" />
                                        <Text style={styles.actionBtnText}>COMPLETE FITTING</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                <Text style={[styles.footerNote, { color: T.subText }]}>
                    A copy of this invoice has been sent to your email.
                </Text>
            </ScrollView>

            {/* Return Request Modal */}
            <Modal
                visible={isReturnModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsReturnModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: T.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>Initiate Return</Text>
                            <TouchableOpacity onPress={() => setIsReturnModalOpen(false)}>
                                <Ionicons name="close" size={24} color={T.text} />
                            </TouchableOpacity>
                        </View>

                        {order.items?.some(i => i.isReturnable === false) && (
                            <View style={{ backgroundColor: '#FF444411', padding: 12, marginHorizontal: 20, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="warning-outline" size={18} color="#FF4444" />
                                <Text style={{ color: '#FF4444', fontSize: 10, fontWeight: '800', marginLeft: 8, flex: 1 }}>
                                    Warning: Some items in this order are non-returnable and will be excluded.
                                </Text>
                            </View>
                        )}

                        <ScrollView style={{ maxHeight: 500 }}>
                            <Text style={[styles.inputLabel, { color: T.subText }]}>SELECT ITEMS TO RETURN</Text>
                            <View style={{ marginHorizontal: 20, marginBottom: 20, gap: 10 }}>
                                {returnItems.map((item, idx) => (
                                    <View key={item.orderItemId} style={[{ padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, item.quantity > 0 ? { borderColor: '#DF2324', backgroundColor: '#DF232405' } : { borderColor: T.cardBorder, backgroundColor: T.inputBg }]}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Text style={[{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 }, item.quantity > 0 ? { color: '#DF2324' } : { color: T.subText }]}>{item.partName}</Text>
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: T.subText }}>Purchased: {item.maxQuantity} • ₹{(item.price || 0).toLocaleString()}/ea</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, padding: 4, borderRadius: 8, borderWidth: 1, borderColor: T.cardBorder }}>
                                            <TouchableOpacity 
                                                style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: T.inputBg, justifyContent: 'center', alignItems: 'center' }}
                                                onPress={() => {
                                                    const newItems = [...returnItems];
                                                    if (newItems[idx].quantity > 0) newItems[idx].quantity -= 1;
                                                    setReturnItems(newItems);
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, fontWeight: '900', color: T.text }}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: '900', color: T.text }}>{item.quantity}</Text>
                                            <TouchableOpacity 
                                                style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: T.inputBg, justifyContent: 'center', alignItems: 'center' }}
                                                onPress={() => {
                                                    const newItems = [...returnItems];
                                                    if (newItems[idx].quantity < newItems[idx].maxQuantity) newItems[idx].quantity += 1;
                                                    setReturnItems(newItems);
                                                }}
                                            >
                                                <Text style={{ fontSize: 16, fontWeight: '900', color: T.text }}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                                {returnItems.length === 0 && (
                                    <View style={{ padding: 16, backgroundColor: T.inputBg, borderRadius: 12, alignItems: 'center' }}>
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: T.subText, textTransform: 'uppercase' }}>No returnable items</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={[styles.inputLabel, { color: T.subText }]}>SELECT REASON</Text>
                            <View style={styles.choiceGrid}>
                                {['WRONG_FITMENT', 'DAMAGED', 'OTHER'].map(reason => (
                                    <TouchableOpacity 
                                        key={reason}
                                        style={[styles.choiceBtn, { 
                                            borderColor: returnReason === reason ? '#DF2324' : T.cardBorder,
                                            backgroundColor: returnReason === reason ? '#DF232411' : 'transparent'
                                        }]}
                                        onPress={() => setReturnReason(reason)}
                                    >
                                        <Text style={[styles.choiceText, { color: returnReason === reason ? '#DF2324' : T.text }]}>
                                            {reason.replace('_', ' ')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: T.subText, marginTop: 20 }]}>SELECT RESOLUTION</Text>
                            <View style={styles.choiceGrid}>
                                {['REPLACEMENT', 'REFUND'].map(type => (
                                    <TouchableOpacity 
                                        key={type}
                                        style={[styles.choiceBtn, { 
                                            borderColor: returnType === type ? '#DF2324' : T.cardBorder,
                                            backgroundColor: returnType === type ? '#DF232411' : 'transparent'
                                        }]}
                                        onPress={() => setReturnType(type)}
                                    >
                                        <Text style={[styles.choiceText, { color: returnType === type ? '#DF2324' : T.text }]}>
                                            {type === 'REPLACEMENT' ? 'REPLACEMENT' : 'FULL REFUND'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { color: T.subText, marginTop: 20 }]}>DESCRIPTION</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder }]}
                                placeholder="Describe the issue..."
                                placeholderTextColor={T.placeholder}
                                value={returnDescription}
                                onChangeText={setReturnDescription}
                                multiline
                                numberOfLines={4}
                            />
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.submitBtn, { opacity: submittingReturn ? 0.7 : 1 }]}
                            onPress={handleSubmitReturn}
                            disabled={submittingReturn}
                        >
                            {submittingReturn ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>TRANSMIT REQUEST</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Reject Return Modal */}
            <Modal
                visible={isRejectModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsRejectModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: T.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>Reject Return</Text>
                            <TouchableOpacity onPress={() => setIsRejectModalOpen(false)}>
                                <Ionicons name="close" size={24} color={T.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: T.subText, marginHorizontal: 20 }]}>REJECTION REASON</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: T.bg, color: T.text, borderColor: T.cardBorder, marginHorizontal: 20, marginTop: 8 }]}
                            placeholder="State reason for rejecting the return..."
                            placeholderTextColor={T.placeholder}
                            value={rejectionNote}
                            onChangeText={setRejectionNote}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity 
                            style={[styles.submitBtn, { backgroundColor: '#F44336', marginTop: 24 }]}
                            onPress={() => {
                                if (rejectionNote.trim()) {
                                    setIsRejectModalOpen(false);
                                    handleReturnAction('reject', rejectionNote);
                                } else {
                                    Alert.alert('Required', 'Please specify a rejection reason.');
                                }
                            }}
                        >
                            <Text style={styles.submitBtnText}>CONFIRM REJECTION</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case 'DELIVERED': return '#4CAF50';
        case 'ARRIVED_AT_GARAGE': return '#00BCD4';
        case 'PROCESSING': return '#FF9800';
        case 'CANCELLED': return '#F44336';
        case 'SHIPPED': return '#2196F3';
        case 'RETURN_REQUESTED': return '#E91E63';
        case 'REFUND_IN_PROGRESS': return '#9C27B0';
        case 'REFUNDED': return '#673AB7';
        case 'REPLACEMENT_SHIPPING': return '#FF5722';
        default: return '#888';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    scrollContent: { padding: 16, paddingBottom: 60 },
    statusCard: {
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    brandText: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    receiptSub: { fontSize: 11, fontWeight: '700' },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    orderInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    infoLabel: { fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 14, fontWeight: '700' },
    sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    itemMain: { flex: 1, marginRight: 15 },
    itemName: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
    itemSpecs: { flexDirection: 'row', gap: 6 },
    specBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    specText: { fontSize: 10, fontWeight: '800' },
    itemQty: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    itemPrice: { fontSize: 15, fontWeight: '800' },
    summaryBox: {
        marginTop: 20,
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: { fontSize: 14, fontWeight: '600' },
    summaryValue: { fontSize: 14, fontWeight: '700' },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        marginBottom: 0,
    },
    totalLabel: { fontSize: 18, fontWeight: '800' },
    totalValue: { fontSize: 22, fontWeight: '900' },
    downloadBtn: {
        backgroundColor: '#DF2324',
        marginTop: 24,
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
    footerNote: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 40,
    },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Rating Styles
    ratingGroup: { marginBottom: 16 },
    ratingLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    starsRow: { flexDirection: 'row', alignItems: 'center' },
    commentBox: {
        marginTop: 10,
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        minHeight: 80,
        overflow: 'hidden',
    },
    commentInput: { fontSize: 13, fontWeight: '600', minHeight: 60, textAlignVertical: 'top' },
    submitRatingBtn: {
        backgroundColor: '#DF2324',
        marginTop: 16,
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitRatingText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
    submittedFeedback: {
        marginTop: 10,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    feedbackComment: { fontSize: 14, fontStyle: 'italic', fontWeight: '600', marginBottom: 8, lineHeight: 20 },
    feedbackDate: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
    deliveryTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    deliveryTypeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    fittingStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    fittingStatusLabel: {
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 4,
    },
    fittingStatusValue: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    actionCenter: {
        marginTop: 10,
        marginBottom: 20,
    },
    actionBtn: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    returnBtn: {
        marginTop: 20,
        height: 54,
        borderRadius: 12,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    returnBtnText: { fontSize: 13, fontWeight: '900', color: '#DF2324' },
    returnInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900' },
    inputLabel: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
    choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    choiceBtn: { flex: 1, minWidth: '30%', paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
    choiceText: { fontSize: 11, fontWeight: '800' },
    modalInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginTop: 8 },
    submitBtn: { backgroundColor: '#DF2324', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
