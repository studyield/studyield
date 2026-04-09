import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useLiveQuizStore } from '@/stores/useLiveQuizStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Timer,
  Loader2,
  AlertCircle,
  Gamepad2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

function LobbyPhase() {
  const { t } = useTranslation();
  const { roomCode, players, isHost, startGame, leaveRoom, error } = useLiveQuizStore();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('liveQuiz.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('liveQuiz.shareCode')}</p>
      </motion.div>

      {/* Room code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <p className="text-xs text-muted-foreground mb-2">{t('liveQuiz.roomCode')}</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-mono font-bold tracking-[0.3em] text-green-500">
            {roomCode}
          </span>
          <button onClick={copyCode} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
          </button>
        </div>
      </motion.div>

      {/* Players list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('liveQuiz.playersCount', { count: players.length })}</span>
        </div>
        <div className="space-y-2">
          {players.map((player) => (
            <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm font-bold text-green-500">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium flex-1">{player.name}</span>
              {player.isHost && <Crown className="w-4 h-4 text-amber-500" />}
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-xs text-muted-foreground py-4">{t('liveQuiz.waitingForPlayers')}</p>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={leaveRoom}>
          {t('liveQuiz.leave')}
        </Button>
        {isHost && (
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600"
            onClick={startGame}
            disabled={players.length < 1}
          >
            <Play className="w-4 h-4 mr-2" />
            {t('liveQuiz.startGame')}
          </Button>
        )}
      </div>
    </div>
  );
}

function CountdownPhase() {
  const { t } = useTranslation();
  const { countdownValue } = useLiveQuizStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <motion.div
        className="w-32 h-32 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center mb-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <motion.span
          key={countdownValue}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold text-green-500"
        >
          {countdownValue > 0 ? countdownValue : ''}
        </motion.span>
      </motion.div>
      <motion.p className="text-xl font-semibold text-muted-foreground">
        {countdownValue > 0 ? t('liveQuiz.getReady') : t('liveQuiz.go')}
      </motion.p>
    </motion.div>
  );
}

function QuestionPhase() {
  const { t } = useTranslation();
  const { currentQuestion, myAnswer, myAnswerLocked, timeLeft, submitAnswer, players, answeredCount } = useLiveQuizStore();

  if (!currentQuestion) return null;

  const timePercent = currentQuestion.timeLimit > 0 ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-green-500'];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Q{currentQuestion.index + 1}/{currentQuestion.total}
        </span>

        {/* Answered count */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{t('liveQuiz.answered', { answered: answeredCount, total: players.length })}</span>
        </div>

        {/* Timer */}
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
            timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-green-500'
          )}
          animate={{ width: `${timePercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 text-center"
      >
        <p className="text-lg font-semibold">{currentQuestion.question}</p>
      </motion.div>

      {/* Options - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option, i) => {
          const isSelected = myAnswer === i;
          const isDisabled = myAnswer !== null;

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !isDisabled && submitAnswer(i)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={cn(
                'p-4 rounded-xl text-left font-medium transition-all border-2 min-h-[80px]',
                isSelected
                  ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                  : isDisabled
                  ? 'border-border opacity-50 cursor-not-allowed'
                  : 'border-transparent hover:border-white/20',
                !isDisabled && colors[i % colors.length] + '/10',
                !isSelected && !isDisabled && 'hover:' + colors[i % colors.length] + '/20'
              )}
            >
              <span className="flex items-start gap-3">
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0',
                  colors[i % colors.length]
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm pt-1">{option}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Locked status */}
      {myAnswerLocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
        >
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {t('liveQuiz.answerLocked')}
          </span>
        </motion.div>
      )}
    </div>
  );
}

function ResultPhase() {
  const { t } = useTranslation();
  const { questionResult, currentQuestion, myAnswer, players } = useLiveQuizStore();

  if (!questionResult || !currentQuestion) return null;

  const myAnswerCorrect = myAnswer === questionResult.correctIndex;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Result header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-center"
      >
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
          myAnswerCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
        )}>
          {myAnswerCorrect ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <XCircle className="w-10 h-10 text-red-500" />
          )}
        </div>
        <h3 className="text-xl font-bold">{myAnswerCorrect ? t('liveQuiz.correct') : t('liveQuiz.incorrect')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {myAnswer !== null
            ? t('liveQuiz.youPicked', { answer: currentQuestion.options[myAnswer] })
            : t('liveQuiz.didNotAnswer')}
        </p>
      </motion.div>

      {/* Correct answer */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">{t('liveQuiz.correctAnswer')}</p>
        <p className="font-semibold text-green-600 dark:text-green-400">{questionResult.correctAnswer}</p>
      </div>

      {/* Player answers */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-medium mb-3">{t('liveQuiz.whoAnsweredWhat')}</p>
        <div className="space-y-2">
          {questionResult.playerAnswers.map((pa) => (
            <div
              key={pa.playerId}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                pa.correct ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                {pa.playerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pa.playerName}</p>
                <p className="text-xs text-muted-foreground truncate">{pa.answerText}</p>
              </div>
              <div className="flex items-center gap-2">
                {pa.correct ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-bold text-green-500">+{pa.pointsEarned}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini leaderboard */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-medium mb-3">{t('liveQuiz.leaderboard')}</p>
        <div className="space-y-1">
          {players.slice(0, 5).map((player, i) => (
            <div key={player.id} className="flex items-center gap-2 text-sm">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                i === 0 ? 'bg-amber-500 text-white' :
                i === 1 ? 'bg-gray-400 text-white' :
                i === 2 ? 'bg-amber-700 text-white' : 'bg-muted'
              )}>
                {i + 1}
              </span>
              <span className="flex-1 truncate">{player.name}</span>
              <span className="font-bold text-green-500">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-advance notice */}
      <p className="text-center text-xs text-muted-foreground">{t('liveQuiz.nextQuestionSoon')}</p>
    </div>
  );
}

function FinishedPhase() {
  const { t } = useTranslation();
  const { finalRankings, leaveRoom } = useLiveQuizStore();
  const navigate = useNavigate();

  const medals = [
    { icon: Crown, color: 'text-amber-500 bg-amber-500/10', label: '1st' },
    { icon: Medal, color: 'text-gray-400 bg-gray-400/10', label: '2nd' },
    { icon: Medal, color: 'text-amber-700 bg-amber-700/10', label: '3rd' },
  ];

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('liveQuiz.gameOver')}</h2>
        <p className="text-muted-foreground">{t('liveQuiz.finalResults')}</p>
      </motion.div>

      {/* Podium for top 3 */}
      {finalRankings.length >= 3 && (
        <div className="flex items-end justify-center gap-4 h-40 mb-4">
          {/* 2nd place */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-400/10 flex items-center justify-center text-lg font-bold text-gray-500 mb-2">
              {finalRankings[1]?.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate max-w-[80px]">{finalRankings[1]?.name}</p>
            <p className="text-xs text-muted-foreground">{t('liveQuiz.pts', { score: finalRankings[1]?.score })}</p>
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
              {finalRankings[0]?.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold truncate max-w-[80px]">{finalRankings[0]?.name}</p>
            <p className="text-xs text-amber-500 font-medium">{t('liveQuiz.pts', { score: finalRankings[0]?.score })}</p>
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
              {finalRankings[2]?.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate max-w-[80px]">{finalRankings[2]?.name}</p>
            <p className="text-xs text-muted-foreground">{t('liveQuiz.pts', { score: finalRankings[2]?.score })}</p>
            <div className="w-16 h-16 bg-amber-700/20 rounded-t-lg mt-2 flex items-center justify-center">
              <Medal className="w-6 h-6 text-amber-700" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Full rankings */}
      <div className="space-y-2">
        {finalRankings.map((player, i) => {
          const medal = medals[i];
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border',
                i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card border-border'
              )}
            >
              {medal ? (
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', medal.color)}>
                  <medal.icon className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {i + 1}
                </div>
              )}
              <div className="flex-1 text-left">
                <span className="font-medium">{player.name}</span>
                {player.correctAnswers !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {t('liveQuiz.correctCount', { correct: player.correctAnswers, total: player.answers })}
                  </p>
                )}
              </div>
              <span className="font-bold text-green-500">{t('liveQuiz.pts', { score: player.score })}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => { leaveRoom(); navigate('/dashboard'); }}
        >
          {t('liveQuiz.backToDashboard')}
        </Button>
        <Button
          className="flex-1 bg-green-500 hover:bg-green-600"
          onClick={leaveRoom}
        >
          {t('liveQuiz.playAgain')}
        </Button>
      </div>
    </div>
  );
}

function JoinOrCreate() {
  const { t } = useTranslation();
  const { connect, createRoom, joinRoom, error, socket, phase } = useLiveQuizStore();
  const { user, isLoading } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { id: studySetId, code: urlCode } = useParams<{ id?: string; code?: string }>();

  const hasStudySet = !!studySetId;
  const [mode, setMode] = useState<'choose' | 'join'>(urlCode ? 'join' : hasStudySet ? 'choose' : 'join');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (urlCode) setJoinCode(urlCode.toUpperCase());
  }, [urlCode]);

  useEffect(() => {
    if (!isLoading && user) connect();
  }, [isLoading, user]);

  useEffect(() => {
    if (phase === 'lobby') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreating(false);
      setIsJoining(false);
    }
  }, [phase]);

  useEffect(() => {
    if (urlCode && socket?.connected && user && !isJoining && phase === 'idle') {
      setIsJoining(true);
      joinRoom(urlCode.toUpperCase(), user?.name || user?.email?.split('@')[0] || 'Player');
    }
  }, [urlCode, socket?.connected, user, phase]);

  const handleCreate = () => {
    if (studySetId) {
      setIsCreating(true);
      createRoom(studySetId);
    }
  };

  const handleJoin = () => {
    if (joinCode.length === 6) {
      setIsJoining(true);
      joinRoom(joinCode, user?.name || user?.email?.split('@')[0] || 'Player');
    }
  };

  const isConnecting = isLoading || !socket?.connected;

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('liveQuiz.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {isConnecting ? t('liveQuiz.connecting') : urlCode ? t('liveQuiz.joiningRoom') : t('liveQuiz.playWithFriends')}
        </p>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {mode === 'choose' && hasStudySet ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Button
            className="w-full bg-green-500 hover:bg-green-600 h-14 text-base"
            onClick={handleCreate}
            disabled={isConnecting || isCreating}
          >
            {isConnecting || isCreating ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isCreating ? t('liveQuiz.creatingQuiz') : t('liveQuiz.createRoom')}
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base"
            onClick={() => setMode('join')}
            disabled={isConnecting}
          >
            <Users className="w-5 h-5 mr-2" />
            {t('liveQuiz.joinRoom')}
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-left">{t('liveQuiz.roomCodeLabel')}</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABCDEF"
              maxLength={6}
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div className="flex gap-3">
            {hasStudySet && (
              <Button variant="outline" className="flex-1" onClick={() => setMode('choose')}>
                {t('liveQuiz.back')}
              </Button>
            )}
            <Button
              className={cn('bg-green-500 hover:bg-green-600', hasStudySet ? 'flex-1' : 'w-full')}
              onClick={handleJoin}
              disabled={joinCode.length !== 6 || isJoining || isConnecting}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('liveQuiz.joining')}
                </>
              ) : (
                t('liveQuiz.join')
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function LiveQuizPage() {
  const { t } = useTranslation();
  const { phase, disconnect } = useLiveQuizStore();
  const navigate = useNavigate();

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-4">
        {phase === 'idle' && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('liveQuiz.back')}</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          {phase === 'idle' && <JoinOrCreate key="join" />}
          {phase === 'lobby' && <LobbyPhase key="lobby" />}
          {phase === 'countdown' && <CountdownPhase key="countdown" />}
          {phase === 'question' && <QuestionPhase key="question" />}
          {phase === 'result' && <ResultPhase key="result" />}
          {phase === 'finished' && <FinishedPhase key="finished" />}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
