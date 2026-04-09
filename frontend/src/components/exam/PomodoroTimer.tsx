import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PomodoroTimerProps {
  onSessionComplete?: (type: 'focus' | 'break') => void;
  className?: string;
  compact?: boolean;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_CONFIG = {
  focus: { duration: 25 * 60, labelKey: 'pomodoroTimer.focusTime', color: 'text-purple-500', bg: 'bg-purple-500' },
  shortBreak: { duration: 5 * 60, labelKey: 'pomodoroTimer.shortBreak', color: 'text-green-500', bg: 'bg-green-500' },
  longBreak: { duration: 15 * 60, labelKey: 'pomodoroTimer.longBreak', color: 'text-blue-500', bg: 'bg-blue-500' },
};

export function PomodoroTimer({ onSessionComplete, className, compact = false }: PomodoroTimerProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_CONFIG.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = TIMER_CONFIG[mode];

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    // Create a simple beep sound using Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioContext = new (AudioContextClass as typeof AudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      console.log('Audio not supported');
    }
  }, [soundEnabled]);

  const handleComplete = useCallback(() => {
    playSound();
    setIsRunning(false);

    if (mode === 'focus') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      onSessionComplete?.('focus');

      // After 4 pomodoros, take a long break
      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(TIMER_CONFIG.longBreak.duration);
      } else {
        setMode('shortBreak');
        setTimeLeft(TIMER_CONFIG.shortBreak.duration);
      }
    } else {
      onSessionComplete?.('break');
      setMode('focus');
      setTimeLeft(TIMER_CONFIG.focus.duration);
    }
  }, [mode, completedPomodoros, playSound, onSessionComplete]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleComplete]);

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_CONFIG[mode].duration);
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(TIMER_CONFIG[newMode].duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((TIMER_CONFIG[mode].duration - timeLeft) / TIMER_CONFIG[mode].duration) * 100;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', config.bg + '/10')}>
          {mode === 'focus' ? (
            <Brain className={cn('w-4 h-4', config.color)} />
          ) : (
            <Coffee className={cn('w-4 h-4', config.color)} />
          )}
          <span className={cn('font-mono font-bold text-sm', config.color)}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTimer}
          className="h-8 w-8 p-0"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('bg-card border border-border rounded-2xl p-6', className)}>
      {/* Mode Selector */}
      <div className="flex gap-2 mb-6">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              mode === m
                ? `${TIMER_CONFIG[m].bg} text-white`
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {m === 'focus' && <Brain className="w-4 h-4 inline mr-1.5" />}
            {m === 'shortBreak' && <Coffee className="w-4 h-4 inline mr-1.5" />}
            {m === 'longBreak' && <Coffee className="w-4 h-4 inline mr-1.5" />}
            {t(TIMER_CONFIG[m].labelKey)}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.02, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn('text-6xl font-mono font-bold', config.color)}
          >
            {formatTime(timeLeft)}
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', config.bg)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="h-12 w-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          onClick={toggleTimer}
          className={cn('h-14 w-14 rounded-full', config.bg, 'hover:opacity-90')}
        >
          {isRunning ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-12 w-12 rounded-full"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Pomodoro Count */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">{t('pomodoroTimer.completed')}</span>
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                i < (completedPomodoros % 4)
                  ? 'bg-purple-500'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{completedPomodoros}</span>
      </div>

      {/* Tips */}
      <AnimatePresence>
        {!isRunning && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-center text-xs text-muted-foreground"
          >
            {mode === 'focus'
              ? t('pomodoroTimer.focusTip')
              : t('pomodoroTimer.breakTip')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
