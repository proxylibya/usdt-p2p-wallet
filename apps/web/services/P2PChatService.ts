/**
 * P2P Chat WebSocket Service - Real-time messaging for P2P trades
 */

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './apiClient';

export interface ChatMessage {
  id: string;
  tradeId: string;
  senderId: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  text: string;
  createdAt: Date;
}

export interface TypingEvent {
  tradeId: string;
  userId: string;
  isTyping: boolean;
}

export interface TradeUpdate {
  id: string;
  status: string;
  [key: string]: any;
}

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (event: TypingEvent) => void;
type TradeUpdateCallback = (trade: TradeUpdate) => void;
type ConnectionCallback = (connected: boolean) => void;

class P2PChatService {
  private socket: Socket | null = null;
  private currentTradeId: string | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];
  private tradeUpdateCallbacks: TradeUpdateCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  private getSocketBaseUrl(): string {
    return API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '');
  }

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(`${this.getSocketBaseUrl()}/p2p`, {
      transports: ['websocket'],
      auth: { token },
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      withCredentials: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.connectionCallbacks.forEach(cb => cb(true));
      
      // Rejoin trade room if was previously joined
      if (this.currentTradeId) {
        this.joinTrade(this.currentTradeId);
      }
    });

    this.socket.on('disconnect', () => {
      this.connectionCallbacks.forEach(cb => cb(false));
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      if (import.meta.env.DEV) {
        console.warn('[P2P WS] Connect error:', error.message);
      }
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.socket.on('user_typing', (event: TypingEvent) => {
      this.typingCallbacks.forEach(cb => cb(event));
    });

    this.socket.on('trade_updated', (trade: TradeUpdate) => {
      this.tradeUpdateCallbacks.forEach(cb => cb(trade));
    });
  }

  async joinTrade(tradeId: string): Promise<boolean> {
    if (!this.socket?.connected) {
      return false;
    }

    return new Promise((resolve) => {
      this.socket!.emit('join_trade', { tradeId }, (response: any) => {
        if (response?.success) {
          this.currentTradeId = tradeId;
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  leaveTrade(tradeId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('leave_trade', { tradeId });
    if (this.currentTradeId === tradeId) {
      this.currentTradeId = null;
    }
  }

  async sendMessage(tradeId: string, text: string): Promise<ChatMessage | null> {
    if (!this.socket?.connected) {
      return null;
    }

    return new Promise((resolve) => {
      this.socket!.emit('send_message', { tradeId, text }, (response: any) => {
        if (response?.success) {
          resolve(response.message);
        } else {
          resolve(null);
        }
      });
    });
  }

  sendTypingStatus(tradeId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { tradeId, isTyping });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentTradeId = null;
    }
  }

  // Event subscriptions
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  onTradeUpdate(callback: TradeUpdateCallback): () => void {
    this.tradeUpdateCallbacks.push(callback);
    return () => {
      this.tradeUpdateCallbacks = this.tradeUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentTradeId(): string | null {
    return this.currentTradeId;
  }
}

export const p2pChatService = new P2PChatService();
export default p2pChatService;
