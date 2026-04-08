import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlashcardsStore } from '@/stores/useFlashcardsStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ClozeRenderer } from '@/components/ClozeRenderer';
import { ImageOcclusionViewer } from '@/components/ImageOcclusionViewer';
import { cn } from '@/lib/utils';
import type { OcclusionRegion } from '@/types';
import { hasClozeMarkers } from '@/types';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trophy,
  Target,
  Brain,
  ChevronLeft,
  SkipForward,
  Zap,
} from 'lucide-react';

// SM-2 Quality ratings
const qualityRatings = [
  { quality: 1 as const, labelKey: 'studySession.again', descKey: 'studySession.againDesc', icon: XCircle, color: 'bg-red-500' },
  { quality: 2 as const, labelKey: 'studySession.hard', descKey: 'studySession.hardDesc', icon: ThumbsDown, color: 'bg-orange-500' },
  { quality: 3 as const, labelKey: 'studySession.good', descKey: 'studySession.goodDesc', icon: ThumbsUp, color: 'bg-amber-500' },
  { quality: 4 as const, labelKey: 'studySession.easy', descKey: 'studySession.easyDesc', icon: CheckCircle, color: 'bg-green-500' },
  { quality: 5 as const, labelKey: 'studySession.perfect', descKey: 'studySession.perfectDesc', icon: Sparkles, color: 'bg-emerald-500' },
];

