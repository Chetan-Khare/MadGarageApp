import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView, StatusBar, ScrollView,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useCartStore } from '../store/cartStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { PRICING } from '../constants/pricing';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Checkout'>; };

export default function CheckoutScreen({ navigation }: Props) {
    const { items, clearCart, getTotalPrice } = useCartStore();
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    const subtotal = getTotalPrice();
    const taxAmount = 0;
    const delivery = subtotal > 0 ? PRICING.SHIPPING_FEE : 0;
    const total = subtotal + delivery;

    const handlePayment = async () => {
        if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            Alert.alert('Missing Details', 'Please fill in your complete shipping address.');
            return;
        }

        if (items.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty.');
            return;
        }

        setLoading(true);

        // FE-02 FIX: Removed the fake 2-second setTimeout wrapper.
        // The setTimeout caused: (a) a memory leak if user navigated away, and
        // (b) setState firing on an unmounted component. API call is now direct.
        try {
            await apiClient.post('/orders/checkout', {
                items: items.map(i => ({ productId: parseInt(i.id, 10), quantity: i.quantity })),
                shippingAddress: address,
                city: city,
                state: state,
                pincode: pincode
            });
            
            clearCart();
            
            Alert.alert('Payment Successful! 🎉', 'Order Placed.', [
                {
                    text: 'View Receipt',
                    onPress: () => {
                        navigation.popToTop(); 
                        navigation.navigate('OrderHistory');
                    }
                }
            ]);
        } catch (error: any) {
            console.error('Checkout failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
            Alert.alert('Checkout Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
            
            <View style={[styles.header, { borderBottomColor: T.headerBorder }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: T.inputBg }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>Checkout</Text>
                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* Order Summary */}
                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="receipt-outline" size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>Order Summary</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: T.subText }]}>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</Text>
                            <Text style={[styles.summaryValue, { color: T.text }]}>₹{subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: T.subText }]}>Delivery</Text>
                            <Text style={[styles.summaryValue, { color: T.text }]}>₹{delivery}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: T.cardBorder }]}>
                            <Text style={[styles.totalLabel, { color: T.text }]}>Grand Total</Text>
                            <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Shipping Address Form */}
                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="location-outline" size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>Shipping Address</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Full Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="123 Performance Street, Apt #4"
                                placeholderTextColor={T.subText}
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>City</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="Mumbai"
                                placeholderTextColor={T.subText}
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>State</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="Maharashtra"
                                    placeholderTextColor={T.subText}
                                    value={state}
                                    onChangeText={setState}
                                />
                            </View>
                            
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Pincode</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="400001"
                                    placeholderTextColor={T.subText}
                                    keyboardType="numeric"
                                    value={pincode}
                                    onChangeText={setPincode}
                                />
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Pay Button */}
            <View style={[styles.footer, { backgroundColor: T.bg, borderTopColor: T.headerBorder }]}>
                <TouchableOpacity
                    style={[styles.payBtn, loading && { opacity: 0.7 }]}
                    onPress={handlePayment}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <View style={styles.payBtnContent}>
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                                <Text style={styles.payBtnText}>Processing...</Text>
                            </View>
                        ) : (
                            <>
                                <Ionicons name="lock-closed-outline" size={20} color="#FFF" />
                                <Text style={styles.payBtnText}>Pay ₹{total.toLocaleString()}</Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    
    card: {
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    
    // Summary Styles
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 14, fontWeight: '500' },
    summaryValue: { fontSize: 14, fontWeight: '600' },
    totalRow: { paddingTop: 12, marginTop: 4, borderTopWidth: 1 },
    totalLabel: { fontSize: 16, fontWeight: '800' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#DF2324' },

    // Form Styles
    inputGroup: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 15,
        fontSize: 15,
        fontWeight: '600',
    },

    // Footer
    footer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    payBtn: {
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#DF2324',
    },
    payBtnContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    payBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
