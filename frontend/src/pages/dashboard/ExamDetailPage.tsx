import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  ArrowLeft,
  FileText,
  Loader2,
  Play,
  Sparkles,
  BookOpen,
  BarChart3,
  Target,
  Brain,
  CheckCircle,
  ChevronDown,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Award,
  Zap,
  Download,
} from 'lucide-react';
import { exportQuestionsToPdf } from '@/utils/exportPdf';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface ExamStyle {
  questionTypes: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  averageQuestionLength: number;
  topicsCovered: string[];
  formatPatterns: string[];
  languageStyle: string;
}

interface ExamClone {
  id: string;
  title: string;
  subject: string | null;
  extractedStyle: ExamStyle | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalQuestionCount: number;
  generatedQuestionCount: number;
  createdAt: string;
}

interface ExamQuestion {
  id: string;
  examCloneId: string;
  isOriginal: boolean;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  topic: string | null;
  order: number;
}

interface Analytics {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  topicPerformance: Array<{ topic: string; correct: number; total: number; percentage: number }>;
  difficultyPerformance: Array<{ difficulty: string; correct: number; total: number; percentage: number }>;
  recentAttempts: Array<{ id: string; score: number; createdAt: string }>;
  improvementTrend: number;
}

interface ExamTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  questionTypes: string[];
  difficultyDistribution: { easy: number; medium: number; hard: number };
  subjects: string[];
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-500 border-red-500/20',
};


const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  short_answer: 'Short Answer',
  true_false: 'True/False',
  essay: 'Essay',
  fill_blank: 'Fill in the Blank',
};

