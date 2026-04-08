import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from './base.gateway';

@WebSocketGateway({
  namespace: 'app',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3010',
      'http://localhost:5189',
    ],
    credentials: true,
  },
})
export class AppGateway extends BaseGateway {
  protected readonly logger = new Logger(AppGateway.name);

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() _client: Socket): { event: string; data: string } {
    return { event: 'pong', data: 'pong' };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ): { event: string; data: { subscribed: string } } {
    const user = this.getUserFromSocket(client);
    if (!user) {
      return { event: 'error', data: { subscribed: '' } };
    }

    const allowedPrefixes = ['study-set:', 'conversation:', 'quiz:'];
    const isAllowed = allowedPrefixes.some((prefix) => data.channel.startsWith(prefix));

    if (!isAllowed) {
      return { event: 'error', data: { subscribed: '' } };
    }

    this.joinRoom(client, data.channel);
    return { event: 'subscribed', data: { subscribed: data.channel } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ): { event: string; data: { unsubscribed: string } } {
    this.leaveRoom(client, data.channel);
    return { event: 'unsubscribed', data: { unsubscribed: data.channel } };
  }

  notifyUser(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      id?: string;
      link?: string | null;
      createdAt?: string;
    },
  ) {
    this.emitToUser(userId, 'notification', notification);
  }

  notifyChannel(channel: string, event: string, data: unknown) {
    this.emitToRoom(channel, event, data);
  }
}
