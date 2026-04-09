import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS, API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { io, Socket } from 'socket.io-client';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Play,
  Trophy,
  Medal,
  Crown,
  Timer,
  Loader2,
  AlertCircle,
  Gamepad2,
  CheckCircle,
  XCircle,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';

interface Participant {
  userId: string;
  nickname: string;
  score: number;
  correctCount: number;
  finished: boolean;
}

interface Question {
  id: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  difficulty: string;
  topic: string;
}

interface ChatMessage {
  userId: string;
  nickname: string;
  message: string;
  timestamp: Date;
}

type SessionPhase = 'idle' | 'joining' | 'lobby' | 'playing' | 'result' | 'finished';

export default function CollaborativeExamPage() {
  const { id: examCloneId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const joinCode = searchParams.get('code');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [sessionCode, setSessionCode] = useState<string | null>(joinCode);
  const [, setSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState(user?.name || '');

  // Game state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Connect to socket
  useEffect(() => {
    const url = new URL(API_CONFIG.baseURL);
    const wsUrl = url.origin + '/exam-clone';
    const token = localStorage.getItem('accessToken');

    console.log('[ExamClone] Connecting to:', wsUrl);

    if (!token) {
      setError('Not authenticated');
      return;
    }

    const newSocket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to exam-clone socket');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to server');
    });

    // Session events
    newSocket.on('session-created', ({ sessionId, code }) => {
      setSessionId(sessionId);
      setSessionCode(code);
      setIsHost(true);
      setPhase('lobby');
    });

    newSocket.on('joined-session', ({ sessionId, status, hostId }) => {
      setSessionId(sessionId);
      setIsHost(hostId === user?.id);
      setPhase(status === 'in_progress' ? 'playing' : 'lobby');
    });

    newSocket.on('participant-joined', ({ userId, nickname: name }) => {
      setParticipants((prev) => [
        ...prev.filter((p) => p.userId !== userId),
        { userId, nickname: name, score: 0, correctCount: 0, finished: false },
      ]);
    });

    newSocket.on('participant-left', ({ userId }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    });

    newSocket.on('leaderboard-update', ({ leaderboard }) => {
      setParticipants(leaderboard);
    });

    newSocket.on('session-started', ({ questionIds }) => {
      setPhase('playing');
      setCurrentQuestionIndex(0);
      setTimeLeft(30);
      // eslint-disable-next-line react-hooks/immutability
      fetchQuestions(questionIds);
    });

    newSocket.on('participant-finished', ({ userId, score, correctCount }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === userId ? { ...p, score, correctCount, finished: true } : p
        )
      );
    });

    newSocket.on('session-ended', ({ finalLeaderboard }) => {
      setParticipants(finalLeaderboard);
      setPhase('finished');
    });

    newSocket.on('chat-message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Auto-join if code is provided
  useEffect(() => {
    if (socket?.connected && joinCode && phase === 'idle') {
      handleJoinSession();
    }
  }, [socket?.connected, joinCode, phase]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'playing' || showResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit
          handleSubmitAnswer();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentQuestionIndex, showResult]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchQuestions = async (questionIds: string[]) => {
    try {
      const { data } = await api.get(ENDPOINTS.examClone.questions(examCloneId!));
      const filteredQuestions = data.filter((q: Question) => questionIds.includes(q.id));
      setQuestions(filteredQuestions);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const handleCreateSession = async () => {
    if (!socket || !examCloneId) return;
    setPhase('joining');
    setError(null);
    socket.emit('create-session', {
      examCloneId,
      name: `${nickname}'s Session`,
      nickname,
      settings: { timePerQuestion: 30 },
    });
  };

  const handleJoinSession = useCallback(() => {
    if (!socket || !sessionCode) return;
    setPhase('joining');
    setError(null);
    socket.emit('join-session', {
      code: sessionCode.toUpperCase(),
      nickname: nickname || user?.name || 'Player',
    });
  }, [socket, sessionCode, nickname, user?.name]);

  const handleStartSession = async () => {
    if (!socket || !sessionCode || !examCloneId) return;

    try {
      const { data } = await api.get(ENDPOINTS.examClone.questions(examCloneId));
      const questionIds = data.slice(0, 10).map((q: Question) => q.id);
      setQuestions(data.slice(0, 10));

      socket.emit('start-session', { code: sessionCode, questionIds });
    } catch {
      setError('Failed to load questions');
    }
  };

  const handleSubmitAnswer = () => {
    if (!socket || !sessionCode || !currentQuestion) return;

    let userAnswer = '';
    let isCorrect = false;

    // Handle different question types
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      // MCQ with options
      userAnswer = selectedAnswer !== null ? currentQuestion.options[selectedAnswer] : '';
      isCorrect = userAnswer === currentQuestion.correctAnswer;
    } else {
      // Text answer (fill in blank, short answer, true/false without options)
      userAnswer = textAnswer.trim();
      // Case-insensitive comparison for text answers
      isCorrect = userAnswer.toLowerCase() === currentQuestion.correctAnswer?.toLowerCase();
    }

    setLastAnswerCorrect(isCorrect);
    setShowResult(true);

    socket.emit('submit-answer', {
      code: sessionCode,
      questionId: currentQuestion.id,
      answer: userAnswer,
      isCorrect,
      timeSpent: 30 - timeLeft,
    });

    if (isCorrect) {
      const speedBonus = Math.max(50, 100 - (30 - timeLeft));
      setMyScore((prev) => prev + speedBonus);
    }

    // Move to next question after delay
    setTimeout(() => {
      setShowResult(false);
      setTextAnswer('');
      setSelectedAnswer(null);

      if (currentQuestionIndex + 1 >= questions.length) {
        // Finished all questions
        socket.emit('finish-session', { code: sessionCode });
        setPhase('finished');
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimeLeft(30);
      }
    }, 2000);
  };

  const handleEndSession = () => {
    if (!socket || !sessionCode) return;
    socket.emit('end-session', { code: sessionCode });
  };

  const handleSendChat = () => {
    if (!socket || !sessionCode || !chatInput.trim()) return;
    socket.emit('chat-message', { code: sessionCode, message: chatInput.trim() });
    setChatInput('');
  };

  const copyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const timePercent = (timeLeft / 30) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-4">
        {/* Header */}
        {phase !== 'playing' && (
          <button
            onClick={() => navigate(`/dashboard/exam-clone/${examCloneId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('collaborativeExam.backToExam')}</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* Idle - Join or Create */}
          {(phase === 'idle' || phase === 'joining') && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-8 h-8 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold">{t('collaborativeExam.liveExamSession')}</h2>
              <p className="text-sm text-muted-foreground">
                {phase === 'joining' ? t('collaborativeExam.connecting') : t('collaborativeExam.competeRealTime')}
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-left">{t('collaborativeExam.yourName')}</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('collaborativeExam.enterNickname')}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {joinCode ? (
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  onClick={handleJoinSession}
                  disabled={phase === 'joining' || !nickname.trim()}
                >
                  {phase === 'joining' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Users className="w-5 h-5 mr-2" />
                  )}
                  {t('collaborativeExam.joinSession')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600 h-14 text-base"
                    onClick={handleCreateSession}
                    disabled={phase === 'joining' || !nickname.trim()}
                  >
                    {phase === 'joining' ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    {t('collaborativeExam.createSession')}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">{t('collaborativeExam.or')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-left">
                      {t('collaborativeExam.joinWithCode')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sessionCode || ''}
                        onChange={(e) => setSessionCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ABCDEF"
                        maxLength={6}
                        className="flex-1 text-center text-lg font-mono tracking-[0.3em] px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                      <Button
                        onClick={handleJoinSession}
                        disabled={!sessionCode || sessionCode.length !== 6 || !nickname.trim()}
                      >
                        {t('collaborativeExam.join')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Lobby */}
          {phase === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('collaborativeExam.waitingRoom')}</h2>
                <p className="text-sm text-muted-foreground">{t('collaborativeExam.shareCodeInvite')}</p>
              </div>

              {/* Room code */}
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">{t('collaborativeExam.sessionCode')}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-mono font-bold tracking-[0.3em] text-purple-500">
                    {sessionCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Participants */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('collaborativeExam.players', { count: participants.length })}</span>
                </div>
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-sm font-bold text-purple-500">
                        {p.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium flex-1">{p.nickname}</span>
                      {p.userId === user?.id && isHost && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      {t('collaborativeExam.waitingForPlayers')}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/dashboard/exam-clone/${examCloneId}`)}
                >
                  {t('collaborativeExam.leave')}
                </Button>
                {isHost && (
                  <Button
                    className="flex-1 bg-purple-500 hover:bg-purple-600"
                    onClick={handleStartSession}
                    disabled={participants.length < 1}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('collaborativeExam.startExam')}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Playing */}
          {phase === 'playing' && currentQuestion && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Q{currentQuestionIndex + 1}/{questions.length}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-purple-500">{t('collaborativeExam.score', { score: myScore })}</span>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors relative"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>

                <motion.div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full',
                    timeLeft <= 5 ? 'bg-red-500/10 text-red-500' : 'bg-muted'
                  )}
                  animate={timeLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Timer className="w-4 h-4" />
                  <span className="text-lg font-mono font-bold">{timeLeft}</span>
                </motion.div>
              </div>

              {/* Timer bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full transition-colors',
                    timeLeft <= 5
                      ? 'bg-red-500'
                      : timeLeft <= 10
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                  )}
                  animate={{ width: `${timePercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="text-lg font-semibold">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const showCorrectAnswer = showResult && isCorrect;
                    const showWrongAnswer = showResult && isSelected && !isCorrect;
                    const colors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];

                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => !showResult && setSelectedAnswer(i)}
                        disabled={showResult}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                        className={cn(
                          'p-4 rounded-xl text-left font-medium transition-all border-2 min-h-[80px]',
                          showCorrectAnswer
                            ? 'border-green-500 bg-green-500/10'
                            : showWrongAnswer
                            ? 'border-red-500 bg-red-500/10'
                            : isSelected
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-transparent hover:border-white/20',
                          !showResult && !isSelected && colors[i % colors.length] + '/10'
                        )}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0',
                              showCorrectAnswer
                                ? 'bg-green-500'
                                : showWrongAnswer
                                ? 'bg-red-500'
                                : colors[i % colors.length]
                            )}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm pt-1">{option}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Check if it's a True/False question */}
                  {currentQuestion.question.toLowerCase().includes('true or false') ||
                   currentQuestion.question.toLowerCase().includes('true/false') ||
                   currentQuestion.correctAnswer?.toLowerCase() === 'true' ||
                   currentQuestion.correctAnswer?.toLowerCase() === 'false' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => !showResult && setTextAnswer('True')}
                        disabled={showResult}
                        className={cn(
                          'p-6 rounded-xl font-bold text-lg transition-all border-2',
                          showResult && currentQuestion.correctAnswer?.toLowerCase() === 'true'
                            ? 'border-green-500 bg-green-500/20'
                            : showResult && textAnswer === 'True'
                            ? 'border-red-500 bg-red-500/20'
                            : textAnswer === 'True'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-border hover:border-green-500/50 hover:bg-green-500/5'
                        )}
                      >
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        True
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => !showResult && setTextAnswer('False')}
                        disabled={showResult}
                        className={cn(
                          'p-6 rounded-xl font-bold text-lg transition-all border-2',
                          showResult && currentQuestion.correctAnswer?.toLowerCase() === 'false'
                            ? 'border-green-500 bg-green-500/20'
                            : showResult && textAnswer === 'False'
                            ? 'border-red-500 bg-red-500/20'
                            : textAnswer === 'False'
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border hover:border-red-500/50 hover:bg-red-500/5'
                        )}
                      >
                        <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                        False
                      </motion.button>
                    </div>
                  ) : (
                    /* Text input for fill-in-blank or short answer */
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('collaborativeExam.typeYourAnswer')}
                      </label>
                      <input
                        type="text"
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={showResult}
                        placeholder={t('collaborativeExam.enterYourAnswer')}
                        className={cn(
                          'w-full px-4 py-3 bg-background border-2 rounded-xl text-lg focus:outline-none transition-colors',
                          showResult && lastAnswerCorrect
                            ? 'border-green-500 bg-green-500/10'
                            : showResult
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border focus:border-purple-500'
                        )}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && textAnswer.trim() && !showResult) {
                            handleSubmitAnswer();
                          }
                        }}
                      />
                      {showResult && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">{t('collaborativeExam.correctAnswerIs')} </span>
                          <span className="font-medium text-green-500">{currentQuestion.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit button */}
              {!showResult && (
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  onClick={handleSubmitAnswer}
                  disabled={
                    currentQuestion.options && currentQuestion.options.length > 0
                      ? selectedAnswer === null
                      : !textAnswer.trim()
                  }
                >
                  {t('collaborativeExam.submitAnswer')}
                </Button>
              )}

              {/* Result overlay */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'flex items-center justify-center gap-3 p-4 rounded-xl',
                    lastAnswerCorrect
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  )}
                >
                  {lastAnswerCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {t('collaborativeExam.correct')}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {t('collaborativeExam.incorrectAnswer')}
                      </span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Leaderboard sidebar */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm font-medium mb-3">{t('collaborativeExam.liveLeaderboard')}</p>
                <div className="space-y-1">
                  {participants
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((p, i) => (
                      <div
                        key={p.userId}
                        className={cn(
                          'flex items-center gap-2 text-sm p-2 rounded-lg',
                          p.userId === user?.id && 'bg-purple-500/10'
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                            i === 0
                              ? 'bg-amber-500 text-white'
                              : i === 1
                              ? 'bg-gray-400 text-white'
                              : i === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-muted'
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate">{p.nickname}</span>
                        <span className="font-bold text-purple-500">{p.score}</span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Finished */}
          {phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto"
              >
                <Trophy className="w-10 h-10 text-amber-500" />
              </motion.div>

              <h2 className="text-2xl font-bold">{t('collaborativeExam.sessionComplete')}</h2>
              <p className="text-muted-foreground">{t('collaborativeExam.finalResults')}</p>

              {/* Podium */}
              {participants.length >= 3 && (
                <div className="flex items-end justify-center gap-4 h-40 mb-4">
                  {/* 2nd place */}
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-400/10 flex items-center justify-center text-lg font-bold text-gray-500 mb-2">
                      {participants[1]?.nickname.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium truncate max-w-[80px]">
                      {participants[1]?.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">{participants[1]?.score} pts</p>
                    <div className="w-16 h-20 bg-gray-400/20 rounded-t-lg mt-2 flex items-center justify-center">
                      <Medal className="w-6 h-6 text-gray-400" />
                    </div>
                  </motion.div>

                  {/* 1st place */}
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-xl font-bold text-amber-500 mb-2">
                      {participants[0]?.nickname.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold truncate max-w-[80px]">
                      {participants[0]?.nickname}
                    </p>
                    <p className="text-xs text-amber-500 font-medium">
                      {participants[0]?.score} pts
                    </p>
                    <div className="w-16 h-28 bg-amber-500/20 rounded-t-lg mt-2 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-amber-500" />
                    </div>
                  </motion.div>

                  {/* 3rd place */}
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-700/10 flex items-center justify-center text-lg font-bold text-amber-700 mb-2">
                      {participants[2]?.nickname.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium truncate max-w-[80px]">
                      {participants[2]?.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">{participants[2]?.score} pts</p>
                    <div className="w-16 h-16 bg-amber-700/20 rounded-t-lg mt-2 flex items-center justify-center">
                      <Medal className="w-6 h-6 text-amber-700" />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Full rankings */}
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border',
                      i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card border-border',
                      p.userId === user?.id && 'ring-2 ring-purple-500'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        i === 0
                          ? 'bg-amber-500/10'
                          : i === 1
                          ? 'bg-gray-400/10'
                          : i === 2
                          ? 'bg-amber-700/10'
                          : 'bg-muted'
                      )}
                    >
                      {i === 0 ? (
                        <Crown className="w-5 h-5 text-amber-500" />
                      ) : i < 3 ? (
                        <Medal
                          className={cn(
                            'w-5 h-5',
                            i === 1 ? 'text-gray-400' : 'text-amber-700'
                          )}
                        />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{p.nickname}</span>
                      <p className="text-xs text-muted-foreground">
                        {t('collaborativeExam.correctCount', { count: p.correctCount })}
                      </p>
                    </div>
                    <span className="font-bold text-purple-500">{p.score} pts</span>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/dashboard/exam-clone/${examCloneId}`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('collaborativeExam.backToExam')}
                </Button>
                {isHost && (
                  <Button
                    className="flex-1 bg-purple-500 hover:bg-purple-600"
                    onClick={handleEndSession}
                  >
                    {t('collaborativeExam.endSession')}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat panel */}
        {showChat && (phase === 'lobby' || phase === 'playing') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 bottom-4 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-medium">{t('collaborativeExam.chat')}</span>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div ref={chatRef} className="h-60 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-sm',
                    msg.userId === user?.id ? 'text-right' : 'text-left'
                  )}
                >
                  <span className="text-xs text-muted-foreground">{msg.nickname}</span>
                  <div
                    className={cn(
                      'inline-block px-3 py-1.5 rounded-lg max-w-[80%]',
                      msg.userId === user?.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-muted'
                    )}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={t('collaborativeExam.typeMessage')}
                  className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none"
                />
                <Button size="sm" onClick={handleSendChat}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
