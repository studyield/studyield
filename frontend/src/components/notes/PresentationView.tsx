import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '@/types';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  Palette,
  Sparkles,
  Clock,
  Grid3X3,
  Monitor,
  FileText,
  Keyboard,
  RotateCcw,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// Themes
const THEMES = [
  { id: 'dark', name: 'Dark', bg: 'bg-gray-900', text: 'text-white', accent: 'text-green-400' },
  { id: 'light', name: 'Light', bg: 'bg-white', text: 'text-gray-900', accent: 'text-green-600' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-950', text: 'text-white', accent: 'text-blue-400' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-950', text: 'text-white', accent: 'text-purple-400' },
  { id: 'green', name: 'Green', bg: 'bg-emerald-950', text: 'text-white', accent: 'text-emerald-400' },
  { id: 'warm', name: 'Warm', bg: 'bg-amber-50', text: 'text-amber-900', accent: 'text-amber-600' },
  { id: 'midnight', name: 'Midnight', bg: 'bg-slate-950', text: 'text-slate-100', accent: 'text-cyan-400' },
  { id: 'studyield', name: 'Studyield', bg: 'bg-black', text: 'text-white', accent: 'text-green-500' },
];

const TRANSITIONS = ['fade', 'slide', 'scale', 'none'] as const;
type TransitionType = (typeof TRANSITIONS)[number];

interface PresentationViewProps {
  note: Note;
  onClose: () => void;
}

interface Slide {
  title: string;
  content: string;
  notes: string;
}

// Convert markdown to styled HTML
function markdownToHtml(md: string, theme: (typeof THEMES)[0]): string {
  let html = md;

  // Headers with proper styling
  html = html.replace(
    /^######\s+(.+)$/gm,
    `<h6 class="text-lg font-medium mb-2 ${theme.accent}">$1</h6>`
  );
  html = html.replace(
    /^#####\s+(.+)$/gm,
    `<h5 class="text-xl font-medium mb-3 ${theme.accent}">$1</h5>`
  );
  html = html.replace(
    /^####\s+(.+)$/gm,
    `<h4 class="text-2xl font-semibold mb-3 ${theme.accent}">$1</h4>`
  );
  html = html.replace(
    /^###\s+(.+)$/gm,
    `<h3 class="text-3xl font-semibold mb-4 ${theme.accent}">$1</h3>`
  );
  html = html.replace(
    /^##\s+(.+)$/gm,
    `<h2 class="text-4xl font-bold mb-4 ${theme.accent}">$1</h2>`
  );
  html = html.replace(
    /^#\s+(.+)$/gm,
    `<h1 class="text-5xl font-bold mb-6 ${theme.accent}">$1</h1>`
  );

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

  // Highlight
  html = html.replace(
    /==(.+?)==/g,
    `<mark class="px-1 rounded bg-yellow-500/30 ${theme.accent}">$1</mark>`
  );

  // Code blocks
  html = html.replace(
    /```(\w+)?\n([\s\S]+?)```/g,
    '<pre class="bg-black/30 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono text-left"><code>$2</code></pre>'
  );
  html = html.replace(
    /`(.+?)`/g,
    '<code class="bg-black/20 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Lists - wrap in ul
  const listItemRegex = /^[-*+]\s+(.+)$/gm;
  html = html.replace(listItemRegex, '<li class="ml-6 mb-3 list-disc text-left">$1</li>');

  // Wrap consecutive li tags in ul
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="text-2xl my-6 space-y-2">$&</ul>');

  // Numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-6 mb-3 list-decimal text-left">$1</li>');

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="max-h-80 mx-auto rounded-lg shadow-lg my-4" />'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" class="${theme.accent} underline hover:opacity-80" target="_blank">$1</a>`
  );

  // Blockquotes
  html = html.replace(
    /^>\s+(.+)$/gm,
    `<blockquote class="border-l-4 border-current pl-4 italic my-4 opacity-80 text-left text-xl">$1</blockquote>`
  );

  // Paragraphs - split by double newlines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      // Don't wrap if already wrapped in block elements
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<li')
      ) {
        return trimmed;
      }
      if (trimmed) {
        return `<p class="text-2xl leading-relaxed mb-4">${trimmed.replace(/\n/g, '<br/>')}</p>`;
      }
      return '';
    })
    .join('\n');

  return html;
}

