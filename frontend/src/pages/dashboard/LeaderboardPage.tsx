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
  Medal,
  Crown,
  TrendingUp,
  Target,
  Users,
  Loader2,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalExams: number;
  avgScore: number;
  totalCorrect: number;
  bestScore: number;
  rank: number;
}

interface UserRank {
  rank: number | null;
  avgScore: number;
  totalCorrect: number;
}

type Period = 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('weekly');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(ENDPOINTS.examClone.leaderboard, {
        params: { period, limit: 20 },
      });
      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              {t('leaderboardPage.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('leaderboardPage.subtitle')}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['weekly', 'monthly', 'all_time'] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p === 'weekly' ? t('leaderboardPage.weekly') : p === 'monthly' ? t('leaderboardPage.monthly') : t('leaderboardPage.allTime')}
            </Button>
          ))}
        </div>

        {/* Your Rank Card */}
        {userRank && userRank.rank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('leaderboardPage.yourRank')}</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold">#{userRank.rank}</span>
                  <div className="flex items-center gap-1 text-sm">
                    {userRank.rank <= 10 ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-500">{t('leaderboardPage.top10')}</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('leaderboardPage.keepPracticing')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold">{userRank.avgScore}%</p>
                    <p className="text-xs text-muted-foreground">{t('leaderboardPage.avgScore')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userRank.totalCorrect}</p>
                    <p className="text-xs text-muted-foreground">{t('leaderboardPage.correct')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('leaderboardPage.noDataYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('leaderboardPage.noDataDescription')}
            </p>
            <Button onClick={() => navigate('/dashboard/exam-clone')}>
              {t('leaderboardPage.startPracticing')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-gray-400/30 rounded-xl p-4 text-center mt-8"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-400/20 mx-auto mb-2 flex items-center justify-center">
                    <Medal className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-semibold truncate">{leaderboard[1]?.name}</p>
                  <p className="text-2xl font-bold text-gray-400">{leaderboard[1]?.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[1]?.totalExams} {t('leaderboardPage.exams')}</p>
                </motion.div>

                {/* 1st Place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/50 rounded-xl p-4 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-yellow-500/20 mx-auto mb-2 flex items-center justify-center">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                  <p className="font-semibold truncate">{leaderboard[0]?.name}</p>
                  <p className="text-3xl font-bold text-yellow-500">{leaderboard[0]?.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[0]?.totalExams} {t('leaderboardPage.exams')}</p>
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-amber-600/30 rounded-xl p-4 text-center mt-12"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-600/20 mx-auto mb-2 flex items-center justify-center">
                    <Medal className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="font-semibold truncate">{leaderboard[2]?.name}</p>
                  <p className="text-2xl font-bold text-amber-600">{leaderboard[2]?.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[2]?.totalExams} {t('leaderboardPage.exams')}</p>
                </motion.div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            {leaderboard.slice(3).map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.03 }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-purple-500/30',
                  getRankBg(entry.rank)
                )}
              >
                {/* Rank */}
                <div className="w-10 text-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {entry.name?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.totalExams} {t('leaderboardPage.exams')} • {entry.totalCorrect} {t('leaderboardPage.examsCorrect')}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-xl font-bold">{entry.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">{t('leaderboardPage.avgScoreLower')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
