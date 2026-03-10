import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface CartItem {
    id: string;
    deviceName: string;
    price: number;
    imageUrl: string;
    manufacturer: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (newItem) => {
        set((state) => {
            const existingItem = state.items.find((item) => item.id === newItem.id);

            if (existingItem) {
                // If it exists, increment the quantity
                return {
                    items: state.items.map((item) =>
                        item.id === newItem.id
                            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                            : item
                    ),
                };
            }

            // If it doesn't exist, add it with quantity 1 (or provided quantity)
            return {
                items: [...state.items, { ...newItem, quantity: newItem.quantity || 1 }]
            };
        });
    },

    removeItem: (id) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        }));
    },

    clearCart: () => {
        set({ items: [] });
    },

    getTotalPrice: () => {
        const baseTotal = get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const userRole = useAuthStore.getState().role;

        // Apply 5% discount for Garage Customers automatically across the entire app
        if (userRole === 'GARAGE') {
            return baseTotal * 0.95;
        }
        return baseTotal;
    },
}));
