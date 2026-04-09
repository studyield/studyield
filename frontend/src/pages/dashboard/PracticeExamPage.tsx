import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  ArrowLeft,
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  X,
  RotateCcw,
  Brain,
  BookOpen,
  Bookmark,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PomodoroTimer } from '@/components/exam/PomodoroTimer';

interface ExamQuestion {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  topic: string | null;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  flagged: boolean;
  timeSpent: number;
}

type ExamState = 'setup' | 'in-progress' | 'review' | 'results';

export default function PracticeExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [examState, setExamState] = useState<ExamState>('setup');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showPomodoro, setShowPomodoro] = useState(false);

  // Setup options
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30); // minutes
  const [includeOriginal, setIncludeOriginal] = useState(true);
  const [includeGenerated, setIncludeGenerated] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await api.get<ExamQuestion[]>(`/exam-clones/${id}/questions`);
        setQuestions(response.data);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (examState === 'in-progress' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState, timeRemaining]);

  const startExam = () => {
    // Select questions
    let available = [...questions];
    if (!includeOriginal) {
      available = available.filter((q) => !(q as any).isOriginal);
    }
    if (!includeGenerated) {
      available = available.filter((q) => (q as any).isOriginal);
    }

    // Shuffle and pick
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Prevent starting with no questions
    if (selected.length === 0) {
      alert(t('practiceExam.noQuestionsAvailable'));
      return;
    }

    setSelectedQuestions(selected);
    setTimeRemaining(timeLimit * 60);
    setTotalTime(timeLimit * 60);
    setCurrentIndex(0);
    setAnswers(new Map());
    questionStartTime.current = Date.now();
    setExamState('in-progress');
  };

  const handleAnswer = (answer: string) => {
    const question = selectedQuestions[currentIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);

    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(question.id, {
        questionId: question.id,
        answer,
        flagged: prev.get(question.id)?.flagged || false,
        timeSpent: (prev.get(question.id)?.timeSpent || 0) + timeSpent,
      });
      return newAnswers;
    });

    questionStartTime.current = Date.now();
  };

  const toggleFlag = () => {
    const question = selectedQuestions[currentIndex];
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const existing = prev.get(question.id);
      newAnswers.set(question.id, {
        questionId: question.id,
        answer: existing?.answer || '',
        flagged: !existing?.flagged,
        timeSpent: existing?.timeSpent || 0,
      });
      return newAnswers;
    });
  };

  const toggleBookmark = async (questionId: string) => {
    const isBookmarked = bookmarkedIds.has(questionId);
    try {
      if (isBookmarked) {
        await api.delete(ENDPOINTS.examClone.bookmark(questionId));
        setBookmarkedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
      } else {
        await api.post(ENDPOINTS.examClone.bookmark(questionId), {});
        setBookmarkedIds((prev) => new Set(prev).add(questionId));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const goToQuestion = (index: number) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const currentQuestion = selectedQuestions[currentIndex];

    // Save time for current question
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const existing = prev.get(currentQuestion.id);
      if (existing) {
        newAnswers.set(currentQuestion.id, {
          ...existing,
          timeSpent: existing.timeSpent + timeSpent,
        });
      }
      return newAnswers;
    });

    questionStartTime.current = Date.now();
    setCurrentIndex(index);
  };

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Submit attempt to backend for analytics and review queue
    try {
      const answersArray = selectedQuestions.map((q) => {
        const userAnswer = answers.get(q.id);
        return {
          questionId: q.id,
          answer: userAnswer?.answer || '',
          timeSpent: userAnswer?.timeSpent || 0,
        };
      });

      const timeTaken = totalTime - timeRemaining;

      await api.post(ENDPOINTS.examClone.submitAttempt(id!), {
        answers: answersArray,
        totalTime: timeTaken,
      });

      console.log('Attempt submitted to backend');
    } catch (err) {
      console.error('Failed to submit attempt:', err);
      // Continue to results even if API fails
    }

    setExamState('results');
  }, [selectedQuestions, answers, totalTime, timeRemaining, id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate results
  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    selectedQuestions.forEach((q) => {
      const userAnswer = answers.get(q.id);
      if (!userAnswer?.answer) {
        unanswered++;
      } else if (userAnswer.answer === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const score = Math.round((correct / selectedQuestions.length) * 100);
    const timeTaken = totalTime - timeRemaining;

    return { correct, incorrect, unanswered, score, timeTaken };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Setup Screen
  if (examState === 'setup') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/exam-clone/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('practiceExam.backToExam')}
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{t('practiceExam.title')}</h1>
              <p className="text-muted-foreground">
                {t('practiceExam.questionsAvailable', { count: questions.length })}
              </p>
            </div>

            <div className="space-y-6">
              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('practiceExam.numberOfQuestions')}</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 'All'].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n === 'All' ? questions.length : (n as number))}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        questionCount === (n === 'All' ? questions.length : n)
                          ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                          : 'border-border hover:border-purple-500/50'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('practiceExam.timeLimit')}</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60, 90].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeLimit(t)}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                        timeLimit === t
                          ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                          : 'border-border hover:border-purple-500/50'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Sources */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('practiceExam.includeQuestionsFrom')}</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOriginal}
                      onChange={(e) => setIncludeOriginal(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm">{t('practiceExam.originalExam')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeGenerated}
                      onChange={(e) => setIncludeGenerated(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm">{t('practiceExam.aiGenerated')}</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={startExam}
                disabled={!includeOriginal && !includeGenerated}
                className="w-full bg-purple-500 hover:bg-purple-600 h-12 text-base"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('practiceExam.startExam')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // In Progress Screen
  if (examState === 'in-progress') {
    const currentQuestion = selectedQuestions[currentIndex];

    // Safety guard - if no questions, go back to setup
    if (!currentQuestion) {
      setExamState('setup');
      return null;
    }

    const currentAnswer = answers.get(currentQuestion.id);
    const answeredCount = Array.from(answers.values()).filter((a) => a.answer).length;
    const flaggedCount = Array.from(answers.values()).filter((a) => a.flagged).length;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Exit Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmExit(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                {t('practiceExam.exit')}
              </Button>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-medium">
                {t('practiceExam.questionOf', { current: currentIndex + 1, total: selectedQuestions.length })}
              </span>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                {t('practiceExam.answered', { count: answeredCount })}
              </span>
              {flaggedCount > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-sm text-amber-500 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5" />
                    {t('practiceExam.flagged', { count: flaggedCount })}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Pomodoro Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPomodoro(!showPomodoro)}
                className={cn(showPomodoro && 'bg-purple-500/10 text-purple-500')}
                title="Pomodoro Timer"
              >
                <Timer className="w-4 h-4" />
              </Button>

              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-medium',
                timeRemaining < 300 ? 'bg-red-500/10 text-red-500' : 'bg-muted'
              )}>
                <Clock className="w-4 h-4" />
                {formatTime(timeRemaining)}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowConfirmSubmit(true)}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {t('practiceExam.submitExam')}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${(answeredCount / selectedQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Pomodoro Timer Sidebar */}
        <AnimatePresence>
          {showPomodoro && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-4 top-20 z-20 w-72"
            >
              <PomodoroTimer
                onSessionComplete={(type) => {
                  if (type === 'focus') {
                    // Could show a notification or play sound
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  currentQuestion.difficulty === 'easy' && 'bg-green-500/10 text-green-500',
                  currentQuestion.difficulty === 'medium' && 'bg-amber-500/10 text-amber-500',
                  currentQuestion.difficulty === 'hard' && 'bg-red-500/10 text-red-500'
                )}>
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.topic && (
                  <span className="text-xs text-muted-foreground">{currentQuestion.topic}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    bookmarkedIds.has(currentQuestion.id)
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                  title="Bookmark question"
                >
                  <Bookmark className={cn('w-5 h-5', bookmarkedIds.has(currentQuestion.id) && 'fill-current')} />
                </button>
                <button
                  onClick={toggleFlag}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    currentAnswer?.flagged
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                  title="Flag for review"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-lg mb-6">{currentQuestion.question}</p>

            {/* Options */}
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                      currentAnswer?.answer === option
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-border hover:border-purple-500/50 hover:bg-muted/50'
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      currentAnswer?.answer === option
                        ? 'bg-purple-500 text-white'
                        : 'bg-muted'
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={currentAnswer?.answer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={t('practiceExam.typeAnswerHere')}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              />
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('practiceExam.previous')}
            </Button>

            {/* Question dots */}
            <div className="flex gap-1 flex-wrap justify-center max-w-md">
              {selectedQuestions.map((q, i) => {
                const answer = answers.get(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(i)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                      i === currentIndex && 'ring-2 ring-purple-500',
                      answer?.flagged && 'bg-amber-500/20 text-amber-500',
                      answer?.answer && !answer.flagged && 'bg-green-500/20 text-green-500',
                      !answer?.answer && !answer?.flagged && 'bg-muted'
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => goToQuestion(currentIndex + 1)}
              disabled={currentIndex === selectedQuestions.length - 1}
            >
              {t('practiceExam.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Submit Confirmation */}
        <AnimatePresence>
          {showConfirmSubmit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmSubmit(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
              >
                <h3 className="text-lg font-semibold mb-2">{t('practiceExam.submitExamConfirm')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('practiceExam.answeredOf', { answered: answeredCount, total: selectedQuestions.length })}
                  {selectedQuestions.length - answeredCount > 0 && (
                    <span className="text-amber-500">
                      {' '}{t('practiceExam.questionsUnanswered', { count: selectedQuestions.length - answeredCount })}
                    </span>
                  )}
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
                    {t('practiceExam.continueExam')}
                  </Button>
                  <Button onClick={handleSubmit} className="bg-purple-500 hover:bg-purple-600">
                    {t('practiceExam.submitExam')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit Confirmation */}
        <AnimatePresence>
          {showConfirmExit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmExit(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-center">{t('practiceExam.exitExam')}</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  {t('practiceExam.progressLost', { answered: answeredCount, total: selectedQuestions.length })}
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setShowConfirmExit(false)}>
                    {t('practiceExam.continueExam')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => navigate(`/dashboard/exam-clone/${id}`)}
                  >
                    {t('practiceExam.exit')}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Results Screen
  if (examState === 'results') {
    const results = calculateResults();

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 text-center mb-8"
          >
            {/* Score */}
            <div className={cn(
              'w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6',
              results.score >= 80 ? 'bg-green-500/10' : results.score >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'
            )}>
              <div>
                <p className={cn(
                  'text-4xl font-bold',
                  results.score >= 80 ? 'text-green-500' : results.score >= 60 ? 'text-amber-500' : 'text-red-500'
                )}>
                  {results.score}%
                </p>
                <p className="text-xs text-muted-foreground">{t('practiceExam.score')}</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-2">
              {results.score >= 80 ? t('practiceExam.excellent') : results.score >= 60 ? t('practiceExam.goodJob') : t('practiceExam.keepPracticing')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('practiceExam.answeredCorrectly', { correct: results.correct, total: selectedQuestions.length })}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-green-500/10 rounded-xl">
                <p className="text-2xl font-bold text-green-500">{results.correct}</p>
                <p className="text-xs text-muted-foreground">{t('practiceExam.correct')}</p>
              </div>
              <div className="p-4 bg-red-500/10 rounded-xl">
                <p className="text-2xl font-bold text-red-500">{results.incorrect}</p>
                <p className="text-xs text-muted-foreground">{t('practiceExam.incorrect')}</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold">{results.unanswered}</p>
                <p className="text-xs text-muted-foreground">{t('practiceExam.unanswered')}</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-xl">
                <p className="text-2xl font-bold text-blue-500">{formatTime(results.timeTaken)}</p>
                <p className="text-xs text-muted-foreground">{t('practiceExam.timeTaken')}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setExamState('review')}>
                <BookOpen className="w-4 h-4 mr-2" />
                {t('practiceExam.reviewAnswers')}
              </Button>
              <Button onClick={() => setExamState('setup')}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('practiceExam.tryAgain')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/exam-clone/${id}`)}
              >
                {t('practiceExam.backToExam')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Review Screen
  if (examState === 'review') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-semibold">{t('practiceExam.answerReview')}</h1>
            <Button variant="outline" size="sm" onClick={() => setExamState('results')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('practiceExam.backToResults')}
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {selectedQuestions.map((question, index) => {
            const userAnswer = answers.get(question.id);
            const isCorrect = userAnswer?.answer === question.correctAnswer;

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'bg-card border rounded-xl p-6',
                  isCorrect ? 'border-green-500/30' : 'border-red-500/30'
                )}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0',
                    isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  )}>
                    {isCorrect ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{t('practiceExam.question', { number: index + 1 })}</p>
                    <p className="text-muted-foreground">{question.question}</p>
                  </div>
                </div>

                {/* Options with correct/wrong highlighting */}
                {question.options && (
                  <div className="space-y-2 ml-12 mb-4">
                    {question.options.map((opt, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg text-sm',
                          opt === question.correctAnswer && 'bg-green-500/10 border border-green-500/20',
                          opt === userAnswer?.answer && opt !== question.correctAnswer && 'bg-red-500/10 border border-red-500/20',
                          opt !== question.correctAnswer && opt !== userAnswer?.answer && 'bg-muted/50'
                        )}
                      >
                        <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-medium">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                        {opt === question.correctAnswer && (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                        )}
                        {opt === userAnswer?.answer && opt !== question.correctAnswer && (
                          <X className="w-4 h-4 text-red-500 ml-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="ml-12 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs font-medium text-blue-500 mb-1">{t('examDetail.explanation')}</p>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
