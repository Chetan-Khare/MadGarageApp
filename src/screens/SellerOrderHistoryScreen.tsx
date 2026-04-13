import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SellerOrderHistory'>;
};

export default function SellerOrderHistoryScreen({ navigation }: Props) {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await apiClient.get('/orders/seller-orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch seller orders:', error);
            Alert.alert('Error', 'Could not load your order history.');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: number, newStatus: string) => {
        try {
            await apiClient.put(`/orders/${orderId}/status?status=${newStatus}`);
            fetchOrders();
            Alert.alert('Status Updated', `Order marked as ${newStatus}.`);
        } catch (error: any) {
            console.error('Failed to update status', error);
            Alert.alert('Error', error.response?.data?.message || 'Could not update order status.');
        }
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.orderCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={[styles.orderId, { color: T.text }]}>ORDER #{item.id}</Text>
                    <Text style={[styles.orderDate, { color: T.subText }]}>{new Date().toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#DF232422' }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {item.items && item.items.map((subItem: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                    <Ionicons name="cube-outline" size={16} color={T.subText} />
                    <Text style={[styles.itemText, { color: T.text }]} numberOfLines={1}>
                        {subItem.quantity}x {subItem.productName}
                    </Text>
                    <Text style={[styles.itemPrice, { color: T.text }]}>₹{(subItem.priceAtPurchase ?? 0).toLocaleString()}</Text>
                </View>
            ))}

            <View style={styles.footer}>
                <View>
                    <Text style={[styles.totalLabel, { color: T.subText }]}>Payout Amount</Text>
                    <Text style={[styles.totalAmount, { color: '#4CAF50' }]}>₹{(item.grandTotal ?? 0).toLocaleString()}</Text>
                </View>
                <View style={styles.actionRow}>
                    {item.status !== 'SHIPPED' && item.status !== 'DELIVERED' && item.status !== 'CANCELLED' && (
                        <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#2196F3' }]} onPress={() => updateOrderStatus(item.id, 'SHIPPED')}>
                            <Text style={styles.statusBtnText}>Mark Shipped</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'SHIPPED' && (
                        <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#4CAF50' }]} onPress={() => updateOrderStatus(item.id, 'DELIVERED')}>
                            <Text style={styles.statusBtnText}>Mark Delivered</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#DF2324" />
                </TouchableOpacity>
                <Text style={[styles.title, { color: T.text }]}>Sales Revenue</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color={T.subText} />
                            <Text style={[styles.emptyText, { color: T.subText }]}>No sales history found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    list: { padding: 20, paddingBottom: 100 },
    orderCard: { padding: 16, borderRadius: 16, marginBottom: 16, elevation: 3 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderId: { fontSize: 16, fontWeight: '900' },
    orderDate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '900', color: '#DF2324', textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    itemText: { flex: 1, fontSize: 13, fontWeight: '600' },
    itemPrice: { fontSize: 13, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    totalLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    totalAmount: { fontSize: 18, fontWeight: '900' },
    actionRow: { flexDirection: 'row', gap: 8 },
    statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    statusBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '800' },
});
