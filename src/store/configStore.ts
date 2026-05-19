import { create } from 'zustand';
import apiClient from '../services/apiClient';

interface ConfigState {
    shippingFee: number;
    platformFee: number;
    freeShippingThreshold: number;
    fragileSurcharge: number;
    freightBaseFee: number;
    freightPerKgRate: number;
    zoneMultipliers: number[];
    zoneMultiplierNE: number;
    isLoaded: boolean;
    fetchSettings: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
    shippingFee: 150,
    platformFee: 7,
    freeShippingThreshold: 400,
    fragileSurcharge: 1200,
    freightBaseFee: 2000,
    freightPerKgRate: 15,
    zoneMultipliers: [1.0, 1.25, 1.5, 1.75, 2.0],
    zoneMultiplierNE: 2.25,
    isLoaded: false,
    fetchSettings: async () => {
        try {
            const response = await apiClient.get('/config/public');
            set({
                shippingFee: parseFloat(response.data.SHIPPING_FEE_STANDARD || response.data.SHIPPING_FEE || '150'),
                platformFee: parseFloat(response.data.PLATFORM_FEE || '7'),
                freeShippingThreshold: parseFloat(response.data.FREE_SHIPPING_THRESHOLD || '400'),
                fragileSurcharge: parseFloat(response.data.SHIPPING_FEE_FRAGILE || '1200'),
                freightBaseFee: parseFloat(response.data.SHIPPING_FEE_FREIGHT_BASE || '2000'),
                freightPerKgRate: parseFloat(response.data.SHIPPING_FEE_FREIGHT_PER_KG || '15'),
                zoneMultipliers: [
                    parseFloat(response.data.FREIGHT_ZONE_MULTIPLIER_0 || '1.0'),
                    parseFloat(response.data.FREIGHT_ZONE_MULTIPLIER_1 || '1.25'),
                    parseFloat(response.data.FREIGHT_ZONE_MULTIPLIER_2 || '1.5'),
                    parseFloat(response.data.FREIGHT_ZONE_MULTIPLIER_3 || '1.75'),
                    parseFloat(response.data.FREIGHT_ZONE_MULTIPLIER_4 || '2.0'),
                ],
                zoneMultiplierNE: parseFloat(response.data.FREIGHT_ZONE_MULTIPLIER_NE || '2.25'),
                isLoaded: true
            });
        } catch (error) {
            console.error('Failed to fetch app configuration:', error);
            // Keep defaults if fetch fails
            set({ isLoaded: true });
        }
    },
}));
