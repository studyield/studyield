import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNotesStore } from '@/stores/useNotesStore';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  Volume2,
  Target,
  Calendar,
  Tag,
  ExternalLink,
  FileText,
  Youtube,
  Mic,
  Globe,
  PenLine,
  Sparkles,
  Play,
  Pause,
  Square,
  Gauge,
  X,
  Copy,
  Check,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Download,
  Link2,
  Presentation,
} from 'lucide-react';
import { PresentationView } from '@/components/notes/PresentationView';

const SOURCE_ICONS: Record<string, typeof FileText> = {
  manual: FileText,
  ai_generated: Sparkles,
  pdf: FileText,
  youtube: Youtube,
  audio: Mic,
  website: Globe,
  handwriting: PenLine,
};

// Simple markdown-like renderer
function renderContent(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
    // Highlight
    .replace(/==(.+?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">$1</mark>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br/>');
}

export function NoteDetailPage() {
  const { id: studySetId, noteId } = useParams<{ id: string; noteId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentNote, isLoading, fetchNote, deleteNote, togglePin } = useNotesStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  // TTS State
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isTTSPaused, setIsTTSPaused] = useState(false);
  const [ttsSpeed, setTTSSpeed] = useState(1);
  const [showTTSPlayer, setShowTTSPlayer] = useState(false);
  const [ttsProgress, setTTSProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (noteId) {
      fetchNote(noteId);
    }
  }, [noteId, fetchNote]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(noteId!);
      navigate(`/dashboard/study-sets/${studySetId}`);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // TTS Controls
  const getCleanText = useCallback(() => {
    if (!currentNote) return '';
    return currentNote.content
      .replace(/<[^>]*>/g, '')
      .replace(/[#*_=]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }, [currentNote]);

  const handleTTSPlay = useCallback(() => {
    if (!currentNote) return;

    // If paused, resume
    if (isTTSPaused) {
      speechSynthesis.resume();
      setIsTTSPaused(false);
      setIsTTSPlaying(true);
      return;
    }

    // Stop any existing speech
    speechSynthesis.cancel();

    const text = getCleanText();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsSpeed;
    utterance.pitch = 1;

    // Get a good voice
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => {
      setIsTTSPlaying(true);
      setIsTTSPaused(false);
      setShowTTSPlayer(true);
      setTTSProgress(0);

      // Estimate progress (rough approximation)
      const duration = text.length / (150 * ttsSpeed) * 60 * 1000; // ~150 words/min
      let elapsed = 0;
      progressIntervalRef.current = setInterval(() => {
        elapsed += 100;
        const progress = Math.min((elapsed / duration) * 100, 99);
        setTTSProgress(progress);
      }, 100);
    };

    utterance.onend = () => {
      setIsTTSPlaying(false);
      setIsTTSPaused(false);
      setTTSProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setTimeout(() => setTTSProgress(0), 1000);
    };

    utterance.onerror = () => {
      setIsTTSPlaying(false);
      setIsTTSPaused(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [currentNote, isTTSPaused, ttsSpeed, getCleanText]);

  const handleTTSPause = useCallback(() => {
    speechSynthesis.pause();
    setIsTTSPaused(true);
    setIsTTSPlaying(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const handleTTSStop = useCallback(() => {
    speechSynthesis.cancel();
    setIsTTSPlaying(false);
    setIsTTSPaused(false);
    setTTSProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const handleTTSSpeedChange = useCallback((speed: number) => {
    setTTSSpeed(speed);
    // If currently playing, restart with new speed
    if (isTTSPlaying || isTTSPaused) {
      handleTTSStop();
      setTimeout(() => {
        const text = getCleanText();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utteranceRef.current = utterance;

        utterance.onstart = () => setIsTTSPlaying(true);
        utterance.onend = () => {
          setIsTTSPlaying(false);
          setTTSProgress(100);
        };

        speechSynthesis.speak(utterance);
      }, 100);
    }
  }, [isTTSPlaying, isTTSPaused, handleTTSStop, getCleanText]);

  const closeTTSPlayer = useCallback(() => {
    handleTTSStop();
    setShowTTSPlayer(false);
  }, [handleTTSStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Load voices
  useEffect(() => {
    speechSynthesis.getVoices();
  }, []);

  // Share functions
  const getShareUrl = useCallback(() => {
    return window.location.href;
  }, []);

  const getShareText = useCallback(() => {
    if (!currentNote) return '';
    return `${currentNote.title}\n\n${currentNote.content.replace(/<[^>]*>/g, '').replace(/[#*_=]/g, '').substring(0, 500)}...`;
  }, [currentNote]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = getShareUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareUrl]);

  const handleShareEmail = useCallback(() => {
    if (!currentNote) return;
    const subject = encodeURIComponent(`Check out: ${currentNote.title}`);
    const body = encodeURIComponent(`${currentNote.title}\n\n${getShareText()}\n\nRead more: ${getShareUrl()}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }, [currentNote, getShareText, getShareUrl]);

  const handleShareTwitter = useCallback(() => {
    if (!currentNote) return;
    const text = encodeURIComponent(`${currentNote.title.substring(0, 100)}`);
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  }, [currentNote, getShareUrl]);

  const handleShareFacebook = useCallback(() => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  }, [getShareUrl]);

  const handleShareLinkedin = useCallback(() => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
  }, [getShareUrl]);

  const handleShareWhatsApp = useCallback(() => {
    if (!currentNote) return;
    const text = encodeURIComponent(`${currentNote.title}\n\n${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [currentNote, getShareUrl]);

  const handleDownloadText = useCallback(() => {
    if (!currentNote) return;
    const content = `# ${currentNote.title}\n\n${currentNote.content.replace(/<[^>]*>/g, '')}\n\n---\nTags: ${currentNote.tags.join(', ')}\nCreated: ${new Date(currentNote.createdAt).toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentNote]);

  const handleDownloadMarkdown = useCallback(() => {
    if (!currentNote) return;
    const content = `# ${currentNote.title}\n\n${currentNote.summary ? `> ${currentNote.summary}\n\n` : ''}${currentNote.content}\n\n---\n\n**Tags:** ${currentNote.tags.map(t => `#${t}`).join(' ')}\n**Source:** ${currentNote.sourceType}\n**Created:** ${new Date(currentNote.createdAt).toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentNote]);

  if (isLoading || !currentNote) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  const SourceIcon = SOURCE_ICONS[currentNote.sourceType] || FileText;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}`)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {currentNote.isPinned && (
                <span className="text-amber-500 text-xs font-medium">{t('noteDetail.pinned')}</span>
              )}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                currentNote.sourceType === 'ai_generated'
                  ? 'bg-purple-500/10 text-purple-600'
                  : 'bg-muted text-muted-foreground'
              )}>
                <SourceIcon className="w-3 h-3 inline mr-1" />
                {currentNote.sourceType.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-bold truncate mt-1">{currentNote.title}</h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => togglePin(currentNote.id)}
            className={cn(currentNote.isPinned && 'text-amber-500 border-amber-500/30')}
          >
            <Target className="w-4 h-4 mr-2" />
            {currentNote.isPinned ? t('noteDetail.unpin') : t('noteDetail.pin')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isTTSPlaying || isTTSPaused) {
                setShowTTSPlayer(true);
              } else {
                handleTTSPlay();
              }
            }}
            className={cn(isTTSPlaying && 'border-green-500 text-green-600')}
          >
            {isTTSPlaying ? (
              <>
                <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                {t('noteDetail.playing')}
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                {t('noteDetail.listen')}
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            {t('noteDetail.share')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresentation(true)}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50"
          >
            <Presentation className="w-4 h-4 mr-2 text-purple-500" />
            {t('noteDetail.present')}
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}/notes/${noteId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            {t('noteDetail.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:border-red-500/30"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{t('noteDetail.updated', { date: new Date(currentNote.updatedAt).toLocaleDateString() })}</span>
          </div>
          {currentNote.sourceUrl && (
            <a
              href={currentNote.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-500 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{t('noteDetail.viewSource')}</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {currentNote.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {currentNote.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Summary (if AI generated) */}
        {currentNote.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600">{t('noteDetail.aiSummary')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{currentNote.summary}</p>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(`<p class="mb-3">${renderContent(currentNote.content)}</p>`),
            }}
          />
        </motion.div>

        {/* Related Actions */}
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/dashboard/study-sets/${studySetId}`}>
              {t('noteDetail.backToStudySet')}
            </Link>
          </Button>
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600"
            onClick={() => navigate(`/dashboard/study-sets/${studySetId}/notes/create`)}
          >
            {t('noteDetail.createAnother')}
          </Button>
        </div>
      </div>

      {/* TTS Player */}
      {showTTSPlayer && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50"
        >
          <div className="max-w-3xl mx-auto px-4 py-3">
            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full mb-3 overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${ttsProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="flex items-center gap-4">
              {/* Note info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentNote.title}</p>
                <p className="text-xs text-muted-foreground">
                  {isTTSPlaying ? t('noteDetail.tts.playing') : isTTSPaused ? t('noteDetail.tts.paused') : t('noteDetail.tts.ready')}
                  {' · '}{t('noteDetail.tts.speed', { speed: ttsSpeed })}
                </p>
              </div>

              {/* Speed control */}
              <div className="flex items-center gap-1">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <select
                  value={ttsSpeed}
                  onChange={(e) => handleTTSSpeedChange(Number(e.target.value))}
                  className="bg-muted border-0 rounded px-2 py-1 text-xs outline-none"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                {isTTSPlaying ? (
                  <button
                    onClick={handleTTSPause}
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleTTSPlay}
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors"
                  >
                    <Play className="w-5 h-5 ml-0.5" />
                  </button>
                )}

                {/* Stop */}
                <button
                  onClick={handleTTSStop}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  title={t('noteDetail.tts.stop')}
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              {/* Close */}
              <button
                onClick={closeTTSPlayer}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title={t('noteDetail.tts.closePlayer')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShareModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-lg">{t('noteDetail.shareModal.title')}</h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Copy Link */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('noteDetail.shareModal.shareLink')}</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <Link2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground break-all text-xs leading-relaxed">{getShareUrl()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className={cn(copied && 'bg-green-500/10 border-green-500 text-green-600')}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {t('noteDetail.shareModal.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        {t('noteDetail.shareModal.copy')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Social Share */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('noteDetail.shareModal.shareToSocial')}</label>
                <div className="grid grid-cols-5 gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    <span className="text-[10px] text-muted-foreground">WhatsApp</span>
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                    <span className="text-[10px] text-muted-foreground">Twitter</span>
                  </button>
                  <button
                    onClick={handleShareFacebook}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                    <span className="text-[10px] text-muted-foreground">Facebook</span>
                  </button>
                  <button
                    onClick={handleShareLinkedin}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    <span className="text-[10px] text-muted-foreground">LinkedIn</span>
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 transition-colors"
                    title="Email"
                  >
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-[10px] text-muted-foreground">Email</span>
                  </button>
                </div>
              </div>

              {/* Download Options */}
              <div>
                <label className="block text-sm font-medium mb-2">{t('noteDetail.shareModal.download')}</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleDownloadText}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('noteDetail.shareModal.textFile')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleDownloadMarkdown}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('noteDetail.shareModal.markdownFile')}
                  </Button>
                </div>
              </div>

              {/* Note Preview */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t('noteDetail.shareModal.sharing')}</p>
                <p className="text-sm font-medium truncate">{currentNote.title}</p>
                {currentNote.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{currentNote.summary}</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        title={t('noteDetail.deleteTitle')}
        description={t('noteDetail.deleteDescription')}
        isLoading={isDeleting}
      />

      {/* Presentation Mode */}
      <AnimatePresence>
        {showPresentation && (
          <PresentationView
            note={currentNote}
            onClose={() => setShowPresentation(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
