import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { RouteProp } from '@react-navigation/native';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminUserManagement'>;
    route: RouteProp<RootStackParamList, 'AdminUserManagement'>;
};

export default function AdminUserManagementScreen({ navigation, route }: Props) {
    // Core State
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRole, setActiveRole] = useState(route.params?.roleFilter || 'ALL');

    // Revision State (Edit)
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '' });
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
    const [actionLoading, setActionLoading] = useState(false);

    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/admin/users/${editingUser.id}`, editForm);
            setEditingUser(null);
            fetchUsers();
            Alert.alert("Success", "Identity record updated.");
        } catch (error: any) {
            if (error.response?.status === 403) {
                Alert.alert("ACCOUNT DEACTIVATED", "Access to this Mad Garage profile has been purged by administration.");
            } else {
                Alert.alert("Revision Failed", error.response?.data || "Could not update user.");
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleRestore = async (id: number) => {
        setActionLoading(true);
        try {
            await apiClient.post(`/admin/users/${id}/restore`);
            fetchUsers();
            Alert.alert("RESTORED", "Identity record unscrambled and operator reactivated.");
        } catch (error: any) {
            Alert.alert("Restore Failed", error.response?.data || "Could not reactivate user.");
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || '',
            role: user.role
        });
    };

    const handleDelete = (id: number) => {
        Alert.alert("Delete Account", "Purge operator from active network? This will scramble identity records.", [
            { text: "Abort", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await apiClient.delete(`/admin/users/${id}`);
                        fetchUsers();
                    } catch (error: any) {
                        Alert.alert("Purge Failed", error.response?.data || "Could not remove user.");
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
        
        // Show based on status tab
        const matchesStatus = activeTab === 'ACTIVE' ? u.active !== false : u.active === false;
        return matchesRole && matchesSearch && matchesStatus;
    });

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={[styles.userCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
            <View style={styles.userHeader}>
                <View style={[styles.avatar, { backgroundColor: item.active === false ? '#7A7A8533' : '#DF232422' }]}>
                    <Text style={{ color: item.active === false ? '#7A7A85' : '#DF2324', fontWeight: '900' }}>
                        {(item.firstName?.[0] || 'U')}{(item.lastName?.[0] || '')}
                    </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: item.active === false ? T.subText : T.text }]}>{item.firstName} {item.lastName}</Text>
                    <Text style={[styles.userEmail, { color: T.subText }]} numberOfLines={1}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: item.active === false ? '#7A7A8522' : (item.role === 'ROLE_ADMIN' ? '#FFD70033' : '#DF232422') }]}>
                    <Text style={[styles.roleText, { color: item.active === false ? '#7A7A85' : (item.role === 'ROLE_ADMIN' ? '#B8860B' : '#DF2324') }]}>
                        {item.role?.replace('ROLE_', '')}
                    </Text>
                </View>
            </View>
            <View style={styles.userFooter}>
                {activeTab === 'ACTIVE' ? (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: T.inputBg }]}
                            onPress={() => openEditModal(item)}
                        >
                            <Ionicons name="create-outline" size={18} color={T.text} />
                            <Text style={[styles.actionText, { color: T.text }]}>Edit</Text>
                        </TouchableOpacity>
                        {item.role !== 'ROLE_ADMIN' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#DF232411' }]}
                                onPress={() => handleDelete(item.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#DF2324" />
                                <Text style={[styles.actionText, { color: '#DF2324' }]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#DF2324', flex: 1 }]}
                        onPress={() => handleRestore(item.id)}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Ionicons name="refresh-outline" size={18} color="#FFF" />
                                <Text style={[styles.actionText, { color: '#FFF' }]}>Restore Operator</Text>
                            </>
                        )}
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
                <TouchableOpacity 
                    style={[styles.addBtn, { backgroundColor: '#DF232411' }]}
                    onPress={() => navigation.navigate('AdminDashboard')}
                >
                    <Ionicons name="add" size={24} color="#DF2324" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('ACTIVE')}
                    style={[styles.tab, activeTab === 'ACTIVE' && { backgroundColor: '#DF2324' }]}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'ACTIVE' ? '#FFF' : T.subText }]}>ACTIVE</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('ARCHIVED')}
                    style={[styles.tab, activeTab === 'ARCHIVED' && { backgroundColor: '#DF2324' }]}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'ARCHIVED' ? '#FFF' : T.subText }]}>ARCHIVED</Text>
                </TouchableOpacity>
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
                {['ALL', 'ROLE_SELLER', 'ROLE_GARAGE', 'ROLE_CUSTOMER', 'ROLE_ADMIN'].map(role => (
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

            {/* Edit User Modal */}
            <Modal
                visible={!!editingUser}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditingUser(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: T.bg2 }]}>
                        <Text style={[styles.modalTitle, { color: T.text }]}>REVISION HUB</Text>
                        
                        {/* P1 REQ: Names are now static (read-only) for Admins */}
                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>NAME (STATIC)</Text>
                            <TextInput 
                                style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text, opacity: 0.6, marginBottom: 0 }]}
                                value={`${editForm.firstName} ${editForm.lastName}`}
                                editable={false}
                            />
                        </View>

                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>EMAIL (EDITABLE)</Text>
                        <TextInput 
                            style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text, marginBottom: 15 }]}
                            placeholder="Email"
                            placeholderTextColor={T.subText}
                            value={editForm.email}
                            onChangeText={txt => setEditForm({...editForm, email: txt})}
                            autoCapitalize="none"
                        />

                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>PHONE (EDITABLE)</Text>
                        <TextInput 
                            style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text, marginBottom: 15 }]}
                            placeholder="Phone"
                            placeholderTextColor={T.subText}
                            value={editForm.phone}
                            onChangeText={txt => setEditForm({...editForm, phone: txt})}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: T.inputBg }]}
                                onPress={() => setEditingUser(null)}
                            >
                                <Text style={[styles.modalBtnText, { color: T.text }]}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, { backgroundColor: '#DF2324' }]}
                                onPress={handleUpdateUser}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>SAVE</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 'auto' },
    title: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5, flex: 1 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    tabText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
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
    modalOverlay: { 
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 
    },
    modalContent: { 
        width: '100%', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
    },
    modalTitle: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', marginBottom: 20, textAlign: 'center' },
    modalInput: { padding: 16, borderRadius: 12, marginBottom: 15, fontWeight: '700', fontSize: 14 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    modalBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
});
