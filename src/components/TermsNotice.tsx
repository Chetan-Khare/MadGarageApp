import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface TermsNoticeProps {
    color?: string;
    style?: any;
}

const DARK_SUBTEXT = '#A1A1AA';
const LIGHT_SUBTEXT = '#71717A';
const BRAND_RED = '#DF2324';

/**
 * TermsNotice Component
 * A reusable legal notice for the bottom of forms.
 * Privacy Policy: navigates to the in-app PrivacyPolicyScreen.
 * Terms & Conditions: placeholder alert until a T&C screen is ready.
 */
export const TermsNotice: React.FC<TermsNoticeProps> = ({ color, style }) => {
    const { isDark } = useThemeStore();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const subTextColor = color || (isDark ? DARK_SUBTEXT : LIGHT_SUBTEXT);

    const handleTermsPress = () => {
        // Placeholder for when the link is ready
        Alert.alert('Terms & Conditions', 'The link to our Terms & Conditions will be integrated here soon.');
        // Example for future: Linking.openURL('https://madgarage.com/terms');
    };

    const handlePrivacyPress = () => {
        navigation.navigate('PrivacyPolicy');
    };

    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.text, { color: subTextColor }]}>
                By continuing, you agree to our{' '}
                <Text style={styles.link} onPress={handleTermsPress}>
                    Terms & Conditions
                </Text>
                {' '}and{' '}
                <Text style={styles.link} onPress={handlePrivacyPress}>
                    Privacy Policy
                </Text>
                .
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 16,
    },
    text: {
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    link: {
        color: BRAND_RED,
        fontWeight: '800',
        textDecorationLine: 'underline',
    },
});
