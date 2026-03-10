import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, TextInput, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';
import { LineChart } from 'react-native-chart-kit';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;
};

interface AdminStats {
    totalUsers: number;
    totalSellers: number;
    totalRevenue: number;
    sixMonthRevenue: number[];
}

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen({ navigation }: Props) {
    const logout = useAuthStore((state) => state.logout);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'SELLER' | 'GARAGE'>('SELLER');
    const [creatingUser, setCreatingUser] = useState(false);

    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

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
        if (!newUserEmail || !newUserPassword) {
            Alert.alert('Error', 'Email and Password are required');
            return;
        }
        setCreatingUser(true);
        try {
            await apiClient.post('/admin/users', {
                firstName: 'New',
                lastName: newUserRole === 'SELLER' ? 'Merchant' : 'Garage',
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole
            });
            Alert.alert('Success', `${newUserRole} account created!`);
            setNewUserEmail('');
            setNewUserPassword('');
            fetchAnalytics();
        } catch (error: any) {
            Alert.alert('Creation Failed', error.response?.data || error.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: T.bg2, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FF3333" />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />

            {/* Header */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={[styles.title, { color: '#FF3333' }]}>System Override</Text>
                    <Text style={[styles.subtitle, { color: T.subText }]}>Admin Control Panel</Text>
                </View>
                <TouchableOpacity
                    style={[styles.themeBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                    onPress={toggleTheme}
                >
                    <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#FFD700' : '#5B5BFF'} />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                {[
                    { icon: 'people-outline', value: stats?.totalUsers || 0, label: 'Total Users' },
                    { icon: 'briefcase-outline', value: stats?.totalSellers || 0, label: 'Sellers' },
                    { icon: 'cash-outline', value: stats?.totalRevenue ? '$' + (stats.totalRevenue / 1000).toFixed(1) + 'k' : '$0', label: 'Revenue' },
                ].map((s) => (
                    <View key={s.label} style={[styles.statCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                        <Ionicons name={s.icon as any} size={28} color="#FF3333" />
                        <Text style={[styles.statNumber, { color: T.text }]}>{s.value}</Text>
                        <Text style={[styles.statLabel, { color: T.subText }]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            <Text style={[styles.sectionTitle, { color: T.sectionTitle }]}>Network Revenue</Text>
            {stats && stats.sixMonthRevenue && stats.sixMonthRevenue.length > 0 && (
                <View style={styles.chartContainer}>
                    <LineChart
                        data={{
                            labels: ["M-5", "M-4", "M-3", "M-2", "M-1", "Now"],
                            datasets: [{ data: stats.sixMonthRevenue }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisLabel="$"
                        yAxisSuffix="k"
                        formatYLabel={(yValue) => (parseFloat(yValue) / 1000).toFixed(0)}
                        chartConfig={{
                            backgroundColor: T.statBg,
                            backgroundGradientFrom: T.statBg,
                            backgroundGradientTo: T.statBg,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 51, 51, ${opacity})`,
                            labelColor: (opacity = 1) => isDark ? `rgba(255,255,255,${opacity})` : `rgba(26,26,26,${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "6", strokeWidth: "2", stroke: "#FF3333" }
                        }}
                        bezier
                        style={{ borderRadius: 16 }}
                    />
                </View>
            )}

            {/* Provision Form */}
            <View style={styles.actionSection}>
                <Text style={[styles.sectionTitle, { color: T.sectionTitle }]}>Provision B2B Account</Text>
                <View style={[styles.formContainer, { backgroundColor: T.formBg, borderColor: T.formBorder }]}>
                    <View style={[styles.roleToggle, { backgroundColor: T.roleBg, borderColor: T.roleBorder }]}>
                        <TouchableOpacity
                            style={[styles.roleSelectBtn, newUserRole === 'SELLER' && styles.roleActive]}
                            onPress={() => setNewUserRole('SELLER')}
                        >
                            <Text style={[styles.roleSelectText, { color: T.subText }, newUserRole === 'SELLER' && { color: '#FFF' }]}>SELLER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleSelectBtn, newUserRole === 'GARAGE' && styles.roleActive]}
                            onPress={() => setNewUserRole('GARAGE')}
                        >
                            <Text style={[styles.roleSelectText, { color: T.subText }, newUserRole === 'GARAGE' && { color: '#FFF' }]}>GARAGE</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.input, { backgroundColor: T.inputFieldBg, color: T.text, borderColor: T.inputFieldBorder }]}
                        placeholder="Enterprise Email"
                        placeholderTextColor={T.placeholder}
                        value={newUserEmail}
                        onChangeText={setNewUserEmail}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: T.inputFieldBg, color: T.text, borderColor: T.inputFieldBorder }]}
                        placeholder="Secure Password"
                        placeholderTextColor={T.placeholder}
                        secureTextEntry
                        value={newUserPassword}
                        onChangeText={setNewUserPassword}
                    />

                    <TouchableOpacity style={styles.approveButton} onPress={handleCreateUser} disabled={creatingUser}>
                        {creatingUser ? (
                            <ActivityIndicator color="#FF3333" />
                        ) : (
                            <Text style={styles.approveText}>PROVISION {newUserRole}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: T.logoutBg }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF3366" />
                <Text style={styles.logoutText}>Terminate Session</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    themeBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
    subtitle: { fontSize: 16, letterSpacing: 1 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: {
        flex: 1,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    statNumber: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
    statLabel: { fontSize: 10, marginTop: 5, textTransform: 'uppercase' },
    chartContainer: { marginBottom: 30, alignItems: 'center' },
    actionSection: { marginBottom: 40 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    formContainer: { padding: 15, borderRadius: 10, borderWidth: 1 },
    roleToggle: { flexDirection: 'row', marginBottom: 15, borderRadius: 8, padding: 4, borderWidth: 1 },
    roleSelectBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    roleActive: { backgroundColor: '#FF3333' },
    roleSelectText: { fontWeight: 'bold', letterSpacing: 1 },
    input: { padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1 },
    approveButton: {
        backgroundColor: '#FF333322',
        paddingVertical: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF3333',
        alignItems: 'center',
        marginTop: 10,
    },
    approveText: { color: '#FF3333', fontWeight: 'bold', letterSpacing: 1 },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF3333',
        marginBottom: 40,
    },
    logoutText: { color: '#FF3333', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
