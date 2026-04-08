import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { RouteProp } from '@react-navigation/native';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminUserManagement'>;
    route: RouteProp<RootStackParamList, 'AdminUserManagement'>;
};

export default function AdminUserManagementScreen({ navigation, route }: Props) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRole, setActiveRole] = useState(route.params?.roleFilter || 'ALL');

    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // Fallback for demo
            setUsers([
                { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@madgarage.com', role: 'ROLE_ADMIN' },
                { id: 2, firstName: 'John', lastName: 'Seller', email: 'john@seller.com', role: 'ROLE_SELLER' },
                { id: 3, firstName: 'Alice', lastName: 'Garage', email: 'alice@garage.com', role: 'ROLE_GARAGE' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert("Ban User", "Permanently remove this user from the MAD GARAGE network?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Ban",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await apiClient.delete(`/admin/users/${id}`);
                        fetchUsers();
                    } catch (error: any) {
                        Alert.alert("Error", error.response?.data || "Could not remove user.");
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = activeRole === 'ALL' || u.role === activeRole;
        const fullName = (u.firstName || '') + ' ' + (u.lastName || '');
        const matchesSearch = (fullName + ' ' + (u.email || '')).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={[styles.userCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
            <View style={styles.userHeader}>
                <View style={[styles.avatar, { backgroundColor: '#DF232422' }]}>
                    <Text style={{ color: '#DF2324', fontWeight: '900' }}>
                        {(item.firstName?.[0] || 'U')}{(item.lastName?.[0] || '')}
                    </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: T.text }]}>{item.firstName} {item.lastName}</Text>
                    <Text style={[styles.userEmail, { color: T.subText }]}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: item.role === 'ROLE_ADMIN' ? '#FFD70033' : '#DF232422' }]}>
                    <Text style={[styles.roleText, { color: item.role === 'ROLE_ADMIN' ? '#B8860B' : '#DF2324' }]}>
                        {item.role?.replace('ROLE_', '')}
                    </Text>
                </View>
            </View>
            <View style={styles.userFooter}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: T.inputBg }]}
                    onPress={() => Alert.alert("Feature Coming Soon", "User detail view is in development.")}
                >
                    <Ionicons name="eye-outline" size={18} color={T.text} />
                    <Text style={[styles.actionText, { color: T.text }]}>View</Text>
                </TouchableOpacity>
                {item.role !== 'ROLE_ADMIN' && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#DF232411' }]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#DF2324" />
                        <Text style={[styles.actionText, { color: '#DF2324' }]}>Disable</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: T.bg2, paddingTop: Math.max(insets.top, 8) }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#DF2324" />
                </TouchableOpacity>
                <Text style={[styles.title, { color: T.text }]}>Network Access</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder, borderWidth: 1 }]}>
                    <Ionicons name="search" size={18} color={T.subText} />
                    <TextInput 
                        style={[styles.searchInput, { color: T.text }]}
                        placeholder="Search users..."
                        placeholderTextColor={T.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filterContainer}>
                {['ALL', 'ROLE_SELLER', 'ROLE_GARAGE', 'ROLE_ADMIN'].map(role => (
                    <TouchableOpacity 
                        key={role}
                        style={[styles.roleTab, activeRole === role && { backgroundColor: '#DF2324' }]}
                        onPress={() => setActiveRole(role)}
                    >
                        <Text style={[styles.roleTabText, { color: activeRole === role ? '#FFF' : T.subText }]}>
                            {role === 'ALL' ? 'ALL' : role.replace('ROLE_', '')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={T.subText} />
                            <Text style={[styles.emptyText, { color: T.subText }]}>No users found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
    searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 12, height: 50, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    roleTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F0F0F022' },
    roleTabText: { fontSize: 11, fontWeight: '800' },
    list: { padding: 20, paddingBottom: 100 },
    userCard: { padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2 },
    userHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    userName: { fontSize: 16, fontWeight: '800' },
    userEmail: { fontSize: 13, fontWeight: '600' },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleText: { fontSize: 10, fontWeight: '900' },
    userFooter: { flexDirection: 'row', marginTop: 16, gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    actionText: { fontSize: 12, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '800' },
});
