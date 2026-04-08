import { Logger, OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from '../../common/gateways/base.gateway';
import { LiveQuizService, LiveQuestion } from './live-quiz.service';
import { QuizService } from './quiz.service';
import { SubscriptionService } from '../subscription/subscription.service';

@WebSocketGateway({
  namespace: 'live-quiz',
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3010',
      'http://localhost:5189',
    ],
    credentials: true,
  },
})
export class LiveQuizGateway extends BaseGateway implements OnModuleInit {
  protected readonly logger = new Logger(LiveQuizGateway.name);

  constructor(
    private readonly liveQuizService: LiveQuizService,
    private readonly quizService: QuizService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    super();
  }

  onModuleInit() {
    // Set up emit callback so service can emit events
    this.liveQuizService.setEmitCallback((roomCode, event, data) => {
      this.emitToRoom(`live-quiz:${roomCode}`, event, data);
    });
  }

  handleDisconnect(client: Socket) {
    super.handleDisconnect(client);
    const roomCode = client.data.roomCode as string;
    const user = this.getUserFromSocket(client);
    if (roomCode && user) {
      this.liveQuizService.removePlayer(roomCode, user.sub);
      const room = this.liveQuizService.getRoom(roomCode);
      if (room) {
        this.emitToRoom(
          `live-quiz:${roomCode}`,
          'room:updated',
          this.liveQuizService.serializeRoom(room),
        );
      }
    }
  }

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @MessageBody() data: { studySetId: string; questionCount?: number; timePerQuestion?: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`create-room received from ${client.id}, data: ${JSON.stringify(data)}`);
    const user = this.getUserFromSocket(client);
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const isPro = await this.subscriptionService.isPro(user.sub);
    if (!isPro) {
      client.emit('error', {
        message: 'This feature requires a Pro plan',
        upgrade: true,
        feature: 'live_quiz',
      });
      return;
    }

    try {
      // Generate quiz questions from study set
      const quiz = await this.quizService.generate(user.sub, {
        studySetId: data.studySetId,
        title: 'Live Quiz',
        questionCount: data.questionCount || 10,
        questionTypes: ['multiple_choice'],
        difficulty: 'mixed',
      });

      const quizQuestions = await this.quizService.getQuestions(quiz.id);
      const timeLimit = data.timePerQuestion || 20;

      const questions: Omit<LiveQuestion, 'playerAnswers'>[] = quizQuestions.map((q, i) => ({
        id: `q-${i}`,
        question: q.question,
        options: q.options || [],
        correctIndex: (q.options || []).indexOf(q.correctAnswer),
        timeLimit,
      }));

      const room = this.liveQuizService.createRoom(user.sub, data.studySetId, questions);

      // Add host as player
      this.liveQuizService.addPlayer(room.code, {
        id: user.sub,
        name: user.email.split('@')[0],
        avatarUrl: null,
        score: 0,
        answers: 0,
        correctAnswers: 0,
        connected: true,
      });

      client.data.roomCode = room.code;
      this.joinRoom(client, `live-quiz:${room.code}`);

      const serializedRoom = this.liveQuizService.serializeRoom(room);
      this.logger.log(`Room created: ${room.code}, emitting to client`);
      client.emit('room:created', serializedRoom);
    } catch (error) {
      this.logger.error(`Failed to create room: ${error}`);
      client.emit('error', { message: 'Failed to create quiz room' });
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { code: string; name: string; avatarUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUserFromSocket(client);
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const room = this.liveQuizService.addPlayer(data.code, {
      id: user.sub,
      name: data.name || user.email.split('@')[0],
      avatarUrl: data.avatarUrl || null,
      score: 0,
      answers: 0,
      correctAnswers: 0,
      connected: true,
    });

    if (!room) {
      client.emit('error', { message: 'Room not found or game already started' });
      return;
    }

    client.data.roomCode = room.code;
    this.joinRoom(client, `live-quiz:${room.code}`);

    const serializedRoom = this.liveQuizService.serializeRoom(room);
    client.emit('room:joined', serializedRoom);
    this.emitToRoom(`live-quiz:${room.code}`, 'room:updated', serializedRoom);
  }

  @SubscribeMessage('start-game')
  handleStartGame(@MessageBody() data: { code: string }, @ConnectedSocket() client: Socket) {
    const user = this.getUserFromSocket(client);
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const room = this.liveQuizService.startGame(data.code, user.sub);
    if (!room) {
      client.emit('error', { message: 'Cannot start game. You must be the host.' });
      return;
    }

    this.logger.log(`Game started for room ${data.code}`);
    // The service handles emitting countdown and starting questions
  }

  @SubscribeMessage('submit-answer')
  handleSubmitAnswer(
    @MessageBody() data: { code: string; questionIndex: number; answerIndex: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.getUserFromSocket(client);
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const result = this.liveQuizService.submitAnswer(
      data.code,
      user.sub,
      data.questionIndex,
      data.answerIndex,
    );

    if (!result) {
      client.emit('error', { message: 'Cannot submit answer' });
      return;
    }

    // Emit to player privately that their answer was locked
    client.emit('answer:locked', {
      questionIndex: data.questionIndex,
      answerIndex: data.answerIndex,
      correct: result.correct,
      score: result.score,
    });

    // Emit updated player count who answered
    const room = result.room;
    const question = room.questions[data.questionIndex];
    this.emitToRoom(`live-quiz:${data.code}`, 'answers:update', {
      answeredCount: question.playerAnswers.size,
      totalPlayers: room.players.size,
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@MessageBody() data: { code: string }, @ConnectedSocket() client: Socket) {
    const user = this.getUserFromSocket(client);
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.liveQuizService.removePlayer(data.code, user.sub);
    this.leaveRoom(client, `live-quiz:${data.code}`);
    client.data.roomCode = null;

    const room = this.liveQuizService.getRoom(data.code);
    if (room) {
      this.emitToRoom(
        `live-quiz:${data.code}`,
        'room:updated',
        this.liveQuizService.serializeRoom(room),
      );
    }

    client.emit('room:left', {});
  }

  @SubscribeMessage('get-summary')
  handleGetSummary(@MessageBody() data: { code: string }, @ConnectedSocket() client: Socket) {
    const summary = this.liveQuizService.getGameSummary(data.code);
    if (!summary) {
      client.emit('error', { message: 'Game not found' });
      return;
    }
    client.emit('game:summary', summary);
  }
}
