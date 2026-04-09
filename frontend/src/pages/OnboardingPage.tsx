import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import {
  BookOpen,
  GraduationCap,
  School,
  Award,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Target,
  Clock,
  Brain,
  Lightbulb,
  Rocket,
  Search,
  X,
  MessageSquare,
  Zap,
  Users,
  BarChart3,
  ShieldCheck,
  BanIcon,
  Repeat,
  Copy,
  PenTool,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// --- Unique per-slide visual illustrations ---

// Welcome: orbiting feature icons
function WelcomeVisual() {
  const icons = [BookOpen, Brain, Sparkles, Copy, Users, Repeat, BarChart3, PenTool];
  return (
    <div className="relative w-48 h-48 mx-auto mb-4">
      <motion.div
        className="absolute inset-0 m-auto w-24 h-24 rounded-full flex items-center justify-center"
        animate={{ scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/logos/studyield-logo.png" alt="Studyield" className="w-20 h-20 object-contain drop-shadow-2xl" />
      </motion.div>
      {icons.map((Icon, i) => {
        const baseAngle = (i / icons.length) * 360;
        return (
          <motion.div
            key={i}
            className="absolute w-9 h-9 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border border-border"
            style={{ top: '50%', left: '50%' }}
            animate={{
              opacity: 1,
              scale: [1, 1.15, 1],
              x: Math.cos((baseAngle * Math.PI) / 180) * 80 - 18,
              y: Math.sin((baseAngle * Math.PI) / 180) * 80 - 18,
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, delay: i * 0.25 },
              rotate: { duration: 4, repeat: Infinity, delay: i * 0.5 },
            }}
          >
            <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
          </motion.div>
        );
      })}
    </div>
  );
}

// Study Sets: animated flipping cards stack
function StudySetsVisual() {
  return (
    <div className="relative w-48 h-36 mx-auto mb-4">
      {[2, 1, 0].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 overflow-hidden"
          style={{ width: 140, height: 90, left: '50%', top: '50%' }}
          animate={{
            opacity: 1,
            x: -70 + i * 12,
            y: [-45 + i * 8, -49 + i * 8, -45 + i * 8],
            rotate: -6 + i * 6,
          }}
          transition={{ y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 } }}
        >
          <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="p-2.5 space-y-1.5">
            <div className="h-2 bg-blue-100 dark:bg-blue-900/40 rounded w-4/5" />
            <div className="h-2 bg-blue-50 dark:bg-blue-900/20 rounded w-3/5" />
            <div className="h-2 bg-blue-50 dark:bg-blue-900/20 rounded w-2/5" />
          </div>
        </motion.div>
      ))}
      <motion.div
        className="absolute -right-1 -bottom-1 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg z-10"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  );
}

