import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Alert, TextInput, Modal, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import * as Location from 'expo-location';

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
    const [editForm, setEditForm] = useState({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        role: '',
        isTieUp: false,
        city: '',
        state: '',
        address: '',
        floor: '',
        buildingName: '',
        pincode: '',
        latitude: '',
        longitude: ''
    });
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
    const [actionLoading, setActionLoading] = useState(false);

    // Provision State (New User)
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [provisionForm, setProvisionForm] = useState({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '',
        phone: '', 
        role: 'ROLE_SELLER',
        isTieUp: false,
        city: '',
        state: '',
        address: '',
        floor: '',
        buildingName: '',
        pincode: '',
        latitude: '',
        longitude: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();
    const currentUser = useAuthStore(state => state.user);
    const currentRole = useAuthStore(state => state.role);

    const [detecting, setDetecting] = useState(false);

    const detectLocation = async (isEdit: boolean) => {
        setDetecting(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location access is required to pin coordinates.");
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = location.coords;

            if (isEdit) {
                setEditForm({ ...editForm, latitude: latitude.toString(), longitude: longitude.toString() });
            } else {
                setProvisionForm({ ...provisionForm, latitude: latitude.toString(), longitude: longitude.toString() });
            }
            Alert.alert("Success", "Coordinates pinned from your current GPS position.");
        } catch (error) {
            Alert.alert("GPS Error", "Could not capture location. Ensure GPS is enabled.");
        } finally {
            setDetecting(false);
        }
    };

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

        if (editForm.role === 'ROLE_GARAGE' || editForm.role === 'ROLE_SELLER') {
            if (!editForm.address || !editForm.city || !editForm.state || !editForm.pincode) {
                Alert.alert("REVISION REJECTED", `${editForm.role === 'ROLE_GARAGE' ? 'Garage' : 'Seller'} profile must have complete address details (Street, City, State, Pincode).`);
                return;
            }
        }

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

    const handleProvision = async () => {
        if (!provisionForm.firstName || !provisionForm.lastName || !provisionForm.email || !provisionForm.password) {
            Alert.alert("Missing Data", "Name, Email, and Password are required.");
            return;
        }

        if (provisionForm.role === 'ROLE_GARAGE' || provisionForm.role === 'ROLE_SELLER') {
            if (!provisionForm.address || !provisionForm.city || !provisionForm.state || !provisionForm.pincode) {
                Alert.alert("BUSINESS ERROR", `Address, City, State, and Pincode are mandatory for all ${provisionForm.role === 'ROLE_GARAGE' ? 'Garages' : 'Sellers'}.`);
                return;
            }
        }
        setActionLoading(true);
        try {
            await apiClient.post('/admin/users', provisionForm);
            setShowProvisionModal(false);
            setProvisionForm({ 
                firstName: '', lastName: '', email: '', password: '', phone: '', role: 'ROLE_SELLER',
                isTieUp: false, city: '', state: '', address: '', floor: '', buildingName: '', pincode: '', latitude: '', longitude: ''
            });
            fetchUsers();
            Alert.alert("Success", "New operator provisioned into the network.");
        } catch (error: any) {
            Alert.alert("Provisioning Failed", error.response?.data?.message || error.response?.data || "Could not create user.");
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
            role: user.role,
            isTieUp: user.tieUp || false,
            city: user.city || '',
            state: user.state || '',
            address: user.address || '',
            floor: user.floor || '',
            buildingName: user.buildingName || '',
            pincode: user.pincode || '',
            latitude: user.latitude?.toString() || '',
            longitude: user.longitude?.toString() || ''
        });
    };

    const handleDelete = (id: number) => {
        if (currentRole !== 'ROLE_ADMIN') {
            Alert.alert("Access Denied", "Only administrators can purge accounts.");
            return;
        }
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

    const renderUserItem = ({ item }: { item: any }) => {
        const isWorkerTargetingHigher = currentRole === 'ROLE_WORKER' && (item.role === 'ROLE_ADMIN' || item.role === 'ROLE_WORKER');

        return (
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
                <View style={[styles.roleBadge, { backgroundColor: item.active === false ? '#7A7A8522' : (item.role === 'ROLE_ADMIN' ? '#FFD70033' : (item.role === 'ROLE_WORKER' ? '#FFBF0033' : '#DF232422')) }]}>
                    <Text style={[styles.roleText, { color: item.active === false ? '#7A7A85' : (item.role === 'ROLE_ADMIN' ? '#B8860B' : (item.role === 'ROLE_WORKER' ? '#FF8C00' : '#DF2324')) }]}>
                        {item.role?.replace('ROLE_', '')}
                    </Text>
                </View>
            </View>
            <View style={styles.userFooter}>
                {activeTab === 'ACTIVE' ? (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: T.inputBg, opacity: isWorkerTargetingHigher ? 0.3 : 1 }]}
                            onPress={() => openEditModal(item)}
                            disabled={isWorkerTargetingHigher}
                        >
                            <Ionicons name="create-outline" size={18} color={T.text} />
                            <Text style={[styles.actionText, { color: T.text }]}>Edit</Text>
                        </TouchableOpacity>
                        {item.role !== 'ROLE_ADMIN' && item.id.toString() !== currentUser?.id?.toString() && !isWorkerTargetingHigher && (
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
    };

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
                    onPress={() => setShowProvisionModal(true)}
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
                {['ALL', 'ROLE_WORKER', 'ROLE_SELLER', 'ROLE_GARAGE', 'ROLE_CUSTOMER', 'ROLE_ADMIN'].map(role => (
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
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', width: Dimensions.get('window').width - 40 }}>
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

                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>ASSIGNED ROLE</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                                {['ROLE_CUSTOMER', 'ROLE_SELLER', 'ROLE_GARAGE', 'ROLE_WORKER', 'ROLE_ADMIN']
                                    .filter(r => currentRole === 'ROLE_ADMIN' || (r !== 'ROLE_ADMIN' && r !== 'ROLE_WORKER'))
                                    .map(r => (
                                    <TouchableOpacity 
                                        key={r}
                                        style={[styles.roleTab, editForm.role === r && { backgroundColor: '#DF2324' }]}
                                        onPress={() => setEditForm({...editForm, role: r})}
                                    >
                                        <Text style={[styles.roleTabText, { color: editForm.role === r ? '#FFF' : T.subText }]}>
                                            {r.replace('ROLE_', '')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </View>

                        {(editForm.role === 'ROLE_GARAGE' || editForm.role === 'ROLE_SELLER') && (
                            <View style={{ marginTop: 10, padding: 15, backgroundColor: T.inputBg, borderRadius: 12, borderWidth: 1, borderColor: T.statBorder }}>
                                {editForm.role === 'ROLE_GARAGE' && currentRole === 'ROLE_ADMIN' && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                                        <View>
                                            <Text style={{ color: T.text, fontSize: 12, fontWeight: '900' }}>VERIFIED PARTNER</Text>
                                            <Text style={{ color: T.subText, fontSize: 9 }}>Enable for local fitting network</Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => setEditForm({...editForm, isTieUp: !editForm.isTieUp})}
                                            style={[styles.miniBtn, { backgroundColor: editForm.isTieUp ? '#DF2324' : T.statBorder }]}
                                        >
                                            <Ionicons name={editForm.isTieUp ? "checkbox" : "square-outline"} size={20} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>CITY</Text>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text }]}
                                            placeholder="Mumbai"
                                            placeholderTextColor={T.subText}
                                            value={editForm.city}
                                            onChangeText={txt => setEditForm({...editForm, city: txt})}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>STATE</Text>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text }]}
                                            placeholder="Maharashtra"
                                            placeholderTextColor={T.subText}
                                            value={editForm.state}
                                            onChangeText={txt => setEditForm({...editForm, state: txt})}
                                        />
                                    </View>
                                </View>

                                <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>STREET ADDRESS</Text>
                                <TextInput 
                                    style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, marginBottom: 15 }]}
                                    placeholder="e.g. 123 Racing St, Worli"
                                    placeholderTextColor={T.subText}
                                    value={editForm.address}
                                    onChangeText={txt => setEditForm({...editForm, address: txt})}
                                />

                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>BLDG NAME</Text>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text }]}
                                            placeholder="Building Name"
                                            placeholderTextColor={T.subText}
                                            value={editForm.buildingName}
                                            onChangeText={txt => setEditForm({...editForm, buildingName: txt})}
                                        />
                                    </View>
                                    <View style={{ width: 80 }}>
                                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>FLOOR</Text>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text }]}
                                            placeholder="3rd"
                                            placeholderTextColor={T.subText}
                                            value={editForm.floor}
                                            onChangeText={txt => setEditForm({...editForm, floor: txt})}
                                        />
                                    </View>
                                </View>

                                <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>PINCODE</Text>
                                <TextInput 
                                    style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, marginBottom: 15 }]}
                                    placeholder="400018"
                                    placeholderTextColor={T.subText}
                                    value={editForm.pincode}
                                    onChangeText={txt => setEditForm({...editForm, pincode: txt})}
                                    keyboardType="numeric"
                                />

                                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>LATITUDE</Text>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, marginBottom: 0 }]}
                                            placeholder="19.0760"
                                            placeholderTextColor={T.subText}
                                            value={editForm.latitude}
                                            onChangeText={txt => setEditForm({...editForm, latitude: txt})}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: T.subText, fontSize: 10, fontWeight: '900', marginBottom: 5 }}>LONGITUDE</Text>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, marginBottom: 0 }]}
                                            placeholder="72.8777"
                                            placeholderTextColor={T.subText}
                                            value={editForm.longitude}
                                            onChangeText={txt => setEditForm({...editForm, longitude: txt})}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        onPress={() => detectLocation(true)}
                                        disabled={detecting}
                                        style={[styles.miniBtn, { backgroundColor: '#DF2324', height: 44, width: 44, marginBottom: 0 }]}
                                    >
                                        {detecting ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="location" size={20} color="#FFF" />}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

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
                    </ScrollView>
                </View>
            </Modal>

            {/* Provision Modal */}
            <Modal
                visible={showProvisionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProvisionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', width: Dimensions.get('window').width - 40 }}>
                        <View style={[styles.modalContent, { backgroundColor: T.bg2 }]}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>PROVISION OPERATOR</Text>
                            
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 15 }}>
                                {['ROLE_SELLER', 'ROLE_GARAGE', 'ROLE_WORKER', 'ROLE_ADMIN']
                                    .filter(r => currentRole === 'ROLE_ADMIN' || (r !== 'ROLE_ADMIN' && r !== 'ROLE_WORKER'))
                                    .map(r => (
                                    <TouchableOpacity 
                                        key={r}
                                        style={[styles.roleTab, provisionForm.role === r && { backgroundColor: '#DF2324' }, { width: '47%', marginVertical: 2 }]}
                                        onPress={() => setProvisionForm({...provisionForm, role: r})}
                                    >
                                        <Text style={[styles.roleTabText, { color: provisionForm.role === r ? '#FFF' : T.subText, textAlign: 'center' }]}>
                                            {r.replace('ROLE_', '')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TextInput 
                                    style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text, flex: 1 }]}
                                    placeholder="First Name"
                                    placeholderTextColor={T.subText}
                                    value={provisionForm.firstName}
                                    onChangeText={txt => setProvisionForm({...provisionForm, firstName: txt})}
                                />
                                <TextInput 
                                    style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text, flex: 1 }]}
                                    placeholder="Last Name"
                                    placeholderTextColor={T.subText}
                                    value={provisionForm.lastName}
                                    onChangeText={txt => setProvisionForm({...provisionForm, lastName: txt})}
                                />
                            </View>

                            <TextInput 
                                style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text }]}
                                placeholder="Email"
                                placeholderTextColor={T.subText}
                                value={provisionForm.email}
                                onChangeText={txt => setProvisionForm({...provisionForm, email: txt})}
                                autoCapitalize="none"
                            />

                            <View style={{ position: 'relative' }}>
                                <TextInput 
                                    style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text }]}
                                    placeholder="Password"
                                    placeholderTextColor={T.subText}
                                    value={provisionForm.password}
                                    onChangeText={txt => setProvisionForm({...provisionForm, password: txt})}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity 
                                    style={{ position: 'absolute', right: 15, top: 15 }}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={T.subText} />
                                </TouchableOpacity>
                            </View>

                            <TextInput 
                                style={[styles.modalInput, { backgroundColor: T.inputBg, color: T.text }]}
                                placeholder="Phone"
                                placeholderTextColor={T.subText}
                                value={provisionForm.phone}
                                onChangeText={txt => setProvisionForm({...provisionForm, phone: txt})}
                                keyboardType="phone-pad"
                            />

                            {(provisionForm.role === 'ROLE_GARAGE' || provisionForm.role === 'ROLE_SELLER') && (
                                <View style={{ marginTop: 10, padding: 15, backgroundColor: T.inputBg, borderRadius: 12, borderWidth: 1, borderColor: T.statBorder }}>
                                    {provisionForm.role === 'ROLE_GARAGE' && currentRole === 'ROLE_ADMIN' && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                                            <View>
                                                <Text style={{ color: T.text, fontSize: 12, fontWeight: '900' }}>AUTO-VERIFY TIE-UP</Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => setProvisionForm({...provisionForm, isTieUp: !provisionForm.isTieUp})}
                                                style={[styles.miniBtn, { backgroundColor: provisionForm.isTieUp ? '#DF2324' : T.statBorder }]}
                                            >
                                                <Ionicons name={provisionForm.isTieUp ? "checkbox" : "square-outline"} size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, flex: 1 }]}
                                            placeholder="City"
                                            placeholderTextColor={T.subText}
                                            value={provisionForm.city}
                                            onChangeText={txt => setProvisionForm({...provisionForm, city: txt})}
                                        />
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, flex: 1 }]}
                                            placeholder="State"
                                            placeholderTextColor={T.subText}
                                            value={provisionForm.state}
                                            onChangeText={txt => setProvisionForm({...provisionForm, state: txt})}
                                        />
                                    </View>
                                    <TextInput 
                                        style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, marginBottom: 15 }]}
                                        placeholder="Address"
                                        placeholderTextColor={T.subText}
                                        value={provisionForm.address}
                                        onChangeText={txt => setProvisionForm({...provisionForm, address: txt})}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, flex: 1 }]}
                                            placeholder="Building Name"
                                            placeholderTextColor={T.subText}
                                            value={provisionForm.buildingName}
                                            onChangeText={txt => setProvisionForm({...provisionForm, buildingName: txt})}
                                        />
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, width: 80 }]}
                                            placeholder="Floor"
                                            placeholderTextColor={T.subText}
                                            value={provisionForm.floor}
                                            onChangeText={txt => setProvisionForm({...provisionForm, floor: txt})}
                                        />
                                    </View>
                                    <TextInput 
                                        style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, marginBottom: 15 }]}
                                        placeholder="Pincode"
                                        placeholderTextColor={T.subText}
                                        value={provisionForm.pincode}
                                        onChangeText={txt => setProvisionForm({...provisionForm, pincode: txt})}
                                        keyboardType="numeric"
                                    />
                                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, flex: 1, marginBottom: 0 }]}
                                            placeholder="Lat"
                                            placeholderTextColor={T.subText}
                                            value={provisionForm.latitude}
                                            onChangeText={txt => setProvisionForm({...provisionForm, latitude: txt})}
                                        />
                                        <TextInput 
                                            style={[styles.modalInput, { backgroundColor: T.statBg, color: T.text, flex: 1, marginBottom: 0 }]}
                                            placeholder="Long"
                                            placeholderTextColor={T.subText}
                                            value={provisionForm.longitude}
                                            onChangeText={txt => setProvisionForm({...provisionForm, longitude: txt})}
                                        />
                                        <TouchableOpacity 
                                            onPress={() => detectLocation(false)}
                                            disabled={detecting}
                                            style={[styles.miniBtn, { backgroundColor: '#DF2324', height: 44, width: 44, marginBottom: 0 }]}
                                        >
                                            {detecting ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="location" size={20} color="#FFF" />}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <View style={styles.modalActions}>
                                <TouchableOpacity 
                                    style={[styles.modalBtn, { backgroundColor: T.inputBg }]}
                                    onPress={() => setShowProvisionModal(false)}
                                >
                                    <Text style={[styles.modalBtnText, { color: T.text }]}>ABORT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modalBtn, { backgroundColor: '#DF2324' }]}
                                    onPress={handleProvision}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>PROVISION</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
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
        backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', padding: 20 
    },
    modalContent: { 
        width: '100%', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
    },
    modalTitle: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', marginBottom: 20, textAlign: 'center' },
    modalInput: { padding: 16, borderRadius: 12, marginBottom: 15, fontWeight: '700', fontSize: 14 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    modalBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
    miniBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});
