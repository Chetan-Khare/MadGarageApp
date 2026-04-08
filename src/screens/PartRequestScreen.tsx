import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { ModernDashboardHeader } from '../components/ModernDashboardHeader';
import apiClient from '../services/apiClient';

export default function PartRequestScreen() {
    const { isDark } = useThemeStore();
    const navigation = useNavigation();
    
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

    const handleSubmit = async () => {
        if (!make || !model || !year || !partName) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (effectiveIsGuest && (!customerName || !customerPhone)) {
            Alert.alert('Contact Info Required', 'As a guest, please provide your name and phone number so we can reach you.');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/requests', {
                make,
                model,
                year: parseInt(year) || null,
                partName,
                description,
                customerName: effectiveIsGuest ? customerName : `${user?.firstName} ${user?.lastName}`,
                customerPhone: effectiveIsGuest ? customerPhone : '' // Backend can get phone from user profile if authenticated
            });
            Alert.alert('Request Sent', 'Our mechanics are checking the scrapyards and suppliers! We will notify you soon.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Submit request error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const bg = isDark ? '#050505' : '#F6F8FF';
    const textColor = isDark ? '#FFF' : '#111';
    const cardBg = isDark ? '#111' : '#FFF';
    const borderColor = isDark ? '#333' : '#EEE';

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <ModernDashboardHeader 
                title="Part Request" 
                subtitle="Can't find it? Request it."
                showThemeToggle={false}
                profileIcon="chevron-back"
                onProfilePress={() => navigation.goBack()}
                logo={require('../../assets/app_logo.png')}
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={[styles.headerText, { color: textColor }]}>Tell us what you need</Text>
                    <Text style={[styles.subText, { color: isDark ? '#AAA' : '#666' }]}>If the part isn't in our inventory, we will source it for you.</Text>
                    
                    <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor }]}>
                        {effectiveIsGuest && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: textColor }]}>Your Name *</Text>
                                    <TextInput 
                                        style={[styles.input, { color: textColor, borderColor }]} 
                                        placeholder="Full Name" 
                                        placeholderTextColor={isDark ? '#555' : '#AAA'}
                                        value={customerName}
                                        onChangeText={setCustomerName}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: textColor }]}>Phone Number *</Text>
                                    <TextInput 
                                        style={[styles.input, { color: textColor, borderColor }]} 
                                        placeholder="e.g. +91 99999 88888" 
                                        placeholderTextColor={isDark ? '#555' : '#AAA'}
                                        keyboardType="phone-pad"
                                        value={customerPhone}
                                        onChangeText={setCustomerPhone}
                                    />
                                </View>
                                <View style={{ height: 1, backgroundColor: borderColor, marginBottom: 20 }} />
                            </>
                        )}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Vehicle Make *</Text>
                            <TextInput 
                                style={[styles.input, { color: textColor, borderColor }]} 
                                placeholder="e.g. Hyundai" 
                                placeholderTextColor={isDark ? '#555' : '#AAA'}
                                value={make}
                                onChangeText={setMake}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Vehicle Model *</Text>
                            <TextInput 
                                style={[styles.input, { color: textColor, borderColor }]} 
                                placeholder="e.g. Creta" 
                                placeholderTextColor={isDark ? '#555' : '#AAA'}
                                value={model}
                                onChangeText={setModel}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Year *</Text>
                            <TextInput 
                                style={[styles.input, { color: textColor, borderColor }]} 
                                placeholder="e.g. 2021" 
                                placeholderTextColor={isDark ? '#555' : '#AAA'}
                                keyboardType="numeric"
                                value={year}
                                onChangeText={setYear}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Part Name *</Text>
                            <TextInput 
                                style={[styles.input, { color: textColor, borderColor }]} 
                                placeholder="e.g. Front Brake Pads" 
                                placeholderTextColor={isDark ? '#555' : '#AAA'}
                                value={partName}
                                onChangeText={setPartName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Additional Details</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea, { color: textColor, borderColor }]} 
                                placeholder="Any specific requirements or numbers..." 
                                placeholderTextColor={isDark ? '#555' : '#AAA'}
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    headerText: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
    subText: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
    formContainer: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitBtn: {
        backgroundColor: '#DF2324',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
