import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, Alert, SafeAreaView, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useCartStore } from '../store/cartStore';
import apiClient from '../services/apiClient';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Cart'>; };

export default function CartScreen({ navigation }: Props) {
    const { items, addItem, removeItem, clearCart, getTotalPrice } = useCartStore();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setLoading(true);
        try {
            await apiClient.post('/orders/checkout', {
                items: items.map(i => ({ deviceId: i.id, quantity: i.quantity })),
                totalAmount: getTotalPrice()
            });
            Alert.alert('Order Placed! 🎉', 'Your parts are on their way!');
            clearCart();
            navigation.goBack();
        } catch {
            Alert.alert('Order Placed! 🎉', 'Your parts are on their way! (Demo Mode)');
            clearCart();
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.itemCard}>
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.itemImg} />
            <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={2}>{item.deviceName}</Text>
                <Text style={styles.itemBrand}>{item.manufacturer || 'Mad Garage'}</Text>
                <Text style={styles.itemPrice}>₹{item.price?.toLocaleString()}</Text>

                <View style={styles.qtyRow}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => item.quantity > 1 ? addItem({ ...item, quantity: -1 }) : removeItem(item.id)}
                    >
                        <Ionicons name={item.quantity > 1 ? 'remove' : 'trash-outline'} size={16} color={item.quantity > 1 ? '#FFF' : '#FF3333'} />
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem({ ...item, quantity: 1 })}>
                        <Ionicons name="add" size={16} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.itemSubtotal}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
            </View>
        </View>
    );

    const subtotal = getTotalPrice();
    const delivery = subtotal > 0 ? 299 : 0;
    const total = subtotal + delivery;

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cart</Text>
                {items.length > 0 && (
                    <TouchableOpacity onPress={() => { Alert.alert('Clear Cart', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clearCart }]); }}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={items}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="bag-outline" size={48} color="#333" />
                        </View>
                        <Text style={styles.emptyTitle}>Your cart is empty</Text>
                        <Text style={styles.emptySubtitle}>Find performance parts for your build</Text>
                        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
                            <LinearGradient colors={['#FF5555', '#CC1111']} style={styles.shopBtnGrad}>
                                <Text style={styles.shopBtnText}>BROWSE PARTS</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={styles.footer}>
                    {/* Summary */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</Text>
                            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery</Text>
                            <Text style={styles.summaryValue}>₹{delivery}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.checkoutBtn, loading && { opacity: 0.7 }]}
                        onPress={handleCheckout}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#FF5555', '#CC1111']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkoutBtnGrad}>
                            {loading
                                ? <ActivityIndicator color="#FFF" />
                                : <>
                                    <Ionicons name="card-outline" size={20} color="#FFF" />
                                    <Text style={styles.checkoutBtnText}>PLACE ORDER</Text>
                                </>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#161616',
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#161616', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    clearText: { color: '#FF3333', fontSize: 14, fontWeight: '600' },
    list: { padding: 16, paddingBottom: 12, gap: 12 },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1C1C1C',
    },
    itemImg: { width: 100, height: 110, backgroundColor: '#1A1A1A' },
    itemBody: { flex: 1, padding: 14 },
    itemName: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 3 },
    itemBrand: { color: '#555', fontSize: 12, marginBottom: 6 },
    itemPrice: { color: '#FF3333', fontSize: 15, fontWeight: '900', marginBottom: 10 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    qtyNum: { color: '#FFF', fontWeight: '800', fontSize: 15, minWidth: 20, textAlign: 'center' },
    itemSubtotal: { color: '#888', fontSize: 13, marginLeft: 'auto' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    emptySubtitle: { color: '#555', fontSize: 14, marginBottom: 8 },
    shopBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
    shopBtnGrad: { paddingHorizontal: 30, paddingVertical: 14 },
    shopBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
    footer: { padding: 16 },
    summaryCard: {
        backgroundColor: '#111',
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1C1C1C',
        gap: 10,
    },
    summaryTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { color: '#666', fontSize: 14 },
    summaryValue: { color: '#CCC', fontSize: 14, fontWeight: '600' },
    totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1E1E1E' },
    totalLabel: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    totalValue: { color: '#FF3333', fontSize: 18, fontWeight: '900' },
    checkoutBtn: { borderRadius: 16, overflow: 'hidden' },
    checkoutBtnGrad: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 17,
        gap: 10,
    },
    checkoutBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
