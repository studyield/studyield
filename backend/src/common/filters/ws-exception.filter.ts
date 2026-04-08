import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient();
    const error = exception.getError();

    const errorResponse = {
      event: 'error',
      data: {
        message: typeof error === 'string' ? error : (error as { message: string }).message,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.warn(`WebSocket error for client ${client.id}: ${errorResponse.data.message}`);
    client.emit('error', errorResponse.data);
  }
}
