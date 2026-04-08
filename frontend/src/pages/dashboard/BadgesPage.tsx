import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Trophy,
  Award,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Target,
  Flame,
  Zap,
  Clock,
  Brain,
  CheckCircle,
  Rocket,
  Loader2,
  Lock,
} from 'lucide-react';

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  requirementType?: string;
  requirementValue?: number;
  xpReward?: number;
  earnedAt?: string;
  examTitle?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Award,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Target,
  Flame,
  Zap,
  Clock,
  Brain,
  CheckCircle,
  Rocket,
};

const COLOR_MAP: Record<string, string> = {
  amber: 'from-amber-400 to-amber-600',
  blue: 'from-blue-400 to-blue-600',
  purple: 'from-purple-400 to-purple-600',
  yellow: 'from-yellow-400 to-yellow-600',
  green: 'from-green-400 to-green-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
  cyan: 'from-cyan-400 to-cyan-600',
  indigo: 'from-indigo-400 to-indigo-600',
};

export default function BadgesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allRes, userRes] = await Promise.all([
        api.get(ENDPOINTS.examClone.badges),
        api.get(ENDPOINTS.examClone.userBadges),
      ]);
      setAllBadges(allRes.data);
      setUserBadges(userRes.data);
    } catch (err) {
      console.error('Failed to fetch badges:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const earnedBadgeIds = new Set(userBadges.map((b) => b.id));
  const categories = [...new Set(allBadges.map((b) => b.category))];

  const filteredBadges = selectedCategory
    ? allBadges.filter((b) => b.category === selectedCategory)
    : allBadges;

  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard/exam-clone')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              {t('badgesPage.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('badgesPage.subtitle')}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{t('badgesPage.yourProgress')}</span>
            <span className="text-2xl font-bold">
              {earnedCount} / {totalCount}
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('badgesPage.badgesRemaining', { count: totalCount - earnedCount })}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            {t('badgesPage.all')}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Badges Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBadges.map((badge, index) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const earnedBadge = userBadges.find((b) => b.id === badge.id);
              const IconComponent = ICON_MAP[badge.icon] || Trophy;
              const colorClass = COLOR_MAP[badge.color] || COLOR_MAP.amber;

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'relative bg-card border rounded-xl p-4 text-center transition-all',
                    isEarned
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-border opacity-60 hover:opacity-80'
                  )}
                >
                  {/* Badge Icon */}
                  <div
                    className={cn(
                      'w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center',
                      isEarned
                        ? `bg-gradient-to-br ${colorClass}`
                        : 'bg-muted'
                    )}
                  >
                    {isEarned ? (
                      <IconComponent className="w-8 h-8 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Badge Info */}
                  <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>

                  {/* XP Reward */}
                  {badge.xpReward && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">
                        +{badge.xpReward} XP
                      </span>
                    </div>
                  )}

                  {/* Earned Date */}
                  {isEarned && earnedBadge?.earnedAt && (
                    <p className="mt-2 text-xs text-green-500">
                      {t('badgesPage.earned')} {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Recently Earned */}
        {userBadges.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">{t('badgesPage.recentlyEarned')}</h2>
            <div className="space-y-3">
              {userBadges.slice(0, 5).map((badge) => {
                const IconComponent = ICON_MAP[badge.icon] || Trophy;
                const colorClass = COLOR_MAP[badge.color] || COLOR_MAP.amber;

                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
                        colorClass
                      )}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {badge.earnedAt && new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                      {badge.examTitle && (
                        <p className="text-xs text-muted-foreground">
                          {t('badgesPage.from')} {badge.examTitle}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
