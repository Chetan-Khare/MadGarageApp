import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'OrderHistory'>;
};

interface OrderItem {
    id: number;
    grandTotal: number;
    status: string;
    orderDate: string;
}

export default function OrderHistoryScreen({ navigation }: Props) {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { isDark } = useThemeStore();
    const { isGuest } = useAuthStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        if (isGuest) {
            setLoading(false);
            return;
        }
        try {
            const response = await apiClient.get('/orders/my-orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOrderItem = ({ item }: { item: OrderItem }) => {
        const date = new Date(item.orderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        return (
            <TouchableOpacity 
                style={[styles.orderCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}
                onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            >
                <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: T.text }]}>Order #{item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                    </View>
                </View>
                
                <View style={styles.orderFooter}>
                    <View>
                        <Text style={[styles.label, { color: T.subText }]}>Date</Text>
                        <Text style={[styles.value, { color: T.text }]}>{date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.label, { color: T.subText }]}>Total Amount</Text>
                        <Text style={[styles.price, { color: '#DF2324' }]}>₹{(item.grandTotal ?? 0).toLocaleString()}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'DELIVERED': return '#4CAF50';
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

    if (loading) {
        return (
            <View style={[styles.centerBox, { backgroundColor: T.bg }]}>
                <ActivityIndicator size="large" color="#DF2324" />
                <Text style={[styles.loadingText, { color: T.subText }]}>Fetching your orders...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: T.bg }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>Order History</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons name="receipt-outline" size={64} color={T.statBorder} />
                        <Text style={[styles.emptyText, { color: T.text }]}>No orders found</Text>
                        <Text style={[styles.emptySubText, { color: T.subText }]}>You haven't placed any orders yet.</Text>
                        <TouchableOpacity 
                            style={styles.shopBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.shopBtnText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 14,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    listContent: { padding: 16, gap: 12 },
    orderCard: {
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    orderId: { fontSize: 15, fontWeight: '800' },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 13, fontWeight: '700' },
    price: { fontSize: 16, fontWeight: '900', color: '#DF2324' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14, fontWeight: '600' },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
    emptyText: { fontSize: 20, fontWeight: '800', marginTop: 20 },
    emptySubText: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    shopBtn: {
        backgroundColor: '#DF2324',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    shopBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
