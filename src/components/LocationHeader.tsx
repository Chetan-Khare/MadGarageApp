import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

export const LocationHeader: React.FC = () => {
    const { city, address, isLoading, detectLocation } = useLocationStore();
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    useEffect(() => {
        if (!city) {
            detectLocation();
        }
    }, []);

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: T.headerBorder }]}
            onPress={detectLocation}
            activeOpacity={0.7}
        >
            <View style={styles.leftRow}>
                <View style={[styles.pinCircle, { backgroundColor: '#DF2324' }]}>
                    <Ionicons name="location" size={12} color="#FFF" />
                </View>
                <View style={styles.textStack}>
                    <View style={styles.cityRow}>
                        <Text style={[styles.cityText, { color: T.text }]}>
                            {isLoading ? 'Detecting...' : (city || 'Set Location')}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={T.subText} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={[styles.addrText, { color: T.subText }]} numberOfLines={1}>
                        {isLoading ? 'Fetching coordinates...' : (address || 'Tap to detect nearest garage')}
                    </Text>
                </View>
            </View>
            {isLoading && <ActivityIndicator size="small" color="#DF2324" />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    pinCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textStack: {
        flex: 1,
    },
    cityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cityText: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    addrText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 1,
    }
});
