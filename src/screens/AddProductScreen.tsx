import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModernDropdown from '../components/ModernDropdown';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Vehicle, RootStackParamList } from '../types';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../services/apiClient';
import * as ImageManipulator from 'expo-image-manipulator';

import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';

const PART_CATEGORIES = [
    'Sound Tech',
    'Engine',
    'Suspension',
    'Exhaust',
    'Electrical',
    'others',
];

const COLORS = [
    'Black',
    'Silver',
    'White',
    'Red',
    'Blue',
    'Unpainted/Raw',
    'Other'
];

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;
};

export default function AddProductScreen({ navigation }: Props) {
    const [partName, setPartName] = useState('');
    const [brand, setBrand] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('All Tech');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [fitmentCategory, setFitmentCategory] = useState('ENGINE');
    const [condition, setCondition] = useState('NEW');
    const [color, setColor] = useState('Unpainted/Raw');
    const [isUniversal, setIsUniversal] = useState(false);
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [guideUri, setGuideUri] = useState<string | null>(null);
    const [wholesale, setWholesale] = useState(true);

    // Vehicle Selection State
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [fuels, setFuels] = useState<string[]>([]);
    const [trims, setTrims] = useState<string[]>([]);
    const [engines, setEngines] = useState<string[]>([]);

    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedFuel, setSelectedFuel] = useState('');
    const [selectedTrim, setSelectedTrim] = useState('');
    const [selectedEngine, setSelectedEngine] = useState('');

    const [selectedFitments, setSelectedFitments] = useState<Vehicle[]>([]);

    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    // Fetch Makes on mount
    React.useEffect(() => {
        apiClient.get('/vehicles/makes').then(res => setMakes(res.data)).catch(err => { /* fetch fail */ });
    }, []);

    // Fetch Models when Make changes
    React.useEffect(() => {
        if (selectedMake) {
            apiClient.get(`/vehicles/models?make=${selectedMake}`).then(res => {
                setModels(res.data);
                setSelectedModel('');
                setYears([]);
                setTrims([]);
            });
        }
    }, [selectedMake]);

    // Fetch Years when Model changes
    React.useEffect(() => {
        if (selectedMake && selectedModel) {
            apiClient.get(`/vehicles/years?make=${selectedMake}&model=${selectedModel}`).then(res => {
                setYears(res.data);
                setSelectedYear('');
                setTrims([]);
            });
        }
    }, [selectedModel]);

    // Fetch Fuels when Year changes
    React.useEffect(() => {
        if (selectedMake && selectedModel && selectedYear) {
            apiClient.get(`/vehicles/fuels?make=${selectedMake}&model=${selectedModel}&year=${selectedYear}`).then(res => {
                setFuels(res.data);
                setSelectedFuel('');
                setTrims([]);
                setEngines([]);
            });
        }
    }, [selectedYear]);

    // Fetch Trims when Fuel changes
    React.useEffect(() => {
        if (selectedMake && selectedModel && selectedYear && selectedFuel) {
            apiClient.get(`/vehicles/trims?make=${selectedMake}&model=${selectedModel}&year=${selectedYear}&fuel=${selectedFuel}`).then(res => {
                setTrims(res.data);
                setSelectedTrim('');
                setEngines([]);
            });
        }
    }, [selectedFuel]);

    // Fetch Engines when Trim changes
    React.useEffect(() => {
        if (selectedMake && selectedModel && selectedYear && selectedFuel && selectedTrim) {
            apiClient.get(`/vehicles/engines?make=${selectedMake}&model=${selectedModel}&year=${selectedYear}&fuel=${selectedFuel}&trim=${selectedTrim}`).then(res => {
                setEngines(res.data);
                setSelectedEngine('');
            });
        }
    }, [selectedTrim]);

    const handleAddFitment = async () => {
        if (!selectedEngine) {
            Alert.alert("Incomplete Selection", "Please select a full vehicle specification (Make through Engine) before adding.");
            return;
        }

        try {
            const res = await apiClient.get(`/vehicles/search?make=${selectedMake}&model=${selectedModel}&year=${selectedYear}&fuel=${selectedFuel}&trim=${selectedTrim}&engine=${selectedEngine}`);
            if (res.data && res.data.length > 0) {
                const newFits = res.data.filter((v: any) => !selectedFitments.some(sf => sf.id === v.id));
                if (newFits.length === 0) {
                    Alert.alert("Duplicate", "This vehicle is already in your compatibility list.");
                    return;
                }
                setSelectedFitments(prev => [...prev, ...newFits]);
                setSelectedMake(''); // Reset to allow next car
                setSelectedModel('');
                setSelectedYear('');
                setSelectedFuel('');
                setSelectedTrim('');
                setSelectedEngine('');
            } else {
                Alert.alert("Not Found", "No matching vehicle found in database.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to verify vehicle compatibility.");
        }
    };

    const removeFitment = (id: number) => {
        setSelectedFitments(prev => prev.filter(f => f.id !== id));
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 1, // Get full quality then compress manually
        });

        if (!result.canceled) {
            setUploading(true);
            try {
                const compressedUris: string[] = [];
                for (const asset of result.assets) {
                    const manipResult = await ImageManipulator.manipulateAsync(
                        asset.uri,
                        [{ resize: { width: 1024 } }], // Resize for product clarity
                        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    compressedUris.push(manipResult.uri);
                }
                setImageUris(prev => [...prev, ...compressedUris].slice(0, 5));
            } catch (error) {
                Alert.alert("Error", "Failed to process images.");
            } finally {
                setUploading(false);
            }
        }
    };

    const removeImage = (index: number) => {
        setImageUris(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!partName || !price || !stockQuantity || imageUris.length === 0) {
            Alert.alert("Missing Details", "Please fill out the name, price, stock, and select at least one image.");
            return;
        }

        setUploading(true);

        try {
            let vehicleIds: number[] = [];
            if (!isUniversal) {
                if (selectedFitments.length === 0 && !selectedEngine) {
                    Alert.alert("Fitment Required", "Please add at least one compatible vehicle or select Universal.");
                    setUploading(false);
                    return;
                }

                vehicleIds = selectedFitments.map(f => f.id);

                // Add current pending selection if valid
                if (selectedEngine && !selectedFitments.some(sf => 
                    sf.carModel.name === selectedModel && 
                    sf.year.toString() === selectedYear && 
                    sf.engineType === selectedEngine
                )) {
                    const res = await apiClient.get(`/vehicles/search?make=${selectedMake}&model=${selectedModel}&year=${selectedYear}&fuel=${selectedFuel}&trim=${selectedTrim}&engine=${selectedEngine}`);
                    const resIds = res.data.map((v: any) => v.id);
                    vehicleIds = [...new Set([...vehicleIds, ...resIds])];
                }
            }

            const base64Images: string[] = [];
            for (const uri of imageUris) {
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                base64Images.push(base64);
            }

            // Optional Guide conversion
            let base64Guide: string | null = null;
            let guideExt: string | null = null;
            if (guideUri) {
                base64Guide = await FileSystem.readAsStringAsync(guideUri, { encoding: FileSystem.EncodingType.Base64 });
                guideExt = guideUri.split('.').pop() || 'pdf';
            }

            const payload = {
                sku: sku || `MG-${Math.floor(Math.random() * 10000)}`,
                brand: brand || 'MAD GARAGE',
                partName,
                category,
                price: parseFloat(price),
                description: description || 'High performance part.',
                stockQuantity: parseInt(stockQuantity),
                color,
                condition,
                fitmentCategory: isUniversal ? 'UNIVERSAL' : fitmentCategory,
                vehicleIds,
                base64Images,
                base64Guide,
                guideExtension: guideExt,
                wholesale
            };

            await apiClient.post('/seller/inventory/base64', payload);

            Alert.alert("Success", "Part successfully listed via Base64!");
            navigation.goBack();

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            Alert.alert("Upload Failed", `Product creation failed: ${errorMsg}\n\nHint: Check Console for details.`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: T.inputBg }]}>
                            <Ionicons name="chevron-back" size={24} color={T.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: T.text }]}>New Listing</Text>
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    const res = await apiClient.get('/debug/ping');
                                    Alert.alert("Connection OK", `Status: ${res.data.status}\n${res.data.message}`);
                                } catch (err: any) {
                                    console.error("Ping failed", err);
                                    Alert.alert("Connection Failed", `Could not reach backend at ${apiClient.defaults.baseURL}\n\nError: ${err.message}`);
                                }
                            }}
                            style={[styles.pingBtn, { backgroundColor: T.inputBg }]}
                        >
                            <Ionicons name="wifi" size={20} color={T.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.imageSection}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollView}>
                                {imageUris.map((uri, index) => (
                                    <View key={index} style={styles.imageThumbnailContainer}>
                                        <Image source={{ uri }} style={styles.thumbnailImage} />
                                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                                            <Ionicons name="close-circle" size={20} color="#FF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {imageUris.length < 5 && (
                                    <TouchableOpacity style={[styles.imagePicker, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]} onPress={pickImage}>
                                        <View style={styles.pickerPlaceholder}>
                                            <Ionicons name="camera-outline" size={32} color="#DF2324" />
                                            <Text style={[styles.pickerText, { color: T.subText }]}>{imageUris.length > 0 ? 'Add More' : 'Add Photos'}</Text>
                                            <Text style={{ fontSize: 10, color: T.subText }}>Max 5</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>Part Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, borderColor: T.inputBorder, color: T.text }]}
                                    placeholderTextColor={T.placeholder}
                                    placeholder="e.g. Forged Pistons"
                                    value={partName}
                                    onChangeText={setPartName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>Brand</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: T.inputBg, borderColor: T.inputBorder, color: T.text }]}
                                    placeholderTextColor={T.placeholder}
                                    placeholder="e.g. CP Carrillo"
                                    value={brand}
                                    onChangeText={setBrand}
                                />
                            </View>

                            <View style={styles.row}>
                                <ModernDropdown
                                    label="Condition"
                                    value={condition}
                                    options={['NEW', 'USED', 'REFURBISHED']}
                                    onSelect={(val) => {
                                        setCondition(val);
                                        if (val === 'USED' || val === 'REFURBISHED') {
                                            setStockQuantity('1');
                                        }
                                    }}
                                    containerStyle={{ flex: 1, marginRight: 12 }}
                                />
                                <ModernDropdown
                                    label="Color"
                                    value={color}
                                    options={COLORS}
                                    onSelect={setColor}
                                    containerStyle={{ flex: 1 }}
                                />
                            </View>

                            <ModernDropdown
                                label="Category"
                                value={category}
                                options={PART_CATEGORIES}
                                onSelect={setCategory}
                                placeholder="Select Part Category"
                            />

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                    <Text style={[styles.label, { color: T.subText }]}>Price (₹)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: T.inputBg, borderColor: T.inputBorder, color: T.text }]}
                                        placeholderTextColor={T.placeholder}
                                        placeholder="99.99"
                                        keyboardType="numeric"
                                        value={price}
                                        onChangeText={setPrice}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: T.subText }]}>Stock Qty</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: T.inputBg, borderColor: T.inputBorder, color: T.text }, (condition === 'USED' || condition === 'REFURBISHED') && { opacity: 0.5 }]}
                                            placeholderTextColor={T.placeholder}
                                            placeholder="10"
                                            keyboardType="numeric"
                                            value={stockQuantity}
                                            onChangeText={setStockQuantity}
                                            editable={condition !== 'USED' && condition !== 'REFURBISHED'}
                                        />
                                        {(condition === 'USED' || condition === 'REFURBISHED') && (
                                            <Text style={{ fontSize: 10, color: '#FF9800', marginTop: 4, fontWeight: '800', textTransform: 'uppercase' }}>Locked to 1 unit</Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: T.inputBg, borderColor: T.inputBorder, color: T.text }]}
                                    placeholderTextColor={T.placeholder}
                                    placeholder="Specifications..."
                                    multiline
                                    numberOfLines={4}
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>


                            {/* Wholesale Eligibility Toggle */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>Listing Type</Text>
                                <View style={[styles.wholesaleCard, { backgroundColor: T.inputBg, borderColor: wholesale ? '#DF232466' : T.inputBorder }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.wholesaleTitle, { color: T.text }]}>Wholesale / Garage Discounts</Text>
                                        <Text style={{ fontSize: 10, color: T.subText, marginTop: 2 }}>
                                            {wholesale ? 'Garages will receive tiered pricing on this part' : 'Full retail price for all buyers'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setWholesale(!wholesale)}
                                        style={{ width: 48, height: 26, borderRadius: 13, backgroundColor: wholesale ? '#DF2324' : '#444', padding: 2, justifyContent: 'center' }}
                                    >
                                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', alignSelf: wholesale ? 'flex-end' : 'flex-start' }} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: T.subText }]}>Fitment Type</Text>
                                <View style={styles.fitmentToggleRow}>
                                    <TouchableOpacity
                                        style={[styles.fitmentToggle, !isUniversal && styles.fitmentToggleActive]}
                                        onPress={() => setIsUniversal(false)}
                                    >
                                        <Ionicons name="car-sport-outline" size={18} color={!isUniversal ? "#FFF" : T.subText} />
                                        <Text style={[styles.fitmentToggleText, !isUniversal && styles.fitmentToggleTextActive]}>Specific Vehicle</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.fitmentToggle, isUniversal && styles.fitmentToggleActive]}
                                        onPress={() => setIsUniversal(true)}
                                    >
                                        <Ionicons name="globe-outline" size={18} color={isUniversal ? "#FFF" : T.subText} />
                                        <Text style={[styles.fitmentToggleText, isUniversal && styles.fitmentToggleTextActive]}>Universal Part</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {!isUniversal && (
                                <View style={[styles.vehicleFilterContainer, { backgroundColor: T.headerBg }]}>
                                    <ModernDropdown
                                        label="System Category"
                                        value={fitmentCategory}
                                        options={['ENGINE', 'INTERIOR', 'BODY']}
                                        onSelect={setFitmentCategory}
                                        containerStyle={{ marginBottom: 15 }}
                                    />

                                    <Text style={[styles.sectionTitle, { color: T.text, marginBottom: 12 }]}>Vehicle Fitment</Text>

                                    <View style={styles.pickerRow}>
                                        <ModernDropdown
                                            label="MAKE"
                                            value={selectedMake}
                                            options={makes}
                                            onSelect={setSelectedMake}
                                            placeholder="Select Make"
                                            containerStyle={{ flex: 1, marginRight: 12 }}
                                        />
                                        <ModernDropdown
                                            label="MODEL"
                                            value={selectedModel}
                                            options={models}
                                            onSelect={setSelectedModel}
                                            placeholder="Select Model"
                                            enabled={!!selectedMake}
                                            containerStyle={{ flex: 1 }}
                                        />
                                    </View>

                                    <View style={styles.pickerRow}>
                                        <ModernDropdown
                                            label="YEAR"
                                            value={selectedYear}
                                            options={years.map(y => y.toString())}
                                            onSelect={setSelectedYear}
                                            placeholder="Select Year"
                                            enabled={!!selectedModel}
                                            containerStyle={{ flex: 1, marginRight: 12 }}
                                        />
                                        <ModernDropdown
                                            label="FUEL"
                                            value={selectedFuel}
                                            options={fuels}
                                            onSelect={setSelectedFuel}
                                            placeholder="Select Fuel"
                                            enabled={!!selectedYear}
                                            containerStyle={{ flex: 1 }}
                                        />
                                    </View>

                                    <View style={styles.pickerRow}>
                                        <ModernDropdown
                                            label="TRIM"
                                            value={selectedTrim}
                                            options={trims}
                                            onSelect={setSelectedTrim}
                                            placeholder="Select Trim"
                                            enabled={!!selectedFuel}
                                            containerStyle={{ flex: 1, marginRight: 12 }}
                                        />
                                        <ModernDropdown
                                            label="ENGINE"
                                            value={selectedEngine}
                                            options={engines}
                                            onSelect={setSelectedEngine}
                                            placeholder="Select Engine"
                                            enabled={!!selectedTrim}
                                            containerStyle={{ flex: 1 }}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.addFitmentBtn, { borderColor: T.primary }]}
                                        onPress={handleAddFitment}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color={T.primary} />
                                        <Text style={[styles.addFitmentText, { color: T.primary }]}>ADD VEHICLE TO COMPATIBILITY</Text>
                                    </TouchableOpacity>

                                    {selectedFitments.length > 0 && (
                                        <View style={styles.fitmentList}>
                                            <Text style={[styles.label, { color: T.subText, fontSize: 10, marginTop: 10 }]}>Confirmed Fitments ({selectedFitments.length})</Text>
                                            {selectedFitments.map(item => (
                                                <View key={item.id} style={[styles.fitmentItem, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.fitmentTitle, { color: T.text }]}>{item.carModel.make.name} {item.carModel.name}</Text>
                                                        <Text style={[styles.fitmentSub, { color: T.subText }]}>{item.year} | {item.engineType}</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => removeFitment(item.id)}>
                                                        <Ionicons name="trash-outline" size={20} color="#FF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, uploading && { opacity: 0.7 }]}
                            onPress={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>PUBLISH TO MARKET</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'space-between',
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
    pingBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    formContainer: { padding: 16 },
    imageSection: {
        marginBottom: 20,
    },
    imageScrollView: {
        gap: 12,
        paddingRight: 16,
    },
    imageThumbnailContainer: {
        width: 140,
        height: 140,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
    },
    imagePicker: {
        width: 140,
        height: 140,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerPlaceholder: { alignItems: 'center' },
    pickerText: { marginTop: 6, fontSize: 13, fontWeight: '700' },
    formSection: { gap: 4 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    submitBtn: {
        marginTop: 10,
        marginBottom: 40,
        borderRadius: 12,
        height: 56,
        backgroundColor: '#DF2324',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
    vehicleFilterContainer: {
        padding: 15,
        borderRadius: 16,
        marginTop: 10,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    pickerRow: {
        flexDirection: 'row',
        marginBottom: 4,
        gap: 10,
    },
    fitmentToggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    fitmentToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        gap: 8,
    },
    fitmentToggleActive: {
        backgroundColor: '#DF2324',
        borderColor: '#DF2324',
    },
    fitmentToggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#888',
    },
    fitmentToggleTextActive: {
        color: '#FFF',
    },
    addFitmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 10,
        gap: 8,
    },
    addFitmentText: {
        fontSize: 12,
        fontWeight: '800',
    },
    fitmentList: {
        marginTop: 15,
        gap: 10,
    },
    fitmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    fitmentTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    fitmentSub: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    wholesaleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    wholesaleTitle: {
        fontSize: 13,
        fontWeight: '800',
    },
});
