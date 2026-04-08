import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFlashcardDto, UpdateFlashcardDto, ReviewFlashcardDto } from './dto/flashcard.dto';

export interface Flashcard {
  id: string;
  studySetId: string;
  front: string;
  back: string;
  notes: string | null;
  tags: string[];
  type: 'standard' | 'cloze' | 'image_occlusion';
  difficulty: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs moved to dto/flashcard.dto.ts for proper validation

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateFlashcardDto): Promise<Flashcard> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<Flashcard>(
      `INSERT INTO flashcards (id, study_set_id, front, back, notes, tags, type, difficulty, interval, repetitions, ease_factor, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 2.5, $8, $9)
       RETURNING *`,
      [
        id,
        dto.studySetId,
        dto.front,
        dto.back,
        dto.notes || null,
        JSON.stringify(dto.tags || []),
        dto.type || 'standard',
        now,
        now,
      ],
    );

    this.logger.log(`Flashcard created: ${id}`);
    return this.mapFlashcard(result!);
  }

  async createBulk(
    userId: string,
    studySetId: string,
    cards: Array<{ front: string; back: string; notes?: string; tags?: string[]; type?: string }>,
  ): Promise<Flashcard[]> {
    const now = new Date();
    const results: Flashcard[] = [];

    for (const card of cards) {
      const id = uuidv4();
      const result = await this.db.queryOne<Flashcard>(
        `INSERT INTO flashcards (id, study_set_id, front, back, notes, tags, type, difficulty, interval, repetitions, ease_factor, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 2.5, $8, $9)
         RETURNING *`,
        [
          id,
          studySetId,
          card.front,
          card.back,
          card.notes || null,
          JSON.stringify(card.tags || []),
          card.type || 'standard',
          now,
          now,
        ],
      );
      results.push(this.mapFlashcard(result!));
    }

    this.logger.log(`${results.length} flashcards created for study set: ${studySetId}`);
    return results;
  }

  async findById(id: string): Promise<Flashcard | null> {
    const result = await this.db.queryOne<Flashcard>('SELECT * FROM flashcards WHERE id = $1', [
      id,
    ]);
    return result ? this.mapFlashcard(result) : null;
  }

  async findByStudySet(studySetId: string): Promise<Flashcard[]> {
    const results = await this.db.queryMany<Flashcard>(
      'SELECT * FROM flashcards WHERE study_set_id = $1 ORDER BY created_at ASC',
      [studySetId],
    );
    return results.map((r) => this.mapFlashcard(r));
  }

  async findDueForReview(userId: string, limit = 20): Promise<Flashcard[]> {
    const results = await this.db.queryMany<Flashcard>(
      `SELECT f.* FROM flashcards f
       JOIN study_sets s ON f.study_set_id = s.id
       WHERE s.user_id = $1
         AND (f.next_review_at IS NULL OR f.next_review_at <= NOW())
       ORDER BY f.next_review_at ASC NULLS FIRST
       LIMIT $2`,
      [userId, limit],
    );
    return results.map((r) => this.mapFlashcard(r));
  }

  async findByStudySetDueForReview(studySetId: string, limit = 20): Promise<Flashcard[]> {
    const results = await this.db.queryMany<Flashcard>(
      `SELECT * FROM flashcards
       WHERE study_set_id = $1
         AND (next_review_at IS NULL OR next_review_at <= NOW())
       ORDER BY next_review_at ASC NULLS FIRST
       LIMIT $2`,
      [studySetId, limit],
    );
    return results.map((r) => this.mapFlashcard(r));
  }

  async update(id: string, userId: string, dto: UpdateFlashcardDto): Promise<Flashcard> {
    await this.verifyOwnership(id, userId);

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.front !== undefined) {
      updates.push(`front = $${paramIndex++}`);
      values.push(dto.front);
    }
    if (dto.back !== undefined) {
      updates.push(`back = $${paramIndex++}`);
      values.push(dto.back);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dto.notes);
    }
    if (dto.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(dto.tags));
    }
    if (dto.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(dto.type);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    values.push(id);

    const result = await this.db.queryOne<Flashcard>(
      `UPDATE flashcards SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapFlashcard(result!);
  }

  async review(id: string, userId: string, dto: ReviewFlashcardDto): Promise<Flashcard> {
    await this.verifyOwnership(id, userId);

    const flashcard = await this.findById(id);
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    const { interval, repetitions, easeFactor } = this.calculateSM2(
      dto.quality,
      flashcard.interval,
      flashcard.repetitions,
      flashcard.easeFactor,
    );

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    const result = await this.db.queryOne<Flashcard>(
      `UPDATE flashcards
       SET interval = $1, repetitions = $2, ease_factor = $3, next_review_at = $4, last_reviewed_at = $5, updated_at = $6
       WHERE id = $7
       RETURNING *`,
      [interval, repetitions, easeFactor, nextReviewAt, new Date(), new Date(), id],
    );

    // Send achievement notifications for mastery milestones
    await this.checkAndSendMasteryAchievement(userId, interval);

    return this.mapFlashcard(result!);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.verifyOwnership(id, userId);
    await this.db.query('DELETE FROM flashcards WHERE id = $1', [id]);
    this.logger.log(`Flashcard deleted: ${id}`);
  }

  async deleteByStudySet(studySetId: string): Promise<void> {
    await this.db.query('DELETE FROM flashcards WHERE study_set_id = $1', [studySetId]);
    this.logger.log(`All flashcards deleted for study set: ${studySetId}`);
  }

  async getStudyProgress(studySetId: string): Promise<{
    total: number;
    new: number;
    learning: number;
    review: number;
    mastered: number;
  }> {
    const result = await this.db.queryOne<{
      total: string;
      new_count: string;
      learning: string;
      review: string;
      mastered: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE repetitions = 0) as new_count,
        COUNT(*) FILTER (WHERE repetitions > 0 AND interval < 7) as learning,
        COUNT(*) FILTER (WHERE interval >= 7 AND interval < 30) as review,
        COUNT(*) FILTER (WHERE interval >= 30) as mastered
       FROM flashcards WHERE study_set_id = $1`,
      [studySetId],
    );

    return {
      total: parseInt(result?.total || '0', 10),
      new: parseInt(result?.new_count || '0', 10),
      learning: parseInt(result?.learning || '0', 10),
      review: parseInt(result?.review || '0', 10),
      mastered: parseInt(result?.mastered || '0', 10),
    };
  }

  private calculateSM2(
    quality: number,
    prevInterval: number,
    prevRepetitions: number,
    prevEaseFactor: number,
  ): { interval: number; repetitions: number; easeFactor: number } {
    let interval: number;
    let repetitions: number;
    let easeFactor = prevEaseFactor;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions = prevRepetitions + 1;

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(prevInterval * easeFactor);
      }
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    return { interval, repetitions, easeFactor };
  }

  private async verifyOwnership(flashcardId: string, userId: string): Promise<void> {
    const result = await this.db.queryOne<{ user_id: string }>(
      `SELECT s.user_id FROM flashcards f
       JOIN study_sets s ON f.study_set_id = s.id
       WHERE f.id = $1`,
      [flashcardId],
    );

    if (!result) {
      throw new NotFoundException('Flashcard not found');
    }
    if (result.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async checkAndSendMasteryAchievement(userId: string, interval: number): Promise<void> {
    try {
      // Get user's total mastered flashcards count (interval >= 30 days)
      const result = await this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM flashcards f
         JOIN study_sets s ON f.study_set_id = s.id
         WHERE s.user_id = $1 AND f.interval >= 30`,
        [userId],
      );

      const masteredCount = parseInt(result?.count || '0', 10);

      // Send achievement notifications at milestones
      const milestones = [10, 25, 50, 100, 250, 500, 1000];
      if (milestones.includes(masteredCount)) {
        await this.notificationsService.sendAchievementNotification(
          userId,
          `You've mastered ${masteredCount} flashcards! 🎉`,
        );
      }

      // Send notification for first mastered card
      if (interval >= 30 && masteredCount === 1) {
        await this.notificationsService.create({
          userId,
          type: 'success',
          title: '🎯 First Card Mastered!',
          message: "You've mastered your first flashcard! Keep reviewing to master more.",
          link: '/study',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send mastery achievement: ${error.message}`);
    }
  }

  private mapFlashcard(row: unknown): Flashcard {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      studySetId: r.study_set_id as string,
      front: r.front as string,
      back: r.back as string,
      notes: r.notes as string | null,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags as string[]) || [],
      type: (r.type as Flashcard['type']) || 'standard',
      difficulty: r.difficulty as number,
      interval: r.interval as number,
      repetitions: r.repetitions as number,
      easeFactor: parseFloat(String(r.ease_factor)),
      nextReviewAt: r.next_review_at ? new Date(r.next_review_at as string) : null,
      lastReviewedAt: r.last_reviewed_at ? new Date(r.last_reviewed_at as string) : null,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
