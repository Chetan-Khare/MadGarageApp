import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../store/themeStore';
import { ModernDashboardHeader } from '../components/ModernDashboardHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';

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

export default function AdminRequestsView() {
    const { isDark } = useThemeStore();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);

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

    const bg = isDark ? '#050505' : '#F6F8FF';
    const cardBg = isDark ? '#111' : '#FFF';
    const textColor = isDark ? '#FFF' : '#111';
    const subText = isDark ? '#AAA' : '#666';
    const borderColor = isDark ? '#333' : '#EEE';

    const renderItem = ({ item }: { item: RequestItem }) => {
        let badgeColor = '#FFC107'; // PENDING (Yellow)
        if (item.status === 'QUOTED') badgeColor = '#28A745'; // Green
        if (item.status === 'FULFILLED') badgeColor = '#17A2B8'; // Blue
        if (item.status === 'UNAVAILABLE') badgeColor = '#DC3545'; // Red

        return (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                {/* Header: Date & Status */}
                <View style={styles.cardHeader}>
                    <Text style={[styles.dateText, { color: subText }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: subText }]}>Customer Info</Text>
                    <Text style={[styles.primaryText, { color: textColor }]}>
                        <Ionicons name="person" size={14} color="#DF2324" /> {item.customerName || 'Unknown'}
                    </Text>
                    <Text style={[styles.secondaryText, { color: textColor }]}>
                        <Ionicons name="call" size={14} color={subText} /> {item.customerPhone || 'N/A'}
                    </Text>
                </View>

                {/* Vehicle Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: subText }]}>Vehicle</Text>
                    <Text style={[styles.primaryText, { color: textColor }]}>
                        {item.year} {item.make} {item.model}
                    </Text>
                </View>

                {/* Part Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: subText }]}>Requested Part</Text>
                    <Text style={[styles.primaryText, { color: textColor, fontWeight: '800' }]}>{item.partName}</Text>
                    {item.description ? (
                        <Text style={[styles.secondaryText, { color: subText, marginTop: 4, fontStyle: 'italic' }]}>
                            "{item.description}"
                        </Text>
                    ) : null}
                </View>

                {/* Actions */}
                {item.status !== 'FULFILLED' && item.status !== 'UNAVAILABLE' && (
                    <View style={styles.actionRow}>
                        {item.status === 'PENDING' && (
                            <>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { borderColor: '#DC3545', borderWidth: 1 }]}
                                    onPress={() => handleUpdateStatus(item.id, item.status, 'UNAVAILABLE')}
                                >
                                    <Ionicons name="close-circle-outline" size={16} color="#DC3545" style={{ marginRight: 6 }} />
                                    <Text style={[styles.actionBtnText, { color: '#DC3545' }]}>Not Found</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { backgroundColor: '#28A745', marginLeft: 10 }]}
                                    onPress={() => handleUpdateStatus(item.id, item.status, 'QUOTED')}
                                >
                                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Quote Ready</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {item.status === 'QUOTED' && (
                            <TouchableOpacity 
                                style={[styles.actionBtn, { backgroundColor: '#17A2B8' }]}
                                onPress={() => handleUpdateStatus(item.id, item.status, 'FULFILLED')}
                            >
                                <Ionicons name="cube-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Mark Fulfilled</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <ModernDashboardHeader 
                title="Part Requests" 
                subtitle="Manage user requests"
                showThemeToggle={false}
                profileIcon="chevron-back"
                onProfilePress={() => navigation.goBack()}
                logo={require('../../assets/app_logo.png')}
            />
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#DF2324" />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="document-text-outline" size={64} color={subText} />
                            <Text style={[styles.emptyText, { color: subText }]}>No part requests found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    listContainer: { padding: 16, paddingBottom: 40 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    dateText: { fontSize: 12, fontWeight: '600' },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    section: { marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    primaryText: { fontSize: 15, fontWeight: '600' },
    secondaryText: { fontSize: 14 },
    actionRow: {
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700' }
});
