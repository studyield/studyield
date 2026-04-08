import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../guards/ws-auth.guard';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

@UseGuards(WsAuthGuard)
@UseFilters(WsExceptionFilter)
export abstract class BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  protected abstract readonly logger: Logger;

  @WebSocketServer()
  protected server: Server;

  afterInit(_server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.sub;
    this.logger.log(`Client connected: ${client.id} (user: ${userId || 'unauthenticated'})`);

    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId || 'unauthenticated'})`);
  }

  protected emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  protected emitToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  protected broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  protected joinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room: ${room}`);
  }

  protected leaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.debug(`Client ${client.id} left room: ${room}`);
  }

  protected getUserFromSocket(client: Socket): { sub: string; email: string; role: string } | null {
    return client.data.user || null;
  }
}
