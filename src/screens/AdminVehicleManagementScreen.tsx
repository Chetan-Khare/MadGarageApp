import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
    Alert, ActivityIndicator, KeyboardAvoidingView,
    Platform, ScrollView, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AdminVehicleManagement'>;
};

interface VehicleItem {
    id: number;
    make: string;
    model: string;
    trim: string;
    year: number;
    engineType?: string;
    fuelType?: string;
}

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Petrol Hybrid', 'Electric'];

export default function AdminVehicleManagementScreen({ navigation }: Props) {
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const insets = useSafeAreaInsets();

    const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    // Form fields
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [trim, setTrim] = useState('');
    const [year, setYear] = useState('');
    const [engineType, setEngineType] = useState('');
    const [fuelType, setFuelType] = useState('Petrol');

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await apiClient.get('/vehicles');
            setVehicles(resp.data);
        } catch (e) {
            Alert.alert('Error', 'Could not load vehicles.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

    const resetForm = () => {
        setMake(''); setModel(''); setTrim(''); setYear('');
        setEngineType(''); setFuelType('Petrol');
    };

    const handleAdd = async () => {
        if (!make.trim() || !model.trim() || !year.trim()) {
            Alert.alert('Validation', 'Make, Model, and Year are required.');
            return;
        }
        const parsedYear = parseInt(year);
        if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2030) {
            Alert.alert('Validation', 'Please enter a valid year between 2000 and 2030.');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post('/vehicles/admin', {
                make: make.trim(),
                model: model.trim(),
                trim: trim.trim(),
                year: parsedYear,
                engineType: engineType.trim(),
                fuelType,
            });
            Alert.alert('Success', `${make} ${model} ${parsedYear} added to the database!`);
            resetForm();
            setShowAddForm(false);
            fetchVehicles();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Could not add vehicle.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (item: VehicleItem) => {
        Alert.alert(
            'Delete Vehicle',
            `Remove ${item.year} ${item.make} ${item.model} (${item.trim}) from the database?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/vehicles/admin/${item.id}`);
                            setVehicles(prev => prev.filter(v => v.id !== item.id));
                        } catch (e) {
                            Alert.alert('Error', 'Could not delete vehicle.');
                        }
                    }
                }
            ]
        );
    };

    const filteredVehicles = vehicles.filter(v => {
        const q = searchQuery.toLowerCase();
        return (
            v.make?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q) ||
            v.trim?.toLowerCase().includes(q) ||
            v.year?.toString().includes(q)
        );
    });

    const fuelBadgeColor = (ft: string) => {
        if (ft === 'Diesel') return '#FFC107';
        if (ft === 'CNG') return '#28A745';
        if (ft === 'Electric') return '#17A2B8';
        if (ft?.includes('Hybrid')) return '#7A00E6';
        return '#DF2324';
    };

    const renderVehicle = ({ item }: { item: VehicleItem }) => (
        <View style={[styles.card, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.carTitle, { color: T.text }]}>
                        {item.year} {item.make} {item.model}
                    </Text>
                    <Text style={[styles.carTrim, { color: T.subText }]}>{item.trim || 'Base'}</Text>
                    {item.engineType ? (
                        <Text style={[styles.carEngine, { color: T.subText }]}>{item.engineType}</Text>
                    ) : null}
                </View>
                <View style={styles.cardRight}>
                    {item.fuelType ? (
                        <View style={[styles.fuelBadge, { backgroundColor: fuelBadgeColor(item.fuelType) + '22' }]}>
                            <Text style={[styles.fuelBadgeText, { color: fuelBadgeColor(item.fuelType) }]}>
                                {item.fuelType}
                            </Text>
                        </View>
                    ) : null}
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#DF2324" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.root, { backgroundColor: T.bg, paddingTop: Math.max(insets.top, 10) }]}>
            <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: T.statBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#DF2324" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: T.text }]}>Vehicle Database</Text>
                    <Text style={[styles.headerSub, { color: T.subText }]}>{vehicles.length} records</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addToggleBtn, { backgroundColor: showAddForm ? '#DF232422' : '#DF2324' }]}
                    onPress={() => { setShowAddForm(!showAddForm); resetForm(); }}
                >
                    <Ionicons name={showAddForm ? 'close' : 'add'} size={20} color={showAddForm ? '#DF2324' : '#FFF'} />
                    <Text style={[styles.addToggleTxt, { color: showAddForm ? '#DF2324' : '#FFF' }]}>
                        {showAddForm ? 'Cancel' : 'Add Car'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Add Form */}
                {showAddForm && (
                    <ScrollView style={[styles.formContainer, { backgroundColor: T.statBg, borderBottomColor: T.statBorder }]}
                        contentContainerStyle={{ padding: 16 }}
                        nestedScrollEnabled
                    >
                        <Text style={[styles.formTitle, { color: T.text }]}>➕ Add New Vehicle</Text>

                        <View style={styles.formRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: T.subText }]}>MAKE *</Text>
                                <TextInput style={[styles.input, { color: T.text, backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                    placeholder="e.g. Tata" placeholderTextColor={T.subText}
                                    value={make} onChangeText={setMake} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: T.subText }]}>MODEL *</Text>
                                <TextInput style={[styles.input, { color: T.text, backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                    placeholder="e.g. Nexon" placeholderTextColor={T.subText}
                                    value={model} onChangeText={setModel} />
                            </View>
                        </View>

                        <View style={styles.formRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: T.subText }]}>TRIM</Text>
                                <TextInput style={[styles.input, { color: T.text, backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                    placeholder="e.g. XZA+" placeholderTextColor={T.subText}
                                    value={trim} onChangeText={setTrim} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: T.subText }]}>YEAR *</Text>
                                <TextInput style={[styles.input, { color: T.text, backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                                    placeholder="e.g. 2024" placeholderTextColor={T.subText}
                                    value={year} onChangeText={setYear} keyboardType="numeric" maxLength={4} />
                            </View>
                        </View>

                        <Text style={[styles.label, { color: T.subText }]}>ENGINE TYPE</Text>
                        <TextInput style={[styles.input, { color: T.text, backgroundColor: T.inputBg, borderColor: T.inputBorder }]}
                            placeholder="e.g. 1.2L Turbo Petrol" placeholderTextColor={T.subText}
                            value={engineType} onChangeText={setEngineType} />

                        <Text style={[styles.label, { color: T.subText }]}>FUEL TYPE</Text>
                        <View style={styles.fuelRow}>
                            {FUEL_TYPES.map(ft => (
                                <TouchableOpacity
                                    key={ft}
                                    style={[styles.fuelChip, fuelType === ft && { backgroundColor: '#DF2324' }]}
                                    onPress={() => setFuelType(ft)}
                                >
                                    <Text style={[styles.fuelChipTxt, { color: fuelType === ft ? '#FFF' : T.subText }]}>{ft}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleAdd}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                                    <Text style={styles.submitBtnTxt}>Save Vehicle</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {/* Search */}
                <View style={[styles.searchRow, { backgroundColor: T.bg }]}>
                    <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                        <Ionicons name="search-outline" size={16} color={T.subText} />
                        <TextInput
                            style={[styles.searchInput, { color: T.text }]}
                            placeholder="Search make, model, year..."
                            placeholderTextColor={T.subText}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={16} color={T.subText} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#DF2324" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredVehicles}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderVehicle}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Ionicons name="car-outline" size={64} color={T.subText} />
                                <Text style={[styles.emptyText, { color: T.subText }]}>No vehicles found.</Text>
                            </View>
                        }
                    />
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1
    },
    backBtn: { marginRight: 12, padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '900' },
    headerSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    addToggleBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 10,
    },
    addToggleTxt: { fontSize: 13, fontWeight: '800' },
    formContainer: { borderBottomWidth: 1, maxHeight: 420 },
    formTitle: { fontSize: 15, fontWeight: '900', marginBottom: 16, letterSpacing: 0.5 },
    formRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
    input: {
        borderWidth: 1, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 11,
        fontSize: 14, fontWeight: '600', marginBottom: 12,
    },
    fuelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    fuelChip: {
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 8, backgroundColor: 'rgba(150,150,150,0.08)',
    },
    fuelChipTxt: { fontSize: 12, fontWeight: '700' },
    submitBtn: {
        backgroundColor: '#DF2324', borderRadius: 12,
        paddingVertical: 14, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: '#DF2324', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    submitBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 12, borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '700', marginTop: 12 },
    listContent: { padding: 16, paddingBottom: 80 },
    card: {
        borderRadius: 12, borderWidth: 1,
        padding: 14, marginBottom: 10,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    cardRight: { alignItems: 'flex-end', gap: 10, marginLeft: 12 },
    carTitle: { fontSize: 15, fontWeight: '800' },
    carTrim: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    carEngine: { fontSize: 11, marginTop: 3 },
    fuelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    fuelBadgeText: { fontSize: 10, fontWeight: '800' },
    deleteBtn: {
        padding: 8, borderRadius: 8,
        backgroundColor: 'rgba(223,35,36,0.1)',
    },
});
