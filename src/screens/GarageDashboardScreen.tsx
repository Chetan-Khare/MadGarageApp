import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, TextInput, Alert, StatusBar, Image, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { useCartStore, CartItem } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useLocationStore } from '../store/locationStore';

import ModernDropdown from '../components/ModernDropdown';
import { ListCardSkeleton } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { RefreshControl } from 'react-native';
import { ProductImage } from '../components/ProductImage';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GarageDashboard'>;
};

const CATEGORIES = [
    { id: 'All', label: 'All Parts', icon: 'apps-outline' as const },
    { id: 'Brakes', label: 'Brakes', icon: 'disc-outline' as const },
    { id: 'Engine', label: 'Engine', icon: 'speedometer-outline' as const },
    { id: 'Suspension', label: 'Suspension', icon: 'construct-outline' as const },
    { id: 'Exhaust', label: 'Exhaust', icon: 'flame-outline' as const },
    { id: 'Electrical', label: 'Electrical', icon: 'flash-outline' as const },
];

export interface GarageProduct {
    id: number;
    name: string;
    originalPrice: number;
    garagePrice: number;
    imageUrl: string;
    category?: string;
    condition?: string;
    color?: string;
    stockQuantity?: number;
    deviceName?: string; // For fallback
    flagged?: boolean;
}

