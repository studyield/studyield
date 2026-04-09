import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { quizService } from '@/services/quiz';
import { useGamificationStore } from '@/stores/useGamificationStore';
import type { QuizQuestion } from '@/types';
import {
  ArrowLeft,
  FileQuestion,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Brain,
  RotateCcw,
  ChevronRight,
  Hash,
  ListChecks,
  AlertCircle,
  Sparkles,
  Star,
} from 'lucide-react';

type Phase = 'configure' | 'generating' | 'quiz' | 'results';

interface QuizConfig {
  questionCount: number;
  questionTypes: string[];
  timerEnabled: boolean;
}

interface AnswerResult {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

// ── Generating Screen ──

function GeneratingScreen() {
  const { t } = useTranslation();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 border-t-green-500 flex items-center justify-center mx-auto mb-6"
      >
        <Sparkles className="w-8 h-8 text-green-500" />
      </motion.div>
      <h2 className="text-xl font-bold mb-2">
        {t('quiz.generating')}{dots}
      </h2>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
        AI is creating personalized questions from your flashcards. This may take 10-15 seconds.
      </p>
      <div className="mt-6 flex justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Configure Screen ──

function QuizConfigScreen({
  onStart,
  error,
  onClearError,
}: {
  onStart: (config: QuizConfig) => void;
  error: string | null;
  onClearError: () => void;
}) {
  const { t } = useTranslation();
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<string[]>([
    'multiple_choice',
    'true_false',
  ]);
  const [timerEnabled, setTimerEnabled] = useState(false);

  const countOptions = [5, 10, 15, 20];

  const typeOptions = [
    { key: 'multiple_choice', label: 'Multiple Choice', desc: '4 options, pick one' },
    { key: 'true_false', label: 'True / False', desc: 'Decide if the statement is correct' },
    { key: 'fill_blank', label: 'Fill in the Blank', desc: 'Type the missing word or phrase' },
  ];

  const toggleType = (key: string) => {
    setQuestionTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
    if (error) onClearError();
  };

  const canStart = questionTypes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto w-full"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">{t('quiz.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Test your knowledge with AI-generated questions
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">{error}</p>
          </div>
          <button onClick={onClearError} className="text-red-400 hover:text-red-500">
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Question Count */}
      <div className="bg-card border border-border rounded-xl p-5 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-green-500" />
          <h3 className="font-medium text-sm">Number of Questions</h3>
        </div>
        <div className="flex gap-2">
          {countOptions.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                questionCount === count
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              )}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Question Types */}
      <div className="bg-card border border-border rounded-xl p-5 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-green-500" />
          <h3 className="font-medium text-sm">Question Types</h3>
        </div>
        <div className="space-y-2">
          {typeOptions.map((type) => {
            const selected = questionTypes.includes(type.key);
            return (
              <button
                key={type.key}
                onClick={() => toggleType(type.key)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all text-left',
                  selected
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-transparent bg-muted/40 hover:bg-muted/60'
                )}
              >
                <div>
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.desc}</p>
                </div>
                {selected ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        {questionTypes.length === 0 && (
          <p className="text-xs text-red-400 mt-2">Select at least one question type</p>
        )}
      </div>

      {/* Timer Toggle */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <button
          onClick={() => setTimerEnabled(!timerEnabled)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            <div className="text-left">
              <p className="font-medium text-sm">Timer</p>
              <p className="text-xs text-muted-foreground">30 seconds per question</p>
            </div>
          </div>
          <div
            className={cn(
              'w-10 h-6 rounded-full transition-colors flex items-center px-0.5',
              timerEnabled ? 'bg-green-500 justify-end' : 'bg-muted justify-start'
            )}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </div>
        </button>
      </div>

      {/* Start Button */}
      <Button
        className="w-full bg-green-500 hover:bg-green-600 h-12 text-base shadow-lg shadow-green-500/20"
        disabled={!canStart}
        onClick={() => onStart({ questionCount, questionTypes, timerEnabled })}
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {t('quiz.generate')} & {t('quiz.startQuiz')}
      </Button>
    </motion.div>
  );
}

// ── Question Screen ──

function QuizQuestionScreen({
  question,
  index,
  total,
  onAnswer,
  timerEnabled,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (answer: string) => void;
  timerEnabled: boolean;
}) {
  const { t } = useTranslation();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const hasSubmittedRef = useRef(false);

  const isCorrect =
    selectedAnswer?.toLowerCase().trim() ===
    question.correctAnswer?.toLowerCase().trim();

  // Timer
  useEffect(() => {
    if (!timerEnabled || showFeedback) return;
    if (timeLeft <= 0) {
      if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedAnswer('');
        setShowFeedback(true);
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerEnabled, showFeedback]);

  // Reset on question change
  useEffect(() => {
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowFeedback(false);
    setTimeLeft(30);
    hasSubmittedRef.current = false;
  }, [question.id]);

  const handleSubmitAnswer = (answer: string) => {
    if (showFeedback || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSelectedAnswer(answer);
    setShowFeedback(true);
  };

  const handleNext = () => {
    onAnswer(selectedAnswer || '');
  };

  const progress = ((index + 1) / total) * 100;

  const typeLabel =
    question.type === 'multiple_choice'
      ? 'Multiple Choice'
      : question.type === 'true_false'
      ? 'True or False'
      : 'Fill in the Blank';

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-xl mx-auto w-full"
    >
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {index + 1} / {total}
        </span>
        {timerEnabled && !showFeedback && (
          <span
            className={cn(
              'flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full',
              timeLeft <= 10
                ? 'text-red-500 bg-red-500/10'
                : 'text-muted-foreground bg-muted'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-widest text-green-500 font-semibold bg-green-500/10 px-2 py-0.5 rounded">
            {typeLabel}
          </span>
        </div>
        <p className="text-lg font-semibold leading-relaxed">{question.question}</p>
      </div>

      {/* Answer Options */}
      <div className="space-y-2.5 mb-6">
        {(question.type === 'multiple_choice' || question.type === 'true_false') && (
          <>
            {(question.type === 'true_false'
              ? ['True', 'False']
              : question.options || []
            ).map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption =
                option.toLowerCase().trim() ===
                question.correctAnswer?.toLowerCase().trim();

              let optionStyle = 'border-border bg-card hover:border-green-500/40 hover:bg-green-500/5';
              if (showFeedback) {
                if (isCorrectOption) {
                  optionStyle = 'border-green-500 bg-green-500/10';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'border-red-500 bg-red-500/10';
                } else {
                  optionStyle = 'border-border bg-muted/20 opacity-40';
                }
              } else if (isSelected) {
                optionStyle = 'border-green-500 bg-green-500/5 shadow-sm';
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={idx}
                  onClick={() => !showFeedback && handleSubmitAnswer(option)}
                  disabled={showFeedback}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left',
                    optionStyle
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                      showFeedback && isCorrectOption
                        ? 'bg-green-500 text-white'
                        : showFeedback && isSelected && !isCorrectOption
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {letters[idx]}
                  </span>
                  <span className="flex-1 font-medium text-sm">{option}</span>
                  {showFeedback && isCorrectOption && (
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  )}
                  {showFeedback && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </>
        )}

        {(question.type === 'fill_blank' || question.type === 'short_answer') && (
          <div className="space-y-3">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textAnswer.trim() && !showFeedback) {
                  handleSubmitAnswer(textAnswer.trim());
                }
              }}
              disabled={showFeedback}
              placeholder="Type your answer here..."
              autoFocus
              className={cn(
                'w-full px-4 py-3.5 rounded-xl border-2 bg-card text-sm font-medium outline-none transition-all',
                showFeedback
                  ? isCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : 'border-border focus:border-green-500'
              )}
            />
            {!showFeedback && (
              <Button
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={!textAnswer.trim()}
                onClick={() => handleSubmitAnswer(textAnswer.trim())}
              >
                {t('quiz.submitAnswer')}
              </Button>
            )}
            {showFeedback && !isCorrect && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Correct answer:</span>
                <span className="font-semibold text-green-500">{question.correctAnswer}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback & Next */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Feedback card */}
          <div
            className={cn(
              'rounded-xl p-4 border-2',
              isCorrect
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <p className={cn('text-sm font-semibold', isCorrect ? 'text-green-600' : 'text-red-600')}>
                {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
              </p>
            </div>
            {question.explanation && (
              <p className="text-sm text-muted-foreground ml-6">
                {question.explanation}
              </p>
            )}
          </div>

          <Button
            className="w-full bg-green-500 hover:bg-green-600 h-11"
            onClick={handleNext}
          >
            {index + 1 < total ? (
              <>
                {t('quiz.nextQuestion')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-1" />
                {t('quiz.viewResults')}
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Results Screen ──

function QuizResultsScreen({
  results,
  questions,
  timeTaken,
  studySetId,
  onRetry,
}: {
  results: AnswerResult[];
  questions: QuizQuestion[];
  timeTaken: number;
  studySetId: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const correct = results.filter((r) => r.isCorrect).length;
  const wrong = results.length - correct;
  const percentage = Math.round((correct / results.length) * 100);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const stars = percentage >= 80 ? 3 : percentage >= 50 ? 2 : percentage > 0 ? 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto w-full"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">Quiz Complete!</h2>

        {/* Stars */}
        <div className="flex justify-center gap-1 mt-3">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
            >
              <Star
                className={cn(
                  'w-7 h-7',
                  i <= stars
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-muted-foreground/20'
                )}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Score Circle */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center mb-4">
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className={cn(
            'text-6xl font-bold',
            percentage >= 70
              ? 'text-green-500'
              : percentage >= 40
              ? 'text-amber-500'
              : 'text-red-500'
          )}
        >
          {percentage}%
        </motion.p>
        <p className="text-sm text-muted-foreground mt-1">
          {percentage >= 80
            ? 'Excellent work!'
            : percentage >= 60
            ? 'Good job!'
            : percentage >= 40
            ? 'Keep practicing!'
            : 'Review and try again'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold">{correct}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('quiz.correct')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold">{wrong}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('quiz.incorrect')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold">{formatTime(timeTaken)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</p>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-sm">Question Breakdown</h3>
          <span className="text-xs text-muted-foreground">
            {correct}/{questions.length} correct
          </span>
        </div>
        <div className="divide-y divide-border max-h-60 overflow-y-auto">
          {questions.map((q, idx) => {
            const result = results[idx];
            return (
              <div key={q.id} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    result?.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}
                >
                  {result?.isCorrect ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{q.question}</p>
                  {!result?.isCorrect && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Answer: <span className="text-green-500 font-medium">{q.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/dashboard/study-sets/${studySetId}`}>{t('common.back')}</Link>
        </Button>
        <Button
          className="flex-1 bg-green-500 hover:bg-green-600"
          onClick={onRetry}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main Page ──

export function QuizPage() {
  const { t } = useTranslation();
  const { id: studySetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addXP } = useGamificationStore();

  const [phase, setPhase] = useState<Phase>('configure');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(
    async (config: QuizConfig) => {
      if (!studySetId) return;
      setError(null);
      setPhase('generating');

      try {
        const quiz = await quizService.generate({
          studySetId,
          title: `Quiz - ${new Date().toLocaleDateString()}`,
          questionCount: config.questionCount,
          questionTypes: config.questionTypes,
          timeLimit: config.timerEnabled ? config.questionCount * 30 : undefined,
        });

        setQuizId(quiz.id);
        const fetchedQuestions = await quizService.getQuestions(quiz.id);
        setQuestions(fetchedQuestions);
        setTimerEnabled(config.timerEnabled);
        setCurrentIndex(0);
        setResults([]);
        setStartTime(Math.floor(Date.now() / 1000));
        setPhase('quiz');
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (status === 404) {
          setError('No flashcards found in this study set. Add some flashcards first.');
        } else {
          setError('Failed to generate quiz. Please check your connection and try again.');
        }
        setPhase('configure');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studySetId]
  );

  const handleAnswer = useCallback(
    async (answer: string) => {
      const question = questions[currentIndex];
      const isCorrect =
        answer.toLowerCase().trim() ===
        question.correctAnswer?.toLowerCase().trim();

      const newResult: AnswerResult = {
        questionId: question.id,
        answer,
        isCorrect,
      };

      const updatedResults = [...results, newResult];
      setResults(updatedResults);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
      } else {
        const elapsed = Math.floor(Date.now() / 1000) - startTime;
        setTimeTaken(elapsed);
        setPhase('results');

        // Award XP
        const correctCount = updatedResults.filter((r) => r.isCorrect).length;
        const isPerfect = correctCount === updatedResults.length;
        addXP(isPerfect ? 'perfect_quiz' : 'quiz_complete');

        if (quizId) {
          try {
            await quizService.submitAttempt(quizId, {
              answers: updatedResults.map((r) => ({
                questionId: r.questionId,
                answer: r.answer,
                timeSpent: 0,
              })),
              totalTimeSpent: elapsed,
            });
          } catch {
            // Non-critical
          }
        }
      }
    },
    [currentIndex, questions, results, startTime, quizId]
  );

  const handleRetry = () => {
    setPhase('configure');
    setQuestions([]);
    setResults([]);
    setCurrentIndex(0);
    setQuizId(null);
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto min-h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t('common.back')}</span>
          </button>
          {phase === 'quiz' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10">
              <Brain className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-green-600">Quiz Mode</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center pb-8">
          <AnimatePresence mode="wait">
            {phase === 'configure' && (
              <QuizConfigScreen
                key="configure"
                onStart={handleStart}
                error={error}
                onClearError={() => setError(null)}
              />
            )}

            {phase === 'generating' && (
              <GeneratingScreen key="generating" />
            )}

            {phase === 'quiz' && questions[currentIndex] && (
              <QuizQuestionScreen
                key={`question-${currentIndex}`}
                question={questions[currentIndex]}
                index={currentIndex}
                total={questions.length}
                onAnswer={handleAnswer}
                timerEnabled={timerEnabled}
              />
            )}

            {phase === 'results' && (
              <QuizResultsScreen
                key="results"
                results={results}
                questions={questions}
                timeTaken={timeTaken}
                studySetId={studySetId!}
                onRetry={handleRetry}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
