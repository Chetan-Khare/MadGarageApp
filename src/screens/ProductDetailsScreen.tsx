import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Product, RootStackParamList } from '../types';
import { useCartStore } from '../store/cartStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Alert } from 'react-native';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';
import { useWishlistStore } from '../store/wishlistStore';
import { Toast } from '../components/Toast';
import { ProductImage } from '../components/ProductImage';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;
const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }: Props) {
    const { product } = route.params;
    const addItem = useCartStore((state) => state.addItem);
    const { logout, isGuest } = useAuthStore();
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const [quantity, setQuantity] = useState(1);
    const [activeIndex, setActiveIndex] = useState(0);
    const wishlistItems = useWishlistStore(s => s.items);
    const toggleWishlist = useWishlistStore(s => s.toggleWishlist);
    const isInWishlist = wishlistItems.some(w => w.id === product.id);

    const isWholesale = !isGuest && !!product.garagePrice;
    const price: number = isWholesale ? (product.garagePrice || 0) : (product.originalPrice || product.price || 0);
    const hasDiscount = !!product.originalPrice && !!product.garagePrice && !isGuest;

    const handleAddToCart = () => {
        if (isGuest) {
            Alert.alert(
                'Login Required',
                'Please login to your garage account to access wholesale purchasing.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login Now', onPress: () => logout() }
                ]
            );
            return;
        }
        const success = addItem({
            id: product.id.toString(),
            deviceName: product.deviceName || product.name || product.partName || 'Unknown Part',
            price,
            imageUrl: product.imageUrl ?? '',
            manufacturer: product.manufacturer || product.brand || 'MAD GARAGE. AI',
            quantity,
            stockQuantity: product.stockQuantity ?? 0
        });

        if (success) {
            navigation.navigate('Cart');
        } else {
            Alert.alert("Stock Limit Reached", "You cannot add more of this item to your cart.");
        }
    };

    const handleToggleWishlist = async () => {
        if (isGuest) {
            Alert.alert(
                'Authentication Required',
                'Please log in to your account to save parts to your wishlist.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: () => logout() }
                ]
            );
            return;
        }
        const added = await toggleWishlist(product);
        Toast.show({ message: added ? 'Added to wishlist' : 'Removed from wishlist', type: added ? 'success' : 'info' });
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* Hero Image Carousel */}
                <View style={styles.heroWrap}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const offset = e.nativeEvent.contentOffset.x;
                            const index = Math.round(offset / width);
                            setActiveIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl]).map((_: any, index: number) => {
                            return (
                                <ProductImage
                                    key={index}
                                    product={product}
                                    index={index}
                                    style={styles.hero}
                                    resizeMode="cover"
                                />
                            );
                        })}
                    </ScrollView>

                    <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.heroTop} />

                    {/* Pagination Dots */}
                    {(product.imageUrls && product.imageUrls.length > 1) && (
                        <View style={styles.pagination}>
                            {product.imageUrls.map((_: any, i: number) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        { backgroundColor: i === activeIndex ? '#DF2324' : 'rgba(255,255,255,0.5)' }
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Back Button */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={22} color="#000" />
                    </TouchableOpacity>

                    {/* Hero Action Row */}
                    <View style={styles.heroActionRow}>
                        <TouchableOpacity
                            style={[styles.heroWishBtn, isInWishlist && styles.heroWishBtnActive]}
                            onPress={handleToggleWishlist}
                        >
                            <Ionicons name={isInWishlist ? "heart" : "heart-outline"} size={22} color={isInWishlist ? "#FFF" : "#DF2324"} />
                        </TouchableOpacity>
                        {!isGuest && (
                            <TouchableOpacity style={styles.heroCartBtn} onPress={() => navigation.navigate('Cart')}>
                                <Ionicons name="bag-outline" size={22} color="#DF2324" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.body}>
                    {/* Brand + Name */}
                    <View style={styles.nameRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.brand}>{product.manufacturer || product.brand || 'MAD GARAGE'}</Text>
                            <Text style={[styles.partName, { color: T.text }]}>{product.deviceName || product.name || product.partName}</Text>
                        </View>
                        <View style={styles.ratingPill}>
                            <Ionicons name="star" size={13} color="#000" />
                            <Text style={styles.ratingScore}>{product.rating || '4.8'}</Text>
                        </View>
                    </View>

                    {/* Price Card */}
                    <LinearGradient colors={isDark ? ['#1A0808', '#110505'] : ['#FFF5F5', '#FFEAEA']} style={[styles.priceCard, { borderColor: isDark ? '#DF232422' : '#DF232433' }]}>
                        <Text style={[styles.priceLabel, { color: T.subText }]}>{isGuest ? 'Price' : 'Your Price'}</Text>
                        {hasDiscount && (
                            <Text style={[styles.strikePrice, { color: T.placeholder }]}>MSRP: ₹{product.originalPrice?.toFixed(2)}</Text>
                        )}
                        <Text style={styles.price}>₹{price.toLocaleString()}</Text>
                        {hasDiscount && (
                            <View style={styles.savingsBadge}>
                                <Text style={styles.savingsText}>5% GARAGE DISCOUNT APPLIED</Text>
                            </View>
                        )}
                    </LinearGradient>

                    {/* Specs */}
                    <Text style={[styles.sectionTitle, { color: T.text }]}>Specifications</Text>
                    <View style={[styles.specsCard, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={[styles.specRow, styles.specRowBorder, { borderBottomColor: T.cardBorder }]}>
                            <Text style={[styles.specLabel, { color: T.subText }]}>Condition</Text>
                            <Text style={[styles.specValue, { color: product.condition === 'USED' ? '#FFA500' : (product.condition === 'REFURBISHED' ? '#00BFFF' : '#00FF00') }]}>
                                {product.condition || 'NEW'}
                            </Text>
                        </View>
                        <View style={[styles.specRow, styles.specRowBorder, { borderBottomColor: T.cardBorder }]}>
                            <Text style={[styles.specLabel, { color: T.subText }]}>Color</Text>
                            <Text style={[styles.specValue, { color: T.text }]}>{product.color || 'Unspecified'}</Text>
                        </View>
                        <View style={[styles.specRow, styles.specRowBorder, { borderBottomColor: T.cardBorder }]}>
                            <Text style={[styles.specLabel, { color: T.subText }]}>Category</Text>
                            <Text style={[styles.specValue, { color: T.text }]}>{product.category || 'Standard'}</Text>
                        </View>
                        <View style={styles.specRow}>
                            <Text style={[styles.specLabel, { color: T.subText }]}>Fitment</Text>
                            <Text style={[styles.specValue, { color: T.text }]}>{product.fitmentCategory || 'Universal'}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={[styles.sectionTitle, { color: T.text }]}>About This Part</Text>
                    <Text style={[styles.desc, { color: T.subText }]}>
                        Engineered for performance enthusiasts, this component replaces your factory part with aerospace-grade materials. Designed to handle the demands of high-horsepower builds while maintaining everyday reliability.
                    </Text>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { backgroundColor: T.headerBg, borderTopColor: T.headerBorder }]}>
                <View style={[styles.qtyWrap, { backgroundColor: T.inputBg, borderColor: T.inputBorder, opacity: (product.stockQuantity ?? 0) <= 0 ? 0.5 : 1 }]}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={(product.stockQuantity ?? 0) <= 0}
                    >
                        <Ionicons name="remove" size={20} color={T.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyNum, { color: T.text }]}>{quantity}</Text>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantity(Math.min(product.stockQuantity ?? 0, quantity + 1))}
                        disabled={(product.stockQuantity ?? 0) <= 0 || quantity >= (product.stockQuantity ?? 0)}
                    >
                        <Ionicons name="add" size={20} color={quantity >= (product.stockQuantity ?? 0) ? T.placeholder : T.text} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.addCta, { opacity: (product.stockQuantity ?? 0) <= 0 ? 0.6 : 1 }]}
                    onPress={handleAddToCart}
                    activeOpacity={0.85}
                    disabled={(product.stockQuantity ?? 0) <= 0}
                >
                    <View style={styles.addCtaContent}>
                        <Ionicons name={(product.stockQuantity ?? 0) <= 0 ? "close-circle-outline" : "bag-add-outline"} size={20} color="#FFF" />
                        <Text style={styles.addCtaText}>{(product.stockQuantity ?? 0) <= 0 ? 'OUT OF STOCK' : 'ADD TO CART'}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    heroWrap: { position: 'relative', height: width * 0.9 },
    hero: { width: width, height: '100%', backgroundColor: '#F0F0F0' },
    heroTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
    pagination: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    backBtn: {
        position: 'absolute',
        top: 20,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heroCartBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heroActionRow: {
        position: 'absolute',
        top: 20,
        right: 16,
        flexDirection: 'row',
        gap: 10,
    },
    heroWishBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heroWishBtnActive: {
        backgroundColor: '#DF2324',
    },
    body: { padding: 20, paddingBottom: 60 },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
    brand: { color: '#DF2324', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    partName: { fontSize: 24, fontWeight: '900', lineHeight: 30 },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DF2324',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4,
    },
    ratingScore: { color: '#FFF', fontWeight: '900', fontSize: 13 },
    priceCard: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    priceLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    strikePrice: { fontSize: 16, textDecorationLine: 'line-through', marginBottom: 6 },
    price: { color: '#DF2324', fontSize: 32, fontWeight: '900' },
    savingsBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#DF232415',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 12,
    },
    savingsText: { color: '#DF2324', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    specsCard: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 30,
    },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    specRowBorder: { borderBottomWidth: 1 },
    specLabel: { fontSize: 14, fontWeight: '600' },
    specValue: { fontSize: 14, fontWeight: '800', maxWidth: '58%', textAlign: 'right' },
    desc: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        gap: 12,
    },
    qtyWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
    },
    qtyBtn: { padding: 14 },
    qtyNum: { fontWeight: '800', fontSize: 16, minWidth: 28, textAlign: 'center' },
    addCta: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#DF2324' },
    addCtaContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        gap: 8,
    },
    addCtaText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
