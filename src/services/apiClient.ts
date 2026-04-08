import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// P3 FIX: API URL is now driven by an environment variable for flexibility
// across local dev, staging, and production environments.
// Set EXPO_PUBLIC_API_URL in your .env.development file (see .env.example).
// For Expo Go local development, falls back to dynamic IP detection from hostUri.
const getBaseServerUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Fallback: derive from Expo's hostUri (works for Expo Go on local network)
  const hostUri = Constants.expoConfig?.hostUri;
  
  let localIp = 'localhost';
  if (hostUri) {
    localIp = hostUri.split(':')[0];
  }

  // If auto-detection fails to reach your machine, you can hardcode your IP here:
  // const localIp = '192.168.x.x';

  const url = `http://${localIp}:8080`;
  console.log('[API Client] Base URL detected:', url);
  return url;
};

export const BASE_SERVER_URL = getBaseServerUrl();
const BASE_URL = `${BASE_SERVER_URL}/api`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds to handle multi-image uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

import { useAuthStore } from '../store/authStore';

// Request interceptor: automatically attaches JWT token from Zustand state
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ARCH-10 FIX: Prevent global JSON header from overriding FormData
    // This allows Axios to correctly set multipart/form-data with the required boundary.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles 401 Unauthorized globally (token expired/invalid)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('API returned 401 Unauthorized. Logging out.');
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
