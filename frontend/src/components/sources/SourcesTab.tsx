import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Youtube,
  Globe,
  FileText,
  Mic,
  PenTool,
  Trash2,
  ExternalLink,
  Loader2,
  FileIcon,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type SourceType = 'file' | 'youtube' | 'website' | 'audio' | 'handwriting';

interface ContentSource {
  id: string;
  userId: string;
  studySetId: string;
  type: SourceType;
  title: string;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown> | null;
  extractedText: string | null;
  flashcardsGenerated: number;
  notesGenerated: number;
  createdAt: string;
}

interface SourcesTabProps {
  studySetId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getSourceIcon(type: SourceType) {
  switch (type) {
    case 'youtube':
      return <Youtube className="w-5 h-5 text-red-500" />;
    case 'website':
      return <Globe className="w-5 h-5 text-blue-500" />;
    case 'audio':
      return <Mic className="w-5 h-5 text-purple-500" />;
    case 'handwriting':
      return <PenTool className="w-5 h-5 text-orange-500" />;
    case 'file':
    default:
      return <FileText className="w-5 h-5 text-green-500" />;
  }
}

function getSourceTypeLabelKey(type: SourceType): string {
  switch (type) {
    case 'youtube':
      return 'sourcesTab.youtubeVideo';
    case 'website':
      return 'sourcesTab.website';
    case 'audio':
      return 'sourcesTab.audioTranscription';
    case 'handwriting':
      return 'sourcesTab.handwrittenNotes';
    case 'file':
    default:
      return 'sourcesTab.uploadedFile';
  }
}

function getSourceBgColor(type: SourceType): string {
  switch (type) {
    case 'youtube':
      return 'bg-red-500/10';
    case 'website':
      return 'bg-blue-500/10';
    case 'audio':
      return 'bg-purple-500/10';
    case 'handwriting':
      return 'bg-orange-500/10';
    case 'file':
    default:
      return 'bg-green-500/10';
  }
}

export function SourcesTab({ studySetId }: SourcesTabProps) {
  const { t } = useTranslation();
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ContentSource[]>(
        ENDPOINTS.contentSources.byStudySet(studySetId)
      );
      setSources(response.data);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setIsLoading(false);
    }
  }, [studySetId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(ENDPOINTS.contentSources.delete(id));
      setSources((prev) => prev.filter((s) => s.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-card border border-border rounded-xl"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">{t('sourcesTab.noSources')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {t('sourcesTab.noSourcesDesc')}
        </p>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
          <Youtube className="w-4 h-4" />
          <Globe className="w-4 h-4" />
          <FileText className="w-4 h-4" />
          <Mic className="w-4 h-4" />
          <PenTool className="w-4 h-4" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['youtube', 'website', 'file', 'audio'] as SourceType[]).map((type) => {
          const count = sources.filter((s) => s.type === type).length;
          if (count === 0) return null;
          return (
            <div
              key={type}
              className={cn(
                'p-3 rounded-lg flex items-center gap-3',
                getSourceBgColor(type)
              )}
            >
              {getSourceIcon(type)}
              <div>
                <div className="font-semibold">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {t(getSourceTypeLabelKey(type))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sources.map((source) => (
            <motion.div
              key={source.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Main Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === source.id ? null : source.id)
                }
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    getSourceBgColor(source.type)
                  )}
                >
                  {getSourceIcon(source.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{source.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(source.createdAt)}
                    </span>
                    {source.fileSize && (
                      <span>{formatFileSize(source.fileSize)}</span>
                    )}
                    {(source.flashcardsGenerated > 0 ||
                      source.notesGenerated > 0) && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {source.flashcardsGenerated > 0 &&
                          t('sourcesTab.cards', { count: source.flashcardsGenerated })}
                        {source.flashcardsGenerated > 0 &&
                          source.notesGenerated > 0 &&
                          ', '}
                        {source.notesGenerated > 0 &&
                          t('sourcesTab.notes', { count: source.notesGenerated })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {source.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(source.url!, '_blank');
                      }}
                      title="Open source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(source.id);
                    }}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedId === source.id && source.extractedText && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden"
                  >
                    <div className="p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                        <BookOpen className="w-4 h-4" />
                        {t('sourcesTab.extractedContentPreview')}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                        {source.extractedText}
                      </p>
                      {source.extractedText.length > 500 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('sourcesTab.andMore', { count: source.extractedText.length.toLocaleString() })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">{t('sourcesTab.removeSource')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('sourcesTab.removeSourceDesc')}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteId)}
                >
                  {t('sourcesTab.remove')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
