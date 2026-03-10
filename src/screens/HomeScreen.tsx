import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    TextInput, ActivityIndicator, StatusBar, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import apiClient from '../services/apiClient';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: HomeScreenNavigationProp; }

const CATEGORIES = [
    { id: 'All', label: 'All Parts', icon: 'apps-outline' },
    { id: 'Brakes', label: 'Brakes', icon: 'disc-outline' },
    { id: 'Engine', label: 'Engine', icon: 'speedometer-outline' },
    { id: 'Suspension', label: 'Suspension', icon: 'construct-outline' },
    { id: 'Exhaust', label: 'Exhaust', icon: 'flame-outline' },
    { id: 'Electrical', label: 'Electrical', icon: 'flash-outline' },
];

const MOCK_DEVICES = [
    { id: '1', partName: 'Ceramic Brake Pads', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300', manufacturer: 'Brembo', brand: 'Brembo', category: 'Brakes' },
    { id: '2', partName: 'Cold Air Intake Kit', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300', manufacturer: 'K&N', brand: 'K&N', category: 'Engine' },
    { id: '3', partName: 'Coilover Suspension', price: 8500, imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=300', manufacturer: 'KW Suspension', brand: 'KW', category: 'Suspension' },
    { id: '4', partName: 'Performance Exhaust', price: 12900, imageUrl: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=300', manufacturer: 'Akrapovic', brand: 'Akrapovic', category: 'Exhaust' },
    { id: '5', partName: 'Drilled Rotor Set', price: 3200, imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300', manufacturer: 'Stoptech', brand: 'Stoptech', category: 'Brakes' },
    { id: '6', partName: 'Sport Air Filter', price: 950, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300', manufacturer: 'K&N', brand: 'K&N', category: 'Engine' },
];

export default function HomeScreen({ navigation }: Props) {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const addItem = useCartStore((state) => state.addItem);
    const cartItems = useCartStore((state) => state.items);
    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const token = useAuthStore((state) => state.token);
    const role = useAuthStore((state) => state.role);
    const logout = useAuthStore((state) => state.logout);
    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    useEffect(() => { fetchDevices(); }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/products');
            setDevices(response.data);
        } catch {
            setDevices(MOCK_DEVICES);
        } finally {
            setLoading(false);
        }
    };

    const filteredDevices = devices.filter(d => {
        const name = d.partName || d.deviceName || '';
        const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = activeCategory === 'All' || d.category === activeCategory;
        return matchSearch && matchCat;
    });

    const handleAddToCart = (device: any) => {
        if (!token) { navigation.navigate('Login' as any); return; }
        addItem({ id: device.id.toString(), deviceName: device.partName || device.deviceName, price: device.price, imageUrl: device.imageUrl, manufacturer: device.manufacturer || device.brand || 'Mad Garage' });
    };

    const handleProfilePress = () => {
        if (!token) { navigation.navigate('Login' as any); return; }
        if (role === 'ADMIN') navigation.navigate('AdminDashboard' as any);
        else if (role === 'SELLER') navigation.navigate('SellerDashboard' as any);
        else if (role === 'GARAGE') navigation.navigate('GarageDashboard' as any);
        else logout();
    };

    const renderCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: T.inputBg }]}
            onPress={() => navigation.navigate('ProductDetails' as any, { product: item })}
            activeOpacity={0.85}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.cardImg} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient} />
            <View style={styles.brandChip}>
                <Text style={styles.brandChipText}>{item.manufacturer || item.brand || 'Brand'}</Text>
            </View>
            <View style={styles.cardBottom}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.partName || item.deviceName}</Text>
                <View style={styles.cardPriceRow}>
                    <Text style={styles.cardPrice}>₹{item.price?.toLocaleString()}</Text>
                    <TouchableOpacity style={styles.miniCartBtn} onPress={() => handleAddToCart(item)}>
                        <Ionicons name="add" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, { backgroundColor: T.bg }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

            {/* Top Bar */}
            <View style={[styles.topBar, { backgroundColor: T.bg }]}>
                <View>
                    <Text style={[styles.greeting, { color: T.text }]}>Mad Garage 🏎</Text>
                    <Text style={[styles.subGreeting, { color: T.subText }]}>Find your perfect part</Text>
                </View>
                <View style={styles.topBarRight}>
                    {/* Theme Toggle */}
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                        onPress={toggleTheme}
                    >
                        <Ionicons
                            name={isDark ? 'sunny-outline' : 'moon-outline'}
                            size={20}
                            color={isDark ? '#FFD700' : '#5B5BFF'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                        onPress={handleProfilePress}
                    >
                        <Ionicons name={token ? 'person' : 'person-outline'} size={22} color={token ? '#FF3333' : '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                        onPress={() => token ? navigation.navigate('Cart') : navigation.navigate('Login' as any)}
                    >
                        <Ionicons name="bag-outline" size={22} color="#888" />
                        {cartItemCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                    <Ionicons name="search-outline" size={18} color={T.placeholder} />
                    <TextInput
                        style={[styles.searchInput, { color: T.text }]}
                        placeholder="Search parts, brands..."
                        placeholderTextColor={T.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={T.placeholder} />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDark ? '#1A0808' : '#FFF0F0' }]}>
                    <Ionicons name="options-outline" size={20} color="#FF3333" />
                </TouchableOpacity>
            </View>

            {/* Category Pills */}
            <View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={c => c.id}
                    contentContainerStyle={styles.catList}
                    renderItem={({ item: cat }) => (
                        <TouchableOpacity
                            style={[
                                styles.catPill,
                                { backgroundColor: T.inputBg, borderColor: T.inputBorder },
                                activeCategory === cat.id && styles.catPillActive
                            ]}
                            onPress={() => setActiveCategory(cat.id)}
                        >
                            <Ionicons name={cat.icon as any} size={14} color={activeCategory === cat.id ? '#FFF' : T.subText} />
                            <Text style={[styles.catText, { color: T.subText }, activeCategory === cat.id && styles.catTextActive]}>{cat.label}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#FF3333" />
                    <Text style={[styles.loadingText, { color: T.subText }]}>Loading inventory...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDevices}
                    keyExtractor={item => item.id?.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.colWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderCard}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="search" size={48} color="#333" />
                            <Text style={[styles.emptyText, { color: T.subText }]}>No parts found</Text>
                        </View>
                    }
                />
            )}

            {/* AI Chat FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Chat')} activeOpacity={0.8}>
                <LinearGradient colors={['#FF5555', '#CC1111']} style={styles.fabGrad}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 54,
        paddingBottom: 16,
    },
    greeting: { fontSize: 22, fontWeight: '800' },
    subGreeting: { fontSize: 13, marginTop: 2 },
    topBarRight: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#FF3333',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    cartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14 },
    filterBtn: {
        width: 46,
        height: 46,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#FF333344',
        justifyContent: 'center',
        alignItems: 'center',
    },
    catList: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    catPillActive: { backgroundColor: '#FF3333', borderColor: '#FF3333' },
    catText: { fontWeight: '600', fontSize: 13 },
    catTextActive: { color: '#FFF' },
    colWrapper: { paddingHorizontal: 14, gap: 12 },
    listContent: { paddingBottom: 100, gap: 12 },
    card: {
        flex: 1,
        height: 220,
        borderRadius: 18,
        overflow: 'hidden',
    },
    cardImg: { width: '100%', height: '100%', position: 'absolute' },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
    },
    brandChip: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,51,51,0.9)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    brandChipText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    cardBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    cardTitle: { color: '#FFF', fontWeight: '700', fontSize: 13, marginBottom: 6 },
    cardPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardPrice: { color: '#FF3333', fontWeight: '900', fontSize: 15 },
    miniCartBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FF3333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14 },
    emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 80 },
    emptyText: { fontSize: 16 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#FF3333',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 12,
    },
    fabGrad: {
        width: 58,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
