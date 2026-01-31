import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AdminClient {
  id: string;
  adminId: string;
  adminName: string;
  connectedAt: Date;
}

@WebSocketGateway({
  namespace: '/admin/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);
  private connectedAdmins: Map<string, AdminClient> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const adminClient: AdminClient = {
        id: client.id,
        adminId: payload.sub,
        adminName: payload.name || 'Admin',
        connectedAt: new Date(),
      };

      this.connectedAdmins.set(client.id, adminClient);
      this.logger.log(`Admin connected: ${adminClient.adminName} (${client.id})`);

      // Send initial connection success
      client.emit('connected', { status: 'ok', adminId: payload.sub });

      // Broadcast admin count update
      this.broadcastAdminCount();
    } catch (error) {
      this.logger.error('Connection failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const admin = this.connectedAdmins.get(client.id);
    if (admin) {
      this.logger.log(`Admin disconnected: ${admin.adminName} (${client.id})`);
      this.connectedAdmins.delete(client.id);
      this.broadcastAdminCount();
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channels: string[] },
  ) {
    if (data.channels && Array.isArray(data.channels)) {
      data.channels.forEach((channel) => {
        client.join(channel);
      });
      client.emit('subscribed', { channels: data.channels });
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channels: string[] },
  ) {
    if (data.channels && Array.isArray(data.channels)) {
      data.channels.forEach((channel) => {
        client.leave(channel);
      });
    }
  }

  // Broadcast methods for different event types

  broadcastUserEvent(type: string, data: any) {
    this.server.emit(`user:${type}`, {
      type: `user:${type}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastTransactionEvent(type: string, data: any) {
    this.server.emit(`transaction:${type}`, {
      type: `transaction:${type}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastTradeEvent(type: string, data: any) {
    this.server.emit(`trade:${type}`, {
      type: `trade:${type}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastDisputeEvent(type: string, data: any) {
    this.server.emit(`dispute:${type}`, {
      type: `dispute:${type}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastSecurityAlert(data: any) {
    this.server.emit('alert:security', {
      type: 'alert:security',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastSystemAlert(data: any) {
    this.server.emit('alert:system', {
      type: 'alert:system',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastStatsUpdate(data: any) {
    this.server.emit('stats:updated', {
      type: 'stats:updated',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  private broadcastAdminCount() {
    this.server.emit('admins:count', {
      count: this.connectedAdmins.size,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedAdmins(): AdminClient[] {
    return Array.from(this.connectedAdmins.values());
  }

  getConnectedAdminsCount(): number {
    return this.connectedAdmins.size;
  }
}
