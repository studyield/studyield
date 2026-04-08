import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { SubscriptionService } from '../subscription/subscription.service';

@WebSocketGateway({ namespace: 'research', cors: { origin: '*', credentials: true } })
@UseGuards(WsAuthGuard)
@UseFilters(WsExceptionFilter)
export class ResearchGateway {
  private readonly logger = new Logger(ResearchGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly subscriptionService: SubscriptionService) {}

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.sub;
    if (userId) {
      const isPro = await this.subscriptionService.isPro(userId);
      if (!isPro) {
        return {
          event: 'error',
          data: {
            message: 'This feature requires a Pro plan',
            upgrade: true,
            feature: 'deep_research',
          },
        };
      }
    }
    client.join(`research:${data.sessionId}`);
    return { event: 'subscribed', data: { sessionId: data.sessionId } };
  }

  notifyProgress(
    sessionId: string,
    progress: { stage: string; percentage: number; message: string },
  ) {
    this.server.to(`research:${sessionId}`).emit('progress', progress);
  }

  notifyComplete(sessionId: string, data: unknown) {
    this.server.to(`research:${sessionId}`).emit('complete', data);
  }
}
