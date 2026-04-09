import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  FileText,
  CheckCircle,
  Loader2,
  Circle,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { researchService } from '@/services/research';
import type { ResearchSession } from '@/services/research';
import { io } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';

const PHASES = [
  {
    key: 'planning',
    labelKey: 'researchProgress.planningAgent',
    descKey: 'researchProgress.planningDesc',
    icon: Brain,
    color: 'blue',
  },
  {
    key: 'researching',
    labelKey: 'researchProgress.researchAgent',
    descKey: 'researchProgress.researchDesc',
    icon: Search,
    color: 'amber',
  },
  {
    key: 'reporting',
    labelKey: 'researchProgress.reportingAgent',
    descKey: 'researchProgress.reportingDesc',
    icon: FileText,
    color: 'green',
  },
];

function getPhaseStatus(
  phaseKey: string,
  currentStage: string,
): 'pending' | 'active' | 'completed' {
  const order = ['planning', 'researching', 'reporting', 'completed'];
  const currentIdx = order.indexOf(currentStage);
  const phaseIdx = order.indexOf(phaseKey);

  if (currentStage === 'completed' || currentStage === 'synthesizing') {
    if (phaseKey === 'reporting' && currentStage === 'synthesizing') return 'active';
    return 'completed';
  }
  if (currentStage === phaseKey) return 'active';
  if (phaseIdx < currentIdx) return 'completed';
  return 'pending';
}

export function ResearchProgressPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [currentStage, setCurrentStage] = useState('pending');
  const [progressMessage, setProgressMessage] = useState('');
  const [percentage, setPercentage] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const startedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (!id) return;
    try {
      const data = await researchService.get(id);
      setSession(data);

      if (data.status === 'completed') {
        setCurrentStage('completed');
        setPercentage(100);
        return true;
      }
      if (data.status === 'failed') {
        setCurrentStage('failed');
        return true;
      }
      if (data.status !== 'pending') {
        setCurrentStage(data.status === 'synthesizing' ? 'reporting' : data.status);
      }
      return false;
    } catch {
      return false;
    }
  }, [id]);

  const startResearch = useCallback(() => {
    if (!id || startedRef.current) return;
    startedRef.current = true;
    // Fire-and-forget: don't await — the research pipeline is long-running.
    // Progress is tracked via WebSocket events + polling fallback.
    researchService.start(id).catch(() => {
      // HTTP may timeout but backend continues processing — polling will pick up status
    });
  }, [id]);

  // Connect WebSocket for real-time progress, then start research
  useEffect(() => {
    if (!id) return;

    // First fetch initial session state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchSession().then((done) => {
      if (done) return;

      // Set up WebSocket
      try {
        const url = new URL(API_CONFIG.baseURL);
        const wsUrl = url.origin + '/research';
        const token = localStorage.getItem('accessToken');
        const socket = io(wsUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          auth: { token },
        });

        socket.on('connect', () => {
          // Subscribe first, THEN start research
          socket.emit('subscribe', { sessionId: id });
          // Small delay to ensure subscription is processed before start
          setTimeout(() => startResearch(), 300);
        });

        socket.on('progress', (data: { stage: string; percentage: number; message: string }) => {
          setCurrentStage(data.stage);
          setPercentage(data.percentage);
          setProgressMessage(data.message);
        });

        socket.on('complete', () => {
          setCurrentStage('completed');
          setPercentage(100);
        });

        socket.on('connect_error', () => {
          // WebSocket failed — start via REST and rely on polling
          startResearch();
        });

        socketRef.current = socket;
      } catch {
        // WebSocket setup failed, start via REST
        startResearch();
      }

      // Poll as fallback
      pollRef.current = setInterval(async () => {
        const finished = await fetchSession();
        if (finished && pollRef.current) {
          clearInterval(pollRef.current);
        }
      }, 3000);
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      socketRef.current?.disconnect();
    };
  }, [id, fetchSession, startResearch]);

  // Redirect when complete
  useEffect(() => {
    if (currentStage === 'completed' && id) {
      const timer = setTimeout(() => {
        navigate(`/dashboard/research/report/${id}`, { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStage, id, navigate]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold mb-2">{t('researchProgress.title')}</h1>
          <p className="text-muted-foreground">
            {t('researchProgress.subtitle')}
          </p>
        </motion.div>

        {/* Query Preview */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl border border-border p-4 mb-8"
          >
            <p className="text-sm text-muted-foreground mb-1">{t('researchProgress.researchQuestion')}</p>
            <p className="text-sm font-medium line-clamp-3">{session.query}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium capitalize">
                {session.depth}
              </span>
            </div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{progressMessage || t('researchProgress.starting')}</span>
            <span className="text-xs font-medium">{percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Agent Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {PHASES.map((phase, idx) => {
            const status = getPhaseStatus(phase.key, currentStage);

            return (
              <div key={phase.key}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.1 }}
                  className={`bg-card rounded-2xl border p-5 transition-all duration-300 ${
                    status === 'active'
                      ? 'border-green-500/50 shadow-lg shadow-green-500/5'
                      : status === 'completed'
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        status === 'active'
                          ? 'bg-green-500/10'
                          : status === 'completed'
                            ? 'bg-green-500/10'
                            : 'bg-muted/50'
                      }`}
                    >
                      {status === 'active' ? (
                        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                      ) : status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t(phase.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {status === 'active'
                          ? t(phase.descKey) + '...'
                          : status === 'completed'
                            ? t('researchProgress.done')
                            : t('researchProgress.waiting')}
                      </p>
                    </div>

                    {status === 'active' && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                </motion.div>

                {idx < PHASES.length - 1 && (
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
          {currentStage === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-green-500">{t('researchProgress.researchComplete')}</p>
              <p className="text-sm text-muted-foreground">{t('researchProgress.redirectingToReport')}</p>
            </motion.div>
          )}

          {currentStage === 'failed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-semibold text-red-500">{t('researchProgress.researchFailed')}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('researchProgress.failedMessage')}
              </p>
              <button
                onClick={() => navigate('/dashboard/research')}
                className="text-sm text-green-500 font-medium hover:underline"
              >
                {t('researchProgress.startNewResearch')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {currentStage !== 'completed' &&
          currentStage !== 'failed' && (
            <div className="mt-6 flex justify-center">
              <Spinner size="sm" />
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}

export default ResearchProgressPage;
