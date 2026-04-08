import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { PRICING } from '../constants/pricing';

export interface CartItem {
    id: string;
    deviceName: string;
    price: number;
    imageUrl: string;
    manufacturer: string;
    quantity: number;
    stockQuantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => boolean;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (newItem) => {
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

    getTotalPrice: () => {
        const baseTotal = get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const userRole = useAuthStore.getState().role;

        // P2 FIX: Use PRICING constant instead of magic number 0.95
        if (userRole === 'ROLE_GARAGE') {
            return baseTotal * PRICING.GARAGE_DISCOUNT_MULTIPLIER;
        }
        return baseTotal;
    },
}));
