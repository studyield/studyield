import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FlashcardEditor, type FlashcardEditorRef } from './FlashcardEditor';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  ArrowLeft,
  Loader2,
  Check,
  Library,
} from 'lucide-react';

export function AddFlashcardPage() {
  const { t } = useTranslation();
  const { id: studySetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<FlashcardEditorRef>(null);

  // ── Study set info ───────────────────────────────────────────────
  const [studySetTitle, setStudySetTitle] = useState<string | null>(null);
  const [isLoadingSet, setIsLoadingSet] = useState(true);

  // ── Card counts (from FlashcardEditor) ──────────────────────────
  const [cardCounts, setCardCounts] = useState({ total: 0, valid: 0 });

  // ── Save state ───────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Fetch study set title ────────────────────────────────────────
  useEffect(() => {
    if (!studySetId) return;
    setIsLoadingSet(true);
    api.get(ENDPOINTS.studySets.get(studySetId))
      .then((res) => setStudySetTitle(res.data.title || 'Study Set'))
      .catch(() => setStudySetTitle('Study Set'))
      .finally(() => setIsLoadingSet(false));
  }, [studySetId]);

  const handleCountChange = useCallback((total: number, valid: number) => {
    setCardCounts({ total, valid });
  }, []);

  // ── Save: bulk add to existing study set ─────────────────────────
  const handleSave = async () => {
    if (!studySetId) return;
    const validCards = editorRef.current?.getValidCards() || [];
    if (validCards.length === 0) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await api.post(`/study-sets/${studySetId}/flashcards/bulk`, { flashcards: validCards });
      navigate(`/dashboard/study-sets/${studySetId}`);
    } catch {
      setSaveError(t('addFlashcard.failedSave'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSet) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-6 h-6" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{t('addFlashcard.title')}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Library className="w-3.5 h-3.5" />
              <span>{studySetTitle}</span>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6"
          >
            {saveError}
          </motion.div>
        )}

        {/* ═══════════ Flashcard Editor (same as Create page) ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <FlashcardEditor ref={editorRef} onCountChange={handleCountChange} studySetId={studySetId} />
        </motion.div>

        {/* ═══════════ Sticky bottom bar ═══════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
                {t('common.cancel')}
              </Button>
              {cardCounts.total > 0 && (
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {t('addFlashcard.cardsReady', { valid: cardCounts.valid, total: cardCounts.total })}
                  {cardCounts.total > cardCounts.valid && (
                    <span className="text-amber-500 ml-1">{t('addFlashcard.incomplete', { count: cardCounts.total - cardCounts.valid })}</span>
                  )}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={cardCounts.valid === 0 || isSaving}
              className="bg-green-500 hover:bg-green-600 min-w-[140px] sm:min-w-[180px]"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>
              ) : (
                <><Check className="w-4 h-4 mr-2" />{cardCounts.valid > 0 ? t('addFlashcard.saveCards', { count: cardCounts.valid }) : t('addFlashcard.saveCardsButton')}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
