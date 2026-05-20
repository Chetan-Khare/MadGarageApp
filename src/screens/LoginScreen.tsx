import React, { useState } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
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
import { TermsNotice } from '../components/TermsNotice';
import { useTranslation } from 'react-i18next';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface Props { navigation: LoginScreenNavigationProp; }

// ─── Theme Definitions (Modernized for Glassmorphism & Contrast) ───────────────
const DARK = {
    bg: ['#0A0A0A', '#0A0A0A', '#0A0A0A'] as const,
    card: 'rgba(20, 20, 20, 0.75)', // Glassy transparent
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.0)',
    inputBgFocused: 'rgba(255, 255, 255, 0.08)',
    inputBorderFocused: '#DF2324',
    text: '#FFFFFF',
    subText: '#A1A1AA',
    placeholder: '#71717A',
    icon: '#71717A',
    iconFocused: '#DF2324',
    tabBg: 'rgba(255, 255, 255, 0.05)',
    tabBorder: 'rgba(255, 255, 255, 0.0)',
    tabActiveBg: '#DF2324',
    tabText: '#A1A1AA',
    tabTextActive: '#FFFFFF',
    errorBg: 'rgba(223, 35, 36, 0.15)',
    errorBorder: 'rgba(223, 35, 36, 0.4)',
    errorText: '#FF5C5C',
    badgeText: '#A1A1AA',
    logoBg: 'transparent',
    logoBorder: 'rgba(223, 35, 36, 0.5)',
    statusBar: 'light-content' as const,
    toggleIcon: 'sunny-outline',
    toggleTip: 'Switch to Light',
    eyeColor: '#71717A',
    eyeColorActive: '#DF2324',
};

