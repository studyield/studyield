import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ClickhouseService } from '../clickhouse/clickhouse.service';

export interface UserAnalytics {
  totalStudyTime: number;
  studySetsCreated: number;
  flashcardsReviewed: number;
  quizzesTaken: number;
  averageQuizScore: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
}

export interface StudyActivity {
  date: string;
  studyTime: number;
  flashcardsReviewed: number;
  quizzesTaken: number;
}

export interface PerformanceMetrics {
  flashcardAccuracy: number;
  quizAccuracy: number;
  improvementRate: number;
  strongTopics: string[];
  weakTopics: string[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly clickhouse: ClickhouseService,
  ) {}

  async trackEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.clickhouse.trackEvent({ eventType, userId, metadata });
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const [studySets, flashcards, quizzes, quizScores] = await Promise.all([
        this.db.queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM study_sets WHERE user_id = $1',
          [userId],
        ),
        this.db.queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM flashcards f
           JOIN study_sets s ON f.study_set_id = s.id
           WHERE s.user_id = $1 AND f.last_reviewed_at IS NOT NULL`,
          [userId],
        ),
        this.db.queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1',
          [userId],
        ),
        this.db.queryOne<{ avg: string }>(
          'SELECT AVG(score) as avg FROM quiz_attempts WHERE user_id = $1',
          [userId],
        ),
      ]);

      let activity: Array<{ date: string; count: number }> = [];
      try {
        activity = await this.clickhouse.getUserActivity(userId, 30);
      } catch (e) {
        this.logger.warn(`ClickHouse unavailable: ${e.message}`);
      }
      const streak = this.calculateStreak(activity);

      return {
        totalStudyTime: activity.reduce((sum, a) => sum + a.count, 0) * 5,
        studySetsCreated: parseInt(studySets?.count || '0', 10),
        flashcardsReviewed: parseInt(flashcards?.count || '0', 10),
        quizzesTaken: parseInt(quizzes?.count || '0', 10),
        averageQuizScore: parseFloat(quizScores?.avg || '0'),
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastStudyDate: activity.length > 0 ? new Date(activity[activity.length - 1].date) : null,
      };
    } catch (e) {
      this.logger.error(`Failed to get user analytics: ${e.message}`);
      return {
        totalStudyTime: 0,
        studySetsCreated: 0,
        flashcardsReviewed: 0,
        quizzesTaken: 0,
        averageQuizScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
      };
    }
  }

  async getStudyActivity(userId: string, days = 30): Promise<StudyActivity[]> {
    let activity: Array<{ date: string; count: number }> = [];
    try {
      activity = await this.clickhouse.getUserActivity(userId, days);
    } catch (e) {
      this.logger.warn(`ClickHouse unavailable for study activity: ${e.message}`);
    }

    return activity.map((a) => ({
      date: a.date,
      studyTime: a.count * 5,
      flashcardsReviewed: 0,
      quizzesTaken: 0,
    }));
  }

  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    const flashcardStats = await this.db.queryOne<{ total: string; correct: string }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_correct) as correct
       FROM quiz_attempt_answers qa
       JOIN quiz_attempts a ON qa.attempt_id = a.id
       WHERE a.user_id = $1`,
      [userId],
    );

    const total = parseInt(flashcardStats?.total || '0', 10);
    const correct = parseInt(flashcardStats?.correct || '0', 10);

    return {
      flashcardAccuracy: total > 0 ? (correct / total) * 100 : 0,
      quizAccuracy: total > 0 ? (correct / total) * 100 : 0,
      improvementRate: 0,
      strongTopics: [],
      weakTopics: [],
    };
  }

  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalStudySets: number;
    totalFlashcards: number;
    totalQuizzes: number;
  }> {
    const [users, studySets, flashcards, quizzes] = await Promise.all([
      this.db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      this.db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM study_sets'),
      this.db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM flashcards'),
      this.db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM quizzes'),
    ]);

    return {
      totalUsers: parseInt(users?.count || '0', 10),
      totalStudySets: parseInt(studySets?.count || '0', 10),
      totalFlashcards: parseInt(flashcards?.count || '0', 10),
      totalQuizzes: parseInt(quizzes?.count || '0', 10),
    };
  }

  private calculateStreak(activity: Array<{ date: string; count: number }>): {
    current: number;
    longest: number;
  } {
    if (activity.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let streak = 0;
    let lastDate: Date | null = null;

    const sortedActivity = [...activity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const a of sortedActivity) {
      if (a.count === 0) continue;

      const date = new Date(a.date);
      if (lastDate) {
        const diff = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak++;
        } else {
          longest = Math.max(longest, streak);
          streak = 1;
        }
      } else {
        streak = 1;
      }
      lastDate = date;
    }

    longest = Math.max(longest, streak);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      current = diff <= 1 ? streak : 0;
    }

    return { current, longest };
  }
}
