import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNotesStore } from '@/stores/useNotesStore';
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Highlighter,
  Save,
  Loader2,
  Tag,
  X,
} from 'lucide-react';

export function EditNotePage() {
  const { id: studySetId, noteId } = useParams<{ id: string; noteId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentNote, isLoading, fetchNote, updateNote } = useNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (noteId) {
      fetchNote(noteId);
    }
  }, [noteId, fetchNote]);

  useEffect(() => {
    if (currentNote && !isInitialized) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setTags(currentNote.tags || []);
      setIsInitialized(true);
    }
  }, [currentNote, isInitialized]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(t('editNote.errorTitle'));
      return;
    }
    if (!content.trim()) {
      setError(t('editNote.errorContent'));
      return;
    }

    setIsSaving(true);
    try {
      await updateNote(noteId!, {
        title: title.trim(),
        content: content.trim(),
        tags,
      });
      navigate(`/dashboard/study-sets/${studySetId}/notes/${noteId}`);
    } catch {
      setError(t('editNote.errorUpdate'));
    } finally {
      setIsSaving(false);
    }
  };

  const applyFormatting = (type: string) => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let before = '';
    let after = '';

    switch (type) {
      case 'bold':
        before = '**';
        after = '**';
        break;
      case 'italic':
        before = '_';
        after = '_';
        break;
      case 'h1':
        before = '# ';
        break;
      case 'h2':
        before = '## ';
        break;
      case 'bullet':
        before = '- ';
        break;
      case 'numbered':
        before = '1. ';
        break;
      case 'highlight':
        before = '==';
        after = '==';
        break;
    }

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  if (isLoading || !currentNote) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}/notes/${noteId}`)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('editNote.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('editNote.subtitle')}</p>
          </div>
          <Button
            className="bg-green-500 hover:bg-green-600"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('editNote.saveChanges')}
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Title Input */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('editNote.titlePlaceholder')}
            className="w-full px-4 py-3 text-xl font-semibold bg-transparent border-0 border-b-2 border-border focus:border-green-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 mb-2 bg-muted/50 rounded-lg">
          <button
            onClick={() => applyFormatting('bold')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.bold')}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.italic')}
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => applyFormatting('h1')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.heading1')}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormatting('h2')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.heading2')}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => applyFormatting('bullet')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.bulletList')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormatting('numbered')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.numberedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={() => applyFormatting('highlight')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={t('editNote.highlight')}
          >
            <Highlighter className="w-4 h-4" />
          </button>
        </div>

        {/* Content Editor */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('editNote.contentPlaceholder')}
            className="w-full min-h-[400px] p-4 bg-transparent resize-none focus:outline-none text-sm leading-relaxed font-mono"
          />
        </div>

        {/* Tags Section */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('editNote.tags')}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder={t('editNote.addTagPlaceholder')}
              className="flex-1 px-3 py-2 text-sm bg-muted/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
            <Button variant="outline" size="sm" onClick={handleAddTag}>
              {t('editNote.addTag')}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
