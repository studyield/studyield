import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export type SourceType = 'file' | 'youtube' | 'website' | 'audio' | 'handwriting';

export interface ContentSource {
  id: string;
  userId: string;
  studySetId: string;
  type: SourceType;
  title: string;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  thumbnailUrl: string | null;
  metadata: Record<string, unknown> | null;
  extractedText: string | null;
  flashcardsGenerated: number;
  notesGenerated: number;
  createdAt: Date;
}

export interface CreateContentSourceDto {
  studySetId: string;
  type: SourceType;
  title: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  extractedText?: string;
}

@Injectable()
export class ContentSourcesService {
  private readonly logger = new Logger(ContentSourcesService.name);

  constructor(private readonly db: DatabaseService) {}

  async ensureTableExists(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS content_sources (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        study_set_id UUID NOT NULL REFERENCES study_sets(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        url TEXT,
        file_name VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        thumbnail_url TEXT,
        metadata JSONB,
        extracted_text TEXT,
        flashcards_generated INTEGER DEFAULT 0,
        notes_generated INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_content_sources_user_id ON content_sources(user_id);
      CREATE INDEX IF NOT EXISTS idx_content_sources_study_set_id ON content_sources(study_set_id);
    `);
  }

  async create(userId: string, dto: CreateContentSourceDto): Promise<ContentSource> {
    // Verify study set ownership
    await this.verifyStudySetOwnership(dto.studySetId, userId);

    const id = uuidv4();

    const result = await this.db.queryOne<ContentSource>(
      `INSERT INTO content_sources (
        id, user_id, study_set_id, type, title, url, file_name, file_size,
        mime_type, thumbnail_url, metadata, extracted_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        userId,
        dto.studySetId,
        dto.type,
        dto.title,
        dto.url || null,
        dto.fileName || null,
        dto.fileSize || null,
        dto.mimeType || null,
        dto.thumbnailUrl || null,
        dto.metadata ? JSON.stringify(dto.metadata) : null,
        dto.extractedText || null,
      ],
    );

    this.logger.log(`Content source created: ${id} (${dto.type})`);
    return this.mapSource(result!);
  }

  async findByStudySet(studySetId: string, userId: string): Promise<ContentSource[]> {
    await this.verifyStudySetOwnership(studySetId, userId);

    const results = await this.db.queryMany<ContentSource>(
      `SELECT * FROM content_sources
       WHERE study_set_id = $1
       ORDER BY created_at DESC`,
      [studySetId],
    );

    return results.map((r) => this.mapSource(r));
  }

  async findById(id: string): Promise<ContentSource | null> {
    const result = await this.db.queryOne<ContentSource>(
      'SELECT * FROM content_sources WHERE id = $1',
      [id],
    );
    return result ? this.mapSource(result) : null;
  }

  async updateStats(
    id: string,
    flashcardsGenerated?: number,
    notesGenerated?: number,
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (flashcardsGenerated !== undefined) {
      updates.push(`flashcards_generated = flashcards_generated + $${paramIndex++}`);
      values.push(flashcardsGenerated);
    }
    if (notesGenerated !== undefined) {
      updates.push(`notes_generated = notes_generated + $${paramIndex++}`);
      values.push(notesGenerated);
    }

    if (updates.length === 0) return;

    values.push(id);
    await this.db.query(
      `UPDATE content_sources SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const source = await this.findById(id);
    if (!source) {
      throw new NotFoundException('Source not found');
    }

    await this.verifyStudySetOwnership(source.studySetId, userId);

    await this.db.query('DELETE FROM content_sources WHERE id = $1', [id]);
    this.logger.log(`Content source deleted: ${id}`);
  }

  private async verifyStudySetOwnership(studySetId: string, userId: string): Promise<void> {
    const result = await this.db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM study_sets WHERE id = $1',
      [studySetId],
    );

    if (!result) {
      throw new NotFoundException('Study set not found');
    }
    if (result.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private mapSource(row: unknown): ContentSource {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      studySetId: r.study_set_id as string,
      type: r.type as SourceType,
      title: r.title as string,
      url: r.url as string | null,
      fileName: r.file_name as string | null,
      fileSize: r.file_size ? Number(r.file_size) : null,
      mimeType: r.mime_type as string | null,
      thumbnailUrl: r.thumbnail_url as string | null,
      metadata: r.metadata
        ? typeof r.metadata === 'string'
          ? JSON.parse(r.metadata)
          : (r.metadata as Record<string, unknown>)
        : null,
      extractedText: r.extracted_text as string | null,
      flashcardsGenerated: Number(r.flashcards_generated || 0),
      notesGenerated: Number(r.notes_generated || 0),
      createdAt: new Date(r.created_at as string),
    };
  }
}
