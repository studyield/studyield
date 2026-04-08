import { Logger, UseGuards, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProblemSolverService, SolveProblemDto } from './problem-solver.service';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { SubscriptionService } from '../subscription/subscription.service';

@WebSocketGateway({
  namespace: 'problem-solver',
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
export class ProblemSolverGateway {
  private readonly logger = new Logger(ProblemSolverGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly problemSolverService: ProblemSolverService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @SubscribeMessage('solve')
  async handleSolve(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    const isPro = await this.subscriptionService.isPro(user.sub);
    if (!isPro) {
      return {
        event: 'error',
        data: {
          message: 'This feature requires a Pro plan',
          upgrade: true,
          feature: 'problem_solver',
        },
      };
    }

    try {
      for await (const event of this.problemSolverService.solveStream(data.sessionId, user.sub)) {
        client.emit('solve:progress', {
          sessionId: data.sessionId,
          ...event,
        });
      }

      return { event: 'solve:complete', data: { sessionId: data.sessionId } };
    } catch (error) {
      this.logger.error('Problem solving failed', error);
      return { event: 'error', data: { message: (error as Error).message } };
    }
  }

  @SubscribeMessage('create-and-solve')
  async handleCreateAndSolve(
    @MessageBody() data: SolveProblemDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    if (!user) {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    const isPro = await this.subscriptionService.isPro(user.sub);
    if (!isPro) {
      return {
        event: 'error',
        data: {
          message: 'This feature requires a Pro plan',
          upgrade: true,
          feature: 'problem_solver',
        },
      };
    }

    try {
      const session = await this.problemSolverService.create(user.sub, data);
      client.emit('session:created', { session });

      for await (const event of this.problemSolverService.solveStream(session.id, user.sub)) {
        client.emit('solve:progress', {
          sessionId: session.id,
          ...event,
        });
      }

      return { event: 'solve:complete', data: { sessionId: session.id } };
    } catch (error) {
      this.logger.error('Problem solving failed', error);
      return { event: 'error', data: { message: (error as Error).message } };
    }
  }
}
