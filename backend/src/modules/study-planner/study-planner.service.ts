import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface UpcomingReviewDay {
  date: string;
  reviewCount: number;
  studySets: Array<{ id: string; name: string; dueCount: number }>;
}

export interface DailyPlanItem {
  type: 'review' | 'quiz_deadline' | 'exam';
  priority: number;
  studySetId: string;
  studySetName: string;
  detail: string;
  count?: number;
  examDate?: string;
}

export interface StudyStreakData {
  currentStreak: number;
  longestStreak: number;
  heatmap: Array<{ date: string; count: number }>;
}

export interface ExamDateRecord {
  id: string;
  userId: string;
  studySetId: string;
  examDate: string;
  createdAt: Date;
}

@Injectable()
export class StudyPlannerService {
  private readonly logger = new Logger(StudyPlannerService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get upcoming flashcard reviews for the next N days, grouped by date
   */
  async getUpcomingReviews(userId: string, days: number): Promise<UpcomingReviewDay[]> {
    const result = await this.db.queryMany<{
      review_date: string;
      review_count: string;
      study_set_id: string;
      study_set_name: string;
      due_count: string;
    }>(
      `SELECT
        DATE(f.next_review_at) AS review_date,
        COUNT(f.id) AS review_count,
        s.id AS study_set_id,
        s.title AS study_set_name,
        COUNT(f.id) AS due_count
      FROM flashcards f
      JOIN study_sets s ON f.study_set_id = s.id
      WHERE s.user_id = $1
        AND f.next_review_at >= NOW()
        AND f.next_review_at < NOW() + ($2 || ' days')::INTERVAL
      GROUP BY DATE(f.next_review_at), s.id, s.title
      ORDER BY review_date ASC`,
      [userId, days.toString()],
    );

    // Group by date
    const byDate = new Map<string, UpcomingReviewDay>();
    for (const row of result) {
      const dateStr = row.review_date;
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, { date: dateStr, reviewCount: 0, studySets: [] });
      }
      const day = byDate.get(dateStr)!;
      const dueCount = parseInt(row.due_count, 10);
      day.reviewCount += dueCount;
      day.studySets.push({
        id: row.study_set_id,
        name: row.study_set_name,
        dueCount,
      });
    }

