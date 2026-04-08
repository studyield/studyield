import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OcclusionRegion } from '@/types';
import { Eye } from 'lucide-react';

interface ImageOcclusionViewerProps {
  imageUrl: string;
  regions: OcclusionRegion[];
  onAllRevealed?: () => void;
}

export function ImageOcclusionViewer({ imageUrl, regions, onAllRevealed }: ImageOcclusionViewerProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const handleReveal = (id: string) => {
    const newSet = new Set(revealedIds);
    newSet.add(id);
    setRevealedIds(newSet);
    if (newSet.size === regions.length) {
      onAllRevealed?.();
    }
  };

  const revealAll = () => {
    const all = new Set(regions.map((r) => r.id));
    setRevealedIds(all);
    onAllRevealed?.();
  };

  const revealedCount = revealedIds.size;

  return (
    <div className="space-y-4">
      {/* Image with occlusion overlays */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <img src={imageUrl} alt="Study image" className="w-full block" draggable={false} />
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {regions.map((r) => {
            const isRevealed = revealedIds.has(r.id);

            return (
              <g key={r.id}>
                <AnimatePresence mode="wait">
                  {!isRevealed ? (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleReveal(r.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={r.x}
                        y={r.y}
                        width={r.width}
                        height={r.height}
                        fill="rgba(34, 197, 94, 0.85)"
                        stroke="rgba(34, 197, 94, 1)"
                        strokeWidth={0.3}
                        rx={0.5}
                      />
                      <text
                        x={r.x + r.width / 2}
                        y={r.y + r.height / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize={Math.min(r.width / 3, r.height / 2.5, 4)}
                        fontWeight="bold"
                      >
                        ?
                      </text>
                    </motion.g>
                  ) : (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      fill="none"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth={0.3}
                      rx={0.5}
                    />
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Revealed labels */}
      {revealedCount > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {regions
            .filter((r) => revealedIds.has(r.id) && r.label)
            .map((r) => (
              <motion.span
                key={r.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20"
              >
                {r.label}
              </motion.span>
            ))}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-muted-foreground">
          {revealedCount} / {regions.length} regions revealed
        </span>
        {revealedCount < regions.length && (
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