// AI Chat: animated chat bubbles
function AiChatVisual() {
  return (
    <div className="w-52 mx-auto mb-4 space-y-2">
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="ml-auto max-w-[70%] px-3 py-2 rounded-2xl rounded-br-sm bg-green-500 text-white text-xs shadow-md"
      >
        How does photosynthesis work?
      </motion.div>
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 border border-border text-xs shadow-md"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Brain className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-green-600">AI Tutor</span>
        </div>
        Plants convert sunlight into energy through...
      </motion.div>
      <motion.div
        className="max-w-[30%] px-3 py-2 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 border border-border shadow-md flex gap-1 items-center"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-green-500"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// Problem Solver: equation transforming into solution
function ProblemSolverVisual() {
  return (
    <div className="w-52 mx-auto mb-4">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-3 mb-2"
      >
        <div className="text-[10px] text-orange-500 font-bold mb-1">PROBLEM</div>
        <div className="text-sm font-mono text-center font-bold">x&sup2; + 5x + 6 = 0</div>
      </motion.div>
      <motion.div
        animate={{ scaleY: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-0.5 h-4 bg-gradient-to-b from-orange-400 to-amber-400 mx-auto origin-top"
      />
      <motion.div
        animate={{ y: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-200 dark:border-orange-800 p-3"
      >
        <div className="text-[10px] text-green-500 font-bold mb-1 flex items-center gap-1"><Check className="w-3 h-3" /> SOLUTION</div>
        <div className="space-y-0.5 text-xs font-mono text-muted-foreground">
          <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}>(x + 2)(x + 3) = 0</motion.div>
          <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} className="font-bold text-foreground">x = -2, x = -3</motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Exam Clone: paper duplicating animation
function ExamCloneVisual() {
  return (
    <div className="relative w-52 h-36 mx-auto mb-4">
      <motion.div
        className="absolute left-4 top-2 w-24 h-28 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-border p-2"
        animate={{ opacity: [0.5, 0.7, 0.5], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-[8px] font-bold text-indigo-500 mb-1">PAST EXAM</div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">{i}.</span>
              <div className="h-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded flex-1" />
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute right-2 top-4 w-24 h-28 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-indigo-300 dark:border-indigo-700 p-2"
      >
        <div className="text-[8px] font-bold text-green-500 mb-1 flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" /> NEW EXAM</div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            >
              <span className="text-[8px] text-muted-foreground">{i}.</span>
              <div className="h-1.5 bg-green-100 dark:bg-green-900/30 rounded flex-1" />
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute left-[45%] top-1/2 -translate-y-1/2"
        animate={{ x: [0, 5, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowRight className="w-5 h-5 text-indigo-400" />
      </motion.div>
    </div>
  );
}

// Live Quiz: players + scoreboard
function LiveQuizVisual() {
  const players = [
    { name: 'You', score: 850, color: 'from-pink-500 to-rose-500', pos: 1 },
    { name: 'Alex', score: 720, color: 'from-blue-500 to-cyan-500', pos: 2 },
    { name: 'Mia', score: 680, color: 'from-purple-500 to-violet-500', pos: 3 },
  ];
  return (
    <div className="w-52 mx-auto mb-4">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-3"
      >
        <div className="text-[10px] font-bold text-pink-500 mb-2 text-center flex items-center justify-center gap-1">
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Zap className="w-3 h-3" />
          </motion.div>
          LIVE LEADERBOARD
        </div>
        <div className="space-y-1.5">
          {players.map((p, i) => (
            <motion.div
              key={p.name}
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="flex items-center gap-2"
            >
              <span className={cn('text-xs font-black w-4', i === 0 ? 'text-amber-500' : 'text-muted-foreground')}>
                {i === 0 ? '👑' : `${p.pos}`}
              </span>
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${p.color} shrink-0`} />
              <span className="text-xs font-semibold flex-1">{p.name}</span>
              <motion.span
                className="text-xs font-bold text-pink-600 dark:text-pink-400 tabular-nums"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                {p.score}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Spaced Repetition: memory curve + cards appearing at intervals
function SpacedRepVisual() {
  const bars = [90, 50, 85, 45, 80, 42, 78, 95];
  return (
    <div className="w-52 mx-auto mb-4">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-3"
      >
        <div className="text-[10px] font-bold text-purple-500 mb-2 flex items-center gap-1">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
            <Repeat className="w-3 h-3" />
          </motion.div>
          RETENTION CURVE
        </div>
        <div className="flex items-end gap-1 h-14">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className={`flex-1 rounded-t bg-gradient-to-t ${i === bars.length - 1 ? 'from-green-500 to-emerald-400' : 'from-purple-500/60 to-violet-400/60'}`}
              animate={{ height: [`${h * 0.7}%`, `${h}%`, `${h * 0.7}%`] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[8px] text-muted-foreground">Day 1</span>
          <span className="text-[8px] text-green-600 font-bold">Today ✓</span>
        </div>
      </motion.div>
    </div>
  );
}

// Analytics: mini dashboard with charts
function AnalyticsVisual() {
  const [heatmapColors] = React.useState(() =>
    Array.from({ length: 28 }).map(() => {
      const intensity = Math.random();
      return intensity > 0.7 ? '#22c55e' : intensity > 0.4 ? '#86efac' : intensity > 0.15 ? '#dcfce7' : '#f3f4f6';
    })
  );
  return (
    <div className="w-52 mx-auto mb-4">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-3"
      >
        <div className="grid grid-cols-2 gap-2 mb-2">
          {[
            { label: 'Streak', value: '7 days', color: 'text-orange-500' },
            { label: 'XP', value: '2,400', color: 'text-sky-500' },
          ].map((s, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              className="bg-muted/50 rounded-lg p-1.5 text-center"
            >
              <div className={`text-sm font-black ${s.color}`}>{s.value}</div>
              <div className="text-[8px] text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="text-[8px] text-muted-foreground mb-1">Study Heatmap</div>
        <div className="grid grid-cols-7 gap-0.5">
          {heatmapColors.map((color, i) => (
            <motion.div
              key={i}
              className="aspect-square rounded-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              style={{ backgroundColor: color }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Handwriting OCR: handwriting -> digital text transformation
function HandwritingVisual() {
  return (
    <div className="w-52 mx-auto mb-4 flex items-center gap-2">
      <motion.div
        animate={{ rotate: [-3, -1, -3], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="flex-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg shadow-md border border-amber-200 dark:border-amber-800 p-2.5 min-h-[80px]"
      >
        <div className="text-[8px] text-amber-600 font-bold mb-1">HANDWRITTEN</div>
        <div className="space-y-1.5">
          <div className="h-[1px] bg-amber-300/50 relative">
            <svg className="absolute -top-2 left-0 w-full h-4" viewBox="0 0 100 16">
              <motion.path d="M2,12 Q15,2 30,10 T58,8 T85,11 T98,6" fill="none" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            </svg>
          </div>
          <div className="h-[1px] bg-amber-300/50 relative">
            <svg className="absolute -top-2 left-0 w-3/4 h-4" viewBox="0 0 80 16">
              <motion.path d="M2,10 Q20,4 35,12 T65,8 T78,10" fill="none" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
            </svg>
          </div>
        </div>
      </motion.div>
      <motion.div animate={{ x: [0, 5, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
        <ArrowRight className="w-4 h-4 text-red-400 shrink-0" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-green-200 dark:border-green-800 p-2.5 min-h-[80px]"
      >
        <div className="text-[8px] text-green-600 font-bold mb-1 flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> DIGITAL</div>
        <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="text-[10px] leading-relaxed">
          The mitochondria is the powerhouse...
        </motion.div>
      </motion.div>
    </div>
  );
}

// Ad-Free: shield with crossed-out ad icons
function AdFreeVisual() {
  return (
    <div className="relative w-40 h-40 mx-auto mb-4">
      <motion.div
        className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ShieldCheck className="w-12 h-12 text-white" />
      </motion.div>
      {[
        { x: -55, y: -30 },
        { x: 55, y: -25 },
        { x: -50, y: 35 },
        { x: 52, y: 38 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.1, 0.9],
            x: pos.x - 16,
            y: pos.y - 16,
          }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >
          <BanIcon className="w-4 h-4 text-red-400" />
        </motion.div>
      ))}
    </div>
  );
}

// Map slide index to visual component
function SlideVisual({ index }: { index: number }) {
  switch (index) {
    case 0: return <WelcomeVisual />;
    case 1: return <StudySetsVisual />;
    case 2: return <AiChatVisual />;
    case 3: return <ProblemSolverVisual />;
    case 4: return <ExamCloneVisual />;
    case 5: return <LiveQuizVisual />;
    case 6: return <SpacedRepVisual />;
    case 7: return <AnalyticsVisual />;
    case 8: return <HandwritingVisual />;
    case 9: return <AdFreeVisual />;
    default: return null;
  }
}

// --- Feature Slideshow ---

const featureSlideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, scale: 0.95 }),
};

function FeatureSlideshow({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  const slides = [
    {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bg: 'from-green-50 via-emerald-50 to-teal-50',
      bgDark: 'dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40',
      title: t('onboarding.welcome.greeting', { name: t('onboarding.welcome.defaultName', { defaultValue: 'there' }) }),
      description: t('onboarding.slides.welcomeDesc'),
      extra: 'welcome' as const,
    },
    {
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      bg: 'from-blue-50 via-cyan-50 to-blue-50',
      bgDark: 'dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-950/40',
      title: t('onboarding.slides.studySetsTitle'),
      description: t('onboarding.slides.studySetsLong'),
      bullets: [t('onboarding.slides.studySetsBullet1'), t('onboarding.slides.studySetsBullet2'), t('onboarding.slides.studySetsBullet3')],
    },
    {
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      bg: 'from-green-50 via-emerald-50 to-green-50',
      bgDark: 'dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-950/40',
      title: t('onboarding.slides.aiChatTitle'),
      description: t('onboarding.slides.aiChatLong'),
      bullets: [t('onboarding.slides.aiChatBullet1'), t('onboarding.slides.aiChatBullet2'), t('onboarding.slides.aiChatBullet3')],
    },
    {
      gradient: 'from-orange-500 via-amber-500 to-orange-600',
      bg: 'from-orange-50 via-amber-50 to-orange-50',
      bgDark: 'dark:from-orange-950/40 dark:via-amber-950/30 dark:to-orange-950/40',
      title: t('onboarding.slides.problemSolverTitle'),
      description: t('onboarding.slides.problemSolverLong'),
      bullets: [t('onboarding.slides.problemSolverBullet1'), t('onboarding.slides.problemSolverBullet2'), t('onboarding.slides.problemSolverBullet3')],
    },
    {
      gradient: 'from-indigo-500 via-violet-500 to-indigo-600',
      bg: 'from-indigo-50 via-violet-50 to-indigo-50',
      bgDark: 'dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-indigo-950/40',
      title: t('onboarding.slides.examCloneTitle'),
      description: t('onboarding.slides.examCloneLong'),
      bullets: [t('onboarding.slides.examCloneBullet1'), t('onboarding.slides.examCloneBullet2'), t('onboarding.slides.examCloneBullet3')],
    },
    {
      gradient: 'from-pink-500 via-rose-500 to-pink-600',
      bg: 'from-pink-50 via-rose-50 to-pink-50',
      bgDark: 'dark:from-pink-950/40 dark:via-rose-950/30 dark:to-pink-950/40',
      title: t('onboarding.slides.liveQuizTitle'),
      description: t('onboarding.slides.liveQuizLong'),
      bullets: [t('onboarding.slides.liveQuizBullet1'), t('onboarding.slides.liveQuizBullet2'), t('onboarding.slides.liveQuizBullet3')],
    },
    {
      gradient: 'from-purple-500 via-violet-500 to-purple-600',
      bg: 'from-purple-50 via-violet-50 to-purple-50',
      bgDark: 'dark:from-purple-950/40 dark:via-violet-950/30 dark:to-purple-950/40',
      title: t('onboarding.slides.spacedRepetitionTitle'),
      description: t('onboarding.slides.spacedRepetitionLong'),
      bullets: [t('onboarding.slides.spacedRepetitionBullet1'), t('onboarding.slides.spacedRepetitionBullet2'), t('onboarding.slides.spacedRepetitionBullet3')],
    },
    {
      gradient: 'from-sky-500 via-blue-500 to-sky-600',
      bg: 'from-sky-50 via-blue-50 to-sky-50',
      bgDark: 'dark:from-sky-950/40 dark:via-blue-950/30 dark:to-sky-950/40',
      title: t('onboarding.slides.analyticsTitle'),
      description: t('onboarding.slides.analyticsLong'),
      bullets: [t('onboarding.slides.analyticsBullet1'), t('onboarding.slides.analyticsBullet2'), t('onboarding.slides.analyticsBullet3')],
    },
    {
      gradient: 'from-red-500 via-orange-500 to-red-600',
      bg: 'from-red-50 via-orange-50 to-red-50',
      bgDark: 'dark:from-red-950/40 dark:via-orange-950/30 dark:to-red-950/40',
      title: t('onboarding.slides.handwritingOcrTitle'),
      description: t('onboarding.slides.handwritingOcrLong'),
      bullets: [t('onboarding.slides.handwritingOcrBullet1'), t('onboarding.slides.handwritingOcrBullet2'), t('onboarding.slides.handwritingOcrBullet3')],
    },
    {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bg: 'from-green-50 via-emerald-50 to-teal-50',
      bgDark: 'dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40',
      title: t('onboarding.slides.adFreeTitle'),
      description: t('onboarding.slides.adFreeDesc'),
      extra: 'adFree' as const,
      bullets: [t('onboarding.slides.adFreeBullet1'), t('onboarding.slides.adFreeBullet2'), t('onboarding.slides.adFreeBullet3')],
    },
  ];

  const isLast = current === slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) { onFinish(); } else { setDir(1); setCurrent((c) => c + 1); }
  }, [isLast, onFinish]);

  const goPrev = () => {
    if (current > 0) { setDir(-1); setCurrent((c) => c - 1); }
  };


  const slide = slides[current];

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${slide.bg} ${slide.bgDark} transition-colors duration-700`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <img src="/logos/studyield-logo.png" alt="Studyield" className="w-11 h-11 object-contain" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">Studyield</span>
        </div>
        <button onClick={onFinish} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
          {t('onboarding.slides.skip')}
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className={`absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r ${slide.gradient} opacity-[0.06] blur-3xl`}
            animate={{ x: ['-10%', '10%', '-5%'], y: ['-5%', '10%', '-10%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '10%', left: '15%' }}
          />
          <motion.div
            className={`absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r ${slide.gradient} opacity-[0.04] blur-3xl`}
            animate={{ x: ['5%', '-10%', '5%'], y: ['10%', '-5%', '5%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '10%', right: '10%' }}
          />
        </div>

        <div className="w-full max-w-lg relative z-10">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current}
              custom={dir}
              variants={featureSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center"
            >
              {/* Unique visual per slide */}
              <SlideVisual index={current} />

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="text-2xl md:text-3xl font-black mb-2 tracking-tight"
              >
                {slide.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.25 }}
                className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto leading-relaxed"
              >
                {slide.description}
              </motion.p>

              {/* Welcome badges */}
              {slide.extra === 'welcome' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { icon: BanIcon, label: t('onboarding.welcome.adFree'), c: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300' },
                    { icon: ShieldCheck, label: t('onboarding.welcome.freeToUse'), c: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300' },
                    { icon: Zap, label: t('onboarding.welcome.aiPowered'), c: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300' },
                  ].map((b, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.06, type: 'spring', damping: 14 }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${b.c} shadow-sm`}
                    >
                      <b.icon className="w-3.5 h-3.5" />{b.label}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Bullets */}
              {slide.bullets && !slide.extra && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="space-y-1.5 max-w-sm mx-auto text-left">
                  {slide.bullets.map((bullet, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.06 }}
                      className="flex items-start gap-2.5 p-1.5 rounded-lg"
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-foreground/80 leading-relaxed">{bullet}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Ad-free bullets */}
              {slide.extra === 'adFree' && slide.bullets && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="space-y-1.5 max-w-sm mx-auto text-left">
                  {slide.bullets.map((bullet, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.06 }}
                      className="flex items-start gap-2.5 p-1.5 rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-foreground/80 leading-relaxed">{bullet}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 py-4 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {slides.map((s, i) => (
              <button key={i} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
                className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: i === current ? 28 : 7 }}
              >
                <div className={cn('absolute inset-0 rounded-full', i <= current ? `bg-gradient-to-r ${s.gradient}` : 'bg-muted-foreground/20')} />
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={goPrev} disabled={current === 0} className="font-semibold">
              <ChevronLeft className="w-4 h-4 mr-1" />{t('onboarding.back')}
            </Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={goNext}
                className={cn('px-8 h-11 font-bold shadow-lg', isLast
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30'
                  : `bg-gradient-to-r ${slide.gradient} shadow-black/10`
                )}
              >
                {isLast ? (<>{t('onboarding.slides.getStarted')}<Rocket className="w-4 h-4 ml-2" /></>) : (<>{t('onboarding.slides.next')}<ChevronRight className="w-4 h-4 ml-1" /></>)}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Setup Steps (after slideshow) ---

const setupSlideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

const SETUP_STEPS = ['education', 'subjects', 'goal'] as const;
type SetupStep = typeof SETUP_STEPS[number];

function SetupWizard() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<SetupStep | 'done'>('education');
  const [direction, setDirection] = useState(1);
  const [education, setEducation] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const EDUCATION_LEVELS = [
    { id: 'high_school', label: t('onboarding.education.highSchool'), icon: School, desc: t('onboarding.education.highSchoolDesc') },
    { id: 'undergraduate', label: t('onboarding.education.undergraduate'), icon: GraduationCap, desc: t('onboarding.education.undergraduateDesc') },
    { id: 'graduate', label: t('onboarding.education.graduate'), icon: Award, desc: t('onboarding.education.graduateDesc') },
    { id: 'post_graduate', label: t('onboarding.education.postGraduate'), icon: Award, desc: t('onboarding.education.postGraduateDesc') },
    { id: 'self_learner', label: t('onboarding.education.selfLearner'), icon: Lightbulb, desc: t('onboarding.education.selfLearnerDesc') },
    { id: 'professional', label: t('onboarding.education.professional'), icon: Briefcase, desc: t('onboarding.education.professionalDesc') },
  ];

  const SUBJECTS = [
    t('onboarding.subjects.mathematics'), t('onboarding.subjects.physics'), t('onboarding.subjects.chemistry'), t('onboarding.subjects.biology'),
    t('onboarding.subjects.computerScience'), t('onboarding.subjects.history'), t('onboarding.subjects.english'), t('onboarding.subjects.economics'),
    t('onboarding.subjects.psychology'), t('onboarding.subjects.engineering'), t('onboarding.subjects.medicine'), t('onboarding.subjects.law'),
    t('onboarding.subjects.business'), t('onboarding.subjects.artDesign'), t('onboarding.subjects.statistics'), t('onboarding.subjects.philosophy'),
  ];

  const GOALS = [
    { id: 'exam_prep', label: t('onboarding.goal.examPrep'), icon: Target, desc: t('onboarding.goal.examPrepDesc') },
    { id: 'daily_study', label: t('onboarding.goal.dailyStudy'), icon: Clock, desc: t('onboarding.goal.dailyStudyDesc') },
    { id: 'homework', label: t('onboarding.goal.homework'), icon: Brain, desc: t('onboarding.goal.homeworkDesc') },
    { id: 'research', label: t('onboarding.goal.research'), icon: Search, desc: t('onboarding.goal.researchDesc') },
    { id: 'exploring', label: t('onboarding.goal.exploring'), icon: Rocket, desc: t('onboarding.goal.exploringDesc') },
  ];

  const stepIndex = step === 'done' ? SETUP_STEPS.length : SETUP_STEPS.indexOf(step as SetupStep);
  const progress = ((stepIndex + 1) / SETUP_STEPS.length) * 100;

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects((prev) => [...prev, trimmed]);
      setCustomSubject('');
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await api.put('/users/me', {
        educationLevel: education,
        subjects: selectedSubjects,
        profileCompleted: true,
        preferences: { studyGoal: goal },
      });
      await refreshUser();
      setDirection(1);
      setStep('done');
    } catch {
      setDirection(1);
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'education': return !!education;
      case 'subjects': return selectedSubjects.length > 0;
      case 'goal': return !!goal;
      default: return true;
    }
  };

  const goNext = () => {
    const idx = SETUP_STEPS.indexOf(step as SetupStep);
    if (idx < SETUP_STEPS.length - 1) {
      setDirection(1);
      setStep(SETUP_STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = SETUP_STEPS.indexOf(step as SetupStep);
    if (idx > 0) {
      setDirection(-1);
      setStep(SETUP_STEPS[idx - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/logos/studyield-logo.png" alt="Studyield" className="w-11 h-11 object-contain" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">Studyield</span>
        </div>
        {step !== 'done' && (
          <button
            onClick={handleComplete}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('onboarding.skipForNow')}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {step !== 'done' && (
        <div className="px-6">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-2xl mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t('onboarding.stepOf', { current: stepIndex + 1, total: SETUP_STEPS.length })}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={setupSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {/* Education */}
              {step === 'education' && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black mb-2">{t('onboarding.education.title')}</h2>
                    <p className="text-muted-foreground">{t('onboarding.education.description')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {EDUCATION_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setEducation(level.id)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 text-left transition-all',
                          education === level.id
                            ? 'border-green-500 bg-green-500/5 shadow-md shadow-green-500/10'
                            : 'border-border hover:border-muted-foreground/30 bg-card hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                            education === level.id ? 'bg-green-500/10' : 'bg-muted'
                          )}>
                            <level.icon className={cn('w-5 h-5', education === level.id ? 'text-green-500' : 'text-muted-foreground')} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{level.label}</p>
                            <p className="text-xs text-muted-foreground">{level.desc}</p>
                          </div>
                        </div>
                        {education === level.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjects */}
              {step === 'subjects' && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black mb-2">{t('onboarding.subjects.title')}</h2>
                    <p className="text-muted-foreground">{t('onboarding.subjects.description')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SUBJECTS.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
                          selectedSubjects.includes(subject)
                            ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20'
                            : 'bg-card border-border hover:border-green-500/50 text-foreground'
                        )}
                      >
                        {selectedSubjects.includes(subject) && <Check className="w-3 h-3 inline mr-1" />}
                        {subject}
                      </button>
                    ))}
                  </div>
                  {selectedSubjects.filter((s) => !SUBJECTS.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedSubjects.filter((s) => !SUBJECTS.includes(s)).map((subject) => (
                        <span key={subject} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium">
                          {subject}
                          <button onClick={() => toggleSubject(subject)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
                      placeholder={t('onboarding.subjects.addCustomPlaceholder')}
                      className="flex-1 px-4 py-2.5 bg-card border-2 border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                    />
                    <Button variant="outline" onClick={addCustomSubject} disabled={!customSubject.trim()}>
                      {t('onboarding.subjects.add')}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('onboarding.subjects.selected', { count: selectedSubjects.length })}
                  </p>
                </div>
              )}

              {/* Goal */}
              {step === 'goal' && (
                <div>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black mb-2">{t('onboarding.goal.title')}</h2>
                    <p className="text-muted-foreground">{t('onboarding.goal.description')}</p>
                  </div>
                  <div className="space-y-3">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={cn(
                          'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                          goal === g.id
                            ? 'border-green-500 bg-green-500/5 shadow-md shadow-green-500/10'
                            : 'border-border hover:border-muted-foreground/30 bg-card hover:shadow-sm'
                        )}
                      >
                        <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', goal === g.id ? 'bg-green-500/10' : 'bg-muted')}>
                          <g.icon className={cn('w-5 h-5', goal === g.id ? 'text-green-500' : 'text-muted-foreground')} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{g.label}</p>
                          <p className="text-xs text-muted-foreground">{g.desc}</p>
                        </div>
                        {goal === g.id && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Done */}
              {step === 'done' && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, damping: 10 }}
                    className="relative w-28 h-28 mx-auto mb-8"
                  >
                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30">
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.3, damping: 8 }}>
                        <Check className="w-14 h-14 text-white" />
                      </motion.div>
                    </div>
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-3xl md:text-4xl font-black mb-3">
                    {t('onboarding.done.title')}
                  </motion.h2>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    {t('onboarding.done.description')}
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-3 gap-3 mb-8 max-w-lg mx-auto">
                    {[
                      { icon: BookOpen, label: t('onboarding.done.createStudySet'), color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                      { icon: MessageSquare, label: t('onboarding.done.chatWithAI'), color: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20' },
                      { icon: Target, label: t('onboarding.done.trackProgress'), color: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-500/20' },
                    ].map((f, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                        className="p-4 bg-card rounded-xl border-2 border-border hover:border-green-300 dark:hover:border-green-700 transition-all"
                      >
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-3 shadow-lg ${f.shadow}`}>
                          <f.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-bold">{f.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                    <Button size="lg" onClick={() => navigate('/dashboard')}
                      className="px-10 h-14 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      {t('onboarding.done.goToDashboard')}
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation */}
      {step !== 'done' && (
        <div className="px-6 py-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={goBack} disabled={step === 'education'} className="font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('onboarding.back')}
            </Button>
            {step === 'goal' ? (
              <Button onClick={handleComplete} disabled={!canProceed() || saving}
                className="px-6 h-11 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
              >
                {saving ? (<><Spinner size="sm" className="mr-2" />{t('onboarding.saving')}</>) : (<>{t('onboarding.completeSetup')}<Check className="w-4 h-4 ml-2" /></>)}
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canProceed()}
                className="px-6 h-11 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
              >
                {t('onboarding.continue')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Pre-login onboarding (feature slideshow only, no auth required) ---

export function PreOnboardingPage() {
  const navigate = useNavigate();
  return <FeatureSlideshow onFinish={() => navigate('/login')} />;
}

// --- Post-login onboarding (setup wizard only, requires auth) ---

export function OnboardingPage() {
  return <SetupWizard />;
}

export default OnboardingPage;
