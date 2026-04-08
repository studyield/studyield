import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Filter,
  ChevronDown,
  Brain,
} from 'lucide-react';

const SUBJECT_FILTER_KEYS = ['all', 'mathematics', 'physics', 'chemistry', 'biology', 'computerScience', 'other'] as const;

export function ProblemHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sessions, fetchSessions, deleteSession, isLoading, error } =
    useProblemSolverStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const FILTER_KEY_TO_SUBJECT: Record<string, string> = {
    all: 'All',
    mathematics: 'Mathematics',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    computerScience: 'Computer Science',
    other: 'Other',
  };

  const filtered = sessions.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.finalAnswer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject =
      subjectFilter === 'all' || s.subject === FILTER_KEY_TO_SUBJECT[subjectFilter];
    return matchSearch && matchSubject;
  });

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    setDeleteId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return t('problemHistory.today');
    if (days === 1) return t('problemHistory.yesterday');
    if (days < 7) return t('problemHistory.daysAgo', { count: days });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/dashboard/problem-solver')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('problemHistory.backToProblemSolver')}
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t('problemHistory.title')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('problemHistory.problemsSolved', { count: sessions.length })}
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard/problem-solver')}>
              {t('problemHistory.solveNewProblem')}
            </Button>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('problemHistory.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm hover:bg-muted transition-colors"
            >
              <Filter className="w-4 h-4" />
              {t(`problemHistory.subjectFilters.${subjectFilter}`)}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 py-1 w-48">
                  {SUBJECT_FILTER_KEYS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSubjectFilter(s);
                        setShowFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                        subjectFilter === s ? 'text-green-500 font-medium' : ''
                      }`}
                    >
                      {t(`problemHistory.subjectFilters.${s}`)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {searchQuery || subjectFilter !== 'all'
                ? t('problemHistory.noProblemsMatch')
                : t('problemHistory.noProblemsYet')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || subjectFilter !== 'all'
                ? t('problemHistory.adjustSearch')
                : t('problemHistory.startFirst')}
            </p>
          </div>
        )}

        {/* Problem List */}
        <div className="space-y-3">
          {filtered.map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-card border border-border rounded-xl p-4 hover:border-green-500/30 transition-all cursor-pointer group"
              onClick={() => {
                if (session.status === 'completed') {
                  navigate(`/dashboard/problem-solver/solution/${session.id}`);
                } else if (
                  session.status === 'analyzing' ||
                  session.status === 'solving' ||
                  session.status === 'verifying'
                ) {
                  navigate(`/dashboard/problem-solver/solve/${session.id}`);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(session.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{session.problem}</p>
                  {session.finalAnswer && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {t('problemHistory.answer')} {session.finalAnswer}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {session.subject && (
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full text-xs font-medium">
                        {session.subject}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Delete Confirmation */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="font-semibold mb-2">{t('problemHistory.deleteProblem')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('problemHistory.deleteConfirmation')}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteId(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={() => handleDelete(deleteId)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ProblemHistoryPage;
