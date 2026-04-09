import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useNotesStore } from '@/stores/useNotesStore';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  ArrowLeft,
  FileText,
  Youtube,
  Globe,
  Mic,
  PenLine,
  Upload,
  Loader2,
  Sparkles,
  Check,
  X,
  Link2,
  CheckCircle2,
  Play,
  AlertCircle,
} from 'lucide-react';

type SourceType = 'pdf' | 'youtube' | 'website' | 'audio' | 'handwriting' | 'text';

const SOURCE_OPTIONS_CONFIG: { key: SourceType; labelKey: string; descKey: string; icon: typeof FileText; color: string }[] = [
  { key: 'pdf', labelKey: 'generateNote.sources.pdf', descKey: 'generateNote.sources.pdfDesc', icon: FileText, color: 'bg-red-500/10 text-red-500' },
  { key: 'youtube', labelKey: 'generateNote.sources.youtube', descKey: 'generateNote.sources.youtubeDesc', icon: Youtube, color: 'bg-red-500/10 text-red-500' },
  { key: 'website', labelKey: 'generateNote.sources.website', descKey: 'generateNote.sources.websiteDesc', icon: Globe, color: 'bg-purple-500/10 text-purple-500' },
  { key: 'audio', labelKey: 'generateNote.sources.audio', descKey: 'generateNote.sources.audioDesc', icon: Mic, color: 'bg-emerald-500/10 text-emerald-500' },
  { key: 'handwriting', labelKey: 'generateNote.sources.handwriting', descKey: 'generateNote.sources.handwritingDesc', icon: PenLine, color: 'bg-indigo-500/10 text-indigo-500' },
  { key: 'text', labelKey: 'generateNote.sources.text', descKey: 'generateNote.sources.textDesc', icon: FileText, color: 'bg-slate-500/10 text-slate-500' },
];

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function GenerateNotePage() {
  const { id: studySetId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createNote } = useNotesStore();

  const [step, setStep] = useState<'select' | 'input' | 'processing' | 'preview'>('select');
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input states
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Result states
  const [extractedText, setExtractedText] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);

  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [t('generateNote.processingSteps.extracting'), t('generateNote.processingSteps.analyzing'), t('generateNote.processingSteps.generating'), t('generateNote.processingSteps.creating')];

  const handleSourceSelect = (source: SourceType) => {
    setSourceType(source);
    setStep('input');
    setError(null);
  };

  const handleExtract = async () => {
    setIsProcessing(true);
    setError(null);
    setStep('processing');
    setProcessingStep(0);

    try {
      let content = '';
      let title = '';

      // Step 1: Extract content
      setProcessingStep(0);

      if (sourceType === 'text') {
        content = text;
        title = text.split('\n')[0].substring(0, 50) || 'Untitled Note';
      } else if (sourceType === 'youtube') {
        const res = await api.post(ENDPOINTS.content.extractYoutube, { url });
        content = res.data.text;
        title = `YouTube Notes - ${res.data.videoId}`;
      } else if (sourceType === 'website') {
        const res = await api.post(ENDPOINTS.content.extractWebsite, { url });
        content = res.data.text;
        title = res.data.title || 'Website Notes';
      } else if (sourceType === 'pdf' && file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post(ENDPOINTS.content.extract, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        content = res.data.text;
        title = file.name.replace(/\.[^/.]+$/, '') || 'PDF Notes';
      } else if (sourceType === 'audio' && file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post(ENDPOINTS.content.extractAudio, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        content = res.data.text;
        title = file.name.replace(/\.[^/.]+$/, '') || 'Audio Transcription';
      } else if (sourceType === 'handwriting' && file) {
        const formData = new FormData();
        formData.append('files', file);
        const res = await api.post(ENDPOINTS.content.extractHandwriting, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        content = res.data.combinedText || res.data.texts?.[0]?.text || '';
        title = 'Handwritten Notes';
      }

      if (!content || content.length < 20) {
        throw new Error(t('generateNote.errorExtract'));
      }

      setExtractedText(content);

      // Step 2: Generate summary with AI
      setProcessingStep(1);
      await new Promise((r) => setTimeout(r, 500));

      setProcessingStep(2);
      const summaryRes = await api.post(ENDPOINTS.ai.summarize, {
        content: content.substring(0, 10000),
        type: 'comprehensive',
      });

      const summary = summaryRes.data.summary || content.substring(0, 300);

      // Extract suggested tags from summary
      const tagMatch = summary.match(/Tags?:\s*([^\n]+)/i);
      const tags = tagMatch
        ? tagMatch[1].split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 5)
        : [];

      setGeneratedTitle(title);
      setGeneratedSummary(summary.replace(/Tags?:\s*[^\n]+\n?/i, '').trim());
      setGeneratedTags(tags);

      setProcessingStep(3);
      await new Promise((r) => setTimeout(r, 300));

      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract content');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNote = async () => {
    setIsProcessing(true);
    try {
      await createNote({
        studySetId: studySetId!,
        title: generatedTitle,
        content: extractedText,
        summary: generatedSummary,
        tags: generatedTags,
        sourceType: sourceType === 'text' ? 'manual' : sourceType === 'youtube' ? 'youtube' : sourceType === 'website' ? 'website' : sourceType === 'audio' ? 'audio' : sourceType === 'handwriting' ? 'handwriting' : 'pdf',
        sourceUrl: sourceType === 'youtube' || sourceType === 'website' ? url : undefined,
      });
      navigate(`/dashboard/study-sets/${studySetId}`);
    } catch {
      setError(t('generateNote.errorSave'));
    } finally {
      setIsProcessing(false);
    }
  };

  const videoId = sourceType === 'youtube' ? extractYouTubeId(url) : null;
  const isValidUrl = sourceType === 'website' ? /^https?:\/\/.+\..+/.test(url) : true;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => step === 'select' ? navigate(`/dashboard/study-sets/${studySetId}`) : setStep('select')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{t('generateNote.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('generateNote.subtitle')}</p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Select Source */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-sm text-muted-foreground mb-4">{t('generateNote.chooseSource')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SOURCE_OPTIONS_CONFIG.map((source) => (
                  <button
                    key={source.key}
                    onClick={() => handleSourceSelect(source.key)}
                    className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-xl hover:border-green-500/50 hover:shadow-md transition-all"
                  >
                    <div className={`w-12 h-12 rounded-xl ${source.color} flex items-center justify-center`}>
                      <source.icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{t(source.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(source.descKey)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Input */}
          {step === 'input' && sourceType && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* YouTube Input */}
              {sourceType === 'youtube' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('generateNote.youtubeUrl')}</label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                    </div>
                  </div>
                  {videoId && (
                    <div className="rounded-xl overflow-hidden border border-border">
                      <div className="relative aspect-video bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {t('generateNote.videoFound')}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Website Input */}
              {sourceType === 'website' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('generateNote.websiteUrl')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://en.wikipedia.org/wiki/..."
                      className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                  {isValidUrl && url && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t('generateNote.urlValid')}
                    </p>
                  )}
                </div>
              )}

              {/* Text Input */}
              {sourceType === 'text' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('generateNote.pasteContent')}</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('generateNote.pasteContentPlaceholder')}
                    rows={10}
                    className="w-full p-4 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('generateNote.characters', { count: text.length })}</p>
                </div>
              )}

              {/* File Upload (PDF, Audio, Handwriting) */}
              {(sourceType === 'pdf' || sourceType === 'audio' || sourceType === 'handwriting') && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('generateNote.uploadLabel', { type: sourceType === 'pdf' ? 'PDF' : sourceType === 'audio' ? 'Audio' : 'Image' })}
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-all"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept={
                        sourceType === 'pdf' ? '.pdf,.txt,.md' :
                        sourceType === 'audio' ? '.mp3,.wav,.m4a,.ogg,.flac,.webm' :
                        'image/*'
                      }
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">
                      {file ? file.name : t('generateNote.dropFile')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sourceType === 'pdf' ? t('generateNote.pdfFormats') :
                       sourceType === 'audio' ? t('generateNote.audioFormats') :
                       t('generateNote.imageFormats')}
                    </p>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                      <FileText className="w-4 h-4 text-green-500" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <button onClick={() => setFile(null)} className="p-1 hover:bg-muted rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleExtract}
                disabled={
                  (sourceType === 'youtube' && !videoId) ||
                  (sourceType === 'website' && !isValidUrl) ||
                  (sourceType === 'text' && text.length < 50) ||
                  ((sourceType === 'pdf' || sourceType === 'audio' || sourceType === 'handwriting') && !file)
                }
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('generateNote.extractButton')}
              </Button>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('generateNote.processingTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t('generateNote.processingWait')}</p>

              <div className="max-w-xs mx-auto space-y-2">
                {processingSteps.map((stepText, i) => (
                  <div key={stepText} className="flex items-center gap-3">
                    {i < processingStep ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : i === processingStep ? (
                      <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                    <span className={`text-sm ${i <= processingStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {stepText}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">{t('generateNote.extractSuccess')}</span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('generateNote.previewTitle')}</label>
                <input
                  type="text"
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              {/* AI Summary */}
              {generatedSummary && (
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-600">{t('generateNote.aiSummary')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{generatedSummary}</p>
                </div>
              )}

              {/* Tags */}
              {generatedTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('generateNote.suggestedTags')}</label>
                  <div className="flex flex-wrap gap-2">
                    {generatedTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => setGeneratedTags(generatedTags.filter((t) => t !== tag))}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('generateNote.contentPreview', { count: extractedText.length })}
                </label>
                <div className="p-4 bg-card border border-border rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {extractedText.substring(0, 1000)}
                    {extractedText.length > 1000 && '...'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('select')}
                >
                  {t('generateNote.startOver')}
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={handleSaveNote}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t('generateNote.saveNote')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
