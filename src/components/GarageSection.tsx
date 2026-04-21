import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { BASE_SERVER_URL } from '../services/apiClient';

export const GarageSection: React.FC = () => {
    const { city, nearbyGarages, isLoading, setManualCity, saveLocationToProfile, detectLocation } = useLocationStore();
    const { token } = useAuthStore();
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingCity, setIsEditingCity] = useState(false);
    const [manualCityText, setManualCityText] = useState('');

    if (isLoading && nearbyGarages.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* The Compact Hub Bar */}
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => {
                    if (nearbyGarages.length > 0) {
                        if (Platform.OS === 'android' || Platform.OS === 'ios') {
                            const { LayoutAnimation } = require('react-native');
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        }
                        setIsExpanded(!isExpanded);
                    }
                }}
                style={[styles.hubBar, { backgroundColor: isExpanded ? T.statBg : T.inputBg, borderColor: T.inputBorder }]}
            >
                <View style={styles.hubLeft}>
                    <View style={[styles.hubIcon, { backgroundColor: '#DF232415' }]}>
                        <Ionicons name="build" size={18} color="#DF2324" />
                    </View>
                    <View>
                        <Text style={[styles.hubTitle, { color: T.text }]}>
                            FITTING HUB {city && <Text style={{ color: '#DF2324', fontStyle: 'italic' }}>• {city.toUpperCase()}</Text>}
                        </Text>
                        <Text style={[styles.hubSubtitle, { color: T.subText }]}>
                            {nearbyGarages.length > 0 ? `${nearbyGarages.length} Partner Garages Nearby` : 'Detecting local tuners...'}
                        </Text>
                    </View>
                </View>
                <View style={styles.hubRight}>
                    {nearbyGarages.length > 0 && (
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={T.subText} />
                    )}
                </View>
            </TouchableOpacity>

            {/* Quick Actions Row */}
            {!isExpanded && (
                <View style={styles.quickActions}>
                    <TouchableOpacity onPress={detectLocation} style={styles.actionBtn}>
                        <Ionicons name="locate" size={12} color="#DF2324" />
                        <Text style={[styles.actionBtnText, { color: '#DF2324' }]}>Detect</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingCity(!isEditingCity)} style={styles.actionBtn}>
                        <Ionicons name="map" size={12} color={T.subText} />
                        <Text style={[styles.actionBtnText, { color: T.subText }]}>{isEditingCity ? 'Cancel' : 'Change City'}</Text>
                    </TouchableOpacity>
                    {token && (
                        <TouchableOpacity onPress={saveLocationToProfile} style={styles.actionBtn}>
                            <Ionicons name="save" size={12} color="#00FF00" />
                            <Text style={[styles.actionBtnText, { color: '#00FF00' }]}>Save Hub</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Manual City Input */}
            {isEditingCity && !isExpanded && (
                <View style={[styles.inlineInput, { backgroundColor: T.inputBg, borderColor: T.inputBorder }]}>
                    <Ionicons name="search" size={16} color={T.subText} />
                    <TextInput
                        style={[styles.textInput, { color: T.text }]}
                        placeholder="Enter City Name"
                        placeholderTextColor={T.placeholder}
                        value={manualCityText}
                        onChangeText={setManualCityText}
                        onSubmitEditing={() => {
                            if (manualCityText) {
                                setManualCity(manualCityText);
                                setIsEditingCity(false);
                            }
                        }}
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            if (manualCityText) {
                                setManualCity(manualCityText);
                                setIsEditingCity(false);
                            }
                        }}
                        style={styles.goBtn}
                    >
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Expanded Garage List */}
            {isExpanded && (
                <View style={[styles.expandedList, { backgroundColor: T.statBg, borderColor: T.statBorder }]}>
                    {nearbyGarages.map((garage) => (
                        <TouchableOpacity 
                            key={garage.id}
                            style={[styles.garageRow, { borderBottomColor: T.statBorder }]}
                        >
                            <View style={styles.rowLeft}>
                                {garage.profileImageUrl ? (
                                    <Image 
                                        source={{ uri: garage.profileImageUrl.startsWith('http') ? garage.profileImageUrl : `${BASE_SERVER_URL}${garage.profileImageUrl}` }} 
                                        style={styles.rowImg} 
                                    />
                                ) : (
                                    <View style={[styles.rowFallback, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                                        <Text style={{ color: T.subText, fontWeight: '900' }}>{garage.firstName[0]}</Text>
                                    </View>
                                )}
                                <View style={styles.rowInfo}>
                                    <View style={styles.nameRow}>
                                        <Text style={[styles.rowName, { color: T.text }]}>{garage.firstName} {garage.lastName}</Text>
                                        <View style={styles.rowBadge}>
                                            <Ionicons name="shield-checkmark" size={10} color="#DF2324" />
                                            <Text style={styles.badgeText}>ELITE</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.rowDist, { color: T.subText }]}>
                                        {garage.distance?.toFixed(1) || '0.0'} km • {garage.city}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={T.statBorder} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                        onPress={() => setIsExpanded(false)}
                        style={styles.closeExpanded}
                    >
                        <Text style={[styles.closeExpandedText, { color: T.subText }]}>MINIMIZE HUB</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Coming Soon fallback if no garages found */}
            {city && nearbyGarages.length === 0 && (
                <View style={[styles.comingSoonCard, { backgroundColor: isDark ? '#1A0808' : '#FFF5F5', borderColor: '#DF232433' }]}>
                    <View style={styles.comingSoonLeft}>
                        <Text style={[styles.comingSoonTitle, { color: T.text }]}>MAD GARAGE <Text style={{ color: '#DF2324' }}>LIVE</Text></Text>
                        <Text style={[styles.comingSoonCity, { color: T.subText }]}>Arriving soon in {city}!</Text>
                    </View>
                    <Ionicons name="construct" size={48} color="#DF232422" style={styles.bgIcon} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 10,
    },
    hubBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    hubLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    hubIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hubTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    hubSubtitle: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    hubRight: {
        padding: 4,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        paddingHorizontal: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
    },
    actionBtnText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    inlineInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
        gap: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        paddingVertical: 8,
    },
    goBtn: {
        backgroundColor: '#DF2324',
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedList: {
        marginTop: 12,
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
    },
    garageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowImg: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    rowFallback: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowInfo: {
        gap: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rowName: {
        fontSize: 14,
        fontWeight: '800',
    },
    rowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#DF232415',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#DF2324',
    },
    rowDist: {
        fontSize: 10,
        fontWeight: '600',
    },
    closeExpanded: {
        alignItems: 'center',
        paddingTop: 16,
    },
    closeExpandedText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
    },
    comingSoonCard: {
        marginTop: 12,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    comingSoonLeft: {
        flex: 1,
    },
    comingSoonTitle: {
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    comingSoonCity: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        opacity: 0.8,
    },
    bgIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        transform: [{ rotate: '-15deg' }],
    }
});
