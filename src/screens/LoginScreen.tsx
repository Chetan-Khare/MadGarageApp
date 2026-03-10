import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: LoginScreenNavigationProp; }

// ─── Theme Definitions ────────────────────────────────────────────────────────
const DARK = {
    bg: ['#0A0A0A', '#150505', '#0A0A0A'] as const,
    card: '#111111',
    cardBorder: '#1E1E1E',
    inputBg: '#161616',
    inputBorder: '#252525',
    inputBgFocused: '#1C1010',
    inputBorderFocused: '#FF3333',
    text: '#FFFFFF',
    subText: '#666666',
    placeholder: '#555555',
    icon: '#555555',
    iconFocused: '#FF3333',
    tabBg: '#111111',
    tabBorder: '#222222',
    tabActiveBg: '#FF3333',
    tabText: '#666666',
    tabTextActive: '#FFFFFF',
    errorBg: '#2A0A0A',
    errorBorder: '#FF333344',
    errorText: '#FF7070',
    badgeText: '#444444',
    logoBg: '#1A0808',
    logoBorder: '#FF333344',
    statusBar: 'light-content' as const,
    toggleIcon: 'sunny-outline',
    toggleTip: 'Switch to Light',
    eyeColor: '#777',
    eyeColorActive: '#FF3333',
};

const LIGHT = {
    bg: ['#F0F4FF', '#FFFFFF', '#F0F4FF'] as const,
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',
    inputBg: '#F5F5F5',
    inputBorder: '#DDDDDD',
    inputBgFocused: '#FFF0F0',
    inputBorderFocused: '#FF3333',
    text: '#1A1A1A',
    subText: '#888888',
    placeholder: '#AAAAAA',
    icon: '#AAAAAA',
    iconFocused: '#FF3333',
    tabBg: '#EEEEEE',
    tabBorder: '#DDDDDD',
    tabActiveBg: '#FF3333',
    tabText: '#999999',
    tabTextActive: '#FFFFFF',
    errorBg: '#FFF0F0',
    errorBorder: '#FFAAAA',
    errorText: '#CC2222',
    badgeText: '#AAAAAA',
    logoBg: '#FFE8E8',
    logoBorder: '#FF333344',
    statusBar: 'dark-content' as const,
    toggleIcon: 'moon-outline',
    toggleTip: 'Switch to Dark',
    eyeColor: '#AAAAAA',
    eyeColorActive: '#FF3333',
};

