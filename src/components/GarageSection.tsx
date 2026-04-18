import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DARK_THEME, LIGHT_THEME } from '../store/themeStore';
import { BASE_SERVER_URL } from '../services/apiClient';

export const GarageSection: React.FC = () => {
    const { city, nearbyGarages, isLoading, setManualCity, saveLocationToProfile } = useLocationStore();
    const { token } = useAuthStore();
    const { isDark } = useThemeStore();
    const T = isDark ? DARK_THEME : LIGHT_THEME;

    if (isLoading && nearbyGarages.length === 0) return null;

    // "Coming Soon" State: If city is detected but no garages found within 10km
    if (city && nearbyGarages.length === 0) {
        return (
            <View style={[styles.comingSoonCard, { backgroundColor: isDark ? '#1A0808' : '#FFF5F5', borderColor: '#DF232433' }]}>
                <View style={styles.comingSoonLeft}>
                    <Text style={[styles.comingSoonTitle, { color: T.text }]}>MAD GARAGE <Text style={{ color: '#DF2324' }}>LIVE</Text></Text>
                    <Text style={[styles.comingSoonCity, { color: T.subText }]}>Coming soon to {city}!</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.notifyBtn}
                            onPress={() => {
                                Alert.prompt(
                                    "Change City",
                                    "Enter the city name to find garages there:",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Find", onPress: (val) => val && setManualCity(val) }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.notifyBtnText}>Change City</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Ionicons name="construct" size={48} color="#DF232422" style={styles.bgIcon} />
            </View>
        );
    }

    if (nearbyGarages.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={[styles.title, { color: T.text }]}>Verified Fitting Garages {city && `in ${city}`}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={saveLocationToProfile} style={styles.iconAction}>
                             <Ionicons name="save-outline" size={16} color={T.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                // @ts-ignore - Alert.prompt is available on iOS/Android (via polyfills often)
                                if (Platform.OS === 'web') {
                                    const val = prompt("Enter City Name:");
                                    if (val) setManualCity(val);
                                } else {
                                    Alert.prompt(
                                        "Change City",
                                        "Enter the city name:",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Find", onPress: (val) => val && setManualCity(val) }
                                        ]
                                    );
                                }
                            }}
                        >
                            <Text style={[styles.changeText, { color: T.primary }]}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.subtitle, { color: T.subText }]}>Expert installation partners nearby</Text>
            </View>

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {nearbyGarages.map((garage) => (
                    <TouchableOpacity 
                        key={garage.id}
                        style={[styles.garageCard, { backgroundColor: T.statBg, borderColor: T.statBorder }]}
                        activeOpacity={0.8}
                    >
                        {garage.profileImageUrl ? (
                            <Image 
                                source={{ uri: garage.profileImageUrl.startsWith('http') ? garage.profileImageUrl : `${BASE_SERVER_URL}${garage.profileImageUrl}` }} 
                                style={styles.garageImg} 
                            />
                        ) : (
                            <View style={[styles.fallbackImg, { backgroundColor: isDark ? '#333' : '#EEE' }]}>
                                <Ionicons name="business" size={24} color={T.subText} />
                            </View>
                        )}
                        <View style={styles.garageInfo}>
                            <Text style={[styles.garageName, { color: T.text }]} numberOfLines={1}>
                                {garage.firstName} {garage.lastName}
                            </Text>
                            <View style={styles.distRow}>
                                <Ionicons name="navigate-circle" size={12} color="#DF2324" />
                                <Text style={[styles.distText, { color: T.subText }]}>
                                     {garage.distance?.toFixed(1) || '0.0'} km away
                                </Text>
                            </View>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>EXPERT FITTING</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 16,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconAction: {
        padding: 4,
    },
    changeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    scrollContent: {
        paddingLeft: 20,
        paddingRight: 10,
    },
    garageCard: {
        width: 160,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 12,
        overflow: 'hidden',
    },
    garageImg: {
        width: '100%',
        height: 90,
    },
    fallbackImg: {
        width: '100%',
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    garageInfo: {
        padding: 12,
    },
    garageName: {
        fontSize: 13,
        fontWeight: '700',
    },
    distRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    distText: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    tag: {
        backgroundColor: '#DF232415',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    tagText: {
        color: '#DF2324',
        fontSize: 8,
        fontWeight: '900',
    },
    comingSoonCard: {
        marginHorizontal: 16,
        marginVertical: 10,
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
    notifyBtn: {
        backgroundColor: '#DF2324',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    notifyBtnText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    bgIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        transform: [{ rotate: '-15deg' }],
    }
});
