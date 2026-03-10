import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import apiClient from '../services/apiClient';
import { useCartStore, CartItem } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GarageDashboard'>;
};

export default function GarageDashboardScreen({ navigation }: Props) {
    const [products, setProducts] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const addItem = useCartStore((state) => state.addItem);
    const cartItemsCount = useCartStore((state) => state.items.reduce((acc, item) => acc + item.quantity, 0));
    const logout = useAuthStore((state) => state.logout);
    const { isDark, toggleTheme } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get('/products/garage');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([
                { id: 1, name: 'Plasma Thruster', originalPrice: 1200, garagePrice: 1140, imageUrl: 'https://via.placeholder.com/150' },
                { id: 2, name: 'Quantum Stabilizer', originalPrice: 850, garagePrice: 807.50, imageUrl: 'https://via.placeholder.com/150' }
            ] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: T.statBg, borderColor: '#FF333355' }]}
            onPress={() => navigation.navigate('ProductDetails' as any, { product: item })}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.image} />
            <View style={styles.cardContent}>
                <Text style={[styles.deviceLabel, { color: T.subText }]}>Wholesale Part</Text>
                <Text style={[styles.deviceName, { color: T.text }]}>{item.name}</Text>
                <View style={styles.priceContainer}>
                    <Text style={[styles.retailPrice, { color: T.subText }]}>MSRP: ${item.originalPrice?.toFixed(2)}</Text>
                    <Text style={styles.garagePrice}>Garage Price: ${item.garagePrice?.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addItem({
                        id: item.id.toString(),
                        deviceName: item.name,
                        price: item.originalPrice,
                        imageUrl: item.imageUrl,
                        manufacturer: 'Wholesale Part',
                        quantity: 1
                    })}
                >
                    <Text style={styles.addButtonText}>ADD TO CART</Text>
                    <Ionicons name="cart" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: T.bg2 }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.headerBg} />
            <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomColor: T.headerBorder }]}>
                <View>
                    <Text style={[styles.title, { color: '#FF3333' }]}>Garage Portal</Text>
                    <Text style={[styles.subtitle, { color: T.subText }]}>Wholesale Account Active (-5%)</Text>
                </View>
                <View style={styles.headerIcons}>
                    {/* Theme toggle */}
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                        onPress={toggleTheme}
                    >
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#FFD700' : '#5B5BFF'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartIconContainer}>
                        <Ionicons name="cart-outline" size={28} color="#FF3333" />
                        {cartItemsCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{cartItemsCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
                        <Ionicons name="log-out-outline" size={28} color="#FF3333" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#FF3333" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutIcon: {},
    title: { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
    subtitle: { fontSize: 14, marginTop: 2 },
    cartIconContainer: { position: 'relative' },
    badge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: '#FF2222',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    list: { padding: 15 },
    card: {
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    image: { width: '100%', height: 180 },
    cardContent: { padding: 15 },
    deviceLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    deviceName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    priceContainer: { marginBottom: 15 },
    retailPrice: { fontSize: 14, textDecorationLine: 'line-through' },
    garagePrice: { color: '#FF3333', fontSize: 18, fontWeight: '900' },
    addButton: {
        backgroundColor: '#FF3333',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    addButtonText: { color: '#FFF', fontWeight: 'bold', marginRight: 8, letterSpacing: 1 },
});
