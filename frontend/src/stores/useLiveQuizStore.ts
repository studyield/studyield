import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';

interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
  isHost: boolean;
  correctAnswers?: number;
  answers?: number;
}

interface PlayerAnswer {
  playerId: string;
  playerName: string;
  answerIndex: number;
  answerText: string;
  correct: boolean;
  pointsEarned: number;
}

interface LiveQuestion {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
  index: number;
  total: number;
}

interface QuestionResult {
  questionIndex: number;
  question: string;
  correctIndex: number;
  correctAnswer: string;
  playerAnswers: PlayerAnswer[];
  leaderboard: Player[];
}

type Phase = 'idle' | 'lobby' | 'countdown' | 'question' | 'result' | 'finished';

interface LiveQuizState {
  socket: Socket | null;
  roomCode: string | null;
  players: Player[];
  currentQuestion: LiveQuestion | null;
  questionResult: QuestionResult | null;
  phase: Phase;
  isHost: boolean;
  myAnswer: number | null; // Now stores answerIndex
  myAnswerLocked: boolean;
  timeLeft: number;
  answeredCount: number;
  finalRankings: Player[];
  error: string | null;
  countdownValue: number;

  connect: () => void;
  disconnect: () => void;
  createRoom: (studySetId: string) => void;
  joinRoom: (code: string, name?: string) => void;
  startGame: () => void;
  submitAnswer: (answerIndex: number) => void;
  leaveRoom: () => void;
  reset: () => void;
}

function mapPlayers(players: Array<{ id: string; name: string; avatarUrl?: string; score?: number; correctAnswers?: number; answers?: number }>, hostId: string): Player[] {
  if (!Array.isArray(players)) return [];
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl || undefined,
    score: p.score || 0,
    isHost: p.id === hostId,
    correctAnswers: p.correctAnswers,
    answers: p.answers,
  }));
}

