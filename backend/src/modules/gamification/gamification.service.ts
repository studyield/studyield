import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Configurable XP amounts for each action */
export const XP_AMOUNTS: Record<string, number> = {
  flashcard_review: 5,
  quiz_complete: 20,
  quiz_perfect: 50,
  exam_complete: 30,
  teach_back: 30,
  material_upload: 15,
  streak_7: 100,
  streak_30: 500,
};

export interface GamificationProfile {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  rank: number;
  currentStreak: number;
  longestStreak: number;
  achievements: AchievementProgress[];
}

export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
  xpReward: number;
  earned: boolean;
  earnedAt: Date | null;
  currentProgress: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  rank: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Award XP for an action and check for new achievements.
   */
  async awardXp(
    userId: string,
    action: string,
    amount: number,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      // Insert into xp_ledger
      await this.db.query(
        `INSERT INTO xp_ledger (id, user_id, action, amount, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), userId, action, amount, JSON.stringify(metadata)],
      );

      // Upsert user_gamification
      await this.db.query(
        `INSERT INTO user_gamification (user_id, total_xp, level, updated_at)
         VALUES ($1, $2, 0, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           total_xp = user_gamification.total_xp + $2,
           updated_at = NOW()`,
        [userId, amount],
      );

      // Recalculate level
      const stats = await this.db.queryOne<{ total_xp: string }>(
        `SELECT total_xp FROM user_gamification WHERE user_id = $1`,
        [userId],
      );
      if (stats) {
        const totalXp = parseInt(stats.total_xp, 10);
        const level = this.calculateLevel(totalXp);
        await this.db.query(
          `UPDATE user_gamification SET level = $1 WHERE user_id = $2`,
          [level, userId],
        );
      }

      // Check achievements
      await this.checkAchievements(userId);
    } catch (error) {
      this.logger.error(`Failed to award XP to user ${userId}: ${(error as Error).message}`);
    }
  }

  /**
   * Record that a user studied today. Manages streak logic.
   */
  async recordStudyDay(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Upsert user_gamification if not exists
      await this.db.query(
        `INSERT INTO user_gamification (user_id, total_xp, level, current_streak, longest_streak, last_study_date, updated_at)
         VALUES ($1, 0, 0, 0, 0, NULL, NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      );

      const row = await this.db.queryOne<{
        current_streak: string;
        longest_streak: string;
        last_study_date: string | null;
      }>(
        `SELECT current_streak, longest_streak, last_study_date FROM user_gamification WHERE user_id = $1`,
        [userId],
      );

      if (!row) return;

      const lastStudyDate = row.last_study_date
        ? new Date(row.last_study_date).toISOString().split('T')[0]
        : null;

      // Already studied today — skip
      if (lastStudyDate === today) return;

      let currentStreak = parseInt(row.current_streak, 10) || 0;
      let longestStreak = parseInt(row.longest_streak, 10) || 0;

      // Check if yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastStudyDate === yesterdayStr) {
        // Consecutive day
        currentStreak += 1;
      } else {
        // Gap > 1 day (or first day ever)
        currentStreak = 1;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      await this.db.query(
        `UPDATE user_gamification
         SET current_streak = $1, longest_streak = $2, last_study_date = $3, updated_at = NOW()
         WHERE user_id = $4`,
        [currentStreak, longestStreak, today, userId],
      );

      // Award streak bonuses
      if (currentStreak === 7) {
        await this.awardXp(userId, 'streak_7', XP_AMOUNTS.streak_7, { streak: 7 });
      }
      if (currentStreak === 30) {
        await this.awardXp(userId, 'streak_30', XP_AMOUNTS.streak_30, { streak: 30 });
      }
    } catch (error) {
      this.logger.error(
        `Failed to record study day for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get the full gamification profile for a user.
   */
  async getProfile(userId: string): Promise<GamificationProfile> {
    // Ensure row exists
    await this.db.query(
      `INSERT INTO user_gamification (user_id, total_xp, level, current_streak, longest_streak, updated_at)
       VALUES ($1, 0, 0, 0, 0, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );

    const stats = await this.db.queryOne<{
      total_xp: string;
      level: string;
      current_streak: string;
      longest_streak: string;
    }>(
      `SELECT total_xp, level, current_streak, longest_streak FROM user_gamification WHERE user_id = $1`,
      [userId],
    );

    const totalXp = parseInt(stats?.total_xp || '0', 10);
    const level = parseInt(stats?.level || '0', 10);
    const currentStreak = parseInt(stats?.current_streak || '0', 10);
    const longestStreak = parseInt(stats?.longest_streak || '0', 10);

    const currentLevelXp = this.xpForLevel(level);
    const nextLevelXp = this.xpForLevel(level + 1);

    // Rank
    const rankRow = await this.db.queryOne<{ rank: string }>(
      `SELECT COUNT(*) + 1 AS rank FROM user_gamification WHERE total_xp > $1`,
      [totalXp],
    );
    const rank = parseInt(rankRow?.rank || '1', 10);

    // Achievements
    const achievements = await this.getAchievementProgress(userId);

    return {
      totalXp,
      level,
      currentLevelXp,
      nextLevelXp,
      rank,
      currentStreak,
      longestStreak,
      achievements,
    };
  }

  /**
   * Get all achievements with progress for a user.
   */
  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const definitions = await this.db.queryMany<{
      id: string;
      name: string;
      description: string;
      icon: string;
      condition_type: string;
      condition_value: string;
      xp_reward: string;
    }>(`SELECT * FROM achievement_definitions ORDER BY condition_value ASC`);

    const earned = await this.db.queryMany<{
      achievement_id: string;
      earned_at: string;
    }>(`SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = $1`, [userId]);

    const earnedMap = new Map(earned.map((e) => [e.achievement_id, new Date(e.earned_at)]));

    // Get progress counts for each condition type
    const progressMap = await this.getUserProgressCounts(userId);

    return definitions.map((def) => {
      const conditionValue = parseInt(def.condition_value, 10);
      const currentProgress = progressMap.get(def.condition_type) || 0;
      const earnedAt = earnedMap.get(def.id) || null;

      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        conditionType: def.condition_type,
        conditionValue: conditionValue,
        xpReward: parseInt(def.xp_reward, 10),
        earned: earnedAt !== null,
        earnedAt,
        currentProgress: Math.min(currentProgress, conditionValue),
      };
    });
  }

  /**
   * Get leaderboard.
   */
  async getLeaderboard(
    period: 'weekly' | 'monthly' | 'all-time',
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    let rows: Array<{
      user_id: string;
      name: string;
      avatar_url: string | null;
      total_xp: string;
      level: string;
    }>;

    if (period === 'all-time') {
      rows = await this.db.queryMany<{
        user_id: string;
        name: string;
        avatar_url: string | null;
        total_xp: string;
        level: string;
      }>(
        `SELECT ug.user_id, u.name, u.avatar_url, ug.total_xp, ug.level
         FROM user_gamification ug
         JOIN users u ON u.id = ug.user_id
         ORDER BY ug.total_xp DESC
         LIMIT $1`,
        [limit],
      );
    } else {
      const interval = period === 'weekly' ? '7 days' : '30 days';
      rows = await this.db.queryMany<{
        user_id: string;
        name: string;
        avatar_url: string | null;
        total_xp: string;
        level: string;
      }>(
        `SELECT xl.user_id, u.name, u.avatar_url,
                COALESCE(SUM(xl.amount), 0)::text AS total_xp,
                COALESCE(ug.level, 0)::text AS level
         FROM xp_ledger xl
         JOIN users u ON u.id = xl.user_id
         LEFT JOIN user_gamification ug ON ug.user_id = xl.user_id
         WHERE xl.created_at >= NOW() - INTERVAL '${interval}'
         GROUP BY xl.user_id, u.name, u.avatar_url, ug.level
         ORDER BY SUM(xl.amount) DESC
         LIMIT $1`,
        [limit],
      );
    }

    return rows.map((r, i) => ({
      userId: r.user_id,
      name: r.name,
      avatarUrl: r.avatar_url,
      totalXp: parseInt(r.total_xp, 10),
      level: parseInt(r.level || '0', 10),
      rank: i + 1,
    }));
  }

  /**
   * Check all achievement conditions and award any newly met ones.
   */
  async checkAchievements(userId: string): Promise<void> {
    try {
      const definitions = await this.db.queryMany<{
        id: string;
        name: string;
        condition_type: string;
        condition_value: string;
        xp_reward: string;
      }>(`SELECT id, name, condition_type, condition_value, xp_reward FROM achievement_definitions`);

      const earned = await this.db.queryMany<{ achievement_id: string }>(
        `SELECT achievement_id FROM user_achievements WHERE user_id = $1`,
        [userId],
      );
      const earnedSet = new Set(earned.map((e) => e.achievement_id));

      const progressMap = await this.getUserProgressCounts(userId);

      for (const def of definitions) {
        if (earnedSet.has(def.id)) continue;

        const conditionValue = parseInt(def.condition_value, 10);
        const currentProgress = progressMap.get(def.condition_type) || 0;

        if (currentProgress >= conditionValue) {
          // Award achievement
          await this.db.query(
            `INSERT INTO user_achievements (id, user_id, achievement_id, earned_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, achievement_id) DO NOTHING`,
            [uuidv4(), userId, def.id],
          );

          // Award bonus XP (directly to ledger + stats, skip recursive achievement check)
          const xpReward = parseInt(def.xp_reward, 10);
          if (xpReward > 0) {
            await this.db.query(
              `INSERT INTO xp_ledger (id, user_id, action, amount, metadata, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                uuidv4(),
                userId,
                'achievement_bonus',
                xpReward,
                JSON.stringify({ achievementId: def.id, achievementName: def.name }),
              ],
            );
            await this.db.query(
              `UPDATE user_gamification SET total_xp = total_xp + $1, updated_at = NOW() WHERE user_id = $2`,
              [xpReward, userId],
            );
          }

          // Send notification
          await this.notificationsService.sendAchievementNotification(
            userId,
            `${def.name} unlocked! +${xpReward} XP`,
          );

          this.logger.log(`Achievement "${def.name}" unlocked for user ${userId}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to check achievements for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  // ─── Private helpers ───

  /**
   * Level = floor(sqrt(totalXp / 100))
   */
  private calculateLevel(totalXp: number): number {
    return Math.floor(Math.sqrt(totalXp / 100));
  }

  /**
   * XP required to reach a given level: level^2 * 100
   */
  private xpForLevel(level: number): number {
    return level * level * 100;
  }

  /**
   * Gather progress counts for all condition types.
   */
  private async getUserProgressCounts(userId: string): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    // total_reviews: count flashcard_review actions
    const reviews = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM xp_ledger WHERE user_id = $1 AND action = 'flashcard_review'`,
      [userId],
    );
    result.set('total_reviews', parseInt(reviews?.count || '0', 10));

    // quizzes_completed
    const quizzes = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM xp_ledger WHERE user_id = $1 AND action = 'quiz_complete'`,
      [userId],
    );
    result.set('quizzes_completed', parseInt(quizzes?.count || '0', 10));

    // perfect_score_count
    const perfects = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM xp_ledger WHERE user_id = $1 AND action = 'quiz_perfect'`,
      [userId],
    );
    result.set('perfect_score_count', parseInt(perfects?.count || '0', 10));

    // exams_completed
    const exams = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM xp_ledger WHERE user_id = $1 AND action = 'exam_complete'`,
      [userId],
    );
    result.set('exams_completed', parseInt(exams?.count || '0', 10));

    // teach_back_completed
    const teachBack = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM xp_ledger WHERE user_id = $1 AND action = 'teach_back'`,
      [userId],
    );
    result.set('teach_back_completed', parseInt(teachBack?.count || '0', 10));

    // materials_uploaded
    const uploads = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM xp_ledger WHERE user_id = $1 AND action = 'material_upload'`,
      [userId],
    );
    result.set('materials_uploaded', parseInt(uploads?.count || '0', 10));

    // streak (current)
    const streakRow = await this.db.queryOne<{ current_streak: string }>(
      `SELECT current_streak FROM user_gamification WHERE user_id = $1`,
      [userId],
    );
    result.set('streak', parseInt(streakRow?.current_streak || '0', 10));

    // level
    const levelRow = await this.db.queryOne<{ level: string }>(
      `SELECT level FROM user_gamification WHERE user_id = $1`,
      [userId],
    );
    result.set('level', parseInt(levelRow?.level || '0', 10));

    return result;
  }
}
