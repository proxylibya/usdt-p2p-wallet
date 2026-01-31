import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MarketService } from './market.service';

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

interface AuthenticatedSocket extends Socket {
  user?: { id: string; phone: string };
}

@WebSocketGateway({
  cors: { origin: corsOrigins, credentials: true },
  namespace: '/market',
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('MarketGateway');
  private priceInterval: NodeJS.Timeout;
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private marketService: MarketService,
    private jwtService: JwtService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
    this.startPriceBroadcast();
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || 
                    client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (token) {
        try {
          const payload = this.jwtService.verify(token);
          client.user = { id: payload.sub, phone: payload.phone };
          this.logger.log(`Authenticated client connected: ${client.id} (User: ${payload.sub})`);
        } catch {
          this.logger.warn(`Client ${client.id} connected with invalid token`);
        }
      } else {
        this.logger.log(`Anonymous client connected: ${client.id}`);
      }
      
      this.connectedClients.set(client.id, client);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_prices')
  async handleSubscribePrices(client: AuthenticatedSocket, symbols: string[]) {
    client.join('prices');
    const prices = await this.marketService.getLivePrices(symbols || ['BTC', 'ETH', 'USDT']);
    client.emit('prices_update', prices);
  }

  @SubscribeMessage('unsubscribe_prices')
  handleUnsubscribePrices(client: AuthenticatedSocket) {
    client.leave('prices');
  }

  @SubscribeMessage('subscribe_alerts')
  handleSubscribeAlerts(client: AuthenticatedSocket) {
    if (!client.user) {
      throw new WsException('Authentication required');
    }
    client.join(`alerts:${client.user.id}`);
    client.emit('subscribed', { channel: 'alerts' });
  }

  private startPriceBroadcast() {
    this.priceInterval = setInterval(async () => {
      try {
        const coins = await this.marketService.getMarketCoins();
        this.server.to('prices').emit('prices_update', coins);
      } catch (error) {
        this.logger.error('Failed to broadcast prices', error);
      }
    }, 10000);
  }

  async broadcastPriceAlert(userId: string, alert: any) {
    this.server.to(`alerts:${userId}`).emit('price_alert_triggered', alert);
  }

  async broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`alerts:${userId}`).emit(event, data);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
