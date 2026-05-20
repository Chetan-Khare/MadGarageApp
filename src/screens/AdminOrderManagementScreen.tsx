import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';

import { RouteProp } from '@react-navigation/native';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminOrderManagement'>;
    route: RouteProp<RootStackParamList, 'AdminOrderManagement'>;
};

export default function AdminOrderManagementScreen({ navigation, route }: Props) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [editOrder, setEditOrder] = useState<any>(null);
    const [editStatus, setEditStatus] = useState('PAID');

    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await apiClient.get('/admin/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert("Archive Order", "Purge this order from the active fulfillment pipeline? It will remain in historical archives.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Archive",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await apiClient.delete(`/admin/orders/${id}`);
                        fetchOrders();
                    } catch (error: any) {
                        Alert.alert("Error", error.response?.data || "Could not delete order.");
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!editOrder) return;
        setLoading(true);
        try {
            await apiClient.put(`/admin/orders/${editOrder.id}/status`, { status });
            setEditOrder(null);
            fetchOrders();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data || "Could not update status.");
            setLoading(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'ALL' | 'RETURNS'>(route.params?.initialTab || 'ALL');

    useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params?.initialTab]);

    const handleReturnAction = async (orderId: number, returnId: number, action: 'approve' | 'reject' | 'picked-up' | 'finalize') => {
        let note = "Request does not meet return policy criteria.";
        if (action === 'reject') {
            // ... existing reject logic ...
            Alert.alert("Reject Return", "Are you sure you want to reject this return?", [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Reject", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiClient.put(`/returns/admin/${returnId}/reject?note=${note}`);
                            Alert.alert("Success", "Return request rejected.");
                            fetchOrders();
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data || "Action failed.");
                            setLoading(false);
                        }
                    }
                }
            ]);
            return;
        }

        const actionText = action === 'approve' ? 'Approve Return' : (action === 'picked-up' ? 'Mark Picked Up' : 'Finalize Refund');
        const actionLabel = action === 'approve' ? 'Authorize this return protocol?' : (action === 'picked-up' ? 'Confirm item has been collected?' : 'Confirm refund has been processed?');
        const endpoint = action === 'picked-up' ? 'picked-up' : (action === 'finalize' ? 'finalize' : 'approve');

        Alert.alert(actionText, actionLabel, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Confirm",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await apiClient.put(`/returns/admin/${returnId}/${endpoint}`);
                        Alert.alert("Success", `${actionText} completed.`);
                        fetchOrders();
                    } catch (error: any) {
                        Alert.alert("Error", error.response?.data || "Action failed.");
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.orderCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={[styles.orderId, { color: '#DF2324' }]}>#{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'RETURN_REQUESTED' ? '#E91E6322' : (item.active === false ? '#7A7A8533' : '#DF232422') }]}>
                        <Text style={[styles.statusText, { color: item.status === 'RETURN_REQUESTED' ? '#E91E63' : (item.active === false ? '#7A7A85' : '#DF2324') }]}>
                            {item.status === 'RETURN_REQUESTED' ? 'RETURN RECALL' : (item.active === false ? 'ARCHIVED' : (item.status || 'PAID'))}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.orderDate, { color: T.subText }]}>
                    {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : ''}
                </Text>
            </View>
            <View style={styles.orderFooter}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.customerName, { color: T.text }]}>
                        {item.customerName || (item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Guest User')}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text style={[styles.totalAmount, { color: '#DF2324' }]}>₹{item.grandTotal ? item.grandTotal.toLocaleString() : '0.00'}</Text>
                        {item.appliedCouponCode && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF5011', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Ionicons name="pricetag" size={10} color="#4CAF50" />
                                <Text style={{ fontSize: 9, fontWeight: '800', color: '#4CAF50', marginLeft: 4 }}>{item.appliedCouponCode}</Text>
                            </View>
                        )}
                    </View>
                </View>
                {activeTab !== 'RETURNS' && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder, borderWidth: 1 }]}
                        onPress={() => {
                            setEditOrder(item);
                            setEditStatus(item.status || 'PAID');
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={isDark ? '#FFF' : '#333'} />
                    </TouchableOpacity>
                )}
            </View>

            {activeTab === 'RETURNS' && (item.returnReason || item.returnDescription) && (
                <View style={styles.returnInfoBox}>
                    <Text style={styles.returnInfoLabel}>RETURN REASON: {item.returnReason?.replace(/_/g, ' ')}</Text>
                    {item.returnDescription && (
                        <Text style={styles.returnInfoText} numberOfLines={2}>{item.returnDescription}</Text>
                    )}
                </View>
            )}

            {activeTab === 'RETURNS' && item.activeReturnId && (
                <View style={styles.returnActionsRow}>
                    {item.returnStatus === 'PENDING' && (
                        <>
                            <TouchableOpacity 
                                style={[styles.controlBtn, { backgroundColor: '#4CAF50', flex: 1 }]}
                                onPress={() => handleReturnAction(item.id, item.activeReturnId, 'approve')}
                            >
                                <Ionicons name="checkmark-sharp" size={16} color="#FFF" />
                                <Text style={styles.controlBtnText}>APPROVE</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.controlBtn, { backgroundColor: '#FF5252', flex: 1 }]}
                                onPress={() => handleReturnAction(item.id, item.activeReturnId, 'reject')}
                            >
                                <Ionicons name="close-sharp" size={16} color="#FFF" />
                                <Text style={styles.controlBtnText}>REJECT</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {item.returnStatus === 'APPROVED' && (
                        <TouchableOpacity 
                            style={[styles.controlBtn, { backgroundColor: '#2196F3', flex: 1 }]}
                            onPress={() => handleReturnAction(item.id, item.activeReturnId, 'picked-up')}
                        >
                            <Ionicons name="cube-outline" size={16} color="#FFF" />
                            <Text style={styles.controlBtnText}>MARK PICKED UP</Text>
                        </TouchableOpacity>
                    )}
                    {item.returnStatus === 'PICKED_UP' && item.returnRequestType === 'REFUND' && (
                        <TouchableOpacity 
                            style={[styles.controlBtn, { backgroundColor: '#9C27B0', flex: 1 }]}
                            onPress={() => handleReturnAction(item.id, item.activeReturnId, 'finalize')}
                        >
                            <Ionicons name="cash-outline" size={16} color="#FFF" />
                            <Text style={styles.controlBtnText}>FINALIZE REFUND</Text>
                        </TouchableOpacity>
                    )}
                    {/* View Details button is always useful */}
                    <TouchableOpacity 
                        style={[styles.controlBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder, borderWidth: 1 }]}
                        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                    >
                        <Ionicons name="eye-outline" size={16} color={isDark ? '#FFF' : '#333'} />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: T.bg2, paddingTop: Math.max(insets.top, 8) }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#DF2324" />
                </TouchableOpacity>
                <Text style={[styles.title, { color: T.text }]}>Order Control</Text>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === 'ALL' && styles.activeTabBtn]} 
                    onPress={() => setActiveTab('ALL')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'ALL' ? '#FFF' : T.subText }]}>ALL ORDERS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === 'RETURNS' && styles.activeTabBtn]} 
                    onPress={() => setActiveTab('RETURNS')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'RETURNS' ? '#FFF' : T.subText }]}>RETURNS</Text>
                    {orders.filter((o: any) => o.activeReturnId !== null && o.returnStatus !== 'REFUNDED' && o.returnStatus !== 'REJECTED' && o.status !== 'REFUNDED').length > 0 && (
                        <View style={styles.notifBadge}>
                            <Text style={styles.notifText}>{orders.filter((o: any) => o.activeReturnId !== null && o.returnStatus !== 'REFUNDED' && o.returnStatus !== 'REJECTED' && o.status !== 'REFUNDED').length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                <Ionicons name="search-outline" size={18} color={T.subText} />
                <TextInput
                    style={[styles.searchInput, { color: T.text }]}
                    placeholder="Search by order #, customer, status..."
                    placeholderTextColor={T.subText}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTerm('')}>
                        <Ionicons name="close-circle" size={18} color={T.subText} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={orders.filter((o: any) => {
                        // First apply tab filter
                        if (activeTab === 'RETURNS' && o.activeReturnId === null) return false;
                        if (activeTab === 'RETURNS' && (o.returnStatus === 'REFUNDED' || o.returnStatus === 'REJECTED')) return false;
                        
                        if (!searchTerm.trim()) return true;
                        const q = searchTerm.toLowerCase();
                        const name = o.customerName || (o.user ? `${o.user.firstName} ${o.user.lastName}` : '');
                        return (
                            String(o.id).includes(q) ||
                            name.toLowerCase().includes(q) ||
                            (o.status || '').toLowerCase().includes(q) ||
                            (o.grandTotal ? o.grandTotal.toFixed(2) : '').includes(q)
                        );
                    })}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color={T.subText} />
                            <Text style={[styles.emptyText, { color: T.subText }]}>No orders found in network</Text>
                        </View>
                    }
                />
            )}

            {/* Quick Edit Modal */}
            <Modal visible={!!editOrder} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>Update Order Status</Text>
                            <TouchableOpacity onPress={() => setEditOrder(null)}>
                                <Ionicons name="close" size={24} color={T.subText} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: T.subText }]}>Set New Status</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND_IN_PROGRESS', 'REPLACEMENT_SHIPPING', 'REFUNDED', 'RETURNED'].map(s => (
                                <TouchableOpacity 
                                    key={s} 
                                    style={[
                                        styles.statusOptionBtn, 
                                        { backgroundColor: editStatus === s ? '#DF2324' : T.inputBg }
                                    ]}
                                    onPress={() => setEditStatus(s)}
                                >
                                    <Text style={[styles.statusOptionText, { color: editStatus === s ? '#FFF' : T.subText }]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={() => handleUpdateStatus(editStatus)}>
                            <Text style={styles.saveBtnText}>SAVE STATUS</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 15,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    tabBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#7A7A8511',
        flexDirection: 'row',
        gap: 8,
    },
    activeTabBtn: {
        backgroundColor: '#DF2324',
    },
    tabText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    notifBadge: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 18,
        alignItems: 'center',
    },
    notifText: {
        color: '#DF2324',
        fontSize: 9,
        fontWeight: '900',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        padding: 0,
    },
    list: { padding: 16 },
    orderCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderId: { fontWeight: '900', fontSize: 15 },
    orderDate: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    customerName: { fontSize: 16, fontWeight: '700' },
    totalAmount: { color: '#DF2324', fontSize: 18, fontWeight: '900' },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: { color: '#DF2324', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    controlBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    returnInfoBox: {
        backgroundColor: 'rgba(233, 30, 99, 0.05)',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#E91E63',
    },
    returnInfoLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#E91E63',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    returnInfoText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#B0B0C0',
        fontStyle: 'italic',
    },
    returnActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '800' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    inputLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
    statusOptionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    statusOptionText: {
        fontWeight: '800',
        fontSize: 12,
    },
    saveBtn: {
        backgroundColor: '#DF2324',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 24,
    },
    saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});

