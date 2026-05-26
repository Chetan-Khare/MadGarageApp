import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './apiClient';

/**
 * Registers this device for push notifications and uploads the Expo Push Token
 * to the Mad Garage backend so admins can trigger notifications.
 *
 * Uses dynamic import() to avoid loading expo-notifications in Expo Go,
 * where push notification support was removed in SDK 53.
 *
 * Call this after the user logs in successfully.
 */
export async function registerForPushNotifications(): Promise<void> {
    // Push notifications work only on real physical devices
    if (!Device.isDevice) {
        return;
    }

    // Skip initializing expo-notifications in Expo Go client (SDK 53 compatibility)
    if (Constants.appOwnership === 'expo') {
        return;
    }

    try {
        // Dynamic import — the module is only loaded here, not at file parse time.
        // This prevents the Expo Go SDK 53 error from firing on app startup.
        const Notifications = await import('expo-notifications');

        // Configure foreground notification display
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Request permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
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

        // Get the Expo Push Token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        const token = tokenData.data;

        // Save token to the backend
        await apiClient.put('/users/push-token', { expoPushToken: token });

    } catch (error) {
        // Push notification registration failed — likely running in Expo Go
        console.log('Push notifications unavailable in this environment.');
    }
}
