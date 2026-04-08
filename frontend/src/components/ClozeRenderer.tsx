import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderClozeWithBlanks } from '@/types';
import { Eye } from 'lucide-react';

interface ClozeRendererProps {
  text: string;
  onAllRevealed?: () => void;
}

export function ClozeRenderer({ text, onAllRevealed }: ClozeRendererProps) {
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const { segments } = renderClozeWithBlanks(text, revealedIndices);
  const totalBlanks = segments.filter((s) => s.isBlank).length;
  const revealedCount = revealedIndices.size;

  const handleReveal = (index: number) => {
    const newSet = new Set(revealedIndices);
    newSet.add(index);
    setRevealedIndices(newSet);
    if (newSet.size === totalBlanks) {
      onAllRevealed?.();
    }
  };

  const revealAll = () => {
    const all = new Set<number>();
    segments.forEach((s) => { if (s.isBlank) all.add(s.index); });
    setRevealedIndices(all);
    onAllRevealed?.();
  };

  return (
    <div className="space-y-4">
      {/* Cloze text */}
      <div className="text-lg leading-relaxed text-center px-4">
        {segments.map((seg, i) => {
          if (!seg.isBlank) {
            return <span key={i}>{seg.text}</span>;
          }

          const isRevealed = revealedIndices.has(seg.index);

          return (
            <AnimatePresence mode="wait" key={i}>
              {isRevealed ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-2 py-0.5 mx-0.5 bg-green-500/15 border border-green-500/30 rounded-md text-green-600 dark:text-green-400 font-semibold"
                >
                  {seg.answer}
                </motion.span>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReveal(seg.index)}
                  className="inline-block px-3 py-0.5 mx-0.5 bg-muted border-2 border-dashed border-green-500/40 rounded-md text-muted-foreground hover:border-green-500 hover:bg-green-500/5 transition-colors cursor-pointer min-w-[60px] text-center"
                >
                  ?
                </motion.button>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Progress + Reveal All */}
      <div className="flex items-center justify-between px-4">
        <span className="text-xs text-muted-foreground">
          {revealedCount} / {totalBlanks} revealed
        </span>
        {revealedCount < totalBlanks && (
          <button
            onClick={revealAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Reveal all
          </button>
        )}
      </div>
    </div>
  );
}
