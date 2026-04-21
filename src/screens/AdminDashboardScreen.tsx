import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, TextInput, Alert, StatusBar, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';
import { LineChart } from 'react-native-chart-kit';
import { useThemeStore } from '../store/themeStore';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

interface AdminStats {
    totalUsers: number;
    totalSellers: number;
    totalProducts: number;
    totalVehicles: number;
    totalRevenue: number;
    sixMonthRevenue: number[];
}

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen({ navigation }: Props) {
    const logout = useAuthStore((state) => state.logout);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [requestCount, setRequestCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [syncError, setSyncError] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [newUserFirstName, setNewUserFirstName] = useState('');
    const [newUserLastName, setNewUserLastName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserPhone, setNewUserPhone] = useState('');
    const [newUserRole, setNewUserRole] = useState<'ROLE_SELLER' | 'ROLE_GARAGE' | 'ROLE_ADMIN'>('ROLE_SELLER');
    const [creatingUser, setCreatingUser] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { isDark, toggleTheme } = useThemeStore();
    const insets = useSafeAreaInsets();

    const bgPrimary = isDark ? '#000000' : '#E0E1E3';
    const bgSecondary = isDark ? '#0A0A0A' : '#F0F1F3';
    const textPrimary = isDark ? '#FFFFFF' : '#000000';
    const textMuted = isDark ? '#B0B0C0' : '#55555C';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
    const cardGlow = isDark ? 'rgba(223, 35, 36, 0.15)' : 'rgba(223, 35, 36, 0.1)';
    const inputBg = isDark ? '#0D0D0D' : '#D1D3D6';

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            setSyncError('');
            const [analyticsRes, requestsRes] = await Promise.all([
                apiClient.get('/admin/analytics'),
                apiClient.get('/admin/requests')
            ]);
            setStats(analyticsRes.data);
            setRequestCount(Array.isArray(requestsRes.data) ? requestsRes.data.length : 0);
        } catch (error: any) {
            const msg = error.response?.data || error.message || 'Unknown Link Failure';
            setSyncError(typeof msg === 'object' ? (msg.message || JSON.stringify(msg)) : msg);
            console.error('Failed to fetch admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserEmail || !newUserPassword || !newUserPhone || !newUserFirstName || !newUserLastName) {
            Alert.alert('Error', 'First Name, Last Name, Email, Password, and Phone are required');
            return;
        }
        setCreatingUser(true);
        try {
            await apiClient.post('/admin/users', {
                firstName: newUserFirstName,
                lastName: newUserLastName,
                email: newUserEmail,
                password: newUserPassword,
                phone: newUserPhone,
                role: newUserRole
            });
            Alert.alert('Success', `${newUserRole} account created!`);
            setNewUserFirstName('');
            setNewUserLastName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserPhone('');
            fetchAnalytics();
        } catch (error: any) {
            const msg = error.response?.data || error.message || 'Provisioning Failed';
            Alert.alert('Creation Failed', typeof msg === 'object' ? (msg.message || JSON.stringify(msg)) : msg);
        } finally {
            setCreatingUser(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerPanel, { backgroundColor: bgPrimary }]}>
                <ActivityIndicator size="large" color="#DF2324" />
                <Text style={[styles.loadingText, { color: textMuted }]}>ESTABLISHING SECURE LINK...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.root, { backgroundColor: bgPrimary, paddingTop: Math.max(insets.top, 8) }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgPrimary} />

            {/* ── Custom Centered Header ── */}
            <View style={[styles.customHeader, { paddingTop: 20 }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.telemetryTag, { color: '#DF2324' }]}>MAD GARAGE</Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={[styles.headerProfileCircle, { borderColor: borderSubtle }]} onPress={() => setShowProfileMenu(!showProfileMenu)}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerProfileImg} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.mainTitleSection}>
                <Text style={[styles.mainTitle, { color: textPrimary }]}>OPERATIONAL{"\n"}OVERDRIVE</Text>
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={[styles.statusText, { color: textMuted }]}>SYSTEMS STATUS: OPTIMIZED | THE MAD GARAGE HO</Text>
                </View>

                <View style={[styles.tpsBox, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}>
                    <Text style={styles.tpsLabel}>LIVE TPS</Text>
                    <Text style={[styles.tpsValue, { color: textPrimary }]}>842.4</Text>
                </View>
            </View>

            {syncError ? (
                <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(223,35,36,0.1)' : '#FFF5F5' }]}>
                    <Ionicons name="warning" size={18} color="#DF2324" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.errorText, { color: textPrimary }]}>SYSTEM SYNCHRONISATION FAILURE</Text>
                        <Text style={[styles.errorSubtext, { color: textMuted }]} numberOfLines={1}>{syncError}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setLoading(true); fetchAnalytics(); }}>
                        <Text style={{ color: '#DF2324', fontWeight: '900', fontSize: 12 }}>RETRY</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {showProfileMenu && (
                <View style={[styles.profileMenu, { backgroundColor: bgSecondary, borderColor: borderSubtle, top: 110, right: 20 }]}>
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
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('AdminProfile' as any); }}
                    >
                        <Ionicons name="person-circle-outline" size={18} color={textPrimary} />
                        <Text style={[styles.profileMenuText, { color: textPrimary }]}>Admin Profile</Text>
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
                {/* ── Global Metrics ── */}
                <View style={styles.newStatsContainer}>
                    {[
                        { icon: 'people-outline', value: stats?.totalUsers || 0, label: 'USERS', id: '01', route: 'AdminUserManagement', colors: isDark ? ['#0F0F2A', '#080815'] : ['#E8EAF6', '#C5CAE9'], iconColor: isDark ? '#DF2324' : '#1976D2' },
                        { icon: 'cube-outline', value: stats?.totalProducts || 0, label: 'PARTS', id: '02', route: 'AdminInventoryManagement', colors: isDark ? ['#1A1A1A', '#0F0F0F'] : ['#F5F5F5', '#E0E0E0'], iconColor: isDark ? '#DF2324' : '#424242' },
                        { icon: 'cash-outline', value: '₹4.28M', label: 'INCOME', id: '03', route: 'AdminOrderManagement', colors: isDark ? ['#2A0F0F', '#150808'] : ['#FFEBEE', '#FFCDD2'], iconColor: isDark ? '#DF2324' : '#D32F2F' },
                        { icon: 'documents-outline', value: requestCount.toLocaleString(), label: 'PART REQUEST', id: '04', route: 'AdminRequests', colors: isDark ? ['#0F2022', '#081112'] : ['#E0F2F1', '#B2DFDB'], iconColor: isDark ? '#DF2324' : '#00796B' },
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

                {/* ── Operation Hubs ── */}
                <View style={styles.newHubHeader}>
                    <View style={styles.hubHeaderLine} />
                    <Text style={[styles.newHubTitle, { color: textPrimary }]}>OPERATION HUBS</Text>
                </View>

                <View style={styles.newHubContainer}>
                    {[
                        { title: 'ORDER', subtitle: 'PIPELINE', icon: 'swap-horizontal', btn: 'OPEN MODULE', route: 'AdminOrderManagement', colors: isDark ? ['#2A0A0A', '#1A0505'] : ['#FFEBEE', '#FFCDD2'], iconColor: '#DF2324' },
                        { title: 'GARAGE', subtitle: 'INVENTORY', icon: 'business', btn: 'AUDIT DATA', route: 'AdminInventoryManagement', colors: isDark ? ['#0A0A2A', '#05051A'] : ['#E8EAF6', '#C5CAE9'], iconColor: '#5B5BFF' },
                        { title: 'VEHICLE', subtitle: 'DB', icon: 'car', btn: 'QUERY MASTER', route: 'AdminVehicleManagement', colors: isDark ? ['#0A1A0A', '#050F05'] : ['#E8F5E9', '#C8E6C9'], iconColor: '#28A745' },
                        { title: 'SYSTEM', subtitle: 'CONFIG', icon: 'options', btn: 'OPEN PANEL', route: 'AdminSettings' as any, colors: isDark ? ['#1A0A1A', '#0F050F'] : ['#F3E5F5', '#E1BEE7'], iconColor: '#7A00E6' },
                    ].map((hub: any) => (
                        <TouchableOpacity
                            key={hub.title}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(hub.route as any)}
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

                {/* ── Revenue Chart ── */}
                {stats && stats.sixMonthRevenue && stats.sixMonthRevenue.length > 0 && (
                    <View style={[styles.chartWrapper, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}>
                        <View style={styles.activeNodeBadge}>
                            <Text style={styles.activeNodeText}>ACTIVE NODE</Text>
                        </View>
                        <Text style={[styles.newHubTitle, { color: textPrimary }]}>REVENUE{"\n"}TRAJECTORY</Text>
                        <Text style={[styles.chartStatus, { color: textMuted }]}>6-MONTH PERFORMANCE ANALYTICS</Text>

                        <LineChart
                            data={{
                                labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"],
                                datasets: [{ data: stats.sixMonthRevenue }]
                            }}
                            width={screenWidth - 80}
                            height={220}
                            chartConfig={{
                                backgroundColor: bgSecondary,
                                backgroundGradientFrom: bgSecondary,
                                backgroundGradientTo: bgSecondary,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(223, 35, 36, ${opacity})`,
                                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.8})` : `rgba(0, 0, 0, ${opacity * 0.9})`,
                                style: { borderRadius: 0 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#DF2324" },
                                fillShadowGradient: '#DF2324',
                                fillShadowGradientOpacity: 0.2,
                                barPercentage: 0.5,
                                propsForLabels: { fontSize: 9, fontWeight: '800' }
                            }}
                            withInnerLines={true}
                            withOuterLines={false}
                            withHorizontalLines={true}
                            withVerticalLines={false}
                            style={{
                                marginVertical: 8,
                                borderRadius: 0,
                                paddingRight: 40
                            }}
                        />
                    </View>
                )}

                {/* ── Network Provisioning ── */}
                <View style={styles.provisioningHeader}>
                    <Text style={[styles.provisioningTitle, { color: textPrimary }]}>ACCOUNT PROVISIONING</Text>
                </View>

                <View style={[styles.provisionForm, { backgroundColor: bgSecondary, padding: 20, borderRadius: 4, borderWidth: 1, borderColor: borderSubtle }]}>
                    <View style={styles.formSection}>
                        <Text style={[styles.inputLabel, { color: textMuted }]}>ACCESS_ROLE</Text>
                        <View style={[styles.tabSwitcher, { backgroundColor: bgPrimary }]}>
                            {['SELLER', 'GARAGE', 'ADMIN'].map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.tabBtn, newUserRole.includes(r) && styles.tabBtnActive]}
                                    onPress={() => setNewUserRole(`ROLE_${r}` as any)}
                                >
                                    <Text style={[styles.tabBtnText, newUserRole.includes(r) ? styles.tabBtnTextActive : { color: textMuted }]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={[styles.inputLabel, { color: textMuted }]}>ENTITY_NAME</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.modernInput, { flex: 1, marginRight: 8, backgroundColor: bgPrimary, color: textPrimary, borderColor: borderSubtle }]}
                                placeholder="FIRST"
                                placeholderTextColor={textMuted}
                                value={newUserFirstName}
                                onChangeText={setNewUserFirstName}
                            />
                            <TextInput
                                style={[styles.modernInput, { flex: 1, backgroundColor: bgPrimary, color: textPrimary, borderColor: borderSubtle }]}
                                placeholder="LAST"
                                placeholderTextColor={textMuted}
                                value={newUserLastName}
                                onChangeText={setNewUserLastName}
                            />
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={[styles.inputLabel, { color: textMuted }]}>EMAIL_ENDPOINT</Text>
                        <TextInput
                            style={[styles.modernInput, { backgroundColor: bgPrimary, color: textPrimary, borderColor: borderSubtle }]}
                            placeholder="ADMIN@THEMADGARAGE.COM"
                            placeholderTextColor={textMuted}
                            value={newUserEmail}
                            onChangeText={setNewUserEmail}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formSection}>
                        <Text style={[styles.inputLabel, { color: textMuted }]}>PHONE_TERMINAL</Text>
                        <TextInput
                            style={[styles.modernInput, { backgroundColor: bgPrimary, color: textPrimary, borderColor: borderSubtle }]}
                            placeholder="+91-XXXXX-XXXXX"
                            placeholderTextColor={textMuted}
                            value={newUserPhone}
                            onChangeText={setNewUserPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.formSection}>
                        <Text style={[styles.inputLabel, { color: textMuted }]}>SECURE_ACCESS_KEY</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={[styles.modernInput, { flex: 1, backgroundColor: bgPrimary, color: textPrimary, borderColor: borderSubtle }]}
                                placeholder="••••••••"
                                placeholderTextColor={textMuted}
                                secureTextEntry={!showPassword}
                                value={newUserPassword}
                                onChangeText={setNewUserPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeToggle}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.activateBtn}
                        activeOpacity={0.85}
                        onPress={handleCreateUser}
                        disabled={creatingUser}
                    >
                        <LinearGradient
                            colors={['#F79C93', '#DF2324']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.activateBtnGradient}
                        >
                            {creatingUser ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.activateBtnText}>ACTIVATE CREDENTIALS</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    centerPanel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 13, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
    scrollArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 10 },

    // Custom Header
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
    headerIconBtn: { padding: 4 },
    headerProfileCircle: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    headerProfileImg: { width: '100%', height: '100%' },

    // Main Title Section
    mainTitleSection: { paddingHorizontal: 20, marginBottom: 25 },
    mainTitle: { fontSize: 34, fontWeight: '900', fontStyle: 'italic', lineHeight: 34, textTransform: 'uppercase', letterSpacing: -1 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#DF2324' },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    tpsBox: { flexDirection: 'row', alignItems: 'baseline', marginTop: 20, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1 },
    tpsLabel: { color: '#DF2324', fontSize: 10, fontWeight: '900', marginRight: 10 },
    tpsValue: { fontSize: 16, fontWeight: '900' },

    // Metric Cards
    newStatsContainer: { gap: 15 },
    metricCardWrapper: { borderRadius: 4, overflow: 'hidden', borderWidth: 1 },
    metricCard: { padding: 25 },
    metricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    metricId: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    metricValue: { fontSize: 42, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },

    // Operation Hubs
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

    // Provisioning
    provisioningHeader: { marginTop: 40, marginBottom: 20 },
    provisioningTitle: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 },
    provisionForm: { gap: 20 },
    formSection: { gap: 8 },
    inputLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    tabSwitcher: { flexDirection: 'row', borderRadius: 8, padding: 4, gap: 4 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#DF2324' },
    tabBtnText: { fontSize: 11, fontWeight: '900', fontStyle: 'italic' },
    tabBtnTextActive: { color: '#FFF' },
    modernInput: { paddingHorizontal: 15, paddingVertical: 14, borderRadius: 4, fontSize: 13, fontWeight: '800', borderWidth: 1 },
    inputRow: { flexDirection: 'row' },
    passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
    eyeToggle: { position: 'absolute', right: 15, height: '100%', justifyContent: 'center' },
    activateBtn: { marginTop: 10 },
    activateBtnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: 4 },
    activateBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },

    chartWrapper: { marginTop: 30, padding: 20, borderRadius: 4, borderWidth: 1 },
    activeNodeBadge: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(223,35,36,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(223,35,36,0.3)' },
    activeNodeText: { color: '#DF2324', fontSize: 9, fontWeight: '900' },
    chartStatus: { fontSize: 10, fontWeight: '800', marginBottom: 20 },

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

    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(223, 35, 36, 0.2)',
    },
    errorText: {
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 1,
    },
    errorSubtext: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
});
