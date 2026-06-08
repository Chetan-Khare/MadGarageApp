import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Alert, ActivityIndicator, StatusBar, ImageBackground, Image,
    ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../services/apiClient';
import { usePartRequestUpdates } from '../hooks/usePartRequestUpdates';

interface RequestItem {
    id: number;
    make: string;
    model: string;
    year: number;
    partName: string;
    description: string;
    status: string;
    createdAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
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

export default function AdminRequestsView() {
    const { isDark } = useThemeStore();
    const theme = isDark ? DARK : LIGHT;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter State
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');

    const STATUSES = ['ALL', 'PENDING', 'QUOTED', 'FULFILLED', 'UNAVAILABLE'];
    const DATES = [
        { label: 'ALL TIME', value: 'ALL' },
        { label: 'TODAY', value: 'TODAY' },
        { label: 'THIS WEEK', value: 'WEEK' }
    ];

    const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80';

    const fetchRequests = async () => {
        try {
            const response = await apiClient.get('/admin/requests');
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            Alert.alert('Error', 'Could not load requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    usePartRequestUpdates((update) => {
        if (update.type === 'NEW') {
            setRequests(prev => {
                if (prev.some(r => r.id === update.payload.id)) return prev;
                return [update.payload, ...prev];
            });
        } else if (update.type === 'STATUS_UPDATE') {
            setRequests(prev => prev.map(r => 
                r.id === update.payload.id ? { ...r, status: update.payload.status } : r
            ));
        }
    });

    const handleUpdateStatus = (id: number, currentStatus: string, nextStatus: string) => {
        Alert.alert(
            `Mark as ${nextStatus}?`,
            `Are you sure you want to change this request to ${nextStatus}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    style: nextStatus === 'UNAVAILABLE' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await apiClient.put(`/admin/requests/${id}/status?status=${nextStatus}`);
                            Alert.alert('Success', `Status updated to ${nextStatus}`);
                            fetchRequests();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to update status.');
                        }
                    } 
                }
            ]
        );
    };

    const filteredRequests = requests.filter(req => {
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
        
        let matchesDate = true;
        const reqDate = new Date(req.createdAt);
        const now = new Date();
        
        if (dateFilter === 'TODAY') {
            matchesDate = reqDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'WEEK') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            matchesDate = reqDate >= weekAgo;
        }
        
        return matchesStatus && matchesDate;
    });

    const renderFilterBar = () => (
        <View style={styles.filterContainer}>
            {/* Row 1: Status Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <View style={styles.filterGroup}>
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
                </View>
            </ScrollView>

            {/* Row 2: Date Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterScroll, { marginTop: 10 }]}>
                <View style={styles.filterGroup}>
                    {DATES.map(date => (
                        <TouchableOpacity 
                            key={date.value}
                            onPress={() => setDateFilter(date.value)}
                            style={[
                                styles.filterChip, 
                                { backgroundColor: dateFilter === date.value ? '#DF2324' : theme.card, borderColor: theme.cardBorder }
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText, 
                                { color: dateFilter === date.value ? '#FFF' : theme.text }
                            ]}>{date.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderItem = ({ item }: { item: RequestItem }) => {
        let badgeColor = '#FFC107'; 
        if (item.status === 'QUOTED') badgeColor = '#28A745'; 
        if (item.status === 'FULFILLED') badgeColor = '#17A2B8'; 
        if (item.status === 'UNAVAILABLE') badgeColor = '#DC3545'; 

        return (
            <BlurView intensity={isDark ? 30 : 60} tint={theme.blurTint} style={[styles.card, { borderColor: theme.cardBorder }]}>
                {/* Header: Date & Status */}
                <View style={[styles.cardHeader, { borderBottomColor: theme.cardBorder }]}>
                    <View>
                        <Text style={[styles.dateLabel, { color: theme.subText }]}>REQUESTED ON</Text>
                        <Text style={[styles.dateText, { color: theme.text }]}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subText }]}>Customer Details</Text>
                    <Text style={[styles.primaryText, { color: theme.text }]}>
                        <Ionicons name="person" size={14} color="#DF2324" /> {item.customerName || 'Unknown User'}
                    </Text>
                    <Text style={[styles.secondaryText, { color: theme.text }]}>
                        <Ionicons name="call" size={14} color="#DF2324" /> {item.customerPhone || 'N/A'}
                    </Text>
                </View>

                {/* Vehicle Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subText }]}>Vehicle Identity</Text>
                    <Text style={[styles.primaryText, { color: theme.text }]}>
                        {item.year} {item.make} {item.model}
                    </Text>
                </View>

                {/* Part Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subText }]}>Requested Part</Text>
                    <Text style={[styles.partName, { color: theme.text }]}>{item.partName}</Text>
                    {item.description ? (
                        <Text style={[styles.description, { color: theme.subText }]}>
                            "{item.description}"
                        </Text>
                    ) : null}
                </View>

                {/* Actions */}
                {item.status !== 'FULFILLED' && item.status !== 'UNAVAILABLE' && (
                    <View style={[styles.actionRow, { borderTopColor: theme.cardBorder }]}>
                        {item.status === 'PENDING' && (
                            <>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { borderColor: '#DC3545', borderWidth: 1 }]}
                                    onPress={() => handleUpdateStatus(item.id, item.status, 'UNAVAILABLE')}
                                >
                                    <Ionicons name="close-circle-outline" size={16} color="#DC3545" style={{ marginRight: 6 }} />
                                    <Text style={[styles.actionBtnText, { color: '#DC3545' }]}>Not Available</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#28A745', marginLeft: 10 }]}
                                    onPress={() => handleUpdateStatus(item.id, item.status, 'QUOTED')}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Mark Ready</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {item.status === 'QUOTED' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#17A2B8' }]}
                                onPress={() => handleUpdateStatus(item.id, item.status, 'FULFILLED')}
                            >
                                <Ionicons name="cube-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Settle Request</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </BlurView>
        );
    };

    return (
        <ImageBackground source={{ uri: BACKGROUND_IMAGE }} style={styles.safeArea} resizeMode="cover">
            <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent />

                {/* Glass Header */}
                <BlurView intensity={isDark ? 40 : 80} tint={theme.blurTint} style={[styles.integratedHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.cardBorder }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={theme.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>ADMIN DASHBOARD</Text>
                        <Text style={styles.headerSubtitle}>MANAGE PART REQUEST</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerLogo} />
                    </View>
                </BlurView>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#DF2324" />
                    </View>
                ) : (
                    <>
                        {renderFilterBar()}
                        <FlatList
                            data={filteredRequests}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Ionicons name="document-text-outline" size={64} color={theme.subText} />
                                <Text style={[styles.emptyText, { color: theme.subText }]}>No pending requests.</Text>
                            </View>
                        }
                    />
                    </>
                )}
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Header (Synced)
    integratedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 40, alignItems: 'flex-end' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: '#DF2324', letterSpacing: 1 },
    headerSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: '#DF2324', textTransform: 'uppercase', marginTop: 2, opacity: 0.9 },
    headerLogo: { width: 32, height: 32, borderRadius: 16 },

    listContainer: { padding: 16, paddingBottom: 40 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
    
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    dateLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    dateText: { fontSize: 12, fontWeight: '700' },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    primaryText: { fontSize: 15, fontWeight: '700' },
    secondaryText: { fontSize: 14, marginTop: 4 },
    partName: { fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
    description: { fontSize: 13, marginTop: 6, fontStyle: 'italic', lineHeight: 20 },
    
    actionRow: {
        marginTop: 6,
        paddingTop: 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    actionBtnText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

    // Filter Styles
    filterContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    filterScroll: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    filterGroup: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    filterDivider: {
        display: 'none',
    }
});