    return Array.from(byDate.values());
  }

  /**
   * Get the daily study plan for a specific date
   * Prioritized: overdue first, then due today, then upcoming
   */
  async getDailyPlan(userId: string, date: string): Promise<DailyPlanItem[]> {
    const items: DailyPlanItem[] = [];

    // 1. Overdue flashcard reviews (before today)
    const overdueReviews = await this.db.queryMany<{
      study_set_id: string;
      study_set_name: string;
      overdue_count: string;
    }>(
      `SELECT
        s.id AS study_set_id,
        s.title AS study_set_name,
        COUNT(f.id) AS overdue_count
      FROM flashcards f
      JOIN study_sets s ON f.study_set_id = s.id
      WHERE s.user_id = $1
        AND f.next_review_at < $2::DATE
        AND f.next_review_at IS NOT NULL
      GROUP BY s.id, s.title
      ORDER BY overdue_count DESC`,
      [userId, date],
    );

    for (const row of overdueReviews) {
      items.push({
        type: 'review',
        priority: 1,
        studySetId: row.study_set_id,
        studySetName: row.study_set_name,
        detail: `${row.overdue_count} overdue review(s)`,
        count: parseInt(row.overdue_count, 10),
      });
    }

    // 2. Due today flashcard reviews
    const todayReviews = await this.db.queryMany<{
      study_set_id: string;
      study_set_name: string;
      due_count: string;
    }>(
      `SELECT
        s.id AS study_set_id,
        s.title AS study_set_name,
        COUNT(f.id) AS due_count
      FROM flashcards f
      JOIN study_sets s ON f.study_set_id = s.id
      WHERE s.user_id = $1
        AND DATE(f.next_review_at) = $2::DATE
      GROUP BY s.id, s.title
      ORDER BY due_count DESC`,
      [userId, date],
    );

    for (const row of todayReviews) {
      items.push({
        type: 'review',
        priority: 2,
        studySetId: row.study_set_id,
        studySetName: row.study_set_name,
        detail: `${row.due_count} review(s) due today`,
        count: parseInt(row.due_count, 10),
      });
    }

    // 3. Exam dates for the given date
    const exams = await this.db.queryMany<{
      study_set_id: string;
      study_set_name: string;
      exam_date: string;
    }>(
      `SELECT
        e.study_set_id,
        s.title AS study_set_name,
        e.exam_date::TEXT
      FROM study_set_exam_dates e
      JOIN study_sets s ON e.study_set_id = s.id
      WHERE e.user_id = $1
        AND e.exam_date = $2::DATE`,
      [userId, date],
    );

    for (const row of exams) {
      items.push({
        type: 'exam',
        priority: 0,
        studySetId: row.study_set_id,
        studySetName: row.study_set_name,
        detail: `Exam scheduled`,
        examDate: row.exam_date,
      });
    }

    // Sort by priority (lower number = higher priority)
    items.sort((a, b) => a.priority - b.priority);

    return items;
  }

  /**
   * Set an exam date for a study set
   */
  async setExamDate(
    userId: string,
    studySetId: string,
    examDate: string,
  ): Promise<ExamDateRecord> {
    // Upsert: if exam date already exists for this user+study_set, update it
    const result = await this.db.queryOne<{
      id: string;
      user_id: string;
      study_set_id: string;
      exam_date: string;
      created_at: Date;
    }>(
      `INSERT INTO study_set_exam_dates (user_id, study_set_id, exam_date)
      VALUES ($1, $2, $3::DATE)
      ON CONFLICT (user_id, study_set_id)
      DO UPDATE SET exam_date = $3::DATE
      RETURNING id, user_id, study_set_id, exam_date::TEXT, created_at`,
      [userId, studySetId, examDate],
    );

    if (!result) {
      throw new Error('Failed to set exam date');
    }

    return {
      id: result.id,
      userId: result.user_id,
      studySetId: result.study_set_id,
      examDate: result.exam_date,
      createdAt: result.created_at,
    };
  }

  /**
   * Get study streak and calendar heatmap data for the last 90 days
   */
  async getStudyStreak(userId: string): Promise<StudyStreakData> {
    // Get flashcard review activity per day for the last 90 days
    const activity = await this.db.queryMany<{
      activity_date: string;
      review_count: string;
    }>(
      `SELECT
        DATE(f.last_reviewed_at) AS activity_date,
        COUNT(f.id) AS review_count
      FROM flashcards f
      JOIN study_sets s ON f.study_set_id = s.id
      WHERE s.user_id = $1
        AND f.last_reviewed_at >= NOW() - INTERVAL '90 days'
        AND f.last_reviewed_at IS NOT NULL
      GROUP BY DATE(f.last_reviewed_at)
      ORDER BY activity_date ASC`,
      [userId],
    );

    const heatmap = activity.map((a) => ({
      date: a.activity_date,
      count: parseInt(a.review_count, 10),
    }));

    // Calculate streaks
    const { current, longest } = this.calculateStreak(heatmap);

    return {
      currentStreak: current,
      longestStreak: longest,
      heatmap,
    };
  }

  /**
   * Export upcoming reviews and exam dates as iCal (.ics) file
   */
  async exportToIcal(userId: string): Promise<string> {
    // Get upcoming reviews for the next 30 days
    const upcoming = await this.getUpcomingReviews(userId, 30);

    // Get all exam dates
    const exams = await this.db.queryMany<{
      study_set_id: string;
      study_set_name: string;
      exam_date: string;
    }>(
      `SELECT
        e.study_set_id,
        s.title AS study_set_name,
        e.exam_date::TEXT
      FROM study_set_exam_dates e
      JOIN study_sets s ON e.study_set_id = s.id
      WHERE e.user_id = $1
        AND e.exam_date >= CURRENT_DATE`,
      [userId],
    );

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Studyield//Study Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    // Add review sessions
    for (const day of upcoming) {
      const dateCompact = day.date.replace(/-/g, '');
      const setNames = day.studySets.map((s) => s.name).join(', ');
      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTART;VALUE=DATE:${dateCompact}`);
      lines.push(`DTEND;VALUE=DATE:${dateCompact}`);
      lines.push(`SUMMARY:${day.reviewCount} flashcard review(s) due`);
      lines.push(`DESCRIPTION:Study sets: ${this.escapeIcal(setNames)}`);
      lines.push(`UID:review-${dateCompact}-${userId}@studyield`);
      lines.push('END:VEVENT');
    }

    // Add exam dates
    for (const exam of exams) {
      const dateCompact = exam.exam_date.replace(/-/g, '');
      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTART;VALUE=DATE:${dateCompact}`);
      lines.push(`DTEND;VALUE=DATE:${dateCompact}`);
      lines.push(`SUMMARY:Exam: ${this.escapeIcal(exam.study_set_name)}`);
      lines.push(`DESCRIPTION:Exam for study set: ${this.escapeIcal(exam.study_set_name)}`);
      lines.push(`UID:exam-${exam.study_set_id}-${dateCompact}@studyield`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  private escapeIcal(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  private calculateStreak(
    activity: Array<{ date: string; count: number }>,
  ): { current: number; longest: number } {
    if (activity.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let streak = 0;
    let lastDate: Date | null = null;

    const sorted = [...activity].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const a of sorted) {
      if (a.count === 0) continue;
      const date = new Date(a.date);
      if (lastDate) {
        const diff = Math.floor(
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );
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
      const diff = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      current = diff <= 1 ? streak : 0;
    }

    return { current, longest };
  }
}
