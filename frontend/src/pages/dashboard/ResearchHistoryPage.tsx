import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Trash2,
  Clock,
  FileText,
  Globe,
  BookOpen,
} from 'lucide-react';
import { researchService } from '@/services/research';
import type { ResearchSession } from '@/services/research';

const statusConfig: Record<string, { labelKey: string; color: string }> = {
  pending: { labelKey: 'researchHistory.statusPending', color: 'bg-yellow-500/10 text-yellow-500' },
  planning: { labelKey: 'researchHistory.statusPlanning', color: 'bg-blue-500/10 text-blue-500' },
  researching: { labelKey: 'researchHistory.statusResearching', color: 'bg-blue-500/10 text-blue-500' },
  synthesizing: { labelKey: 'researchHistory.statusSynthesizing', color: 'bg-purple-500/10 text-purple-500' },
  completed: { labelKey: 'researchHistory.statusCompleted', color: 'bg-green-500/10 text-green-500' },
  failed: { labelKey: 'researchHistory.statusFailed', color: 'bg-red-500/10 text-red-500' },
};

export function ResearchHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    researchService.list()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await researchService.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Silently ignore delete errors
    }
  };

  const handleClick = (session: ResearchSession) => {
    if (session.status === 'completed') {
      navigate(`/dashboard/research/report/${session.id}`);
    } else {
      navigate(`/dashboard/research/progress/${session.id}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/research')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('researchHistory.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {sessions.length !== 1
                ? t('researchHistory.sessionCountPlural', { count: sessions.length })
                : t('researchHistory.sessionCount', { count: sessions.length })}
            </p>
          </div>
        </motion.div>

        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t('researchHistory.noResearchYet')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('researchHistory.noResearchDesc')}
            </p>
            <Button
              onClick={() => navigate('/dashboard/research')}
              className="bg-green-500 hover:bg-green-600"
            >
              <Search className="w-4 h-4 mr-2" />
              {t('researchHistory.startResearch')}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, idx) => {
              const status = statusConfig[session.status] || statusConfig.pending;
              const kbCount = session.sources.filter((s) => s.type === 'knowledge_base').length;
              const webCount = session.sources.filter((s) => s.type === 'web').length;

              return (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + idx * 0.03 }}
                  onClick={() => handleClick(session)}
                  className="w-full bg-card rounded-2xl border border-border p-5 flex items-start gap-4 hover:border-muted-foreground/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    {session.status === 'completed' ? (
                      <FileText className="w-5 h-5 text-green-500" />
                    ) : (
                      <Search className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{session.query}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {t(status.labelKey)}
                      </span>
                      <span className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground capitalize">
                        {session.depth}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {session.sources.length > 0 && (
                      <div className="flex items-center gap-3 mt-2">
                        {kbCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="w-3 h-3" />
                            {t('researchHistory.kbCount', { count: kbCount })}
                          </span>
                        )}
                        {webCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            {t('researchHistory.webCount', { count: webCount })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ResearchHistoryPage;
