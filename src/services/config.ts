import Constants from 'expo-constants';

/**
 * Centralised server URL resolution.
 * Imported by both apiClient and webSocketService to avoid a circular dependency:
 *   authStore → webSocketService → apiClient → authStore
 */
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

  // If auto-detection fails, hardcode your local IP here:
  // const localIp = '192.168.x.x';

  return `http://${localIp}:8080`;
};

export const BASE_SERVER_URL = getBaseServerUrl();
