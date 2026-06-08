import { useEffect, useRef } from 'react';
import { webSocketService } from '../services/webSocketService';
import { useAuthStore } from '../store/authStore';

export const useSellerOrderFeed = (onNewOrder: (order: any) => void) => {
    const { user, role } = useAuthStore();
    const onNewOrderRef = useRef(onNewOrder);
    onNewOrderRef.current = onNewOrder;

    useEffect(() => {
        // Only subscribe if user is a SELLER and has an ID
        if (!user || role !== 'ROLE_SELLER' || !user.id) return;

        const topic = `/topic/seller/${user.id}/orders/new`;
        console.log(`[WS] Subscribing to app seller order feed: ${topic}`);

        const unsubscribe = webSocketService.subscribe(topic, (newOrder) => {
            console.log(`[WS] Received new order for seller in app:`, newOrder);
            onNewOrderRef.current(newOrder);
        });

        return () => {
            unsubscribe();
        };
    }, [user, role]);
};
