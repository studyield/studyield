import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { motion } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import {
  ArrowLeft,
  Lightbulb,
  Sparkles,
  BarChart3,
  ChevronRight,
  Info,
} from 'lucide-react';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

export function SimilarProblemsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentSession, similarProblems, fetchSession, fetchSimilarProblems } =
    useProblemSolverStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      if (!currentSession || currentSession.id !== id) {
        await fetchSession(id);
      }
      await fetchSimilarProblems(id);
      setIsLoading(false);
    };
    load();
  }, [id, currentSession, fetchSession, fetchSimilarProblems]);

  const handleSolveSimilar = async (problem: string) => {
    const { createAndSolve } = useProblemSolverStore.getState();
    const sessionId = await createAndSolve(problem, currentSession?.subject || undefined);
    if (sessionId) {
      navigate(`/dashboard/problem-solver/solve/${sessionId}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('similarProblems.backToSolution')}
          </button>

          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            {t('similarProblems.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('similarProblems.subtitle')}
          </p>
        </motion.div>

        {/* Original Problem */}
        {currentSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-muted/30 border border-border rounded-xl p-4 mb-6"
          >
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
              {t('similarProblems.originalProblem')}
            </p>
            <p className="text-sm">{currentSession.problem}</p>
          </motion.div>
        )}

        {/* Similar Problems */}
        {similarProblems.length > 0 ? (
          <div className="space-y-4">
            {similarProblems.map((problem, idx) => {
              const diffColor = DIFFICULTY_COLORS[problem.difficulty] || 'amber';
              const diffLabel = t(`similarProblems.difficulty.${problem.difficulty || 'medium'}`);
              return (
                <motion.div
                  key={problem.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 hover:border-green-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${diffColor}-500/10 text-${diffColor}-500`}
                        >
                          {diffLabel}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{problem.problem}</p>
                      {problem.similarity && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <Info className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            {problem.similarity}
                          </p>
                        </div>
                      )}
                      {problem.hint && (
                        <p className="text-xs text-amber-500 mt-2 italic">
                          {t('similarProblems.hint')} {problem.hint}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSolveSimilar(problem.problem)}
                      className="shrink-0"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('similarProblems.solve')}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {t('similarProblems.generating')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('similarProblems.generatingDesc')}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => id && fetchSimilarProblems(id)}
            >
              {t('similarProblems.retry')}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SimilarProblemsPage;
