import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface SkeletonBoxProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
    width = '100%',
    height = 16,
    borderRadius = 8,
    style,
}) => {
    const { isDark } = useThemeStore();
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, [shimmer]);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    const base = isDark ? '#333' : '#E0E0E0';

    return (
        <Animated.View
            style={[
                { width: width as any, height, borderRadius, backgroundColor: base, opacity },
                style,
            ]}
        />
    );
};

/** 2-column product card skeleton — matches the HomeScreen grid */
export const ProductCardSkeleton: React.FC = () => {
    const { isDark } = useThemeStore();
    const bg = isDark ? '#1A1A1A' : '#FFFFFF';

    return (
        <View style={[styles.card, { backgroundColor: bg }]}>
            <SkeletonBox height={160} borderRadius={12} style={{ marginBottom: 10 }} />
            <SkeletonBox width="70%" height={13} style={{ marginBottom: 8 }} />
            <SkeletonBox width="45%" height={16} />
        </View>
    );
};

/** Full-width list item skeleton — matches GarageDashboard card */
export const ListCardSkeleton: React.FC = () => {
    const { isDark } = useThemeStore();
    const bg = isDark ? '#1A1A1A' : '#FFFFFF';

    return (
        <View style={[styles.listCard, { backgroundColor: bg }]}>
            <SkeletonBox width={120} height={120} borderRadius={12} />
            <View style={styles.listCardBody}>
                <SkeletonBox width="60%" height={13} style={{ marginBottom: 10 }} />
                <SkeletonBox width="40%" height={18} style={{ marginBottom: 12 }} />
                <SkeletonBox width="80%" height={12} style={{ marginBottom: 8 }} />
                <SkeletonBox height={36} borderRadius={10} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        padding: 10,
        flex: 1,
        margin: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    listCard: {
        flexDirection: 'row',
        borderRadius: 14,
        padding: 12,
        marginBottom: 16,
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    listCardBody: {
        flex: 1,
        justifyContent: 'space-between',
    },
});

export default SkeletonBox;
