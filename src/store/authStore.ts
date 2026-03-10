import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'GARAGE';

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

interface AuthState {
    token: string | null;
    role: UserRole | null;
    user: User | null;
    setAuth: (token: string, role: UserRole, user?: User) => Promise<void>;
    logout: () => Promise<void>;
    initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    role: null,
    user: null,

    setAuth: async (token, role, user) => {
        try {
            await SecureStore.setItemAsync('jwtToken', token);
            await SecureStore.setItemAsync('userRole', role);
            if (user) {
                await SecureStore.setItemAsync('userData', JSON.stringify(user));
            }
            set({ token, role, user });
        } catch (error) {
            console.error('Error saving auth state:', error);
        }
    },

    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('jwtToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userData');
            set({ token: null, role: null, user: null });
        } catch (error) {
            console.error('Error clearing auth state:', error);
        }
    },

    initializeAuth: async () => {
        try {
            const token = await SecureStore.getItemAsync('jwtToken');
            const role = await SecureStore.getItemAsync('userRole') as UserRole | null;
            const userDataStr = await SecureStore.getItemAsync('userData');
            const user = userDataStr ? JSON.parse(userDataStr) : null;

            if (token && role) {
                set({ token, role, user });
            } else {
                // If partial data exists but not enough to authenticate, clear it
                await SecureStore.deleteItemAsync('jwtToken');
                await SecureStore.deleteItemAsync('userRole');
                await SecureStore.deleteItemAsync('userData');
                set({ token: null, role: null, user: null });
            }
        } catch (error) {
            console.error('Error initializing auth state from SecureStore:', error);
        }
    }
}));
