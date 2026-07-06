import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_SERVER_URL } from './config';

// BASE_SERVER_URL is re-exported so existing imports from apiClient still work
export { BASE_SERVER_URL };

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
      // Silent logout on 401
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
