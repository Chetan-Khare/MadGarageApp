import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    isVisible: boolean;
    onClose: () => void;
    navigation: any;
    theme: any;
    isDark: boolean;
    toggleTheme: () => void;
    wishlistCount: number;
    onLogout: () => void;
    isGuest: boolean;
    role: string | null;
}

export const ProfileMenu: React.FC<Props> = ({
    isVisible,
    onClose,
    navigation,
    theme: T,
    isDark,
    toggleTheme,
    wishlistCount,
    onLogout,
    isGuest,
    role
}) => {
    if (!isVisible) return null;

    const allItems = [
        { label: 'My Profile', icon: 'person-circle-outline', action: () => navigation.navigate('CustomerProfile'), authRequired: true },
        { label: 'Manage Addresses', icon: 'map-outline', action: () => navigation.navigate('Address'), authRequired: true, hidden: role === 'ROLE_SELLER' || role === 'ROLE_WORKER' },
        { label: isDark ? 'Light Mode' : 'Dark Mode', icon: isDark ? 'sunny-outline' : 'moon-outline', action: toggleTheme },
        { label: 'Order History', icon: 'receipt-outline', action: () => navigation.navigate('OrderHistory'), authRequired: true },
        { label: `My Wishlist ${wishlistCount > 0 ? `(${wishlistCount})` : ''}`, icon: 'heart-outline', action: () => {
            if (isGuest) {
                Alert.alert('Log In Required', 'Please log in to manage your wishlist.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log In', onPress: onLogout }
                ]);
                return;
            }
            navigation.navigate('Wishlist');
        }, hidden: role === 'ROLE_SELLER' || role === 'ROLE_WORKER' },
        isGuest 
            ? { label: 'Sign In / Register', icon: 'log-in-outline', action: onLogout, color: '#4ADE80' } 
            : { label: 'Log Out', icon: 'log-out-outline', action: onLogout, color: T.primary }
    ];

    const items = allItems.filter(item => (!isGuest || !item.authRequired) && !item.hidden);

    return (
        <View style={[styles.menu, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
            {items.map((item, index) => (
                <React.Fragment key={item.label}>
                    <TouchableOpacity 
                        style={styles.item} 
                        onPress={() => {
                            onClose();
                            item.action();
                        }}
                    >
                        <Ionicons name={item.icon as any} size={18} color={item.color || T.text} />
                        <Text style={[styles.text, { color: item.color || T.text }]}>{item.label}</Text>
                    </TouchableOpacity>
                    {index < items.length - 1 && <View style={[styles.divider, { backgroundColor: T.statBorder }]} />}
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    menu: {
        position: 'absolute',
        top: 60,
        right: 16,
        width: 220,
        borderRadius: 20,
        borderWidth: 1,
        padding: 8,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12
    },
    text: {
        fontSize: 14,
        fontWeight: '600'
    },
    divider: {
        height: 1,
        marginHorizontal: 12
    }
});
