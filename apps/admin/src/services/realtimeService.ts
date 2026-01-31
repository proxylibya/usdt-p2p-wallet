/**
 * Real-time Service for Admin Dashboard
 * Provides unified WebSocket connection for live updates
 */

type EventType = 
  | 'user:online' | 'user:offline' | 'user:new' | 'user:updated'
  | 'transaction:new' | 'transaction:updated' | 'transaction:completed'
  | 'trade:new' | 'trade:updated' | 'trade:completed' | 'trade:disputed'
  | 'dispute:new' | 'dispute:updated' | 'dispute:resolved'
  | 'kyc:submitted' | 'kyc:approved' | 'kyc:rejected'
  | 'alert:security' | 'alert:system'
  | 'stats:updated';

interface RealtimeEvent<T = unknown> {
  type: EventType;
  data: T;
  timestamp: string;
}

type EventCallback<T = unknown> = (data: T) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private listeners: Map<EventType, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private eventQueue: RealtimeEvent[] = [];
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set();

  private getWebSocketUrl(): string {
    const token = localStorage.getItem('admin_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_URL?.replace(/^https?:\/\//, '') || 'localhost:3000';
    return `${protocol}//${host}/admin/ws?token=${token}`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.getWebSocketUrl());

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionStatus(true);
        this.startPingInterval();
        this.flushEventQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: RealtimeEvent = JSON.parse(event.data);
          this.handleEvent(message);
        } catch {
          // Parse error - silently ignore
        }
      };

      this.ws.onerror = () => {
        // Connection error
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyConnectionStatus(false);
        this.stopPingInterval();
        this.attemptReconnect();
      };
    } catch {
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => this.connect(), delay);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleEvent(event: RealtimeEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event.data);
        } catch {
          // Callback error - silently ignore
        }
      });
    }

    // Also notify wildcard listeners
    const wildcardListeners = this.listeners.get('stats:updated' as EventType);
    if (wildcardListeners && event.type !== 'stats:updated') {
      wildcardListeners.forEach((callback) => {
        try {
          callback(event);
        } catch {
          // Wildcard callback error - silently ignore
        }
      });
    }
  }

  private flushEventQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      }
    }
  }

  private notifyConnectionStatus(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  // Public API

  subscribe<T = unknown>(eventType: EventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback as EventCallback);
    };
  }

  unsubscribe(eventType: EventType, callback: EventCallback): void {
    this.listeners.get(eventType)?.delete(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.add(callback);
    // Immediately notify current status
    callback(this.isConnected);
    return () => this.connectionCallbacks.delete(callback);
  }

  send(type: string, data: unknown): void {
    const event = { type, data, timestamp: new Date().toISOString() };
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      this.eventQueue.push(event as RealtimeEvent);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// React hook for using realtime service
import { useEffect, useState, useCallback } from 'react';

export function useRealtime<T = unknown>(eventType: EventType): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe<T>(eventType, setData);
    return unsubscribe;
  }, [eventType]);

  return data;
}

export function useRealtimeConnection(): boolean {
  const [isConnected, setIsConnected] = useState(realtimeService.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = realtimeService.onConnectionChange(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
}

export function useRealtimeSubscription<T = unknown>(
  eventType: EventType,
  callback: EventCallback<T>,
  deps: unknown[] = []
): void {
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribe<T>(eventType, memoizedCallback);
    return unsubscribe;
  }, [eventType, memoizedCallback]);
}

export default realtimeService;
