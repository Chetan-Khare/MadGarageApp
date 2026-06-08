import { useEffect, useRef } from 'react';
import { webSocketService } from '../services/webSocketService';
import { useAuthStore } from '../store/authStore';

export const useVehicleUpdates = (onUpdate: (update: any) => void) => {
    const { role } = useAuthStore();
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    useEffect(() => {
        // Only Admins manage vehicles
        if (role !== 'ROLE_ADMIN') return;

        const topic = '/topic/vehicles/updates';
        console.log(`[WS] Subscribing to vehicle updates feed in app: ${topic}`);

        const unsubscribe = webSocketService.subscribe(topic, (updateMessage) => {
            console.log(`[WS] Received vehicle update in app:`, updateMessage);
            onUpdateRef.current(updateMessage);
        });

        return () => {
            unsubscribe();
        };
    }, [role]);
};
