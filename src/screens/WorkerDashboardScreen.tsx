import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Image, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../store/themeStore';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'WorkerDashboard'>;
};

interface WorkerStats {
    totalUsers: number;
    totalProducts: number;
    totalVehicles?: number;
    pendingOrders?: number;
}

export default function WorkerDashboardScreen({ navigation }: Props) {
    const logout = useAuthStore((state) => state.logout);
    const [stats, setStats] = useState<WorkerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncError, setSyncError] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const { isDark, toggleTheme } = useThemeStore();
    const insets = useSafeAreaInsets();

    const bgPrimary = isDark ? '#000000' : '#E0E1E3';
    const bgSecondary = isDark ? '#0A0A0A' : '#F0F1F3';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textMuted = isDark ? '#B0B0C0' : '#55555C';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            setSyncError('');
            const analyticsRes = await apiClient.get('/admin/worker-stats');
            setStats(analyticsRes.data);
        } catch (error: any) {
            setSyncError('Link Failure: Connection to Central HQ lost');
            console.error('Failed to fetch worker stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerPanel, { backgroundColor: bgPrimary }]}>
                <ActivityIndicator size="large" color="#DF2324" />
                <Text style={[styles.loadingText, { color: textMuted }]}>SYNCING OPERATIONAL DATA...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: bgPrimary, paddingTop: Math.max(insets.top, 8) }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgPrimary} />

            {/* Header */}
            <View style={[styles.customHeader, { paddingTop: 20 }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.telemetryTag, { color: '#DF2324' }]}>STAFF TERMINAL</Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={[styles.headerProfileCircle, { borderColor: borderSubtle }]} onPress={() => setShowProfileMenu(!showProfileMenu)}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerProfileImg} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.mainTitleSection}>
                <Text style={[styles.mainTitle, { color: textPrimary }]}>OPERATIONS{"\n"}CONTROL</Text>
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={[styles.statusText, { color: textMuted }]}>WORKER STATUS: ACTIVE | AUTHORIZED ACCESS</Text>
                </View>
            </View>

            {showProfileMenu && (
                <View style={[styles.profileMenu, { backgroundColor: bgSecondary, borderColor: borderSubtle, top: 110, right: 20 }]}>
                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('AdminProfile'); }}
                    >
                        <Ionicons name="person-outline" size={18} color={textPrimary} />
                        <Text style={[styles.profileMenuText, { color: textPrimary }]}>View Profile</Text>
                    </TouchableOpacity>
                    <View style={[styles.profileMenuDivider, { backgroundColor: borderSubtle }]} />
                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); toggleTheme(); }}
                    >
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={textPrimary} />
                        <Text style={[styles.profileMenuText, { color: textPrimary }]}>Switch Theme</Text>
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
                {/* Global Metrics */}
                <View style={styles.newStatsContainer}>
                    {[
                        { icon: 'swap-horizontal-outline', value: stats?.totalProducts || 0, label: 'PARTS', id: '01', route: 'AdminInventoryManagement', colors: isDark ? ['#1A1A1A', '#0F0F0F'] : ['#F5F5F5', '#E0E0E0'], iconColor: '#DF2324' },
                        { icon: 'people-outline', value: stats?.totalUsers || 0, label: 'USERS', id: '02', route: 'AdminUserManagement', colors: isDark ? ['#0F0F2A', '#080815'] : ['#E8EAF6', '#C5CAE9'], iconColor: '#5B5BFF' },
                        { icon: 'car-outline', value: stats?.totalVehicles || 0, label: 'VEHICLES', id: '03', route: 'AdminVehicleManagement', colors: isDark ? ['#0A1A0A', '#050F05'] : ['#E8F5E9', '#C8E6C9'], iconColor: '#28A745' },
                    ].map((s: any) => (
                        <TouchableOpacity
                            key={s.label}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(s.route as any)}
                            style={styles.metricCardWrapper}
                        >
                            <LinearGradient
                                colors={s.colors}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.metricCard}
                            >
                                <View style={styles.metricHeader}>
                                    <Ionicons name={s.icon} size={20} color={s.iconColor} />
                                    <Text style={[styles.metricId, { color: textMuted }]}>{s.id} // {s.label}</Text>
                                </View>
                                <Text style={[styles.metricValue, { color: textPrimary }]}>{s.value}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Operation Hubs */}
                <View style={styles.newHubHeader}>
                    <View style={styles.hubHeaderLine} />
                    <Text style={[styles.newHubTitle, { color: textPrimary }]}>COMMAND HUBS</Text>
                </View>

                <View style={styles.newHubContainer}>
                    {[
                        { title: 'ORDER', subtitle: 'PIPELINE', icon: 'swap-horizontal', btn: 'MANAGE ORDERS', route: 'AdminOrderManagement', colors: isDark ? ['#2A0A0A', '#1A0505'] : ['#FFEBEE', '#FFCDD2'], iconColor: '#DF2324' },
                        { title: 'MERCHANT', subtitle: 'OVERSIGHT', icon: 'business', btn: 'AUDIT SELLERS', route: 'AdminUserManagement', params: { roleFilter: 'ROLE_SELLER' }, colors: isDark ? ['#0A0A2A', '#05051A'] : ['#E8EAF6', '#C5CAE9'], iconColor: '#5B5BFF' },
                        { title: 'GARAGE', subtitle: 'NETWORK', icon: 'car', btn: 'MANAGE TIE-UPS', route: 'AdminUserManagement', params: { roleFilter: 'ROLE_GARAGE' }, colors: isDark ? ['#0A1A0A', '#050F05'] : ['#E8F5E9', '#C8E6C9'], iconColor: '#28A745' },
                        { title: 'INVENTORY', subtitle: 'MASTER', icon: 'cube', btn: 'MANAGE PARTS', route: 'AdminInventoryManagement', colors: isDark ? ['#1A1A0A', '#0F0F05'] : ['#F5F5F5', '#E0E0E0'], iconColor: '#7A00E6' },
                        { title: 'PART', subtitle: 'REQUESTS', icon: 'clipboard', btn: 'VIEW REQUESTS', route: 'AdminRequests', colors: isDark ? ['#2A1A0A', '#1A0A05'] : ['#FFF3E0', '#FFE0B2'], iconColor: '#FF8C00' },
                    ].map((hub: any) => (
                        <TouchableOpacity
                            key={hub.title}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(hub.route as any, hub.params)}
                            style={styles.newHubCardWrapper}
                        >
                            <LinearGradient
                                colors={hub.colors}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.newHubCard}
                            >
                                <View style={[styles.hubIconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                    <Ionicons name={hub.icon} size={24} color={hub.iconColor} />
                                </View>
                                <View style={styles.hubContent}>
                                    <Text style={[styles.hubMainTitle, { color: textMuted }]}>{hub.title}</Text>
                                    <Text style={[styles.hubSubTitle, { color: textPrimary }]}>{hub.subtitle}</Text>
                                </View>
                                <View style={styles.hubActionBox}>
                                    <Text style={[styles.hubActionBtn, { backgroundColor: 'transparent', color: textPrimary, borderColor: hub.iconColor }]}>{hub.btn}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    centerPanel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 13, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
    scrollArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 10 },

    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerLeft: { flex: 1 },
    telemetryTag: { fontSize: 14, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    headerProfileCircle: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    headerProfileImg: { width: '100%', height: '100%' },

    mainTitleSection: { paddingHorizontal: 20, marginBottom: 25 },
    mainTitle: { fontSize: 34, fontWeight: '900', fontStyle: 'italic', lineHeight: 34, textTransform: 'uppercase', letterSpacing: -1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#DF2324' },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    newStatsContainer: { gap: 15 },
    metricCardWrapper: { borderRadius: 4, overflow: 'hidden', borderWidth: 1 },
    metricCard: { padding: 25 },
    metricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    metricId: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    metricValue: { fontSize: 42, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },

    newHubHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20, gap: 10 },
    hubHeaderLine: { width: 4, height: 20, backgroundColor: '#DF2324' },
    newHubTitle: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 },
    newHubContainer: { gap: 12 },
    newHubCardWrapper: { borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    newHubCard: { flexDirection: 'row', borderRadius: 4, height: 80, alignItems: 'center' },
    hubIconBox: { width: 60, height: '100%', justifyContent: 'center', alignItems: 'center' },
    hubContent: { flex: 1, paddingLeft: 15 },
    hubMainTitle: { fontSize: 12, fontWeight: '800', fontStyle: 'italic' },
    hubSubTitle: { fontSize: 16, fontWeight: '900', fontStyle: 'italic', marginTop: -2 },
    hubActionBox: { paddingRight: 20 },
    hubActionBtn: { fontSize: 10, fontWeight: '900', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },

    profileMenu: {
        position: 'absolute',
        width: 170,
        borderRadius: 16,
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
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    profileMenuText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
    profileMenuDivider: { height: 1, marginHorizontal: 12 },
});
