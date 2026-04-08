import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Spinner } from '@/components/ui/spinner';
import { StudyHeatmap } from '@/components/StudyHeatmap';
import { StreakCalendar } from '@/components/StreakCalendar';
import { XPProgressBar } from '@/components/XPProgressBar';
import { useGamificationStore } from '@/stores/useGamificationStore';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  BookOpen,
  FileQuestion,
  Target,
  TrendingUp,
} from 'lucide-react';

type DateRange = '7d' | '30d' | '90d' | 'all';

interface AnalyticsData {
  totalStudyTime: number;
  cardsReviewed: number;
  quizzesTaken: number;
  avgScore: number;
  currentStreak: number;
  longestStreak: number;
}

interface ActivityEntry {
  date: string;
  sessions: number;
  cardsReviewed: number;
  studyMinutes: number;
}

interface PerformanceData {
  accuracy: number;
  improvementRate: number;
  cardsByStatus: Record<string, number>;
  retentionCurve: Array<{ day: number; retention: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6',
  Learning: '#f59e0b',
  Review: '#a855f7',
  Mastered: '#22c55e',
};

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { fetchGamification } = useGamificationStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [timeView, setTimeView] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    fetchGamification();
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, activityRes, performanceRes] = await Promise.all([
        api.get(ENDPOINTS.analytics.me, { params: { range: dateRange } }).catch(() => ({ data: null })),
        api.get(ENDPOINTS.analytics.activity, { params: { range: dateRange } }).catch(() => ({ data: [] })),
        api.get(ENDPOINTS.analytics.performance, { params: { range: dateRange } }).catch(() => ({ data: null })),
      ]);

      setAnalytics(analyticsRes.data || {
        totalStudyTime: 0, cardsReviewed: 0, quizzesTaken: 0,
        avgScore: 0, currentStreak: 0, longestStreak: 0,
      });
      setActivity(activityRes.data || []);
      setPerformance(performanceRes.data || {
        accuracy: 0, improvementRate: 0,
        cardsByStatus: { New: 0, Learning: 0, Review: 0, Mastered: 0 },
        retentionCurve: [],
      });
    } catch {
      // Fallback with empty data
      setAnalytics({ totalStudyTime: 0, cardsReviewed: 0, quizzesTaken: 0, avgScore: 0, currentStreak: 0, longestStreak: 0 });
      setActivity([]);
      setPerformance({ accuracy: 0, improvementRate: 0, cardsByStatus: {}, retentionCurve: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Transform activity data for heatmap
  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    activity.forEach((a) => { map[a.date] = a.sessions; });
    return map;
  }, [activity]);

  // Active days set for streak calendar
  const activeDaysSet = useMemo(() => {
    return new Set(activity.filter((a) => a.sessions > 0).map((a) => a.date));
  }, [activity]);

  // Study time bar chart data
  const studyTimeData = useMemo(() => {
    if (timeView === 'weekly') {
      const weeks: Record<string, number> = {};
      activity.forEach((a) => {
        const d = new Date(a.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split('T')[0];
        weeks[key] = (weeks[key] || 0) + a.studyMinutes;
      });
      return Object.entries(weeks).map(([date, minutes]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        minutes,
      }));
    }
    return activity.slice(-14).map((a) => ({
      date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      minutes: a.studyMinutes,
    }));
  }, [activity, timeView]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (!performance?.cardsByStatus) return [];
    return Object.entries(performance.cardsByStatus)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [performance]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
            </div>
            {/* Date range selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateRange === range
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`analytics.dateRange.${range}`)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <XPProgressBar />
        </motion.div>

        {/* Top stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatTime(analytics?.totalStudyTime || 0)}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.studyTime')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{analytics?.cardsReviewed || 0}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.cardsReviewed')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{analytics?.quizzesTaken || 0}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.stats.quizzesDone')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{Math.round(analytics?.avgScore || 0)}%</p>
                <p className="text-xs text-muted-foreground">{t('analytics.avgScore')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Study Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="font-medium text-sm mb-4">{t('analytics.studyTime')}</h3>
          <div className="overflow-x-auto">
            <StudyHeatmap data={heatmapData} weeks={dateRange === '7d' ? 8 : dateRange === '30d' ? 16 : dateRange === '90d' ? 26 : 52} />
          </div>
        </motion.div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Streak Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="font-medium text-sm mb-4">{t('analytics.streak')}</h3>
            <StreakCalendar activeDays={activeDaysSet} />
          </motion.div>

          {/* Card Mastery Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h3 className="font-medium text-sm mb-4">{t('analytics.cardMastery')}</h3>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#888'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || '#888' }} />
                      <span className="text-xs text-muted-foreground">{t(`analytics.cardStatus.${entry.name.toLowerCase()}`)}</span>
                      <span className="text-xs font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('analytics.noCardData')}</p>
            )}
          </motion.div>
        </div>

        {/* Retention Curve + Study Time */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Retention Curve */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h3 className="font-medium text-sm">{t('analytics.retentionCurve')}</h3>
            </div>
            {performance?.retentionCurve && performance.retentionCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={performance.retentionCurve}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value ?? 0}%`, t('analytics.retention')]}
                  />
                  <Line type="monotone" dataKey="retention" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('analytics.notEnoughData')}</p>
            )}
          </motion.div>

          {/* Study Time Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">{t('analytics.studyTime')}</h3>
              <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                <button
                  onClick={() => setTimeView('daily')}
                  className={`px-2 py-1 text-[10px] font-medium rounded-sm transition-colors ${timeView === 'daily' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                >
                  {t('analytics.daily')}
                </button>
                <button
                  onClick={() => setTimeView('weekly')}
                  className={`px-2 py-1 text-[10px] font-medium rounded-sm transition-colors ${timeView === 'weekly' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                >
                  {t('analytics.weekly')}
                </button>
              </div>
            </div>
            {studyTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={studyTimeData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value ?? 0}m`, t('analytics.studyTime')]}
                  />
                  <Bar dataKey="minutes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('analytics.noStudyData')}</p>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
