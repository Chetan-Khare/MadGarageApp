import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, KeyboardAvoidingView, Platform,
    ImageBackground, Image, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../services/apiClient';

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

export default function PartnerRequestScreen() {
    const { isDark } = useThemeStore();
    const theme = isDark ? DARK : LIGHT;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [role, setRole] = useState<'ROLE_SELLER' | 'ROLE_GARAGE'>('ROLE_SELLER');
    const [businessName, setBusinessName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const BACKGROUND_IMAGE = require('../../assets/part_request_bg.png');

    const handleSubmit = async () => {
        if (!businessName.trim() || !contactName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
            Alert.alert('Missing Info', 'Please provide essential business and contact details.');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/public/partner-requests', {
                businessName,
                contactName,
                email: email.toLowerCase().trim(),
                phone,
                role,
                address,
                city,
                state,
                pincode
            });
            Alert.alert(
                'Application Received', 
                'Thank you for reaching out! Our business development team will review your application and contact you within 48 hours.',
                [{ text: 'Great', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            Alert.alert('Submission Error', error.response?.data || 'Failed to submit application. Please verify your details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ImageBackground source={BACKGROUND_IMAGE} style={styles.safeArea} resizeMode="cover">
            <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent />

                <BlurView intensity={isDark ? 40 : 80} tint={theme.blurTint} style={[styles.integratedHeader, { paddingTop: insets.top + 10, borderBottomColor: theme.cardBorder }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>PARTNER WITH US</Text>
                        <Text style={styles.headerSubtitle}>GROW YOUR BUSINESS WITH MAD GARAGE</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <Image source={require('../../assets/app_logo.png')} style={styles.headerLogo} />
                    </View>
                </BlurView>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}>
                    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.welcomeSection}>
                            <Text style={[styles.headerText, { color: theme.text }]}>Join the Network</Text>
                            <Text style={[styles.subText, { color: theme.subText }]}>Whether you sell performance parts or provide precision installation, we have a place for your business.</Text>
                        </View>

                        <BlurView intensity={isDark ? 30 : 60} tint={theme.blurTint} style={[styles.formContainer, { borderColor: theme.cardBorder }]}>
                            
                            {/* Role Switcher */}
                            <Text style={[styles.label, { color: theme.text, marginBottom: 15 }]}>Business Type</Text>
                            <View style={styles.roleSwitcher}>
                                <TouchableOpacity 
                                    onPress={() => setRole('ROLE_SELLER')}
                                    style={[styles.roleBtn, role === 'ROLE_SELLER' && styles.roleBtnActive, { borderColor: theme.cardBorder }]}
                                >
                                    <MaterialCommunityIcons name="storefront" size={20} color={role === 'ROLE_SELLER' ? '#FFF' : theme.icon} />
                                    <Text style={[styles.roleText, { color: role === 'ROLE_SELLER' ? '#FFF' : theme.icon }]}>Seller</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setRole('ROLE_GARAGE')}
                                    style={[styles.roleBtn, role === 'ROLE_GARAGE' && styles.roleBtnActive, { borderColor: theme.cardBorder }]}
                                >
                                    <MaterialCommunityIcons name="wrench-clock" size={20} color={role === 'ROLE_GARAGE' ? '#FFF' : theme.icon} />
                                    <Text style={[styles.roleText, { color: role === 'ROLE_GARAGE' ? '#FFF' : theme.icon }]}>Garage</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Business Name *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="e.g. Apex Performance"
                                    placeholderTextColor={theme.placeholder}
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Contact Person *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="Full Name"
                                    placeholderTextColor={theme.placeholder}
                                    value={contactName}
                                    onChangeText={setContactName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Business Email *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="name@company.com"
                                    placeholderTextColor={theme.placeholder}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="10-digit mobile"
                                    placeholderTextColor={theme.placeholder}
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Location Details</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                    placeholder="Street Address, Building Name..."
                                    placeholderTextColor={theme.placeholder}
                                    multiline
                                    numberOfLines={3}
                                    value={address}
                                    onChangeText={setAddress}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={[styles.label, { color: theme.text }]}>City *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                        placeholder="Mumbai"
                                        placeholderTextColor={theme.placeholder}
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: theme.text }]}>Pincode</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                                        placeholder="400001"
                                        placeholderTextColor={theme.placeholder}
                                        keyboardType="numeric"
                                        value={pincode}
                                        onChangeText={setPincode}
                                        maxLength={6}
                                    />
                                </View>
                            </View>

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
                                    <Text style={styles.submitBtnText}>{isSubmitting ? 'Sending...' : 'Submit Application'}</Text>
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
    integratedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerRight: { width: 40, alignItems: 'flex-end' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 14, fontWeight: '900', fontStyle: 'italic', color: '#DF2324', letterSpacing: 1 },
    headerSubtitle: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: '#DF2324', textTransform: 'uppercase', marginTop: 2, opacity: 0.9 },
    headerLogo: { width: 28, height: 28, borderRadius: 14 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    welcomeSection: { marginTop: 10, marginBottom: 24 },
    headerText: { fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 8 },
    subText: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
    formContainer: { padding: 20, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    roleSwitcher: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
    roleBtnActive: { backgroundColor: '#DF2324', borderColor: '#DF2324' },
    roleText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    row: { flexDirection: 'row' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '600' },
    textArea: { height: 80, textAlignVertical: 'top' },
    submitBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden', elevation: 10 },
    submitBtnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
});
