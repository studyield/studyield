import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Circle,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

const AGENTS = [
  {
    key: 'analysis',
    stage: 'analyzing',
    labelKey: 'solvingProgress.agents.analysisLabel',
    descKey: 'solvingProgress.agents.analysisDesc',
    icon: Brain,
    color: 'blue',
  },
  {
    key: 'solving',
    stage: 'solving',
    labelKey: 'solvingProgress.agents.solverLabel',
    descKey: 'solvingProgress.agents.solverDesc',
    icon: Zap,
    color: 'amber',
  },
  {
    key: 'verification',
    stage: 'verifying',
    labelKey: 'solvingProgress.agents.verifierLabel',
    descKey: 'solvingProgress.agents.verifierDesc',
    icon: ShieldCheck,
    color: 'green',
  },
];

function getAgentStatus(
  agentStage: string,
  currentStage: string,
  stageResults: Record<string, unknown>,
) {
  const order = ['analyzing', 'solving', 'verifying', 'completed', 'failed'];
  const currentIdx = order.indexOf(currentStage);
  const agentIdx = order.indexOf(agentStage);

  if (stageResults[agentStage.replace('ing', '').replace('ify', 'ification')])
    return 'completed';
  // Map agent key to check results
  const resultKeyMap: Record<string, string> = {
    analyzing: 'analysis',
    solving: 'solving',
    verifying: 'verification',
  };
  if (stageResults[resultKeyMap[agentStage]]) return 'completed';
  if (currentStage === agentStage) return 'active';
  if (agentIdx > currentIdx) return 'pending';
  return 'completed';
}

export function SolvingProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    currentSession,
    solveStage,
    streamChunks,
    stageResults,
    fetchSession,
    solveWithStream,
  } = useProblemSolverStore();

  useEffect(() => {
    if (!id) return;

    // If we don't have a current session or stage is idle, check the session
    if (!currentSession || currentSession.id !== id) {
      fetchSession(id).then(() => {
        const session = useProblemSolverStore.getState().currentSession;
        if (session?.status === 'completed') {
          navigate(`/dashboard/problem-solver/solution/${id}`, { replace: true });
        } else if (session?.status === 'pending') {
          solveWithStream(id);
        }
      });
    }
  }, [id, currentSession, fetchSession, navigate, solveWithStream]);

  useEffect(() => {
    if (solveStage === 'completed' && id) {
      const timer = setTimeout(() => {
        navigate(`/dashboard/problem-solver/solution/${id}`, { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [solveStage, id, navigate]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">{t('solvingProgress.title')}</h1>
          <p className="text-muted-foreground">
            {t('solvingProgress.subtitle')}
          </p>
        </motion.div>

        {/* Problem Preview */}
        {currentSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl border border-border p-4 mb-8"
          >
            <p className="text-sm text-muted-foreground mb-1">{t('solvingProgress.problemLabel')}</p>
            <p className="text-sm font-medium line-clamp-3">
              {currentSession.problem}
            </p>
            {currentSession.subject && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full text-xs font-medium">
                {currentSession.subject}
              </span>
            )}
          </motion.div>
        )}

        {/* Agent Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {AGENTS.map((agent, idx) => {
            const status = getAgentStatus(agent.stage, solveStage, stageResults);
            const chunkText = streamChunks[agent.key] || '';

            return (
              <div key={agent.key}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.1 }}
                  className={`bg-card rounded-2xl border p-5 transition-all duration-300 ${
                    status === 'active'
                      ? `border-${agent.color}-500/50 shadow-lg shadow-${agent.color}-500/5`
                      : status === 'completed'
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Status icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        status === 'active'
                          ? `bg-${agent.color}-500/10`
                          : status === 'completed'
                            ? 'bg-green-500/10'
                            : 'bg-muted/50'
                      }`}
                    >
                      {status === 'active' ? (
                        <Loader2 className={`w-5 h-5 text-${agent.color}-500 animate-spin`} />
                      ) : status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t(agent.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {status === 'active'
                          ? t(agent.descKey) + '...'
                          : status === 'completed'
                            ? t('solvingProgress.done')
                            : t('solvingProgress.waiting')}
                      </p>
                    </div>

                    {/* Confidence badge */}
                    {status === 'completed' && stageResults[agent.key] && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
                        {((stageResults[agent.key] as { confidence?: number })?.confidence ?? 0.9) * 100 | 0}%
                      </span>
                    )}
                  </div>

                  {/* Streaming partial text */}
                  <AnimatePresence>
                    {status === 'active' && chunkText && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-border"
                      >
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                          {chunkText}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Arrow between agents */}
                {idx < AGENTS.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Completed / Failed state */}
        <AnimatePresence>
          {solveStage === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-green-500">{t('solvingProgress.solutionReady')}</p>
              <p className="text-sm text-muted-foreground">{t('solvingProgress.redirecting')}</p>
            </motion.div>
          )}

          {solveStage === 'failed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-semibold text-red-500">{t('solvingProgress.solvingFailed')}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('solvingProgress.failedMessage')}
              </p>
              <button
                onClick={() => navigate('/dashboard/problem-solver')}
                className="text-sm text-green-500 font-medium hover:underline"
              >
                {t('solvingProgress.tryAnother')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {solveStage !== 'completed' &&
          solveStage !== 'failed' &&
          solveStage !== 'idle' && (
            <div className="mt-6 flex justify-center">
              <Spinner size="sm" />
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}

export default SolvingProgressPage;
