import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface StudySet {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  tags: string[];
  coverImageUrl: string | null;
  examDate: string | null;
  examSubject: string | null;
  flashcardsCount: number;
  documentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudySetDto {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  coverImageUrl?: string;
  examDate?: string;
  examSubject?: string;
}

export interface UpdateStudySetDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  coverImageUrl?: string;
  examDate?: string;
  examSubject?: string;
}

@Injectable()
export class StudySetsService {
  private readonly logger = new Logger(StudySetsService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, dto: CreateStudySetDto): Promise<StudySet> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<StudySet>(
      `INSERT INTO study_sets (id, user_id, title, description, is_public, tags, cover_image_url, exam_date, exam_subject, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        userId,
        dto.title,
        dto.description || null,
        dto.isPublic || false,
        JSON.stringify(dto.tags || []),
        dto.coverImageUrl || null,
        dto.examDate || null,
        dto.examSubject || null,
        now,
        now,
      ],
    );

    this.logger.log(`Study set created: ${id}`);
    return this.mapStudySet(result!);
  }

  async findById(id: string): Promise<StudySet | null> {
    const result = await this.db.queryOne<StudySet>(
      `SELECT s.*,
        (SELECT COUNT(*) FROM flashcards f WHERE f.study_set_id = s.id) as flashcards_count,
        (SELECT COUNT(*) FROM documents d WHERE d.study_set_id = s.id) as documents_count
       FROM study_sets s WHERE s.id = $1`,
      [id],
    );
    return result ? this.mapStudySet(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<StudySet> {
    const studySet = await this.findById(id);
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    if (!studySet.isPublic && studySet.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return studySet;
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: StudySet[]; total: number }> {
    const offset = (page - 1) * limit;

    const [results, countResult] = await Promise.all([
      this.db.queryMany<StudySet>(
        `SELECT s.*,
          (SELECT COUNT(*) FROM flashcards f WHERE f.study_set_id = s.id) as flashcards_count,
          (SELECT COUNT(*) FROM documents d WHERE d.study_set_id = s.id) as documents_count
         FROM study_sets s
         WHERE s.user_id = $1
         ORDER BY s.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
      this.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM study_sets WHERE user_id = $1',
        [userId],
      ),
    ]);

    return {
      data: results.map((r) => this.mapStudySet(r)),
      total: parseInt(countResult?.count || '0', 10),
    };
  }

  async findPublic(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: StudySet[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: unknown[] = [limit, offset];
    let whereClause = 'WHERE s.is_public = true';

    if (search) {
      whereClause += ` AND (s.title ILIKE $3 OR s.description ILIKE $3)`;
      params.push(`%${search}%`);
    }

    const [results, countResult] = await Promise.all([
      this.db.queryMany<StudySet>(
        `SELECT s.*,
          (SELECT COUNT(*) FROM flashcards f WHERE f.study_set_id = s.id) as flashcards_count,
          (SELECT COUNT(*) FROM documents d WHERE d.study_set_id = s.id) as documents_count
         FROM study_sets s
         ${whereClause}
         ORDER BY s.created_at DESC
         LIMIT $1 OFFSET $2`,
        params,
      ),
      this.db.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM study_sets s ${whereClause}`,
        search ? [`%${search}%`] : [],
      ),
    ]);

    return {
      data: results.map((r) => this.mapStudySet(r)),
      total: parseInt(countResult?.count || '0', 10),
    };
  }

  async update(id: string, userId: string, dto: UpdateStudySetDto): Promise<StudySet> {
    const studySet = await this.findById(id);
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    if (studySet.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(dto.title);
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(dto.isPublic);
    }
    if (dto.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(dto.tags));
    }
    if (dto.coverImageUrl !== undefined) {
      updates.push(`cover_image_url = $${paramIndex++}`);
      values.push(dto.coverImageUrl);
    }
    if (dto.examDate !== undefined) {
      updates.push(`exam_date = $${paramIndex++}`);
      values.push(dto.examDate || null);
    }
    if (dto.examSubject !== undefined) {
      updates.push(`exam_subject = $${paramIndex++}`);
      values.push(dto.examSubject || null);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    values.push(id);

    const result = await this.db.queryOne<StudySet>(
      `UPDATE study_sets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapStudySet(result!);
  }

  async delete(id: string, userId: string): Promise<void> {
    const studySet = await this.findById(id);
    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }
    if (studySet.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.db.query('DELETE FROM study_sets WHERE id = $1', [id]);
    this.logger.log(`Study set deleted: ${id}`);
  }

  async duplicate(id: string, userId: string): Promise<StudySet> {
    const original = await this.findByIdWithAccess(id, userId);

    const newStudySet = await this.create(userId, {
      title: `${original.title} (Copy)`,
      description: original.description || undefined,
      isPublic: false,
      tags: original.tags,
    });

    const flashcards = await this.db.queryMany(
      'SELECT front, back, notes, tags FROM flashcards WHERE study_set_id = $1',
      [id],
    );

    for (const card of flashcards) {
      await this.db.query(
        `INSERT INTO flashcards (id, study_set_id, front, back, notes, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          newStudySet.id,
          card.front,
          card.back,
          card.notes,
          card.tags,
          new Date(),
          new Date(),
        ],
      );
    }

    this.logger.log(`Study set duplicated: ${id} -> ${newStudySet.id}`);
    return this.findById(newStudySet.id) as Promise<StudySet>;
  }

  private mapStudySet(row: unknown): StudySet {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      title: r.title as string,
      description: r.description as string | null,
      isPublic: r.is_public as boolean,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags as string[]) || [],
      coverImageUrl: r.cover_image_url as string | null,
      examDate: r.exam_date ? String(r.exam_date) : null,
      examSubject: r.exam_subject as string | null,
      flashcardsCount: parseInt(String(r.flashcards_count || 0), 10),
      documentsCount: parseInt(String(r.documents_count || 0), 10),
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