export function PresentationView({ note, onClose }: PresentationViewProps) {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [theme, setTheme] = useState(THEMES[7]); // Studyield theme
  const [transition, setTransition] = useState<TransitionType>('slide');
  const [autoSlideInterval, setAutoSlideInterval] = useState(5);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] || null;

  // Generate slides using AI
  const generateSlides = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ slides: Slide[] }>(ENDPOINTS.ai.generateSlides, {
        content: note.content,
        title: note.title,
        slideCount: 8,
      });

      const data = response.data;
      if (data.slides && data.slides.length > 0) {
        setSlides(data.slides);
      } else {
        throw new Error('No slides generated');
      }
    } catch (err) {
      console.error('Failed to generate slides:', err);
      setError(t('presentation.failedTitle'));
    } finally {
      setIsLoading(false);
    }
  }, [note.content, note.title]);

  // Generate slides on mount
  useEffect(() => {
    generateSlides();
  }, [generateSlides]);

  // Navigation
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
      setShowOverview(false);
    },
    [totalSlides]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault();
          goPrev();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentIndex(totalSlides - 1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'o':
        case 'O':
          e.preventDefault();
          setShowOverview((prev) => !prev);
          break;
        case 'Escape':
          if (showOverview) {
            setShowOverview(false);
          } else if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'b':
        case 'B':
        case '.':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, totalSlides, showOverview, isFullscreen, onClose, isLoading]);

  // Timer
  useEffect(() => {
    if (!isLoading) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  // Auto-play
  useEffect(() => {
    if (isPlaying && !isLoading) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= totalSlides - 1) {
            setIsPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, autoSlideInterval * 1000);
    } else if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, autoSlideInterval, totalSlides, isLoading]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Export as HTML
  const handleExportHTML = useCallback(() => {
    const slidesHtml = slides
      .map(
        (slide, i) => `
      <div class="slide" data-index="${i}">
        <h1 class="text-4xl font-bold mb-8 ${theme.accent}">${slide.title}</h1>
        ${markdownToHtml(slide.content, theme)}
      </div>
    `
      )
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${note.title} - Presentation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .slide { display: none; min-height: 100vh; padding: 4rem; }
    .slide.active { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .controls { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; gap: 1rem; }
    .controls button { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
    .controls button:hover { background: rgba(255,255,255,0.2); }
    .counter { position: fixed; bottom: 2rem; right: 2rem; color: rgba(255,255,255,0.5); font-size: 1.25rem; }
  </style>
</head>
<body class="${theme.bg} ${theme.text}">
  ${slidesHtml}
  <div class="controls">
    <button onclick="prev()">← Previous</button>
    <button onclick="next()">Next →</button>
  </div>
  <div class="counter"><span id="current">1</span> / ${slides.length}</div>
  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    function show(i) {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
      document.getElementById('current').textContent = i + 1;
    }
    function next() { if (current < slides.length - 1) { current++; show(current); } }
    function prev() { if (current > 0) { current--; show(current); } }
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    });
    show(0);
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}_presentation.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [slides, note.title, theme]);

  // Format timer
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get transition animation
  const getTransitionVariants = () => {
    switch (transition) {
      case 'slide':
        return {
          initial: { x: 100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -100, opacity: 0 },
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 },
        };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      default:
        return {
          initial: {},
          animate: {},
          exit: {},
        };
    }
  };

  // Shortcuts info
  const shortcuts = [
    { key: '→ / Space', action: t('presentation.shortcuts.nextSlide') },
    { key: '←', action: t('presentation.shortcuts.previousSlide') },
    { key: 'Home', action: t('presentation.shortcuts.firstSlide') },
    { key: 'End', action: t('presentation.shortcuts.lastSlide') },
    { key: 'O', action: t('presentation.shortcuts.overviewMode') },
    { key: 'F', action: t('presentation.shortcuts.fullscreen') },
    { key: 'B / .', action: t('presentation.shortcuts.pauseResume') },
    { key: 'Esc', action: t('presentation.shortcuts.exit') },
  ];

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mb-6"
          >
            <Sparkles className="w-16 h-16 text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('presentation.generatingTitle')}</h2>
          <p className="text-white/60 mb-4">{t('presentation.generatingSubtitle')}</p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-green-500" />
            <span className="text-white/40 text-sm">{t('presentation.generatingWait')}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('presentation.failedTitle')}</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateSlides}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('presentation.tryAgain')}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              {t('presentation.close')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('fixed inset-0 z-50 flex flex-col', theme.bg, theme.text)}
    >
      {/* Top Bar */}
      <div className="h-12 bg-black/30 backdrop-blur flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-medium flex items-center gap-2 text-sm">
            <Monitor className="w-4 h-4 text-green-500" />
            <span className="max-w-[200px] truncate">{note.title}</span>
          </h2>
          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {totalSlides}
          </span>
          <span className="text-xs text-green-500/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t('presentation.aiGenerated')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
            <Clock className="w-4 h-4 text-white/50" />
            <span className="text-white/70 text-sm font-mono">{formatTimer(timer)}</span>
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isPlaying ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            )}
            title={isPlaying ? t('presentation.pause') : t('presentation.autoPlay')}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <div className="w-px h-6 bg-white/20" />

          {/* Regenerate */}
          <button
            onClick={generateSlides}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            title={t('presentation.regenerate')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Overview */}
          <button
            onClick={() => setShowOverview(!showOverview)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showOverview ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
            )}
            title={t('presentation.overview')}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Speaker Notes */}
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showSpeakerNotes ? 'bg-purple-500 text-white' : 'bg-white/10 hover:bg-white/20'
            )}
            title={t('presentation.speakerNotes')}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Shortcuts */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            title={t('presentation.shortcutsButton')}
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/20" />

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showSettings ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
            )}
            title={t('presentation.settings')}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={handleExportHTML}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            title={t('presentation.exportHtml')}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            title={t('presentation.fullscreenButton')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-red-500 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Slide Container */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-16 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentSlide && (
              <motion.div
                key={currentIndex}
                {...getTransitionVariants()}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl text-center"
              >
                {/* Slide Title */}
                <h1 className={cn('text-5xl md:text-6xl font-bold mb-8', theme.accent)}>
                  {currentSlide.title}
                </h1>

                {/* Slide Content */}
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: markdownToHtml(currentSlide.content, theme),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all',
              currentIndex === 0 && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goNext}
            disabled={currentIndex === totalSlides - 1}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all',
              currentIndex === totalSlides - 1 && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Slide Thumbnails (Left) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                'w-8 h-6 rounded border text-[10px] font-medium transition-all',
                idx === currentIndex
                  ? 'bg-green-500 border-green-500 text-white scale-110'
                  : 'bg-white/10 border-white/20 text-white/50 hover:bg-white/20'
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Speaker Notes Panel */}
        <AnimatePresence>
          {showSpeakerNotes && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-900 border-l border-white/10 overflow-hidden shrink-0"
            >
              <div className="p-4 h-full flex flex-col w-[300px]">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white font-medium text-sm">{t('presentation.speakerNotes')}</h3>
                </div>
                <div className="flex-1 overflow-auto">
                  {currentSlide?.notes ? (
                    <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                      {currentSlide.notes}
                    </p>
                  ) : (
                    <p className="text-white/30 text-sm italic">{t('presentation.noNotes')}</p>
                  )}
                </div>

                {/* Next slide preview */}
                {currentIndex < totalSlides - 1 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/30 text-xs mb-2">{t('presentation.upNext')}</p>
                    <div className="bg-white/5 rounded p-2 text-white/50 text-xs">
                      <span className="font-medium">{slides[currentIndex + 1]?.title}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-gray-900 border-l border-white/10 overflow-hidden shrink-0"
            >
              <div className="p-4 h-full overflow-auto w-[280px]">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {t('presentation.settings')}
                </h3>

                {/* Theme */}
                <div className="mb-6">
                  <label className="text-white/50 text-xs uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Palette className="w-3 h-3" />
                    {t('presentation.theme')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'w-full aspect-square rounded-lg border-2 transition-all flex items-center justify-center',
                          t.bg,
                          theme.id === t.id ? 'border-green-500 scale-105' : 'border-transparent'
                        )}
                        title={t.name}
                      >
                        <span className={cn('text-[8px] font-bold', t.accent)}>Aa</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transition */}
                <div className="mb-6">
                  <label className="text-white/50 text-xs uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Sparkles className="w-3 h-3" />
                    {t('presentation.transition')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRANSITIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTransition(t)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all',
                          transition === t
                            ? 'bg-green-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-slide interval */}
                <div className="mb-6">
                  <label className="text-white/50 text-xs uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Clock className="w-3 h-3" />
                    {t('presentation.autoAdvance', { seconds: autoSlideInterval })}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    step="1"
                    value={autoSlideInterval}
                    onChange={(e) => setAutoSlideInterval(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                </div>

                {/* Reset Timer */}
                <button
                  onClick={() => setTimer(0)}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('presentation.resetTimer')}
                </button>

                {/* Info */}
                <div className="mt-6 pt-4 border-t border-white/10 text-white/30 text-xs space-y-1">
                  <p>{t('presentation.totalSlides', { count: totalSlides })}</p>
                  <p>{t('presentation.source', { type: note.sourceType })}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overview Modal */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 z-20 p-8 overflow-auto"
            onClick={() => setShowOverview(false)}
          >
            <h3 className="text-white text-xl font-semibold mb-6 text-center">{t('presentation.slideOverview')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {slides.map((slide, idx) => (
                <motion.button
                  key={idx}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(idx);
                  }}
                  className={cn(
                    'aspect-video rounded-lg border-2 p-4 text-left transition-all overflow-hidden relative',
                    theme.bg,
                    idx === currentIndex
                      ? 'border-green-500 ring-2 ring-green-500/30'
                      : 'border-white/20 hover:border-white/40'
                  )}
                >
                  <p className={cn('text-sm font-bold mb-2 line-clamp-1', theme.accent)}>
                    {slide.title}
                  </p>
                  <div className="text-[8px] leading-tight opacity-70 line-clamp-4">
                    {slide.content.replace(/[#*_=[\]()]/g, '').slice(0, 150)}
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs font-bold opacity-50">
                    {idx + 1}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-green-500" />
                {t('presentation.keyboardShortcuts')}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <kbd className="px-2 py-1 bg-white/10 rounded text-white text-sm font-mono">
                      {s.key}
                    </kbd>
                    <span className="text-white/70 text-sm">{s.action}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="mt-4 w-full py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
              >
                {t('presentation.gotIt')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
