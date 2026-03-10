import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SellerDashboard'>;
};

export default function SellerDashboardScreen({ navigation }: Props) {
    const logout = useAuthStore((state) => state.logout);
    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />

            {/* Header */}
            <View style={styles.headerRow}>
                <View>
                    <Text style={[styles.title, { color: '#FF3333' }]}>Merchant Hub</Text>
                    <Text style={[styles.subtitle, { color: T.subText }]}>Inventory & Analytics</Text>
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
                <View style={[styles.statCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                    <Ionicons name="cube-outline" size={32} color="#FF3333" />
                    <Text style={[styles.statNumber, { color: T.text }]}>14</Text>
                    <Text style={[styles.statLabel, { color: T.subText }]}>Active Listings</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                    <Ionicons name="cash-outline" size={32} color="#FF3333" />
                    <Text style={[styles.statNumber, { color: T.text }]}>$8,402</Text>
                    <Text style={[styles.statLabel, { color: T.subText }]}>Month Revenue</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddProduct' as any)}>
                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                <Text style={styles.addButtonText}>List New Part</Text>
            </TouchableOpacity>

            <View style={styles.actionSection}>
                <Text style={[styles.sectionTitle, { color: T.sectionTitle }]}>Recent Orders (Requires Shipment)</Text>

                <View style={[styles.orderCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                    <View style={styles.orderHeader}>
                        <Text style={[styles.orderId, { color: T.subText }]}>ORD-8829-X</Text>
                        <Text style={styles.orderStatus}>Pending Drop</Text>
                    </View>
                    <Text style={[styles.orderItem, { color: T.text }]}>1x Antimatter Injector</Text>
                    <Text style={styles.orderPrice}>$1,200.00</Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: T.logoutBg }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FF3333" />
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
        marginBottom: 30,
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
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    statNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 10 },
    statLabel: { fontSize: 12, marginTop: 5 },
    addButton: {
        backgroundColor: '#FF3333',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    actionSection: { marginBottom: 40 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    orderCard: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: '#FF3333',
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: 12 },
    orderStatus: { color: '#FF3333', fontSize: 12, fontWeight: 'bold' },
    orderItem: { fontSize: 16, marginBottom: 5 },
    orderPrice: { color: '#FF3333', fontWeight: 'bold', fontSize: 16 },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF3333',
        marginTop: 20,
        marginBottom: 40,
    },
    logoutText: { color: '#FF3333', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
