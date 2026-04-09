import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Target,
  TrendingUp,
  RotateCcw,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';

interface ReviewQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[] | null;
  difficulty: string;
  topic: string;
  examCloneId: string;
  examCloneName: string;
  nextReviewAt: string;
  repetitions: number;
  easeFactor: number;
}

type ReviewPhase = 'loading' | 'empty' | 'question' | 'result' | 'complete';

export default function ReviewQueuePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ReviewPhase>('loading');
  const [queue, setQueue] = useState<ReviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = queue[currentIndex];

  const fetchReviewQueue = useCallback(async () => {
    try {
      setPhase('loading');
      setError(null);
      const { data } = await api.get(ENDPOINTS.examClone.reviewQueue);
      if (data.length === 0) {
        setPhase('empty');
      } else {
        setQueue(data);
        setStats({ correct: 0, incorrect: 0, total: data.length });
        setPhase('question');
      }
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load review queue');
      setPhase('empty');
    }
  }, []);

  useEffect(() => {
    fetchReviewQueue();
  }, [fetchReviewQueue]);

  const handleSelectAnswer = (index: number) => {
    if (showAnswer) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = async () => {
    if (!currentQuestion) return;
    if (currentQuestion.options && currentQuestion.options.length > 0 && selectedAnswer === null) return;

    setShowAnswer(true);

    let isCorrect = false;
    if (currentQuestion.options && currentQuestion.options.length > 0 && selectedAnswer !== null) {
      isCorrect = currentQuestion.options[selectedAnswer] === currentQuestion.correctAnswer;
    }
    // For text-based questions, we'll mark as correct if they click check (simplified for now)

    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
  };

  const handleGetExplanation = async () => {
    if (!currentQuestion || loadingExplanation) return;

    setLoadingExplanation(true);
    try {
      let userAnswer = '';
      if (currentQuestion.options && currentQuestion.options.length > 0 && selectedAnswer !== null) {
        userAnswer = currentQuestion.options[selectedAnswer];
      }
      const { data } = await api.post(
        ENDPOINTS.examClone.explanation(currentQuestion.id),
        { userAnswer }
      );
      setExplanation(data.explanation);
    } catch (err) {
      console.error('Failed to get explanation:', err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);

    let isCorrect = false;
    if (currentQuestion.options && currentQuestion.options.length > 0 && selectedAnswer !== null) {
      isCorrect = currentQuestion.options[selectedAnswer] === currentQuestion.correctAnswer;
    }
    // For questions without options, we use the stats that were set in handleCheckAnswer

    try {
      await api.post(ENDPOINTS.examClone.completeReview(currentQuestion.id), {
        correct: isCorrect,
      });
    } catch (err) {
      console.error('Failed to complete review:', err);
    }

    setIsSubmitting(false);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setExplanation(null);

    if (currentIndex + 1 >= queue.length) {
      setPhase('complete');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setExplanation(null);
    setStats({ correct: 0, incorrect: 0, total: queue.length });
    setPhase('question');
    fetchReviewQueue();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'hard':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard/exam-clone')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('reviewQueue.back')}</span>
          </button>

          {phase === 'question' && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {stats.correct}
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-500" />
                {stats.incorrect}
              </span>
              <span className="text-muted-foreground">
                {currentIndex + 1} / {queue.length}
              </span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Loading State */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">{t('reviewQueue.loadingReviewQueue')}</p>
            </motion.div>
          )}

          {/* Empty State */}
          {phase === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('reviewQueue.allCaughtUp')}</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {error
                  ? error
                  : t('reviewQueue.noQueueDescription')}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard/exam-clone')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('reviewQueue.backToExams')}
                </Button>
                <Button onClick={fetchReviewQueue}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('reviewQueue.refresh')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Question Phase */}
          {phase === 'question' && currentQuestion && (
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question metadata */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    getDifficultyColor(currentQuestion.difficulty)
                  )}
                >
                  {currentQuestion.difficulty || 'Unknown'}
                </span>
                <span className="px-2.5 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                  {currentQuestion.topic || 'General'}
                </span>
                <span className="px-2.5 py-1 bg-blue-500/10 rounded-full text-xs text-blue-600 dark:text-blue-400">
                  {t('reviewQueue.reviewNumber', { number: currentQuestion.repetitions + 1 })}
                </span>
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentQuestion.examCloneName}
                </span>
              </div>

              {/* Question */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="text-lg font-medium leading-relaxed">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const showCorrect = showAnswer && isCorrect;
                    const showIncorrect = showAnswer && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={showAnswer}
                        className={cn(
                          'w-full p-4 rounded-xl text-left font-medium transition-all border-2',
                          showCorrect
                            ? 'border-green-500 bg-green-500/10'
                            : showIncorrect
                            ? 'border-red-500 bg-red-500/10'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                              showCorrect
                                ? 'bg-green-500 text-white'
                                : showIncorrect
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {showCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                          {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                        </span>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t('reviewQueue.typeYourAnswer')}</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('reviewQueue.enterYourAnswer')}
                        disabled={showAnswer}
                        className={cn(
                          'flex-1 px-4 py-3 bg-background border-2 rounded-xl focus:outline-none transition-colors',
                          showAnswer
                            ? 'border-muted bg-muted/50'
                            : 'border-border focus:border-primary'
                        )}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !showAnswer) {
                            setSelectedAnswer(0); // Mark as answered
                          }
                        }}
                      />
                    </div>
                    {showAnswer && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">{t('reviewQueue.correctAnswerLabel')}</span>
                        <span className="font-medium text-green-500">{currentQuestion.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Explanation */}
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {!explanation && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGetExplanation}
                      disabled={loadingExplanation}
                    >
                      {loadingExplanation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('reviewQueue.gettingAiExplanation')}
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-4 h-4 mr-2" />
                          {t('reviewQueue.getAiExplanation')}
                        </>
                      )}
                    </Button>
                  )}

                  {explanation && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {t('reviewQueue.aiExplanation')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {explanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {!showAnswer ? (
                  <Button
                    className="w-full"
                    onClick={handleCheckAnswer}
                    disabled={currentQuestion.options && currentQuestion.options.length > 0 ? selectedAnswer === null : false}
                  >
                    {t('reviewQueue.checkAnswer')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {currentIndex + 1 >= queue.length ? t('reviewQueue.finishReview') : t('reviewQueue.nextQuestion')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Complete Phase */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-500" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">{t('reviewQueue.reviewComplete')}</h2>
              <p className="text-muted-foreground mb-8">{t('reviewQueue.greatJobReinforcing')}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{t('reviewQueue.total')}</p>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.correct}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('reviewQueue.correct')}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.incorrect}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('reviewQueue.incorrect')}</p>
                </div>
              </div>

              {/* Accuracy */}
              <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('reviewQueue.accuracy')}</span>
                  <span className="text-lg font-bold">
                    {stats.total > 0
                      ? Math.round((stats.correct / stats.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}%`,
                    }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl max-w-md mx-auto mb-8 text-left">
                <TrendingUp className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    {t('reviewQueue.keepItUp')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('reviewQueue.spacedRepetitionTip')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard/exam-clone')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('reviewQueue.backToExams')}
                </Button>
                <Button onClick={handleRestart}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('reviewQueue.reviewMore')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
