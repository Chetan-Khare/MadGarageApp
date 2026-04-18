import { create } from 'zustand';
import * as Location from 'expo-location';
import apiClient from '../services/apiClient';

interface Garage {
    id: number;
    firstName: string;
    lastName: string;
    city: string;
    latitude: number;
    longitude: number;
    profileImageUrl?: string;
    distance?: number;
}

interface LocationState {
    location: Location.LocationObject | null;
    city: string | null;
    address: string | null;
    nearbyGarages: Garage[];
    isLoading: boolean;
    error: string | null;

    detectLocation: () => Promise<void>;
    fetchGarages: (city: string, coords?: { latitude: number; longitude: number }) => Promise<void>;
    setLocation: (location: Location.LocationObject, city: string, address: string) => void;
    setManualCity: (city: string) => Promise<void>;
    saveLocationToProfile: () => Promise<void>;
}

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

export const useLocationStore = create<LocationState>((set, get) => ({
    location: null,
    city: null,
    address: null,
    nearbyGarages: [],
    isLoading: false,
    error: null,

    detectLocation: async () => {
        set({ isLoading: true, error: null });
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                set({ error: 'Permission to access location was denied', isLoading: false });
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const cityName = addr.city || addr.subregion || addr.region || 'Unknown City';
                const formattedAddr = `${addr.name || ''} ${addr.street || ''}, ${addr.district || ''}, ${cityName}`.trim();

                set({ 
                    location, 
                    city: cityName, 
                    address: formattedAddr
                });

                // Automatically fetch garages for this city
                await get().fetchGarages(cityName, location.coords);
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchGarages: async (city: string, coords?: { latitude: number; longitude: number }) => {
        try {
            set({ isLoading: true });
            const response = await apiClient.get('/users/garages', { params: { city } });
            let garages: Garage[] = response.data;

            // If we have user coordinates, calculate distance and filter by 10km
            if (coords) {
                garages = garages.map(g => ({
                    ...g,
                    distance: calculateDistance(coords.latitude, coords.longitude, g.latitude, g.longitude)
                }))
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            set({ nearbyGarages: garages });
        } catch (err) {
            console.error('Failed to fetch garages:', err);
            set({ nearbyGarages: [] });
        } finally {
            set({ isLoading: false });
        }
    },

    setLocation: (location, city, address) => {
        set({ location, city, address });
        get().fetchGarages(city, location.coords);
    },

    setManualCity: async (city: string) => {
        set({ city, location: null, address: null });
        await get().fetchGarages(city);
    },

    saveLocationToProfile: async () => {
        const { city, address, location } = get();
        if (!city) return;
        try {
            await apiClient.put('/users/profile', { 
                city, 
                address, 
                latitude: location?.coords.latitude, 
                longitude: location?.coords.longitude 
            });
            // Alert in React Native is handled in components usually, but we can log it here
            console.log('Location saved to profile');
        } catch (err) {
            console.error('Failed to save location to profile:', err);
        }
    }
}));
