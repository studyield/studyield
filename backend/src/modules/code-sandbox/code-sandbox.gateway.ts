import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CodeSandboxService, ExecuteCodeDto } from './code-sandbox.service';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';

@WebSocketGateway({ namespace: 'code-sandbox', cors: { origin: '*', credentials: true } })
@UseGuards(WsAuthGuard)
@UseFilters(WsExceptionFilter)
export class CodeSandboxGateway {
  private readonly logger = new Logger(CodeSandboxGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly codeSandboxService: CodeSandboxService) {}

  @SubscribeMessage('execute')
  async handleExecute(@MessageBody() data: ExecuteCodeDto, @ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user) return { event: 'error', data: { message: 'Unauthorized' } };

    try {
      for await (const chunk of this.codeSandboxService.executeStream(user.sub, data)) {
        client.emit('execution:output', chunk);
      }
      return { event: 'execution:complete', data: {} };
    } catch (error) {
      return { event: 'error', data: { message: (error as Error).message } };
    }
  }
}
