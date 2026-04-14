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
    const [loading, setLoading] = useState(true);
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

    const bgPrimary = isDark ? '#121212' : '#F5F6F8';
    const bgSecondary = isDark ? '#1A1A1A' : '#FFFFFF';
    const textPrimary = isDark ? '#FFFFFF' : '#1A1A1A';
    const textMuted = isDark ? '#7A7A85' : '#8A8A95';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const cardGlow = isDark ? 'rgba(223, 35, 36, 0.15)' : 'rgba(223, 35, 36, 0.05)';
    const inputBg = isDark ? '#242424' : '#EFEFF4';

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await apiClient.get('/admin/analytics');
            setStats(response.data);
        } catch (error) {
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
            Alert.alert('Creation Failed', error.response?.data || error.message);
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
            <View style={[styles.customHeader, { paddingTop: 10 }]}>
                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: bgSecondary, borderWidth: 1, borderColor: borderSubtle }]} onPress={toggleTheme}>
                    <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#FFD700' : '#5B5BFF'} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={[styles.headerLogoWrap, { borderColor: cardGlow }]}>
                        <Image
                            source={require('../../assets/app_logo.png')}
                            style={styles.headerLogo}
                            resizeMode="cover"
                        />
                    </View>
                    <Text style={[styles.headerTitle, { color: textPrimary }]}>MAD GARAGE</Text>
                    <Text style={[styles.headerSubtitle, { color: '#DF2324' }]}>MAIN CONTROL FRAME</Text>
                </View>

                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: '#DF2324' }]} onPress={() => setShowProfileMenu(!showProfileMenu)}>
                    <Ionicons name="person" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {showProfileMenu && (
                <View style={[styles.profileMenu, { backgroundColor: bgSecondary, borderColor: borderSubtle, top: 110, right: 20 }]}>
                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('AdminProfile'); }}
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
                <View style={styles.statsGrid}>
                    {[
                        { icon: 'people-outline', value: stats?.totalUsers || 0, label: 'TOTAL USERS', route: 'AdminUserManagement', params: { roleFilter: 'ALL' } },
                        { icon: 'cube-outline', value: stats?.totalProducts || 0, label: 'DATABASED PARTS', route: 'AdminInventoryManagement' },
                        { icon: 'cash-outline', value: stats?.totalRevenue ? '₹' + (stats.totalRevenue / 1000).toFixed(1) + 'k' : '₹0', label: 'GROSS INCOME', route: 'AdminOrderManagement' },
                        { icon: 'documents-outline', value: 'VIEW', label: 'PART REQUESTS', route: 'AdminRequests' },
                    ].map((s: any, idx) => (
                        <TouchableOpacity
                            key={s.label}
                            activeOpacity={0.8}
                            style={[
                                styles.statCardOuter,
                                { width: '48%', marginTop: idx >= 2 ? 16 : 0 }
                            ]}
                            onPress={() => navigation.navigate(s.route, s.params)}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1A1A1A', '#1A1A1A'] : ['#FFFFFF', '#F8F9FA']}
                                style={[styles.statCard, { borderColor: cardGlow }]}
                            >
                                <View style={[styles.iconRing, { borderColor: cardGlow }]}>
                                    <Ionicons name={s.icon} size={24} color="#DF2324" />
                                </View>
                                <Text style={[styles.statNumber, { color: textPrimary, fontSize: typeof s.value === 'string' && s.value === 'VIEW' ? 18 : 26, marginTop: typeof s.value === 'string' && s.value === 'VIEW' ? 6 : 0 }]}>{s.value}</Text>
                                <Text style={[styles.statLabel, { color: textMuted }]}>{s.label}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Operation Hubs ── */}
                <View style={styles.boardHeader}>
                    <Text style={[styles.boardTitle, { color: textPrimary }]}>CORE OPERATIONS</Text>
                    <Text style={[styles.boardBadge, { color: '#8A8A95', backgroundColor: 'rgba(255,255,255,0.05)' }]}>MODULES</Text>
                </View>

                <View style={styles.hubContainer}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.hubCardOuter}
                        onPress={() => navigation.navigate('AdminOrderManagement')}
                    >
                        <LinearGradient
                            colors={isDark ? ['#1A1A1A', '#1A1A1A'] : ['#FCF5F5', '#F5EAEA']}
                            style={[styles.hubCard, { borderColor: isDark ? 'rgba(223, 35, 36, 0.4)' : 'rgba(223, 35, 36, 0.2)' }]}
                        >
                            <Ionicons name="cart-outline" size={32} color="#DF2324" style={styles.hubIcon} />
                            <Text style={[styles.hubTitle, { color: textPrimary }]}>ORDER PIPELINE</Text>
                            <Text style={[styles.hubSubtitle, { color: '#DF2324' }]}>AUDIT BILLING</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.hubCardOuter}
                        onPress={() => navigation.navigate('AdminInventoryManagement')}
                    >
                        <LinearGradient
                            colors={isDark ? ['#1A1A1A', '#1A1A1A'] : ['#F5F5FC', '#EAEAF5']}
                            style={[styles.hubCard, { borderColor: isDark ? 'rgba(91, 91, 255, 0.3)' : 'rgba(91, 91, 255, 0.2)' }]}
                        >
                            <Ionicons name="car-sport-outline" size={32} color="#5B5BFF" style={styles.hubIcon} />
                            <Text style={[styles.hubTitle, { color: textPrimary }]}>GARAGE INVENTORY</Text>
                            <Text style={[styles.hubSubtitle, { color: '#5B5BFF' }]}>CONTROL CATALOG</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.hubCardOuter}
                        onPress={() => navigation.navigate('AdminVehicleManagement')}
                    >
                        <LinearGradient
                            colors={isDark ? ['#1A1A1A', '#1A1A1A'] : ['#F0FAF5', '#E0F5EA']}
                            style={[styles.hubCard, { borderColor: isDark ? 'rgba(40, 167, 69, 0.3)' : 'rgba(40, 167, 69, 0.2)' }]}
                        >
                            <Ionicons name="car-outline" size={32} color="#28A745" style={styles.hubIcon} />
                            <Text style={[styles.hubTitle, { color: textPrimary }]}>VEHICLE DB</Text>
                            <Text style={[styles.hubSubtitle, { color: '#28A745' }]}>{stats?.totalVehicles || 0} RECORDS</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ── Revenue Chart ── */}
                {stats && stats.sixMonthRevenue && stats.sixMonthRevenue.length > 0 && (
                    <View style={styles.chartWrapper}>
                        <View style={styles.boardHeader}>
                            <Text style={[styles.boardTitle, { color: textPrimary }]}>REVENUE TRAJECTORY</Text>
                            <Text style={[styles.boardBadge, { color: '#DF2324', backgroundColor: 'rgba(223,35,36,0.1)' }]}>6 MONTHS</Text>
                        </View>
                        <LinearGradient
                            colors={isDark ? ['#1A1A1A', '#1A1A1A'] : ['#FFFFFF', '#F9F9F9']}
                            style={[styles.chartInner, { borderColor: borderSubtle }]}
                        >
                            <LineChart
                                data={{
                                    labels: ["M-5", "M-4", "M-3", "M-2", "M-1", "NOW"],
                                    datasets: [{ data: stats.sixMonthRevenue }]
                                }}
                                width={screenWidth - 64} // padding accounts
                                height={200}
                                yAxisLabel="₹"
                                yAxisSuffix="k"
                                formatYLabel={(yValue) => (parseFloat(yValue) / 1000).toFixed(0)}
                                chartConfig={{
                                    backgroundColor: 'transparent',
                                    backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
                                    backgroundGradientFromOpacity: 0,
                                    backgroundGradientTo: isDark ? '#1A1A1A' : '#F9F9F9',
                                    backgroundGradientToOpacity: 0,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(223, 35, 36, ${opacity})`,
                                    labelColor: (opacity = 1) => isDark ? `rgba(255,255,255,0.6)` : `rgba(0,0,0,0.6)`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "5", strokeWidth: "2", stroke: isDark ? "#000" : "#FFF" },
                                    propsForLabels: { fontSize: 10, fontWeight: '800' }
                                }}
                                bezier
                                style={{ paddingRight: 32 }}
                            />
                        </LinearGradient>
                    </View>
                )}

                {/* ── Network Provisioning ── */}
                <View style={styles.boardHeader}>
                    <Text style={[styles.boardTitle, { color: textPrimary }]}>ACCOUNT PROVISIONING</Text>
                    <Text style={[styles.boardBadge, { color: '#DF2324', backgroundColor: 'rgba(223,35,36,0.1)' }]}>SECURE</Text>
                </View>

                <LinearGradient
                    colors={isDark ? ['#1A1A1A', '#1A1A1A'] : ['#FFFFFF', '#FAFAFA']}
                    style={[styles.provisionForm, { borderColor: cardGlow }]}
                >
                    <View style={[styles.roleSwitch, { backgroundColor: inputBg }]}>
                        <TouchableOpacity
                            style={[styles.roleBtn, newUserRole === 'ROLE_SELLER' && styles.roleBtnActive]}
                            onPress={() => setNewUserRole('ROLE_SELLER')}
                        >
                            <Text style={[styles.roleBtnText, { color: textMuted }, newUserRole === 'ROLE_SELLER' && { color: '#FFF' }]}>SELLER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleBtn, newUserRole === 'ROLE_GARAGE' && styles.roleBtnActive]}
                            onPress={() => setNewUserRole('ROLE_GARAGE')}
                        >
                            <Text style={[styles.roleBtnText, { color: textMuted }, newUserRole === 'ROLE_GARAGE' && { color: '#FFF' }]}>GARAGE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleBtn, newUserRole === 'ROLE_ADMIN' && styles.roleBtnAdmin]}
                            onPress={() => setNewUserRole('ROLE_ADMIN')}
                        >
                            <Text style={[styles.roleBtnText, { color: textMuted }, newUserRole === 'ROLE_ADMIN' && { color: '#FFF' }]}>ADMIN</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary }]}
                        placeholder="First Name"
                        placeholderTextColor={textMuted}
                        value={newUserFirstName}
                        onChangeText={setNewUserFirstName}
                    />
                    <TextInput
                        style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary }]}
                        placeholder="Last Name"
                        placeholderTextColor={textMuted}
                        value={newUserLastName}
                        onChangeText={setNewUserLastName}
                    />
                    <TextInput
                        style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary }]}
                        placeholder="Operator Email"
                        placeholderTextColor={textMuted}
                        value={newUserEmail}
                        onChangeText={setNewUserEmail}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary }]}
                        placeholder="Secure Phone Terminal"
                        placeholderTextColor={textMuted}
                        value={newUserPhone}
                        onChangeText={setNewUserPhone}
                        keyboardType="phone-pad"
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.formInput, { backgroundColor: inputBg, color: textPrimary, flex: 1, marginBottom: 0 }]}
                            placeholder="Root Password (Optional)"
                            placeholderTextColor={textMuted}
                            secureTextEntry={!showPassword}
                            value={newUserPassword}
                            onChangeText={setNewUserPassword}
                        />
                        <TouchableOpacity 
                            style={styles.eyeBtn} 
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={textMuted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.provisionBtnWrap}
                        activeOpacity={0.85}
                        onPress={handleCreateUser}
                        disabled={creatingUser}
                    >
                        <LinearGradient
                            colors={['#DF2324', '#B01011']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.provisionBtn}
                        >
                            {creatingUser ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="finger-print" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.provisionBtnText}>PROVISION {newUserRole.replace('ROLE_', '')}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    centerPanel: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 13, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
    scrollArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 10 },

    // Custom Header
    customHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    headerLogoWrap: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 8,
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        backgroundColor: 'transparent',
    },
    headerLogo: {
        width: '100%',
        height: '100%',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 2,
        marginTop: 2,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    profileMenuText: { fontSize: 13, fontWeight: '800' },
    profileMenuDivider: { height: 1, marginHorizontal: 12 },

    // Boards & Headers
    boardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
        marginTop: 24,
    },
    boardTitle: { fontSize: 16, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1.5 },
    boardBadge: { fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: 'hidden' },

    // Metrics Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCardOuter: { borderRadius: 16, width: '48%' },
    statCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconRing: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(223, 35, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
    },
    statNumber: { fontSize: 26, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 4 },
    statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

    // Hubs
    hubContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    hubCardOuter: { flex: 1, borderRadius: 16 },
    hubCard: {
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hubIcon: { marginBottom: 12 },
    hubTitle: { fontSize: 9, fontWeight: '900', fontStyle: 'italic', letterSpacing: 0.5, textAlign: 'center', marginBottom: 6 },
    hubSubtitle: { fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },

    // Chart
    chartWrapper: { marginTop: 16 },
    chartInner: {
        paddingVertical: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },

    // Provisioning Form
    provisionForm: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
    },
    roleSwitch: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 12,
        marginBottom: 24,
    },
    roleBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 8,
    },
    roleBtnActive: { backgroundColor: '#DF2324' },
    roleBtnAdmin: { backgroundColor: '#7A00E6' },
    roleBtnText: {
        fontSize: 11,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 2,
    },
    formInput: {
        padding: 18,
        borderRadius: 12,
        marginBottom: 16,
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    eyeBtn: {
        position: 'absolute',
        right: 18,
        height: '100%',
        justifyContent: 'center',
    },
    provisionBtnWrap: {
        borderRadius: 12,
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
        marginTop: 12,
    },
    provisionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 12,
    },
    provisionBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: 2,
    },
});
