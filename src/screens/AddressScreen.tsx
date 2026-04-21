import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, StatusBar, TextInput, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';
import * as Location from 'expo-location';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Address'>; };

interface UserAddress {
    id: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
    tag: 'HOME' | 'OFFICE' | 'OTHER';
    isDefault: boolean;
}

export default function AddressScreen({ navigation }: Props) {
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();
    
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [tag, setTag] = useState<'HOME' | 'OFFICE' | 'OTHER'>('HOME');
    const [flatNo, setFlatNo] = useState('');
    const [floorNo, setFloorNo] = useState('');
    const [buildingName, setBuildingName] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [landMark, setLandMark] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/addresses');
            setAddresses(response.data);
        } catch (error) {
            console.error('Fetch addresses failed:', error);
            Alert.alert('Error', 'Could not load your address book.');
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to auto-fill address.');
                return;
            }

            setLoading(true);
            let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const [geo] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });

            if (geo) {
                setCity(geo.city || '');
                setStreetAddress(`${geo.name || ''} ${geo.street || ''} ${geo.district || ''}`.trim());
                setPincode(geo.postalCode || '');
            }
        } catch (e) {
            Alert.alert('Detection Failed', 'Could not determine location.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!streetAddress.trim() || !city.trim() || !pincode.trim()) {
            Alert.alert('Missing Details', 'Please fill in required fields (Street, City, Pincode).');
            return;
        }

        // CONCATENATION PROTOCOL: Combine detailed fields into a single address string
        const fullAddress = [
            flatNo && `Flat ${flatNo}`,
            floorNo && `Floor ${floorNo}`,
            buildingName && `Bldg ${buildingName}`,
            landMark && `Lnd: ${landMark}`,
            streetAddress
        ].filter(Boolean).join(', ');

        setSaving(true);
        try {
            const response = await apiClient.post('/addresses', {
                address: fullAddress, city, pincode, tag, isDefault
            });
            setAddresses([...addresses, response.data]);
            setShowForm(false);
            resetForm();
            Alert.alert('Success', 'Address protocol registered.');
        } catch (error) {
            Alert.alert('Error', 'Could not save address.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFlatNo('');
        setFloorNo('');
        setBuildingName('');
        setStreetAddress('');
        setLandMark('');
        setCity('');
        setPincode('');
        setTag('HOME');
        setIsDefault(false);
    };

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Protocol',
            'Are you sure you want to erase this location from your hub?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Erase', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/addresses/${id}`);
                            setAddresses(addresses.filter(a => a.id !== id));
                        } catch (e) { Alert.alert('Error', 'Deletion failed.'); }
                    }
                }
            ]
        );
    };

    const setAsPrimary = async (addr: UserAddress) => {
        try {
            await apiClient.put(`/addresses/${addr.id}`, { ...addr, isDefault: true });
            fetchAddresses();
        } catch (e) { Alert.alert('Error', 'Could not update primary status.'); }
    };

    if (loading && !showForm) {
        return (
            <View style={[styles.safe, { backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#DF2324" />
            </View>
        );
    }

    return (
        <View style={[styles.safe, { backgroundColor: T.bg, paddingTop: Math.max(insets.top, 20) }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
            
            <View style={[styles.header, { borderBottomColor: T.headerBorder }]}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: T.inputBg }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={T.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: T.text }]}>Address Protocol</Text>
                <TouchableOpacity 
                    style={[styles.addBtn, { backgroundColor: showForm ? '#444' : '#DF2324' }]} 
                    onPress={() => { setShowForm(!showForm); if(showForm) resetForm(); }}
                >
                    <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {showForm ? (
                    <View style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.formRow}>
                            <Text style={[styles.formTitle, { color: T.text }]}>Configure Hub</Text>
                            <TouchableOpacity onPress={detectLocation} style={styles.detectBtn}>
                                <Ionicons name="navigate" size={16} color="#DF2324" />
                                <Text style={styles.detectText}>Auto-Pin</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tagGroup}>
                            {(['HOME', 'OFFICE', 'OTHER'] as const).map(t => (
                                <TouchableOpacity 
                                    key={t}
                                    onPress={() => setTag(t)}
                                    style={[
                                        styles.tagChip, 
                                        { backgroundColor: tag === t ? '#DF2324' : T.inputBg },
                                        tag === t && styles.activeTag
                                    ]}
                                >
                                    <Ionicons 
                                        name={t === 'HOME' ? 'home' : t === 'OFFICE' ? 'business' : 'location'} 
                                        size={14} 
                                        color={tag === t ? '#FFF' : T.subText} 
                                    />
                                    <Text style={[styles.tagText, { color: tag === t ? '#FFF' : T.subText }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Flat / Unit No</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="402"
                                    placeholderTextColor={T.subText}
                                    value={flatNo}
                                    onChangeText={setFlatNo}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Floor No</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    placeholder="4th Floor"
                                    placeholderTextColor={T.subText}
                                    value={floorNo}
                                    onChangeText={setFloorNo}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Building Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="Speedway Apartments"
                                placeholderTextColor={T.subText}
                                value={buildingName}
                                onChangeText={setBuildingName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Street / Detailed Area</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="Lower Parel, Phoenix Mall Road"
                                placeholderTextColor={T.subText}
                                value={streetAddress}
                                onChangeText={setStreetAddress}
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: T.subText }]}>Landmark (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                placeholder="Behind HP Petrol Pump"
                                placeholderTextColor={T.subText}
                                value={landMark}
                                onChangeText={setLandMark}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>City</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.label, { color: T.subText }]}>Pincode</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, color: T.text, borderColor: T.inputBorder }]}
                                    value={pincode}
                                    onChangeText={setPincode}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.defaultToggle}
                            onPress={() => setIsDefault(!isDefault)}
                        >
                            <Ionicons name={isDefault ? 'checkbox' : 'square-outline'} size={24} color={isDefault ? '#DF2324' : T.subText} />
                            <Text style={[styles.defaultText, { color: T.subText }]}>Set as Primary Hub</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Register Endpoint</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.addressList}>
                        {addresses.map(addr => (
                            <View key={addr.id} style={[styles.addressCard, { backgroundColor: addr.isDefault ? '#1A1A1A' : T.card, borderColor: addr.isDefault ? '#DF2324' : T.cardBorder }]}>
                                <View style={styles.cardTop}>
                                    <View style={styles.tagBadge}>
                                        <Ionicons 
                                            name={addr.tag === 'HOME' ? 'home' : addr.tag === 'OFFICE' ? 'business' : 'location'} 
                                            size={12} 
                                            color="#DF2324" 
                                        />
                                        <Text style={styles.tagBadgeText}>{addr.tag}</Text>
                                    </View>
                                    {addr.isDefault && (
                                        <View style={styles.primaryBadge}>
                                            <Text style={styles.primaryText}>Primary</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={[styles.cardAddress, { color: addr.isDefault ? '#FFF' : T.text }]}>{addr.address}</Text>
                                <Text style={[styles.cardSub, { color: T.subText }]}>{addr.city} - {addr.pincode}</Text>

                                <View style={styles.cardActions}>
                                    {!addr.isDefault && (
                                        <TouchableOpacity onPress={() => setAsPrimary(addr)}>
                                            <Text style={styles.actionLink}>Make Primary</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(addr.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {addresses.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="map-outline" size={60} color={T.subText} />
                                <Text style={[styles.emptyTitle, { color: T.text }]}>No Hubs Set</Text>
                                <Text style={[styles.emptySub, { color: T.subText }]}>Register your first delivery endpoint using the '+' button aloft.</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 15
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', flex: 1 },
    addBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    
    card: { borderRadius: 24, padding: 20, borderWidth: 1, elevation: 4 },
    formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    formTitle: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' },
    detectBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    detectText: { fontSize: 12, fontWeight: '800', color: '#DF2324', textTransform: 'uppercase' },

    tagGroup: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tagChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
    activeTag: { borderColor: '#DF2324' },
    tagText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { borderRadius: 12, padding: 15, fontSize: 14, fontWeight: '700', borderWidth: 1 },
    row: { flexDirection: 'row' },

    defaultToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25 },
    defaultText: { fontSize: 12, fontWeight: '700' },

    saveBtn: { backgroundColor: '#DF2324', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#DF2324', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

    addressList: { gap: 16 },
    addressCard: { borderRadius: 20, padding: 20, borderWidth: 1, elevation: 2 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(223,35,36,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagBadgeText: { fontSize: 10, fontWeight: '900', color: '#DF2324' },
    primaryBadge: { backgroundColor: '#DF2324', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    primaryText: { fontSize: 9, fontWeight: '900', color: '#FFF', textTransform: 'uppercase' },
    cardAddress: { fontSize: 15, fontWeight: '800', marginBottom: 5 },
    cardSub: { fontSize: 12, fontWeight: '600' },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, marginTop: 15, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.05)' },
    actionLink: { fontSize: 11, fontWeight: '900', color: '#DF2324', textTransform: 'uppercase' },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,77,77,0.1)', justifyContent: 'center', alignItems: 'center' },

    emptyState: { alignItems: 'center', paddingVertical: 60, opacity: 0.6 },
    emptyTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', marginTop: 15 },
    emptySub: { fontSize: 12, textAlign: 'center', fontWeight: '600', marginTop: 10, paddingHorizontal: 40 }
});
