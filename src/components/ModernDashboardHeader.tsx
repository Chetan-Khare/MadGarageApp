import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';



interface ModernDashboardHeaderProps {
    title: string;
    subtitle?: string;
    showCart?: boolean;

    cartItemCount?: number;
    onProfilePress: () => void;
    onCartPress?: () => void;
    onAddressPress?: () => void;
    onThemeToggle?: () => void;
    showThemeToggle?: boolean;
    profileIcon?: keyof typeof Ionicons.glyphMap;
    logo?: any;
    rightElement?: React.ReactNode;
}

export const ModernDashboardHeader: React.FC<ModernDashboardHeaderProps> = ({
    title,
    subtitle,
    showCart,

    cartItemCount,
    onProfilePress,
    onCartPress,
    onAddressPress,
    onThemeToggle,
    showThemeToggle = false, // Changed from true to false
    profileIcon = 'person',
    logo,
    rightElement
}) => {
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.outerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#0D0D0D'] : ['#FFFFFF', '#F8F9FA']}
                style={[
                    styles.container,
                    {
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    }
                ]}
            >
                <View style={styles.contentRow}>
                    {/* Left Section: Logo & Titles */}
                    <View style={styles.leftSection}>
                        {logo ? (
                            <View style={styles.logoContainer}>
                                <Image 
                                    source={logo} 
                                    style={[styles.logo, { overflow: 'hidden', backgroundColor: 'transparent', borderRadius: 22 }]}
                                    resizeMode="cover"
                                />
                            </View>
                        ) : (
                            <View style={[styles.fallbackLogo, { backgroundColor: T.inputBg }]}>
                                <Ionicons name="speedometer-outline" size={24} color="#DF2324" />
                            </View>
                        )}
                        <View style={styles.textStack}>
                            <Text style={[styles.title, { color: '#DF2324' }]} numberOfLines={1}>{title}</Text>
                            {subtitle && (
                                <Text style={[styles.subtitle, { color: T.subText }]} numberOfLines={1}>
                                    {subtitle.toUpperCase()}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Right Section: Actions */}
                    <View style={styles.rightSection}>
                        {rightElement}
                        
                        {showThemeToggle && onThemeToggle && (
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: isDark ? '#262626' : '#F0F0F0' }]}
                                onPress={onThemeToggle}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={isDark ? 'sunny' : 'moon'}
                                    size={20}
                                    color={isDark ? '#FFD700' : '#5B5BFF'}
                                />
                            </TouchableOpacity>
                        )}

                        {showCart && onCartPress && (
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: isDark ? '#262626' : '#F0F0F0' }]}
                                onPress={onCartPress}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="bag-outline" size={20} color={T.text} />
                                {cartItemCount !== undefined && cartItemCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{cartItemCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {onAddressPress && (
                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: isDark ? '#262626' : '#F0F0F0' }]}
                                onPress={onAddressPress}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="location-outline" size={20} color={T.text} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.profileBtn, { backgroundColor: '#DF2324' }]}
                            onPress={onProfilePress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={profileIcon} size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>


        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    container: {
        borderRadius: 20,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    fallbackLogo: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textStack: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        marginTop: 1,
        letterSpacing: 1.2,
        opacity: 0.8,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#DF2324',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        fontStyle: 'italic',
    },
});

export default ModernDashboardHeader;
