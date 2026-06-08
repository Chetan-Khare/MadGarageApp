import { useEffect, useRef } from 'react';
import { webSocketService } from '../services/webSocketService';
import { useAuthStore } from '../store/authStore';

/**
 * Subscribes to /topic/admin/partner-requests for real-time partner application events.
 * Only active for ROLE_ADMIN and ROLE_WORKER users.
 *
 * Message shape: { type: 'NEW' | 'STATUS_UPDATE', payload: { id, ...fields } }
 */
export const usePartnerRequestUpdates = (onUpdate: (update: any) => void) => {
    const { role } = useAuthStore();
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    useEffect(() => {
        if (role !== 'ROLE_ADMIN' && role !== 'ROLE_WORKER') return;

        const topic = '/topic/admin/partner-requests';
        console.log(`[WS] Subscribing to partner requests feed in app: ${topic}`);

        const unsubscribe = webSocketService.subscribe(topic, (message) => {
            console.log('[WS] Partner request update received in app:', message);
            onUpdateRef.current(message);
        });

        return () => {
            unsubscribe();
        };
    }, [role]);
};
