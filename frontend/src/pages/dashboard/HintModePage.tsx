import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import type { HintResponse, ProblemSession } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { ArrowLeft, Lightbulb, RotateCcw, ChevronRight, Eye } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

function RenderMath({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch { return <span key={i}>{part}</span>; }
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          try { return <InlineMath key={i} math={part.slice(1, -1)} />; } catch { return <span key={i}>{part}</span>; }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function HintModePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [session, setSession] = useState<ProblemSession | null>(null);
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [gettingHint, setGettingHint] = useState(false);
  const [isLastHint, setIsLastHint] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try { setSession(await problemSolverService.get(id)); } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    })();
  }, [id]);

  const getNextHint = async () => {
    if (!id) return;
    setGettingHint(true);
    try {
      const res = await problemSolverService.getNextHint(id);
      setHints(prev => [...prev, res]);
      setIsLastHint(res.isLastHint);
    } catch {
      // Silently ignore fetch errors
    }
    setGettingHint(false);
  };

  const resetHints = async () => {
    if (!id) return;
    try {
      await problemSolverService.resetHints(id);
      setHints([]);
      setIsLastHint(false);
    } catch {
      // Silently ignore reset errors
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> {t('hintMode.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('hintMode.subtitle')}</p>
          </div>
          {hints.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetHints}><RotateCcw className="w-4 h-4 mr-1" /> {t('hintMode.reset')}</Button>
          )}
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : !session ? (
          <div className="bg-card rounded-2xl border p-8 text-center text-muted-foreground">{t('hintMode.sessionNotFound')}</div>
        ) : (
          <div>
            {/* Problem */}
            <div className="bg-card rounded-2xl border p-5 mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{t('hintMode.problem')}</p>
              <p className="text-sm"><RenderMath text={session.problem} /></p>
            </div>

            {/* Hints */}
            <div className="space-y-4 mb-6">
              <AnimatePresence>
                {hints.map((h, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-amber-500">{h.hintNumber}</span>
                      </div>
                      <span className="text-sm font-medium">{t('hintMode.hintOf', { current: h.hintNumber, total: h.totalHintsNeeded })}</span>
                    </div>
                    <div className="text-sm"><RenderMath text={h.hint} /></div>
                    {h.nextHintPreview && !h.isLastHint && (
                      <p className="text-xs text-muted-foreground mt-3 italic">{t('hintMode.nextHintCovers', { preview: h.nextHintPreview })}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Progress */}
            {hints.length > 0 && (
              <div className="mb-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${(hints.length / (hints[hints.length - 1]?.totalHintsNeeded || 5)) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!isLastHint ? (
                <Button onClick={getNextHint} disabled={gettingHint} className="flex-1">
                  {gettingHint ? <><Spinner size="sm" className="mr-2" />{t('hintMode.thinking')}</> : hints.length === 0 ? (
                    <><Lightbulb className="w-4 h-4 mr-2" />{t('hintMode.getFirstHint')}</>
                  ) : (
                    <><ChevronRight className="w-4 h-4 mr-2" />{t('hintMode.nextHint')}</>
                  )}
                </Button>
              ) : (
                <div className="flex-1 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                  <p className="text-sm font-medium text-green-500">{t('hintMode.allHintsRevealed')}</p>
                </div>
              )}
              <Button variant="outline" onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)}>
                <Eye className="w-4 h-4 mr-2" /> {t('hintMode.seeSolution')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default HintModePage;
