import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../types';

// Admin screens
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminOrderManagementScreen from '../screens/AdminOrderManagementScreen';
import AdminInventoryManagementScreen from '../screens/AdminInventoryManagementScreen';
import AdminUserManagementScreen from '../screens/AdminUserManagementScreen';
import AdminVehicleManagementScreen from '../screens/AdminVehicleManagementScreen';
import AdminRequestsView from '../screens/AdminRequestsView';
import UnifiedProfileScreen from '../screens/UnifiedProfileScreen';
import AdminSettingsScreen from '../screens/AdminSettingsScreen';
import AdminPartnerRequestsScreen from '../screens/AdminPartnerRequestsScreen';
import AdminChatAuditScreen from '../screens/AdminChatAuditScreen';

// Role-specific dashboards
import GarageDashboardScreen from '../screens/GarageDashboardScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerInventoryScreen from '../screens/SellerInventoryScreen';
import SellerOrderHistoryScreen from '../screens/SellerOrderHistoryScreen';
import SellerFlaggedProductsScreen from '../screens/SellerFlaggedProductsScreen';
import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';

// Shared authenticated screens
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ChatScreen from '../screens/ChatScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';

import EditProductScreen from '../screens/EditProductScreen';
import PartRequestScreen from '../screens/PartRequestScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AddressScreen from '../screens/AddressScreen';
import PartnerRequestScreen from '../screens/PartnerRequestScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0A0A0A' as const },
  animation: 'fade_from_bottom' as const,
};

/**
 * RoleNavigator renders the correct initial dashboard and available screens
 * based on the authenticated user's role.
 *
 * P2 FIX: Role-based routing logic extracted from App.tsx into this
 * dedicated component, following the Single Responsibility Principle.
 */
const RoleNavigator: React.FC = () => {
  const { role, isGuest } = useAuthStore();

  const getInitialRoute = (): keyof RootStackParamList => {
    if (isGuest) return 'Home';
    if (role === 'ROLE_ADMIN') return 'AdminDashboard';
    if (role === 'ROLE_SELLER') return 'SellerDashboard';
    if (role === 'ROLE_GARAGE') return 'GarageDashboard';
    if (role === 'ROLE_WORKER') return 'WorkerDashboard';
    return 'Home';
  };

  return (
    <Stack.Navigator initialRouteName={getInitialRoute()} screenOptions={screenOptions}>
      {/* Admin & Worker operational screens */}
      {(role === 'ROLE_ADMIN' || role === 'ROLE_WORKER') && (
        <>
          <Stack.Screen name="AdminOrderManagement" component={AdminOrderManagementScreen} />
          <Stack.Screen name="AdminInventoryManagement" component={AdminInventoryManagementScreen} />
          <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
          <Stack.Screen name="AdminVehicleManagement" component={AdminVehicleManagementScreen} />
          <Stack.Screen name="AdminRequests" component={AdminRequestsView} />
          <Stack.Screen name="AdminPartnerRequests" component={AdminPartnerRequestsScreen} />
          <Stack.Screen name="AdminProfile" component={UnifiedProfileScreen} />
        </>
      )}

      {/* Admin-only secure screens */}
      {role === 'ROLE_ADMIN' && (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
          <Stack.Screen name="AdminChatAudit" component={AdminChatAuditScreen} />
        </>
      )}

      {/* Seller-only screens */}
      {role === 'ROLE_SELLER' && (
        <>
          <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
          <Stack.Screen name="SellerInventory" component={SellerInventoryScreen} />
          <Stack.Screen name="SellerOrderHistory" component={SellerOrderHistoryScreen} />
          <Stack.Screen name="SellerFlaggedProducts" component={SellerFlaggedProductsScreen} />
        </>
      )}

      {/* Garage-only screens */}
      {role === 'ROLE_GARAGE' && (
        <Stack.Screen name="GarageDashboard" component={GarageDashboardScreen} />
      )}

      {/* Worker-only screens */}
      {role === 'ROLE_WORKER' && (
        <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} />
      )}

      {/* Shared authenticated screens (all roles) */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="CustomerProfile" component={UnifiedProfileScreen} />
      <Stack.Screen name="GarageProfile" component={UnifiedProfileScreen} />
      <Stack.Screen name="SellerProfile" component={UnifiedProfileScreen} />
      <Stack.Screen name="PartRequest" component={PartRequestScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="PartnerRequest" component={PartnerRequestScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
};

export default RoleNavigator;
