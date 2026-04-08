import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminOrderManagement'>;
};

export default function AdminOrderManagementScreen({ navigation }: Props) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
        Alert.alert("Delete Order", "Permanently remove this entire order and restore stock?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
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

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.orderCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={[styles.orderId, { color: '#DF2324' }]}>#{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#DF232422' }]}>
                        <Text style={styles.statusText}>{item.status || 'PAID'}</Text>
                    </View>
                </View>
                <Text style={[styles.orderDate, { color: T.subText }]}>
                    {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : ''}
                </Text>
            </View>
            <View style={styles.orderFooter}>
                <View>
                    <Text style={[styles.customerName, { color: T.text }]}>
                        {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Guest User'}
                    </Text>
                    <Text style={styles.totalAmount}>₹{item.grandTotal ? item.grandTotal.toFixed(2) : '0.00'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder, borderWidth: 1 }]}
                        onPress={() => {
                            setEditOrder(item);
                            setEditStatus(item.status || 'PAID');
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={isDark ? '#FFF' : '#333'} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder, borderWidth: 1 }]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#DF2324" />
                    </TouchableOpacity>
                </View>
            </View>
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

            {loading ? (
                <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={orders}
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
                            {['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
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

