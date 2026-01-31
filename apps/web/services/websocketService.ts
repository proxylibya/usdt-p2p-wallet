/**
 * WebSocket Service - Real-time price updates
 */

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './apiClient';

type PriceUpdateCallback = (prices: any[]) => void;
type AlertCallback = (alert: any) => void;

const DEFAULT_SYMBOLS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP'];

class WebSocketService {
  private socket: Socket | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private priceCallbacks: PriceUpdateCallback[] = [];
  private alertCallbacks: AlertCallback[] = [];
  private isConnected = false;

  private getSocketBaseUrl(): string {
    return API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '');
  }

  private ensureSocket(): Socket {
    if (this.socket) return this.socket;

    const socket = io(`${this.getSocketBaseUrl()}/market`, {
      transports: ['websocket'],
      autoConnect: false,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      withCredentials: true
    });

    socket.on('connect', () => {
      this.isConnected = true;
      this.subscribeToPrices();
    });

    socket.on('disconnect', () => {
      this.isConnected = false;
    });

    socket.on('connect_error', (error) => {
      if (import.meta.env.DEV) {
        console.error('[WS] Connect error:', error);
      }
    });

    socket.on('prices_update', (data) => {
      this.priceCallbacks.forEach(cb => cb(data));
    });

    socket.on('price_alert_triggered', (data) => {
      this.alertCallbacks.forEach(cb => cb(data));
    });

    this.socket = socket;
    return socket;
  }

  connect(): void {
    const socket = this.ensureSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }

  private subscribeToPrices(symbols: string[] = DEFAULT_SYMBOLS): void {
    this.socket?.emit('subscribe_prices', symbols);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  onPriceUpdate(callback: PriceUpdateCallback): () => void {
    this.priceCallbacks.push(callback);
    return () => {
      this.priceCallbacks = this.priceCallbacks.filter(cb => cb !== callback);
    };
  }

  onPriceAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
