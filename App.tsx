import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Easing, Image, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from './src/store/authStore';
import { useConfigStore } from './src/store/configStore';
import LoginScreen from './src/screens/LoginScreen';
import RoleNavigator from './src/navigation/RoleNavigator';
import { ToastProvider } from './src/components/Toast';
import SplashScreen from './src/screens/SplashScreen';
import { useFonts, Inter_900Black_Italic } from '@expo-google-fonts/inter';

import CompleteProfileScreen from './src/screens/CompleteProfileScreen';

import { RootStackParamList } from './src/types';


// ─────────────────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { token, isGuest, initializeAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [fontsLoaded] = useFonts({
    Inter_900Black_Italic,
  });

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initializeAuth(),
        useConfigStore.getState().fetchSettings()
      ]);
      // Wait for the RPM Pulse/Rev animation (2.5s)
      await new Promise(resolve => setTimeout(resolve, 2800));
      if (fontsLoaded) {
        setIsInitializing(false);
      }
    };
    if (fontsLoaded) {
        init();
    }
  }, [fontsLoaded]);

  if (isInitializing || !fontsLoaded) {
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
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
      <ToastProvider />
    </SafeAreaProvider>
  );
}
