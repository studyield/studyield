import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface LivePlayer {
  id: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  answers: number;
  correctAnswers: number;
  connected: boolean;
}

export interface PlayerAnswer {
  playerId: string;
  playerName: string;
  answerIndex: number;
  answerText: string;
  correct: boolean;
  timeRemaining: number;
  pointsEarned: number;
}

export interface LiveQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  playerAnswers: Map<string, PlayerAnswer>; // Track answers per question
}

export interface LiveRoom {
  code: string;
  hostId: string;
  studySetId: string;
  players: Map<string, LivePlayer>;
  questions: LiveQuestion[];
  currentQuestionIndex: number;
  status: 'waiting' | 'starting' | 'countdown' | 'question' | 'result' | 'finished';
  questionStartTime: number | null;
  questionTimer: NodeJS.Timeout | null;
  resultTimer: NodeJS.Timeout | null;
  createdAt: Date;
}

export interface QuestionResultData {
  questionIndex: number;
  question: string;
  correctIndex: number;
  correctAnswer: string;
  playerAnswers: PlayerAnswer[];
  leaderboard: LivePlayer[];
}

@Injectable()
export class LiveQuizService {
  private readonly logger = new Logger(LiveQuizService.name);
  private rooms = new Map<string, LiveRoom>();

  // Callback for emitting events (set by gateway)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emitCallback: ((roomCode: string, event: string, data: any) => void) | null = null;

