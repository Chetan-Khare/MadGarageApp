import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { PRICING } from '../constants/pricing';

export interface CartItem {
    id: string;
    partName: string;
    price: number;
    imageUrl: string;
    brand: string;
    quantity: number;
    stockQuantity: number;
    wholesale?: boolean;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => boolean;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
    getBaseTotal: () => number;
    getDiscountAmount: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
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
    getTotalPrice: () => {
        return get().getBaseTotal() - get().getDiscountAmount();
    },
}));
