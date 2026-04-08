import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, Image, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/authStore';
import LoginScreen from './src/screens/LoginScreen';
import RoleNavigator from './src/navigation/RoleNavigator';
import { ToastProvider } from './src/components/Toast';
import SplashScreen from './src/screens/SplashScreen';

// ─── Typed Route Parameters ──────────────────────────────────────────────────
// P2 FIX: Define a typed Product interface to replace `any` on ProductDetails.
// Covers both ProductResponse (standard customers) and GarageProductDTO (garage role).
// ProductDetailsScreen is reused for both product shapes, so all fields are optional
// except id (the one guaranteed field across all product variants).
export interface Product {
  id: number;
  // ProductResponse fields
  partName?: string;
  brand?: string;
  sku?: string;
  category?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  color?: string;
  stockQuantity?: number;
  fitmentCategory?: string;
  condition?: string;
  installationGuideUrl?: string;
  sellerId?: number;
  imageUrls?: string[];
  // GarageProductDTO fields
  name?: string;           // GarageProductDTO uses 'name' instead of 'partName'
  garagePrice?: number;    // Discounted price for garage customers
  originalPrice?: number;  // Original price (before garage discount)
  // Legacy aliases used by ProductDetailsScreen for cross-shape compatibility
  deviceName?: string;
  manufacturer?: string;
  fittedVehicles?: any[];
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  AdminDashboard: undefined;
  SellerDashboard: undefined;
  GarageDashboard: undefined;
  Cart: undefined;
  Checkout: undefined;
  Chat: undefined;
  ProductDetails: { product: Product }; // ✅ Was: { product: any }
  AddProduct: undefined;
  EditProduct: { product: Product };
  OrderHistory: undefined;
  OrderDetails: { orderId: number };
  CustomerProfile: undefined;
  GarageProfile: undefined;
  AdminOrderManagement: undefined;
  AdminInventoryManagement: undefined;
  AdminVehicleManagement: undefined;
  AdminUserManagement: { roleFilter?: string };
  AdminRequests: undefined;
  AdminProfile: undefined;
  SellerProfile: undefined;
  SellerInventory: undefined;
  SellerOrderHistory: undefined;
  SellerFlaggedProducts: undefined;
  PartRequest: undefined;
};

// ─────────────────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { token, isGuest, initializeAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      // Wait for the RPM Pulse/Rev animation (2.5s)
      await new Promise(resolve => setTimeout(resolve, 2800));
      setIsInitializing(false);
    };
    init();
  }, []);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {token || isGuest ? (
          <RoleNavigator />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
      <ToastProvider />
    </SafeAreaProvider>
  );
}
