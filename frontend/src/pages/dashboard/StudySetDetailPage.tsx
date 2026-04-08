import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudySetsStore } from '@/stores/useStudySetsStore';
import { useFlashcardsStore } from '@/stores/useFlashcardsStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { cn } from '@/lib/utils';
import { getFlashcardStatus, isFlashcardDue } from '@/types';
import type { Flashcard, Quiz, QuizAttempt, QuizQuestion, QuizAttemptAnswer } from '@/types';
import { quizService } from '@/services/quiz';
import { MindMapView } from '@/components/notes/MindMapView';
import { SourcesTab } from '@/components/sources/SourcesTab';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Plus,
  Play,
  BookOpen,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  Globe,
  Lock,
  Library,
  Eye,
  X,
  RotateCcw,
  FileQuestion,
  Gamepad2,
  BarChart3,
  Search,
  SortAsc,
  Brain,
  Target,
  Clock,
  ChevronDown,
  Trophy,
  CheckCircle,
  XCircle,
  History,
  ChevronRight,
  Loader2,
  Users,
  Calendar,
  Sparkles,
  Network,
  Tag,
} from 'lucide-react';

// ── Status helpers ──

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-600',
  Learning: 'bg-amber-500/10 text-amber-600',
  Review: 'bg-purple-500/10 text-purple-600',
  Mastered: 'bg-green-500/10 text-green-600',
};

const CHART_STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6',
  Learning: '#f59e0b',
  Review: '#a855f7',
  Mastered: '#22c55e',
};

// ── Preview Modal Component ──

