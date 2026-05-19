import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

export default function FreightZoneNotice() {
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#DF232411' : '#DF23240A', borderColor: isDark ? '#DF232433' : '#DF23241A' }]}>
            <View style={styles.iconWrapper}>
                <Ionicons name="information-circle-outline" size={16} color="#DF2324" />
            </View>
            <Text style={[styles.text, { color: T.text }]}>
                <Text style={{ fontWeight: '900', color: '#DF2324' }}>FREIGHT ZONE BILLING ACTIVE: </Text>
                Engines, transmissions, and heavy body panels under the Heavy Freight class attract a zone-based distance multiplier (1.0x to 2.25x max) automatically during customer checkout.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
        alignItems: 'flex-start',
    },
    iconWrapper: {
        marginRight: 8,
        marginTop: 2,
    },
    text: {
        flex: 1,
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '500',
    },
});
