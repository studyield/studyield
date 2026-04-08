import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Play,
  Sparkles,
  FileText,
  Brain,
  MessageSquare,
  Target,
  Upload,
  Loader2,
  Check,
  BookOpen,
  Network,
  Image,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Animated Demo Component
function AnimatedDemo() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<number[]>([]);
  const [generatedOutputs, setGeneratedOutputs] = useState<number[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const analyzeItems = [
    { icon: FileText, key: 'hero.demo.analyze1' },
    { icon: PenTool, key: 'hero.demo.analyze2' },
    { icon: Image, key: 'hero.demo.analyze3' },
    { icon: Brain, key: 'hero.demo.analyze4' },
  ];

  const generateOutputs = [
    { icon: BookOpen, key: 'hero.demo.gen1', color: 'text-amber-500', bg: 'from-amber-500/20 to-orange-500/20' },
    { icon: Target, key: 'hero.demo.gen2', color: 'text-rose-500', bg: 'from-rose-500/20 to-pink-500/20' },
    { icon: MessageSquare, key: 'hero.demo.gen3', color: 'text-blue-500', bg: 'from-blue-500/20 to-cyan-500/20' },
    { icon: Network, key: 'hero.demo.gen4', color: 'text-violet-500', bg: 'from-violet-500/20 to-purple-500/20' },
  ];

  const readyBadges = [
    { icon: BookOpen, key: 'hero.demo.ready1' },
    { icon: Target, key: 'hero.demo.ready2' },
    { icon: MessageSquare, key: 'hero.demo.ready3' },
  ];

  const stepColors = [
    { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-500', dot: 'bg-blue-500' },
    { bg: 'from-violet-500 to-purple-500', text: 'text-violet-500', dot: 'bg-violet-500' },
    { bg: 'from-amber-500 to-orange-500', text: 'text-amber-500', dot: 'bg-amber-500' },
    { bg: 'from-green-500 to-emerald-500', text: 'text-green-500', dot: 'bg-green-500' },
  ];

  const stepLabels = ['hero.demo.stepUpload', 'hero.demo.stepAnalyze', 'hero.demo.stepGenerate', 'hero.demo.stepReady'];
  const stepDots = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-green-500'];
  const statusKeys = ['hero.demo.statusUploading', 'hero.demo.statusAnalyzing', 'hero.demo.statusGenerating', 'hero.demo.statusComplete'];

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    const runLoop = async () => {
      while (!cancelled) {
        // Reset all state at the start of each cycle
        setShowConfetti(false);
        setAnalyzedItems([]);
        setGeneratedOutputs([]);
        setUploadProgress(0);
        setScanLine(0);
        setIsAnalyzing(false);

        // Step 0: Upload
        setCurrentStep(0);
        setHasStarted(true);
        for (let i = 0; i <= 100; i += 3) {
          if (cancelled) return;
          await wait(25);
          setUploadProgress(Math.min(i, 100));
        }
        setUploadProgress(100);
        if (cancelled) return;
        await wait(400);

        // Step 1: Analyze
        if (cancelled) return;
        setCurrentStep(1);
        setIsAnalyzing(true);
        for (let i = 0; i <= 100; i += 5) {
          if (cancelled) return;
          await wait(30);
          setScanLine(i);
        }
        setScanLine(0);
        for (let i = 0; i < 4; i++) {
          if (cancelled) return;
          await wait(350);
          setAnalyzedItems(prev => [...prev, i]);
        }
        if (cancelled) return;
        await wait(300);
        setIsAnalyzing(false);

        // Step 2: Generate
        if (cancelled) return;
        setCurrentStep(2);
        setGeneratedOutputs([]);
        for (let i = 0; i < 4; i++) {
          if (cancelled) return;
          await wait(400);
          setGeneratedOutputs(prev => [...prev, i]);
        }
        if (cancelled) return;
        await wait(500);

        // Step 3: Ready
        if (cancelled) return;
        setCurrentStep(3);
        setShowConfetti(true);
        if (cancelled) return;
        await wait(3500);
      }
    };

    runLoop();
    return () => { cancelled = true; };
  }, []);

  const confettiColors = ['#22c55e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="relative">
      {/* Glow */}
      <motion.div
        className={`absolute -inset-3 bg-gradient-to-r ${stepColors[currentStep].bg} rounded-2xl blur-2xl`}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <motion.div
        className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Titlebar */}
        <div className="relative bg-muted/50 border-b border-border px-5 py-3 overflow-hidden">
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${stepColors[currentStep].bg} opacity-[0.04]`}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">Studyield</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${stepColors[currentStep].text}`}>
              <motion.div
                className={`w-1.5 h-1.5 rounded-full ${stepDots[currentStep]}`}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {t(stepLabels[currentStep])}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[320px] relative">
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: confettiColors[i % confettiColors.length], left: `${Math.random() * 100}%` }}
                  initial={{ y: -10, opacity: 1, rotate: 0 }}
                  animate={{ y: 380, opacity: 0, rotate: Math.random() * 360, x: (Math.random() - 0.5) * 80 }}
                  transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.4, ease: 'easeOut' }}
                />
              ))}
            </div>
          )}

          {/* Step Indicators */}
          <div className="flex items-center gap-1 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center flex-1">
                <motion.div
                  className={`relative overflow-hidden w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    hasStarted && i < currentStep ? `${stepDots[i]} text-white shadow-md` :
                    hasStarted && i === currentStep ? `${stepDots[i]} text-white shadow-lg` :
                    'bg-muted text-muted-foreground'
                  }`}
                  animate={hasStarted && i === currentStep ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {hasStarted && i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                  {hasStarted && i === currentStep && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${stepDots[i]}`}
                      initial={{ scale: 1, opacity: 0 }}
                      animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                {i < 3 && (
                  <div className="flex-1 h-0.5 mx-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${stepDots[i]} rounded-full`}
                      animate={{ width: hasStarted && i < currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Upload */}
            {currentStep === 0 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
                  <motion.div
                    className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{t('hero.demo.fileName')}</p>
                    <p className="text-xs text-muted-foreground">{t('hero.demo.fileInfo')}</p>
                  </div>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Upload className="w-4 h-4 text-blue-500" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                      {t('hero.demo.uploadingDocument')}
                    </span>
                    <span className="font-semibold text-blue-500">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* File type tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {['PDF', 'DOCX', 'Images', 'Markdown'].map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${
                        i === 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-muted/50 border-border text-muted-foreground'
                      }`}
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analyze */}
            {currentStep === 1 && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="relative p-3.5 rounded-xl bg-violet-500/8 border border-violet-500/15 overflow-hidden">
                  {scanLine > 0 && (
                    <motion.div
                      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                      style={{ top: `${scanLine}%` }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-11 h-11 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25"
                      animate={isAnalyzing ? { rotateY: [0, 360] } : {}}
                      transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: 'linear' }}
                    >
                      <Brain className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-sm">{t('hero.demo.aiAnalysis')}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAnalyzing ? t('hero.demo.scanningDocument') : t('hero.demo.extractingKeyConcepts')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {analyzeItems.map((item, index) => {
                    const done = analyzedItems.includes(index);
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: done ? 1 : 0.35, y: done ? 0 : 8 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                          done ? 'bg-violet-500/8 border-violet-500/20' : 'bg-muted/20 border-transparent'
                        }`}
                      >
                        {done ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shrink-0"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon className={`w-3 h-3 shrink-0 ${done ? 'text-violet-500' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium truncate ${done ? '' : 'text-muted-foreground'}`}>
                            {t(item.key)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Generate */}
            {currentStep === 2 && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                  <motion.div
                    className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25"
                    animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-semibold text-sm">{t('hero.demo.generatingContent')}</p>
                    <p className="text-xs text-muted-foreground">{t('hero.demo.creatingPersonalizedMaterials')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2" style={{ perspective: '800px' }}>
                  {generateOutputs.map((output, index) => {
                    const Icon = output.icon;
                    const done = generatedOutputs.includes(index);
                    return (
                      <motion.div
                        key={output.key}
                        initial={{ opacity: 0, rotateX: -60, y: 20 }}
                        animate={{ opacity: done ? 1 : 0.3, rotateX: done ? 0 : -20, y: done ? 0 : 10 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all ${
                          done ? 'bg-card border-amber-500/20 shadow-sm' : 'bg-muted/15 border-transparent'
                        }`}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          done ? `bg-gradient-to-br ${output.bg}` : 'bg-muted'
                        }`}>
                          <Icon className={`w-4 h-4 ${done ? output.color : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${done ? '' : 'text-muted-foreground'}`}>
                            {t(output.key)}
                          </p>
                          {done && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[10px] text-amber-500 font-medium"
                            >
                              {t('hero.demo.generated')}
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Ready */}
            {currentStep === 3 && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center py-2"
              >
                <div className="relative w-20 h-20 mx-auto mb-5">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-green-500/50"
                      animate={{ scale: [1, 1.5 + i * 0.2], opacity: [0.4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                <motion.h3
                  className="text-xl font-bold mb-1.5 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {t('hero.demo.readyToLearn')}
                </motion.h3>
                <motion.p
                  className="text-xs text-muted-foreground mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('hero.demo.materialsReady')}
                </motion.p>

                <div className="flex items-center justify-center gap-2">
                  {readyBadges.map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                    >
                      <item.icon className="w-3 h-3" />
                      <span className="text-[11px] font-medium">{t(item.key)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-t border-border px-5 py-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {t('hero.demo.stepProgress', { step: currentStep + 1 })} — {t(statusKeys[currentStep])}
            </span>
            <motion.span
              className="flex items-center gap-1.5 text-green-500 font-medium"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              {t('hero.demo.aiProcessing')}
            </motion.span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ctaLink = isAuthenticated ? '/dashboard' : '/welcome';
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-indigo-400/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-amber-400/15 to-orange-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-slate-300/10 to-gray-300/10 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
      </div>

      <div className="container mx-auto px-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-500/10 to-zinc-500/10 border border-slate-400/20 text-sm font-medium text-foreground mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </motion.div>
                <span>{t('hero.badge')}</span>
                <motion.div
                  className="w-2 h-2 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] mb-6"
            >
              <span className="block">{t('hero.titleLine1')}</span>
              <span className="relative">
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {t('hero.titleLine2')}
                </span>
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <motion.path
                    d="M2 8 Q 75 2, 150 8 Q 225 14, 298 8"
                    stroke="url(#heroGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                      <stop offset="50%" stopColor="rgb(16, 185, 129)" />
                      <stop offset="100%" stopColor="rgb(20, 184, 166)" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('hero.description')) }}
            />

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 h-12 px-8 text-base"
                  asChild
                >
                  <Link to={ctaLink}>
                    {t('hero.startLearningFree')}
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base group"
                  asChild
                >
                  <a href="#how-it-works">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Play className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
                    </motion.div>
                    {t('hero.watchDemo')}
                  </a>
                </Button>
              </motion.div>
            </motion.div>

          </motion.div>

          {/* Right Content - Animated Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:ml-8"
          >
            <AnimatedDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
