import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar, Alert, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { registerForPushNotifications } from '../services/notificationService';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: LoginScreenNavigationProp; }

// ─── Theme Definitions ────────────────────────────────────────────────────────
const DARK = {
    bg: ['#121212', '#121212', '#121212'] as const,
    card: '#1A1A1A',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
    inputBg: '#242424',
    inputBorder: 'rgba(255, 255, 255, 0.05)',
    inputBgFocused: '#2A2A2A',
    inputBorderFocused: '#DF2324',
    text: '#FFFFFF',
    subText: '#7A7A85',
    placeholder: '#7A7A85',
    icon: '#7A7A85',
    iconFocused: '#DF2324',
    tabBg: '#242424',
    tabBorder: 'rgba(255,255,255,0.05)',
    tabActiveBg: '#DF2324',
    tabText: '#7A7A85',
    tabTextActive: '#FFFFFF',
    errorBg: 'rgba(223, 35, 36, 0.1)',
    errorBorder: 'rgba(223, 35, 36, 0.3)',
    errorText: '#DF2324',
    badgeText: '#7A7A85',
    logoBg: '#1A1A1A',
    logoBorder: 'rgba(223, 35, 36, 0.3)',
    statusBar: 'light-content' as const,
    toggleIcon: 'sunny-outline',
    toggleTip: 'Switch to Light',
    eyeColor: '#7A7A85',
    eyeColorActive: '#DF2324',
};

const LIGHT = {
    bg: ['#F5F6F8', '#FFFFFF', '#F5F6F8'] as const,
    card: '#FFFFFF',
    cardBorder: '#E5E5E5',
    inputBg: '#F9F9F9',
    inputBorder: '#E5E5E5',
    inputBgFocused: '#FFFFFF',
    inputBorderFocused: '#DF2324',
    text: '#262626',
    subText: '#8F92A1',
    placeholder: '#8F92A1',
    icon: '#8F92A1',
    iconFocused: '#DF2324',
    tabBg: '#EEEEEE',
    tabBorder: '#E5E5E5',
    tabActiveBg: '#DF2324',
    tabText: '#8F92A1',
    tabTextActive: '#FFFFFF',
    errorBg: '#FFF0F0',
    errorBorder: '#FFAAAA',
    errorText: '#CC2222',
    badgeText: '#8F92A1',
    logoBg: '#FFE8E8',
    logoBorder: '#DF232444',
    statusBar: 'dark-content' as const,
    toggleIcon: 'moon-outline',
    toggleTip: 'Switch to Dark',
    eyeColor: '#8F92A1',
    eyeColorActive: '#DF2324',
};

