import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFlashcardsStore } from '@/stores/useFlashcardsStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, X, Plus, BookOpen } from 'lucide-react';
import type { UpdateFlashcardRequest } from '@/types';

export function EditFlashcardPage() {
  const { t } = useTranslation();
  const { id: studySetId, flashcardId } = useParams<{ id: string; flashcardId: string }>();
  const navigate = useNavigate();
  const { flashcards, updateFlashcard, isLoading, error } = useFlashcardsStore();

  const flashcard = flashcards.find((f) => f.id === flashcardId);

  const [formData, setFormData] = useState<UpdateFlashcardRequest>({
    front: '',
    back: '',
    notes: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (flashcard) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        front: flashcard.front,
        back: flashcard.back,
        notes: flashcard.notes || '',
        tags: flashcard.tags,
      });
    }
  }, [flashcard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashcardId) return;

    try {
      await updateFlashcard(flashcardId, formData);
      navigate(`/dashboard/study-sets/${studySetId}`);
    } catch {
      // Error is handled by the store
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!flashcard && !isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{t('editFlashcard.notFound')}</p>
          <Button variant="outline" onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}>
            {t('editFlashcard.backToStudySet')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!flashcard) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{t('editFlashcard.title')}</h1>
            <p className="text-muted-foreground">{t('editFlashcard.subtitle')}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            {/* Preview */}
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-md aspect-[3/2] rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center p-6">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {formData.front || t('editFlashcard.frontOfCard')}
                  </p>
                </div>
              </div>
            </div>

            {/* Front */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('editFlashcard.frontLabel')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.front || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, front: e.target.value }))
                }
                placeholder={t('editFlashcard.frontPlaceholder')}
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                required
              />
            </div>

            {/* Back */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('editFlashcard.backLabel')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.back || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, back: e.target.value }))
                }
                placeholder={t('editFlashcard.backPlaceholder')}
                rows={3}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('editFlashcard.notesLabel')}
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={t('editFlashcard.notesPlaceholder')}
                rows={2}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('createStudySet.tags')}</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={t('createStudySet.addTag')}
                  className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="p-0.5 hover:bg-green-500/20 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!formData.front?.trim() || !formData.back?.trim() || isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              {isLoading ? t('common.saving') : t('editFlashcard.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
