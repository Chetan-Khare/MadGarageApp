import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, KeyboardAvoidingView, Platform,
    ImageBackground, Image, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { TermsNotice } from '../components/TermsNotice';
import apiClient from '../services/apiClient';

// ─── Theme Definitions ────────────────────────────────────────────────────────
const DARK = {
    bg: ['rgba(5, 5, 5, 0.8)', 'rgba(5, 5, 5, 0.95)', '#050505'] as const,
    card: 'rgba(20, 20, 22, 0.65)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.03)',
    text: '#FFFFFF',
    subText: '#A1A1AA',
    icon: '#71717A',
    placeholder: '#71717A',
    blurTint: 'dark' as const,
};

const LIGHT = {
    bg: ['rgba(244, 244, 245, 0.8)', 'rgba(244, 244, 245, 0.95)', '#F4F4F5'] as const,
    card: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    inputBg: 'rgba(0, 0, 0, 0.02)',
    text: '#18181B',
    subText: '#71717A',
    icon: '#A1A1AA',
    placeholder: '#A1A1AA',
    blurTint: 'light' as const,
};

export default function PartRequestScreen() {
    const { isDark } = useThemeStore();
    const theme = isDark ? DARK : LIGHT;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [partName, setPartName] = useState('');
    const [description, setDescription] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { token, isGuest, user } = useAuthStore();
    const effectiveIsGuest = !token || isGuest;

    const BACKGROUND_IMAGE = require('../../assets/part_request_bg.png');

    const handleSubmit = async () => {
        // Basic Validation
        if (!make.trim() || !model.trim() || !year.trim() || !partName.trim()) {
            Alert.alert('Missing Information', 'Please fill in all required fields marked with *');
            return;
        }

        // Numeric Check for Year
        const yearInt = parseInt(year);
        if (isNaN(yearInt) || yearInt < 1900 || yearInt > new Date().getFullYear() + 1) {
            Alert.alert('Invalid Year', 'Please enter a valid manufacture year.');
            return;
        }

        if (effectiveIsGuest && (!customerName.trim() || !customerPhone.trim())) {
            Alert.alert('Contact Info Required', 'As a guest, please provide your name and phone number so we can reach you.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Build resilient customer name for authenticated users
            const authName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Authenticated User';
            const finalCustomerName = effectiveIsGuest ? customerName : (authName || 'Valued Customer');

            await apiClient.post('/requests', {
                make: make.trim(),
                model: model.trim(),
                year: yearInt,
                partName: partName.trim(),
                description: description.trim(),
                customerName: finalCustomerName,
                customerPhone: effectiveIsGuest ? customerPhone : (user?.email || '') // Using email as backup if phone missing in store User type
            });
            Alert.alert('Request Sent', 'Our team will be on it shortly! We will notify you soon.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Submission Error', error.response?.data?.message || 'Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ImageBackground source={BACKGROUND_IMAGE} style={styles.safeArea} resizeMode="cover">
            <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent />

                {/* Glass Header - Just like Chat Screen */}
                <BlurView intensity={isDark ? 40 : 80} tint={theme.blurTint} style={[styles.integratedHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.cardBorder }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>PART REQUEST</Text>
                        <Text style={styles.headerSubtitle}>CAN'T FIND A PART ONLINE/OFFLINE?</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerLogo} />
                    </View>
                </BlurView>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
                >
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.welcomeSection}>
                            <Text style={[styles.headerText, { color: theme.text }]}>Tell us what you need</Text>
                            <Text style={[styles.subText, { color: theme.subText }]}>If the part isn't in our inventory, we will source it for you from our network scrap yards and manufacturers worldwide.</Text>
                        </View>

                        <BlurView intensity={isDark ? 30 : 60} tint={theme.blurTint} style={[styles.formContainer, { borderColor: theme.cardBorder }]}>
                            {effectiveIsGuest && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: theme.text }]}>Your Name *</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                            placeholder="Full Name"
                                            placeholderTextColor={theme.placeholder}
                                            value={customerName}
                                            onChangeText={setCustomerName}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                            placeholder="e.g. +91 99999 88888"
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="phone-pad"
                                            value={customerPhone}
                                            onChangeText={setCustomerPhone}
                                        />
                                    </View>
                                    <View style={{ height: 1.5, backgroundColor: theme.cardBorder, marginBottom: 24, marginTop: 8 }} />
                                </>
                            )}

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={[styles.label, { color: theme.text }]}>Make *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                        placeholder="Hyundai"
                                        placeholderTextColor={theme.placeholder}
                                        value={make}
                                        onChangeText={setMake}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: theme.text }]}>Model *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                        placeholder="Creta"
                                        placeholderTextColor={theme.placeholder}
                                        value={model}
                                        onChangeText={setModel}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Year *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="2021"
                                    placeholderTextColor={theme.placeholder}
                                    keyboardType="numeric"
                                    value={year}
                                    onChangeText={setYear}
                                    maxLength={4}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Part Name *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="e.g. Front Brake Pads"
                                    placeholderTextColor={theme.placeholder}
                                    value={partName}
                                    onChangeText={setPartName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Additional Details</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="Describe specifications or special requests..."
                                    placeholderTextColor={theme.placeholder}
                                    multiline
                                    numberOfLines={4}
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            <TermsNotice style={{ marginBottom: 20, marginTop: 10 }} />

                            <TouchableOpacity
                                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#DF2324', '#B91C1C']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={styles.submitBtnGradient}
                                >
                                    <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </BlurView>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },

    // Header (Synced with ChatScreen)
    integratedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 40, alignItems: 'flex-end' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: '#DF2324', letterSpacing: 1 },
    headerSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: '#DF2324', textTransform: 'uppercase', marginTop: 2, opacity: 0.9 },
    headerLogo: { width: 32, height: 32, borderRadius: 16 },

    scrollContent: { padding: 16, paddingBottom: 40 },
    welcomeSection: { marginTop: 10, marginBottom: 24 },
    headerText: { fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 8 },
    subText: { fontSize: 14, fontWeight: '500', lineHeight: 22 },

    formContainer: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    row: { flexDirection: 'row' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
    },
    textArea: { height: 100, textAlignVertical: 'top' },

    submitBtn: {
        marginTop: 10,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10
    },
    submitBtnGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
});