function FlipCard({
  front,
  back,
  notes,
  isFlipped,
  onFlip,
}: {
  front: string;
  back: string;
  notes?: string;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="relative w-full max-w-xl mx-auto h-48 md:h-56 cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-2xl border-2 border-border bg-card p-6 flex flex-col items-center justify-center backface-hidden',
            !isFlipped && 'shadow-lg'
          )}
        >
          <span className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {t('studySession.question')}
          </span>
          <p className="text-lg md:text-xl font-medium text-center line-clamp-4">{front}</p>
          <p className="text-xs text-muted-foreground mt-3 opacity-60">{t('studySession.tapToFlip')}</p>
        </div>

        {/* Back */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full rounded-2xl border-2 border-green-500/50 bg-card p-6 flex flex-col items-center justify-center backface-hidden',
            isFlipped && 'shadow-lg'
          )}
          style={{ transform: 'rotateY(180deg)' }}
        >
          <span className="text-xs uppercase tracking-wider text-green-500 mb-2">
            {t('studySession.answer')}
          </span>
          <p className="text-lg md:text-xl font-medium text-center line-clamp-3">{back}</p>
          {notes && (
            <p className="text-xs text-muted-foreground mt-2 text-center line-clamp-2">{notes}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SessionComplete({
  stats,
  studySetId,
  onRestart,
  xpEarned,
}: {
  stats: { reviewed: number; correct: number; incorrect: number };
  studySetId: string;
  onRestart: () => void;
  xpEarned: number;
}) {
  const { t } = useTranslation();
  const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md mx-auto"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
        <Trophy className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t('studySession.sessionComplete')}</h2>
      <p className="text-muted-foreground mb-4">{t('studySession.greatJobReviewing')}</p>

      {xpEarned > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
        >
          <Zap className="w-5 h-5 text-green-500" />
          <span className="font-bold text-green-600 dark:text-green-400">{t('studySession.xpEarned', { xp: xpEarned })}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{stats.reviewed}</p>
          <p className="text-xs text-muted-foreground">{t('studySession.reviewed')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{stats.correct}</p>
          <p className="text-xs text-muted-foreground">{t('studySession.correct')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold">{stats.incorrect}</p>
          <p className="text-xs text-muted-foreground">{t('studySession.incorrect')}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Target className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">{t('studySession.accuracy')}</span>
        </div>
        <p className="text-4xl font-bold">{accuracy}%</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/dashboard/study-sets/${studySetId}`}>{t('studySession.backToSet')}</Link>
        </Button>
        <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={onRestart}>
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('studySession.studyAgain')}
        </Button>
      </div>
    </motion.div>
  );
}

export function StudySessionPage() {
  const { t } = useTranslation();
  const { id: studySetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    flashcards,
    studyQueue,
    currentStudyIndex,
    isFlipped,
    sessionStats,
    isLoading,
    fetchFlashcards,
    startStudySession,
    flipCard,
    nextCard,
    prevCard,
    reviewFlashcard,
    resetSession,
  } = useFlashcardsStore();
  const { addXP } = useGamificationStore();

  const [isReviewing, setIsReviewing] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [clozeRevealed, setClozeRevealed] = useState(false);

  useEffect(() => {
    if (studySetId) {
      fetchFlashcards(studySetId).then(() => {
        // Will be started after flashcards are loaded
      });
    }

    return () => {
      resetSession();
    };
  }, [studySetId, fetchFlashcards, resetSession]);

  useEffect(() => {
    if (flashcards.length > 0 && studyQueue.length === 0) {
      startStudySession(flashcards);
    }
  }, [flashcards, studyQueue.length, startStudySession]);

  const currentCard = studyQueue[currentStudyIndex];
  const isSessionComplete = currentStudyIndex >= studyQueue.length && studyQueue.length > 0;
  const progress = studyQueue.length > 0 ? ((currentStudyIndex) / studyQueue.length) * 100 : 0;

  const handleRate = async (quality: 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard || isReviewing) return;

    setIsReviewing(true);
    try {
      await reviewFlashcard(currentCard.id, { quality });
      const xp = await addXP('card_review');
      setSessionXp((prev) => prev + xp);
      setClozeRevealed(false);
      nextCard();
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRestart = () => {
    startStudySession(flashcards);
  };

  if (isLoading && flashcards.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (flashcards.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{t('studySession.noFlashcards')}</p>
          <Button variant="outline" onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}>
            {t('studySession.backToStudySet')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('studySession.exit')}</span>
          </button>
          {!isSessionComplete && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {currentStudyIndex + 1} / {studyQueue.length}
              </span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isSessionComplete ? (
            <SessionComplete
              key="complete"
              stats={sessionStats}
              studySetId={studySetId!}
              onRestart={handleRestart}
              xpEarned={sessionXp}
            />
          ) : currentCard ? (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col justify-between py-4"
            >
              {/* Card rendering - type-aware */}
              <div className="flex-1 flex items-center justify-center">
                {(() => {
                  const cardType = currentCard.type || (hasClozeMarkers(currentCard.front) ? 'cloze' : 'standard');

                  if (cardType === 'cloze') {
                    return (
                      <div className="w-full max-w-xl mx-auto">
                        <div className="bg-card border-2 border-border rounded-2xl p-6">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block text-center">{t('studySession.clozeCard')}</span>
                          <ClozeRenderer
                            text={currentCard.front}
                            onAllRevealed={() => setClozeRevealed(true)}
                          />
                          {currentCard.notes && clozeRevealed && (
                            <p className="text-xs text-muted-foreground mt-4 text-center">{currentCard.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (cardType === 'image_occlusion') {
                    try {
                      const data = JSON.parse(currentCard.front);
                      return (
                        <div className="w-full max-w-xl mx-auto">
                          <div className="bg-card border-2 border-border rounded-2xl p-4">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block text-center">{t('studySession.imageOcclusion')}</span>
                            <ImageOcclusionViewer
                              imageUrl={data.imageUrl}
                              regions={data.regions as OcclusionRegion[]}
                              onAllRevealed={() => setClozeRevealed(true)}
                            />
                          </div>
                        </div>
                      );
                    } catch {
                      // Fallback to standard card if JSON parsing fails
                    }
                  }

                  // Standard flip card
                  return (
                    <FlipCard
                      front={currentCard.front}
                      back={currentCard.back}
                      notes={currentCard.notes}
                      isFlipped={isFlipped}
                      onFlip={flipCard}
                    />
                  );
                })()}
              </div>

              {/* Bottom controls */}
              <div className="space-y-4 pb-2">
                {/* Navigation */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={prevCard}
                    disabled={currentStudyIndex === 0}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border transition-all text-sm',
                      currentStudyIndex === 0
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-muted'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('studySession.prev')}
                  </button>

                  <div className="flex items-center gap-1">
                    {studyQueue.slice(
                      Math.max(0, currentStudyIndex - 2),
                      Math.min(studyQueue.length, currentStudyIndex + 3)
                    ).map((_, idx) => {
                      const actualIdx = Math.max(0, currentStudyIndex - 2) + idx;
                      return (
                        <div
                          key={actualIdx}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full transition-all',
                            actualIdx === currentStudyIndex
                              ? 'w-4 bg-green-500'
                              : actualIdx < currentStudyIndex
                              ? 'bg-green-500/40'
                              : 'bg-muted-foreground/30'
                          )}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={nextCard}
                    disabled={currentStudyIndex >= studyQueue.length - 1}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border transition-all text-sm',
                      currentStudyIndex >= studyQueue.length - 1
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-muted'
                    )}
                  >
                    {t('studySession.skip')}
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Rating buttons */}
                <div className="space-y-2">
                  <p className="text-center text-xs text-muted-foreground">
                    {(isFlipped || clozeRevealed) ? t('studySession.rateRecall') : t('studySession.tapCardThenRate')}
                  </p>
                  <div className="flex justify-center gap-1.5">
                    {qualityRatings.map((rating) => {
                      const bgColors: Record<number, string> = {
                        1: 'bg-red-500',
                        2: 'bg-orange-500',
                        3: 'bg-amber-500',
                        4: 'bg-green-500',
                        5: 'bg-emerald-500',
                      };
                      const canRate = isFlipped || clozeRevealed;
                      return (
                        <button
                          key={rating.quality}
                          onClick={() => handleRate(rating.quality)}
                          disabled={!canRate || isReviewing}
                          className={cn(
                            'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all min-w-[60px]',
                            canRate
                              ? `${bgColors[rating.quality]} text-white shadow-md hover:scale-105`
                              : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed',
                            isReviewing && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <rating.icon className="w-4 h-4" />
                          <span className="text-[10px] font-medium">{t(rating.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
