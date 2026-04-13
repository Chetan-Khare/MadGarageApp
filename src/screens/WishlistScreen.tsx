import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, StatusBar, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Toast } from '../components/Toast';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Wishlist'>;
};

export default function WishlistScreen({ navigation }: Props) {
    const { items, loading, loadWishlist, removeFromWishlist } = useWishlistStore();
    const addItem = useCartStore(s => s.addItem);
    const { isDark } = useThemeStore();
    const { isGuest } = useAuthStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    useEffect(() => {
        if (!isGuest) loadWishlist();
    }, []);

    const handleMoveToCart = (item: any) => {
        const success = addItem({
            id: item.id.toString(),
            deviceName: item.name,
            price: item.price,
            imageUrl: item.imageUrl ?? '',
            manufacturer: item.brand ?? 'MAD GARAGE',
            stockQuantity: 999, // wishlist items don't carry stock; cart will validate at checkout
        });
        if (success) {
            Toast.show({ message: `${item.name} moved to cart`, type: 'success' });
        } else {
            Alert.alert('Stock Limit', 'This item is already in your cart at max quantity.');
        }
    };

    const handleRemove = async (id: number, name: string) => {
        Alert.alert(
            'Remove Item',
            `Remove "${name}" from your wishlist?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive',
                    onPress: async () => {
                        await removeFromWishlist(id);
                        Toast.show({ message: 'Removed from wishlist', type: 'info' });
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
            {/* Image */}
            <View style={styles.imageWrap}>
                <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/300' }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {/* Condition Badge */}
                <View style={styles.conditionBadge}>
                    <Text style={[styles.conditionText, {
                        color: item.condition === 'USED' ? '#FFA500'
                            : item.condition === 'REFURBISHED' ? '#00BFFF'
                            : '#00FF00',
                    }]}>
                        {item.condition || 'NEW'}
                    </Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={[styles.brand, { color: T.primary ?? '#DF2324' }]}>
                    {item.brand || 'HIGH PERFORMANCE'}
                </Text>
                <Text style={[styles.name, { color: T.text }]} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.price}>₹{item.price?.toLocaleString()}</Text>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.cartBtn}
                        onPress={() => handleMoveToCart(item)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart-outline" size={16} color="#FFF" />
                        <Text style={styles.cartBtnText}>Move to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.deleteBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                        onPress={() => handleRemove(item.id, item.name)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trash-outline" size={18} color="#DF2324" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyWrap}>
            <LinearGradient
                colors={isDark ? ['#1A0000', '#0A0A0A'] : ['#FFF5F5', '#FFFFFF']}
                style={styles.emptyCard}
            >
                <View style={styles.emptyIconRing}>
                    <Ionicons name="heart-outline" size={48} color="#DF2324" />
                </View>
                <Text style={[styles.emptyTitle, { color: T.text }]}>
                    WISHLIST IS EMPTY
                </Text>
                <Text style={[styles.emptySubtitle, { color: T.subText }]}>
                    Save parts you love and come back to them anytime.
                </Text>
                <TouchableOpacity
                    style={styles.browseBtn}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.browseBtnText}>Browse Parts</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomColor: T.headerBorder }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={22} color={T.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: T.text }]}>MY WISHLIST</Text>
                    <Text style={[styles.headerSubtitle, { color: T.subText }]}>
                        {items.length} {items.length === 1 ? 'item' : 'items'} saved
                    </Text>
                </View>
                <View style={styles.heartBadge}>
                    <Ionicons name="heart" size={20} color="#DF2324" />
                    {items.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{items.length}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color="#DF2324" />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={[
                        styles.listContent,
                        items.length === 0 && { flex: 1 },
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16, fontWeight: '900',
        fontStyle: 'italic', letterSpacing: 1,
    },
    headerSubtitle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    heartBadge: { position: 'relative', padding: 8 },
    badge: {
        position: 'absolute', top: 4, right: 4,
        backgroundColor: '#DF2324', borderRadius: 8,
        minWidth: 16, height: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, gap: 14 },

    /* Product card */
    card: {
        flexDirection: 'row', borderRadius: 20,
        overflow: 'hidden', borderWidth: 1,
        marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
    },
    imageWrap: { width: 110, height: 120, position: 'relative' },
    image: { width: '100%', height: '100%' },
    conditionBadge: {
        position: 'absolute', bottom: 8, left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    conditionText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
    info: { flex: 1, padding: 12, justifyContent: 'space-between' },
    brand: {
        fontSize: 9, fontWeight: '900',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
    },
    name: { fontSize: 14, fontWeight: '800', lineHeight: 18, flex: 1 },
    price: { color: '#DF2324', fontSize: 18, fontWeight: '900', marginTop: 6 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    cartBtn: {
        flex: 1, flexDirection: 'row', backgroundColor: '#DF2324',
        borderRadius: 10, height: 38,
        justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    cartBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
    deleteBtn: {
        width: 38, height: 38, borderRadius: 10, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center',
    },

    /* Empty state */
    emptyWrap: { flex: 1, padding: 20, justifyContent: 'center' },
    emptyCard: {
        borderRadius: 28, padding: 40,
        alignItems: 'center',
    },
    emptyIconRing: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(223,35,36,0.1)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22, fontWeight: '900', fontStyle: 'italic',
        letterSpacing: -0.5, textAlign: 'center', marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 13, fontWeight: '500', textAlign: 'center',
        lineHeight: 20, maxWidth: 260, marginBottom: 28,
    },
    browseBtn: {
        flexDirection: 'row', backgroundColor: '#DF2324',
        borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14,
        alignItems: 'center', gap: 8,
    },
    browseBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
});
