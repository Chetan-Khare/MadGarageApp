import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar, ScrollView,
    KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import apiClient, { BASE_SERVER_URL } from '../services/apiClient';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, any>; };

export default function UnifiedProfileScreen({ navigation }: Props) {
    const { isDark } = useThemeStore();
    const { role, setAuth } = useAuthStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    // Role-based Flags
    const isStaff = role === 'ROLE_ADMIN' || role === 'ROLE_WORKER';
    const isBusiness = role === 'ROLE_SELLER' || role === 'ROLE_GARAGE';
    const profileTitle = role === 'ROLE_ADMIN' ? 'Admin Profile' : 
                         role === 'ROLE_WORKER' ? 'Staff Profile' : 
                         role === 'ROLE_SELLER' ? 'Merchant Profile' : 
                         role === 'ROLE_GARAGE' ? 'Garage Profile' : 'My Profile';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    // Location State (Conditional)
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await apiClient.get('/users/me');
            if (response.data) {
                setFirstName(response.data.firstName || '');
                setLastName(response.data.lastName || '');
                setEmail(response.data.email || '');
                setPhone(response.data.phone || '');
                
                if (isBusiness) {
                    setCity(response.data.city || '');
                    setAddress(response.data.address || '');
                    setLatitude(response.data.latitude?.toString() || '');
                    setLongitude(response.data.longitude?.toString() || '');
                }

                if (response.data.profileImageUrl) {
                    setProfileImageUrl(`${BASE_SERVER_URL}${response.data.profileImageUrl}`);
                }
            }
        } catch (error) {
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
                
                // COMPRESSION LOGIC: Resize to 800px and compress to 0.7 quality
                const manipResult = await ImageManipulator.manipulateAsync(
                    imageUri,
                    [{ resize: { width: 800, height: 800 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                const base64 = await new FileSystem.File(manipResult.uri).base64();
                const filename = manipResult.uri.split('/').pop() || 'profile.jpg';
                const ext = 'jpg'; // Manipulator output is JPEG

                const response = await apiClient.post('/users/profile-image/base64', {
                    base64Image: base64,
                    extension: ext
                });

                if (response.data) {
                    setProfileImageUrl(`${BASE_SERVER_URL}${response.data}`);
                    Alert.alert('Success', 'Profile photo updated!');
                }
            } catch (error: any) {
                Alert.alert('Upload Failed', 'Could not upload photo.');
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleDetectLocation = async () => {
        setDetectingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude: lat, longitude: lng } = location.coords;
            setLatitude(lat.toString());
            setLongitude(lng.toString());

            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                setCity(addr.city || addr.subregion || '');
                setAddress(`${addr.name || ''}, ${addr.street || ''}, ${addr.district || ''}`.replace(/^, |, $/g, ''));
            }
        } catch (error) {
            Alert.alert('Error', 'Could not detect location.');
        } finally {
            setDetectingLocation(false);
        }
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            Alert.alert('Missing Details', 'Required fields are missing.');
            return;
        }

        if (password.trim() && password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        setSaving(true);
        try {
            const updatePayload: any = {
                firstName, lastName, email, phone,
                password: password.trim() ? password : null
            };

            if (isBusiness) {
                updatePayload.city = city;
                updatePayload.address = address;
                updatePayload.latitude = latitude;
                updatePayload.longitude = longitude;
            }

            const response = await apiClient.put('/users/profile', updatePayload);

            if (response.data?.token) {
                await setAuth(response.data.token, role as any, response.data.user);
            }

            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Update Failed', error.response?.data?.message || 'Something went wrong.');
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
                <Text style={[styles.headerTitle, { color: T.text }]}>{profileTitle}</Text>
                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Avatar Section */}
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
                                <Ionicons name={isStaff ? "shield-checkmark" : isBusiness ? "business" : "person"} size={40} color={T.subText} />
                            )}
                        </TouchableOpacity>
                        <Text style={[styles.avatarSubtitle, { color: T.subText }]}>Update Profile Photo</Text>
                    </View>

                    {/* Identity Details */}
                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person-outline" size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>Identity Details</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>First Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Last Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                    </View>

                    {/* Business Location (Conditional) */}
                    {isBusiness && (
                        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                            <View style={styles.cardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                                    <Ionicons name="location-outline" size={20} color={T.text} />
                                    <Text style={[styles.cardTitle, { color: T.text }]}>Business Logistics</Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.detectBtn, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                    onPress={handleDetectLocation}
                                    disabled={detectingLocation}
                                >
                                    {detectingLocation ? (
                                        <ActivityIndicator size="small" color="#DF2324" />
                                    ) : (
                                        <Ionicons name="locate" size={16} color="#DF2324" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>City / Area</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>Full Address</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder, minHeight: 60 }]}
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                    <Text style={[styles.label, { color: T.subText }]}>Lat</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                        value={latitude}
                                        onChangeText={setLatitude}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: T.subText }]}>Lng</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                        value={longitude}
                                        onChangeText={setLongitude}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Security Section */}
                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="lock-closed-outline" size={20} color={T.text} />
                            <Text style={[styles.cardTitle, { color: T.text }]}>Security</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>New Password</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                <TextInput
                                    style={[styles.passwordInput, { color: T.text }]}
                                    placeholder="Leave blank to keep"
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Confirm Password</Text>
                            <View style={[styles.passwordContainer, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                <TextInput
                                    style={[styles.passwordInput, { color: T.text }]}
                                    placeholder="Repeat password"
                                    placeholderTextColor={T.subText}
                                    secureTextEntry={!showPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Partner CTA (For Customers Only) */}
                    {!isBusiness && !isStaff && (
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('PartnerRequest')}
                            style={[styles.card, { backgroundColor: isDark ? '#DF232415' : '#DF232408', borderColor: '#DF232433', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }]}
                        >
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={[styles.label, { color: '#DF2324', opacity: 1 }]}>Grow with us</Text>
                                <Text style={[styles.cardTitle, { color: T.text, fontSize: 13, textTransform: 'uppercase' }]}>Become a Seller or Garage</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={20} color="#DF2324" />
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Save Button */}
            <View style={[styles.footer, { backgroundColor: T.bg }]}>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <View style={styles.saveBtnContent}>
                        {saving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>Update Profile</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    avatarContainer: { alignItems: 'center', marginVertical: 10 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarSubtitle: { fontSize: 13, fontWeight: '700' },
    card: { borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: '800' },
    detectBtn: { padding: 8, borderRadius: 12 },
    inputGroup: { marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', opacity: 0.6 },
    input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, overflow: 'hidden' },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
    eyeIcon: { paddingHorizontal: 16 },
    footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
    saveBtn: { height: 56, borderRadius: 12, backgroundColor: '#DF2324' },
    saveBtnContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }
});