export const useLiveQuizStore = create<LiveQuizState>((set, get) => {
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let roomHostId: string | null = null;

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const clearCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };

  return {
    socket: null,
    roomCode: null,
    players: [],
    currentQuestion: null,
    questionResult: null,
    phase: 'idle',
    isHost: false,
    myAnswer: null,
    myAnswerLocked: false,
    timeLeft: 0,
    answeredCount: 0,
    finalRankings: [],
    error: null,
    countdownValue: 0,

    connect: () => {
      const existing = get().socket;
      if (existing?.connected) return;

      const url = new URL(API_CONFIG.baseURL);
      const wsUrl = url.origin + '/live-quiz';
      const token = localStorage.getItem('accessToken');

      console.log('[LiveQuiz] Connecting to:', wsUrl);

      if (!token) {
        console.error('[LiveQuiz] No access token found!');
        set({ error: 'Not authenticated' });
        return;
      }

      const socket = io(wsUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      socket.on('connect', () => {
        console.log('[LiveQuiz] Socket connected:', socket.id);
        set({ socket, error: null });
      });

      socket.on('connect_error', (err) => {
        console.error('[LiveQuiz] Connection error:', err.message);
        if (!socket.connected) {
          set({ error: `Connection failed: ${err.message}` });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('[LiveQuiz] Socket disconnected:', reason);
        set({ error: reason === 'io server disconnect' ? 'Disconnected by server' : null });
      });

      // Room events
      socket.on('room:created', (room: { code: string; hostId: string; players?: Array<{ id: string; name: string; avatarUrl?: string; score?: number; correctAnswers?: number; answers?: number }> }) => {
        console.log('[LiveQuiz] room:created:', room);
        roomHostId = room.hostId;
        set({
          roomCode: room.code,
          phase: 'lobby',
          isHost: true,
          players: mapPlayers(room.players || [], room.hostId),
          error: null,
        });
      });

      socket.on('room:joined', (room: { code: string; hostId: string; players?: Array<{ id: string; name: string; avatarUrl?: string; score?: number; correctAnswers?: number; answers?: number }> }) => {
        console.log('[LiveQuiz] room:joined:', room);
        roomHostId = room.hostId;
        set({
          roomCode: room.code,
          phase: 'lobby',
          players: mapPlayers(room.players || [], room.hostId),
          error: null,
        });
      });

      socket.on('room:updated', (room: { hostId?: string; players?: Array<{ id: string; name: string; avatarUrl?: string; score?: number; correctAnswers?: number; answers?: number }> }) => {
        if (room.hostId) roomHostId = room.hostId;
        set({ players: mapPlayers(room.players || [], roomHostId || '') });
      });

      // Game countdown (3 seconds before first question)
      socket.on('game:countdown', (data: { countdown: number }) => {
        console.log('[LiveQuiz] game:countdown:', data);
        set({ phase: 'countdown', countdownValue: data.countdown });
        clearCountdown();
        let count = data.countdown;
        countdownInterval = setInterval(() => {
          count--;
          set({ countdownValue: count });
          if (count <= 0) clearCountdown();
        }, 1000);
      });

      // Question start
      socket.on('question:start', (data: { index: number; question: string; options?: string[]; timeLimit?: number; total: number }) => {
        console.log('[LiveQuiz] question:start:', data);
        clearCountdown();
        clearTimer();

        const question: LiveQuestion = {
          id: `q-${data.index}`,
          question: data.question,
          options: data.options || [],
          timeLimit: data.timeLimit || 20,
          index: data.index,
          total: data.total,
        };

        set({
          currentQuestion: question,
          questionResult: null,
          myAnswer: null,
          myAnswerLocked: false,
          answeredCount: 0,
          phase: 'question',
          timeLeft: question.timeLimit,
        });

        // Client-side timer for UI
        timerInterval = setInterval(() => {
          const current = get().timeLeft;
          if (current <= 1) {
            clearTimer();
            set({ timeLeft: 0 });
          } else {
            set({ timeLeft: current - 1 });
          }
        }, 1000);
      });

      // Answer locked confirmation
      socket.on('answer:locked', (data: { questionIndex: number; answerIndex: number; correct: boolean; score: number }) => {
        console.log('[LiveQuiz] answer:locked:', data);
        set({ myAnswerLocked: true });
      });

      // Answer count update
      socket.on('answers:update', (data: { answeredCount: number; totalPlayers: number }) => {
        set({ answeredCount: data.answeredCount });
      });

      // Question result with all player answers
      socket.on('question:result', (data: QuestionResult) => {
        console.log('[LiveQuiz] question:result:', data);
        clearTimer();
        set({
          questionResult: data,
          phase: 'result',
          players: mapPlayers(data.leaderboard || [], roomHostId || ''),
        });
      });

      // Next question countdown
      socket.on('question:next', (data: { nextIndex: number; countdown: number }) => {
        console.log('[LiveQuiz] question:next:', data);
        set({ countdownValue: data.countdown, phase: 'countdown' });
        clearCountdown();
        let count = data.countdown;
        countdownInterval = setInterval(() => {
          count--;
          set({ countdownValue: count });
          if (count <= 0) clearCountdown();
        }, 1000);
      });

      // Game finished
      socket.on('game:finished', (data: { leaderboard: Array<{ id: string; name: string; avatarUrl?: string; score?: number; correctAnswers?: number; answers?: number }>; totalQuestions: number }) => {
        console.log('[LiveQuiz] game:finished:', data);
        clearTimer();
        clearCountdown();
        const rankings = mapPlayers(data.leaderboard || [], roomHostId || '');
        set({ finalRankings: rankings, phase: 'finished' });
      });

      socket.on('error', (data: string | { message?: string }) => {
        console.error('[LiveQuiz] error:', data);
        const message = typeof data === 'string' ? data : data?.message || 'Unknown error';
        set({ error: message });
      });

      socket.on('room:left', () => {
        clearTimer();
        clearCountdown();
        roomHostId = null;
        set({ roomCode: null, phase: 'idle', players: [], isHost: false });
      });

      set({ socket });
    },

    disconnect: () => {
      clearTimer();
      clearCountdown();
      const socket = get().socket;
      if (socket) {
        socket.disconnect();
        set({ socket: null });
      }
      roomHostId = null;
    },

    createRoom: (studySetId: string) => {
      const socket = get().socket;
      console.log('[LiveQuiz] createRoom:', { connected: socket?.connected, studySetId });
      if (!socket?.connected) {
        set({ error: 'Not connected to server' });
        return;
      }
      socket.emit('create-room', { studySetId });
    },

    joinRoom: (code: string, name?: string) => {
      const socket = get().socket;
      console.log('[LiveQuiz] joinRoom:', { code, name });
      if (!socket?.connected) {
        set({ error: 'Not connected to server' });
        return;
      }
      socket.emit('join-room', { code: code.toUpperCase(), name: name || 'Player' });
    },

    startGame: () => {
      const socket = get().socket;
      const code = get().roomCode;
      if (socket && code) {
        socket.emit('start-game', { code });
      }
    },

    submitAnswer: (answerIndex: number) => {
      const socket = get().socket;
      const code = get().roomCode;
      const question = get().currentQuestion;
      const myAnswer = get().myAnswer;

      // Don't submit if already answered
      if (myAnswer !== null) return;

      if (socket && code && question) {
        socket.emit('submit-answer', {
          code,
          questionIndex: question.index,
          answerIndex,
        });
        set({ myAnswer: answerIndex });
      }
    },

    leaveRoom: () => {
      const socket = get().socket;
      const code = get().roomCode;
      if (socket && code) {
        socket.emit('leave-room', { code });
      }
      clearTimer();
      clearCountdown();
      roomHostId = null;
      set({
        roomCode: null,
        phase: 'idle',
        players: [],
        isHost: false,
        currentQuestion: null,
        myAnswer: null,
        myAnswerLocked: false,
      });
    },

    reset: () => {
      clearTimer();
      clearCountdown();
      roomHostId = null;
      set({
        roomCode: null,
        players: [],
        currentQuestion: null,
        questionResult: null,
        phase: 'idle',
        isHost: false,
        myAnswer: null,
        myAnswerLocked: false,
        timeLeft: 0,
        answeredCount: 0,
        finalRankings: [],
        error: null,
        countdownValue: 0,
      });
    },
  };
});
