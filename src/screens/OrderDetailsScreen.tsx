import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar, Alert, Platform, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// Fallback for newer Expo SDKs where constants might be moved or namespaced differently in types
const { documentDirectory, downloadAsync } = FileSystem as any;
import { RootStackParamList } from '../../App';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';

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
    // Rating fields
    partRating?: number;
    deliveryRating?: number;
    ratingComment?: string;
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

    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

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

    const { subtotal, taxAmount, shippingFee, grandTotal } = order;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>Digital Receipt</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                    <View style={styles.receiptHeader}>
                        <View>
                            <Text style={[styles.brandText, { color: '#DF2324' }]}>MAD GARAGE</Text>
                            <Text style={[styles.receiptSub, { color: T.subText }]}>Performance Parts Shop</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '22' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
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
                    <Text style={[styles.infoLabel, { color: T.subText, marginBottom: 10 }]}>CUSTOMER & SHIPPING</Text>
                    <Text style={[styles.infoValue, { color: T.text, fontSize: 16 }]}>{order.customerName}</Text>
                    <Text style={[styles.receiptSub, { color: T.subText, marginTop: 4, lineHeight: 18 }]}>
                        {order.shippingAddress}{'\n'}
                        {order.city}, {order.state} - {order.pincode}
                    </Text>
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
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={[styles.totalLabel, { color: T.text }]}>Grand Total</Text>
                        <Text style={[styles.totalValue, { color: '#DF2324' }]}>₹{(grandTotal ?? 0).toLocaleString()}</Text>
                    </View>
                </View>

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
                                    style={[styles.submitRatingBtn, { opacity: (tempPartRating && tempDeliveryRating) ? 1 : 0.5 }]}
                                    disabled={!tempPartRating || !tempDeliveryRating || submittingRating}
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

                <Text style={[styles.footerNote, { color: T.subText }]}>
                    A copy of this invoice has been sent to your email.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case 'DELIVERED': return '#4CAF50';
        case 'PROCESSING': return '#FF9800';
        case 'CANCELLED': return '#F44336';
        case 'SHIPPED': return '#2196F3';
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
    scrollContent: { padding: 16 },
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
    },
    commentInput: { fontSize: 13, fontWeight: '600', height: '100%', textAlignVertical: 'top' },
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
});