// ─── Input Field Component ────────────────────────────────────────────────────
function InputField({
    icon, placeholder, value, onChangeText, secureTextEntry,
    keyboardType, autoCapitalize, theme, maxLength
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
                maxLength={maxLength}
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
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            paddingHorizontal: 16,
            paddingVertical: 6,
        },
        wrapFocused: {
            borderColor: theme.inputBorderFocused,
            backgroundColor: theme.inputBgFocused,
        },
        field: {
            flex: 1,
            color: theme.text,
            fontSize: 15,
            fontWeight: '700',
            paddingVertical: 14,
        },
    });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
    const [authTab, setAuthTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER'); // 'CUSTOMER' or 'STAFF'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');
    const { isDark, toggleTheme } = useThemeStore();

    // STRICT DESIGN ENFORCEMENT for Dark, but allowing Light mode toggle
    const theme = isDark ? DARK : LIGHT;
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
            ),
            -1,
            true
        );

        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(t => t - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));


    const handleTabChange = (tab: 'CUSTOMER' | 'STAFF') => {
        setAuthTab(tab);
        setErrorText('');
        setPhone('');
        setOtp('');
        setEmail('');
        setPassword('');
        setShowOtpInput(false);
        setResendTimer(0);
    };

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            setErrorText('Please enter a valid phone number.');
            return;
        }
        setLoading(true);
        setErrorText('');
        try {
            const res = await apiClient.post('/auth/send-otp', { phone });
            Alert.alert("Development SMS", res.data);
            setShowOtpInput(true);
            setResendTimer(30);
        } catch (error: any) {
            setErrorText(error.response?.data?.error || error.response?.data || 'Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setErrorText('Please enter the 6-digit OTP.');
            return;
        }
        setLoading(true);
        setErrorText('');
        try {
            const response = await apiClient.post('/auth/verify-otp', { phone, otp });
            handleLoginSuccess(response.data);
        } catch (error: any) {
            setErrorText(error.response?.data?.error || error.response?.data || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStaffLogin = async () => {
        if (!email || !password) {
            setErrorText('Email and Password are required.');
            return;
        }
        setLoading(true);
        setErrorText('');
        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanPassword = password.trim();
            const response = await apiClient.post('/auth/login', { email: cleanEmail, password: cleanPassword });
            handleLoginSuccess(response.data);
        } catch (error: any) {
            setErrorText(error.response?.data?.message || 'Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = async (data: any) => {
        if (data?.token) {
            let userRole = data.role || 'ROLE_CUSTOMER';
            if (!userRole.startsWith('ROLE_')) {
                userRole = 'ROLE_' + userRole;
            }
            const validRoles = ['ROLE_ADMIN', 'ROLE_SELLER', 'ROLE_CUSTOMER', 'ROLE_GARAGE'];
            const roleType = validRoles.includes(userRole) ? userRole : 'ROLE_CUSTOMER';

            await useAuthStore.getState().setAuth(data.token, roleType as any, data.userId);
            registerForPushNotifications().catch(() => { });
        } else {
            setErrorText('Authentication failed. No token received.');
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
            marginBottom: 10,
        },
        themeToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.card,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: theme.cardBorder,
        },
        themeToggleText: {
            fontSize: 12,
            fontWeight: '900',
            fontStyle: 'italic',
            color: theme.subText,
        },
        // ── Logo ──
        logoArea: {
            alignItems: 'center',
            marginBottom: 40,
        },
        logoWrapper: {
            marginBottom: 20,
        },
        logoRingOuter: {
            width: 130,
            height: 130,
            borderRadius: 65,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
            backgroundColor: theme.bg[0],
        },
        logoRingInner: {
            width: 110,
            height: 110,
            borderRadius: 55,
            borderWidth: 1,
            borderColor: theme.logoBorder,
            overflow: 'hidden',
        },
        logoImg: {
            width: 110,
            height: 110,
        },
        brandName: {
            fontSize: 28,
            fontWeight: '900',
            fontStyle: 'italic',
            color: theme.text,
            letterSpacing: 4,
            marginBottom: 4,
        },
        brandTagline: {
            fontSize: 10,
            color: '#DF2324',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: '900',
            fontStyle: 'italic',
        },
        // ── Tabs ──
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: theme.tabBg,
            borderRadius: 16,
            padding: 6,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: theme.tabBorder,
        },
        tab: {
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
            borderRadius: 12,
        },
        tabActive: {
            backgroundColor: theme.tabActiveBg,
        },
        tabText: { color: theme.tabText, fontWeight: '900', fontStyle: 'italic', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
        tabTextActive: { color: theme.tabTextActive },
        // ── Card ──
        card: {
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
            marginBottom: 30,
        },
        errorBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.errorBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.errorBorder,
            gap: 10,
        },
        errorText: { color: theme.errorText, flex: 1, fontSize: 13, fontWeight: '800' },
        // ── CTA ──
        cta: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
        ctaGradient: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 18,
            gap: 12,
            backgroundColor: '#DF2324',
        },
        ctaText: { color: '#FFF', fontWeight: '900', fontStyle: 'italic', fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' },
        guestBtn: { alignItems: 'center', marginTop: 22 },
        guestText: { color: '#DF2324', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
        guestPortalBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 26,
            paddingVertical: 18,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            backgroundColor: theme.inputBg,
        },
        guestPortalText: {
            color: '#DF2324',
            fontSize: 13,
            fontWeight: '900',
            fontStyle: 'italic',
            letterSpacing: 1,
            textTransform: 'uppercase',
        },
        // ── Badges ──
        badges: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            marginTop: 10,
        },
        badge: { alignItems: 'center', flex: 1, gap: 10 },
        badgeText: { color: theme.badgeText, fontSize: 9, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
        // ── India Footer ──
        indiaFooter: {
            marginTop: 40,
            alignItems: 'center',
            opacity: 0.6,
        },
        indiaText: {
            color: theme.text,
            fontSize: 11,
            fontWeight: '900',
            fontStyle: 'italic',
            letterSpacing: 4,
            textTransform: 'uppercase',
        },
    });

    const styles = makeStyles();

    // Option 1: Perforated Metal Mesh (Looks exactly like a sports car front grill, very subtle)
    //const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1580974582391-a6649c81a8bf?auto=format&fit=crop&q=80';

    // Option 2: Clean dark asphalt / wet road texture
    const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80';

    // Option 3: Smooth dark brushed metal
    //const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1535868463750-c78d9543614f?auto=format&fit=crop&q=80';


    // Transparent enough to see the car, solid enough at the bottom to read inputs
    const overlayGradient = isDark
        ? ['rgba(18, 18, 18, 0.4)', 'rgba(18, 18, 18, 0.85)', '#121212'] as const
        : ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.85)', '#FFFFFF'] as const;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            <ImageBackground source={{ uri: BACKGROUND_IMAGE }} style={{ flex: 1 }} resizeMode="cover">
                <LinearGradient colors={overlayGradient} style={styles.gradient}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            {/* Theme Toggle - Force Dark Spec */}
                            <View style={styles.themeToggleRow}>
                                <TouchableOpacity
                                    style={styles.themeToggle}
                                    onPress={toggleTheme}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={theme.toggleIcon as any} size={16} color={isDark ? '#FFD700' : '#5B5BFF'} />
                                    <Text style={styles.themeToggleText}>
                                        {isDark ? 'LIGHT MODE' : 'DARK MODE'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.logoArea}>
                                <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
                                    <View style={styles.logoRingOuter}>
                                        <View style={styles.logoRingInner}>
                                            <Image
                                                source={require('../../assets/app_logo.png')}
                                                style={styles.logoImg}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    </View>
                                </Animated.View>
                                <Text style={styles.brandName}>THE MAD GARAGE</Text>
                                <Text style={styles.brandTagline}>Performance & High-End Parts</Text>
                            </View>

                            {/* Dual Auth Tab Switch */}
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tab, authTab === 'CUSTOMER' && styles.tabActive]}
                                    onPress={() => handleTabChange('CUSTOMER')}
                                >
                                    <Text style={[styles.tabText, authTab === 'CUSTOMER' && styles.tabTextActive]}>CUSTOMER</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, authTab === 'STAFF' && styles.tabActive]}
                                    onPress={() => handleTabChange('STAFF')}
                                >
                                    <Text style={[styles.tabText, authTab === 'STAFF' && styles.tabTextActive]}>STAFF LOGIN</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Form Card */}
                            <View style={styles.card}>
                                {errorText !== '' && (
                                    <View style={styles.errorBanner}>
                                        <Ionicons name="alert-circle" size={16} color="#DF2324" />
                                        <Text style={styles.errorText}>{errorText}</Text>
                                    </View>
                                )}

                                {authTab === 'CUSTOMER' ? (
                                    !showOtpInput ? (
                                        <>
                                            <InputField
                                                icon="call-outline"
                                                placeholder="Phone Number"
                                                value={phone}
                                                onChangeText={setPhone}
                                                keyboardType="phone-pad"
                                                theme={theme}
                                            />
                                            <TouchableOpacity
                                                style={[styles.cta, loading && { opacity: 0.7 }]}
                                                onPress={handleSendOtp}
                                                disabled={loading}
                                                activeOpacity={0.85}
                                            >
                                                <View style={[styles.ctaGradient, { backgroundColor: '#DF2324' }]}>
                                                    {loading
                                                        ? <ActivityIndicator color="#FFF" />
                                                        : <>
                                                            <Text style={styles.ctaText}>SEND OTP</Text>
                                                            <Ionicons name="chevron-forward-outline" size={18} color="#FFF" />
                                                        </>
                                                    }
                                                </View>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <InputField
                                                icon="keypad-outline"
                                                placeholder="6-Digit OTP"
                                                value={otp}
                                                onChangeText={setOtp}
                                                keyboardType="number-pad"
                                                theme={theme}
                                                maxLength={6}
                                            />
                                            <TouchableOpacity
                                                style={[styles.cta, loading && { opacity: 0.7 }]}
                                                onPress={handleVerifyOtp}
                                                disabled={loading}
                                                activeOpacity={0.85}
                                            >
                                                <View style={[styles.ctaGradient, { backgroundColor: '#DF2324' }]}>
                                                    {loading
                                                        ? <ActivityIndicator color="#FFF" />
                                                        : <>
                                                            <Text style={styles.ctaText}>VERIFY & LOGIN</Text>
                                                            <Ionicons name="lock-open-outline" size={18} color="#FFF" />
                                                        </>
                                                    }
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleSendOtp}
                                                disabled={resendTimer > 0}
                                                style={[styles.guestBtn, { marginTop: 16 }]}
                                            >
                                                <Text style={[styles.guestText, resendTimer > 0 && { color: theme.subText }]}>
                                                    {resendTimer > 0 ? `RESEND OTP IN ${resendTimer}s` : 'RESEND OTP'}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => setShowOtpInput(false)} style={[styles.guestBtn, { marginTop: 12 }]}>
                                                <Text style={[styles.guestText, { color: theme.subText }]}>← CHANGE PHONE NUMBER</Text>
                                            </TouchableOpacity>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <InputField
                                            icon="mail-outline"
                                            placeholder="Enterprise Email"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            theme={theme}
                                        />
                                        <InputField
                                            icon="lock-closed-outline"
                                            placeholder="Secret Key"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            theme={theme}
                                        />
                                        <TouchableOpacity
                                            style={[styles.cta, loading && { opacity: 0.7 }]}
                                            onPress={handleStaffLogin}
                                            disabled={loading}
                                            activeOpacity={0.85}
                                        >
                                            <View style={[styles.ctaGradient, { backgroundColor: '#DF2324' }]}>
                                                {loading
                                                    ? <ActivityIndicator color="#FFF" />
                                                    : <>
                                                        <Text style={styles.ctaText}>AUTHORIZE SESSION</Text>
                                                        <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
                                                    </>
                                                }
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* Guest access enabled with restrictions (View Only Dashboard) */}
                                <TouchableOpacity onPress={() => useAuthStore.getState().setGuest(true)} style={styles.guestPortalBtn} activeOpacity={0.8}>
                                    <Ionicons name="cart-outline" size={14} color="#DF2324" style={{ marginRight: 6 }} />
                                    <Text style={styles.guestPortalText}>CONTINUE AS A GUEST</Text>
                                    <Ionicons name="arrow-forward-outline" size={14} color="#DF2324" style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>

                            {/* Footer trust badges */}
                            <View style={styles.badges}>
                                {[
                                    { icon: 'shield-checkmark-outline', label: 'SECURE CHECKOUT' },
                                    { icon: 'star-outline', label: 'TOP RATED PARTS' },
                                    { icon: 'car-outline', label: 'FITMENT GUARANTEE' }
                                ].map(b => (
                                    <View key={b.label} style={styles.badge}>
                                        <Ionicons name={b.icon as any} size={20} color="#DF2324" />
                                        <Text style={styles.badgeText}>{b.label}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.indiaFooter}>
                                <Text style={styles.indiaText}>
                                    MADE IN <Text style={{ color: '#FF9933' }}>IN</Text>DIA FOR IN<Text style={{ color: '#138808' }}>D</Text>IA
                                </Text>
                            </View>


                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}
