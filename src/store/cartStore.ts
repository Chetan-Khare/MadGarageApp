import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';
import { PRICING } from '../constants/pricing';
import apiClient from '../services/apiClient';

export interface CartItem {
    id: string;
    partName: string;
    price: number;
    imageUrl: string;
    brand: string;
    quantity: number;
    stockQuantity: number;
    mrp?: number;
    wholesale?: boolean;
    shippingClass?: 'STANDARD' | 'FRAGILE' | 'HEAVY_FREIGHT' | 'CUSTOM_RATE';
    weightKg?: number;
    customShippingCost?: number;
    sellerState?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => boolean;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
    getBaseTotal: () => number;
    getDiscountAmount: () => number;
    getRetailDiscountAmount: () => number;
    getTotalPrice: () => number;
    validateAndRefreshCart: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

    addItem: (newItem) => {
        const role = useAuthStore.getState().role;
        if (role === 'ROLE_SELLER') return false;

        let success = true;
        set((state) => {
            const existingItem = state.items.find((item) => item.id === newItem.id);

            if (existingItem) {
                const totalQty = existingItem.quantity + (newItem.quantity || 1);
                const stock = existingItem.stockQuantity ?? 0;
                if (totalQty > stock) {
                    success = false;
                    return state; // No change
                }
                return {
                    items: state.items.map((item) =>
                        item.id === newItem.id
                            ? { ...item, quantity: totalQty }
                            : item
                    ),
                };
            }

            // If it doesn't exist, provide 1 (or provided quantity) but check against its own stock
            const initialQty = newItem.quantity || 1;
            const stock = (newItem as CartItem).stockQuantity ?? 0;
            if (initialQty > stock) {
                success = false;
                return state;
            }

            return {
                items: [...state.items, { ...newItem, quantity: initialQty } as CartItem]
            };
        });
        return success;
    },

    removeItem: (id) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        }));
    },

    updateQuantity: (id, delta) => {
        set((state) => ({
            items: state.items.map((item) => {
                if (item.id === id) {
                    const newQty = item.quantity + delta;
                    // Floor at 1, Ceiling at stockQuantity
                    const cappedQty = Math.min(Math.max(1, newQty), item.stockQuantity);
                    return { ...item, quantity: cappedQty };
                }
                return item;
            }),
        }));
    },

    clearCart: () => {
        set({ items: [] });
    },

    validateAndRefreshCart: async () => {
        const { items, removeItem } = get();
        if (items.length === 0) return;
        const role = useAuthStore.getState().role;
        const isGuest = useAuthStore.getState().isGuest;
        const isWholesale = !isGuest && role === 'ROLE_GARAGE';

        try {
            const productIds = items.map(i => i.id).join(',');
            const res = await apiClient.get(`/products/bulk?ids=${productIds}`);
            const latestProducts = res.data;

            set((state) => {
                const newItems = [...state.items];
                for (let i = newItems.length - 1; i >= 0; i--) {
                    const item = newItems[i];
                    const latest = latestProducts.find((p: any) => String(p.id) === String(item.id));
                    const isProductActive = latest && (latest.active === true || latest.isActive === true);

                    if (!latest || latest.stockQuantity === 0 || !isProductActive) {
                        newItems.splice(i, 1);
                    } else {
                        newItems[i].stockQuantity = latest.stockQuantity;
                        const latestPrice = isWholesale ? (latest.garagePrice || latest.price) : latest.price;
                        newItems[i].price = latestPrice;
                        newItems[i].mrp = latest.mrp || latest.originalPrice;
                        if (newItems[i].quantity > latest.stockQuantity) {
                            newItems[i].quantity = latest.stockQuantity;
                        }
                    }
                }
                return { items: newItems };
            });
        } catch (e) {
            console.error('Failed to validate mobile cart stock:', e);
        }
    },

    getBaseTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    getDiscountAmount: () => {
        const userRole = useAuthStore.getState().role;
        if (userRole !== 'ROLE_GARAGE') return 0;
        
        return get().items.reduce((total, item) => {
            if (item.wholesale) {
                return total + (item.price * item.quantity * (1 - PRICING.GARAGE_DISCOUNT_MULTIPLIER));
            }
            return total;
        }, 0);
    },
    getRetailDiscountAmount: () => {
        return get().items.reduce((total, item) => {
            if (item.mrp && item.mrp > item.price) {
                return total + ((item.mrp - item.price) * item.quantity);
            }
            return total;
        }, 0);
    },
    getTotalPrice: () => {
        return get().getBaseTotal() - get().getDiscountAmount();
    },
        }),
        {
            name: 'madgarage-cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
