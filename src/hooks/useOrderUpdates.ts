import { useEffect, useRef } from 'react';
import { webSocketService } from '../services/webSocketService';

export const useOrderUpdates = (orderId: string | number | undefined, onUpdate: (order: any) => void) => {
  // Use a ref so the effect does not re-run when the caller passes a new inline callback.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!orderId) return;

    const topic = `/topic/orders/${orderId}`;
    const unsubscribe = webSocketService.subscribe(topic, (message) => {
        onUpdateRef.current(message);
    });

    return () => {
        unsubscribe();
    };
  }, [orderId]); // Only re-subscribe when orderId changes
};
