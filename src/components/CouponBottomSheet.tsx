import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    FlatList, TextInput, ActivityIndicator, Pressable,
    Dimensions, Animated, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Coupon {
    id: number;
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountAmount: number;
    minOrderAmount: number;
}

interface CouponBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    onApply: (coupon: any) => void;
    orderAmount: number;
}

const CouponBottomSheet: React.FC<CouponBottomSheetProps> = ({ visible, onClose, onApply, orderAmount }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

    useEffect(() => {
        if (visible) {
            fetchAvailableCoupons();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    const fetchAvailableCoupons = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/coupons/available');
            setCoupons(response.data);
        } catch (err) {
            console.error('Failed to fetch coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualApply = async () => {
        if (!manualCode.trim()) return;
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.post(`/coupons/validate?code=${manualCode}&amount=${orderAmount}`);
            onApply(response.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid coupon code');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCoupon = async (code: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.post(`/coupons/validate?code=${code}&amount=${orderAmount}`);
            onApply(response.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to apply coupon');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.indicator} />
                    
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Apply <Text style={styles.titleAccent}>Coupon</Text></Text>
                            <Text style={styles.subtitle}>Select from available offers</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Manual Input */}
                        <View style={styles.inputSection}>
                            <Text style={styles.inputLabel}>Enter Coupon Code</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="SAVE500"
                                    placeholderTextColor="#444"
                                    value={manualCode}
                                    onChangeText={setManualCode}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity 
                                    style={[styles.applyBtn, (!manualCode.trim() || loading) && styles.disabledBtn]}
                                    onPress={handleManualApply}
                                    disabled={!manualCode.trim() || loading}
                                >
                                    <Text style={styles.applyBtnText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                            {error && (
                                <View style={styles.errorRow}>
                                    <Ionicons name="alert-circle" size={12} color="#DF2324" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}
                        </View>

                        {/* Coupon List */}
                        <Text style={styles.listTitle}>Available Coupons</Text>
                        
                        {loading && coupons.length === 0 ? (
                            <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 40 }} />
                        ) : (
                            <FlatList
                                data={coupons}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.listContainer}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.couponCard}
                                        onPress={() => handleSelectCoupon(item.code)}
                                    >
                                        <View style={styles.couponLeft}>
                                            <View style={styles.iconContainer}>
                                                <Ionicons name="pricetag" size={16} color="#DF2324" />
                                            </View>
                                            <View style={styles.couponInfo}>
                                                <Text style={styles.couponCode}>{item.code}</Text>
                                                <Text style={styles.couponDesc}>{item.description}</Text>
                                                <Text style={styles.couponMeta}>
                                                    {item.discountType === 'PERCENTAGE' ? `${item.discountAmount}% OFF` : `₹${item.discountAmount} OFF`}
                                                    {item.minOrderAmount > 0 && ` • Min Order ₹${item.minOrderAmount}`}
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color="#333" />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Ionicons name="pricetag" size={48} color="#22" />
                                        <Text style={styles.emptyText}>No active coupons for this order</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.footerText}>"Maximize your performance with MAD-CREDIT."</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    sheet: {
        backgroundColor: '#0A0A0E',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 15,
        maxHeight: SCREEN_HEIGHT * 0.85,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    indicator: {
        width: 40,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 30,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    titleAccent: {
        color: '#DF2324',
    },
    subtitle: {
        color: '#666',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    closeBtn: {
        height: 44,
        width: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 25,
        flex: 1,
    },
    inputSection: {
        marginBottom: 35,
    },
    inputLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 10,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 18,
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    applyBtn: {
        backgroundColor: '#DF2324',
        paddingHorizontal: 25,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        marginLeft: 10,
    },
    errorText: {
        color: '#DF2324',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    listTitle: {
        color: '#666',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 15,
        marginLeft: 10,
    },
    listContainer: {
        paddingBottom: 40,
    },
    couponCard: {
        backgroundColor: '#141418',
        borderRadius: 25,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    couponLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        flex: 1,
    },
    iconContainer: {
        height: 44,
        width: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(223,35,36,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    couponInfo: {
        flex: 1,
    },
    couponCode: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    couponDesc: {
        color: '#888',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    couponMeta: {
        color: '#DF2324',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginTop: 6,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 50,
        gap: 15,
    },
    emptyText: {
        color: '#444',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    footer: {
        padding: 30,
        backgroundColor: 'rgba(255,255,255,0.02)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    footerText: {
        color: '#555',
        fontSize: 10,
        fontWeight: '500',
        fontStyle: 'italic',
    }
});

export default CouponBottomSheet;
