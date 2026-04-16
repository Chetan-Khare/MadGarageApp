import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SellerDashboard'>;
};

interface SellerStats {
    activeListings: number;
    monthRevenue: number;
}

export default function SellerDashboardScreen({ navigation }: Props) {
    const logout = useAuthStore((state) => state.logout);
    const [stats, setStats] = useState<SellerStats | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [flaggedCount, setFlaggedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { isDark, toggleTheme } = useThemeStore();
    const insets = useSafeAreaInsets();

    // Force premium dark aesthetic for seller hub layout metrics
    const bgPrimary = isDark ? '#08080C' : '#F4F5F7';
    const bgSecondary = isDark ? '#121216' : '#FFFFFF';
    const textPrimary = isDark ? '#FFFFFF' : '#1A1A1A';
    const textMuted = isDark ? '#7A7A85' : '#8A8A95';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const cardGlow = isDark ? 'rgba(223, 35, 36, 0.15)' : 'rgba(223, 35, 36, 0.05)';

    useEffect(() => {
        fetchAnalytics();
        fetchOrders();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [analyticsRes, inventoryRes] = await Promise.all([
                apiClient.get('/seller/inventory/analytics'),
                apiClient.get('/seller/inventory')
            ]);
            setStats(analyticsRes.data);
            const flagged = inventoryRes.data.filter((p: any) => p.flagged).length;
            setFlaggedCount(flagged);
        } catch (error) {
            setStats(null);
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await apiClient.get('/orders/seller-orders');
            setOrders(response.data);
        } catch (error) {
            setOrders([]);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerPanel, { backgroundColor: bgPrimary }]}>
                <ActivityIndicator size="large" color="#DF2324" />
                <Text style={[styles.loadingText, { color: textMuted }]}>SYNCING TERMINAL...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: bgPrimary, paddingTop: Math.max(insets.top, 8) }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgPrimary} />

            {/* ── Custom Centered Header (Mockup matched) ── */}
            <View style={styles.customHeader}>
                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: isDark ? '#1C1C22' : '#E5E5E5' }]} onPress={toggleTheme}>
                    <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#FFD700' : '#5B5BFF'} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.headerLogoWrap}>
                        <Image 
                            source={require('../../assets/app_logo.png')} 
                            style={styles.headerLogo} 
                            resizeMode="cover"
                        />
                    </View>
                    <Text style={[styles.headerTitle, { color: textPrimary }]}>MAD GARAGE</Text>
                    <Text style={[styles.headerSubtitle, { color: textMuted }]}>MERCHANT HUB</Text>
                </View>

                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#DF2324' }]} onPress={() => setShowProfileMenu(!showProfileMenu)}>
                    <Ionicons name="person" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {showProfileMenu && (
                <View style={[styles.profileMenu, { backgroundColor: bgSecondary, borderColor: borderSubtle, top: 120, right: 20 }]}>
                    <TouchableOpacity 
                        style={styles.profileMenuItem} 
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('SellerProfile'); }}
                    >
                        <Ionicons name="person-circle-outline" size={18} color={textPrimary} />
                        <Text style={[styles.profileMenuText, { color: textPrimary }]}>Seller Profile</Text>
                    </TouchableOpacity>
                    <View style={[styles.profileMenuDivider, { backgroundColor: borderSubtle }]} />
                    <TouchableOpacity 
                        style={styles.profileMenuItem} 
                        onPress={() => { setShowProfileMenu(false); logout(); }}
                    >
                        <Ionicons name="log-out-outline" size={18} color="#DF2324" />
                        <Text style={[styles.profileMenuText, { color: '#DF2324' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView 
                style={styles.scrollArea} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Compliance Alert ── */}
                {flaggedCount > 0 && (
                    <TouchableOpacity 
                        style={styles.complianceCardOuter} 
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('SellerFlaggedProducts')}
                    >
                        <LinearGradient
                            colors={['#FF9B3E', '#FF7A00']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.complianceCard}
                        >
                            <View style={styles.complianceLeft}>
                                <View style={styles.complianceIconWrap}>
                                    <Ionicons name="warning" size={24} color="#FFF" />
                                </View>
                                <View>
                                    <Text style={styles.complianceTitle}>COMPLIANCE ACTION REQUIRED</Text>
                                    <Text style={styles.complianceDesc}>{flaggedCount} item(s) flagged for review</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" opacity={0.8} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* ── Metric Cards ── */}
                <View style={styles.metricsRow}>
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.metricCardOuter}
                        onPress={() => navigation.navigate('SellerInventory')}
                    >
                        <LinearGradient
                            colors={isDark ? ['#16161C', '#0A0A0E'] : ['#FFFFFF', '#F8F9FA']}
                            style={[styles.metricCard, { borderColor: cardGlow }]}
                        >
                            <View style={styles.iconRing}>
                                <Ionicons name="cube-outline" size={24} color="#DF2324" />
                            </View>
                            <Text style={[styles.metricValue, { color: textPrimary }]}>
                                {stats?.activeListings || 0}
                            </Text>
                            <Text style={[styles.metricLabel, { color: textMuted }]}>Active Listings</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.metricCardOuter}
                        onPress={() => navigation.navigate('SellerOrderHistory')}
                    >
                        <LinearGradient
                            colors={isDark ? ['#16161C', '#0A0A0E'] : ['#FFFFFF', '#F8F9FA']}
                            style={[styles.metricCard, { borderColor: cardGlow }]}
                        >
                            <View style={styles.iconRing}>
                                <Ionicons name="cash-outline" size={24} color="#DF2324" />
                            </View>
                            <Text style={[styles.metricValue, { color: textPrimary }]}>
                                ₹{(stats?.monthRevenue || 0).toLocaleString()}
                            </Text>
                            <Text style={[styles.metricLabel, { color: textMuted }]}>Month Revenue</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Compliance Hub Link */}
                <TouchableOpacity 
                    style={[styles.hubLink, { borderColor: borderSubtle, backgroundColor: bgSecondary }]}
                    onPress={() => navigation.navigate('SellerFlaggedProducts')}
                >
                    <View style={styles.hubIconWrap}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#FF9B3E" />
                    </View>
                    <Text style={[styles.hubText, { color: textPrimary }]}>Compliance & Flag Hub</Text>
                    <Ionicons name="chevron-forward" size={16} color={textMuted} />
                </TouchableOpacity>

                {/* ── Primary Action Call ── */}
                <TouchableOpacity 
                    style={styles.actionBtnWrap} 
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('AddProduct' as any)}
                >
                    <LinearGradient
                        colors={['#F02E2E', '#C21515']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="add" size={22} color="#FFF" style={styles.actionBtnIcon} />
                        <Text style={styles.actionBtnText}>LIST NEW PART</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* ── Orders Board ── */}
                <View style={styles.boardHeader}>
                    <Text style={[styles.boardTitle, { color: textPrimary }]}>RECENT ORDERS</Text>
                    <Text style={[styles.boardBadge, { color: '#DF2324', backgroundColor: 'rgba(223,35,36,0.1)' }]}>
                        REQUIRES SHIPMENT
                    </Text>
                </View>

                {orders.length > 0 ? (
                    orders.map((order) => (
                        <TouchableOpacity 
                            key={order.id}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
                        >
                            <LinearGradient
                                colors={isDark ? ['#14141A', '#0B0B0E'] : ['#FFFFFF', '#F8F9F9']}
                                style={[styles.orderCard, { borderColor: borderSubtle }]}
                            >
                                <View style={styles.orderTop}>
                                    <Text style={[styles.orderId, { color: textMuted }]}>ORD-#{order.id}</Text>
                                    <Text style={styles.orderStatus}>{order.status}</Text>
                                </View>

                                {order.items && order.items.length > 0 && (
                                    <Text style={[styles.orderItemNames, { color: textPrimary }]} numberOfLines={1}>
                                        {order.items[0].quantity}x {order.items[0].productName}
                                        {order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ''}
                                    </Text>
                                )}
                                
                                <View style={styles.orderBottom}>
                                    <Text style={styles.orderPrice}>₹{order.grandTotal?.toLocaleString()}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={textMuted} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={[styles.emptyBoard, { borderColor: borderSubtle, backgroundColor: isDark ? '#101014' : '#FAFAFA' }]}>
                        <Ionicons name="cube-outline" size={48} color={borderSubtle} />
                        <Text style={[styles.emptyText, { color: textMuted }]}>NO ACTIVE ORDERS DETECTED</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centerPanel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
    scrollArea: { flex: 1, marginTop: 16 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

    // Custom Header
    customHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    headerLogoWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(223, 35, 36, 0.3)',
        marginBottom: 6,
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        backgroundColor: 'transparent',
    },
    headerLogo: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 2,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    profileMenu: {
        position: 'absolute',
        width: 170,
        borderRadius: 14,
        paddingVertical: 6,
        zIndex: 1000,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    profileMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    profileMenuText: { fontSize: 13, fontWeight: '700' },
    profileMenuDivider: { height: 1, marginHorizontal: 12 },

    // Metrics
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    metricCardOuter: {
        flex: 1,
        borderRadius: 20,
    },
    metricCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconRing: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(223, 35, 36, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(223, 35, 36, 0.2)',
    },
    metricValue: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // Action Button
    actionBtnWrap: {
        borderRadius: 16,
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 32,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
    },
    actionBtnIcon: { marginRight: 8 },
    actionBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },

    // Orders Board
    boardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    boardTitle: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    boardBadge: {
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
    },
    orderCard: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    orderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    orderStatus: {
        fontSize: 11,
        fontWeight: '800',
        color: '#DF2324',
        letterSpacing: 1,
    },
    orderItemNames: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    orderBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#DF2324',
    },
    emptyBoard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },

    // Compliance Styles
    complianceCardOuter: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#FF9B3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    complianceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    complianceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    complianceIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    complianceTitle: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    complianceDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    hubLink: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 32,
    },
    hubIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 155, 62, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    hubText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
