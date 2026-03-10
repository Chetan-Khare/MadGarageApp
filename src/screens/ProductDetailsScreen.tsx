import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useCartStore } from '../store/cartStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;
const { width } = Dimensions.get('window');

const SPECS = [
    { label: 'Condition', value: 'Brand New OEM Quality' },
    { label: 'Material', value: 'Forged Carbon / T6 Billet' },
    { label: 'Fitment', value: 'Guaranteed Fit — Verified' },
    { label: 'Warranty', value: 'Lifetime Limited Warranty' },
];

export default function ProductDetailsScreen({ route, navigation }: Props) {
    const { product } = route.params;
    const addItem = useCartStore((state) => state.addItem);
    const [quantity, setQuantity] = useState(1);

    const price = product.price || product.garagePrice || product.originalPrice || 0;
    const hasDiscount = !!product.originalPrice && !!product.garagePrice;

    const handleAddToCart = () => {
        addItem({
            id: product.id?.toString(),
            deviceName: product.deviceName || product.name || product.partName,
            price,
            imageUrl: product.imageUrl,
            manufacturer: product.manufacturer || product.brand || 'Mad Garage',
            quantity,
        });
        navigation.navigate('Cart');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* Hero Image */}
                <View style={styles.heroWrap}>
                    <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/400' }} style={styles.hero} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.heroTop} />

                    {/* Back Button */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={22} color="#FFF" />
                    </TouchableOpacity>

                    {/* Cart Button */}
                    <TouchableOpacity style={styles.heroCartBtn} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="bag-outline" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.body}>
                    {/* Brand + Name */}
                    <View style={styles.nameRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.brand}>{product.manufacturer || product.brand || 'Mad Garage'}</Text>
                            <Text style={styles.partName}>{product.deviceName || product.name || product.partName}</Text>
                        </View>
                        <View style={styles.ratingPill}>
                            <Ionicons name="star" size={13} color="#000" />
                            <Text style={styles.ratingScore}>4.8</Text>
                        </View>
                    </View>

                    {/* Price Card */}
                    <LinearGradient colors={['#1A0808', '#110505']} style={styles.priceCard}>
                        <Text style={styles.priceLabel}>Your Price</Text>
                        {hasDiscount && (
                            <Text style={styles.strikePrice}>MSRP: ₹{product.originalPrice?.toFixed(2)}</Text>
                        )}
                        <Text style={styles.price}>₹{price.toLocaleString()}</Text>
                        {hasDiscount && (
                            <View style={styles.savingsBadge}>
                                <Text style={styles.savingsText}>5% GARAGE DISCOUNT APPLIED</Text>
                            </View>
                        )}
                    </LinearGradient>

                    {/* Specs */}
                    <Text style={styles.sectionTitle}>Specifications</Text>
                    <View style={styles.specsCard}>
                        {SPECS.map((s, i) => (
                            <View key={s.label} style={[styles.specRow, i < SPECS.length - 1 && styles.specRowBorder]}>
                                <Text style={styles.specLabel}>{s.label}</Text>
                                <Text style={styles.specValue}>{s.value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    <Text style={styles.sectionTitle}>About This Part</Text>
                    <Text style={styles.desc}>
                        Engineered for performance enthusiasts, this component replaces your factory part with aerospace-grade materials. Designed to handle the demands of high-horsepower builds while maintaining everyday reliability.
                    </Text>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <View style={styles.qtyWrap}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Ionicons name="remove" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
                        <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.addCta} onPress={handleAddToCart} activeOpacity={0.85}>
                    <LinearGradient colors={['#FF5555', '#CC1111']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addCtaGrad}>
                        <Ionicons name="bag-add-outline" size={20} color="#FFF" />
                        <Text style={styles.addCtaText}>ADD TO CART</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0A0A0A' },
    heroWrap: { position: 'relative', height: width * 0.85 },
    hero: { width: '100%', height: '100%', backgroundColor: '#111' },
    heroTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroCartBtn: {
        position: 'absolute',
        top: 48,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: { padding: 20, paddingBottom: 40 },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    brand: { color: '#FF3333', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
    partName: { color: '#FFF', fontSize: 24, fontWeight: '900', lineHeight: 30 },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3333',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4,
        marginTop: 4,
    },
    ratingScore: { color: '#000', fontWeight: '900', fontSize: 13 },
    priceCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FF333322',
    },
    priceLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    strikePrice: { color: '#555', fontSize: 14, textDecorationLine: 'line-through', marginBottom: 4 },
    price: { color: '#FF3333', fontSize: 36, fontWeight: '900' },
    savingsBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FF333333',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FF333355',
    },
    savingsText: { color: '#FF7070', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5 },
    specsCard: {
        backgroundColor: '#161616',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 24,
    },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    specRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
    specLabel: { color: '#666', fontSize: 13 },
    specValue: { color: '#FFF', fontSize: 13, fontWeight: '600', maxWidth: '58%', textAlign: 'right' },
    desc: { color: '#777', fontSize: 14, lineHeight: 22 },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#111',
        borderTopWidth: 1,
        borderTopColor: '#1E1E1E',
        gap: 12,
    },
    qtyWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    qtyBtn: { padding: 14 },
    qtyNum: { color: '#FFF', fontWeight: '800', fontSize: 16, minWidth: 24, textAlign: 'center' },
    addCta: { flex: 1, borderRadius: 14, overflow: 'hidden' },
    addCtaGrad: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    addCtaText: { color: '#FFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
});
