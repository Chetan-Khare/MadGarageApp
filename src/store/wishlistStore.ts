import { create } from 'zustand';
import apiClient from '../services/apiClient';

export interface WishlistItem {
    id: number;        // productId
    name: string;
    price: number;
    imageUrl?: string;
    category?: string;
    brand?: string;
    condition?: string;
}

interface WishlistState {
    items: WishlistItem[];
    loading: boolean;
    loadWishlist: () => Promise<void>;
    toggleWishlist: (product: any) => Promise<boolean>; // returns true = added
    removeFromWishlist: (productId: number) => Promise<void>;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
}

const toItem = (product: any): WishlistItem => ({
    id: product.id,
    name: product.partName || product.name || product.deviceName || 'Unknown Part',
    price: product.garagePrice ?? product.price ?? 0,
    imageUrl: product.imageUrl,
    category: product.category,
    brand: product.brand || product.manufacturer,
    condition: product.condition || 'NEW',
});

const fromApiItem = (item: any): WishlistItem => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl,
    category: item.category,
    brand: item.brand,
    condition: item.condition || 'NEW',
});

export const useWishlistStore = create<WishlistState>((set, get) => ({
    items: [],
    loading: false,

    loadWishlist: async () => {
        set({ loading: true });
        try {
            const { data } = await apiClient.get('/wishlist');
            set({ items: data.map(fromApiItem) });
        } catch {
            set({ items: [] });
        } finally {
            set({ loading: false });
        }
    },

    toggleWishlist: async (product: any) => {
        try {
            const { data } = await apiClient.post(`/wishlist/${product.id}`);
            if (data.added) {
                set(state => ({ items: [...state.items, toItem(product)] }));
            } else {
                set(state => ({ items: state.items.filter(i => i.id !== product.id) }));
            }
            return data.added as boolean;
        } catch {
            return false;
        }
    },

    removeFromWishlist: async (productId: number) => {
        try {
            await apiClient.delete(`/wishlist/${productId}`);
        } catch {
            // still remove locally
        }
        set(state => ({ items: state.items.filter(i => i.id !== productId) }));
    },

    isInWishlist: (productId: number) =>
        get().items.some(i => i.id === productId),

    clearWishlist: () => set({ items: [] }),
}));