const LIGHT = {
    bg: ['#F4F4F5', '#FFFFFF', '#F4F4F5'] as const,
    card: 'rgba(255, 255, 255, 0.9)', // Glassy white
    cardBorder: 'rgba(0, 0, 0, 0.05)',
    inputBg: '#F4F4F5',
    inputBorder: 'rgba(0, 0, 0, 0.0)',
    inputBgFocused: '#FFFFFF',
    inputBorderFocused: '#DF2324',
    text: '#18181B',
    subText: '#71717A',
    placeholder: '#A1A1AA',
    icon: '#A1A1AA',
    iconFocused: '#DF2324',
    tabBg: '#E4E4E7',
    tabBorder: 'rgba(0,0,0,0.0)',
    tabActiveBg: '#DF2324',
    tabText: '#71717A',
    tabTextActive: '#FFFFFF',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    errorText: '#DC2626',
    badgeText: '#71717A',
    logoBg: 'transparent',
    logoBorder: '#DF232444',
    statusBar: 'dark-content' as const,
    toggleIcon: 'moon-outline',
    toggleTip: 'Switch to Dark',
    eyeColor: '#A1A1AA',
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
            borderRadius: 16, // Smoother corners
            marginBottom: 16,
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
            fontWeight: '600',
            paddingVertical: 16, // Better touch target
        },
    });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
    const [authTab, setAuthTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');
    const { isDark, toggleTheme } = useThemeStore();
    const { t, i18n } = useTranslation();

    const theme = isDark ? DARK : LIGHT;
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
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

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'hi' : 'en';
        i18n.changeLanguage(nextLang);
    };

    const handleSendOtp = async () => {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phone || !phoneRegex.test(phone)) {
            setErrorText('Please enter a valid 10-digit phone number.');
            return;
        }
        setLoading(true);
        setErrorText('');
        try {
            const res = await apiClient.post('/auth/send-otp', { phone });
            Alert.alert("Development SMS", typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
            setShowOtpInput(true);
            setResendTimer(60);
        } catch (error: any) {
            if (error.response?.status === 429) {
                const waitTime = parseInt(error.response.headers['retry-after'] || error.response.data?.retryAfterSeconds || '900', 10);
                setResendTimer(waitTime);
                setErrorText(`Too many requests. Please wait ${Math.ceil(waitTime / 60)} minutes.`);
            } else {
                setErrorText(error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP. Try again.');
            }
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
            const data = response.data;

            if (data?.requiresRegistration) {
                navigation.navigate('CompleteProfile', { registrationToken: data.registrationToken });
            } else {
                handleLoginSuccess(data);
            }
        } catch (error: any) {
            if (error.response?.status === 429) {
                const waitTime = parseInt(error.response.headers['retry-after'] || error.response.data?.retryAfterSeconds || '900', 10);
                setErrorText(`Too many failed attempts. Try again in ${Math.ceil(waitTime / 60)} minutes.`);
            } else if (error.response?.status === 403) {
                Alert.alert("ACCOUNT DEACTIVATED", "Access to this Mad Garage profile has been purged by administration.");
                setErrorText("Account Deactivated.");
            } else {
                setErrorText(error.response?.data?.message || error.response?.data?.error || 'Invalid OTP. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStaffLogin = async () => {
        if (!email || !password) {
            setErrorText('Email and Password are required.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorText('Please enter a valid email address.');
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
            if (error.response?.status === 429) {
                const waitTime = parseInt(error.response.headers['retry-after'] || error.response.data?.retryAfterSeconds || '900', 10);
                setErrorText(`Brute-force protection: Please wait ${Math.ceil(waitTime / 60)} minutes.`);
            } else if (error.response?.status === 403) {
                Alert.alert("ACCOUNT DEACTIVATED", "Access to this Mad Garage profile has been purged by administration.");
                setErrorText("Account Deactivated.");
            } else {
                setErrorText(error.response?.data?.message || 'Login failed. Check credentials.');
            }
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
            const validRoles = ['ROLE_ADMIN', 'ROLE_SELLER', 'ROLE_CUSTOMER', 'ROLE_GARAGE', 'ROLE_WORKER'];
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
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: 20,
        },
        themeToggle: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 20, // Pill shape
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: theme.cardBorder,
        },
        themeToggleText: {
            fontSize: 11,
            fontWeight: '800',
            color: theme.text,
            letterSpacing: 1,
        },
        // ── Logo ──
        logoArea: {
            alignItems: 'center',
            marginBottom: 44,
        },
        logoWrapper: {
            marginBottom: 24,
        },
        logoRingOuter: {
            width: 120,
            height: 120,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        },
        logoRingInner: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 1.5,
            borderColor: theme.logoBorder,
            overflow: 'hidden',
            backgroundColor: theme.bg[0]
        },
        logoImg: {
            width: 100,
            height: 100,
        },
        brandName: {
            fontSize: 30,
            fontWeight: '900',
            fontStyle: 'italic',
            color: theme.text,
            letterSpacing: 3,
            marginBottom: 6,
        },
        brandTagline: {
            fontSize: 11,
            color: '#DF2324',
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: '800',
        },
        // ── Tabs (Pill Style) ──
        tabContainer: {
            flexDirection: 'row',
            backgroundColor: theme.tabBg,
            borderRadius: 100, // Modern pill shape
            padding: 4,
            marginBottom: 32,
        },
        tab: {
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderRadius: 100,
        },
        tabActive: {
            backgroundColor: theme.tabActiveBg,
            shadowColor: '#DF2324',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        tabText: { color: theme.tabText, fontWeight: '800', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
        tabTextActive: { color: theme.tabTextActive },
        // ── Card (Glassmorphism) ──
        card: {
            backgroundColor: theme.card,
            borderRadius: 28,
            padding: 28,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            marginBottom: 36,
        },
        errorBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.errorBg,
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.errorBorder,
            gap: 10,
        },
        errorText: { color: theme.errorText, flex: 1, fontSize: 13, fontWeight: '700' },
        // ── CTA ──
        cta: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
        ctaGradient: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 18,
            gap: 12,
            backgroundColor: '#DF2324',
        },
        ctaText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
        guestBtn: { alignItems: 'center', marginTop: 24 },
        guestText: { color: '#DF2324', fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
        guestPortalBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 32,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: 'rgba(223, 35, 36, 0.3)',
        },
        guestPortalText: {
            color: '#DF2324',
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 1,
            textTransform: 'uppercase',
        },
        // ── Badges ──
        badges: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            marginTop: 10,
        },
        badge: { alignItems: 'center', flex: 1, gap: 8 },
        badgeText: { color: theme.badgeText, fontSize: 9, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
        // ── India Footer ──
        indiaFooter: {
            marginTop: 48,
            alignItems: 'center',
            opacity: 0.8,
        },
        indiaText: {
            color: theme.subText,
            fontSize: 10,
            fontWeight: '800',
            letterSpacing: 3,
            textTransform: 'uppercase',
        },
    });

    const styles = makeStyles();

    // Clean dark asphalt / wet road texture (Looks incredibly premium as a backdrop)
    const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80';

    // Much smoother gradient overlay to let the texture subtly peek through at the top
    const overlayGradient = isDark
        ? ['rgba(10, 10, 10, 0.6)', 'rgba(10, 10, 10, 0.9)', '#0A0A0A'] as const
        : ['rgba(244, 244, 245, 0.6)', 'rgba(244, 244, 245, 0.9)', '#F4F4F5'] as const;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            <ImageBackground source={{ uri: BACKGROUND_IMAGE }} style={{ flex: 1 }} resizeMode="cover">
                <LinearGradient colors={overlayGradient} style={styles.gradient}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            <View style={styles.themeToggleRow}>
                                <TouchableOpacity style={[styles.themeToggle, { marginRight: 10 }]} onPress={toggleLanguage} activeOpacity={0.8}>
                                    <Ionicons name="globe-outline" size={14} color="#DF2324" />
                                    <Text style={styles.themeToggleText}>{i18n.language === 'en' ? 'ENGLISH' : 'हिंदी'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.8}>
                                    <Ionicons name={theme.toggleIcon as any} size={14} color={isDark ? '#FFD700' : '#A1A1AA'} />
                                    <Text style={styles.themeToggleText}>{isDark ? 'LIGHT' : 'DARK'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.logoArea}>
                                <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
                                    <View style={styles.logoRingOuter}>
                                        <View style={styles.logoRingInner}>
                                            <Image source={require('../../assets/app_logo.png')} style={styles.logoImg} resizeMode="cover" />
                                        </View>
                                    </View>
                                </Animated.View>
                                <MaskedView
                                    style={{ height: 40, width: '100%', alignItems: 'center' }}
                                    maskElement={
                                        <Text style={[styles.brandName, { backgroundColor: 'transparent', textAlign: 'center' }]}>
                                            THE MAD GARAGE
                                        </Text>
                                    }
                                >
                                    <LinearGradient
                                        // These colors create a shiny, metallic/glassy reflection effect
                                        colors={
                                            isDark
                                                ? ['#FFFFFF', '#A1A1AA', '#FFFFFF', '#71717A']
                                                : ['#18181B', '#71717A', '#18181B', '#A1A1AA']
                                        }
                                        locations={[0, 0.4, 0.6, 1]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ flex: 1, width: '100%' }}
                                    />
                                </MaskedView>
                                <Text style={styles.brandTagline}>Performance & High-End Parts</Text>
                            </View>

                            <View style={styles.tabContainer}>
                                <TouchableOpacity style={[styles.tab, authTab === 'CUSTOMER' && styles.tabActive]} onPress={() => handleTabChange('CUSTOMER')} activeOpacity={0.9}>
                                    <Text style={[styles.tabText, authTab === 'CUSTOMER' && styles.tabTextActive]}>CUSTOMER</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.tab, authTab === 'STAFF' && styles.tabActive]} onPress={() => handleTabChange('STAFF')} activeOpacity={0.9}>
                                    <Text style={[styles.tabText, authTab === 'STAFF' && styles.tabTextActive]}>STAFF</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.card}>
                                {!!errorText && (
                                    <View style={styles.errorBanner}>
                                        <Ionicons name="alert-circle" size={18} color={theme.errorText} />
                                        <Text style={styles.errorText}>{errorText}</Text>
                                    </View>
                                )}

                                <Text style={{ color: theme.subText, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>{t('login.title')}</Text>
                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', marginBottom: 24 }}>{t('login.subtitle')}</Text>

                                {authTab === 'CUSTOMER' ? (
                                    !showOtpInput ? (
                                        <>
                                            <InputField icon="call-outline" placeholder={t('login.phone_placeholder')} value={phone} onChangeText={(val: string) => setPhone(val.replace(/\D/g, ''))} keyboardType="phone-pad" theme={theme} maxLength={10} />
                                            <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                                                <View style={styles.ctaGradient}>
                                                    {loading ? <ActivityIndicator color="#FFF" /> : <>
                                                        <Text style={styles.ctaText}>{t('login.send_otp')}</Text>
                                                        <Ionicons name="chevron-forward-outline" size={18} color="#FFF" />
                                                    </>}
                                                </View>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <InputField icon="keypad-outline" placeholder={t('login.otp_placeholder')} value={otp} onChangeText={setOtp} keyboardType="number-pad" theme={theme} maxLength={6} />
                                            <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={loading} activeOpacity={0.85}>
                                                <View style={styles.ctaGradient}>
                                                    {loading ? <ActivityIndicator color="#FFF" /> : <>
                                                        <Text style={styles.ctaText}>{t('login.verify_button')}</Text>
                                                        <Ionicons name="lock-open-outline" size={18} color="#FFF" />
                                                    </>}
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleSendOtp} disabled={resendTimer > 0} style={styles.guestBtn}>
                                                <Text style={[styles.guestText, resendTimer > 0 && { color: theme.subText }]}>{resendTimer > 0 ? t('login.resend_in', { seconds: resendTimer }) : t('login.resend_otp')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setShowOtpInput(false)} style={[styles.guestBtn, { marginTop: 16 }]}>
                                                <Text style={[styles.guestText, { color: theme.subText }]}>{t('login.change_number')}</Text>
                                            </TouchableOpacity>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <InputField icon="mail-outline" placeholder={t('login.email_placeholder')} value={email} onChangeText={setEmail} keyboardType="email-address" theme={theme} />
                                        <InputField icon="lock-closed-outline" placeholder={t('login.password_placeholder')} value={password} onChangeText={setPassword} secureTextEntry theme={theme} />
                                        <TouchableOpacity style={[styles.cta, loading && { opacity: 0.7 }]} onPress={handleStaffLogin} disabled={loading} activeOpacity={0.85}>
                                            <View style={styles.ctaGradient}>
                                                {loading ? <ActivityIndicator color="#FFF" /> : <>
                                                    <Text style={styles.ctaText}>{t('login.login_button')}</Text>
                                                    <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
                                                </>}
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                )}

                                <TouchableOpacity onPress={() => useAuthStore.getState().setGuest(true)} style={styles.guestPortalBtn} activeOpacity={0.8}>
                                    <Text style={styles.guestPortalText}>{t('login.guest_mode')}</Text>
                                    <Ionicons name="arrow-forward" size={14} color="#DF2324" style={{ marginLeft: 6 }} />
                                </TouchableOpacity>

                                <TermsNotice style={{ marginTop: 24 }} />
                            </View>

                            <View style={styles.badges}>
                                {[
                                    { icon: 'shield-checkmark-outline', label: 'SECURE' },
                                    { icon: 'star-outline', label: 'TOP RATED' },
                                    { icon: 'car-outline', label: 'EXACT FIT' }
                                ].map(b => (
                                    <View key={b.label} style={styles.badge}>
                                        <Ionicons name={b.icon as any} size={22} color="#DF2324" />
                                        <Text style={styles.badgeText}>{b.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Partner CTA */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('PartnerRequest')}
                                style={{
                                    marginTop: 40,
                                    padding: 20,
                                    borderRadius: 24,
                                    backgroundColor: theme.card,
                                    borderWidth: 1,
                                    borderColor: theme.cardBorder,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: theme.subText, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{t('login.business_partnership')}</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text, fontStyle: 'italic', textTransform: 'uppercase' }}>{t('login.partnership_question')}</Text>
                                </View>
                                <View style={{ height: 40, width: 40, borderRadius: 20, backgroundColor: '#DF2324', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.indiaFooter}>
                                <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="shield-checkmark" size={14} color="#DF2324" />
                                    <Text style={[styles.indiaText, { color: '#DF2324', letterSpacing: 2 }]}>
                                        DATA PRIVACY {'&'} COMPLIANCE
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('ReturnPolicy')} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="refresh-circle-outline" size={14} color="#DF2324" />
                                    <Text style={[styles.indiaText, { color: '#DF2324', letterSpacing: 2 }]}>
                                        RETURN {'&'} REFUND POLICY
                                    </Text>
                                </TouchableOpacity>
                                {/* Colorful "Made in India" Text */}
                                <MaskedView
                                    style={{ height: 16, width: '100%', alignItems: 'center', marginTop: 4 }}
                                    maskElement={
                                        <Text style={[styles.indiaText, { backgroundColor: 'transparent', textAlign: 'center' }]}>
                                            {t('login.made_in_india')}
                                        </Text>
                                    }
                                >
                                    <LinearGradient
                                        // Saffron, Neutral Center (adjusts for light/dark mode), Green
                                        colors={['#FF9933', isDark ? '#FFFFFF' : '#555555', '#138808']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ flex: 1, width: 300 }}
                                    />
                                </MaskedView>
                            </View>

                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}