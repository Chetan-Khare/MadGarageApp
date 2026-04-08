import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar, ScrollView,
    KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'GarageProfile'>; };

export default function GarageProfileScreen({ navigation }: Props) {
    const { isDark } = useThemeStore();
    const { isGuest } = useAuthStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const insets = useSafeAreaInsets();
    
    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        if (isGuest) {
            setLoading(false);
            return;
        }
        try {
            const response = await apiClient.get('/users/me');
            if (response.data) {
                setFirstName(response.data.firstName || '');
                setLastName(response.data.lastName || '');
                setEmail(response.data.email || '');
                if (response.data.profileImageUrl) {
                    setProfileImageUrl(`${BASE_SERVER_URL}${response.data.profileImageUrl}`);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not load your profile details.');
        } finally {
            setLoading(false);
        }
    };

    const pickAndUploadImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow media library access to upload a profile photo.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUploadingImage(true);
            try {
                let imageUri = result.assets[0].uri;
                const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });

                const filename = imageUri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const ext = match ? match[1] : 'jpg';

                const response = await apiClient.post('/users/profile-image/base64', {
                    base64Image: base64,
                    extension: ext
                });

                if (response.data) {
                    setProfileImageUrl(`${BASE_SERVER_URL}${response.data}`);
                    Alert.alert('Success', 'Profile photo updated!');
                }
            } catch (error: any) {
                console.error('Image upload failed:', error);
                const errorMsg = error.response?.data?.message || error.message || 'Check your connection.';
                Alert.alert('Upload Failed', `Could not upload photo: ${errorMsg}`);
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            Alert.alert('Missing Details', 'First Name, Last Name, and Email are required.');
            return;
        }

        setSaving(true);
        try {
            await apiClient.put('/users/profile', {
                firstName,
                lastName,
                email,
                password: password.trim() ? password : null
            });
            Alert.alert('Success', 'Your garage profile has been updated!');
            navigation.goBack();
        } catch (error: any) {
            console.error('Profile update failed:', error);
            const errorMsg = error.response?.data?.message || 'Something went wrong while updating your profile.';
            Alert.alert('Update Failed', errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.safe, { backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#DF2324" />
            </View>
        );
    }

    return (
        <View style={[styles.safe, { backgroundColor: T.bg, paddingTop: Math.max(insets.top, 50) }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
            
            <View style={[styles.header, { borderBottomColor: T.headerBorder }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: T.inputBg }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>Garage Profile</Text>
                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity 
                            style={[styles.avatarCircle, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                            onPress={pickAndUploadImage}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <ActivityIndicator color="#DF2324" />
                            ) : profileImageUrl ? (
                                <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="business" size={40} color={T.subText} />
                            )}
                        </TouchableOpacity>
                        <Text style={[styles.avatarSubtitle, { color: T.subText }]}>Tap image to update garage photo</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="id-card-outline" size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>Garage Details</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>First Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="John"
                                    placeholderTextColor={T.subText}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>
                            
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Last Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="Doe"
                                    placeholderTextColor={T.subText}
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="garage@example.com"
                                placeholderTextColor={T.subText}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="lock-closed-outline" size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>Security</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Set New Password (Optional)</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                <TextInput
                                    style={[styles.passwordInput, { color: T.text }]}
                                    placeholder="Leave blank to keep current"
                                    placeholderTextColor={T.subText}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={T.subText} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Save Button */}
            <View style={[styles.footer, { backgroundColor: T.bg }]}>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.85}
                >
                    <View style={styles.saveBtnContent}>
                        {saving ? (
                            <>
                                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                                <Text style={styles.saveBtnText}>Saving...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarSubtitle: {
        fontSize: 13,
        fontWeight: '700',
    },

    card: {
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    
    // Form Styles
    inputGroup: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },

    // Footer
    footer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    saveBtn: {
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#DF2324',
    },
    saveBtnContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    }
});
