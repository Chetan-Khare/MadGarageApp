import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, TextInput, Modal, Alert, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminCouponManagement'>;

interface Coupon {
    id: number;
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountAmount: number;
    minOrderAmount: number;
    usageLimit: number;
    usedCount: number;
    startDate: any;
    endDate: any;
    active: boolean;
}

export default function AdminCouponManagementScreen({ navigation }: Props) {
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        discountAmount: '',
        minOrderAmount: '',
        usageLimit: '1',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await apiClient.get('/coupons/admin/all');
            setCoupons(response.data);
        } catch (err) {
            console.error('Failed to fetch coupons:', err);
            Alert.alert('Error', 'Failed to retrieve coupon data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleStatus = async (coupon: Coupon) => {
        try {
            const payload = { ...coupon, isActive: !coupon.active };
            await apiClient.put(`/coupons/admin/${coupon.id}`, payload);
            fetchCoupons();
        } catch (err) {
            Alert.alert('Operation Failed', 'Could not update coupon status.');
        }
    };

    const handleSubmit = async () => {
        if (!formData.code || !formData.description || !formData.discountAmount) {
            Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
            return;
        }

        try {
            const payload = {
                ...formData,
                discountAmount: Number(formData.discountAmount),
                minOrderAmount: Number(formData.minOrderAmount || 0),
                usageLimit: Number(formData.usageLimit),
                startDate: `${formData.startDate}T00:00:00`,
                endDate: `${formData.endDate}T23:59:59`
            };

            if (editingCoupon) {
                await apiClient.put(`/coupons/admin/${editingCoupon.id}`, payload);
            } else {
                await apiClient.post('/coupons/admin', payload);
            }
            
            setIsModalOpen(false);
            resetForm();
            fetchCoupons();
            Alert.alert('Success', `Coupon ${editingCoupon ? 'updated' : 'provisioned'} successfully.`);
        } catch (err) {
            Alert.alert('Submission Error', 'Check your parameters and try again.');
        }
    };

    const resetForm = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            description: '',
            discountType: 'PERCENTAGE',
            discountAmount: '',
            minOrderAmount: '',
            usageLimit: '1',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true
        });
    };

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountAmount: coupon.discountAmount.toString(),
            minOrderAmount: (coupon.minOrderAmount || 0).toString(),
            usageLimit: (coupon.usageLimit || 1).toString(),
            startDate: parseDate(coupon.startDate),
            endDate: parseDate(coupon.endDate),
            isActive: coupon.active
        });
        setIsModalOpen(true);
    };

    const parseDate = (dateVal: any) => {
        if (!dateVal) return '';
        if (Array.isArray(dateVal)) {
            const y = dateVal[0];
            const m = String(dateVal[1]).padStart(2, '0');
            const d = String(dateVal[2]).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return dateVal.split('T')[0];
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderCouponCard = ({ item }: { item: Coupon }) => (
        <View style={[styles.card, { backgroundColor: T.card, borderColor: item.active ? T.cardBorder : '#FF444422' }]}>
            <View style={styles.cardHeader}>
                <View style={styles.codeRow}>
                    <View style={styles.iconBox}>
                        <Ionicons name="pricetag" size={18} color="#DF2324" />
                    </View>
                    <View>
                        <Text style={[styles.cardCode, { color: T.text }]}>{item.code}</Text>
                        <Text style={styles.cardDiscount}>
                            {item.discountAmount}{item.discountType === 'PERCENTAGE' ? '%' : '₹'} OFF
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.active ? '#2ECC7122' : '#FF444422' }]}>
                    <Text style={[styles.statusText, { color: item.active ? '#2ECC71' : '#FF4444' }]}>
                        {item.active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                </View>
            </View>

            <Text style={[styles.cardDesc, { color: T.subText }]} numberOfLines={2}>
                "{item.description}"
            </Text>

            <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: T.bg }]}>
                    <Text style={styles.statLabel}>USAGE</Text>
                    <Text style={[styles.statValue, { color: T.text }]}>{item.usedCount} / {item.usageLimit}</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: T.bg }]}>
                    <Text style={styles.statLabel}>EXPIRY</Text>
                    <Text style={[styles.statValue, { color: T.text }]}>{parseDate(item.endDate)}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: T.bg }]} onPress={() => openEditModal(item)}>
                    <Ionicons name="create-outline" size={16} color="#DF2324" />
                    <Text style={[styles.actionBtnText, { color: T.text }]}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: item.active ? '#FF444411' : '#2ECC7111' }]} 
                    onPress={() => handleToggleStatus(item)}
                >
                    <Ionicons name={item.active ? "close-circle-outline" : "checkmark-circle-outline"} size={16} color={item.active ? "#FF4444" : "#2ECC71"} />
                    <Text style={[styles.actionBtnText, { color: item.active ? "#FF4444" : "#2ECC71" }]}>
                        {item.active ? 'DISABLE' : 'ENABLE'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={T.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerSubtitle}>ADMIN TERMINAL</Text>
                    <Text style={[styles.headerTitle, { color: T.text }]}>COUPON ENGINE</Text>
                </View>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => { resetForm(); setIsModalOpen(true); }}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={T.placeholder} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: T.text, backgroundColor: T.card }]}
                    placeholder="Search by code or description..."
                    placeholderTextColor={T.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#DF2324" />
                </View>
            ) : (
                <FlatList
                    data={filteredCoupons}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderCouponCard}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCoupons(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="ticket-outline" size={64} color={T.placeholder} />
                            <Text style={[styles.emptyText, { color: T.placeholder }]}>No coupons found</Text>
                        </View>
                    }
                />
            )}

            {/* Creation/Edit Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: T.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>
                                {editingCoupon ? 'Modify' : 'Provision'} Coupon
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <Ionicons name="close" size={24} color={T.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>COUPON CODE</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.bg, color: T.text }]}
                                    value={formData.code}
                                    onChangeText={(val) => setFormData({ ...formData, code: val.toUpperCase() })}
                                    placeholder="e.g. SUMMER50"
                                    placeholderTextColor={T.placeholder}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>DISCOUNT TYPE</Text>
                                    <View style={styles.typeToggle}>
                                        <TouchableOpacity 
                                            style={[styles.typeBtn, formData.discountType === 'PERCENTAGE' && styles.typeBtnActive]}
                                            onPress={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                                        >
                                            <Text style={[styles.typeBtnText, formData.discountType === 'PERCENTAGE' && styles.typeBtnTextActive]}>%</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.typeBtn, formData.discountType === 'FIXED' && styles.typeBtnActive]}
                                            onPress={() => setFormData({ ...formData, discountType: 'FIXED' })}
                                        >
                                            <Text style={[styles.typeBtnText, formData.discountType === 'FIXED' && styles.typeBtnTextActive]}>₹</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                                    <Text style={styles.label}>VALUE</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.bg, color: T.text }]}
                                        value={formData.discountAmount}
                                        onChangeText={(val) => setFormData({ ...formData, discountAmount: val })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>DESCRIPTION</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: T.bg, color: T.text }]}
                                    value={formData.description}
                                    onChangeText={(val) => setFormData({ ...formData, description: val })}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>MIN ORDER</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.bg, color: T.text }]}
                                        value={formData.minOrderAmount}
                                        onChangeText={(val) => setFormData({ ...formData, minOrderAmount: val })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                                    <Text style={styles.label}>LIMIT</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.bg, color: T.text }]}
                                        value={formData.usageLimit}
                                        onChangeText={(val) => setFormData({ ...formData, usageLimit: val })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>START DATE</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.bg, color: T.text }]}
                                        value={formData.startDate}
                                        onChangeText={(val) => setFormData({ ...formData, startDate: val })}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                                    <Text style={styles.label}>EXPIRY DATE</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.bg, color: T.text }]}
                                        value={formData.endDate}
                                        onChangeText={(val) => setFormData({ ...formData, endDate: val })}
                                        placeholder="YYYY-MM-DD"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                                <Text style={styles.cancelBtnText}>DISCARD</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                                <Text style={styles.submitBtnText}>
                                    {editingCoupon ? 'SAVE CHANGES' : 'LAUNCH PROMOTION'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DF232411', justifyContent: 'center', alignItems: 'center' },
    headerSubtitle: { fontSize: 10, fontWeight: '900', color: '#DF2324', letterSpacing: 2 },
    headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    addBtn: { marginLeft: 'auto', width: 44, height: 44, borderRadius: 15, backgroundColor: '#DF2324', justifyContent: 'center', alignItems: 'center' },
    searchBar: { paddingHorizontal: 20, marginBottom: 15, position: 'relative' },
    searchIcon: { position: 'absolute', left: 35, top: 15, zIndex: 1 },
    searchInput: { height: 50, borderRadius: 25, paddingLeft: 45, paddingRight: 20, fontWeight: '700', fontSize: 13 },
    list: { padding: 20, paddingBottom: 100 },
    card: { borderRadius: 25, padding: 20, marginBottom: 20, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#DF232415', justifyContent: 'center', alignItems: 'center' },
    cardCode: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    cardDiscount: { fontSize: 11, fontWeight: '900', color: '#DF2324', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '900' },
    cardDesc: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginBottom: 15 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    statItem: { flex: 1, padding: 12, borderRadius: 15 },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#DF2324', marginBottom: 4 },
    statValue: { fontSize: 12, fontWeight: '800' },
    cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#FFFFFF11', paddingTop: 15 },
    actionBtn: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    actionBtnText: { fontSize: 11, fontWeight: '900' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, fontWeight: '800', marginTop: 15 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: '900' },
    form: { marginBottom: 25 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', color: '#DF2324', marginBottom: 8, marginLeft: 5 },
    input: { height: 55, borderRadius: 15, paddingHorizontal: 15, fontSize: 14, fontWeight: '700' },
    textArea: { height: 80, paddingTop: 15 },
    row: { flexDirection: 'row' },
    typeToggle: { flexDirection: 'row', height: 55, borderRadius: 15, backgroundColor: '#00000022', padding: 5 },
    typeBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    typeBtnActive: { backgroundColor: '#DF2324' },
    typeBtnText: { fontSize: 16, fontWeight: '900', color: '#888' },
    typeBtnTextActive: { color: '#FFF' },
    modalFooter: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    cancelBtn: { flex: 1, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF11' },
    cancelBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
    submitBtn: { flex: 2, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DF2324' },
    submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
});