// ─── Input Field Component ────────────────────────────────────────────────────
function InputField({
    icon, placeholder, value, onChangeText, secureTextEntry,
    keyboardType, autoCapitalize, theme
}: any) {
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);

    const isPassword = secureTextEntry !== undefined;

    return (
        <View style={[
            makeInputStyles(theme).wrap,
            focused && makeInputStyles(theme).wrapFocused
        ]}>
            <Ionicons
                name={icon}
                size={20}
                color={focused ? theme.iconFocused : theme.icon}
                style={{ marginRight: 12 }}
            />
            <TextInput
                style={makeInputStyles(theme).field}
                placeholder={placeholder}
                placeholderTextColor={theme.placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={isPassword ? !visible : false}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize ?? 'none'}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {isPassword && (
                <TouchableOpacity
                    onPress={() => setVisible(v => !v)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                >
                    <Ionicons
                        name={visible ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={focused ? theme.eyeColorActive : theme.eyeColor}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

function makeInputStyles(theme: typeof DARK) {
    return StyleSheet.create({
        wrap: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.inputBg,
            borderRadius: 14,
            marginBottom: 14,
            borderWidth: 1.5,
            borderColor: theme.inputBorder,
            paddingHorizontal: 16,
            paddingVertical: 4,
        },
        wrapFocused: {
            borderColor: theme.inputBorderFocused,
            backgroundColor: theme.inputBgFocused,
        },
        field: {
            flex: 1,
            color: theme.text,
            fontSize: 15,
            paddingVertical: 13,
        },
    });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');
    const { isDark, toggleTheme } = useThemeStore();

    const theme = isDark ? DARK : LIGHT;

    const handleAuth = async () => {
        setLoading(true);
        setErrorText('');
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? { email, password }
                : { email, password, firstName, lastName };

            const response = await apiClient.post(endpoint, payload);

            if (response.data?.token) {
                const userRole = response.data.role || 'CUSTOMER';
                const roleType = ['ADMIN', 'SELLER', 'CUSTOMER', 'GARAGE'].includes(userRole) ? userRole : 'CUSTOMER';
                await useAuthStore.getState().setAuth(response.data.token, roleType as any, response.data.user);

                switch (roleType) {
                    case 'ADMIN': navigation.replace('AdminDashboard' as any); break;
                    case 'SELLER': navigation.replace('SellerDashboard' as any); break;
                    case 'GARAGE': navigation.replace('GarageDashboard' as any); break;
                    default: navigation.replace('Home'); break;
                }
            } else {
                setErrorText('Invalid credentials. Please try again.');
            }
        } catch (error: any) {
            setErrorText(error.response?.data?.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const makeStyles = () => StyleSheet.create({
        gradient: { flex: 1 },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingVertical: 40,
        },
        // ── Theme Toggle Button ──
        themeToggleRow: {
            alignItems: 'flex-end',
            marginBottom: 4,
        },
        themeToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark ? '#1E1E1E' : '#EEEEEE',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderWidth: 1,
            borderColor: isDark ? '#333' : '#DDD',
        },
        themeToggleText: {
            fontSize: 12,
            fontWeight: '600',
            color: isDark ? '#CCC' : '#555',
        },
        // ── Logo ──
        logoArea: {
            alignItems: 'center',
            marginBottom: 36,
        },
        logoIcon: {
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: theme.logoBg,
            borderWidth: 1.5,
            borderColor: theme.logoBorder,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: '#FF3333',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
        },
        brandName: {
            fontSize: 32,
            fontWeight: '900',
            color: theme.text,
            letterSpacing: 4,
            marginBottom: 6,
        },
        brandTagline: {
            fontSize: 13,
            color: theme.subText,
            letterSpacing: 1,
            textTransform: 'uppercase',
        },
        // ── Tabs ──
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: theme.tabBg,
            borderRadius: 14,
            padding: 4,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.tabBorder,
        },
        tab: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 10,
        },
        tabActive: {
            backgroundColor: theme.tabActiveBg,
            shadowColor: '#FF3333',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 5,
        },
        tabText: { color: theme.tabText, fontWeight: '600', fontSize: 14 },
        tabTextActive: { color: theme.tabTextActive },
        // ── Card ──
        card: {
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: isDark ? 0.5 : 0.1,
            shadowRadius: 30,
            elevation: 15,
            marginBottom: 24,
        },
        errorBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.errorBg,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.errorBorder,
            gap: 8,
        },
        errorText: { color: theme.errorText, flex: 1, fontSize: 13 },
        // ── CTA ──
        cta: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
        ctaGradient: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 17,
            gap: 8,
        },
        ctaText: { color: '#FFF', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
        guestBtn: { alignItems: 'center', marginTop: 18 },
        guestText: { color: '#FF3333', fontSize: 13, fontWeight: '600' },
        // ── Badges ──
        badges: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
        },
        badge: { alignItems: 'center', flex: 1, gap: 6 },
        badgeText: { color: theme.badgeText, fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
    });

    const styles = makeStyles();

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={isDark ? '#0A0A0A' : '#F0F4FF'} />
            <LinearGradient colors={theme.bg} style={styles.gradient}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Theme Toggle */}
                    <View style={styles.themeToggleRow}>
                        <TouchableOpacity
                            style={styles.themeToggle}
                            onPress={toggleTheme}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={theme.toggleIcon as any} size={16} color={isDark ? '#FFD700' : '#5B5BFF'} />
                            <Text style={styles.themeToggleText}>
                                {isDark ? 'Light Mode' : 'Dark Mode'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logo Area */}
                    <View style={styles.logoArea}>
                        <View style={styles.logoIcon}>
                            <Ionicons name="car-sport" size={36} color="#FF3333" />
                        </View>
                        <Text style={styles.brandName}>MAD GARAGE</Text>
                        <Text style={styles.brandTagline}>Performance Parts Marketplace</Text>
                    </View>

                    {/* Tab Switch */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, isLogin && styles.tabActive]}
                            onPress={() => { setIsLogin(true); setErrorText(''); }}
                        >
                            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, !isLogin && styles.tabActive]}
                            onPress={() => { setIsLogin(false); setErrorText(''); }}
                        >
                            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>
                        {errorText !== '' && (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={16} color="#FF4444" />
                                <Text style={styles.errorText}>{errorText}</Text>
                            </View>
                        )}

                        {!isLogin && (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <InputField
                                        icon="person-outline"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        autoCapitalize="words"
                                        theme={theme}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <InputField
                                        icon="person-outline"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        autoCapitalize="words"
                                        theme={theme}
                                    />
                                </View>
                            </View>
                        )}

                        <InputField
                            icon="mail-outline"
                            placeholder="Email address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            theme={theme}
                        />
                        <InputField
                            icon="lock-closed-outline"
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            theme={theme}
                        />

                        <TouchableOpacity
                            style={[styles.cta, loading && { opacity: 0.7 }]}
                            onPress={handleAuth}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#FF5555', '#CC1111']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.ctaGradient}
                            >
                                {loading
                                    ? <ActivityIndicator color="#FFF" />
                                    : <>
                                        <Text style={styles.ctaText}>{isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>
                                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                                    </>
                                }
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Home' as any)} style={styles.guestBtn}>
                            <Text style={styles.guestText}>Browse as Guest →</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer trust badges */}
                    <View style={styles.badges}>
                        {[
                            { icon: 'shield-checkmark-outline', label: 'Secure Checkout' },
                            { icon: 'star-outline', label: 'Top Rated Parts' },
                            { icon: 'car-outline', label: 'Fitment Guarantee' }
                        ].map(b => (
                            <View key={b.label} style={styles.badge}>
                                <Ionicons name={b.icon as any} size={20} color="#FF3333" />
                                <Text style={styles.badgeText}>{b.label}</Text>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}
