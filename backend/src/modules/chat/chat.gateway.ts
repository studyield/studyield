import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService, SendMessageDto } from './chat.service';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3010',
      'http://localhost:5189',
    ],
    credentials: true,
  },
})
@UseGuards(WsAuthGuard)
@UseFilters(WsExceptionFilter)
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { conversationId: string }, @ConnectedSocket() client: Socket) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.debug(`Client ${client.id} joined conversation ${data.conversationId}`);
    return { event: 'joined', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() data: { conversationId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.debug(`Client ${client.id} left conversation ${data.conversationId}`);
    return { event: 'left', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { conversationId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    const dto: SendMessageDto = { content: data.content, stream: true };

    try {
      for await (const chunk of this.chatService.sendMessageStream(
        data.conversationId,
        user.sub,
        dto,
      )) {
        client.emit('message:chunk', {
          conversationId: data.conversationId,
          ...chunk,
        });
      }

      return { event: 'message:complete', data: { conversationId: data.conversationId } };
    } catch (error) {
      this.logger.error('Message handling failed', error);
      return { event: 'error', data: { message: (error as Error).message } };
    }
  }

  constructor(private readonly chatService: ChatService) {}
}
