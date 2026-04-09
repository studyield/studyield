import { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  FileText,
  Video,
  Mic,
  Music,
  Globe,
  Camera,
  FileSpreadsheet,
  Type,
  Upload,
  Loader2,
  Sparkles,
  Check,
  X,
  Play,
  Pause,
  Square as StopIcon,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  Plus,
  Link2,
  Search,
  CheckCircle2,
  Circle,
  XCircle,
  Image,
  PenLine,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
type Step =
  | 'select'
  | 'pdf'
  | 'youtube'
  | 'audio-record'
  | 'audio-file'
  | 'website'
  | 'camera'
  | 'google-docs'
  | 'text'
  | 'handwriting'
  | 'processing'
  | 'success';

interface ProcessingState {
  source: string;
  steps: string[];
  currentStepIndex: number;
  progress: number;
  error: string | null;
}

interface ImportResult {
  cards: Array<{ front: string; back: string }>;
  extractedSections: number;
  source: string;
  contentPreview: string;
  sourceMetadata?: {
    title: string;
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    extractedText?: string;
  };
}

interface ImportSectionProps {
  onCardsImported: (cards: Array<{ front: string; back: string }>) => void;
  studySetId?: string;
}

// ─── Constants ──────────────────────────────────────────────────────
const IMPORT_SOURCES = [
  { key: 'pdf' as const, labelKey: 'importSection.pdfUpload', descKey: 'importSection.pdfUploadDesc', icon: FileText, color: 'bg-red-500/10 text-red-500', borderColor: 'hover:border-red-500/40' },
  { key: 'youtube' as const, labelKey: 'importSection.youtubeVideo', descKey: 'importSection.youtubeVideoDesc', icon: Video, color: 'bg-red-500/10 text-red-500', borderColor: 'hover:border-red-500/40' },
  { key: 'audio-record' as const, labelKey: 'importSection.recordAudio', descKey: 'importSection.recordAudioDesc', icon: Mic, color: 'bg-emerald-500/10 text-emerald-500', borderColor: 'hover:border-emerald-500/40' },
  { key: 'audio-file' as const, labelKey: 'importSection.audioFile', descKey: 'importSection.audioFileDesc', icon: Music, color: 'bg-blue-500/10 text-blue-500', borderColor: 'hover:border-blue-500/40' },
  { key: 'website' as const, labelKey: 'importSection.websiteUrl', descKey: 'importSection.websiteUrlDesc', icon: Globe, color: 'bg-purple-500/10 text-purple-500', borderColor: 'hover:border-purple-500/40' },
  { key: 'camera' as const, labelKey: 'importSection.cameraScan', descKey: 'importSection.cameraScanDesc', icon: Camera, color: 'bg-amber-500/10 text-amber-500', borderColor: 'hover:border-amber-500/40' },
  { key: 'google-docs' as const, labelKey: 'importSection.googleDocs', descKey: 'importSection.googleDocsDesc', icon: FileSpreadsheet, color: 'bg-sky-500/10 text-sky-500', borderColor: 'hover:border-sky-500/40' },
  { key: 'text' as const, labelKey: 'importSection.pasteText', descKey: 'importSection.pasteTextDesc', icon: Type, color: 'bg-slate-500/10 text-slate-500', borderColor: 'hover:border-slate-500/40' },
  { key: 'handwriting' as const, labelKey: 'importSection.handwrittenNotes', descKey: 'importSection.handwrittenNotesDesc', icon: PenLine, color: 'bg-indigo-500/10 text-indigo-500', borderColor: 'hover:border-indigo-500/40' },
];

const PROCESSING_STEPS: Record<string, string[]> = {
  pdf: ['Uploading file', 'Extracting text', 'Generating flashcards'],
  youtube: ['Fetching video', 'Extracting transcript', 'Generating flashcards'],
  'audio-record': ['Uploading recording', 'Transcribing audio', 'Generating flashcards'],
  'audio-file': ['Uploading audio', 'Transcribing audio', 'Generating flashcards'],
  website: ['Fetching webpage', 'Extracting content', 'Generating flashcards'],
  camera: ['Processing images', 'Running OCR', 'Generating flashcards'],
  'google-docs': ['Fetching documents', 'Extracting content', 'Generating flashcards'],
  handwriting: ['Uploading image', 'Running OCR on handwriting', 'Generating flashcards'],
};

const COUNT_PRESETS = [5, 10, 15, 20, 30, 50];

// ─── Utilities ──────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1]);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

// ─── Shared Components ──────────────────────────────────────────────
function ScreenHeader({
  icon: Icon,
  title,
  onBack,
  color,
}: {
  icon: React.ElementType;
  title: string;
  onBack: () => void;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}

function CardCountPicker({
  count,
  setCount,
}: {
  count: number;
  setCount: (n: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">Cards to generate</label>
      <div className="flex flex-wrap gap-1.5">
        {COUNT_PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCount(n)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              count === n
                ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                : 'border-border hover:border-green-500/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function WaveformBars({ isActive }: { isActive: boolean }) {
  const bars = React.useMemo(() => Array.from({ length: 30 }, () => ({
    height: Math.random() * 56 + 8,
    duration: 0.4 + Math.random() * 0.4,
  })), []);

  return (
    <div className="flex items-center justify-center gap-[3px] h-20">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-emerald-500"
          animate={
            isActive
              ? { height: [6, bar.height, 6] }
              : { height: 6 }
          }
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.02,
          }}
        />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SOURCE SCREENS
// ═════════════════════════════════════════════════════════════════════

// ── PDF Upload ─────────────────────────────────────────────────────
function PDFScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (files: File[], count: number) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={FileText} title="Upload PDF" onBack={onBack} color="bg-red-500/10 text-red-500" />

      <div
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-red-500/30 hover:bg-red-500/5 transition-all mb-4"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.csv"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, TXT, MD, CSV (max 20MB each)</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Add more files
          </button>
        </div>
      )}

      <div className="space-y-4">
        <CardCountPicker count={count} setCount={setCount} />
        <Button
          type="button"
          onClick={() => onSubmit(files, count)}
          disabled={files.length === 0}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Extract & Generate {count} Cards
        </Button>
      </div>
    </motion.div>
  );
}

// ── YouTube Import ──────────────────────────────────────────────────
function YouTubeScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (url: string, count: number) => void;
}) {
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(10);
  const videoId = extractYouTubeId(url);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={Video} title="YouTube Video" onBack={onBack} color="bg-red-500/10 text-red-500" />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">YouTube URL</label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>
      </div>

      {/* Video preview */}
      {videoId && (
        <div className="mb-4 rounded-xl overflow-hidden border border-border bg-black/5">
          <div className="relative aspect-video">
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>Video found</span>
              <span className="text-muted-foreground/50">|</span>
              <span>Transcript will be extracted</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <CardCountPicker count={count} setCount={setCount} />
        <Button
          type="button"
          onClick={() => onSubmit(url, count)}
          disabled={!videoId}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Extract & Generate {count} Cards
        </Button>
      </div>
    </motion.div>
  );
}

// ── Audio Recording ─────────────────────────────────────────────────
function AudioRecordScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (blob: Blob, count: number) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'done'>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [count, setCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorder.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setStatus('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser settings.');
    }
  };

  const pauseRecording = () => {
    mediaRecorder.current?.pause();
    setStatus('paused');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeRecording = () => {
    mediaRecorder.current?.resume();
    setStatus('recording');
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setStatus('done');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetRecording = () => {
    setStatus('idle');
    setDuration(0);
    setAudioUrl(null);
    setAudioBlob(null);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={Mic} title="Record Audio" onBack={onBack} color="bg-emerald-500/10 text-emerald-500" />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-muted/30 rounded-xl p-6 mb-4">
        {/* Waveform / Timer */}
        <div className="mb-4">
          <WaveformBars isActive={status === 'recording'} />
          <p className="text-center text-2xl font-mono font-bold mt-2">{formatDuration(duration)}</p>
          {status === 'idle' && (
            <p className="text-center text-xs text-muted-foreground mt-1">Click record to start</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {status === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
            >
              <Mic className="w-7 h-7 text-white" />
            </button>
          )}

          {status === 'recording' && (
            <>
              <button type="button" onClick={pauseRecording} className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <Pause className="w-5 h-5" />
              </button>
              <button type="button" onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg animate-pulse">
                <StopIcon className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button type="button" onClick={resumeRecording} className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <Play className="w-5 h-5" />
              </button>
              <button type="button" onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
                <StopIcon className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {status === 'done' && (
            <button type="button" onClick={resetRecording} className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" />Re-record
            </button>
          )}
        </div>

        {/* Playback preview */}
        {audioUrl && status === 'done' && (
          <div className="mt-4">
            <audio controls src={audioUrl} className="w-full h-10" />
          </div>
        )}
      </div>

      {status === 'done' && audioBlob && (
        <div className="space-y-4">
          <CardCountPicker count={count} setCount={setCount} />
          <Button type="button" onClick={() => onSubmit(audioBlob, count)} className="w-full bg-green-500 hover:bg-green-600">
            <Sparkles className="w-4 h-4 mr-2" />
            Transcribe & Generate {count} Cards
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Audio File Upload ───────────────────────────────────────────────
function AudioFileScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (file: File, count: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioUrl = file ? URL.createObjectURL(file) : null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={Music} title="Audio File" onBack={onBack} color="bg-blue-500/10 text-blue-500" />

      <div
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-all mb-4"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,.flac,.webm"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
          className="hidden"
        />
        <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Drop audio file or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, OGG, FLAC (max 50MB)</p>
      </div>

      {file && (
        <div className="bg-muted/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Music className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-muted rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {audioUrl && <audio controls src={audioUrl} className="w-full h-10" />}
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Audio will be transcribed using AI (Whisper)</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <CardCountPicker count={count} setCount={setCount} />
        <Button
          type="button"
          onClick={() => file && onSubmit(file, count)}
          disabled={!file}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Transcribe & Generate {count} Cards
        </Button>
      </div>
    </motion.div>
  );
}

// ── Website URL ─────────────────────────────────────────────────────
function WebsiteScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (url: string, count: number, includeImages: boolean) => void;
}) {
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(10);
  const [includeImages, setIncludeImages] = useState(false);
  const isValidUrl = /^https?:\/\/.+\..+/.test(url);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={Globe} title="Website URL" onBack={onBack} color="bg-purple-500/10 text-purple-500" />

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">Website URL</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
      </div>

      {isValidUrl && (
        <div className="bg-muted/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{url}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>URL looks valid</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="w-4 h-4 rounded border-border text-green-500 focus:ring-green-500/20"
              />
              <span className="text-xs text-muted-foreground">
                <Image className="w-3.5 h-3.5 inline mr-1" />
                Include images in extraction
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <CardCountPicker count={count} setCount={setCount} />
        <Button
          type="button"
          onClick={() => onSubmit(url, count, includeImages)}
          disabled={!isValidUrl}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Extract & Generate {count} Cards
        </Button>
      </div>
    </motion.div>
  );
}

// ── Camera Scan ─────────────────────────────────────────────────────
function CameraScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (images: Blob[], count: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captures, setCaptures] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(s);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
    } catch {
      setError('Camera access denied. Please allow camera access in your browser settings.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptures((prev) => [...prev, dataUrl]);
  };

  const removeCapture = (index: number) => {
    setCaptures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const blobs = captures.map((c) => dataURLtoBlob(c));
    stopCamera();
    onSubmit(blobs, count);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={Camera} title="Camera Scan" onBack={() => { stopCamera(); onBack(); }} color="bg-amber-500/10 text-amber-500" />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {!isCameraActive ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl mb-4">
          <Camera className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-3">Scan documents with your camera</p>
          <Button type="button" onClick={startCamera} variant="outline">
            <Camera className="w-4 h-4 mr-2" />Start Camera
          </Button>
        </div>
      ) : (
        <div className="mb-4">
          {/* Viewfinder */}
          <div className="relative rounded-xl overflow-hidden border border-border bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
            {/* Corner guides */}
            <div className="absolute inset-4 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br" />
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80 drop-shadow">
              Align document within the frame
            </p>
          </div>

          {/* Capture button */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={captureImage}
              className="w-16 h-16 rounded-full border-4 border-amber-500 bg-white hover:bg-amber-50 flex items-center justify-center transition-colors shadow-lg"
            >
              <Camera className="w-6 h-6 text-amber-600" />
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Captured images */}
      {captures.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Scanned Pages ({captures.length})</p>
            {isCameraActive && (
              <p className="text-xs text-muted-foreground">Tap capture to add more pages</p>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {captures.map((img, i) => (
              <div key={i} className="relative shrink-0 w-20 h-28 rounded-lg overflow-hidden border border-border">
                <img src={img} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeCapture(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/40 rounded px-1">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {captures.length > 0 && (
        <div className="space-y-4">
          <CardCountPicker count={count} setCount={setCount} />
          <Button type="button" onClick={handleSubmit} className="w-full bg-green-500 hover:bg-green-600">
            <Sparkles className="w-4 h-4 mr-2" />
            OCR & Generate {count} Cards
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Google Docs ─────────────────────────────────────────────────────
function GoogleDocsScreen({ onBack }: { onBack: () => void }) {
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock docs for connected state UI
  const mockDocs = connected
    ? [
        { id: '1', name: 'Biology Notes Chapter 3', type: 'doc', date: '2 days ago' },
        { id: '2', name: 'History Timeline', type: 'doc', date: '1 week ago' },
        { id: '3', name: 'Chemistry Formulas', type: 'sheet', date: '3 days ago' },
      ].filter((d) => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={FileSpreadsheet} title="Google Docs" onBack={onBack} color="bg-sky-500/10 text-sky-500" />

      {!connected ? (
        <div className="text-center py-12 border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-sky-500" />
          </div>
          <h4 className="font-semibold mb-1">Connect Google Account</h4>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Sign in with Google to browse and import documents from Google Drive
          </p>
          <Button type="button" onClick={() => setConnected(true)} className="bg-sky-500 hover:bg-sky-600">
            <Globe className="w-4 h-4 mr-2" />
            Connect Google Account
          </Button>
          <p className="text-[10px] text-muted-foreground mt-3">
            We only access documents you explicitly select
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Document list */}
          <div className="border border-border rounded-xl overflow-hidden">
            {mockDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No documents found</p>
            ) : (
              mockDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                  <FileText className="w-5 h-5 text-sky-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Google Docs integration is coming soon. This is a preview of the interface.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Text Paste ──────────────────────────────────────────────────────
function TextScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (cards: Array<{ front: string; back: string }>) => void;
}) {
  const [text, setText] = useState('');
  const [termSep, setTermSep] = useState('\\t');
  const [cardSep, setCardSep] = useState('\\n');

  const parseText = () => {
    if (!text.trim()) return;
    const sep = cardSep === '\\n' ? '\n' : cardSep;
    const tSep = termSep === '\\t' ? '\t' : termSep;
    const cards = text
      .split(sep)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(tSep);
        return { front: (parts[0] || '').trim(), back: (parts[1] || '').trim() };
      })
      .filter((c) => c.front);
    onSubmit(cards);
  };

  // Live preview count
  const previewCount = text.trim()
    ? text.split(cardSep === '\\n' ? '\n' : cardSep).filter((l) => l.trim()).length
    : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={Type} title="Paste Text" onBack={onBack} color="bg-slate-500/10 text-slate-500" />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Paste your terms and definitions</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste your terms and definitions here...\n\nExample (tab-separated):\nPhotosynthesis\tThe process by which plants convert sunlight to energy\nMitosis\tCell division producing two identical cells`}
            rows={10}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-y font-mono"
          />
          {previewCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {previewCount} cards detected
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Between term and definition</label>
            <select
              value={termSep}
              onChange={(e) => setTermSep(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="\\t">Tab</option>
              <option value=",">Comma</option>
              <option value=";">Semicolon</option>
              <option value=" - ">Dash ( - )</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Between cards</label>
            <select
              value={cardSep}
              onChange={(e) => setCardSep(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="\\n">New line</option>
              <option value=";">Semicolon</option>
              <option value="||">Double pipe (||)</option>
            </select>
          </div>
        </div>

        <Button type="button" onClick={parseText} disabled={!text.trim()} className="w-full bg-green-500 hover:bg-green-600">
          <FileText className="w-4 h-4 mr-2" />
          Import {previewCount > 0 ? `${previewCount} ` : ''}Cards
        </Button>
      </div>
    </motion.div>
  );
}

// ── Handwriting Upload ──────────────────────────────────────────────
function HandwritingScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (files: File[], count: number) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [count, setCount] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <ScreenHeader icon={PenLine} title="Handwritten Notes" onBack={onBack} color="bg-indigo-500/10 text-indigo-500" />

      <div
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all mb-4"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <PenLine className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Upload images of handwritten notes</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, HEIC (max 20MB each)</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border">
                <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Add more images
          </button>
        </div>
      )}

      <div className="space-y-4">
        <CardCountPicker count={count} setCount={setCount} />
        <Button
          type="button"
          onClick={() => onSubmit(files, count)}
          disabled={files.length === 0}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          OCR & Generate {count} Cards
        </Button>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PROCESSING SCREEN
// ═════════════════════════════════════════════════════════════════════
function ProcessingScreen({
  processing,
  onCancel,
}: {
  processing: ProcessingState;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const sourceLabel = (() => { const src = IMPORT_SOURCES.find((s) => s.key === processing.source); return src ? t(src.labelKey) : processing.source; })();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-4"
    >
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>

      <h3 className="font-semibold text-lg mb-1">{t('importSection.processing', { source: sourceLabel })}</h3>
      <p className="text-sm text-muted-foreground mb-6">{t('importSection.processingWait')}</p>

      {/* Step indicators */}
      <div className="max-w-xs mx-auto mb-6">
        {processing.steps.map((step, i) => {
          const isComplete = i < processing.currentStepIndex;
          const isCurrent = i === processing.currentStepIndex;

          return (
            <div key={step} className="flex items-center gap-3 py-2">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-green-500 animate-spin shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
              )}
              <span className={`text-sm ${isCurrent ? 'font-medium text-foreground' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="max-w-xs mx-auto mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${processing.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{t('importSection.complete', { progress: Math.round(processing.progress) })}</p>
      </div>

      {/* Error */}
      {processing.error && (
        <div className="max-w-sm mx-auto mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {processing.error}
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═════════════════════════════════════════════════════════════════════
function SuccessScreen({
  result,
  onAddCards,
  onImportMore,
}: {
  result: ImportResult;
  onAddCards: () => void;
  onImportMore: () => void;
}) {
  const { t } = useTranslation();
  const sourceLabel = (() => { const src = IMPORT_SOURCES.find((s) => s.key === result.source); return src ? t(src.labelKey) : result.source; })();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5"
      >
        <Check className="w-8 h-8 text-green-500" />
      </motion.div>

      <h3 className="font-semibold text-lg mb-1">{t('importSection.importSuccessful')}</h3>
      <p
        className="text-sm text-muted-foreground mb-6"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('importSection.generatedCards', { count: result.cards.length, source: sourceLabel })) }}
      />

      {/* Content preview */}
      {result.contentPreview && (
        <div className="max-w-md mx-auto mb-6 text-left bg-muted/30 rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('importSection.contentPreview')}</p>
          <p className="text-xs text-muted-foreground/80 line-clamp-3">{result.contentPreview}</p>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">
              {t('importSection.sectionsExtracted', { count: result.extractedSections })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {t('importSection.flashcardsGenerated', { count: result.cards.length })}
            </span>
          </div>
        </div>
      )}

      {/* Preview first few cards */}
      {result.cards.length > 0 && (
        <div className="max-w-md mx-auto mb-6 text-left">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('importSection.cardPreview')}</p>
          <div className="space-y-2">
            {result.cards.slice(0, 3).map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs font-medium truncate">{card.front}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{card.back}</p>
              </div>
            ))}
            {result.cards.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                {t('importSection.moreCards', { count: result.cards.length - 3 })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <Button type="button" onClick={onAddCards} className="w-full bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          {t('importSection.addCardsToSet', { count: result.cards.length })}
        </Button>
        <Button type="button" variant="outline" onClick={onImportMore} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {t('importSection.importMore')}
        </Button>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN IMPORT SECTION
// ═════════════════════════════════════════════════════════════════════
export function ImportSection({ onCardsImported, studySetId }: ImportSectionProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('select');
  const [processing, setProcessing] = useState<ProcessingState>({
    source: '',
    steps: [],
    currentStepIndex: 0,
    progress: 0,
    error: null,
  });
  const [result, setResult] = useState<ImportResult | null>(null);

  const goBack = () => setStep('select');

  // Save source to backend
  const saveSource = async (sourceData: {
    type: string;
    title: string;
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    extractedText?: string;
    flashcardsGenerated: number;
  }) => {
    if (!studySetId) return;
    try {
      await api.post(ENDPOINTS.contentSources.create, {
        studySetId,
        type: sourceData.type,
        title: sourceData.title,
        url: sourceData.url,
        fileName: sourceData.fileName,
        fileSize: sourceData.fileSize,
        mimeType: sourceData.mimeType,
        extractedText: sourceData.extractedText?.substring(0, 5000), // Limit stored text
      });
    } catch (err) {
      console.error('Failed to save source:', err);
    }
  };

  // ── Generalized processing function ──────────────────────────────
  const processWithAI = async (
    source: string,
    extractEndpoint: string,
    extractPayload: Record<string, unknown> | FormData,
    count: number,
    headers?: Record<string, string>,
    sourceMetadata?: {
      title: string;
      url?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    },
  ) => {
    const steps = PROCESSING_STEPS[source] || ['Processing', 'Generating flashcards'];
    setProcessing({ source, steps, currentStepIndex: 0, progress: 10, error: null });
    setStep('processing');

    try {
      // Step 1: Extract
      setProcessing((prev) => ({ ...prev, currentStepIndex: 0, progress: 25 }));
      const extractRes = await api.post(
        extractEndpoint,
        extractPayload,
        headers ? { headers } : undefined,
      );
      const text = extractRes.data.text || extractRes.data.transcript || extractRes.data.combinedText || '';
      if (!text) throw new Error('Could not extract content from the source.');

      // Validate text length before generating flashcards
      if (text.trim().length < 50) {
        throw new Error(`Extracted content is too short (${text.trim().length} chars). Please provide more content or try a different source.`);
      }

      // Step 2: Generate flashcards
      setProcessing((prev) => ({ ...prev, currentStepIndex: 1, progress: 60 }));
      const genRes = await api.post(ENDPOINTS.ai.generateFlashcards, { content: text, count });

      // Step 3: Done
      setProcessing((prev) => ({ ...prev, currentStepIndex: 2, progress: 100, error: null }));
      setResult({
        cards: genRes.data.flashcards || [],
        extractedSections: Math.ceil(text.length / 500),
        source,
        contentPreview: text.substring(0, 300),
        sourceMetadata: sourceMetadata ? {
          ...sourceMetadata,
          extractedText: text,
        } : undefined,
      });

      setTimeout(() => setStep('success'), 600);
    } catch (err: unknown) {
      let msg = 'Processing failed. Please try again.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
      }
      setProcessing((prev) => ({ ...prev, error: msg }));
    }
  };

  // ── PDF submit ───────────────────────────────────────────────────
  const handlePDFSubmit = async (files: File[], count: number) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('file', f));
    const firstFile = files[0];
    await processWithAI('pdf', ENDPOINTS.content.extract, fd, count, {
      'Content-Type': 'multipart/form-data',
    }, {
      title: files.length > 1 ? `${files.length} files` : firstFile.name,
      fileName: firstFile.name,
      fileSize: files.reduce((acc, f) => acc + f.size, 0),
      mimeType: firstFile.type,
    });
  };

  // ── YouTube submit ───────────────────────────────────────────────
  const handleYouTubeSubmit = async (url: string, count: number) => {
    const videoId = extractYouTubeId(url);
    await processWithAI('youtube', ENDPOINTS.content.extractYoutube, { url }, count, undefined, {
      title: `YouTube Video (${videoId})`,
      url,
    });
  };

  // ── Audio recording submit ───────────────────────────────────────
  const handleAudioRecordSubmit = async (blob: Blob, count: number) => {
    const fd = new FormData();
    fd.append('file', blob, 'recording.webm');
    await processWithAI('audio-record', ENDPOINTS.content.extractAudio, fd, count, {
      'Content-Type': 'multipart/form-data',
    }, {
      title: 'Audio Recording',
      fileName: 'recording.webm',
      fileSize: blob.size,
      mimeType: 'audio/webm',
    });
  };

  // ── Audio file submit ────────────────────────────────────────────
  const handleAudioFileSubmit = async (file: File, count: number) => {
    const fd = new FormData();
    fd.append('file', file);
    await processWithAI('audio-file', ENDPOINTS.content.extractAudio, fd, count, {
      'Content-Type': 'multipart/form-data',
    }, {
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  };

  // ── Website submit ───────────────────────────────────────────────
  const handleWebsiteSubmit = async (url: string, count: number) => {
    await processWithAI('website', ENDPOINTS.content.extractWebsite, { url }, count, undefined, {
      title: new URL(url).hostname,
      url,
    });
  };

  // ── Camera submit ────────────────────────────────────────────────
  const handleCameraSubmit = async (images: Blob[], count: number) => {
    const fd = new FormData();
    images.forEach((img, i) => fd.append('file', img, `scan-${i + 1}.jpg`));
    await processWithAI('camera', ENDPOINTS.content.extract, fd, count, {
      'Content-Type': 'multipart/form-data',
    }, {
      title: `Camera Scan (${images.length} pages)`,
      fileName: 'camera-scan.jpg',
      mimeType: 'image/jpeg',
    });
  };

  // ── Handwriting submit ──────────────────────────────────────────
  const handleHandwritingSubmit = async (files: File[], count: number) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const firstFile = files[0];
    await processWithAI('handwriting', ENDPOINTS.content.extractHandwriting, fd, count, {
      'Content-Type': 'multipart/form-data',
    }, {
      title: files.length > 1 ? `Handwritten Notes (${files.length} pages)` : firstFile.name,
      fileName: firstFile.name,
      fileSize: files.reduce((acc, f) => acc + f.size, 0),
      mimeType: firstFile.type,
    });
  };

  // ── Text paste submit (instant, no processing) ───────────────────
  const handleTextSubmit = (cards: Array<{ front: string; back: string }>) => {
    onCardsImported(cards);
    setStep('select');
  };

  // ── Success: add cards ───────────────────────────────────────────
  const handleAddCards = async () => {
    if (result) {
      // Save source if we have metadata and studySetId
      if (result.sourceMetadata && studySetId) {
        const sourceTypeMap: Record<string, string> = {
          pdf: 'file',
          youtube: 'youtube',
          'audio-record': 'audio',
          'audio-file': 'audio',
          website: 'website',
          camera: 'file',
          handwriting: 'handwriting',
        };
        await saveSource({
          type: sourceTypeMap[result.source] || 'file',
          title: result.sourceMetadata.title,
          url: result.sourceMetadata.url,
          fileName: result.sourceMetadata.fileName,
          fileSize: result.sourceMetadata.fileSize,
          mimeType: result.sourceMetadata.mimeType,
          extractedText: result.sourceMetadata.extractedText,
          flashcardsGenerated: result.cards.length,
        });
      }

      onCardsImported(result.cards);
      setResult(null);
      setStep('select');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* ── Selection Screen ── */}
      {step === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <p className="text-sm text-muted-foreground mb-4">{t('importSection.title')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {IMPORT_SOURCES.map((source) => (
              <button
                key={source.key}
                type="button"
                onClick={() => setStep(source.key)}
                className={`flex flex-col items-center gap-2.5 p-4 bg-card border border-border rounded-xl text-center transition-all hover:shadow-md ${source.borderColor}`}
              >
                <div className={`w-11 h-11 rounded-xl ${source.color} flex items-center justify-center`}>
                  <source.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t(source.labelKey)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t(source.descKey)}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Source Screens ── */}
      {step === 'pdf' && <PDFScreen key="pdf" onBack={goBack} onSubmit={handlePDFSubmit} />}
      {step === 'youtube' && <YouTubeScreen key="youtube" onBack={goBack} onSubmit={handleYouTubeSubmit} />}
      {step === 'audio-record' && <AudioRecordScreen key="audio-record" onBack={goBack} onSubmit={handleAudioRecordSubmit} />}
      {step === 'audio-file' && <AudioFileScreen key="audio-file" onBack={goBack} onSubmit={handleAudioFileSubmit} />}
      {step === 'website' && <WebsiteScreen key="website" onBack={goBack} onSubmit={handleWebsiteSubmit} />}
      {step === 'camera' && <CameraScreen key="camera" onBack={goBack} onSubmit={handleCameraSubmit} />}
      {step === 'google-docs' && <GoogleDocsScreen key="google-docs" onBack={goBack} />}
      {step === 'text' && <TextScreen key="text" onBack={goBack} onSubmit={handleTextSubmit} />}
      {step === 'handwriting' && <HandwritingScreen key="handwriting" onBack={goBack} onSubmit={handleHandwritingSubmit} />}

      {/* ── Processing Screen ── */}
      {step === 'processing' && (
        <ProcessingScreen
          key="processing"
          processing={processing}
          onCancel={goBack}
        />
      )}

      {/* ── Success Screen ── */}
      {step === 'success' && result && (
        <SuccessScreen
          key="success"
          result={result}
          onAddCards={handleAddCards}
          onImportMore={goBack}
        />
      )}
    </AnimatePresence>
  );
}
