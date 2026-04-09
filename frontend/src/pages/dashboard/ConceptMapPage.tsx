import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import type { ConceptMap } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { ArrowLeft, GitBranch, ArrowRight, BookOpen, Lightbulb, Link2 } from 'lucide-react';

export function ConceptMapPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<ConceptMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await problemSolverService.getConceptMap(id);
        setData(res);
      } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    })();
  }, [id]);

  const diffColor = (d: string) => d === 'easy' ? 'border-green-500/30 bg-green-500/5' : d === 'hard' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5';
  const diffDot = (d: string) => d === 'easy' ? 'bg-green-500' : d === 'hard' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-500" /> {t('conceptMap.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('conceptMap.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !data ? (
          <div className="bg-card rounded-2xl border p-8 text-center text-muted-foreground">{t('conceptMap.failedToGenerate')}</div>
        ) : (
          <div className="space-y-6">
            {/* Central Topic */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 text-center">
              <Lightbulb className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold">{data.centralTopic}</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Prerequisites */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> {t('conceptMap.prerequisites')}
                </h3>
                <div className="space-y-3">
                  {data.prerequisites.map((c, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${diffColor(c.difficulty)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${diffDot(c.difficulty)}`} />
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4">{c.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Current Concepts */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> {t('conceptMap.currentConcepts')}
                </h3>
                <div className="space-y-3">
                  {data.currentConcepts.map((c, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${c.importance === 'core' ? 'border-purple-500/30 bg-purple-500/5' : 'border-border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${c.importance === 'core' ? 'bg-purple-500' : 'bg-muted-foreground'}`} />
                        <span className="font-medium text-sm">{c.name}</span>
                        {c.importance === 'core' && <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-500 rounded">{t('conceptMap.core')}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground pl-4">{c.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Next Concepts */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" /> {t('conceptMap.whatToLearnNext')}
                </h3>
                <div className="space-y-3">
                  {data.nextConcepts.map((c, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${diffColor(c.difficulty)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${diffDot(c.difficulty)}`} />
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-4">{c.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Related Concepts */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-2xl border p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> {t('conceptMap.relatedConcepts')}
                </h3>
                <div className="space-y-3">
                  {data.relatedConcepts.map((c, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{c.relationship}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ConceptMapPage;
