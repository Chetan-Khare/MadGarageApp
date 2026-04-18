import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useCartStore } from '../store/cartStore';
import { BASE_SERVER_URL } from '../services/apiClient';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { PRICING } from '../constants/pricing';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Cart'>; };

export default function CartScreen({ navigation }: Props) {
    const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);

    const handleCheckout = () => {
        if (items.length === 0) return;
        navigation.navigate('Checkout');
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.itemCard, { backgroundColor: T.card, borderColor: isDark ? '#DF232422' : '#00000011' }]}>
            <View style={styles.itemCardInner}>
                <Image
                    source={{ uri: (item.imageUrl?.startsWith('/') ? `${BASE_SERVER_URL}${item.imageUrl}` : (item.imageUrl || 'https://via.placeholder.com/100')) }}
                    style={[styles.itemImg, { backgroundColor: isDark ? '#111' : '#F5F5F5' }]}
                />
                <View style={styles.itemBody}>
                    <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: T.text }]} numberOfLines={2}>{item.deviceName}</Text>
                        <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="trash-outline" size={18} color="#FF4444" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.itemBrand, { color: T.subText }]}>{item.manufacturer || 'MAD GARAGE. AI'}</Text>

                    <View style={styles.priceAndQtyRow}>
                        <Text style={[styles.itemPrice, { color: '#DF2324' }]}>₹{item.price?.toLocaleString()}</Text>
                        <View style={[styles.qtyControl, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                            <TouchableOpacity
                                style={styles.qtyAction}
                                onPress={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)}
                            >
                                <Ionicons name={item.quantity > 1 ? 'remove' : 'trash-outline'} size={14} color={T.text} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyVal, { color: T.text }]}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.qtyAction}
                                onPress={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= item.stockQuantity}
                            >
                                <Ionicons name="add" size={14} color={item.quantity >= item.stockQuantity ? T.placeholder : T.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.itemFooter}>
                        <View style={[styles.stockTag, { backgroundColor: item.stockQuantity > 5 ? '#00FF0015' : '#FFAA0015' }]}>
                            <Text style={[styles.stockTagText, { color: item.stockQuantity > 5 ? '#00FF00' : '#FFAA00' }]}>
                                {item.stockQuantity} in stock
                            </Text>
                        </View>
                        <Text style={[styles.itemSubtotal, { color: T.text }]}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const subtotal = getTotalPrice();
    const delivery = subtotal > 0 ? PRICING.SHIPPING_FEE : 0;
    const total = subtotal + delivery;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
            {/* Premium Header Accent Line */}
            <View style={{ height: 2, backgroundColor: '#DF2324' }} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomWidth: 1, borderBottomColor: T.headerBorder, paddingTop: Platform.OS === 'android' ? (insets.top + 8) : 8 }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0' }]}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="chevron-back" size={22} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>My Cart</Text>
                {items.length > 0 ? (
                    <TouchableOpacity
                        onPress={() => { Alert.alert('Clear Cart', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clearCart }]); }}
                        style={styles.clearBtn}
                    >
                        <Text style={styles.clearText}>CLEAR</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 44 }} />}
            </View>


            <FlatList
                data={items}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={[styles.list, { paddingBottom: 220 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
                            <Ionicons name="bag-handle-outline" size={56} color="#DF2324" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: T.text }]}>Your build is empty</Text>
                        <Text style={[styles.emptySubtitle, { color: T.subText }]}>Start adding parts to your garage inventory.</Text>
                        <TouchableOpacity style={[styles.shopBtn, { backgroundColor: '#DF2324' }]} onPress={() => navigation.goBack()}>
                            <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {items.length > 0 && (
                <View style={[styles.footer, { backgroundColor: T.headerBg, borderTopColor: T.headerBorder, paddingBottom: insets.bottom + 16 }]}>
                    {/* Glassmorphism Summary */}
                    <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(30,30,30,0.6)' : '#FFF', borderColor: T.cardBorder }]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: T.subText }]}>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</Text>
                            <Text style={[styles.summaryValue, { color: T.text }]}>₹{subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: T.subText }]}>Packaging & Shipping</Text>
                            <Text style={[styles.summaryValue, { color: T.text }]}>₹{delivery.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: T.headerBorder }]} />
                        <View style={styles.summaryRow}>
                            <Text style={[styles.totalLabel, { color: T.text }]}>Grand Total</Text>
                            <Text style={[styles.totalValue, { color: '#DF2324' }]}>₹{total.toLocaleString()}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.checkoutBtn, loading && { opacity: 0.7 }]}
                        onPress={handleCheckout}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#FFF" />
                            : <>
                                <Text style={styles.checkoutBtnText}>CHECKOUT NOW</Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                            </>
                        }
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    clearBtn: { paddingHorizontal: 4 },
    clearText: { color: '#FF4444', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

    list: { padding: 16, gap: 16 },
    itemCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    itemCardInner: { flexDirection: 'row' },
    itemImg: { width: 110, height: 130 },
    itemBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 14, fontWeight: '800', lineHeight: 18, width: '85%' },
    itemBrand: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
    priceAndQtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    itemPrice: { fontSize: 16, fontWeight: '900' },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        overflow: 'hidden',
    },
    qtyAction: { padding: 8 },
    qtyVal: { paddingHorizontal: 4, fontSize: 13, fontWeight: '900', minWidth: 24, textAlign: 'center' },
    itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    stockTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    stockTagText: { fontSize: 10, fontWeight: '800' },
    itemSubtotal: { fontSize: 14, fontWeight: '900' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
    emptyIcon: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
    shopBtn: { marginTop: 30, backgroundColor: '#DF2324', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    shopBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        gap: 10,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 13, fontWeight: '600' },
    summaryValue: { fontSize: 13, fontWeight: '800' },
    divider: { height: 1, width: '100%', marginVertical: 4 },
    totalLabel: { fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
    totalValue: { fontSize: 22, fontWeight: '900' },
    checkoutBtn: {
        backgroundColor: '#DF2324',
        borderRadius: 14,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    checkoutBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});

