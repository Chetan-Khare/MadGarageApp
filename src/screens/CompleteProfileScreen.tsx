import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StatusBar, Alert, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

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
};

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, theme }: any) {
    const [focused, setFocused] = useState(false);
    const [isVisible, setIsVisible] = useState(!secureTextEntry);
    
    return (
        <View style={[
            styles.inputWrap, 
            { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
            focused && { borderColor: theme.inputBorderFocused, backgroundColor: theme.inputBgFocused }
        ]}>
            <Ionicons name={icon} size={20} color={focused ? theme.iconFocused : theme.icon} style={{ marginRight: 12 }} />
            <TextInput
                style={[styles.inputField, { color: theme.text }]}
                placeholder={placeholder}
                placeholderTextColor={theme.placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !isVisible}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {secureTextEntry && (
                <TouchableOpacity onPress={() => setIsVisible(!isVisible)} style={{ padding: 4 }}>
                    <Ionicons 
                        name={isVisible ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={focused ? theme.iconFocused : theme.icon} 
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function CompleteProfileScreen({ route, navigation }: Props) {
    const { registrationToken } = route.params;
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { isDark } = useThemeStore();
    const theme = isDark ? DARK : LIGHT;

    const handleComplete = async () => {
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setError('All fields are required.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
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
                // Navigation will happen automatically because 'token' in App.tsx triggers RoleNavigator
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data || 'Failed to complete profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80' }} style={{ flex: 1 }}>
                <LinearGradient colors={isDark ? ['rgba(18, 18, 18, 0.8)', '#121212'] : ['rgba(255, 255, 255, 0.8)', '#FFFFFF']} style={styles.gradient}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={styles.scroll}>
                            <View style={styles.header}>
                                <Ionicons name="person-add-outline" size={60} color="#DF2324" />
                                <Text style={[styles.title, { color: theme.text }]}>COMPLETE PROFILE</Text>
                                <Text style={[styles.subtitle, { color: theme.subText }]}>Finish setting up your Mad Garage account</Text>
                            </View>

                            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                                {error ? (
                                    <View style={styles.errorBanner}>
                                        <Ionicons name="alert-circle" size={16} color="#DF2324" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : null}

                                <InputField icon="person-outline" placeholder="First Name" value={form.firstName} onChangeText={(t: string) => setForm(f => ({ ...f, firstName: t }))} theme={theme} />
                                <InputField icon="person-outline" placeholder="Last Name" value={form.lastName} onChangeText={(t: string) => setForm(f => ({ ...f, lastName: t }))} theme={theme} />
                                <InputField icon="mail-outline" placeholder="Email Address" value={form.email} onChangeText={(t: string) => setForm(f => ({ ...f, email: t }))} theme={theme} />
                                <InputField icon="lock-closed-outline" placeholder="Password" value={form.password} onChangeText={(t: string) => setForm(f => ({ ...f, password: t }))} secureTextEntry theme={theme} />

                                <TouchableOpacity style={styles.cta} onPress={handleComplete} disabled={loading}>
                                    <LinearGradient colors={['#FF4D4D', '#DF2324']} style={styles.ctaGradient}>
                                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.ctaText}>CREATE ACCOUNT</Text>}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <Text style={[styles.backText, { color: theme.subText }]}>CANCEL</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2, marginTop: 16 },
    subtitle: { fontSize: 13, fontWeight: '600', marginTop: 8, opacity: 0.8 },
    card: { borderRadius: 24, padding: 24, borderWidth: 1, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, marginBottom: 16, borderWidth: 1, paddingHorizontal: 16, height: 56 },
    inputField: { flex: 1, fontSize: 15, fontWeight: '700' },
    cta: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
    ctaGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
    ctaText: { color: '#FFF', fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(223, 35, 36, 0.1)', borderRadius: 12, padding: 12, marginBottom: 20, gap: 8 },
    errorText: { color: '#DF2324', flex: 1, fontSize: 13, fontWeight: '800' },
    backBtn: { marginTop: 24, alignItems: 'center' },
    backText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
});
