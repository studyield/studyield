import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Brain,
  FileText,
  MessageSquare,
  Target,
  GraduationCap,
  Sparkles,
  PenTool,
  Route,
  BarChart3,
  Zap,
  Network,
  ArrowRight,
  Check,
  Upload,
  Send,
  Bot,
  Loader2,
  Play,
  Layers,
  Scan,
  Map,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

// ─── Animated Demos ──────────────────────────────────────────────────

function AIChatDemo() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const conversation = [
    { role: 'user', text: 'What is photosynthesis?' },
    { role: 'ai', text: 'Photosynthesis is the process by which plants convert sunlight, water, and CO₂ into glucose and oxygen.\n6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
    { role: 'user', text: 'Create flashcards from this' },
    { role: 'ai', text: '✨ Generated 5 flashcards!\n• Definition\n• Chemical Equation\n• Inputs & Outputs' },
  ];

  useEffect(() => {
    const runChat = async () => {
      setMessages([]);
      for (let i = 0; i < conversation.length; i++) {
        await new Promise(r => setTimeout(r, 700));
        if (conversation[i].role === 'ai') {
          setIsTyping(true);
          await new Promise(r => setTimeout(r, 1000));
          setIsTyping(false);
        }
        setMessages(prev => [...prev, conversation[i]]);
        await new Promise(r => setTimeout(r, 500));
      }
      await new Promise(r => setTimeout(r, 3000));
    };
    runChat();
    const interval = setInterval(runChat, 11000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 overflow-hidden h-full shadow-lg flex flex-col">
      <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-b border-border/50 px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-medium leading-none">Studyield AI</p>
          <p className="text-[9px] text-indigo-500 flex items-center gap-0.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
            {t('featuresPage.aiChat.online')}
          </p>
        </div>
      </div>
      <div className="p-2.5 space-y-1.5 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[88%] rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed', msg.role === 'user' ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm' : 'bg-muted/80 rounded-bl-sm')}>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-0.5 px-2.5 py-1.5 bg-muted/50 rounded-xl w-fit">
            {[0, 1, 2].map(i => <motion.div key={i} className="w-1 h-1 bg-indigo-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />)}
          </motion.div>
        )}
      </div>
      <div className="border-t border-border/50 p-2">
        <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5">
          <input type="text" placeholder={t('featuresPage.aiChat.askAnything')} className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground" disabled />
          <Send className="w-3 h-3 text-indigo-500" />
        </div>
      </div>
    </div>
  );
}

function FlashcardDemo() {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const cards = [
    { front: 'What is the powerhouse of the cell?', back: 'Mitochondria', color: 'from-amber-500 to-orange-500' },
    { front: 'H₂O is the chemical formula for?', back: 'Water', color: 'from-orange-500 to-rose-500' },
    { front: 'Red Planet?', back: 'Mars', color: 'from-rose-500 to-pink-500' },
  ];

  useEffect(() => {
    const flip = setInterval(() => setIsFlipped(prev => !prev), 2000);
    const card = setInterval(() => { setIsFlipped(false); setTimeout(() => setCardIndex(prev => (prev + 1) % cards.length), 300); }, 4000);
    return () => { clearInterval(flip); clearInterval(card); };
  }, []);

  return (
    <div className="relative h-full flex items-center justify-center p-3" style={{ perspective: '800px' }}>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[78%] h-[120px] bg-muted/30 rounded-lg transform rotate-[-3deg]" />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[85%] h-[120px] bg-muted/50 rounded-lg transform rotate-[-1.5deg]" />
      <motion.div className="relative w-full h-[140px]" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring' }} style={{ transformStyle: 'preserve-3d' }}>
        <div className={cn('absolute inset-0 rounded-lg p-4 flex flex-col items-center justify-center text-center', `bg-gradient-to-br ${cards[cardIndex].color}`)} style={{ backfaceVisibility: 'hidden' }}>
          <p className="text-white font-medium text-sm">{cards[cardIndex].front}</p>
          <p className="text-white/60 text-[9px] mt-2">{t('featuresPage.smartFlashcards.tapToReveal')}</p>
        </div>
        <div className="absolute inset-0 rounded-lg bg-card border-2 border-amber-500 p-4 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <Check className="w-5 h-5 text-amber-500 mb-1" />
          <p className="font-bold text-lg text-amber-500">{cards[cardIndex].back}</p>
        </div>
      </motion.div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {cards.map((_, i) => <div key={i} className={cn('w-1 h-1 rounded-full transition-all', i === cardIndex ? 'bg-amber-500 w-4' : 'bg-muted-foreground/30')} />)}
      </div>
    </div>
  );
}

function AnalyticsDemo() {
  const { t } = useTranslation();
  const bars = [65, 45, 80, 55, 90, 70, 85];

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: t('featuresPage.analyticsDashboard.cardsStudied'), value: '248', icon: BookOpen, change: '+12%' },
          { label: t('featuresPage.analyticsDashboard.streak'), value: `7d`, icon: Zap, change: t('featuresPage.analyticsDashboard.best') },
          { label: t('featuresPage.analyticsDashboard.mastery'), value: '76%', icon: Target, change: '+5%' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-muted/30 rounded-md p-1.5 text-center">
            <stat.icon className="w-3 h-3 text-rose-500 mx-auto mb-0.5" />
            <p className="text-xs font-bold">{stat.value}</p>
            <p className="text-[8px] text-muted-foreground truncate">{stat.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex-1 flex items-end gap-1">
        {bars.map((height, i) => (
          <motion.div key={i} className="flex-1 bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-sm relative overflow-hidden" initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 1, delay: i * 0.1 }}>
            <motion.div className="absolute inset-0 bg-white/20" animate={{ y: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
    </div>
  );
}

function DocumentDemo() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [items, setItems] = useState<number[]>([]);

  useEffect(() => {
    const run = async () => {
      setStep(0); setItems([]);
      await new Promise(r => setTimeout(r, 500)); setStep(1);
      await new Promise(r => setTimeout(r, 800)); setStep(2);
      for (let i = 0; i < 4; i++) { await new Promise(r => setTimeout(r, 350)); setItems(prev => [...prev, i]); }
      await new Promise(r => setTimeout(r, 600)); setStep(3);
      await new Promise(r => setTimeout(r, 2000));
    };
    run();
    const interval = setInterval(run, 7000);
    return () => clearInterval(interval);
  }, []);

  const extractedItems = [t('featuresPage.documentAnalysis.keyConcepts'), t('featuresPage.documentAnalysis.definitions'), t('featuresPage.documentAnalysis.formulas'), t('featuresPage.documentAnalysis.summary')];

  return (
    <div className="p-3 h-full flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="upload" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-center">
            <motion.div className="w-12 h-12 rounded-lg border-2 border-dashed border-blue-500/50 flex items-center justify-center mx-auto mb-2" animate={{ borderColor: ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.8)', 'rgba(59,130,246,0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
              <Upload className="w-5 h-5 text-blue-500" />
            </motion.div>
            <p className="text-[10px] text-muted-foreground">{t('featuresPage.documentAnalysis.dropDocument')}</p>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="uploading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
            <motion.div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <FileText className="w-5 h-5 text-white" />
            </motion.div>
            <p className="text-[10px] font-medium">{t('featuresPage.documentAnalysis.uploading')}</p>
            <div className="w-20 h-0.5 bg-muted rounded-full mt-1.5 mx-auto overflow-hidden">
              <motion.div className="h-full bg-blue-500 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} />
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="extracting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="flex items-center gap-1.5 mb-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Brain className="w-3.5 h-3.5 text-blue-500" /></motion.div>
              <span className="text-[10px] font-medium">{t('featuresPage.documentAnalysis.aiExtracting')}</span>
            </div>
            <div className="space-y-1">
              {extractedItems.map((item, i) => (
                <motion.div key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: items.includes(i) ? 1 : 0.3, x: items.includes(i) ? 0 : -10 }} className="flex items-center gap-1.5 p-1 bg-muted/30 rounded">
                  {items.includes(i) ? <Check className="w-3 h-3 text-blue-500" /> : <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  <span className="text-[10px]">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
            <motion.div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <Check className="w-6 h-6 text-white" />
            </motion.div>
            <p className="font-medium text-xs">{t('featuresPage.documentAnalysis.ready')}</p>
            <p className="text-[10px] text-muted-foreground">{t('featuresPage.documentAnalysis.conceptsExtracted')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Generic animated demo for features without custom demos
function GenericFeatureDemo({ icon: Icon, gradient, title, items }: { icon: React.ComponentType<{ className?: string }>; gradient: string; title: string; items: string[] }) {
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveItem(prev => (prev + 1) % items.length), 1500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="p-4 h-full flex flex-col items-center justify-center gap-3">
      <motion.div
        className={cn('w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center', gradient)}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-7 h-7 text-white" />
      </motion.div>
      <p className="text-xs font-semibold text-center">{title}</p>
      <div className="w-full space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all',
              i === activeItem ? 'bg-primary/10 text-foreground' : 'text-muted-foreground/60'
            )}
            animate={i === activeItem ? { x: [0, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={cn('w-1 h-1 rounded-full', i === activeItem ? 'bg-primary' : 'bg-muted-foreground/30')}
              animate={i === activeItem ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Tab Button ──────────────────────────────────────────────

interface FeatureTab {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accentColor: string;
  href: string;
  demo: React.ReactNode;
}

function FeatureTabItem({
  tab,
  isActive,
  onClick,
  side,
}: {
  tab: FeatureTab;
  isActive: boolean;
  onClick: () => void;
  side: 'left' | 'right';
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full text-left p-4 rounded-xl transition-all duration-300 group',
        isActive
          ? 'bg-card shadow-md border border-border/60'
          : 'hover:bg-card/50'
      )}
      whileHover={!isActive ? { x: 4 } : undefined}
    >
      {isActive && (
        <motion.div
          layoutId={`activeIndicator-${side}`}
          className={cn(
            'absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b',
            tab.gradient,
          )}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
          isActive ? `bg-gradient-to-br ${tab.gradient}` : 'bg-muted/60'
        )}>
          <tab.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-muted-foreground')} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            'font-semibold text-sm transition-colors leading-tight',
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
          )}>
            {tab.title}
          </h3>
          {isActive && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs mt-1 text-muted-foreground line-clamp-2 leading-relaxed"
            >
              {tab.description}
            </motion.p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Section ────────────────────────────────────────────────────

export function FeaturesSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ctaLink = isAuthenticated ? '/dashboard' : '/welcome';
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const [activeTab, setActiveTab] = useState(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 10);
    }, 12000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, []);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    startAutoPlay();
  };

  const allFeatures: FeatureTab[] = [
    // Left side (0-4)
    {
      key: 'chat',
      title: t('featuresPage.aiChat.title'),
      description: t('featuresPage.aiChat.description'),
      icon: MessageSquare,
      gradient: 'from-violet-500 to-purple-500',
      accentColor: 'text-violet-500',
      href: '/dashboard/chat',
      demo: <AIChatDemo />,
    },
    {
      key: 'flashcards',
      title: t('featuresPage.smartFlashcards.title'),
      description: t('featuresPage.smartFlashcards.description'),
      icon: Brain,
      gradient: 'from-amber-500 to-orange-500',
      accentColor: 'text-amber-500',
      href: '/dashboard/study-sets',
      demo: <FlashcardDemo />,
    },
    {
      key: 'documents',
      title: t('featuresPage.documentAnalysis.title'),
      description: t('featuresPage.documentAnalysis.description'),
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      accentColor: 'text-blue-500',
      href: '/dashboard/study-sets',
      demo: <DocumentDemo />,
    },
    {
      key: 'quizzes',
      title: t('featuresPage.smallFeatures.smartQuizzes'),
      description: t('featuresPage.smallFeatures.smartQuizzesDesc'),
      icon: Target,
      gradient: 'from-indigo-500 to-blue-500',
      accentColor: 'text-indigo-500',
      href: '/dashboard/live-quiz',
      demo: <GenericFeatureDemo icon={Trophy} gradient="from-indigo-500 to-blue-500" title={t('featuresPage.smallFeatures.smartQuizzes')} items={['Multiple Choice', 'True/False', 'Fill in Blank', 'Live Multiplayer']} />,
    },
    {
      key: 'problem-solver',
      title: t('featuresPage.smallFeatures.problemSolver'),
      description: t('featuresPage.smallFeatures.problemSolverDesc'),
      icon: Sparkles,
      gradient: 'from-amber-500 to-yellow-500',
      accentColor: 'text-amber-500',
      href: '/dashboard/problem-solver',
      demo: <GenericFeatureDemo icon={Lightbulb} gradient="from-amber-500 to-yellow-500" title={t('featuresPage.smallFeatures.problemSolver')} items={['Step-by-step Solutions', 'Math & Science', 'Batch Processing', 'Visual Explanations']} />,
    },
    // Right side (5-9)
    {
      key: 'analytics',
      title: t('featuresPage.analyticsDashboard.title'),
      description: t('featuresPage.analyticsDashboard.description'),
      icon: BarChart3,
      gradient: 'from-rose-500 to-pink-500',
      accentColor: 'text-rose-500',
      href: '/dashboard/analytics',
      demo: <AnalyticsDemo />,
    },
    {
      key: 'exam-clone',
      title: t('featuresPage.smallFeatures.examCloning'),
      description: t('featuresPage.smallFeatures.examCloningDesc'),
      icon: GraduationCap,
      gradient: 'from-fuchsia-500 to-pink-500',
      accentColor: 'text-fuchsia-500',
      href: '/dashboard/exam-clone',
      demo: <GenericFeatureDemo icon={Layers} gradient="from-fuchsia-500 to-pink-500" title={t('featuresPage.smallFeatures.examCloning')} items={['Upload Past Exams', 'Pattern Analysis', 'Generate Practice', 'Difficulty Matching']} />,
    },
    {
      key: 'handwriting',
      title: t('featuresPage.smallFeatures.handwritingOcr'),
      description: t('featuresPage.smallFeatures.handwritingOcrDesc'),
      icon: PenTool,
      gradient: 'from-violet-500 to-purple-500',
      accentColor: 'text-violet-500',
      href: '/dashboard/study-sets',
      demo: <GenericFeatureDemo icon={Scan} gradient="from-violet-500 to-purple-500" title={t('featuresPage.smallFeatures.handwritingOcr')} items={['Photo Capture', 'AI Recognition', 'Auto-digitize', 'Create Flashcards']} />,
    },
    {
      key: 'learning-paths',
      title: t('featuresPage.smallFeatures.learningPaths'),
      description: t('featuresPage.smallFeatures.learningPathsDesc'),
      icon: Route,
      gradient: 'from-cyan-500 to-teal-500',
      accentColor: 'text-cyan-500',
      href: '/dashboard/learning-paths',
      demo: <GenericFeatureDemo icon={Map} gradient="from-cyan-500 to-teal-500" title={t('featuresPage.smallFeatures.learningPaths')} items={['Goal Setting', 'Custom Roadmap', 'Progress Tracking', 'Adaptive Pacing']} />,
    },
    {
      key: 'concept-maps',
      title: t('featuresPage.smallFeatures.conceptMaps'),
      description: t('featuresPage.smallFeatures.conceptMapsDesc'),
      icon: Network,
      gradient: 'from-red-500 to-rose-500',
      accentColor: 'text-red-500',
      href: '/dashboard/study-sets',
      demo: <GenericFeatureDemo icon={Network} gradient="from-red-500 to-rose-500" title={t('featuresPage.smallFeatures.conceptMaps')} items={['Auto-generate', 'Visual Connections', 'Interactive Nodes', 'Export & Share']} />,
    },
  ];

  const leftFeatures = allFeatures.slice(0, 5);
  const rightFeatures = allFeatures.slice(5, 10);
  const activeFeature = allFeatures[activeTab];

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-blue-50/30 via-blue-50/50 to-blue-50/30 dark:from-blue-950/10 dark:via-blue-950/20 dark:to-blue-950/10">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.03] to-transparent dark:via-blue-400/[0.03]" />
        <motion.div style={{ y: y1 }} className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/15 to-indigo-400/10 dark:from-blue-600/15 dark:to-indigo-600/10 rounded-full blur-3xl" />
        <motion.div style={{ y: y2 }} className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-sky-400/15 to-blue-400/10 dark:from-sky-600/15 dark:to-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium mb-5" whileHover={{ scale: 1.05 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
              {t('featuresPage.badge')}
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {t('featuresPage.title')}{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {t('featuresPage.titleHighlight')}
                </span>
                <motion.svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 300 12" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 }}>
                  <motion.path d="M2 8 Q 75 2, 150 8 Q 225 14, 298 8" stroke="url(#featureGradient)" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <defs><linearGradient id="featureGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e" /><stop offset="50%" stopColor="#10b981" /><stop offset="100%" stopColor="#14b8a6" /></linearGradient></defs>
                </motion.svg>
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('featuresPage.description')}
            </p>
          </motion.div>
        </div>

        {/* 5 Left | Demo Center | 5 Right */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-[1fr_560px_1fr] gap-4 mb-12"
        >
          {/* Left Tabs */}
          <div className="space-y-1.5 flex flex-col justify-center">
            {leftFeatures.map((tab, i) => (
              <FeatureTabItem key={tab.key} tab={tab} isActive={activeTab === i} onClick={() => handleTabClick(i)} side="left" />
            ))}
          </div>

          {/* Center Demo */}
          <div className="relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 min-h-[340px]">
            {/* Gradient top bar */}
            <motion.div
              className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', activeFeature.gradient)}
              layoutId="demoTopBar"
              transition={{ duration: 0.3 }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {activeFeature.demo}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Tabs */}
          <div className="space-y-1.5 flex flex-col justify-center">
            {rightFeatures.map((tab, i) => (
              <FeatureTabItem key={tab.key} tab={tab} isActive={activeTab === i + 5} onClick={() => handleTabClick(i + 5)} side="right" />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 h-12 px-8 text-base" asChild>
              <Link to={ctaLink}>
                <Play className="w-4 h-4 mr-2" />
                {t('featuresPage.ctaButton')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
