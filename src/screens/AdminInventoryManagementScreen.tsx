import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Image, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminInventoryManagement'>;
};

export default function AdminInventoryManagementScreen({ navigation }: Props) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Edit Modal State
    const [editItem, setEditItem] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editStock, setEditStock] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsManualRating, setEditIsManualRating] = useState(false);
    const [editRating, setEditRating] = useState('');

    // Flagging State
    const [flaggingItem, setFlaggingItem] = useState<any>(null);
    const [flagReason, setFlagReason] = useState('');

    const { isDark } = useThemeStore();
    const insets = useSafeAreaInsets();

    const bgPrimary = isDark ? '#121212' : '#F5F6F8';
    const bgSecondary = isDark ? '#1A1A1A' : '#FFFFFF';
    const textPrimary = isDark ? '#FFFFFF' : '#1A1A1A';
    const textMuted = isDark ? '#7A7A85' : '#8A8A95';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const inputBg = isDark ? '#242424' : '#EFEFF4';

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await apiClient.get('/admin/inventory');
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFlag = async () => {
        if (!flaggingItem) return;
        setLoading(true);
        try {
            const reason = flaggingItem.flagged ? '' : (flagReason || 'Administrative Review Required');
            await apiClient.put(`/admin/inventory/${flaggingItem.id}/toggle-flag`, { reason });
            setFlaggingItem(null);
            setFlagReason('');
            fetchInventory();
        } catch (error: any) {
            Alert.alert("Error", "Failed to toggle safety status.");
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert("Delete Part", "Are you sure you want to permanently delete this part?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        setLoading(true);
                        await apiClient.delete(`/admin/inventory/${id}`);
                        fetchInventory();
                    } catch (error: any) {
                        const message = typeof error.response?.data === 'string' 
                            ? error.response.data 
                            : JSON.stringify(error.response?.data) || "Could not delete product.";
                        Alert.alert("Error", message);
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handleUpdate = async () => {
        if (!editItem) return;
        setLoading(true);
        try {
            // Refined payload: Only send what's needed to avoid 500 errors from strict backend DTOs
            await apiClient.put(`/seller/inventory/${editItem.id}/base64`, {
                id: editItem.id,
                sku: editItem.sku,
                partName: editName,
                price: parseFloat(editPrice) || 0,
                stockQuantity: parseInt(editStock) || 0,
                description: editDescription,
                isManualRating: editIsManualRating,
                rating: parseFloat(editRating) || 4.5,
                category: editItem.category,
                condition: editItem.condition,
                brand: editItem.brand || 'MAD GARAGE',
                base64Images: [], 
            });
            setEditItem(null);
            fetchInventory();
        } catch (error: any) {
            const message = typeof error.response?.data === 'string' 
                ? error.response.data 
                : JSON.stringify(error.response?.data) || "Failed to update product.";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    };

    const renderProductItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Alert.alert("Part Description", item.description || "No description provided for this part.")}
            style={[styles.productCard, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}
        >
            <View style={[styles.imageContainer, { borderColor: item.flagged ? '#FF9B3E' : borderSubtle }]}>
                <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }} style={styles.productImage} />
                {item.flagged && (
                    <View style={styles.flaggedBadge}>
                        <Text style={styles.flaggedBadgeText}>FLAGGED</Text>
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={1}>{item?.partName || 'Unknown Part'}</Text>
                <Text style={[styles.productCategory, { color: textMuted }]}>{item?.category || item?.fitmentCategory || 'GENERAL'}</Text>
                <Text style={styles.productPrice}>₹{item?.price ? item.price.toFixed(2) : '0.00'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={{ fontSize: 12, fontWeight: '900', color: textMuted }}>{item.rating || '4.5'}</Text>
                    {item.isManualRating && (
                        <Ionicons name="shield-checkmark-outline" size={12} color="#DF2324" style={{ marginLeft: 4 }} />
                    )}
                </View>
                {item.flagged && item.flagReason && (
                    <Text style={[styles.reasonText, { color: '#FF9B3E' }]} numberOfLines={1}>⚠️ {item.flagReason}</Text>
                )}
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: item.flagged ? '#FF9B3E' : inputBg, borderColor: item.flagged ? '#FF9B3E' : borderSubtle, borderWidth: 1 }]} 
                    onPress={() => {
                        if (item.flagged) {
                            setFlaggingItem(item);
                            handleToggleFlag();
                        } else {
                            setFlaggingItem(item);
                            setFlagReason('');
                        }
                    }}
                >
                    <Ionicons name="warning-outline" size={20} color={item.flagged ? '#000' : '#FF9B3E'} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: inputBg, borderColor: borderSubtle, borderWidth: 1 }]} 
                    onPress={() => {
                        setEditItem(item);
                        setEditName(item.partName || '');
                        setEditPrice(item.price ? item.price.toString() : '0');
                        setEditStock(item.stockQuantity ? item.stockQuantity.toString() : '0');
                        setEditDescription(item.description || '');
                        setEditIsManualRating(item.isManualRating || false);
                        setEditRating(item.rating ? item.rating.toString() : '4.5');
                    }}
                >
                    <Ionicons name="create-outline" size={20} color={isDark ? '#FFF' : '#121212'} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: inputBg, borderColor: borderSubtle, borderWidth: 1 }]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#DF2324" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgPrimary, paddingTop: Math.max(insets.top, 8) }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bgPrimary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: bgSecondary, borderWidth: 1, borderColor: borderSubtle }]}>
                    <Ionicons name="arrow-back" size={24} color="#DF2324" />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textPrimary }]}>INVENTORY</Text>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddProduct')}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={renderProductItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={64} color={textMuted} />
                            <Text style={[styles.emptyText, { color: textMuted }]}>No stock detected</Text>
                        </View>
                    }
                />
            )}

            {/* Quick Edit Modal */}
            <Modal visible={!!editItem} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textPrimary }]}>QUICK EDIT</Text>
                            <TouchableOpacity onPress={() => setEditItem(null)}>
                                <Ionicons name="close" size={24} color={textMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: textMuted }]}>PART NAME</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: borderSubtle }]}
                            value={editName}
                            onChangeText={setEditName}
                        />

                        <Text style={[styles.inputLabel, { color: textMuted }]}>DESCRIPTION</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: borderSubtle, minHeight: 80, textAlignVertical: 'top' }]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            multiline
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: textMuted }]}>PRICE (₹)</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: borderSubtle }]}
                                    value={editPrice}
                                    onChangeText={setEditPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: textMuted }]}>STOCK QTY</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: borderSubtle }]}
                                    value={editStock}
                                    onChangeText={setEditStock}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={{ marginTop: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.inputLabel, { marginTop: 0, color: textMuted }]}>QUALITY OVERRIDE</Text>
                                <TouchableOpacity 
                                    onPress={() => setEditIsManualRating(!editIsManualRating)}
                                    style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: editIsManualRating ? '#DF2324' : '#333', padding: 2 }}
                                >
                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', marginLeft: editIsManualRating ? 20 : 0 }} />
                                </TouchableOpacity>
                            </View>
                            <TextInput 
                                style={[styles.input, { backgroundColor: inputBg, color: editIsManualRating ? textPrimary : textMuted, borderColor: borderSubtle, opacity: editIsManualRating ? 1 : 0.5, marginTop: 10 }]}
                                value={editRating}
                                onChangeText={setEditRating}
                                keyboardType="numeric"
                                editable={editIsManualRating}
                                placeholder="4.5"
                                placeholderTextColor={textMuted}
                            />
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Flag Reason Modal */}
            <Modal visible={!!flaggingItem && !flaggingItem.flagged} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: bgSecondary, borderColor: borderSubtle }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: '#FF9B3E' }]}>AUDIT SAFETY</Text>
                            <TouchableOpacity onPress={() => setFlaggingItem(null)}>
                                <Ionicons name="close" size={24} color={textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.inputLabel, { color: textMuted }]}>FLAGGING REASON</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: borderSubtle }]}
                            placeholder="e.g. Invalid Certification"
                            placeholderTextColor={textMuted}
                            value={flagReason}
                            onChangeText={setFlagReason}
                            autoFocus
                        />
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FF9B3E' }]} onPress={handleToggleFlag}>
                            <Text style={[styles.saveBtnText, { color: '#000' }]}>SUBMIT FLAG</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 15,
        marginTop: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        backgroundColor: '#DF2324',
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    title: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
    list: { padding: 16 },
    productCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        alignItems: 'center',
    },
    imageContainer: {
        borderWidth: 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    productImage: {
        width: 70,
        height: 70,
        backgroundColor: '#242424',
    },
    flaggedBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 155, 62, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flaggedBadgeText: {
        backgroundColor: '#FF9B3E',
        color: '#000',
        fontSize: 8,
        fontWeight: '900',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    productInfo: {
        flex: 1,
        marginLeft: 16,
        marginRight: 8,
    },
    productName: { fontSize: 15, fontWeight: '900', fontStyle: 'italic' },
    productCategory: { fontSize: 10, fontWeight: '900', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    productPrice: { color: '#DF2324', fontWeight: '900', fontStyle: 'italic', fontSize: 16, marginTop: 4 },
    reasonText: {
        fontSize: 9,
        fontWeight: '900',
        marginTop: 4,
        fontStyle: 'italic',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 14, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
    inputLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 1 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        fontWeight: '800',
    },
    saveBtn: {
        backgroundColor: '#DF2324',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    saveBtnText: { color: '#FFF', fontWeight: '900', fontStyle: 'italic', fontSize: 15, letterSpacing: 2 },
});
