import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import apiClient from '../services/apiClient';

interface SystemSetting {
    id: number;
    configKey: string;
    configValue: string;
    description: string;
}

export default function AdminSettingsScreen({ navigation }: any) {
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            Alert.alert('Connection Error', 'Unable to establish link with configuration server.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, value: string) => {
        setSavingKey(key);
        try {
            await apiClient.put('/admin/settings', { key, value });
            // Refresh settings after update
            await fetchSettings();
            Alert.alert('Success', `Parameter ${key} synchronized successfully.`);
        } catch (error) {
            console.error('Update failed:', error);
            Alert.alert('Update Failed', `Failed to synchronize ${key}.`);
        } finally {
            setSavingKey(null);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: T.bg }]}>
                <ActivityIndicator size="large" color="#DF2324" />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
            <View style={[styles.header, { borderBottomColor: T.headerBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={T.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: T.text }]}>SYSTEM CONFIG</Text>
                    <Text style={styles.subtitle}>GLOBAL OVERRIDE TERMINAL</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {settings.map((setting) => (
                    <View key={setting.id} style={[styles.card, { backgroundColor: T.card, borderColor: T.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Ionicons 
                                    name={setting.configKey.includes('SHIPPING') ? "bus-outline" : "cube-outline"} 
                                    size={20} 
                                    color="#DF2324" 
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.keyText, { color: T.text }]}>{setting.configKey.replace(/_/g, ' ')}</Text>
                                <Text style={styles.descText}>{setting.description}</Text>
                            </View>
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputWrapper, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={[styles.input, { color: T.text }]}
                                    defaultValue={setting.configValue}
                                    keyboardType="numeric"
                                    id={`input-${setting.configKey}`} // We'll use refs instead or just manual value capture
                                    onChangeText={(text) => {
                                        // Update local state if needed, but for simplicity we'll just read from a ref or use a temporary local object
                                        const newSettings = settings.map(s => s.id === setting.id ? { ...s, configValue: text } : s);
                                        setSettings(newSettings);
                                    }}
                                />
                            </View>
                            <TouchableOpacity 
                                style={[styles.saveBtn, { opacity: savingKey === setting.configKey ? 0.6 : 1 }]}
                                onPress={() => handleUpdate(setting.configKey, setting.configValue)}
                                disabled={savingKey === setting.configKey}
                            >
                                {savingKey === setting.configKey ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Ionicons name="save-outline" size={20} color="#FFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View style={styles.noteBox}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#DF2324" />
                    <Text style={[styles.noteText, { color: T.subText }]}>
                        "System-wide configuration changes propagate instantly to all active terminals. Use caution during live market sessions."
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    backBtn: { marginRight: 20 },
    title: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
    subtitle: { fontSize: 9, fontWeight: '900', color: '#DF2324', letterSpacing: 1, marginTop: 2 },
    scroll: { padding: 20 },
    card: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 20,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(223, 35, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' },
    descText: { fontSize: 10, fontWeight: '700', color: '#888', marginTop: 4, textTransform: 'uppercase' },
    inputRow: { flexDirection: 'row', gap: 12 },
    inputWrapper: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    currency: { color: '#DF2324', fontWeight: '900', fontSize: 16, marginRight: 8 },
    input: { flex: 1, height: '100%', fontWeight: '800', fontSize: 16 },
    saveBtn: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#DF2324',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#DF2324',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    noteBox: {
        padding: 24,
        backgroundColor: 'rgba(223, 35, 36, 0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(223, 35, 36, 0.1)',
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    noteText: { flex: 1, fontSize: 11, fontStyle: 'italic', lineHeight: 18, fontWeight: '500' },
});
