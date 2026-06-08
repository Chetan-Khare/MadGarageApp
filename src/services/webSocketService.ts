import { Client, StompSubscription } from '@stomp/stompjs';
import { BASE_SERVER_URL } from './apiClient';

type SubscribeCallback = (message: any) => void;

class WebSocketService {
  public client: Client | null = null;
  private pendingSubscriptions: { topic: string, callback: SubscribeCallback, unsubscribeFn?: () => void }[] = [];

  connect(token: string) {
    if (this.client?.active) {
        return;
    }

    let wsUrl = '';
    if (BASE_SERVER_URL.startsWith('http')) {
        wsUrl = BASE_SERVER_URL.replace(/^http/, 'ws') + '/ws';
    } else {
        wsUrl = `ws://localhost:8080/ws`;
    }

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      // Needed for React Native environment compatibility with stompjs
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      debug: function (_str) {
        if (__DEV__) {
          // console.log('STOMP: ' + _str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      if (__DEV__) console.log('WebSocket Connected');
      this.pendingSubscriptions.forEach(sub => {
         sub.unsubscribeFn = this.doSubscribe(sub.topic, sub.callback);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client?.active) {
        this.client.deactivate();
    }
    this.client = null;
    this.pendingSubscriptions = [];
  }

  private doSubscribe(topic: string, callback: SubscribeCallback): () => void {
    if (!this.client) return () => {};

    const subscription: StompSubscription = this.client.subscribe(topic, (msg) => {
      if (msg.body) {
        try {
            callback(JSON.parse(msg.body));
        } catch(e) {
            callback(msg.body);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  subscribe(topic: string, callback: SubscribeCallback): () => void {
    const pendingSub = { topic, callback, unsubscribeFn: undefined as any };
    this.pendingSubscriptions.push(pendingSub);

    if (this.client?.connected) {
      pendingSub.unsubscribeFn = this.doSubscribe(topic, callback);
    }

    return () => {
      if (pendingSub.unsubscribeFn) {
          pendingSub.unsubscribeFn();
      }
      this.pendingSubscriptions = this.pendingSubscriptions.filter(
          sub => sub !== pendingSub
      );
    };
  }
}

export const webSocketService = new WebSocketService();
