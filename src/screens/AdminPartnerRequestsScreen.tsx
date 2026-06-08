import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Alert, ActivityIndicator, StatusBar, ImageBackground, Image,
    ScrollView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { usePartnerRequestUpdates } from '../hooks/usePartnerRequestUpdates';

interface PartnerRequest {
    id: number;
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    role: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    status: string;
    createdAt: string;
    internalNotes?: string;
}

// ─── Theme Definitions ────────────────────────────────────────────────────────
const DARK = {
    bg: ['rgba(5, 5, 5, 0.8)', 'rgba(5, 5, 5, 0.95)', '#050505'] as const,
    card: 'rgba(20, 20, 22, 0.65)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    text: '#FFFFFF',
    subText: '#A1A1AA',
    blurTint: 'dark' as const,
};

const LIGHT = {
    bg: ['rgba(244, 244, 245, 0.8)', 'rgba(244, 244, 245, 0.95)', '#F4F4F5'] as const,
    card: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    text: '#18181B',
    subText: '#71717A',
    blurTint: 'light' as const,
};

export default function AdminPartnerRequestsScreen() {
    const { isDark } = useThemeStore();
    const theme = isDark ? DARK : LIGHT;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    
    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    
    // Filter State
    const [statusFilter, setStatusFilter] = useState(route.params?.initialStatusFilter || 'ALL');
    const STATUSES = ['ALL', 'PENDING', 'CONTACTED', 'APPROVED', 'REJECTED'];

    useEffect(() => {
        if (route.params?.initialStatusFilter) {
            setStatusFilter(route.params.initialStatusFilter);
        }
    }, [route.params?.initialStatusFilter]);

    const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80';

    const fetchRequests = async () => {
        try {
            const response = await apiClient.get('/admin/partner-requests');
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Failed to fetch partner requests:', error);
            Alert.alert('Error', 'Could not load partner applications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    usePartnerRequestUpdates((update) => {
        if (update.type === 'NEW') {
            setRequests((prev: PartnerRequest[]) => {
                if (prev.some(r => r.id === update.payload.id)) return prev;
                return [update.payload as PartnerRequest, ...prev];
            });
        } else if (update.type === 'STATUS_UPDATE') {
            setRequests((prev: PartnerRequest[]) =>
                prev.map(r => r.id === update.payload.id ? { ...r, status: update.payload.status } : r)
            );
        }
    });


    const handleUpdateStatus = (id: number, nextStatus: string) => {
        const title = nextStatus === 'CONTACTED' ? 'Mark as Contacted?' : 
                      nextStatus === 'APPROVED' ? 'Approve Partner?' : 'Reject Application?';
        
        Alert.alert(
            title,
            nextStatus === 'APPROVED' ? 'This will create an active user account and notify the partner.' : 'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    style: nextStatus === 'REJECTED' ? 'destructive' : 'default',
                    onPress: async () => {
                        setUpdatingId(id);
                        try {
                            if (nextStatus === 'APPROVED') {
                                const res = await apiClient.post(`/admin/partner-requests/${id}/approve`);
                                Alert.alert('Success', res.data);
                            } else if (nextStatus === 'REJECTED') {
                                await apiClient.delete(`/admin/partner-requests/${id}`);
                                Alert.alert('Success', 'Application rejected.');
                            } else {
                                await apiClient.put(`/admin/partner-requests/${id}/status`);
                                Alert.alert('Success', 'Status updated.');
                            }
                            fetchRequests();
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data || 'Operation failed.');
                        } finally {
                            setUpdatingId(null);
                        }
                    } 
                }
            ]
        );
    };

    const filteredRequests = requests.filter(req => {
        return statusFilter === 'ALL' || req.status === statusFilter;
    });

    const renderItem = ({ item }: { item: PartnerRequest }) => {
        let badgeColor = '#FFC107'; 
        if (item.status === 'CONTACTED') badgeColor = '#17A2B8'; 
        if (item.status === 'APPROVED') badgeColor = '#28A745'; 
        if (item.status === 'REJECTED') badgeColor = '#DC3545'; 

        return (
            <BlurView intensity={isDark ? 30 : 60} tint={theme.blurTint} style={[styles.card, { borderColor: theme.cardBorder }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.cardBorder }]}>
                    <View>
                        <Text style={[styles.dateLabel, { color: theme.subText }]}>APPLIED ON</Text>
                        <Text style={[styles.dateText, { color: theme.text }]}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subText }]}>Business Identity</Text>
                    <Text style={[styles.businessName, { color: theme.text }]}>{item.businessName}</Text>
                    <View style={styles.row}>
                        <Ionicons name="person-outline" size={12} color="#DF2324" />
                        <Text style={[styles.secondaryText, { color: theme.text, marginLeft: 6 }]}>{item.contactName}</Text>
                    </View>
                    <Text style={[styles.typeTag, { color: item.role === 'ROLE_SELLER' ? '#17A2B8' : '#FFC107' }]}>
                        {item.role === 'ROLE_SELLER' ? 'SPARE PARTS SELLER' : 'CERTIFIED GARAGE'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subText }]}>Contact Details</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Contact', item.email)}>
                        <Text style={[styles.secondaryText, { color: theme.text }]}>
                            <Ionicons name="mail-outline" size={12} color="#DF2324" /> {item.email}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 6 }} onPress={() => Alert.alert('Contact', item.phone)}>
                        <Text style={[styles.secondaryText, { color: theme.text }]}>
                            <Ionicons name="call-outline" size={12} color="#DF2324" /> {item.phone}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subText }]}>Operational Hub</Text>
                    <Text style={[styles.secondaryText, { color: theme.text }]}>
                        <Ionicons name="location-outline" size={12} color="#DF2324" /> {item.city}, {item.state}
                    </Text>
                    <Text style={[styles.description, { color: theme.subText }]}>{item.address}</Text>
                </View>

                {item.status !== 'APPROVED' && item.status !== 'REJECTED' && (
                    <View style={[styles.actionRow, { borderTopColor: theme.cardBorder }]}>
                        {item.status === 'PENDING' && (
                            <TouchableOpacity 
                                disabled={updatingId === item.id}
                                style={[styles.actionBtn, { borderColor: '#17A2B8', borderWidth: 1 }]}
                                onPress={() => handleUpdateStatus(item.id, 'CONTACTED')}
                            >
                                <Ionicons name="call-outline" size={16} color="#17A2B8" style={{ marginRight: 6 }} />
                                <Text style={[styles.actionBtnText, { color: '#17A2B8' }]}>Contacted</Text>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            disabled={updatingId === item.id}
                            style={[styles.actionBtn, { borderColor: '#DC3545', borderWidth: 1, marginLeft: 10 }]}
                            onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
                        >
                            <Ionicons name="trash-outline" size={16} color="#DC3545" style={{ marginRight: 6 }} />
                            <Text style={[styles.actionBtnText, { color: '#DC3545' }]}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            disabled={updatingId === item.id}
                            style={[styles.actionBtn, { backgroundColor: '#28A745', marginLeft: 10 }]}
                            onPress={() => handleUpdateStatus(item.id, 'APPROVED')}
                        >
                            <Ionicons name="shield-checkmark-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </BlurView>
        );
    };

    return (
        <ImageBackground source={{ uri: BACKGROUND_IMAGE }} style={styles.safeArea} resizeMode="cover">
            <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent />

                <BlurView intensity={isDark ? 40 : 80} tint={theme.blurTint} style={[styles.integratedHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.cardBorder }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={theme.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>PARTNER AUDITS</Text>
                        <Text style={styles.headerSubtitle}>B2B ONBOARDING PIPELINE</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerLogo} />
                    </View>
                </BlurView>

                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {STATUSES.map(status => (
                            <TouchableOpacity 
                                key={status}
                                onPress={() => setStatusFilter(status)}
                                style={[
                                    styles.filterChip, 
                                    { backgroundColor: statusFilter === status ? '#DF2324' : theme.card, borderColor: theme.cardBorder }
                                ]}
                            >
                                <Text style={[
                                    styles.filterChipText, 
                                    { color: statusFilter === status ? '#FFF' : theme.text }
                                ]}>{status}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#DF2324" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredRequests}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Ionicons name="people-outline" size={64} color={theme.subText} />
                                <Text style={[styles.emptyText, { color: theme.subText }]}>No applications found.</Text>
                            </View>
                        }
                    />
                )}
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    integratedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 40, alignItems: 'flex-end' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: '#DF2324', letterSpacing: 1 },
    headerSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: '#DF2324', textTransform: 'uppercase', marginTop: 2, opacity: 0.9 },
    headerLogo: { width: 32, height: 32, borderRadius: 16 },
    listContainer: { padding: 16, paddingBottom: 40 },
    emptyText: { marginTop: 16, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
    card: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
    dateLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
    dateText: { fontSize: 13, fontWeight: '800' },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    businessName: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center' },
    secondaryText: { fontSize: 13, fontWeight: '700' },
    typeTag: { fontSize: 10, fontWeight: '900', marginTop: 8, letterSpacing: 0.5 },
    description: { fontSize: 12, marginTop: 6, fontWeight: '600', opacity: 0.8 },
    actionRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'flex-end' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
    actionBtnText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    filterContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    filterScroll: { paddingHorizontal: 16 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 8, borderWidth: 1 },
    filterChipText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});
