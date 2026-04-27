import React, { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    TextInput, ActivityIndicator, StatusBar, ScrollView, Pressable, Platform, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Product, RootStackParamList } from '../types';
import apiClient from '../services/apiClient';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useWishlistStore } from '../store/wishlistStore';
import { GarageSection } from '../components/GarageSection';
import { Toast } from '../components/Toast';

// Modular Components
import { VehicleFilterBar } from '../components/VehicleFilterBar';
import { CategoryList } from '../components/CategoryList';
import { ProfileMenu } from '../components/ProfileMenu';
import { ProductCard } from '../components/ProductCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
interface Props { navigation: HomeScreenNavigationProp; }

const PAGE_SIZE = 10;

export default function HomeScreen({ navigation }: Props) {
    // --- State Management ---
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeCondition, setActiveCondition] = useState('ALL');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortBy, setSortBy] = useState('Featured');
    const [refreshing, setRefreshing] = useState(false);
    const [showVehicleFilters, setShowVehicleFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Vehicle Selection State
    const [vehicleSelection, setVehicleSelection] = useState({
        make: '', model: '', year: '', fuel: '', trim: '', engine: ''
    });

    // --- Stores ---
    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const { token, role, logout, isGuest } = useAuthStore();
    const { items: wishlistItems, toggleWishlist } = useWishlistStore();
    const { addItem, items: cartItems } = useCartStore();
    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    // --- Data Fetching ---
    const { data: devices = [], isLoading: loading, refetch } = useQuery<Product[]>({
        queryKey: ['devices', activeCategory, activeCondition, vehicleSelection.engine],
        queryFn: async ({ signal }) => {
            let url = '/products';
            if (vehicleSelection.engine) {
                const vRes = await apiClient.get(`/vehicles/search?make=${encodeURIComponent(vehicleSelection.make)}&model=${encodeURIComponent(vehicleSelection.model)}&year=${vehicleSelection.year}&fuel=${encodeURIComponent(vehicleSelection.fuel)}&trim=${encodeURIComponent(vehicleSelection.trim)}&engine=${encodeURIComponent(vehicleSelection.engine)}`, { signal });
                if (vRes.data?.length > 0) url += `?vehicleId=${vRes.data[0].id}`;
            }
            if (activeCategory !== 'All') {
                url += (url.includes('?') ? '&' : '?') + `category=${activeCategory}`;
            }
            const response = await apiClient.get(url, { signal });
            return response.data;
        }
    });

    // --- Handlers ---
    const handleVehicleChange = (field: string, value: string) => {
        setVehicleSelection(prev => ({ ...prev, [field]: value }));
        if (field === 'engine' && value) setShowVehicleFilters(false);
    };

    const handleClearVehicle = () => {
        setVehicleSelection({ make: '', model: '', year: '', fuel: '', trim: '', engine: '' });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleAddToCart = useCallback((device: Product) => {
        if (isGuest || !token) {
            Alert.alert('Auth Required', 'Please log in to add items to cart.', [{ text: 'Login', onPress: logout }]);
            return;
        }

        if (role === 'ROLE_SELLER') {
            Alert.alert('Access Restricted', 'Seller accounts cannot purchase parts.');
            return;
        }
        const success = addItem({
            id: device.id.toString(),
            partName: device.partName || 'Unknown',
            price: device.price || 0,
            imageUrl: device.imageUrl || '',
            brand: device.brand || 'MAD GARAGE',
            stockQuantity: device.stockQuantity ?? 0
        });
        if (success) Toast.show({ message: 'Added to cart', type: 'success' });
    }, [isGuest, token, logout, addItem]);

    const handleToggleWishlist = async (product: Product) => {
        if (isGuest || !token) {
            Alert.alert('Auth Required', 'Please log in to save items.', [{ text: 'Login', onPress: () => navigation.navigate('Login' as any) }]);
            return;
        }
        const added = await toggleWishlist(product);
        Toast.show({ message: added ? 'Added to wishlist' : 'Removed', type: added ? 'success' : 'info' });
    };

    // --- Filtered Data ---
    const filteredDevices = useMemo(() => {
        return devices.filter(d => {
            if (d.flagged) return false;
            const matchSearch = (d.partName || '').toLowerCase().includes(deferredSearchQuery.toLowerCase());
            const matchCondition = activeCondition === 'ALL' || d.condition === activeCondition;
            return matchSearch && matchCondition;
        }).sort((a, b) => {
            if (sortBy === 'Price: Low to High') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'Price: High to Low') return (b.price || 0) - (a.price || 0);
            return 0;
        });
    }, [devices, deferredSearchQuery, activeCondition, sortBy]);

    const pagedDevices = useMemo(() => {
        return filteredDevices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    }, [filteredDevices, currentPage]);

    const totalPages = Math.ceil(filteredDevices.length / PAGE_SIZE);

    // --- Render Helpers ---
    const renderHeader = () => (
        <View>
            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1F1F1F' : '#F5EFEB' }]}>
                    <Ionicons name="search-outline" size={18} color={T.subText} />
                    <TextInput
                        style={[styles.searchInput, { color: T.text }]}
                        placeholder="Search for parts..."
                        placeholderTextColor={T.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDark ? '#1A0808' : '#FFF0F0' }]} onPress={() => setShowSortMenu(!showSortMenu)}>
                    <Ionicons name="options-outline" size={20} color={T.primary} />
                </TouchableOpacity>

                {showSortMenu && (
                    <View style={[styles.sortMenu, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                        {['Featured', 'Price: Low to High', 'Price: High to Low'].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.menuItem}
                                onPress={() => { setSortBy(option); setShowSortMenu(false); }}
                            >
                                <Ionicons
                                    name={sortBy === option ? 'radio-button-on' : 'radio-button-off'}
                                    size={16}
                                    color={sortBy === option ? '#DF2324' : T.subText}
                                />
                                <Text style={[styles.menuText, { color: sortBy === option ? T.text : T.subText }]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <GarageSection />

            <View style={{ paddingHorizontal: 20 }}>
                <VehicleFilterBar
                    selection={vehicleSelection}
                    onSelectionChange={handleVehicleChange}
                    onClear={handleClearVehicle}
                    isVisible={showVehicleFilters}
                    onToggleVisibility={() => setShowVehicleFilters(!showVehicleFilters)}
                    theme={T}
                />
            </View>

            <CategoryList activeCategory={activeCategory} onSelect={setActiveCategory} theme={T} />

            {/* Condition Filters */}
            <View style={styles.conditionFilterWrap}>
                <Text style={[styles.filterLabel, { color: T.subText }]}>Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {['ALL', 'NEW', 'USED', 'REFURBISHED'].map(cond => (
                        <TouchableOpacity
                            key={cond}
                            style={[styles.condPill, { backgroundColor: T.inputBg, borderColor: T.inputBorder }, activeCondition === cond && styles.condPillActive]}
                            onPress={() => setActiveCondition(cond)}
                        >
                            <Text style={[styles.condText, { color: T.subText }, activeCondition === cond && { color: '#FFF' }]}>{cond}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Part Request Banner */}
            <View style={styles.requestBannerWrap}>
                <View style={styles.requestBanner}>
                    <View style={{ flex: 1, marginBottom: 12 }}>
                        <Text style={styles.requestBannerTitle}>HARD TO FIND A{"\n"}<Text style={{ color: '#DF2324', fontStyle: 'italic', textTransform: 'uppercase' }}>SPECIFIC PART?</Text></Text>
                        <Text style={styles.requestBannerSub}>Our global sourcing experts can track down rare spares from scrap yards and manufacturers worldwide.</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.requestBannerBtn}
                        onPress={() => navigation.navigate('PartRequest')}
                    >
                        <Text style={styles.requestBannerBtnTxt}>Request Area</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderFooter = () => (
        <View style={{ paddingBottom: 100 }}>
            {totalPages > 1 && (
                <View style={styles.paginationRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <TouchableOpacity key={i} style={[styles.pageBtn, currentPage === i + 1 && styles.pageBtnActive]} onPress={() => setCurrentPage(i + 1)}>
                                <Text style={[styles.pageText, currentPage === i + 1 && { color: '#FFF' }]}>{i + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: T.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={styles.clayfulHeaderTop}>
                <Image source={require('../../assets/app_logo.png')} style={styles.logo} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.clayfulHeaderTitle}>MAD GARAGE</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (isGuest) {
                                Alert.alert('Log In Required', 'Please log in to access your cart and place orders.', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Log In', onPress: logout }
                                ]);
                                return;
                            }
                            navigation.navigate('Cart');
                        }} 
                        style={styles.clayfulHeaderBtn}
                    >
                        <Ionicons name="bag-outline" size={22} color={T.text} />
                        {cartItemCount > 0 && <View style={styles.clayfulBadge}><Text style={styles.clayfulBadgeText}>{cartItemCount}</Text></View>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowProfileMenu(!showProfileMenu)} style={styles.clayfulHeaderBtn}>
                        <Ionicons name="ellipsis-vertical-outline" size={20} color={T.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ProfileMenu
                isVisible={showProfileMenu}
                onClose={() => setShowProfileMenu(false)}
                navigation={navigation}
                theme={T}
                isDark={isDark}
                toggleTheme={toggleTheme}
                wishlistCount={wishlistItems.length}
                onLogout={logout}
                isGuest={isGuest}
            />

            {loading && !refreshing ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#DF2324" /></View>
            ) : (
                <FlatList
                    data={pagedDevices}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.colWrapper}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            onPress={() => navigation.navigate('ProductDetails', { product: item })}
                            onWishlist={() => handleToggleWishlist(item)}
                            onAddToCart={() => handleAddToCart(item)}
                            isWishlisted={wishlistItems.some(w => w.id === item.id)}
                            isSeller={role === 'ROLE_SELLER'}
                            theme={T}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DF2324" />}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Chat')}>
                <LinearGradient colors={['#FF5555', '#CC1111']} style={styles.fabGrad}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginVertical: 16 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 14, height: 48, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700' },
    filterBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    conditionFilterWrap: { paddingHorizontal: 20, marginBottom: 20 },
    filterLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    condPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginRight: 8 },
    condPillActive: { backgroundColor: '#DF2324', borderColor: '#DF2324' },
    condText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    requestBannerWrap: { paddingHorizontal: 20, marginBottom: 20 },
    requestBanner: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
    requestBannerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 6, lineHeight: 24 },
    requestBannerSub: { color: '#AAA', fontSize: 11, fontWeight: '500', lineHeight: 15, paddingRight: 10 },
    requestBannerBtn: { backgroundColor: '#DF2324', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 4 },
    requestBannerBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    colWrapper: { paddingHorizontal: 12, justifyContent: 'space-between' },
    listContent: { paddingBottom: 100 },
    clayfulHeaderTop: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
    logo: { width: 32, height: 32, borderRadius: 16 },
    clayfulHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#DF2324', textAlign: 'center', letterSpacing: -1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    clayfulHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    clayfulBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#DF2324', borderRadius: 7, width: 14, height: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
    clayfulBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
    paginationRow: { marginVertical: 20, alignItems: 'center' },
    pageBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
    pageBtnActive: { backgroundColor: '#DF2324' },
    pageText: { color: '#888', fontSize: 12, fontWeight: '900' },
    fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 30, elevation: 8 },
    fabGrad: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    sortMenu: {
        position: 'absolute',
        top: 60,
        right: 0,
        width: 180,
        borderRadius: 12,
        paddingVertical: 5,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        gap: 12,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