  constructor(private readonly db: DatabaseService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEmitCallback(callback: (roomCode: string, event: string, data: any) => void) {
    this.emitCallback = callback;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(roomCode: string, event: string, data: any) {
    if (this.emitCallback) {
      this.emitCallback(roomCode, event, data);
    }
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) return this.generateRoomCode();
    return code;
  }

  createRoom(
    hostId: string,
    studySetId: string,
    questions: Omit<LiveQuestion, 'playerAnswers'>[],
  ): LiveRoom {
    const code = this.generateRoomCode();
    const room: LiveRoom = {
      code,
      hostId,
      studySetId,
      players: new Map(),
      questions: questions.map((q) => ({ ...q, playerAnswers: new Map() })),
      currentQuestionIndex: -1,
      status: 'waiting',
      questionStartTime: null,
      questionTimer: null,
      resultTimer: null,
      createdAt: new Date(),
    };
    this.rooms.set(code, room);
    this.logger.log(`Room created: ${code} by host ${hostId}`);
    return room;
  }

  getRoom(code: string): LiveRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  addPlayer(code: string, player: LivePlayer): LiveRoom | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.status !== 'waiting') return null;
    room.players.set(player.id, player);
    this.logger.log(`Player ${player.name} joined room ${code}`);
    return room;
  }

  removePlayer(code: string, playerId: string): LiveRoom | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;
    room.players.delete(playerId);
    if (room.players.size === 0 && room.hostId === playerId) {
      this.clearRoomTimers(room);
      this.rooms.delete(code.toUpperCase());
      this.logger.log(`Room ${code} deleted (empty)`);
      return null;
    }
    return room;
  }

  private clearRoomTimers(room: LiveRoom) {
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
      room.questionTimer = null;
    }
    if (room.resultTimer) {
      clearTimeout(room.resultTimer);
      room.resultTimer = null;
    }
  }

  startGame(code: string, hostId: string): LiveRoom | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.hostId !== hostId || room.status !== 'waiting') return null;
    if (room.questions.length === 0) return null;

    room.status = 'countdown';
    room.currentQuestionIndex = 0;

    // Emit countdown, then start first question after 3 seconds
    this.emit(code, 'game:countdown', { countdown: 3 });

    setTimeout(() => {
      this.startQuestion(code);
    }, 3000);

    return room;
  }

  private startQuestion(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.currentQuestionIndex >= room.questions.length) return;

    const question = room.questions[room.currentQuestionIndex];
    room.status = 'question';
    room.questionStartTime = Date.now();

    // Clear any existing answers for this question
    question.playerAnswers.clear();

    this.logger.log(
      `Starting question ${room.currentQuestionIndex + 1}/${room.questions.length} for room ${code}`,
    );

    // Emit question to all players
    this.emit(code, 'question:start', {
      index: room.currentQuestionIndex,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit,
      total: room.questions.length,
    });

    // Set timer for auto-advance
    room.questionTimer = setTimeout(() => {
      this.endQuestion(code);
    }, question.timeLimit * 1000);
  }

  private endQuestion(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.status !== 'question') return;

    this.clearRoomTimers(room);
    room.status = 'result';

    const question = room.questions[room.currentQuestionIndex];

    // Players who didn't answer get 0 points
    room.players.forEach((player, playerId) => {
      if (!question.playerAnswers.has(playerId)) {
        question.playerAnswers.set(playerId, {
          playerId,
          playerName: player.name,
          answerIndex: -1,
          answerText: '(No answer)',
          correct: false,
          timeRemaining: 0,
          pointsEarned: 0,
        });
      }
    });

    const resultData: QuestionResultData = {
      questionIndex: room.currentQuestionIndex,
      question: question.question,
      correctIndex: question.correctIndex,
      correctAnswer: question.options[question.correctIndex],
      playerAnswers: Array.from(question.playerAnswers.values()),
      leaderboard: this.getLeaderboard(code),
    };

    this.logger.log(`Question ${room.currentQuestionIndex + 1} ended for room ${code}`);
    this.emit(code, 'question:result', resultData);

    // Auto-advance to next question after 4 seconds
    room.resultTimer = setTimeout(() => {
      this.advanceToNextQuestion(code);
    }, 4000);
  }

  private advanceToNextQuestion(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return;

    room.currentQuestionIndex++;

    if (room.currentQuestionIndex >= room.questions.length) {
      // Game finished
      room.status = 'finished';
      this.logger.log(`Game finished for room ${code}`);
      this.emit(code, 'game:finished', {
        leaderboard: this.getLeaderboard(code),
        totalQuestions: room.questions.length,
      });

      // Save to database
      this.saveHistory(room).catch((err) => {
        this.logger.error(`Failed to save quiz history: ${err.message}`);
      });
      return;
    }

    // Start next question with brief countdown
    room.status = 'countdown';
    this.emit(code, 'question:next', {
      nextIndex: room.currentQuestionIndex,
      countdown: 2,
    });

    setTimeout(() => {
      this.startQuestion(code);
    }, 2000);
  }

  submitAnswer(
    code: string,
    playerId: string,
    questionIndex: number,
    answerIndex: number,
  ): { correct: boolean; score: number; room: LiveRoom } | null {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || room.status !== 'question') return null;
    if (room.currentQuestionIndex !== questionIndex) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    const question = room.questions[questionIndex];

    // Check if already answered
    if (question.playerAnswers.has(playerId)) {
      return null; // Already answered
    }

    // Calculate time remaining
    const elapsed = room.questionStartTime
      ? (Date.now() - room.questionStartTime) / 1000
      : question.timeLimit;
    const timeRemaining = Math.max(0, question.timeLimit - elapsed);

    const correct = answerIndex === question.correctIndex;
    const timeBonus = Math.round((timeRemaining / question.timeLimit) * 500);
    const points = correct ? 1000 + timeBonus : 0;

    // Update player stats
    player.answers++;
    if (correct) player.correctAnswers++;
    player.score += points;

    // Store the answer
    const playerAnswer: PlayerAnswer = {
      playerId,
      playerName: player.name,
      answerIndex,
      answerText: question.options[answerIndex] || '(Invalid)',
      correct,
      timeRemaining: Math.round(timeRemaining * 10) / 10,
      pointsEarned: points,
    };
    question.playerAnswers.set(playerId, playerAnswer);

    this.logger.log(
      `Player ${player.name} answered Q${questionIndex + 1}: ${correct ? 'correct' : 'wrong'} (+${points})`,
    );

    // Check if all players have answered
    if (question.playerAnswers.size >= room.players.size) {
      this.logger.log(`All players answered for Q${questionIndex + 1}, ending early`);
      // Clear existing timer and end question early
      if (room.questionTimer) {
        clearTimeout(room.questionTimer);
        room.questionTimer = null;
      }
      // Small delay before showing results
      setTimeout(() => this.endQuestion(code), 500);
    }

    return { correct, score: points, room };
  }

  getLeaderboard(code: string): LivePlayer[] {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return [];
    return Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ ...p, rank: index + 1 }));
  }

  getAnswerStats(
    code: string,
    questionIndex: number,
  ): { option: string; count: number; percentage: number }[] {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || questionIndex >= room.questions.length) return [];

    const question = room.questions[questionIndex];
    const totalAnswers = question.playerAnswers.size;

    return question.options.map((option, index) => {
      const count = Array.from(question.playerAnswers.values()).filter(
        (a) => a.answerIndex === index,
      ).length;
      return {
        option,
        count,
        percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
      };
    });
  }

  serializeRoom(room: LiveRoom) {
    return {
      code: room.code,
      hostId: room.hostId,
      studySetId: room.studySetId,
      players: Array.from(room.players.values()),
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      status: room.status,
    };
  }

  getGameSummary(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return null;

    return {
      code: room.code,
      studySetId: room.studySetId,
      totalQuestions: room.questions.length,
      players: Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        correctAnswers: p.correctAnswers,
        totalAnswers: p.answers,
        accuracy: p.answers > 0 ? Math.round((p.correctAnswers / p.answers) * 100) : 0,
      })),
      questions: room.questions.map((q, i) => ({
        index: i,
        question: q.question,
        correctAnswer: q.options[q.correctIndex],
        answers: Array.from(q.playerAnswers.values()),
      })),
    };
  }

  cleanupStaleRooms() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [code, room] of this.rooms) {
      if (room.createdAt < oneHourAgo) {
        this.clearRoomTimers(room);
        this.rooms.delete(code);
        this.logger.log(`Stale room cleaned up: ${code}`);
      }
    }
  }

  /**
   * Save completed game to database for history
   */
  private async saveHistory(room: LiveRoom): Promise<void> {
    try {
      // 1. Create session record
      const sessionResult = await this.db.queryOne<{ id: string }>(
        `INSERT INTO live_quiz_sessions (room_code, host_id, study_set_id, total_questions, status, started_at, finished_at)
         VALUES ($1, $2, $3, $4, 'completed', $5, NOW())
         RETURNING id`,
        [room.code, room.hostId, room.studySetId, room.questions.length, room.createdAt],
      );

      if (!sessionResult) {
        throw new Error('Failed to create session record');
      }

      const sessionId = sessionResult.id;
      const leaderboard = this.getLeaderboard(room.code);

      // 2. Create participant records
      for (let i = 0; i < leaderboard.length; i++) {
        const player = leaderboard[i];
        const participantResult = await this.db.queryOne<{ id: string }>(
          `INSERT INTO live_quiz_participants (session_id, user_id, player_name, score, correct_answers, total_answers, rank)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            sessionId,
            player.id,
            player.name,
            player.score,
            player.correctAnswers,
            player.answers,
            i + 1,
          ],
        );

        if (!participantResult) continue;

        // 3. Save individual answers for each participant
        for (let qIdx = 0; qIdx < room.questions.length; qIdx++) {
          const question = room.questions[qIdx];
          const answer = question.playerAnswers.get(player.id);

          if (answer) {
            await this.db.query(
              `INSERT INTO live_quiz_answers (session_id, participant_id, question_index, question_text, answer_text, correct_answer, is_correct, points_earned, time_taken_seconds)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                sessionId,
                participantResult.id,
                qIdx,
                question.question,
                answer.answerText,
                question.options[question.correctIndex],
                answer.correct,
                answer.pointsEarned,
                question.timeLimit - answer.timeRemaining,
              ],
            );
          }
        }
      }

      this.logger.log(
        `Quiz history saved: session ${sessionId} with ${leaderboard.length} participants`,
      );
    } catch (error) {
      this.logger.error(`Failed to save quiz history: ${error}`);
      throw error;
    }
  }

  /**
   * Get user's live quiz history
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserHistory(userId: string, limit = 20): Promise<any[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await this.db.queryMany<any>(
      `SELECT
        s.id,
        s.room_code,
        s.total_questions,
        s.finished_at,
        ss.title as study_set_title,
        p.score,
        p.correct_answers,
        p.total_answers,
        p.rank,
        (SELECT COUNT(*) FROM live_quiz_participants WHERE session_id = s.id) as player_count
       FROM live_quiz_sessions s
       JOIN live_quiz_participants p ON p.session_id = s.id AND p.user_id = $1
       LEFT JOIN study_sets ss ON ss.id = s.study_set_id
       ORDER BY s.finished_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return results.map((r) => ({
      id: r.id,
      roomCode: r.room_code,
      totalQuestions: r.total_questions,
      finishedAt: r.finished_at,
      studySetTitle: r.study_set_title,
      score: r.score,
      correctAnswers: r.correct_answers,
      totalAnswers: r.total_answers,
      rank: r.rank,
      playerCount: parseInt(r.player_count, 10),
    }));
  }
}
