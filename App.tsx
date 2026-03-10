import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import AntiGravChatScreen from './src/screens/AntiGravChatScreen';

import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import SellerDashboardScreen from './src/screens/SellerDashboardScreen';
import GarageDashboardScreen from './src/screens/GarageDashboardScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import AddProductScreen from './src/screens/AddProductScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined; // Defaults to Customer Dashboard
  AdminDashboard: undefined;
  SellerDashboard: undefined;
  GarageDashboard: undefined;
  Cart: undefined;
  Chat: undefined;
  ProductDetails: { product: any };
  AddProduct: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0A0A' },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'AeroTech Hub' }} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Controls' }} />
          <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={{ title: 'Merchant Hub' }} />
          <Stack.Screen name="GarageDashboard" component={GarageDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Gear' }} />
          <Stack.Screen name="Chat" component={AntiGravChatScreen} options={{ title: 'AI Assistant' }} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
