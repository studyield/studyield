import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    this.logger.debug(`Auth check - token exists: ${!!token}, client: ${client.id}`);

    if (!token) {
      this.logger.warn(`No token provided for client ${client.id}`);
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      this.logger.debug(`Token verified successfully for user: ${payload.sub}`);
      client.data.user = payload;
      return true;
    } catch (error) {
      this.logger.error(
        `Token verification failed for client ${client.id}: ${(error as Error).message}`,
      );

      throw new WsException('Invalid token');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    const authHeader = client.handshake.headers?.authorization;

    this.logger.debug(
      `extractToken - auth.token: ${authToken ? 'present' : 'missing'}, authorization header: ${authHeader ? 'present' : 'missing'}`,
    );

    const auth = authToken || authHeader;
    if (!auth) return null;

    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.slice(7);
    }

    return auth as string;
  }
}
