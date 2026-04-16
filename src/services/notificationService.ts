import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './apiClient';

/**
 * Configures notification display behaviour for the app.
 * Shows notifications even when the app is in the foreground.
 */
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Registers this device for push notifications and uploads the Expo Push Token
 * to the Mad Garage backend so admins can trigger notifications.
 *
 * Call this after the user logs in successfully.
 */
export async function registerForPushNotifications(): Promise<void> {
    // Push notifications work only on real physical devices
    if (!Device.isDevice) {
        // Skipping token registration on simulator
        return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        // Permission not granted
        return;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('part-requests', {
            name: 'Part Requests',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#DF2324',
        });
    }

    try {
        // Get the Expo Push Token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        const token = tokenData.data;
        // Token received

        // Save token to the backend
        await apiClient.put('/users/push-token', { expoPushToken: token });
        // Token saved

    } catch (error) {
        // Push token error
    }
}
