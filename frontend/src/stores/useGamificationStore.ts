import { create } from 'zustand';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import type { GamificationStats, XPEventType } from '@/types';
import { getLevelFromXP } from '@/types';

const XP_AMOUNTS: Record<XPEventType, number> = {
  card_review: 10,
  quiz_complete: 50,
  perfect_quiz: 100,
  daily_streak: 25,
  daily_goal: 50,
};

interface GamificationState {
  stats: GamificationStats | null;
  recentXpGain: number | null;
  isLoading: boolean;
  fetchGamification: () => Promise<void>;
  addXP: (type: XPEventType) => Promise<number>;
  clearRecentXp: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  stats: null,
  recentXpGain: null,
  isLoading: false,

  fetchGamification: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get(ENDPOINTS.users.gamification);
      set({ stats: res.data, isLoading: false });
    } catch {
      // Fallback to computed stats from user stats
      try {
        const statsRes = await api.get(ENDPOINTS.users.stats);
        const streakDays = statsRes.data.streakDays || 0;
        const totalXp = (statsRes.data.flashcardsCount || 0) * 10 + (statsRes.data.quizzesCompleted || 0) * 50;
        const { level, currentLevelXp, nextLevelXp } = getLevelFromXP(totalXp);
        set({
          stats: {
            totalXp,
            level,
            streakDays,
            dailyXp: 0,
            dailyGoal: 100,
            nextLevelXp,
            currentLevelXp,
          },
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
      }
    }
  },

  addXP: async (type: XPEventType) => {
    const xp = XP_AMOUNTS[type];
    try {
      await api.post(ENDPOINTS.users.addXp, { type, xp });
    } catch {
      // Continue with optimistic update even if API fails
    }

    const currentStats = get().stats;
    if (currentStats) {
      const newTotalXp = currentStats.totalXp + xp;
      const newDailyXp = currentStats.dailyXp + xp;
      const { level, currentLevelXp, nextLevelXp } = getLevelFromXP(newTotalXp);
      set({
        stats: {
          ...currentStats,
          totalXp: newTotalXp,
          dailyXp: newDailyXp,
          level,
          currentLevelXp,
          nextLevelXp,
        },
        recentXpGain: xp,
      });
    }
    return xp;
  },

  clearRecentXp: () => set({ recentXpGain: null }),
}));