function FlashcardPreviewModal({
  flashcard,
  onClose,
  onEdit,
  onDelete,
}: {
  flashcard: Flashcard;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const status = getFlashcardStatus(flashcard);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', STATUS_COLORS[status])}>
              {status}
            </span>
            {isFlashcardDue(flashcard) && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500 font-medium">
                Due
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flip Card */}
        <div
          className="relative h-56 cursor-pointer perspective-1000 m-4"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="absolute inset-0 w-full h-full"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 w-full h-full rounded-xl border-2 border-border bg-muted/30 p-6 flex flex-col items-center justify-center backface-hidden">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Question</span>
              <p className="text-lg font-medium text-center">{flashcard.front}</p>
              <p className="text-xs text-muted-foreground mt-4 opacity-60">Tap to flip</p>
            </div>
            <div
              className="absolute inset-0 w-full h-full rounded-xl border-2 border-green-500/50 bg-green-500/5 p-6 flex flex-col items-center justify-center backface-hidden"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <span className="text-xs uppercase tracking-wider text-green-500 mb-3">Answer</span>
              <p className="text-lg font-medium text-center">{flashcard.back}</p>
              {flashcard.notes && (
                <p className="text-xs text-muted-foreground mt-3 text-center">{flashcard.notes}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Flip
          </button>
          <button
            onClick={() => { onEdit(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit')}
          </button>
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Flashcard Item Component ──

function FlashcardItem({
  flashcard,
  onEdit,
  onDelete,
  onPreview,
}: {
  flashcard: Flashcard;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const status = getFlashcardStatus(flashcard);
  const isDue = isFlashcardDue(flashcard);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 hover:border-green-500/50 transition-colors group cursor-pointer"
      onClick={onPreview}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', STATUS_COLORS[status])}>
              {status}
            </span>
            {isDue && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500 font-medium">
                Due
              </span>
            )}
          </div>
          <p className="font-medium mb-1 truncate">{flashcard.front}</p>
          <p className="text-sm text-muted-foreground truncate">{flashcard.back}</p>
        </div>

        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => { onPreview(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Analytics Tab Component ──

function AnalyticsTab({ flashcards }: { flashcards: Flashcard[] }) {
  const stats = useMemo(() => {
    const statusCounts: Record<string, number> = { New: 0, Learning: 0, Review: 0, Mastered: 0 };
    let totalDifficulty = 0;
    let reviewedCount = 0;
    let dueCount = 0;

    flashcards.forEach((fc) => {
      const status = getFlashcardStatus(fc);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      totalDifficulty += fc.difficulty;
      if (fc.repetitions > 0) reviewedCount++;
      if (isFlashcardDue(fc)) dueCount++;
    });

    const masteryPct =
      flashcards.length > 0
        ? Math.round((statusCounts.Mastered / flashcards.length) * 100)
        : 0;
    const avgDifficulty =
      flashcards.length > 0 ? (totalDifficulty / flashcards.length).toFixed(1) : '0';

    return { statusCounts, reviewedCount, masteryPct, avgDifficulty, dueCount };
  }, [flashcards]);

  const pieData = useMemo(
    () =>
      Object.entries(stats.statusCounts)
        .filter(([, count]) => count > 0)
        .map(([name, value]) => ({ name, value })),
    [stats.statusCounts]
  );

  const difficultyData = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    flashcards.forEach((fc) => {
      if (fc.difficulty <= 2) easy++;
      else if (fc.difficulty <= 4) medium++;
      else hard++;
    });
    return [
      { name: 'Easy', count: easy, fill: '#22c55e' },
      { name: 'Medium', count: medium, fill: '#f59e0b' },
      { name: 'Hard', count: hard, fill: '#ef4444' },
    ];
  }, [flashcards]);

  const upcomingReviews = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);

    const groups = { Today: 0, Tomorrow: 0, 'This Week': 0, Later: 0 };

    flashcards.forEach((fc) => {
      if (!fc.nextReviewAt) return;
      const reviewDate = new Date(fc.nextReviewAt);
      if (reviewDate <= todayEnd) groups.Today++;
      else if (reviewDate <= tomorrowEnd) groups.Tomorrow++;
      else if (reviewDate <= weekEnd) groups['This Week']++;
      else groups.Later++;
    });

    return groups;
  }, [flashcards]);

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-xl">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <BarChart3 className="w-6 h-6 text-green-500" />
        </div>
        <h3 className="font-semibold mb-1">No analytics yet</h3>
        <p className="text-sm text-muted-foreground">
          Add flashcards and start studying to see analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Brain className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold">{stats.reviewedCount}</p>
          <p className="text-xs text-muted-foreground">Total Reviewed</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <Target className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xl font-bold">{stats.masteryPct}%</p>
          <p className="text-xs text-muted-foreground">Mastery</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold">{stats.avgDifficulty}</p>
          <p className="text-xs text-muted-foreground">Avg Difficulty</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-bold">{stats.dueCount}</p>
          <p className="text-xs text-muted-foreground">Due Now</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Donut Chart - Cards by Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-medium text-sm mb-4">Cards by Status</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_STATUS_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_STATUS_COLORS[status] }}
                    />
                    <span className="text-xs text-muted-foreground">{status}</span>
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </div>

        {/* Bar Chart - Difficulty Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-medium text-sm mb-4">Difficulty Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={difficultyData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {difficultyData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Reviews */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-medium text-sm mb-3">Upcoming Reviews</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(upcomingReviews).map(([period, count]) => (
            <div key={period} className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{period}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Attempt Review Modal ──

function AttemptReviewModal({
  attempt,
  onClose,
}: {
  attempt: { quizTitle: string; attempt: QuizAttempt; questions: QuizQuestion[]; answers: QuizAttemptAnswer[] };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const percentage = Math.round(attempt.attempt.score);
  const correct = attempt.answers.filter((a) => a.isCorrect).length;
  const questionMap = new Map(attempt.questions.map((q) => [q.id, q]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-semibold">{attempt.quizTitle}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(attempt.attempt.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Summary */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white',
                percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
              )}
            >
              {percentage}%
            </div>
            <div className="flex-1">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {correct} correct
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  {attempt.answers.length - correct} wrong
                </span>
                {attempt.attempt.timeSpent > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(attempt.attempt.timeSpent / 60)}m {attempt.attempt.timeSpent % 60}s
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {attempt.answers.map((answer, idx) => {
            const question = questionMap.get(answer.questionId);
            if (!question) return null;
            return (
              <div key={answer.id || idx} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      answer.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}
                  >
                    {answer.isCorrect ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{question.question}</p>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs">
                        <span className="text-muted-foreground">Your answer: </span>
                        <span
                          className={cn(
                            'font-medium',
                            answer.isCorrect ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {answer.userAnswer || '(no answer)'}
                        </span>
                      </p>
                      {!answer.isCorrect && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">Correct: </span>
                          <span className="font-medium text-green-500">{question.correctAnswer}</span>
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Quiz History Tab ──

function QuizHistoryTab({ studySetId }: { studySetId: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptsByQuiz, setAttemptsByQuiz] = useState<Record<string, QuizAttempt[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    quizTitle: string;
    attempt: QuizAttempt;
    questions: QuizQuestion[];
    answers: QuizAttemptAnswer[];
  } | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizHistory = async () => {
      setIsLoading(true);
      try {
        const data = await quizService.getByStudySet(studySetId);
        setQuizzes(data);

        // Fetch attempts for each quiz
        const attemptsMap: Record<string, QuizAttempt[]> = {};
        await Promise.all(
          data.map(async (quiz) => {
            try {
              const attempts = await quizService.getAttempts(quiz.id);
              attemptsMap[quiz.id] = attempts;
            } catch {
              attemptsMap[quiz.id] = [];
            }
          })
        );
        setAttemptsByQuiz(attemptsMap);
      } catch {
        // silently handle
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizHistory();
  }, [studySetId]);

  const handleReview = useCallback(async (quiz: Quiz, attempt: QuizAttempt) => {
    setLoadingAttempt(attempt.id);
    try {
      const [detail, questions] = await Promise.all([
        quizService.getAttemptDetail(attempt.id),
        quizService.getQuestions(quiz.id),
      ]);
      setReviewData({
        quizTitle: quiz.title,
        attempt: detail.attempt,
        questions,
        answers: detail.answers,
      });
    } catch {
      // silently handle
    } finally {
      setLoadingAttempt(null);
    }
  }, []);

  const totalAttempts = Object.values(attemptsByQuiz).reduce((sum, a) => sum + a.length, 0);
  const bestScore = Object.values(attemptsByQuiz)
    .flat()
    .reduce((best, a) => Math.max(best, a.score || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-xl">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <History className="w-6 h-6 text-green-500" />
        </div>
        <h3 className="font-semibold mb-1">No quiz history yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Take a quiz to see your results here
        </p>
        <Button className="bg-green-500 hover:bg-green-600" asChild>
          <Link to={`/dashboard/study-sets/${studySetId}/quiz`}>
            <FileQuestion className="w-4 h-4 mr-2" />
            Take a Quiz
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <FileQuestion className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{quizzes.length}</p>
          <p className="text-xs text-muted-foreground">Quizzes</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{totalAttempts}</p>
          <p className="text-xs text-muted-foreground">Attempts</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{Math.round(bestScore)}%</p>
          <p className="text-xs text-muted-foreground">Best Score</p>
        </div>
      </div>

      {/* Quiz List */}
      <div className="space-y-3">
        {quizzes.map((quiz) => {
          const attempts = attemptsByQuiz[quiz.id] || [];
          const isExpanded = expandedQuiz === quiz.id;
          const topScore = attempts.reduce((best, a) => Math.max(best, a.score || 0), 0);

          return (
            <div
              key={quiz.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Quiz Header */}
              <button
                onClick={() => setExpandedQuiz(isExpanded ? null : quiz.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <FileQuestion className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{quiz.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {quiz.questionCount} questions
                      {attempts.length > 0 && ` · ${attempts.length} attempt${attempts.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {attempts.length > 0 && (
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        topScore >= 70
                          ? 'bg-green-500/10 text-green-600'
                          : topScore >= 40
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-red-500/10 text-red-600'
                      )}
                    >
                      Best: {Math.round(topScore)}%
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-90'
                    )}
                  />
                </div>
              </button>

              {/* Attempts List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border">
                      {attempts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No attempts yet
                        </p>
                      ) : (
                        <div className="divide-y divide-border">
                          {attempts.map((attempt) => {
                            const score = Math.round(attempt.score || 0);
                            const isLoadingThis = loadingAttempt === attempt.id;
                            return (
                              <button
                                key={attempt.id}
                                onClick={() => handleReview(quiz, attempt)}
                                disabled={isLoadingThis}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                                      score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                    )}
                                  >
                                    {score}%
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {new Date(attempt.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {attempt.totalQuestions} questions
                                      {attempt.timeSpent > 0 && ` · ${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  {isLoadingThis ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <span className="text-xs">Review</span>
                                      <Eye className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewData && (
          <AttemptReviewModal
            attempt={reviewData}
            onClose={() => setReviewData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──

type TabType = 'flashcards' | 'notes' | 'sources' | 'analytics' | 'history';
type FilterStatus = 'All' | 'New' | 'Learning' | 'Review' | 'Mastered' | 'Due';
type SortOption = 'newest' | 'oldest' | 'difficulty';

export function StudySetDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentStudySet,
    isLoading: studySetLoading,
    error: studySetError,
    fetchStudySet,
    deleteStudySet,
  } = useStudySetsStore();
  const {
    flashcards,
    isLoading: flashcardsLoading,
    fetchFlashcards,
    deleteFlashcard,
  } = useFlashcardsStore();
  const {
    notes,
    isLoading: notesLoading,
    fetchNotes,
    deleteNote,
    togglePin,
  } = useNotesStore();

  const [activeTab, setActiveTab] = useState<TabType>('flashcards');
  const [previewFlashcard, setPreviewFlashcard] = useState<Flashcard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Delete modal states
  const [deleteStudySetModalOpen, setDeleteStudySetModalOpen] = useState(false);
  const [deleteFlashcardModalOpen, setDeleteFlashcardModalOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live exam countdown timer
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Notes filtering/sorting
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteTagFilter, setNoteTagFilter] = useState<string | null>(null);
  const [noteSortOption, setNoteSortOption] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [showMindMap, setShowMindMap] = useState(false);

  useEffect(() => {
    if (!currentStudySet?.examDate) {
      setCountdown(null);
      return;
    }
    const examTime = new Date(currentStudySet.examDate).getTime();
    const tick = () => {
      const diff = examTime - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentStudySet?.examDate]);

  useEffect(() => {
    if (id) {
      fetchStudySet(id);
      fetchFlashcards(id);
      fetchNotes(id);
    }
  }, [id, fetchStudySet, fetchFlashcards, fetchNotes]);

  const handleDeleteStudySet = () => {
    setDeleteStudySetModalOpen(true);
  };

  const confirmDeleteStudySet = async () => {
    setIsDeleting(true);
    try {
      await deleteStudySet(id!);
      navigate('/dashboard/study-sets');
    } finally {
      setIsDeleting(false);
      setDeleteStudySetModalOpen(false);
    }
  };

  const handleDeleteFlashcard = (flashcardId: string) => {
    setFlashcardToDelete(flashcardId);
    setDeleteFlashcardModalOpen(true);
  };

  const confirmDeleteFlashcard = async () => {
    if (!flashcardToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFlashcard(flashcardToDelete);
      setPreviewFlashcard(null);
    } finally {
      setIsDeleting(false);
      setDeleteFlashcardModalOpen(false);
      setFlashcardToDelete(null);
    }
  };

  const dueCards = flashcards.filter(isFlashcardDue);

  // Notes filtering and all tags
  const allNoteTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Search
    if (noteSearchQuery.trim()) {
      const q = noteSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (noteTagFilter) {
      filtered = filtered.filter((note) => note.tags.includes(noteTagFilter));
    }

    // Sort (pinned always first)
    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (noteSortOption === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (noteSortOption === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [notes, noteSearchQuery, noteTagFilter, noteSortOption]);

  // Filter chip counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      All: flashcards.length,
      New: 0,
      Learning: 0,
      Review: 0,
      Mastered: 0,
      Due: 0,
    };
    flashcards.forEach((fc) => {
      const status = getFlashcardStatus(fc);
      counts[status as FilterStatus] = (counts[status as FilterStatus] || 0) + 1;
      if (isFlashcardDue(fc)) counts.Due++;
    });
    return counts;
  }, [flashcards]);

  // Filtered & sorted flashcards
  const filteredFlashcards = useMemo(() => {
    let filtered = [...flashcards];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fc) =>
          fc.front.toLowerCase().includes(q) ||
          fc.back.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filterStatus !== 'All') {
      if (filterStatus === 'Due') {
        filtered = filtered.filter(isFlashcardDue);
      } else {
        filtered = filtered.filter((fc) => getFlashcardStatus(fc) === filterStatus);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return b.difficulty - a.difficulty;
      }
    });

    return filtered;
  }, [flashcards, searchQuery, filterStatus, sortOption]);

  if (studySetLoading && !currentStudySet) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (studySetError || !currentStudySet) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{studySetError || t('common.error')}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/study-sets')}>
            {t('common.back')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'flashcards', label: t('dashboard.stats.flashcards') },
    { key: 'notes', label: t('notes.title') },
    { key: 'sources', label: 'Sources' },
    { key: 'analytics', label: t('analytics.title') },
    { key: 'history', label: t('quiz.title') + ' History' },
  ];

  const filterChips: FilterStatus[] = ['All', 'New', 'Learning', 'Review', 'Mastered', 'Due'];

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    difficulty: 'Difficulty',
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard/study-sets')}
            className="p-2 rounded-lg hover:bg-muted transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {currentStudySet.coverImageUrl ? (
                  <img
                    src={currentStudySet.coverImageUrl}
                    alt={currentStudySet.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Library className="w-8 h-8 text-green-500" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{currentStudySet.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {currentStudySet.isPublic ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />
                        {t('common.share')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/study-sets/${id}/edit`}>
                    <Edit className="w-4 h-4 mr-1" />
                    {t('common.edit')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteStudySet}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {currentStudySet.description && (
              <p className="text-muted-foreground mt-3">{currentStudySet.description}</p>
            )}
            {currentStudySet.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentStudySet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600 dark:text-green-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{flashcards.length}</p>
                <p className="text-sm text-muted-foreground">{t('dashboard.stats.flashcards')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentStudySet.documentsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Sources</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dueCards.length}</p>
                <p className="text-sm text-muted-foreground">{t('flashcards.dueForReview')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {flashcards.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <Button className="bg-green-500 hover:bg-green-600" asChild>
              <Link to={`/dashboard/study-sets/${id}/study`}>
                <Play className="w-4 h-4 mr-2" />
                {t('studySets.studySession')} ({dueCards.length > 0 ? `${dueCards.length} due` : 'All cards'})
              </Link>
            </Button>
            <Button variant="outline" className="border-green-500/30 text-green-600 hover:bg-green-500/10" asChild>
              <Link to={`/dashboard/study-sets/${id}/quiz`}>
                <FileQuestion className="w-4 h-4 mr-2" />
                Quiz Mode
              </Link>
            </Button>
            <Button variant="outline" className="border-green-500/30 text-green-600 hover:bg-green-500/10" asChild>
              <Link to={`/dashboard/study-sets/${id}/match`}>
                <Gamepad2 className="w-4 h-4 mr-2" />
                {t('studySets.matchGame')}
              </Link>
            </Button>
            <Button variant="outline" className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10" asChild>
              <Link to={`/dashboard/study-sets/${id}/live-quiz`}>
                <Users className="w-4 h-4 mr-2" />
                {t('quiz.liveQuiz')}
              </Link>
            </Button>
          </div>
        )}

        {/* Exam Countdown Banner */}
        {countdown && currentStudySet.examDate && (() => {
          const totalDays = countdown.days;
          const colorClass = totalDays > 14 ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' : totalDays > 7 ? 'from-amber-500/10 to-yellow-500/10 border-amber-500/20' : 'from-red-500/10 to-orange-500/10 border-red-500/20';
          const textColor = totalDays > 14 ? 'text-green-600 dark:text-green-400' : totalDays > 7 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
          const bgColor = totalDays > 14 ? 'bg-green-500/20' : totalDays > 7 ? 'bg-amber-500/20' : 'bg-red-500/20';
          const unitBoxBg = totalDays > 14 ? 'bg-green-500/10' : totalDays > 7 ? 'bg-amber-500/10' : 'bg-red-500/10';
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl bg-gradient-to-r ${colorClass} border mb-6`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                  <Calendar className={`w-5 h-5 ${textColor}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${textColor}`}>
                    {currentStudySet.examSubject || 'Exam'} Countdown
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(currentStudySet.examDate!).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Minutes' },
                  { value: countdown.seconds, label: 'Seconds' },
                ].map((unit) => (
                  <div key={unit.label} className={`${unitBoxBg} rounded-lg p-3 text-center`}>
                    <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${textColor}`}>
                      {String(unit.value).padStart(2, '0')}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors relative',
                activeTab === tab.key
                  ? 'text-green-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'flashcards' && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Add flashcard button */}
              <div className="flex justify-end mb-4">
                <Button variant="outline" asChild>
                  <Link to={`/dashboard/study-sets/${id}/flashcards/add`}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('studySets.addFlashcard')}
                  </Link>
                </Button>
              </div>

              {/* Search, Filter, Sort */}
              {flashcards.length > 0 && (
                <div className="space-y-3 mb-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search flashcards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  {/* Filter chips + Sort */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {filterChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setFilterStatus(chip)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            filterStatus === chip
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {chip} ({filterCounts[chip]})
                        </button>
                      ))}
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <SortAsc className="w-3.5 h-3.5" />
                        {sortLabels[sortOption]}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {showSortDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                          <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg z-50">
                            {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => { setSortOption(opt); setShowSortDropdown(false); }}
                                className={cn(
                                  'w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors',
                                  sortOption === opt && 'text-green-500 font-medium'
                                )}
                              >
                                {sortLabels[opt]}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Flashcards list */}
              {flashcardsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : flashcards.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold mb-1">{t('flashcards.noCardsDue')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first flashcard to start studying
                  </p>
                  <Button className="bg-green-500 hover:bg-green-600" asChild>
                    <Link to={`/dashboard/study-sets/${id}/flashcards/add`}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('studySets.addFlashcard')}
                    </Link>
                  </Button>
                </div>
              ) : filteredFlashcards.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No flashcards match your search or filter</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFlashcards.map((flashcard) => (
                    <FlashcardItem
                      key={flashcard.id}
                      flashcard={flashcard}
                      onEdit={() =>
                        navigate(`/dashboard/study-sets/${id}/flashcards/${flashcard.id}/edit`)
                      }
                      onDelete={() => handleDeleteFlashcard(flashcard.id)}
                      onPreview={() => setPreviewFlashcard(flashcard)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Notes Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredNotes.length} of {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </p>
                <div className="flex items-center gap-2">
                  {notes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMindMap(true)}
                      className="text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
                    >
                      <Network className="w-4 h-4 mr-1" />
                      Mind Map
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/study-sets/${id}/notes/generate`)}
                    className="text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Generate
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => navigate(`/dashboard/study-sets/${id}/notes/create`)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Search and Filter (only show if notes exist) */}
              {notes.length > 0 && (
                <div className="space-y-3 mb-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search notes..."
                      value={noteSearchQuery}
                      onChange={(e) => setNoteSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  {/* Tags and Sort */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* All filter */}
                      <button
                        onClick={() => setNoteTagFilter(null)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                          noteTagFilter === null
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        All
                      </button>
                      {/* Tag filters */}
                      {allNoteTags.slice(0, 5).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setNoteTagFilter(noteTagFilter === tag ? null : tag)}
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all',
                            noteTagFilter === tag
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </button>
                      ))}
                      {allNoteTags.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{allNoteTags.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Sort */}
                    <select
                      value={noteSortOption}
                      onChange={(e) => setNoteSortOption(e.target.value as 'newest' | 'oldest' | 'title')}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs outline-none focus:border-green-500"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="title">Title A-Z</option>
                    </select>
                  </div>
                </div>
              )}

              {notesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="w-6 h-6" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold mb-1">No notes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create notes to organize your learning material
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/study-sets/${id}/notes/generate`)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Generate
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => navigate(`/dashboard/study-sets/${id}/notes/create`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Manually
                    </Button>
                  </div>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No notes match your search</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'bg-card border border-border rounded-xl p-4 hover:border-green-500/30 transition-colors cursor-pointer group',
                        note.isPinned && 'border-amber-500/30 bg-amber-500/5'
                      )}
                      onClick={() => navigate(`/dashboard/study-sets/${id}/notes/${note.id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {note.isPinned && (
                              <Target className="w-3.5 h-3.5 text-amber-500" />
                            )}
                            {note.sourceType !== 'manual' && (
                              <span className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full',
                                note.sourceType === 'ai_generated' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'
                              )}>
                                {note.sourceType === 'ai_generated' && <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />}
                                {note.sourceType.replace('_', ' ')}
                              </span>
                            )}
                            <h4 className="font-medium truncate">{note.title}</h4>
                          </div>
                          {note.summary && (
                            <p className="text-xs text-purple-500/80 mb-1 line-clamp-1">
                              <Sparkles className="w-3 h-3 inline mr-1" />
                              {note.summary.substring(0, 80)}...
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {note.content.replace(/<[^>]*>/g, '').replace(/[#*_=]/g, '').substring(0, 150)}
                            {note.content.length > 150 ? '...' : ''}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                            {note.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteTagFilter(tag);
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer"
                              >
                                #{tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(note.id);
                            }}
                            className={cn(
                              'p-1.5 rounded-lg hover:bg-muted transition-colors',
                              note.isPinned ? 'text-amber-500' : 'text-muted-foreground'
                            )}
                            title={note.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Target className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/study-sets/${id}/notes/${note.id}/edit`);
                            }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this note?')) {
                                deleteNote(note.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'sources' && (
            <SourcesTab studySetId={id!} />
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AnalyticsTab flashcards={flashcards} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <QuizHistoryTab studySetId={id!} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFlashcard && (
          <FlashcardPreviewModal
            flashcard={previewFlashcard}
            onClose={() => setPreviewFlashcard(null)}
            onEdit={() =>
              navigate(`/dashboard/study-sets/${id}/flashcards/${previewFlashcard.id}/edit`)
            }
            onDelete={() => handleDeleteFlashcard(previewFlashcard.id)}
          />
        )}
      </AnimatePresence>

      {/* Delete Study Set Modal */}
      <DeleteConfirmModal
        open={deleteStudySetModalOpen}
        onOpenChange={setDeleteStudySetModalOpen}
        onConfirm={confirmDeleteStudySet}
        title={t('studySets.delete')}
        description={t('studySets.deleteConfirm')}
        isLoading={isDeleting}
      />

      {/* Delete Flashcard Modal */}
      <DeleteConfirmModal
        open={deleteFlashcardModalOpen}
        onOpenChange={setDeleteFlashcardModalOpen}
        onConfirm={confirmDeleteFlashcard}
        title={t('flashcards.deleteCard')}
        description={t('deleteConfirm.description')}
        isLoading={isDeleting}
      />

      {/* Mind Map View */}
      <AnimatePresence>
        {showMindMap && (
          <MindMapView
            notes={notes}
            onNoteClick={(noteId) => {
              setShowMindMap(false);
              navigate(`/dashboard/study-sets/${id}/notes/${noteId}`);
            }}
            onClose={() => setShowMindMap(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
