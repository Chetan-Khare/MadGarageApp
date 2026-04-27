import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { ProductImage } from './ProductImage';

interface Props {
    item: Product;
    onPress: () => void;
    onWishlist: () => void;
    onAddToCart: () => void;
    isWishlisted: boolean;
    isSeller?: boolean;
    theme: any;
}

export const ProductCard = memo(({ item, onPress, onWishlist, onAddToCart, isWishlisted, isSeller, theme: T }: Props) => {
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: T.statBg }]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={styles.cardInner}>
                <ProductImage product={item} style={styles.cardImg} resizeMode="cover" />
                {item.brand ? (
                    <View style={styles.brandChip}>
                        <Text style={styles.brandChipText}>{item.brand}</Text>
                    </View>
                ) : null}
                <View style={styles.conditionChip}>
                    <Text style={[styles.conditionChipText, { color: item.condition === 'USED' ? '#FFA500' : (item.condition === 'REFURBISHED' ? '#00BFFF' : '#00FF00') }]}>
                        {item.condition || 'NEW'}
                    </Text>
                </View>
                <View style={[styles.cardBottom, { backgroundColor: T.statBg }]}>
                    <Text style={[styles.cardTitle, { color: T.text }]} numberOfLines={1}>
                        {item.partName || 'Unknown Part'}
                    </Text>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                        <Text style={[styles.ratingText, { color: T.subText }]}>{item.rating || '4.8'}</Text>
                    </View>
                    <View style={styles.cardPriceRow}>
                        <Text style={styles.cardPrice}>₹{item.price?.toLocaleString()}</Text>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={[styles.miniWishBtn, isWishlisted && styles.miniWishBtnActive]}
                                onPress={onWishlist}
                            >
                                <Ionicons
                                    name={isWishlisted ? 'heart' : 'heart-outline'}
                                    size={14}
                                    color={isWishlisted ? '#FFF' : '#DF2324'}
                                />
                            </TouchableOpacity>
                            {(item.stockQuantity ?? 0) > 0 ? (
                                !isSeller && (
                                    <TouchableOpacity style={styles.miniCartBtn} onPress={onAddToCart}>
                                        <Ionicons name="add" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                )
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
});

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 8,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardInner: {
        flex: 1,
    },
    cardImg: {
        width: '100%',
        height: 160,
    },
    brandChip: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    brandChipText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    conditionChip: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    conditionChipText: {
        fontSize: 8,
        fontWeight: 'bold',
    },
    cardBottom: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cardPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#DF2324',
    },
    cardActions: {
        flexDirection: 'row',
        gap: 6,
    },
    miniWishBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(223,35,36,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniWishBtnActive: {
        backgroundColor: '#DF2324',
    },
    miniCartBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
