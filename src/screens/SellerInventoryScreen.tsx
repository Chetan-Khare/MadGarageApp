import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, StatusBar, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { ProductImage } from '../components/ProductImage';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'SellerInventory'>;
};

export default function SellerInventoryScreen({ navigation }: Props) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await apiClient.get('/seller/inventory');
            setProducts(response.data);
        } catch (error) {
            Alert.alert('Error', 'Could not load your inventory.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert("Delete Product", "Are you sure you want to remove this listing? This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        setLoading(true);
                        await apiClient.delete(`/seller/inventory/${id}`); // Seller-scoped: backend verifies ownership
                        fetchInventory();
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete product.");
                        setLoading(false);
                    }
                } 
            }
        ]);
    };

    const filteredProducts = products.filter(p => 
        (p.partName + ' ' + p.brand + ' ' + p.sku).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderProductItem = ({ item }: { item: any }) => (
        <View style={[styles.productCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
            <View>
                <ProductImage 
                    product={item} 
                    style={[styles.productImage, { borderColor: item.flagged ? '#FF9B3E' : 'transparent', borderWidth: item.flagged ? 2 : 0 }]} 
                />
                {item.flagged && (
                    <View style={styles.flaggedBadgeContainer}>
                        <Text style={styles.flaggedBadgeText}>FLAGGED</Text>
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: T.text }]} numberOfLines={1}>{item.partName}</Text>
                <Text style={[styles.productBrand, { color: T.subText }]}>{item.brand} | SKU: {item.sku}</Text>
                
                {item.flagged && item.flagReason && (
                    <View style={styles.reasonContainer}>
                        <Ionicons name="warning-outline" size={12} color="#FF9B3E" />
                        <Text style={styles.reasonText}>{item.flagReason}</Text>
                    </View>
                )}

                <View style={styles.stockRow}>
                    <View>
                        <Text style={[styles.price, { color: '#DF2324' }]}>₹{item.price.toLocaleString()}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={{ fontSize: 12, fontWeight: '800', color: T.subText }}>{item.rating || '4.5'}</Text>
                            {item.isManualRating && <Ionicons name="shield-checkmark-outline" size={12} color="#DF2324" style={{ marginLeft: 4 }} />}
                        </View>
                    </View>
                    <View style={[styles.stockBadge, { backgroundColor: item.stockQuantity > 0 ? '#4CAF5022' : '#F4433622' }]}>
                        <Text style={[styles.stockText, { color: item.stockQuantity > 0 ? '#4CAF50' : '#F44336' }]}>
                            {item.stockQuantity > 0 ? `${item.stockQuantity} IN STOCK` : 'OUT OF STOCK'}
                        </Text>
                    </View>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={[styles.editBtn, { backgroundColor: T.inputBg }]}
                        onPress={() => navigation.navigate('EditProduct' as any, { product: item } as any)}
                    >
                        <Ionicons name="create-outline" size={16} color={T.text} />
                        <Text style={[styles.btnText, { color: T.text }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.deleteBtn, { backgroundColor: '#DF232411' }]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={16} color="#DF2324" />
                        <Text style={[styles.btnText, { color: '#DF2324' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg2} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#DF2324" />
                </TouchableOpacity>
                <Text style={[styles.title, { color: T.text }]}>Active Listings</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder, borderWidth: 1 }]}>
                    <Ionicons name="search" size={20} color={T.subText} />
                    <TextInput 
                        style={[styles.searchInput, { color: T.text }]}
                        placeholder="Search your inventory..."
                        placeholderTextColor={T.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#DF2324" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderProductItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={64} color={T.subText} />
                            <Text style={[styles.emptyText, { color: T.subText }]}>No products found</Text>
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
    title: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 12, height: 50, gap: 10 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    productCard: { flexDirection: 'row', padding: 12, borderRadius: 16, marginBottom: 16, elevation: 3 },
    productImage: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#F0F0F0' },
    flaggedBadgeContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 155, 62, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    flaggedBadgeText: {
        backgroundColor: '#FF9B3E',
        color: '#000',
        fontSize: 8,
        fontWeight: '900',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    reasonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    reasonText: {
        color: '#FF9B3E',
        fontSize: 10,
        fontWeight: '800',
        fontStyle: 'italic',
        flex: 1,
    },
    productInfo: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
    productName: { fontSize: 16, fontWeight: '800' },
    productBrand: { fontSize: 12, fontWeight: '600' },
    stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontSize: 18, fontWeight: '900' },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    stockText: { fontSize: 9, fontWeight: '900' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
    editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
    deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
    btnText: { fontSize: 12, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '800' },
});
