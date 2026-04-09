import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import type { FormulaCard } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { ArrowLeft, FlipVertical, BookOpen, Copy, Check } from 'lucide-react';
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

export function FormulaCardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cards, setCards] = useState<FormulaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await problemSolverService.getFormulaCards(id);
        setCards(res);
      } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    })();
  }, [id]);

  const toggleFlip = (i: number) => {
    setFlipped(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const copyCard = (card: FormulaCard, i: number) => {
    navigator.clipboard.writeText(`${card.front}\n\n${card.back}`);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const catColor = (c: string) => {
    const map: Record<string, string> = {
      formula: 'bg-blue-500/10 text-blue-500',
      theorem: 'bg-purple-500/10 text-purple-500',
      rule: 'bg-amber-500/10 text-amber-500',
      definition: 'bg-green-500/10 text-green-500',
      concept: 'bg-pink-500/10 text-pink-500',
    };
    return map[c] || 'bg-muted text-muted-foreground';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/dashboard/problem-solver/solution/${id}`)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" /> {t('formulaCards.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('formulaCards.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : cards.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center text-muted-foreground">{t('formulaCards.noFormulas')}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleFlip(i)}
                className="bg-card rounded-2xl border p-5 cursor-pointer hover:border-green-500/30 transition-colors min-h-[160px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor(card.category)}`}>
                    {card.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyCard(card, i); }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {copied === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    <FlipVertical className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>

                {flipped.has(i) ? (
                  <div className="flex-1 text-sm">
                    <RenderMath text={card.back} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg font-semibold text-center">
                      <RenderMath text={card.front} />
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  {flipped.has(i) ? t('formulaCards.tapToSeeFront') : t('formulaCards.tapToReveal')}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FormulaCardsPage;
