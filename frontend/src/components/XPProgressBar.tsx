import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { getLevelInfo } from '@/types';
import { Flame, Star, Zap } from 'lucide-react';

export function XPProgressBar() {
  const { t } = useTranslation();
  const { stats, recentXpGain, clearRecentXp } = useGamificationStore();

  if (!stats) return null;

  const xpInLevel = stats.totalXp - stats.currentLevelXp;
  const xpNeeded = stats.nextLevelXp - stats.currentLevelXp;
  const progressPct = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;
  const dailyPct = stats.dailyGoal > 0 ? Math.min((stats.dailyXp / stats.dailyGoal) * 100, 100) : 0;
  const levelInfo = getLevelInfo(stats.level);

  return (
    <div className="space-y-3">
      {/* Level + XP Bar row */}
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <div className="relative">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${levelInfo.gradient} flex items-center justify-center shadow-lg ${levelInfo.shadow}`}>
            <span className="text-white font-bold text-sm">{stats.level}</span>
          </div>
          <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 fill-amber-400" />
        </div>

        {/* XP progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${levelInfo.text}`}>{t(`gamification.levelNames.${stats.level}`, { defaultValue: levelInfo.name })}</span>
            <span className="text-xs text-muted-foreground">
              {xpInLevel} / {xpNeeded} {t('gamification.xp')}
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${levelInfo.gradient} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Streak + Daily Goal row */}
      <div className="flex items-center gap-3">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 rounded-full">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            {stats.streakDays} {stats.streakDays === 1 ? t('gamification.day') : t('gamification.days')}
          </span>
        </div>

        {/* Daily goal ring */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${dailyPct * 0.9425} 94.25`}
                strokeLinecap="round"
                className="text-green-500"
                initial={{ strokeDasharray: '0 94.25' }}
                animate={{ strokeDasharray: `${dailyPct * 0.9425} 94.25` }}
                transition={{ duration: 0.8 }}
              />
            </svg>
            <Zap className="absolute inset-0 m-auto w-3.5 h-3.5 text-green-500" />
          </div>
          <div className="text-xs">
            <span className="font-medium">{stats.dailyXp}</span>
            <span className="text-muted-foreground"> / {stats.dailyGoal} {t('gamification.dailyXp')}</span>
          </div>
        </div>
      </div>

      {/* XP gain toast */}
      <AnimatePresence>
        {recentXpGain && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            onAnimationComplete={() => setTimeout(clearRecentXp, 1500)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit"
          >
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              +{recentXpGain} XP
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
