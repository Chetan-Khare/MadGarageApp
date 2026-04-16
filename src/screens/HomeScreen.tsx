import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    TextInput, ActivityIndicator, StatusBar, ScrollView, TouchableWithoutFeedback, Alert, RefreshControl, Platform, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Product, RootStackParamList } from '../types';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import ModernDashboardHeader from '../components/ModernDashboardHeader';
import ModernDropdown from '../components/ModernDropdown';
import { useWishlistStore } from '../store/wishlistStore';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import { Toast } from '../components/Toast';
import { ProductImage } from '../components/ProductImage';

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

const CONDITIONS = [
    { id: 'ALL', label: 'All', icon: 'list-outline' },
    { id: 'NEW', label: 'New', icon: 'sparkles-outline' },
    { id: 'USED', label: 'Used', icon: 'refresh-outline' },
    { id: 'REFURBISHED', label: 'Refurbished', icon: 'build-outline' }
];


export default function HomeScreen({ navigation }: Props) {
    const [devices, setDevices] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeCondition, setActiveCondition] = useState('ALL');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortBy, setSortBy] = useState('Featured');
    const [refreshing, setRefreshing] = useState(false);
    const [showVehicleFilters, setShowVehicleFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

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

    const addItem = useCartStore((state) => state.addItem);
    const cartItems = useCartStore((state) => state.items);
    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const token = useAuthStore((state) => state.token);
    const role = useAuthStore((state) => state.role);
    const logout = useAuthStore((state) => state.logout);
    const isGuest = useAuthStore((state) => state.isGuest);
    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const wishlistItems = useWishlistStore(s => s.items);
    const toggleWishlist = useWishlistStore(s => s.toggleWishlist);

    useEffect(() => {
        const controller = new AbortController();
        fetchDevices(selectedEngine ? undefined : controller.signal);
        fetchMakes();
        if (!isGuest && token) {
            useWishlistStore.getState().loadWishlist();
        }
        return () => controller.abort();
    }, [selectedEngine, activeCategory, activeCondition]);

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
            const response = await apiClient.get(`/vehicles/models?make=${encodeURIComponent(make)}`);
            setModels(response.data);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    const fetchYears = async (make: string, model: string) => {
        try {
            const response = await apiClient.get(`/vehicles/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
            setYears(response.data);
        } catch (error) {
            console.error('Error fetching years:', error);
        }
    };

    const fetchFuels = async (make: string, model: string, year: string) => {
        try {
            const response = await apiClient.get(`/vehicles/fuels?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`);
            setFuels(response.data);
            setTrims([]);
            setEngines([]);
        } catch (error) {
            console.error('Error fetching fuels:', error);
        }
    };

    const fetchTrims = async (make: string, model: string, year: string, fuel: string) => {
        try {
            const response = await apiClient.get(`/vehicles/trims?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&fuel=${encodeURIComponent(fuel)}`);
            setTrims(response.data);
            setEngines([]);
        } catch (error) {
            console.error('Error fetching trims:', error);
        }
    };

    const fetchEngines = async (make: string, model: string, year: string, fuel: string, trim: string) => {
        try {
            const response = await apiClient.get(`/vehicles/engines?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}&fuel=${encodeURIComponent(fuel)}&trim=${encodeURIComponent(trim)}`);
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

    const fetchDevices = async (signal?: AbortSignal) => {
        setLoading(true);
        setCurrentPage(1);
        try {
            let url = '/products';
            if (selectedEngine) {
                // Backend /search expects 'fuel' and 'engine' (not fuelType/engineType)
                const vRes = await apiClient.get(`/vehicles/search?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${selectedYear}&fuel=${encodeURIComponent(selectedFuel)}&trim=${encodeURIComponent(selectedTrim)}&engine=${encodeURIComponent(selectedEngine)}`);
                if (vRes.data && vRes.data.length > 0) {
                    url += (url.includes('?') ? '&' : '?') + `vehicleId=${vRes.data[0].id}`;
                }
            }
            if (activeCategory !== 'All') {
                url += (url.includes('?') ? '&' : '?') + `category=${activeCategory}`;
            }

            const response = await apiClient.get(url, { signal });
            setDevices(response.data);
        } catch (err: any) {
            if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
            setDevices([]);
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
        fetchDevices();
    };

    const handleLogout = async () => {
        await logout();
    };

    const handleToggleWishlist = async (product: any) => {
        if (isGuest || !token) {
            Alert.alert(
                'Authentication Required',
                'Please log in or create an account to save parts to your wishlist.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => navigation.navigate('CustomerLogin' as any) }
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
    const handleProfilePress = () => {
        if (isGuest || !token) {
            logout();
            return;
        }
        if (role === 'ROLE_ADMIN') navigation.navigate('AdminDashboard' as any);
        else if (role === 'ROLE_SELLER') navigation.navigate('SellerDashboard' as any);
        else if (role === 'ROLE_GARAGE') navigation.navigate('GarageDashboard' as any);
        else {
            setShowProfileMenu(!showProfileMenu);
        }
    };

    const handleAddToCart = (device: any) => {
        if (isGuest || !token) {
            Alert.alert(
                'Authentication Required',
                'Please log in to your account to add parts to your cart.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => logout() }
                ]
            );
            return;
        }
        const success = addItem({
            id: device?.id?.toString() || Math.random().toString(),
            deviceName: device?.partName || device?.deviceName || device?.name || 'Unknown',
            price: device?.price || 0,
            imageUrl: device?.imageUrl,
            manufacturer: device?.manufacturer || device?.brand || 'MAD GARAGE',
            stockQuantity: device?.stockQuantity ?? 0
        });

        if (success) {
            Toast.show({ message: `${device?.partName || device?.name || 'Item'} added to cart`, type: 'success' });
        } else {
            Alert.alert("Out of Stock", "This item is currently unavailable in the requested quantity.");
        }
    };

    const filteredDevices = devices.filter(d => {
        if (d.flagged) return false; // Safety Shield: Hide flagged listings
        const name = d?.partName || d?.deviceName || d?.name || '';
        const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = activeCategory === 'All' || d.category?.toLowerCase() === activeCategory.toLowerCase();
        const matchCondition = activeCondition === 'ALL' || d.condition === activeCondition;
        return matchSearch && matchCat && matchCondition;
    }).sort((a, b) => {
        if (sortBy === 'Price: Low to High') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'Price: High to Low') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'Name: A to Z') {
            const nameA = (a?.partName || a?.deviceName || a?.name || '').toLowerCase();
            const nameB = (b?.partName || b?.deviceName || b?.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        }
        return 0;
    });

    const totalPages = Math.ceil(filteredDevices.length / pageSize);
    const pagedDevices = filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const renderCard = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: T.statBg }]}
                onPress={() => navigation.navigate('ProductDetails' as any, { product: item })}
                activeOpacity={0.85}
            >
                <View style={styles.cardInner}>
                    <ProductImage product={item} style={styles.cardImg} resizeMode="cover" />
                    {(item.manufacturer || item.brand) ? (
                        <View style={styles.brandChip}>
                            <Text style={styles.brandChipText}>{item.manufacturer || item.brand}</Text>
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
                            <Text style={styles.cardPrice}>₹{item.price?.toLocaleString()}</Text>
                            <View style={styles.cardActions}>
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
                                {(item.stockQuantity ?? 0) > 0 ? (
                                    <TouchableOpacity style={styles.miniCartBtn} onPress={() => handleAddToCart(item)}>
                                        <Ionicons name="add" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.miniCartBtn, { backgroundColor: T.statBorder }]}>
                                        <Ionicons name="close" size={16} color="#FFF" />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View>
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

            {showVehicleFilters && (
                <View style={[styles.vehicleFilterContainer, { backgroundColor: T.bg }]}>
                    <View style={[styles.pickerRow, { marginBottom: 12 }]}>
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
                    <View style={[styles.pickerRow, { marginBottom: 12 }]}>
                        <ModernDropdown
                            label="YEAR"
                            value={selectedYear}
                            options={years.map(y => y.toString())}
                            onSelect={handleYearChange}
                            placeholder="Select Year"
                            enabled={!!selectedModel}
                            containerStyle={{ flex: 1 }}
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
                    <View style={[styles.pickerRow, { marginBottom: 12 }]}>
                        <ModernDropdown
                            label="TRIM"
                            value={selectedTrim}
                            options={trims}
                            onSelect={handleTrimChange}
                            placeholder="Select Trim"
                            enabled={!!selectedFuel}
                            containerStyle={{ flex: 1 }}
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

            <View style={[styles.conditionFilterWrap, { backgroundColor: T.bg }]}>
                <Text style={[styles.filterLabel, { color: T.subText }]}>Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conditionScroll}>
                    {CONDITIONS.map(cond => (
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
                            ]}>
                                {cond.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Huge Web Part Request Banner */}
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
            {/* Massive Web Hero Match - Moved to Bottom */}
            <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>BUILT FOR <Text style={{ color: '#DF2324', fontStyle: 'italic' }}>SPEED.</Text></Text>
                <Text style={styles.heroSubtitle}>Premium performance parts for the serious enthusiast. Engineered for the track, optimized for your garage.</Text>

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

    return (
        <View style={[styles.root, { backgroundColor: T.bg }]}>
            {(showProfileMenu || showSortMenu) && (
                <Pressable
                    style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
                    onPress={() => {
                        setShowProfileMenu(false);
                        setShowSortMenu(false);
                    }}
                />
            )}
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} translucent />
                <ModernDashboardHeader
                    title="MAD GARAGE"
                    subtitle="Performance Parts"
                    showCart={Boolean(token && !isGuest)}
                    cartItemCount={cartItemCount}
                    onProfilePress={handleProfilePress}
                    onCartPress={() => navigation.navigate('Cart')}
                    onThemeToggle={toggleTheme}
                    logo={require('../../assets/app_logo.png')}
                    profileIcon={token ? 'person' : 'person-outline'}
                />

                {showProfileMenu && (
                    <View style={[styles.profileMenu, { backgroundColor: T.statBg, borderColor: T.statBorder, top: 75, right: 16 }]}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('CustomerProfile' as any); }}>
                            <Ionicons name="person-circle-outline" size={18} color={T.text} />
                            <Text style={[styles.menuText, { color: T.text }]}>My Profile</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('OrderHistory'); }}>
                            <Ionicons name="receipt-outline" size={18} color={T.text} />
                            <Text style={[styles.menuText, { color: T.text }]}>Order History</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('Wishlist' as any); }}>
                            <Ionicons name="heart-outline" size={18} color={T.text} />
                            <Text style={[styles.menuText, { color: T.text }]}>
                                My Wishlist{wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ''}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); handleLogout(); }}>
                            <Ionicons name="log-out-outline" size={18} color={T.primary} />
                            <Text style={[styles.menuText, { color: T.primary }]}>Log Out</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading && !refreshing ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#DF2324" />
                    </View>
                ) : (
                    <FlatList
                        data={pagedDevices}
                        keyExtractor={item => item.id?.toString() || Math.random().toString()}
                        numColumns={2}
                        columnWrapperStyle={styles.colWrapper}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderCard}
                        ListHeaderComponent={renderHeader}
                        ListFooterComponent={renderFooter}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#DF2324"
                                colors={['#DF2324']}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="search" size={48} color={T.subText} />
                                <Text style={[styles.emptyText, { color: T.subText }]}>No parts found</Text>
                            </View>
                        }
                    />
                )}

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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 16,
        marginTop: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700' },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
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
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    vehicleSummaryText: {
        fontSize: 13,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    vehiclePlaceholderText: {
        fontSize: 13,
        fontWeight: '800',
        fontStyle: 'italic',
        textTransform: 'uppercase',
    },
    clearVehicleBtn: {
        marginLeft: 10,
        padding: 5,
    },
    catList: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        marginRight: 8,
    },
    catPillActive: { backgroundColor: '#DF2324' },
    catText: { fontWeight: '900', fontSize: 13, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5 },
    catTextActive: { color: '#FFF' },
    conditionFilterWrap: { paddingHorizontal: 20, paddingBottom: 15 },
    filterLabel: { fontSize: 11, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 2 },
    conditionScroll: { gap: 8 },
    condPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        gap: 6,
        marginRight: 8,
    },
    condPillActive: { backgroundColor: '#DF2324', borderColor: '#DF2324' },
    condText: { fontSize: 11, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5 },
    condTextActive: { color: '#FFF' },
    colWrapper: { paddingHorizontal: 14, gap: 12, justifyContent: 'space-between' },
    listContent: { paddingBottom: 100, gap: 12 },
    card: {
        width: '48%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    cardInner: { flex: 1 },
    cardImg: { width: '100%', height: 150 },
    brandChip: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#DF2324',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    brandChipText: { color: '#FFF', fontSize: 10, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5 },
    conditionChip: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    conditionChipText: { fontSize: 10, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardBottom: { padding: 14 },
    cardTitle: { fontWeight: '900', fontSize: 14, marginBottom: 6, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: 1 },
    cardPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardPrice: { color: '#DF2324', fontWeight: '900', fontSize: 16 },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    miniCartBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
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
        width: 32,
        height: 32,
        borderRadius: 8,
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
    pickerRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
    },
    vehicleFilterContainer: {
        paddingVertical: 10,
    },
    emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 80 },
    emptyText: { fontSize: 16 },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 24,
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 12,
    },
    fabGrad: {
        width: 58,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileMenu: {
        position: 'absolute',
        width: 180,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 8,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    sortMenu: {
        position: 'absolute',
        top: 50,
        right: 0,
        width: 180,
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 8,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuText: {
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 1.5
    },
    menuDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 10,
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
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    requestBannerBtnTxt: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 1,
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
});
