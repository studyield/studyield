import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudySetsStore } from '@/stores/useStudySetsStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FlashcardEditor, type FlashcardEditorRef } from './FlashcardEditor';
import api from '@/services/api';
import type { UpdateStudySetRequest } from '@/types';
import {
  ArrowLeft,
  X,
  Plus,
  Globe,
  Lock,
  Image,
  Loader2,
  Check,
  ChevronDown,
  Calendar,
  BookOpen,
} from 'lucide-react';

export function EditStudySetPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentStudySet, fetchStudySet, updateStudySet, isLoading: storeLoading, error } = useStudySetsStore();
  const editorRef = useRef<FlashcardEditorRef>(null);

  // ── Form state ─────────────────────────────────────────────────
  const [formData, setFormData] = useState<UpdateStudySetRequest>({
    title: '',
    description: '',
    isPublic: false,
    tags: [],
    coverImageUrl: '',
    examDate: '',
    examSubject: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // ── Card counts (from FlashcardEditor) ──────────────────────────
  const [cardCounts, setCardCounts] = useState({ total: 0, valid: 0 });

  // ── Save state ───────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id) fetchStudySet(id);
  }, [id, fetchStudySet]);

  // Pre-fill form when study set loads
  useEffect(() => {
    if (currentStudySet && !loaded) {
      const hasExtras = !!(currentStudySet.coverImageUrl || (currentStudySet.tags && currentStudySet.tags.length > 0) || currentStudySet.examDate);
      setFormData({
        title: currentStudySet.title,
        description: currentStudySet.description || '',
        isPublic: currentStudySet.isPublic,
        tags: currentStudySet.tags || [],
        coverImageUrl: currentStudySet.coverImageUrl || '',
        examDate: currentStudySet.examDate || '',
        examSubject: currentStudySet.examSubject || '',
      });
      if (hasExtras) setShowMoreOptions(true);
      setLoaded(true);
    }
  }, [currentStudySet, loaded]);

  // ── Tag handlers ─────────────────────────────────────────────────
  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags?.filter((t) => t !== tag) }));
  };

  const handleCountChange = useCallback((total: number, valid: number) => {
    setCardCounts({ total, valid });
  }, []);

  // ── Save ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!id || !formData.title?.trim()) return;
    const validCards = editorRef.current?.getValidCards() || [];

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateStudySet(id, formData);
      if (validCards.length > 0) {
        await api.post(`/study-sets/${id}/flashcards/bulk`, { flashcards: validCards });
      }
      navigate(`/dashboard/study-sets/${id}`);
    } catch {
      setSaveError(t('editStudySet.failedSave'));
    } finally {
      setIsSaving(false);
    }
  };

  if (storeLoading && !currentStudySet) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (!currentStudySet) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{t('editStudySet.notFound')}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            {t('editStudySet.backToDashboard')}
          </Button>
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
            <h1 className="text-2xl font-bold">{t('editStudySet.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('editStudySet.subtitle')}</p>
          </div>
        </motion.div>

        {/* Error */}
        {(error || saveError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6"
          >
            {error || saveError}
          </motion.div>
        )}

        {/* ═══════════ Metadata ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <div className="mb-4">
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t('createStudySet.titlePlaceholder')}
              className="w-full text-xl font-semibold px-0 py-2 bg-transparent border-0 border-b-2 border-border focus:outline-none focus:border-green-500 placeholder:text-muted-foreground/50 transition-colors"
              required
            />
          </div>

          <div className="mb-3">
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t('createStudySet.descriptionPlaceholder')}
              rows={2}
              className="w-full px-0 py-1.5 text-sm bg-transparent border-0 border-b border-border/50 focus:outline-none focus:border-green-500/50 resize-none placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} />
            {showMoreOptions ? t('createStudySet.lessOptions') : t('createStudySet.moreOptions')}
          </button>

          <AnimatePresence>
            {showMoreOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4 border-t border-border/50 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('createStudySet.coverImageUrl')}</label>
                    <div className="relative">
                      <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={formData.coverImageUrl || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
                        placeholder={t('createStudySet.coverImagePlaceholder')}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('createStudySet.tags')}</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder={t('createStudySet.addTag')}
                        className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="p-0.5 hover:bg-green-500/20 rounded-full">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exam Date */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('createStudySet.examDate')}</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="datetime-local"
                        value={formData.examDate || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, examDate: e.target.value || undefined }))}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('createStudySet.examDateHint')}</p>
                  </div>

                  {/* Exam Subject */}
                  {formData.examDate && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t('createStudySet.examSubject')}</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.examSubject || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, examSubject: e.target.value }))}
                          placeholder={t('createStudySet.examSubjectPlaceholder')}
                          className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('createStudySet.visibility')}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, isPublic: false }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${!formData.isPublic ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400' : 'border-border hover:border-green-500/50'}`}
                      >
                        <Lock className="w-3.5 h-3.5" />{t('createStudySet.private')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, isPublic: true }))}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${formData.isPublic ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400' : 'border-border hover:border-green-500/50'}`}
                      >
                        <Globe className="w-3.5 h-3.5" />{t('createStudySet.public')}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formData.isPublic ? t('createStudySet.publicHint') : t('createStudySet.privateHint')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══════════ Flashcard Editor (add new cards) ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FlashcardEditor ref={editorRef} onCountChange={handleCountChange} studySetId={id} />
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
                  {t('editStudySet.newCardsReady', { valid: cardCounts.valid, total: cardCounts.total })}
                  {cardCounts.total > cardCounts.valid && (
                    <span className="text-amber-500 ml-1">{t('createStudySet.incomplete', { count: cardCounts.total - cardCounts.valid })}</span>
                  )}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.title?.trim() || isSaving || storeLoading}
              className="bg-green-500 hover:bg-green-600 min-w-[140px] sm:min-w-[180px]"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>
              ) : (
                <><Check className="w-4 h-4 mr-2" />{cardCounts.valid > 0 ? t('editStudySet.saveChangesWithCount', { count: cardCounts.valid }) : t('editFlashcard.saveChanges')}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
