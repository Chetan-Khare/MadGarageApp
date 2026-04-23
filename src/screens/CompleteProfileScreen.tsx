import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { TermsNotice } from '../components/TermsNotice';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

// ─── Theme Definitions (Modernized for Glassmorphism & Contrast) ───────────────
const DARK = {
    bg: ['#0A0A0A', '#0A0A0A', '#0A0A0A'] as const,
    card: 'rgba(20, 20, 20, 0.75)',
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
    errorBg: 'rgba(223, 35, 36, 0.15)',
    errorBorder: 'rgba(223, 35, 36, 0.4)',
    errorText: '#FF5C5C',
    eyeColor: '#71717A',
    eyeColorActive: '#DF2324',
};

const LIGHT = {
    bg: ['#F4F4F5', '#FFFFFF', '#F4F4F5'] as const,
    card: 'rgba(255, 255, 255, 0.9)',
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
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    errorText: '#DC2626',
    eyeColor: '#A1A1AA',
    eyeColorActive: '#DF2324',
};

// ─── Input Field Component ────────────────────────────────────────────────────
function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, theme }: any) {
    const [focused, setFocused] = useState(false);
    const [isVisible, setIsVisible] = useState(!secureTextEntry);
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
                secureTextEntry={isPassword ? !isVisible : false}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {isPassword && (
                <TouchableOpacity
                    onPress={() => setIsVisible(v => !v)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                >
                    <Ionicons
                        name={isVisible ? 'eye-off-outline' : 'eye-outline'}
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
            paddingVertical: 16,
        },
    });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CompleteProfileScreen({ route, navigation }: Props) {
    const { registrationToken } = route.params;
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { isDark } = useThemeStore();
    const theme = isDark ? DARK : LIGHT;

    // Animation Values
    const ctaPulse = useSharedValue(1);
    const floatAnim = useSharedValue(0);

    useEffect(() => {
        ctaPulse.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        floatAnim.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedCtaStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ctaPulse.value }],
    }));

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatAnim.value }],
    }));

    const handleComplete = async () => {
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setError('All fields are required.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        
        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
            setError('Password must contain at least one letter and one number.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await apiClient.post('/auth/complete-registration', {
                registrationToken,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email.trim().toLowerCase(),
                password: form.password
            });

            if (res.data?.token) {
                await useAuthStore.getState().setAuth(res.data.token, res.data.role as any, res.data.userId);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to complete profile.');
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        gradient: { flex: 1 },
        scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' },
        header: { alignItems: 'center', marginBottom: 44 },
        title: { fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: 3 },
        subtitle: { fontSize: 11, color: theme.subText, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '800', marginTop: 12 },
        card: {
            backgroundColor: theme.card,
            borderRadius: 28,
            padding: 28,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.4,
            shadowRadius: 30,
            elevation: 15,
        },
        cta: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
        ctaGradient: { flexDirection: 'row', height: 56, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#DF2324' },
        ctaText: { color: '#FFF', fontWeight: '800', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },
        errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.errorBg, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: theme.errorBorder, gap: 10 },
        errorText: { color: theme.errorText, flex: 1, fontSize: 13, fontWeight: '700' },
        backBtn: { marginTop: 32, alignItems: 'center', alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.cardBorder },
        backText: { fontSize: 11, fontWeight: '800', color: theme.subText, letterSpacing: 1 },
    });

    const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80';

    const overlayGradient = isDark
        ? ['rgba(10, 10, 10, 0.6)', 'rgba(10, 10, 10, 0.9)', '#0A0A0A'] as const
        : ['rgba(244, 244, 245, 0.6)', 'rgba(244, 244, 245, 0.9)', '#F4F4F5'] as const;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            <ImageBackground source={{ uri: BACKGROUND_IMAGE }} style={{ flex: 1 }} resizeMode="cover">
                <LinearGradient colors={overlayGradient} style={styles.gradient}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                            <View style={styles.header}>
                                <Ionicons name="person-circle-outline" size={64} color="#DF2324" style={{ marginBottom: 16 }} />

                                <MaskedView
                                    style={{ height: 36, width: '100%', alignItems: 'center' }}
                                    maskElement={
                                        <Text style={[styles.title, { backgroundColor: 'transparent', textAlign: 'center' }]}>
                                            COMPLETE PROFILE
                                        </Text>
                                    }
                                >
                                    <LinearGradient
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

                                <Text style={styles.subtitle}>Finalize your credentials</Text>
                            </View>

                            <Animated.View style={[styles.card, animatedCardStyle]}>
                                {error ? (
                                    <View style={styles.errorBanner}>
                                        <Ionicons name="alert-circle" size={18} color={theme.errorText} />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : null}

                                <InputField icon="person-outline" placeholder="First Name" value={form.firstName} onChangeText={(t: string) => setForm(f => ({ ...f, firstName: t }))} theme={theme} />
                                <InputField icon="person-outline" placeholder="Last Name" value={form.lastName} onChangeText={(t: string) => setForm(f => ({ ...f, lastName: t }))} theme={theme} />
                                <InputField icon="mail-outline" placeholder="Email Address" value={form.email} onChangeText={(t: string) => setForm(f => ({ ...f, email: t }))} theme={theme} />
                                <InputField icon="lock-closed-outline" placeholder="Secure Password" value={form.password} onChangeText={(t: string) => setForm(f => ({ ...f, password: t }))} secureTextEntry theme={theme} />

                                <TouchableOpacity onPress={handleComplete} disabled={loading} activeOpacity={0.85}>
                                    <Animated.View style={[styles.cta, loading && { opacity: 0.7 }, !loading && animatedCtaStyle]}>
                                        <View style={styles.ctaGradient}>
                                            {loading ? <ActivityIndicator color="#FFF" /> : <>
                                                <Text style={styles.ctaText}>CREATE ACCOUNT</Text>
                                                <Ionicons name="checkmark-done-outline" size={18} color="#FFF" />
                                            </>}
                                        </View>
                                    </Animated.View>
                                </TouchableOpacity>

                                <TermsNotice style={{ marginTop: 24 }} />
                            </Animated.View>

                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                                <Text style={styles.backText}>CANCEL</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}