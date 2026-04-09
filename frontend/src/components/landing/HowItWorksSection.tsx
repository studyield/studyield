import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Sparkles,
  Brain,
  Trophy,
  FileText,
  Youtube,
  Mic,
  Check,
  BookOpen,
  MessageSquare,
  Target,
  Zap,
  Award,
  Star,
  Layers,
} from 'lucide-react';

const steps = [
  {
    icon: Upload,
    number: '01',
    titleKey: 'howItWorks.steps.upload.title',
    descriptionKey: 'howItWorks.steps.upload.description',
    gradient: 'from-blue-500 to-cyan-500',
    color: 'blue',
    iconBg: 'bg-blue-500/10',
    lightColor: 'text-blue-500',
    bgLight: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    icon: Sparkles,
    number: '02',
    titleKey: 'howItWorks.steps.generate.title',
    descriptionKey: 'howItWorks.steps.generate.description',
    gradient: 'from-amber-500 to-orange-500',
    color: 'amber',
    iconBg: 'bg-amber-500/10',
    lightColor: 'text-amber-500',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    icon: Brain,
    number: '03',
    titleKey: 'howItWorks.steps.study.title',
    descriptionKey: 'howItWorks.steps.study.description',
    gradient: 'from-rose-500 to-pink-500',
    color: 'rose',
    iconBg: 'bg-rose-500/10',
    lightColor: 'text-rose-500',
    bgLight: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  {
    icon: Trophy,
    number: '04',
    titleKey: 'howItWorks.steps.master.title',
    descriptionKey: 'howItWorks.steps.master.description',
    gradient: 'from-green-500 to-emerald-500',
    color: 'green',
    iconBg: 'bg-green-500/10',
    lightColor: 'text-green-500',
    bgLight: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
];

// Mini animated demo for Upload step
function UploadDemo({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  const [uploadedFiles, setUploadedFiles] = useState<number[]>([]);
  const { t } = useTranslation();
  const files = [
    { icon: FileText, name: t('howItWorks.demo.pdf'), color: 'text-blue-500' },
    { icon: Youtube, name: t('howItWorks.demo.youtube'), color: 'text-red-500' },
    { icon: Mic, name: t('howItWorks.demo.audio'), color: 'text-violet-500' },
  ];

  useEffect(() => {
    if (isCompleted) {
      setUploadedFiles([0, 1, 2]);
      return;
    }
    if (!isActive) {
      setUploadedFiles([]);
      return;
    }

    setUploadedFiles([]);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    files.forEach((_, i) => {
      const timeout = setTimeout(() => {
        setUploadedFiles(prev => [...prev, i]);
      }, 400 + i * 600);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isCompleted]);

  return (
    <div className="space-y-2">
      {files.map((file, index) => {
        const Icon = file.icon;
        const isUploaded = uploadedFiles.includes(index);
        return (
          <motion.div
            key={file.name}
            animate={{
              opacity: isUploaded ? 1 : 0.4,
              x: isUploaded ? 0 : -10,
            }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              isUploaded ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-muted/50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isUploaded ? file.color : 'text-muted-foreground'}`} />
            <span className={isUploaded ? '' : 'text-muted-foreground'}>{file.name}</span>
            {isUploaded && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto"
              >
                <Check className="w-3 h-3 text-blue-500" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// Mini animated demo for Generate step
function GenerateDemo({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  const { t } = useTranslation();
  const [generatedItems, setGeneratedItems] = useState<number[]>([]);
  const items = [
    { icon: BookOpen, labelKey: 'howItWorks.demo.flashcards', color: 'text-amber-500' },
    { icon: Target, labelKey: 'howItWorks.demo.quizzes', color: 'text-orange-500' },
    { icon: MessageSquare, labelKey: 'howItWorks.demo.notes', color: 'text-yellow-500' },
  ];

  useEffect(() => {
    if (isCompleted) {
      setGeneratedItems([0, 1, 2]);
      return;
    }
    if (!isActive) {
      setGeneratedItems([]);
      return;
    }

    setGeneratedItems([]);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    items.forEach((_, i) => {
      const timeout = setTimeout(() => {
        setGeneratedItems(prev => [...prev, i]);
      }, 400 + i * 600);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(t => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isCompleted]);

  return (
    <div className="flex gap-2">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isGenerated = generatedItems.includes(index);
        return (
          <motion.div
            key={item.labelKey}
            animate={{
              opacity: isGenerated ? 1 : 0.3,
              scale: isGenerated ? 1 : 0.8,
              rotateY: isGenerated ? 0 : -30,
            }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs flex-1 ${
              isGenerated ? 'bg-amber-500/10' : 'bg-muted/30'
            }`}
          >
            <Icon className={`w-4 h-4 ${isGenerated ? item.color : 'text-muted-foreground'}`} />
            <span className={`text-[10px] ${isGenerated ? '' : 'text-muted-foreground'}`}>
              {t(item.labelKey)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// Mini animated demo for Study step
function StudyDemo({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);

  useEffect(() => {
    if (isCompleted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(100);
      setCurrentCard(2);
      return;
    }
    if (!isActive) {
      setProgress(0);
      setCurrentCard(0);
      return;
    }

    setProgress(0);
    setCurrentCard(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 4;
      });
    }, 80);

    const cardInterval = setInterval(() => {
      setCurrentCard(prev => (prev + 1) % 3);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(cardInterval);
    };
  }, [isActive, isCompleted]);

  return (
    <div className="space-y-3">
      {/* Mini flashcard */}
      <div className="relative h-12 perspective-500">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-lg flex items-center justify-center text-xs font-medium"
          >
            <Zap className="w-3 h-3 text-rose-500 mr-1" />
            {t('howItWorks.demo.cardOf', { current: currentCard + 1, total: 24 })}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{t('howItWorks.demo.progress')}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
}

// Mini animated demo for Master step
function MasterDemo({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  const { t } = useTranslation();
  const [showBadge, setShowBadge] = useState(false);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    if (isCompleted) {
      setStars(3);
      setShowBadge(true);
      return;
    }
    if (!isActive) {
      setStars(0);
      setShowBadge(false);
      return;
    }

    setShowBadge(false);
    setStars(0);

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => setStars(1), 400));
    timeouts.push(setTimeout(() => setStars(2), 800));
    timeouts.push(setTimeout(() => setStars(3), 1200));
    timeouts.push(setTimeout(() => setShowBadge(true), 1600));

    return () => timeouts.forEach(t => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isCompleted]);

  return (
    <div className="text-center space-y-2">
      {/* Stars */}
      <div className="flex justify-center gap-1">
        {[1, 2, 3].map((star) => (
          <motion.div
            key={star}
            animate={{
              scale: stars >= star ? 1 : 0.5,
              rotate: stars >= star ? 0 : -90,
            }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Star
              className={`w-4 h-4 ${
                stars >= star ? 'text-green-500 fill-green-500' : 'text-muted-foreground'
              }`}
            />
          </motion.div>
        ))}
      </div>
      {/* Badge */}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 10 }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-xs text-green-500 font-medium"
          >
            <Award className="w-3 h-3" />
            {t('howItWorks.demo.mastered')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Get the mini demo component for each step
function getMiniDemo(index: number, activeStep: number) {
  const isActive = index === activeStep;
  const isCompleted = index < activeStep;

  switch (index) {
    case 0:
      return <UploadDemo isActive={isActive} isCompleted={isCompleted} />;
    case 1:
      return <GenerateDemo isActive={isActive} isCompleted={isCompleted} />;
    case 2:
      return <StudyDemo isActive={isActive} isCompleted={isCompleted} />;
    case 3:
      return <MasterDemo isActive={isActive} isCompleted={isCompleted} />;
    default:
      return null;
  }
}

function StepCard({
  step,
  index,
  isLast,
  activeStep,
}: {
  step: typeof steps[0];
  index: number;
  isLast: boolean;
  activeStep: number;
}) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "center center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

  const isActive = index === activeStep;
  const isCompleted = index < activeStep;

  return (
    <motion.div
      ref={cardRef}
      style={{ opacity, scale, y }}
      className="relative"
    >
      {/* Connector Line for desktop — bridges from badge to next card's icon */}
      {!isLast && (
        <div className="hidden lg:flex items-center absolute top-[47px] left-[calc(100%-20px)] w-[64px] z-30 pointer-events-none">
          {/* Start dot */}
          <motion.div
            className="w-2 h-2 rounded-full shrink-0 z-10"
            animate={{
              backgroundColor: isCompleted
                ? 'rgb(34, 197, 94)'
                : isActive
                ? step.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' : step.color === 'amber' ? 'rgba(245, 158, 11, 0.6)' : step.color === 'rose' ? 'rgba(244, 63, 94, 0.6)' : 'rgba(34, 197, 94, 0.6)'
                : 'rgba(128, 128, 128, 0.2)',
              scale: isActive ? [1, 1.4, 1] : 1,
            }}
            transition={isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />

          {/* Line */}
          <div className="flex-1 h-[2px] relative mx-1">
            {/* Background dashed */}
            <div className="absolute inset-0 border-t-[2px] border-dashed border-border/25 dark:border-border/15" />
            {/* Animated solid fill */}
            <motion.div
              className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isCompleted ? 1 : 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Active pulse */}
            {isActive && (
              <motion.div
                className="absolute inset-y-0 left-0 right-0 rounded-full origin-left"
                style={{
                  background: step.color === 'blue' ? 'rgba(59,130,246,0.3)' : step.color === 'amber' ? 'rgba(245,158,11,0.3)' : step.color === 'rose' ? 'rgba(244,63,94,0.3)' : 'rgba(34,197,94,0.3)',
                }}
                animate={{ scaleX: [0, 0.6, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>

          {/* Arrow chevron */}
          <motion.svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            className="shrink-0 z-10"
            animate={{
              opacity: isCompleted ? 1 : 0.2,
              x: isCompleted ? [0, 3, 0] : 0,
            }}
            transition={isCompleted ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <motion.path
              d="M1 1L6.5 7L1 13"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{
                stroke: isCompleted ? 'rgb(34, 197, 94)' : 'rgba(128, 128, 128, 0.25)',
              }}
              transition={{ duration: 0.4 }}
            />
          </motion.svg>
        </div>
      )}

      {/* Card Container */}
      <motion.div
        className="relative bg-card rounded-2xl p-6 h-full border"
        animate={{
          y: isActive ? -4 : 0,
          opacity: isActive ? 1 : isCompleted ? 0.9 : 0.5,
          borderColor: isActive
            ? step.color === 'blue' ? 'rgba(59, 130, 246, 0.4)' : step.color === 'amber' ? 'rgba(245, 158, 11, 0.4)' : step.color === 'rose' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(34, 197, 94, 0.4)'
            : 'rgba(128, 128, 128, 0.15)',
          boxShadow: isActive
            ? '0 8px 24px -4px rgba(0, 0, 0, 0.1)'
            : '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >

        <div className="relative z-10">
          {/* Step Number & Icon Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                  isActive
                    ? step.color === 'blue' ? 'bg-blue-500/10' : step.color === 'amber' ? 'bg-amber-500/10' : step.color === 'rose' ? 'bg-rose-500/10' : 'bg-green-500/10'
                    : 'bg-muted'
                }`}
              >
                <step.icon className={`w-7 h-7 transition-colors duration-300 ${
                  isActive
                    ? step.color === 'blue' ? 'text-blue-500' : step.color === 'amber' ? 'text-amber-500' : step.color === 'rose' ? 'text-rose-500' : 'text-green-500'
                    : 'text-muted-foreground'
                }`} />
              </div>

              {/* Completed checkmark */}
              {isCompleted && (
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-green-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>

            {/* Step number badge */}
            <span
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isActive
                  ? step.color === 'blue' ? 'bg-blue-500 text-white' : step.color === 'amber' ? 'bg-amber-500 text-white' : step.color === 'rose' ? 'bg-rose-500 text-white' : 'bg-green-500 text-white'
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : step.number}
            </span>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
              isActive
                ? step.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : step.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : step.color === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-green-600 dark:text-green-400'
                : ''
            }`}>
              {t(step.titleKey)}
            </h3>
            <p className={`text-sm leading-relaxed text-muted-foreground transition-opacity duration-300 ${
              isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'
            }`}>
              {t(step.descriptionKey)}
            </p>
          </div>

          {/* Mini Demo */}
          <div
            className={`mt-4 p-3 rounded-xl border transition-all duration-300 ${
              isActive
                ? step.color === 'blue' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : step.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : step.color === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                : 'bg-muted/50 border-border/50'
            }`}
          >
            {getMiniDemo(index, activeStep)}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  // Step durations in milliseconds
  const stepDurations = [2500, 2500, 2500, 2500];

  useEffect(() => {
    const runStepSequence = () => {
      setActiveStep(0);

      let totalDelay = 0;
      stepDurations.forEach((duration, index) => {
        if (index > 0) {
          setTimeout(() => {
            setActiveStep(index);
          }, totalDelay);
        }
        totalDelay += duration;
      });

      // After all steps complete, wait a bit then restart
      setTimeout(() => {
        setActiveStep(0);
      }, totalDelay + 1500);
    };

    runStepSequence();
    const totalCycleTime = stepDurations.reduce((a, b) => a + b, 0) + 1500;
    const interval = setInterval(runStepSequence, totalCycleTime);

    return () => clearInterval(interval);
  }, []);

  const stepLabelKeys = ['howItWorks.stepLabels.upload', 'howItWorks.stepLabels.generate', 'howItWorks.stepLabels.study', 'howItWorks.stepLabels.master'];
  const stepColors = [
    { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
    { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500' },
    { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
  ];

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 lg:py-32 relative overflow-hidden">
      {/* Animated background with multiple colored orbs */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-violet-50/40 dark:via-violet-950/15 to-background" />

        {/* Blue orb - top left */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: activeStep === 0 ? [0.15, 0.3, 0.15] : [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full blur-3xl"
        />

        {/* Amber orb - top right */}
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: activeStep === 1 ? [0.2, 0.35, 0.2] : [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-20 w-[350px] h-[350px] bg-gradient-to-br from-amber-400/15 to-orange-400/10 rounded-full blur-3xl"
        />

        {/* Rose orb - bottom left */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: activeStep === 2 ? [0.18, 0.32, 0.18] : [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-rose-400/15 to-pink-400/10 rounded-full blur-3xl"
        />

        {/* Green orb - bottom right */}
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: activeStep === 3 ? [0.15, 0.28, 0.15] : [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-green-400/15 to-emerald-400/10 rounded-full blur-3xl"
        />
      </motion.div>

      <div className="container mx-auto px-8 sm:px-12 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Layers className="w-4 h-4" />
              {t('howItWorks.badge')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('howItWorks.title')}{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {t('howItWorks.titleHighlight')}
                </span>
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <motion.path
                    d="M2 6 Q 50 2, 100 6 Q 150 10, 198 6"
                    stroke="url(#stepGradientGreen)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="stepGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                      <stop offset="50%" stopColor="rgb(16, 185, 129)" />
                      <stop offset="100%" stopColor="rgb(20, 184, 166)" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.description')}
            </p>
          </motion.div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
              activeStep={activeStep}
            />
          ))}
        </div>

        {/* Bottom section with step progress indicator */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* Step progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {stepLabelKeys.map((key, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const colors = stepColors[index];

              return (
                <div key={key} className="flex items-center gap-2">
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? `${colors.bg} text-white border-transparent shadow-lg`
                        : isCompleted
                        ? `bg-green-500/10 text-green-500 border-green-500/30`
                        : 'bg-muted/50 text-muted-foreground border-border/50'
                    }`}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                  >
                    {isCompleted && <Check className="w-4 h-4" />}
                    {isActive && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-white"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    {t(key)}
                  </motion.div>

                  {index < stepLabelKeys.length - 1 && (
                    <motion.div
                      className={`w-8 h-0.5 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <motion.p
            className={`transition-colors duration-300 ${stepColors[activeStep].text}`}
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeStep === 0 && t('howItWorks.status.uploading')}
            {activeStep === 1 && t('howItWorks.status.generating')}
            {activeStep === 2 && t('howItWorks.status.studying')}
            {activeStep === 3 && t('howItWorks.status.mastered')}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
