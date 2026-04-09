import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlashcardsStore } from '@/stores/useFlashcardsStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Gamepad2,
  Trophy,
  Clock,
  MousePointerClick,
  Star,
  RotateCcw,
} from 'lucide-react';

interface MatchCard {
  id: string;
  flashcardId: string;
  text: string;
  type: 'term' | 'definition';
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchGameComplete({
  time,
  moves,
  pairs,
  studySetId,
  onRetry,
}: {
  time: number;
  moves: number;
  pairs: number;
  studySetId: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const stars =
    moves <= pairs * 1.5 ? 3 : moves <= pairs * 2.5 ? 2 : 1;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md mx-auto"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
        <Trophy className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t('matchGame.gameComplete')}</h2>
      <p className="text-muted-foreground mb-6">
        {t('matchGame.matchedAllPairs', { pairs })}
      </p>

      {/* Stars */}
      <div className="flex justify-center gap-1 mb-6">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            className={cn(
              'w-8 h-8',
              i <= stars
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{formatTime(time)}</p>
          <p className="text-xs text-muted-foreground">{t('matchGame.time')}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <MousePointerClick className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{moves}</p>
          <p className="text-xs text-muted-foreground">{t('matchGame.moves')}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" asChild>
          <Link to={`/dashboard/study-sets/${studySetId}`}>{t('matchGame.backToSet')}</Link>
        </Button>
        <Button
          className="flex-1 bg-green-500 hover:bg-green-600"
          onClick={onRetry}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('matchGame.playAgain')}
        </Button>
      </div>
    </motion.div>
  );
}

export function MatchGamePage() {
  const { t } = useTranslation();
  const { id: studySetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { flashcards, isLoading, fetchFlashcards } = useFlashcardsStore();
  const { addXP } = useGamificationStore();

  const [terms, setTerms] = useState<MatchCard[]>([]);
  const [definitions, setDefinitions] = useState<MatchCard[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<{
    term: string;
    def: string;
  } | null>(null);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (studySetId) {
      fetchFlashcards(studySetId);
    }
  }, [studySetId, fetchFlashcards]);

  const initGame = useCallback(() => {
    if (flashcards.length < 2) return;

    const picked = shuffle(flashcards).slice(0, Math.min(6, flashcards.length));

    const termCards: MatchCard[] = picked.map((fc) => ({
      id: `term-${fc.id}`,
      flashcardId: fc.id,
      text: fc.front,
      type: 'term' as const,
    }));

    const defCards: MatchCard[] = picked.map((fc) => ({
      id: `def-${fc.id}`,
      flashcardId: fc.id,
      text: fc.back,
      type: 'definition' as const,
    }));

    setTerms(shuffle(termCards));
    setDefinitions(shuffle(defCards));
    setSelectedTerm(null);
    setSelectedDef(null);
    setMatchedIds(new Set());
    setWrongPair(null);
    setMoves(0);
    setTimer(0);
    setIsComplete(false);
    setGameStarted(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  }, [flashcards]);

  useEffect(() => {
    if (flashcards.length >= 2 && !gameStarted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      initGame();
    }
  }, [flashcards, gameStarted, initGame]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Check match when both selected
  useEffect(() => {
    if (!selectedTerm || !selectedDef) return;

    const termCard = terms.find((t) => t.id === selectedTerm);
    const defCard = definitions.find((d) => d.id === selectedDef);

    if (!termCard || !defCard) return;

    setMoves((m) => m + 1);

    if (termCard.flashcardId === defCard.flashcardId) {
      // Match!
      const newMatched = new Set(matchedIds);
      newMatched.add(termCard.flashcardId);
      setMatchedIds(newMatched);
      setSelectedTerm(null);
      setSelectedDef(null);

      if (newMatched.size === terms.length) {
        setIsComplete(true);
        if (timerRef.current) clearInterval(timerRef.current);
        addXP('quiz_complete');
      }
    } else {
      // Wrong
      setWrongPair({ term: selectedTerm, def: selectedDef });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 600);
    }
  }, [selectedTerm, selectedDef]);

  const handleTermClick = (id: string) => {
    if (wrongPair) return;
    const card = terms.find((t) => t.id === id);
    if (!card || matchedIds.has(card.flashcardId)) return;
    setSelectedTerm(id === selectedTerm ? null : id);
  };

  const handleDefClick = (id: string) => {
    if (wrongPair) return;
    const card = definitions.find((d) => d.id === id);
    if (!card || matchedIds.has(card.flashcardId)) return;
    setSelectedDef(id === selectedDef ? null : id);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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

  if (flashcards.length < 2) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('matchGame.notEnoughFlashcards')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('matchGame.needAtLeast2')}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}
          >
            {t('matchGame.backToStudySet')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto min-h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('matchGame.exit')}</span>
          </button>
          {!isComplete && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MousePointerClick className="w-4 h-4" />
                {t('matchGame.movesCount', { count: moves })}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(timer)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <MatchGameComplete
                key="complete"
                time={timer}
                moves={moves}
                pairs={terms.length}
                studySetId={studySetId!}
                onRetry={initGame}
              />
            ) : (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-4 md:gap-6"
              >
                {/* Terms Column */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    {t('matchGame.terms')}
                  </h3>
                  {terms.map((card) => {
                    const isMatched = matchedIds.has(card.flashcardId);
                    const isSelected = selectedTerm === card.id;
                    const isWrong = wrongPair?.term === card.id;

                    return (
                      <motion.button
                        key={card.id}
                        onClick={() => handleTermClick(card.id)}
                        disabled={isMatched}
                        animate={
                          isWrong
                            ? {
                                x: [0, -4, 4, -4, 4, 0],
                                transition: { duration: 0.4 },
                              }
                            : isMatched
                            ? { opacity: 0.4, scale: 0.95 }
                            : {}
                        }
                        className={cn(
                          'w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium',
                          isMatched
                            ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 line-through cursor-default'
                            : isWrong
                            ? 'border-red-500 bg-red-500/10 text-red-600'
                            : isSelected
                            ? 'border-green-500 bg-green-500/5 shadow-md'
                            : 'border-border bg-card hover:border-green-500/50'
                        )}
                      >
                        {card.text}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Definitions Column */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    {t('matchGame.definitions')}
                  </h3>
                  {definitions.map((card) => {
                    const isMatched = matchedIds.has(card.flashcardId);
                    const isSelected = selectedDef === card.id;
                    const isWrong = wrongPair?.def === card.id;

                    return (
                      <motion.button
                        key={card.id}
                        onClick={() => handleDefClick(card.id)}
                        disabled={isMatched}
                        animate={
                          isWrong
                            ? {
                                x: [0, -4, 4, -4, 4, 0],
                                transition: { duration: 0.4 },
                              }
                            : isMatched
                            ? { opacity: 0.4, scale: 0.95 }
                            : {}
                        }
                        className={cn(
                          'w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium',
                          isMatched
                            ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 line-through cursor-default'
                            : isWrong
                            ? 'border-red-500 bg-red-500/10 text-red-600'
                            : isSelected
                            ? 'border-green-500 bg-green-500/5 shadow-md'
                            : 'border-border bg-card hover:border-green-500/50'
                        )}
                      >
                        {card.text}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
