import { create } from 'zustand';
import apiClient from '../services/apiClient';

interface ConfigState {
    shippingFee: number;
    platformFee: number;
    freeShippingThreshold: number;
    isLoaded: boolean;
    fetchSettings: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
    shippingFee: 250,
    platformFee: 7,
    freeShippingThreshold: 400,
    isLoaded: false,
    fetchSettings: async () => {
        try {
            const response = await apiClient.get('/config/public');
            set({
                shippingFee: parseInt(response.data.SHIPPING_FEE || '250', 10),
                platformFee: parseInt(response.data.PLATFORM_FEE || '7', 10),
                freeShippingThreshold: parseInt(response.data.FREE_SHIPPING_THRESHOLD || '400', 10),
                isLoaded: true
            });
        } catch (error) {
            console.error('Failed to fetch app configuration:', error);
            // Keep defaults if fetch fails
            set({ isLoaded: true });
        }
    },
}));