export default function GarageDashboardScreen({ navigation }: Props) {
    const [products, setProducts] = useState<GarageProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activeCondition, setActiveCondition] = useState('ALL');

    // Vehicle Selection State
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [fuels, setFuels] = useState<string[]>([]);
    const [trims, setTrims] = useState<string[]>([]);
    const [engines, setEngines] = useState<string[]>([]);

    const [selectedMake, setSelectedMake] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedFuel, setSelectedFuel] = useState<string>('');
    const [selectedTrim, setSelectedTrim] = useState<string>('');
    const [selectedEngine, setSelectedEngine] = useState<string>('');

    // Search & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortBy, setSortBy] = useState('Featured');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showVehicleFilters, setShowVehicleFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Fitting Management State
    const [fittingOrders, setFittingOrders] = useState<any[]>([]);
    const [fittingLoading, setFittingLoading] = useState(false);

    const { addItem, items } = useCartStore();
    const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const { logout, token, isGuest } = useAuthStore();
    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const PRIMARY = '#DF2324';
    const wishlistItems = useWishlistStore(s => s.items);
    const toggleWishlist = useWishlistStore(s => s.toggleWishlist);

    useEffect(() => {
        fetchProducts(activeCategory);
        fetchMakes();
        fetchFittingOrders();
    }, [selectedEngine]);

    const fetchMakes = async () => {
        try {
            const response = await apiClient.get('/vehicles/makes');
            setMakes(response.data);
        } catch (error) {
            console.error('Error fetching makes:', error);
        }
    };

    const fetchModels = async (make: string) => {
        try {
            const response = await apiClient.get(`/vehicles/models?make=${make}`);
            setModels(response.data);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    const fetchYears = async (make: string, model: string) => {
        try {
            const response = await apiClient.get(`/vehicles/years?make=${make}&model=${model}`);
            setYears(response.data);
        } catch (error) {
            console.error('Error fetching years:', error);
        }
    };

    const fetchFuels = async (make: string, model: string, year: string) => {
        try {
            const response = await apiClient.get(`/vehicles/fuels?make=${make}&model=${model}&year=${year}`);
            setFuels(response.data);
            setTrims([]);
            setEngines([]);
        } catch (error) {
            console.error('Error fetching fuels:', error);
        }
    };

    const fetchTrims = async (make: string, model: string, year: string, fuel: string) => {
        try {
            const response = await apiClient.get(`/vehicles/trims?make=${make}&model=${model}&year=${year}&fuel=${fuel}`);
            setTrims(response.data);
            setEngines([]);
        } catch (error) {
            console.error('Error fetching trims:', error);
        }
    };

    const handleToggleWishlist = async (product: any) => {
        if (isGuest || !token) {
            Alert.alert(
                'Authentication Required',
                'Log in or create an account to save parts to your wishlist.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => logout() }
                ]
            );
            return;
        }
        const added = await toggleWishlist(product);
        Toast.show({ 
            message: added ? `${product.partName || product.name} added to wishlist` : 'Removed from wishlist', 
            type: added ? 'success' : 'info' 
        });
    };

    const fetchEngines = async (make: string, model: string, year: string, fuel: string, trim: string) => {
        try {
            const response = await apiClient.get(`/vehicles/engines?make=${make}&model=${model}&year=${year}&fuel=${fuel}&trim=${trim}`);
            setEngines(response.data);
        } catch (error) {
            console.error('Error fetching engines:', error);
        }
    };

    const handleMakeChange = (make: string) => {
        setSelectedMake(make);
        setSelectedModel('');
        setSelectedYear('');
        setSelectedFuel('');
        setSelectedTrim('');
        setSelectedEngine('');
        setModels([]);
        setYears([]);
        setFuels([]);
        setTrims([]);
        setEngines([]);
        if (make) fetchModels(make);
    };

    const handleModelChange = (model: string) => {
        setSelectedModel(model);
        setSelectedYear('');
        setSelectedFuel('');
        setSelectedTrim('');
        setSelectedEngine('');
        setYears([]);
        setFuels([]);
        setTrims([]);
        setEngines([]);
        if (model) fetchYears(selectedMake, model);
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        setSelectedFuel('');
        setSelectedTrim('');
        setSelectedEngine('');
        setFuels([]);
        setTrims([]);
        setEngines([]);
        if (year) fetchFuels(selectedMake, selectedModel, year);
    };

    const handleFuelChange = (fuel: string) => {
        setSelectedFuel(fuel);
        setSelectedTrim('');
        setSelectedEngine('');
        setTrims([]);
        setEngines([]);
        if (fuel) fetchTrims(selectedMake, selectedModel, selectedYear, fuel);
    };

    const handleTrimChange = (trim: string) => {
        setSelectedTrim(trim);
        setSelectedEngine('');
        setEngines([]);
        if (trim) fetchEngines(selectedMake, selectedModel, selectedYear, selectedFuel, trim);
    };

    const fetchProducts = async (category: string | null = null) => {
        setLoading(true);
        setCurrentPage(1);
        try {
            let url = '/products/garage';
            if (selectedEngine) {
                // Backend /search expects 'fuel' and 'engine' (not fuelType/engineType)
                const vRes = await apiClient.get(`/vehicles/search?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${selectedYear}&fuel=${encodeURIComponent(selectedFuel)}&trim=${encodeURIComponent(selectedTrim)}&engine=${encodeURIComponent(selectedEngine)}`);
                if (vRes.data && vRes.data.length > 0) {
                    url += (url.includes('?') ? '&' : '?') + `vehicleId=${vRes.data[0].id}`;
                }
            }
            if (category && category !== 'All') {
                url += (url.includes('?') ? '&' : '?') + `category=${category}`;
            }

            const response = await apiClient.get(url);
            setProducts(response.data);
            setActiveCategory(category);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([
                { id: 1, name: 'Plasma Thruster', originalPrice: 1200, garagePrice: 1140, imageUrl: 'https://via.placeholder.com/150' },
                { id: 2, name: 'Quantum Stabilizer', originalPrice: 850, garagePrice: 807.50, imageUrl: 'https://via.placeholder.com/150' }
            ] as any);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const clearVehicleFilter = () => {
        setSelectedMake('');
        setSelectedModel('');
        setSelectedYear('');
        setSelectedFuel('');
        setSelectedTrim('');
        setSelectedEngine('');
        setModels([]);
        setYears([]);
        setFuels([]);
        setTrims([]);
        setEngines([]);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProducts(activeCategory);
    };

    const fetchFittingOrders = async () => {
        setFittingLoading(true);
        try {
            const response = await apiClient.get('/orders/garage-fittings');
            setFittingOrders(response.data);
        } catch (error) {
            console.error('Error fetching fitting orders:', error);
        } finally {
            setFittingLoading(false);
        }
    };

    const updateFittingStatus = async (orderId: number, status: string) => {
        try {
            await apiClient.patch(`/orders/${orderId}/fitting-status?status=${status}`);
            fetchFittingOrders();
            Toast.show({ message: `Fitting marked as ${status.replace('_', ' ')}`, type: 'success' });
        } catch (error) {
            Alert.alert("Error", "Could not update fitting status.");
        }
    };

    const handleLogout = async () => {
        await logout();
    };



    const filteredProducts = products.filter(p => {
        if (p.flagged) return false; // Safety Shield: Hide flagged listings
        const name = p.name || p.deviceName || '';
        const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = !activeCategory || activeCategory === 'All' || p.category?.toLowerCase() === activeCategory.toLowerCase();
        const matchCondition = activeCondition === 'ALL' || p.condition === activeCondition;
        return matchSearch && matchCat && matchCondition;
    }).sort((a, b) => {
        if (sortBy === 'Price: Low to High') return (a.garagePrice || a.originalPrice) - (b.garagePrice || b.originalPrice);
        if (sortBy === 'Price: High to Low') return (b.garagePrice || b.originalPrice) - (a.garagePrice || a.originalPrice);
        if (sortBy === 'Name: A to Z') {
            const nameA = (a.name || a.deviceName || '').toLowerCase();
            const nameB = (b.name || b.deviceName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        }
        return 0;
    });

    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const renderItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: T.statBg }]}
                onPress={() => navigation.navigate('ProductDetails' as any, { product: item })}
                activeOpacity={0.85}
            >
                <View style={styles.cardInner}>
                    <ProductImage product={item} style={styles.cardImg} resizeMode="cover" />
                    {(item.manufacturer || item.brand || item.brandName) ? (
                        <View style={styles.brandChip}>
                            <Text style={styles.brandChipText}>{item.manufacturer || item.brand || item.brandName}</Text>
                        </View>
                    ) : null}
                    <View style={styles.conditionChip}>
                        <Text style={[styles.conditionChipText, { color: item.condition === 'USED' ? '#FFA500' : (item.condition === 'REFURBISHED' ? '#00BFFF' : '#00FF00') }]}>{item.condition || 'NEW'}</Text>
                    </View>
                    <View style={[styles.cardBottom, { backgroundColor: T.statBg }]}>
                        <Text style={[styles.cardTitle, { color: T.text }]} numberOfLines={1}>{item?.partName || item?.deviceName || item?.name || 'Unknown Part'}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={10} color="#FFD700" />
                            <Text style={[styles.ratingText, { color: T.subText }]}>{item.rating || '4.8'}</Text>
                        </View>
                        <View style={styles.cardPriceRow}>
                            <Text style={styles.cardPrice}>₹{item.garagePrice?.toLocaleString()}</Text>
                            <View style={styles.cardActions}>
                                {/* Wishlist heart */}
                                <TouchableOpacity
                                    style={[styles.miniWishBtn, wishlistItems.some(w => w.id === item.id) && styles.miniWishBtnActive]}
                                    onPress={() => handleToggleWishlist(item)}
                                >
                                    <Ionicons
                                        name={wishlistItems.some(w => w.id === item.id) ? 'heart' : 'heart-outline'}
                                        size={14}
                                        color={wishlistItems.some(w => w.id === item.id) ? '#FFF' : '#DF2324'}
                                    />
                                </TouchableOpacity>
                                {/* Add to cart */}
                                <TouchableOpacity
                                    style={styles.miniCartBtn}
                                    onPress={() => {
                                        const success = addItem({
                                            id: item.id.toString(),
                                            deviceName: item.name,
                                            price: item.originalPrice,
                                            imageUrl: item.imageUrl,
                                            manufacturer: 'Wholesale Part',
                                            quantity: 1,
                                            stockQuantity: item.stockQuantity ?? 0
                                        });
                                        if (!success) {
                                            Alert.alert("Stock Limit", "No more stock available for this part.");
                                        }
                                    }}
                                >
                                    <Ionicons name="add" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => (
        <View style={{ paddingBottom: 100 }}>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <View style={styles.paginationRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paginationScroll}>
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const p = i + 1;
                            const isActive = currentPage === p;
                            return (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.pageBtn, isActive && styles.pageBtnActive]}
                                    onPress={() => setCurrentPage(p)}
                                >
                                    <Text style={[styles.pageText, isActive && styles.pageTextActive]}>{p}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Massive Web Hero Match - Added to Bottom as requested */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>BUILT FOR <Text style={{ color: '#DF2324', fontStyle: 'italic' }}>SPEED.</Text></Text>
                <Text style={styles.heroSubtitle}>Premium wholesale parts for professional workshops. Engineered for the track, optimized for your business.</Text>

                {/* Trust Badges */}
                <View style={styles.badgesWrapper}>
                    <View style={styles.badgeItem}>
                        <View style={styles.badgeIconWrap}><Ionicons name="shield-checkmark" size={20} color="#DF2324" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.badgeTitle}>Certified Parts</Text><Text style={styles.badgeDesc}>100% Genuine</Text></View>
                    </View>
                    <View style={styles.badgeItem}>
                        <View style={styles.badgeIconWrap}><Ionicons name="scan" size={20} color="#DF2324" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.badgeTitle}>Precision Fitment</Text><Text style={styles.badgeDesc}>AI-matched for you</Text></View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderVehicleFilters = () => (
        <View>
            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                    <Ionicons name="search-outline" size={18} color={T.placeholder} />
                    <TextInput
                        style={[styles.searchInput, { color: T.text }]}
                        placeholder="Search wholesale parts..."
                        placeholderTextColor={T.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, { backgroundColor: isDark ? '#1A0808' : '#FFF0F0' }]}
                    onPress={() => setShowSortMenu(!showSortMenu)}
                >
                    <Ionicons name="options-outline" size={20} color={T.primary} />
                </TouchableOpacity>

                {showSortMenu && (
                    <View style={[styles.sortMenu, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                        {['Featured', 'Price: Low to High', 'Price: High to Low', 'Name: A to Z'].map((option) => (
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

            {/* Incoming Fitting Requests Section */}
            {fittingOrders.length > 0 && (
                <View style={[styles.fittingSection, { backgroundColor: T.headerBg }]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.iconBox, { backgroundColor: '#DF232422' }]}>
                                <Ionicons name="construct" size={18} color="#DF2324" />
                            </View>
                            <View>
                                <Text style={[styles.sectionTitle, { color: T.text }]}>INCOMING FITTINGS</Text>
                                <Text style={[styles.sectionSubtitle, { color: T.subText }]}>Local Installation Network</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={fetchFittingOrders}>
                            <Ionicons name="refresh" size={20} color={T.subText} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fittingScroll}>
                        {fittingOrders.map((order) => (
                            <View key={order.id} style={[styles.fittingCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                                <View style={styles.fittingHeader}>
                                    <View style={styles.orderIdBadge}>
                                        <Text style={styles.orderIdText}>#{order.id}</Text>
                                    </View>
                                    <Text style={[styles.fittingStatus, { color: order.fittingStatus === 'COMPLETED' ? '#00FF00' : '#FFA500' }]}>
                                        {order.fittingStatus?.replace('_', ' ')}
                                    </Text>
                                </View>
                                
                                <Text style={[styles.customerName, { color: T.text }]}>{order.customerName}</Text>
                                <Text style={[styles.customerAddress, { color: T.subText }]} numberOfLines={1}>{order.shippingAddress}</Text>

                                <View style={styles.fittingActions}>
                                    {order.fittingStatus === 'PENDING' && (
                                        <TouchableOpacity 
                                            style={[styles.statusBtn, { backgroundColor: '#FFA50022' }]}
                                            onPress={() => updateFittingStatus(order.id, 'INSPECTED')}
                                        >
                                            <Text style={[styles.statusBtnText, { color: '#FFA500' }]}>MARK INSPECTED</Text>
                                        </TouchableOpacity>
                                    )}
                                    {order.fittingStatus === 'INSPECTED' && (
                                        <TouchableOpacity 
                                            style={[styles.statusBtn, { backgroundColor: '#00FF0022' }]}
                                            onPress={() => updateFittingStatus(order.id, 'COMPLETED')}
                                        >
                                            <Text style={[styles.statusBtnText, { color: '#00FF00' }]}>COMPLETE FITTING</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity 
                                        style={[styles.statusBtn, { backgroundColor: T.inputBg }]}
                                        onPress={() => navigation.navigate('OrderDetails' as any, { orderId: order.id })}
                                    >
                                        <Ionicons name="eye-outline" size={14} color={T.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Dedicated Vehicle Selection Bar */}
            <View style={styles.vehicleBarWrapper}>
                <TouchableOpacity
                    style={[
                        styles.vehicleToggleBar,
                        { backgroundColor: T.inputBg, borderColor: selectedEngine ? '#DF232466' : T.inputBorder }
                    ]}
                    onPress={() => {
                        if (Platform.OS === 'android' || Platform.OS === 'ios') {
                            const { LayoutAnimation } = require('react-native');
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        }
                        setShowVehicleFilters(!showVehicleFilters);
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="car-outline" size={18} color={selectedEngine ? '#DF2324' : T.subText} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        {selectedEngine ? (
                            <Text style={[styles.vehicleSummaryText, { color: T.text }]}>
                                {selectedYear} {selectedMake} {selectedModel} • {selectedTrim}
                            </Text>
                        ) : (
                            <Text style={[styles.vehiclePlaceholderText, { color: T.subText }]}>
                                Select Your Vehicle for Precise Fitment
                            </Text>
                        )}
                    </View>
                    <Ionicons
                        name={showVehicleFilters ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={T.subText}
                    />
                </TouchableOpacity>

                {selectedEngine && !showVehicleFilters && (
                    <TouchableOpacity
                        style={styles.clearVehicleBtn}
                        onPress={clearVehicleFilter}
                    >
                        <Ionicons name="close-circle" size={20} color="#DF2324" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Vehicle Selection Section */}
            {showVehicleFilters && (
                <View style={[styles.vehicleFilterContainer, { backgroundColor: T.bg }]}>
                    <View style={styles.pickerRow}>
                        <ModernDropdown
                            label="MAKE"
                            value={selectedMake}
                            options={makes}
                            onSelect={handleMakeChange}
                            placeholder="Select Make"
                            containerStyle={{ flex: 1 }}
                        />
                        <ModernDropdown
                            label="MODEL"
                            value={selectedModel}
                            options={models}
                            onSelect={handleModelChange}
                            placeholder="Select Model"
                            enabled={!!selectedMake}
                            containerStyle={{ flex: 1 }}
                        />
                    </View>

                    <View style={styles.pickerRow}>
                        <ModernDropdown
                            label="YEAR"
                            value={selectedYear}
                            options={years.map(y => y.toString())}
                            onSelect={handleYearChange}
                            placeholder="Select Year"
                            enabled={!!selectedModel}
                            containerStyle={{ flex: 1, marginRight: 12 }}
                        />
                        <ModernDropdown
                            label="FUEL"
                            value={selectedFuel}
                            options={fuels}
                            onSelect={handleFuelChange}
                            placeholder="Select Fuel"
                            enabled={!!selectedYear}
                            containerStyle={{ flex: 1 }}
                        />
                    </View>

                    <View style={styles.pickerRow}>
                        <ModernDropdown
                            label="TRIM"
                            value={selectedTrim}
                            options={trims}
                            onSelect={handleTrimChange}
                            placeholder="Select Trim"
                            enabled={!!selectedFuel}
                            containerStyle={{ flex: 1, marginRight: 12 }}
                        />
                        <ModernDropdown
                            label="ENGINE"
                            value={selectedEngine}
                            options={engines}
                            onSelect={(val) => {
                                setSelectedEngine(val);
                                // Collapse on final selection
                                if (Platform.OS === 'android' || Platform.OS === 'ios') {
                                    const { LayoutAnimation } = require('react-native');
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                }
                                setShowVehicleFilters(false);
                            }}
                            placeholder="Select Engine"
                            enabled={!!selectedTrim}
                            containerStyle={{ flex: 1 }}
                        />
                    </View>
                </View>
            )}

            {/* Category Pills */}
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
                        onPress={() => fetchProducts(cat.id === 'All' ? null : cat.id)}
                    >
                        <Ionicons name={cat.icon as any} size={14} color={activeCategory === cat.id ? '#FFF' : T.subText} />
                        <Text style={[styles.catText, { color: T.subText }, activeCategory === cat.id && styles.catTextActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Condition Filter Row */}
            <View style={[styles.conditionFilterWrap, { backgroundColor: T.bg }]}>
                <Text style={[styles.filterLabel, { color: T.subText }]}>Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conditionScroll}>
                    {[
                        { id: 'ALL', label: 'All', icon: 'list-outline' as const },
                        { id: 'NEW', label: 'New', icon: 'sparkles-outline' as const },
                        { id: 'USED', label: 'Used', icon: 'refresh-outline' as const },
                        { id: 'REFURBISHED', label: 'Refurbished', icon: 'build-outline' as const },
                    ].map(cond => (
                        <TouchableOpacity
                            key={cond.id}
                            style={[
                                styles.condPill,
                                { backgroundColor: T.inputBg, borderColor: T.inputBorder },
                                activeCondition === cond.id && styles.condPillActive
                            ]}
                            onPress={() => setActiveCondition(cond.id)}
                        >
                            <Ionicons
                                name={cond.icon as any}
                                size={12}
                                color={activeCondition === cond.id ? '#FFF' : (cond.id === 'REFURBISHED' ? '#00BFFF' : T.subText)}
                            />
                            <Text style={[
                                styles.condText,
                                { color: cond.id === 'REFURBISHED' && activeCondition !== cond.id ? '#00BFFF' : T.subText },
                                activeCondition === cond.id && styles.condTextActive
                            ]}>{cond.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Huge Web Part Request Banner - Restored to Header */}
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

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.headerBg} />
            {/* Minimalist Clayful-Inspired Header */}
            <View style={[styles.clayfulHeaderTop, { backgroundColor: T.bg }]}>
                <TouchableOpacity onPress={() => setShowProfileMenu(!showProfileMenu)} style={styles.clayfulHeaderBtn}>
                    <Image 
                        source={require('../../assets/app_logo.png')} 
                        style={{ width: 28, height: 28, borderRadius: 14, overflow: 'hidden' }} 
                        resizeMode="cover" 
                    />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.clayfulHeaderTitle}>MAD GARAGE</Text>
                    <Text style={[styles.clayfulHeaderSubtitle, { color: T.subText }]}>WHOLESALE PORTAL</Text>
                </View>
                
                <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.clayfulHeaderBtn}>
                    <Ionicons name="bag-outline" size={22} color={T.text} />
                    {(cartItemsCount ?? 0) > 0 && (
                        <View style={styles.clayfulBadge}>
                            <Text style={styles.clayfulBadgeText}>{cartItemsCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {showProfileMenu && (
                <View style={[styles.profileMenu, { backgroundColor: T.statBg, borderColor: T.statBorder, top: 40, left: 16 }]}>
                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('GarageProfile' as any); }}
                    >
                        <Ionicons name="person-circle-outline" size={18} color={T.text} />
                        <Text style={[styles.profileMenuText, { color: T.text }]}>Garage Profile</Text>
                    </TouchableOpacity>
                    <View style={styles.profileMenuDivider} />

                    <TouchableOpacity style={styles.profileMenuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('Address' as any); }}>
                        <Ionicons name="map-outline" size={18} color={T.text} />
                        <Text style={[styles.profileMenuText, { color: T.text }]}>Manage Addresses</Text>
                    </TouchableOpacity>
                    <View style={styles.profileMenuDivider} />

                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('OrderHistory' as any); }}
                    >
                        <Ionicons name="receipt-outline" size={18} color={T.text} />
                        <Text style={[styles.profileMenuText, { color: T.text }]}>Order History</Text>
                    </TouchableOpacity>
                    <View style={styles.profileMenuDivider} />
                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); navigation.navigate('Wishlist' as any); }}
                    >
                        <Ionicons name="heart-outline" size={18} color={T.text} />
                        <Text style={[styles.profileMenuText, { color: T.text }]}>
                            My Wishlist{wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ''}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.profileMenuDivider} />
                    <TouchableOpacity
                        style={styles.profileMenuItem}
                        onPress={() => { setShowProfileMenu(false); handleLogout(); }}
                    >
                        <Ionicons name="log-out-outline" size={18} color="#DF2324" />
                        <Text style={[styles.profileMenuText, { color: '#DF2324' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 12 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <ListCardSkeleton key={i} />)}
                </View>
            ) : (
                <FlatList
                    key={`products-${activeCategory || 'all'}-${activeCondition}`}
                    data={pagedProducts}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.colWrapper}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderItem}
                    ListHeaderComponent={renderVehicleFilters}
                    ListFooterComponent={renderFooter}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={PRIMARY}
                            colors={[PRIMARY]}
                        />
                    }
                />
            )}

            {/* Floating Chat Assistant Button */}
            <TouchableOpacity
                style={styles.chatFab}
                onPress={() => navigation.navigate('Chat')}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#FF5555', '#CC1111']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    profileMenu: {
        position: 'absolute',
        top: 50,
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
    },
    profileMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        gap: 12,
    },
    profileMenuText: {
        fontSize: 14,
        fontWeight: '600',
    },
    profileMenuDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginHorizontal: 10,
    },
    fittingSection: { paddingVertical: 20, marginBottom: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    sectionSubtitle: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    fittingScroll: { paddingHorizontal: 20, gap: 12 },
    fittingCard: { width: 260, padding: 16, borderRadius: 20, borderWidth: 1 },
    fittingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    orderIdBadge: { backgroundColor: '#DF232411', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    orderIdText: { fontSize: 10, fontWeight: '900', color: '#DF2324' },
    fittingStatus: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    customerName: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    customerAddress: { fontSize: 11, fontWeight: '600', marginBottom: 15 },
    fittingActions: { flexDirection: 'row', gap: 8 },
    statusBtn: { flex: 1, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    statusBtnText: { fontSize: 9, fontWeight: '900' },
    title: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    subtitle: { fontSize: 13, marginTop: 2 },
    cartIconContainer: { position: 'relative' },
    badge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: '#DF2324',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    listContent: { paddingBottom: 100, gap: 12 },
    colWrapper: { paddingHorizontal: 14, gap: 12 },
    card: {
        flex: 1,
        height: 240,
        borderRadius: 12,
        overflow: 'visible',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardInner: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardImg: { width: '100%', height: 150 },
    brandChip: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(223,35,36,0.9)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    brandChipText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    conditionChip: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    conditionChipText: { color: '#00FF00', fontSize: 10, fontWeight: '800' },
    cardBottom: {
        padding: 12,
    },
    cardTitle: { fontWeight: '700', fontSize: 13, marginBottom: 4 },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
    },
    cardPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardPrice: { color: '#DF2324', fontWeight: '900', fontSize: 15 },
    miniCartBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: '#DF2324',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    miniWishBtn: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#DF2324',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniWishBtnActive: {
        backgroundColor: '#DF2324',
        borderColor: '#DF2324',
    },
    filterContainer: { paddingVertical: 12, backgroundColor: 'transparent' },
    filterScroll: { paddingHorizontal: 15, gap: 8 },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    filterPillActive: {
        backgroundColor: '#DF2324',
    },
    filterText: { fontWeight: 'bold', fontSize: 13 },
    filterTextActive: { color: '#FFF' },
    vehicleFilterContainer: {
        paddingVertical: 12,
    },
    pickerRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 15,
        marginBottom: 4,
    },
    chatFab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 10,
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    fabGradient: {
        flex: 1,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14 },
    filterBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    vehicleToggleBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    vehicleSummaryText: {
        fontSize: 13,
        fontWeight: '800',
    },
    vehiclePlaceholderText: {
        fontSize: 13,
        fontWeight: '600',
    },
    clearVehicleBtn: {
        marginLeft: 10,
        padding: 5,
    },
    catList: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    catPillActive: { backgroundColor: '#DF2324' },
    catText: { fontWeight: '600', fontSize: 13 },
    catTextActive: { color: '#FFF' },
    conditionFilterWrap: { paddingHorizontal: 20, paddingBottom: 15 },
    filterLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    conditionScroll: { gap: 8 },
    condPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        gap: 5,
    },
    condPillActive: { backgroundColor: '#DF2324', borderColor: '#DF2324' },
    condText: { fontSize: 11, fontWeight: '700' },
    condTextActive: { color: '#FFF' },
    sortMenu: {
        position: 'absolute',
        top: 65,
        right: 15,
        width: 180,
        borderRadius: 12,
        paddingVertical: 5,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
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
    requestBannerWrap: {
        marginTop: 20,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    requestBanner: {
        backgroundColor: '#1A1A1A',
        borderColor: '#333333',
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'column',
    },
    requestBannerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
        marginBottom: 6,
        lineHeight: 24,
    },
    requestBannerSub: {
        color: '#AAAAAA',
        fontSize: 11,
        fontWeight: '500',
        lineHeight: 15,
        paddingRight: 10,
    },
    requestBannerBtn: {
        backgroundColor: '#DF2324',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    requestBannerBtnTxt: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    heroSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: -2,
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 52,
        marginBottom: 12,
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#AAAAAA',
        textAlign: 'center',
        paddingHorizontal: 10,
        marginBottom: 24,
        lineHeight: 20,
    },
    badgesWrapper: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
        width: '100%',
    },
    badgeItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1A1A1A',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    badgeIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(223,35,36,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeTitle: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    badgeDesc: {
        color: '#888',
        fontSize: 9,
        fontWeight: '600',
    },
    paginationRow: {
        marginVertical: 20,
        alignItems: 'center',
    },
    paginationScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    pageBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageBtnActive: {
        backgroundColor: '#DF2324',
        borderColor: '#DF2324',
    },
    pageText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    pageTextActive: {
        color: '#FFF',
    },
    clayfulHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    clayfulHeaderBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    clayfulHeaderTitle: {
        fontSize: 22,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: -1,
        color: '#DF2324',
        textAlign: 'center',
    },
    clayfulHeaderSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        opacity: 0.8,
        textAlign: 'center',
        marginTop: -2,
    },
    clayfulBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#DF2324',
        borderRadius: 8,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    clayfulBadgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
});
