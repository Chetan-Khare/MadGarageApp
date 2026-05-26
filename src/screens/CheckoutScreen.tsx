import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar, ScrollView,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useCartStore } from '../store/cartStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useConfigStore } from '../store/configStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';
import CouponBottomSheet from '../components/CouponBottomSheet';
import { PRICING } from '../constants/pricing';

import { useLocationStore } from '../store/locationStore';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Checkout'>; };

export default function CheckoutScreen({ navigation }: Props) {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const {
        shippingFee,
        platformFee,
        freeShippingThreshold,
        fragileSurcharge,
        freightBaseFee,
        freightPerKgRate,
        zoneMultipliers,
        zoneMultiplierNE
    } = useConfigStore();
    const { isDark } = useThemeStore();
    const { city: detectedCity, address: detectedAddr, nearbyGarages, detectLocation, isLoading: detectionLoading } = useLocationStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    const [loading, setLoading] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

    useEffect(() => {
        fetchSavedAddresses();
    }, []);

    const fetchSavedAddresses = async () => {
        try {
            const response = await apiClient.get('/addresses');
            setSavedAddresses(response.data);
        } catch (error) {
            console.error('Failed to fetch addresses for checkout:', error);
        }
    };

    // Form State
    const [flatNo, setFlatNo] = useState('');
    const [floorNo, setFloorNo] = useState('');
    const [buildingName, setBuildingName] = useState('');
    const [streetAddress, setStreetAddress] = useState(detectedAddr || '');
    const [landmark, setLandmark] = useState('');
    const [city, setCity] = useState(detectedCity || '');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [deliveryType, setDeliveryType] = useState<'HOME_DELIVERY' | 'GARAGE_FITTING'>('HOME_DELIVERY');
    const [selectedGarageId, setSelectedGarageId] = useState<number | null>(null);

    // Coupon State
    const [isCouponSheetVisible, setIsCouponSheetVisible] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    const STATE_ZONES: Record<string, number> = {
        'delhi': 1, 'haryana': 1, 'punjab': 1, 'rajasthan': 1,
        'uttar pradesh': 1, 'uttarakhand': 1, 'himachal pradesh': 1,
        'jammu and kashmir': 1, 'jammu & kashmir': 1, 'ladakh': 1,
        'maharashtra': 2, 'gujarat': 2, 'goa': 2,
        'dadra and nagar haveli': 2, 'daman and diu': 2,
        'karnataka': 3, 'tamil nadu': 3, 'kerala': 3, 'andhra pradesh': 3, 'telangana': 3, 'puducherry': 3, 'lakshadweep': 3,
        'west bengal': 4, 'bihar': 4, 'jharkhand': 4, 'odisha': 4, 'andaman and nicobar islands': 4, 'andaman & nicobar': 4,
        'madhya pradesh': 5, 'chhattisgarh': 5,
        'assam': 6, 'meghalaya': 6, 'manipur': 6, 'nagaland': 6, 'mizoram': 6, 'tripura': 6, 'arunachal pradesh': 6, 'sikkim': 6
    };

    const getFreightMultiplierLocal = (sellerState: string | null, buyerState: string): number => {
        const sellerZone = sellerState ? (STATE_ZONES[sellerState.trim().toLowerCase()] ?? 1) : 1;
        const buyerZone = STATE_ZONES[buyerState.trim().toLowerCase()] ?? 1;
        if (buyerZone === 6) return zoneMultiplierNE;
        const dist = Math.min(Math.abs(sellerZone - buyerZone), 4);
        return zoneMultipliers[dist];
    };

    const calculateDynamicShippingLocal = () => {
        let totalShipping = 0;
        let hasFragileOrFreight = false;

        const baseStandardFee = shippingFee;

        for (const item of items) {
            const qty = item.quantity || 1;
            const sClass = item.shippingClass || 'STANDARD';

            switch (sClass) {
                case 'CUSTOM_RATE': {
                    const customFee = item.customShippingCost || 0;
                    totalShipping += (customFee * qty);
                    hasFragileOrFreight = true;
                    break;
                }
                case 'HEAVY_FREIGHT': {
                    const weight = item.weightKg || 1.0;
                    const freightFee = freightBaseFee + (weight * freightPerKgRate);
                    const distanceMultiplier = getFreightMultiplierLocal(item.sellerState || null, state || '');
                    totalShipping += (freightFee * distanceMultiplier * qty);
                    hasFragileOrFreight = true;
                    break;
                }
                case 'FRAGILE': {
                    totalShipping += (baseStandardFee + fragileSurcharge) * qty;
                    hasFragileOrFreight = true;
                    break;
                }
                case 'STANDARD':
                default: {
                    totalShipping += baseStandardFee * qty;
                    break;
                }
            }
        }

        // Apply free threshold only if no fragile/freight/custom parts
        if (!hasFragileOrFreight && subtotal >= freeShippingThreshold) {
            totalShipping = 0;
        }

        return totalShipping;
    };

    const subtotal = getTotalPrice();
    const taxAmount = 0;
    const delivery = calculateDynamicShippingLocal();
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = subtotal + delivery + (subtotal > 0 ? platformFee : 0) - discountAmount;

    const handlePayment = async () => {
        if (!streetAddress.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
            Alert.alert('Missing Details', 'Please fill in your complete shipping address.');
            return;
        }

        if (deliveryType === 'GARAGE_FITTING' && !selectedGarageId) {
            Alert.alert('Select Garage', 'Please select a tie-up garage for fitting.');
            return;
        }

        if (items.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty.');
            return;
        }

        setLoading(true);

        const fullAddress = [
            flatNo && `Flat ${flatNo}`,
            floorNo && `Floor ${floorNo}`,
            buildingName && `Bldg ${buildingName}`,
            streetAddress,
            landmark && `Near ${landmark}`
        ].filter(Boolean).join(', ');

        try {
            // 1. Create Order in Database (Status: PENDING_PAYMENT)
            const checkoutResponse = await apiClient.post('/orders/checkout', {
                items: items.map(i => ({ productId: parseInt(i.id, 10), quantity: i.quantity })),
                shippingAddress: fullAddress,
                city: city,
                state: state,
                pincode: pincode,
                couponCode: appliedCoupon?.code,
                deliveryType: deliveryType,
                fittingGarageId: selectedGarageId
            });

            const dbOrderId = checkoutResponse.data.id;

            // 2. Create Razorpay Order on Backend (Now uses orderId for server-side validation)
            const rzpOrderResponse = await apiClient.post('/payments/create-order', {
                orderId: dbOrderId
            });

            const { razorpay_order_id } = rzpOrderResponse.data;

            // 2.5 Link Razorpay Order ID to local Order
            await apiClient.post(`/orders/${dbOrderId}/rzp-id?rzpOrderId=${razorpay_order_id}`);

            let RazorpayCheckout;
            try {
                RazorpayCheckout = require('react-native-razorpay').default;
            } catch (e) {
                Alert.alert('Payment Error', 'Razorpay module not found.');
                setLoading(false);
                return;
            }

            const options = {
                description: 'Mad Garage Parts Order',
                image: 'https://i.imgur.com/3g7nmJC.png',
                currency: 'INR',
                key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
                amount: total * 100,
                name: 'Mad Garage',
                order_id: razorpay_order_id,
                prefill: {
                    email: useAuthStore.getState().user?.email || '',
                    name: useAuthStore.getState().user ? `${useAuthStore.getState().user?.firstName || ''} ${useAuthStore.getState().user?.lastName || ''}`.trim() || 'Customer' : 'Customer'
                },
                theme: { color: '#DF2324' }
            };

            RazorpayCheckout.open(options).then(async (data: any) => {
                // 4. Verify & Finalize
                await finalizeOrder(dbOrderId, data.razorpay_payment_id, data.razorpay_signature);
            }).catch((error: any) => {
                Alert.alert('Payment Failed', `Code: ${error.code} | ${error.description}`);
                setLoading(false);
            });

        } catch (error: any) {
            console.error('Payment initiation failed:', error);
            Alert.alert('Error', 'Could not initiate payment. Please try again.');
            setLoading(false);
        }
    };

    const finalizeOrder = async (dbOrderId: number, paymentId: string, signature: string) => {
        try {
            // Verify Payment & Update Status to PAID
            await apiClient.post(`/orders/${dbOrderId}/verify-payment?paymentId=${paymentId}&signature=${signature}`);

            clearCart();
            setLoading(false);

            Alert.alert('Order Placed! 🏎️', 'Your payment was successful and your order is confirmed.', [
                {
                    text: 'View My Orders',
                    onPress: () => {
                        navigation.popToTop();
                        navigation.navigate('OrderHistory');
                    }
                }
            ]);
        } catch (error: any) {
            console.error('Finalization failed:', error);
            Alert.alert('Payment Successful', 'Payment was processed but we had trouble updating your order status. Please contact support with Payment ID: ' + paymentId);
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

                    {/* GARAGE FITTING DISABLED: Delivery option toggle hidden until tie-up garages are active. Uncomment to re-enable.
                    <View style={styles.deliveryToggleRow}>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, deliveryType === 'HOME_DELIVERY' && styles.toggleBtnActive, { backgroundColor: T.inputBg }]}
                            onPress={() => setDeliveryType('HOME_DELIVERY')}
                        >
                            <Ionicons name="home-outline" size={18} color={deliveryType === 'HOME_DELIVERY' ? '#FFF' : T.subText} />
                            <Text style={[styles.toggleText, { color: deliveryType === 'HOME_DELIVERY' ? '#FFF' : T.subText }]}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, deliveryType === 'GARAGE_FITTING' && styles.toggleBtnActive, { backgroundColor: T.inputBg }]}
                            onPress={() => setDeliveryType('GARAGE_FITTING')}
                        >
                            <Ionicons name="construct-outline" size={18} color={deliveryType === 'GARAGE_FITTING' ? '#FFF' : T.subText} />
                            <Text style={[styles.toggleText, { color: deliveryType === 'GARAGE_FITTING' ? '#FFF' : T.subText }]}>Garage Fit</Text>
                        </TouchableOpacity>
                    </View>
                    */}

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
                            <Text style={[styles.summaryLabel, { color: T.subText }]}>Delivery Fee</Text>
                            <Text style={[styles.summaryValue, { color: delivery === 0 && subtotal > 0 ? '#00FF00' : T.text }]}>
                                {delivery === 0 && subtotal > 0 ? 'FREE' : `₹${delivery.toLocaleString()}`}
                            </Text>
                        </View>
                        {(() => {
                            const heavyItems = items.filter(item => item.shippingClass === 'HEAVY_FREIGHT');
                            if (heavyItems.length > 0 && state) {
                                const buyerZone = STATE_ZONES[state.trim().toLowerCase()] ?? 1;
                                const firstHeavy = heavyItems.find(item => item.sellerState);
                                const sellerState = firstHeavy ? firstHeavy.sellerState : null;
                                const sellerZone = sellerState ? (STATE_ZONES[sellerState.trim().toLowerCase()] ?? 1) : 1;
                                const mult = buyerZone === 6 ? zoneMultiplierNE : zoneMultipliers[Math.min(Math.abs(sellerZone - buyerZone), 4)];
                                return (
                                    <View style={[styles.infoBox, { backgroundColor: isDark ? '#1A0808' : '#FFF0F0', marginTop: 4, marginBottom: 8, padding: 8 }]}>
                                        <Ionicons name="bus-outline" size={14} color="#DF2324" />
                                        <Text style={[styles.infoText, { fontSize: 10 }]}>
                                            {buyerZone === 6
                                                ? `Northeast Surcharge (${mult}x) active`
                                                : `Zone multiplier (Z${sellerZone} → Z${buyerZone}) of ${mult}x applied`
                                            }
                                        </Text>
                                    </View>
                                );
                            }
                            return null;
                        })()}

                        {subtotal > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: T.subText }]}>Platform Fee</Text>
                                <Text style={[styles.summaryValue, { color: T.text }]}>₹{platformFee.toLocaleString()}</Text>
                            </View>
                        )}

                        {discountAmount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Coupon Discount</Text>
                                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-₹{discountAmount.toLocaleString()}</Text>
                            </View>
                        )}

                        <View style={{ marginVertical: 10 }}>
                            {!appliedCoupon ? (
                                <TouchableOpacity
                                    style={[styles.couponActionRow, { backgroundColor: T.inputBg }]}
                                    onPress={() => setIsCouponSheetVisible(true)}
                                >
                                    <View style={styles.couponLeft}>
                                        <Ionicons name="pricetag-outline" size={16} color="#DF2324" />
                                        <Text style={[styles.couponActionText, { color: T.text }]}>Have a coupon code?</Text>
                                    </View>
                                    <View style={styles.couponRight}>
                                        <Text style={styles.viewOffersText}>View Offers</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#DF2324" />
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.appliedCouponRow, { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.2)' }]}>
                                    <View style={styles.couponLeft}>
                                        <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                                        <View>
                                            <Text style={styles.appliedCodeText}>{appliedCoupon.code}</Text>
                                            <Text style={styles.appliedSavedText}>₹{appliedCoupon.discountAmount} SAVED!</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                                        <Text style={styles.removeText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {deliveryType === 'GARAGE_FITTING' && (
                            <View style={[styles.infoBox, { backgroundColor: isDark ? '#1A0808' : '#FFF0F0' }]}>
                                <Ionicons name="information-circle" size={16} color="#DF2324" />
                                <Text style={styles.infoText}>Fitting labor is payable at the garage after inspection.</Text>
                            </View>
                        )}

                        <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: T.cardBorder }]}>
                            <Text style={[styles.totalLabel, { color: T.text }]}>Grand Total</Text>
                            <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* GARAGE FITTING DISABLED: Garage selection card hidden until tie-up garages are active. Uncomment to re-enable.
                    {deliveryType === 'GARAGE_FITTING' && (
                        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="location-outline" size={20} color={T.text} />
                                <Text style={[styles.cardTitle, { color: T.text }]}>Select Fitting Garage</Text>
                            </View>
                            
                            {nearbyGarages.length > 0 ? (
                                nearbyGarages.map(garage => (
                                    <TouchableOpacity 
                                        key={garage.id} 
                                        style={[styles.garageSelectItem, selectedGarageId === garage.id && styles.garageSelectActive, { borderColor: T.cardBorder }]}
                                        onPress={() => setSelectedGarageId(garage.id)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.garageName, { color: T.text }]}>{garage.firstName} {garage.lastName}</Text>
                                            <Text style={[styles.garageAddr, { color: T.subText }]}>{garage.distance?.toFixed(1)} km away • {garage.city}</Text>
                                        </View>
                                        {selectedGarageId === garage.id && (
                                            <Ionicons name="checkmark-circle" size={20} color="#DF2324" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.noneText, { color: T.subText }]}>No tie-up garages found in your 10km radius for {city}. Try Home Delivery.</Text>
                            )}
                        </View>
                    )}
                    */}

                    {/* Shipping Address Form */}
                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name={deliveryType === 'HOME_DELIVERY' ? "location-outline" : "person-outline"} size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>
                                {deliveryType === 'HOME_DELIVERY' ? 'Shipping Address' : 'Contact Details'}
                            </Text>
                        </View>

                        <View style={styles.quickFillRow}>
                            {savedAddresses.map(addr => (
                                <TouchableOpacity
                                    key={addr.id}
                                    style={[styles.chip, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                    onPress={() => {
                                        setStreetAddress(addr.address || '');
                                        setCity(addr.city || '');
                                        setState(addr.state || '');
                                        setPincode(addr.pincode || '');
                                    }}
                                >
                                    <Ionicons
                                        name={addr.tag === 'HOME' ? 'home-outline' : addr.tag === 'OFFICE' ? 'business-outline' : 'location-outline'}
                                        size={14}
                                        color={T.subText}
                                    />
                                    <Text style={[styles.chipText, { color: T.text }]}>{addr.tag}</Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={[styles.chip, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                onPress={detectLocation}
                                disabled={detectionLoading}
                            >
                                <Ionicons name="location-outline" size={14} color={T.subText} />
                                <Text style={[styles.chipText, { color: T.text }]}>{detectionLoading ? 'Detecting...' : 'Detect'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.chip, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                onPress={() => {
                                    setFlatNo('');
                                    setFloorNo('');
                                    setBuildingName('');
                                    setStreetAddress('');
                                    setCity('');
                                    setState('');
                                    setPincode('');
                                }}
                            >
                                <Ionicons name="close-circle-outline" size={14} color="#DF2324" />
                                <Text style={[styles.chipText, { color: T.text }]}>Manual</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Flat/Unit</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="402"
                                    placeholderTextColor={T.subText}
                                    value={flatNo}
                                    onChangeText={setFlatNo}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Floor</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="4th"
                                    placeholderTextColor={T.subText}
                                    value={floorNo}
                                    onChangeText={setFloorNo}
                                />
                            </View>
                        </View>



                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Landmark</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="Near Phoenix Mall"
                                placeholderTextColor={T.subText}
                                value={landmark}
                                onChangeText={setLandmark}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Street / Area</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                <TextInput
                                    style={[styles.wrappedInput, { color: T.text }]}
                                    placeholder="123 Performance Street"
                                    placeholderTextColor={T.subText}
                                    value={streetAddress}
                                    onChangeText={setStreetAddress}
                                />
                                <TouchableOpacity onPress={detectLocation} disabled={detectionLoading} style={styles.inlineAction}>
                                    {detectionLoading ? (
                                        <ActivityIndicator size="small" color="#DF2324" />
                                    ) : (
                                        <Ionicons name="locate" size={18} color="#DF2324" />
                                    )}
                                </TouchableOpacity>
                            </View>
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

            <CouponBottomSheet
                visible={isCouponSheetVisible}
                onClose={() => setIsCouponSheetVisible(false)}
                onApply={(coupon) => setAppliedCoupon(coupon)}
                orderAmount={subtotal}
            />

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
    },

    // New Styles for Delivery Selection
    deliveryToggleRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 8,
    },
    toggleBtnActive: {
        backgroundColor: '#DF2324',
        borderColor: '#DF2324',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '800',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    infoText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#DF2324',
        flex: 1,
    },

    // Garage Picker Styles
    garageSelectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    garageSelectActive: {
        borderColor: '#DF2324',
        backgroundColor: 'rgba(223, 35, 36, 0.05)',
    },
    garageName: {
        fontSize: 14,
        fontWeight: '700',
    },
    garageAddr: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    noneText: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 10,
    },
    // Enhanced Input Styles
    quickFillRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap'
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6
    },
    chipText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden'
    },
    wrappedInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 15,
        fontSize: 15,
        fontWeight: '600',
    },
    inlineAction: {
        paddingHorizontal: 14,
    },
    // Coupon Styles
    couponActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 15,
        marginTop: 5,
    },
    couponLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    couponActionText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    couponRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewOffersText: {
        color: '#DF2324',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        fontStyle: 'italic',
    },
    appliedCouponRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 5,
    },
    appliedCodeText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    appliedSavedText: {
        color: '#666',
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    removeText: {
        color: '#666',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    }
});
