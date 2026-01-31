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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@WebSocketGateway({
  namespace: '/p2p',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
  },
})
export class P2PGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(P2PGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`User ${userId} connected via socket ${client.id}`);
    } catch (error) {
      this.logger.warn(`Invalid token for socket ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('join_trade')
  async handleJoinTrade(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tradeId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    // Verify user is part of this trade
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id: data.tradeId },
    });

    if (!trade || (trade.buyerId !== userId && trade.sellerId !== userId)) {
      return { error: 'Trade not found or unauthorized' };
    }

    client.join(`trade:${data.tradeId}`);
    this.logger.log(`User ${userId} joined trade room ${data.tradeId}`);

    return { success: true, tradeId: data.tradeId };
  }

  @SubscribeMessage('leave_trade')
  handleLeaveTrade(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tradeId: string },
  ) {
    client.leave(`trade:${data.tradeId}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tradeId: string; text: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Unauthorized' };

    // Verify user is part of this trade
    const trade = await this.prisma.p2PTrade.findUnique({
      where: { id: data.tradeId },
    });

    if (!trade || (trade.buyerId !== userId && trade.sellerId !== userId)) {
      return { error: 'Trade not found or unauthorized' };
    }

    // Save message to database
    const message = await this.prisma.p2PMessage.create({
      data: {
        tradeId: data.tradeId,
        senderId: userId,
        text: data.text,
      },
    });

    // Get sender info
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true },
    });

    const messageData = {
      id: message.id,
      tradeId: data.tradeId,
      senderId: userId,
      sender,
      text: data.text,
      createdAt: message.createdAt,
    };

    // Broadcast to trade room
    this.server.to(`trade:${data.tradeId}`).emit('new_message', messageData);

    return { success: true, message: messageData };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tradeId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    client.to(`trade:${data.tradeId}`).emit('user_typing', {
      tradeId: data.tradeId,
      userId,
      isTyping: data.isTyping,
    });
  }

  // Server-side methods to emit events
  emitTradeUpdate(tradeId: string, trade: any) {
    this.server.to(`trade:${tradeId}`).emit('trade_updated', trade);
  }

  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  notifyTradeParties(trade: any, event: string, data: any) {
    this.emitToUser(trade.buyerId, event, data);
    this.emitToUser(trade.sellerId, event, data);
  }
}