type TabType = 'original' | 'generated' | 'analytics';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exam, setExam] = useState<ExamClone | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('original');

  const fetchExam = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [examRes, questionsRes] = await Promise.all([
        api.get<ExamClone>(ENDPOINTS.examClone.get(id)),
        api.get<ExamQuestion[]>(ENDPOINTS.examClone.questions(id)),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      console.error('Failed to fetch exam:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchAnalytics = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<Analytics>(ENDPOINTS.examClone.analytics(id));
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchAnalytics]);

  const handleGenerateSuccess = (newQuestions: ExamQuestion[]) => {
    setQuestions((prev) => [...prev, ...newQuestions]);
    if (exam) {
      setExam({
        ...exam,
        generatedQuestionCount: exam.generatedQuestionCount + newQuestions.length,
      });
    }
    setShowGenerateModal(false);
    setActiveTab('generated');
  };

  const originalQuestions = questions.filter((q) => q.isOriginal);
  const generatedQuestions = questions.filter((q) => !q.isOriginal);
  const displayedQuestions = activeTab === 'original' ? originalQuestions : generatedQuestions;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">{t('examDetail.examNotFound')}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/exam-clone')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('examDetail.backToExams')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/exam-clone')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            {exam.subject && <p className="text-muted-foreground">{exam.subject}</p>}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('examDetail.exportPdf')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/exam-clone/review-queue')}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('examDetail.reviewQueue')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/exam-clone/${id}/live`)}
          >
            <Users className="w-4 h-4 mr-2" />
            {t('examDetail.liveSession')}
          </Button>
          <Button
            onClick={() => navigate(`/dashboard/exam-clone/${id}/practice`)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {t('examDetail.practice')}
          </Button>
        </div>

        {/* Style Analysis */}
        {exam.extractedStyle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 mb-6"
          >
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              {t('examDetail.examStyleAnalysis')}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Question Types */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('examDetail.questionTypes')}</h3>
                <div className="flex flex-wrap gap-2">
                  {exam.extractedStyle.questionTypes.map((type, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs font-medium"
                    >
                      {QUESTION_TYPE_LABELS[type] || type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('examDetail.difficultyDistribution')}</h3>
                <div className="space-y-2">
                  {(['easy', 'medium', 'hard'] as const).map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <span className="text-xs capitalize w-16">{level}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            level === 'easy' && 'bg-green-500',
                            level === 'medium' && 'bg-amber-500',
                            level === 'hard' && 'bg-red-500'
                          )}
                          style={{ width: `${exam.extractedStyle?.difficultyDistribution[level] || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {exam.extractedStyle?.difficultyDistribution[level] || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('examDetail.topicsCovered')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {exam.extractedStyle.topicsCovered.slice(0, 6).map((topic, i) => (
                    <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                      {topic}
                    </span>
                  ))}
                  {exam.extractedStyle.topicsCovered.length > 6 && (
                    <span className="text-xs text-muted-foreground">
                      {t('examDetail.more', { count: exam.extractedStyle.topicsCovered.length - 6 })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{originalQuestions.length}</p>
                <p className="text-xs text-muted-foreground">{t('examDetail.original')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{generatedQuestions.length}</p>
                <p className="text-xs text-muted-foreground">{t('examDetail.generated')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{questions.length}</p>
                <p className="text-xs text-muted-foreground">{t('examDetail.total')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.bestScore || 0}%</p>
                <p className="text-xs text-muted-foreground">{t('examDetail.bestScore')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('original')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'original'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                {t('examDetail.original')} ({originalQuestions.length})
              </button>
              <button
                onClick={() => setActiveTab('generated')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'generated'
                    ? 'bg-green-500/10 text-green-500'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                {t('examDetail.generated')} ({generatedQuestions.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'analytics'
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                {t('examDetail.analytics')}
              </button>
            </div>
            {activeTab !== 'analytics' && (
              <Button onClick={() => setShowGenerateModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {t('examDetail.generateMore')}
              </Button>
            )}
          </div>

          {/* Content */}
          {activeTab === 'analytics' ? (
            <AnalyticsTab analytics={analytics} examId={id!} />
          ) : (
            <QuestionsTab
              questions={displayedQuestions}
              activeTab={activeTab}
              expandedQuestion={expandedQuestion}
              setExpandedQuestion={setExpandedQuestion}
            />
          )}
        </div>

        {/* Generate Modal */}
        <AnimatePresence>
          {showGenerateModal && exam && (
            <GenerateQuestionsModal
              examId={exam.id}
              style={exam.extractedStyle}
              onClose={() => setShowGenerateModal(false)}
              onSuccess={handleGenerateSuccess}
            />
          )}
        </AnimatePresence>

        {/* Export PDF Modal */}
        <AnimatePresence>
          {showExportModal && exam && (
            <ExportPdfModal
              exam={exam}
              questions={questions}
              onClose={() => setShowExportModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

// Export PDF Modal Component
function ExportPdfModal({
  exam,
  questions,
  onClose,
}: {
  exam: ExamClone;
  questions: ExamQuestion[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'original' | 'generated'>('all');

  const handleExport = () => {
    let filteredQuestions = questions;
    if (questionFilter === 'original') {
      filteredQuestions = questions.filter((q) => q.isOriginal);
    } else if (questionFilter === 'generated') {
      filteredQuestions = questions.filter((q) => !q.isOriginal);
    }

    exportQuestionsToPdf(filteredQuestions, {
      title: exam.title,
      subject: exam.subject || undefined,
      includeAnswers,
      includeExplanations,
    });

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">{t('examDetail.exportToPdf')}</h2>
              <p className="text-xs text-muted-foreground">{t('examDetail.questionsAvailable', { count: questions.length })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Question Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('examDetail.includeQuestions')}</label>
            <div className="flex gap-2">
              {(['all', 'original', 'generated'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQuestionFilter(filter)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors capitalize',
                    questionFilter === filter
                      ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                      : 'border-border hover:border-purple-500/50'
                  )}
                >
                  {filter} ({filter === 'all'
                    ? questions.length
                    : filter === 'original'
                    ? questions.filter((q) => q.isOriginal).length
                    : questions.filter((q) => !q.isOriginal).length})
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={(e) => setIncludeAnswers(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <span className="text-sm font-medium">{t('examDetail.includeAnswers')}</span>
                <p className="text-xs text-muted-foreground">{t('examDetail.showCorrectAnswers')}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExplanations}
                onChange={(e) => setIncludeExplanations(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <span className="text-sm font-medium">{t('examDetail.includeExplanations')}</span>
                <p className="text-xs text-muted-foreground">{t('examDetail.addExplanations')}</p>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-1">{t('examDetail.exportPreview')}</p>
            <p className="text-muted-foreground">
              {questionFilter === 'all'
                ? questions.length
                : questionFilter === 'original'
                ? questions.filter((q) => q.isOriginal).length
                : questions.filter((q) => !q.isOriginal).length}{' '}
              {t('examDetail.questions')} {includeAnswers ? t('examDetail.withAnswers') : t('examDetail.withoutAnswers')}
              {includeExplanations ? ` ${t('examDetail.andExplanations')}` : ''}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleExport} className="bg-green-500 hover:bg-green-600">
            <Download className="w-4 h-4 mr-2" />
            {t('examDetail.exportPdf')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ analytics }: { analytics: Analytics | null }) {
  const { t } = useTranslation();
  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">{t('examDetail.noPracticeData')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('examDetail.noPracticeDataDesc')}
        </p>
      </div>
    );
  }

  const scoreData = analytics.recentAttempts
    .slice()
    .reverse()
    .map((a, i) => ({
      attempt: i + 1,
      score: a.score,
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">{t('examDetail.totalAttempts')}</span>
          </div>
          <p className="text-2xl font-bold">{analytics.totalAttempts}</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">{t('examDetail.averageScore')}</span>
          </div>
          <p className="text-2xl font-bold">{analytics.averageScore}%</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">{t('examDetail.bestScore')}</span>
          </div>
          <p className="text-2xl font-bold">{analytics.bestScore}%</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {analytics.improvementTrend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">{t('examDetail.trend')}</span>
          </div>
          <p className={cn('text-2xl font-bold', analytics.improvementTrend >= 0 ? 'text-green-500' : 'text-red-500')}>
            {analytics.improvementTrend >= 0 ? '+' : ''}{analytics.improvementTrend}%
          </p>
        </div>
      </div>

      {/* Score History Chart */}
      {scoreData.length > 1 && (
        <div>
          <h3 className="font-medium mb-4">{t('examDetail.scoreHistory')}</h3>
          <div className="h-64 bg-muted/30 rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="attempt" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Topic & Difficulty Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Topic Performance */}
        {analytics.topicPerformance.length > 0 && (
          <div>
            <h3 className="font-medium mb-4">{t('examDetail.performanceByTopic')}</h3>
            <div className="space-y-3">
              {analytics.topicPerformance.map((topic) => (
                <div key={topic.topic}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{topic.topic}</span>
                    <span className={cn(
                      'font-medium',
                      topic.percentage >= 70 ? 'text-green-500' : topic.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                    )}>
                      {topic.percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        topic.percentage >= 70 ? 'bg-green-500' : topic.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${topic.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Performance */}
        {analytics.difficultyPerformance.length > 0 && (
          <div>
            <h3 className="font-medium mb-4">{t('examDetail.performanceByDifficulty')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.difficultyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="difficulty" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="percentage" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Time Spent */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
        <Clock className="w-8 h-8 text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">{t('examDetail.totalStudyTime')}</p>
          <p className="text-xl font-bold">
            {Math.floor(analytics.totalTimeSpent / 3600)}h {Math.floor((analytics.totalTimeSpent % 3600) / 60)}m
          </p>
        </div>
      </div>
    </div>
  );
}

// Questions Tab Component
function QuestionsTab({
  questions,
  activeTab,
  expandedQuestion,
  setExpandedQuestion,
}: {
  questions: ExamQuestion[];
  activeTab: string;
  expandedQuestion: string | null;
  setExpandedQuestion: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {activeTab === 'generated'
            ? t('examDetail.noGeneratedQuestions')
            : t('examDetail.noQuestionsFound')}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {questions.map((question, index) => (
        <motion.div
          key={question.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.02 }}
          className="p-4 hover:bg-muted/30 transition-colors"
        >
          <div
            className="flex items-start gap-4 cursor-pointer"
            onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
          >
            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm', expandedQuestion !== question.id && 'line-clamp-2')}>
                {question.question}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {QUESTION_TYPE_LABELS[question.type] || question.type}
                </span>
                <span className={cn('px-2 py-0.5 rounded text-xs border', DIFFICULTY_COLORS[question.difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-muted')}>
                  {question.difficulty}
                </span>
                {question.topic && (
                  <span className="text-xs text-muted-foreground">{question.topic}</span>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform flex-shrink-0',
                expandedQuestion === question.id && 'rotate-180'
              )}
            />
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expandedQuestion === question.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 ml-12 space-y-3">
                  {question.options && question.options.length > 0 && (
                    <div className="space-y-1.5">
                      {question.options.map((opt, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg text-sm',
                            opt === question.correctAnswer
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-muted/50'
                          )}
                        >
                          <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-medium">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                          {opt === question.correctAnswer && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!question.options && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-xs font-medium text-green-500 mb-1">{t('examDetail.correctAnswer')}</p>
                      <p className="text-sm">{question.correctAnswer}</p>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs font-medium text-blue-500 mb-1">{t('examDetail.explanation')}</p>
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// Generate Questions Modal with Template Support
function GenerateQuestionsModal({
  examId,
  style,
  onClose,
  onSuccess,
}: {
  examId: string;
  style: ExamStyle | null;
  onClose: () => void;
  onSuccess: (questions: ExamQuestion[]) => void;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'standard' | 'template'>('standard');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'match_original' | 'easy' | 'medium' | 'hard'>('match_original');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get<ExamTemplate[]>(ENDPOINTS.examClone.templates);
        setTemplates(res.data);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      let response;
      if (mode === 'template' && selectedTemplate) {
        response = await api.post<ExamQuestion[]>(ENDPOINTS.examClone.generateFromTemplate(examId), {
          templateSlug: selectedTemplate,
          subject: templateSubject || 'General',
          count,
        });
      } else {
        response = await api.post<ExamQuestion[]>(ENDPOINTS.examClone.generate(examId), {
          count,
          difficulty,
          topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        });
      }
      onSuccess(response.data);
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError(t('examDetail.failedToGenerate'));
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const selectedTemplateData = templates.find((t) => t.slug === selectedTemplate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">{t('examDetail.generateQuestions')}</h2>
              <p className="text-xs text-muted-foreground">{t('examDetail.aiWillCreate')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('examDetail.generationMode')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('standard')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  mode === 'standard'
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : 'border-border hover:border-green-500/50'
                )}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                {t('examDetail.matchExamStyle')}
              </button>
              <button
                onClick={() => setMode('template')}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  mode === 'template'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                    : 'border-border hover:border-purple-500/50'
                )}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                {t('examDetail.useTemplate')}
              </button>
            </div>
          </div>

          {/* Count */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('examDetail.numberOfQuestions')}</label>
            <div className="flex gap-2">
              {[5, 10, 15, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                    count === n
                      ? 'border-green-500 bg-green-500/10 text-green-500'
                      : 'border-border hover:border-green-500/50'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {mode === 'standard' ? (
            <>
              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('examDetail.difficulty')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'match_original', label: t('examDetail.matchOriginal') },
                    { value: 'easy', label: t('examDetail.easy') },
                    { value: 'medium', label: t('examDetail.medium') },
                    { value: 'hard', label: t('examDetail.hard') },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDifficulty(opt.value as typeof difficulty)}
                      className={cn(
                        'py-2 rounded-lg border text-sm font-medium transition-colors',
                        difficulty === opt.value
                          ? 'border-green-500 bg-green-500/10 text-green-500'
                          : 'border-border hover:border-green-500/50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              {style?.topicsCovered && style.topicsCovered.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">{t('examDetail.topicsOptional')}</label>
                  <div className="flex flex-wrap gap-2">
                    {style.topicsCovered.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          selectedTopics.includes(topic)
                            ? 'bg-purple-500 text-white'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('examDetail.selectTemplate')}</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {templates.map((template) => (
                    <button
                      key={template.slug}
                      onClick={() => setSelectedTemplate(template.slug)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors',
                        selectedTemplate === template.slug
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50'
                      )}
                    >
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject for Template */}
              {selectedTemplateData && (
                <div>
                  <label className="block text-sm font-medium mb-2">{t('examDetail.subject')}</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplateData.subjects.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => setTemplateSubject(subject)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                          templateSubject === subject
                            ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                            : 'border-border hover:border-purple-500/50'
                        )}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (mode === 'template' && !selectedTemplate)}
            className={mode === 'template' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-green-500 hover:bg-green-600'}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('examDetail.generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t('examDetail.generateCountQuestions', { count })}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
