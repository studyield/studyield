import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { CreateNoteDto, UpdateNoteDto, NoteSourceType } from './dto/note.dto';

export interface Note {
  id: string;
  studySetId: string;
  title: string;
  content: string;
  contentJson: Record<string, unknown> | null;
  summary: string | null;
  sourceType: NoteSourceType;
  sourceUrl: string | null;
  sourceMetadata: Record<string, unknown> | null;
  tags: string[];
  isPinned: boolean;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    // Verify study set ownership
    await this.verifyStudySetOwnership(dto.studySetId, userId);

    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<Note>(
      `INSERT INTO notes (
        id, study_set_id, title, content, content_json, summary,
        source_type, source_url, source_metadata, tags, is_pinned, color,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        id,
        dto.studySetId,
        dto.title,
        dto.content,
        dto.contentJson ? JSON.stringify(dto.contentJson) : null,
        dto.summary || null,
        dto.sourceType || 'manual',
        dto.sourceUrl || null,
        dto.sourceMetadata ? JSON.stringify(dto.sourceMetadata) : null,
        JSON.stringify(dto.tags || []),
        dto.isPinned || false,
        dto.color || null,
        now,
        now,
      ],
    );

    this.logger.log(`Note created: ${id} in study set ${dto.studySetId}`);
    return this.mapNote(result!);
  }

  async findById(id: string): Promise<Note | null> {
    const result = await this.db.queryOne<Note>('SELECT * FROM notes WHERE id = $1', [id]);
    return result ? this.mapNote(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<Note> {
    const note = await this.findById(id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    await this.verifyStudySetOwnership(note.studySetId, userId);
    return note;
  }

  async findByStudySet(studySetId: string, userId: string): Promise<Note[]> {
    // Verify access
    await this.verifyStudySetOwnership(studySetId, userId);

    const results = await this.db.queryMany<Note>(
      `SELECT * FROM notes
       WHERE study_set_id = $1
       ORDER BY is_pinned DESC, created_at DESC`,
      [studySetId],
    );

    return results.map((r) => this.mapNote(r));
  }

  async update(id: string, userId: string, dto: UpdateNoteDto): Promise<Note> {
    await this.verifyOwnership(id, userId);

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (dto.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(dto.title);
    }
    if (dto.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(dto.content);
    }
    if (dto.contentJson !== undefined) {
      updates.push(`content_json = $${paramIndex++}`);
      values.push(JSON.stringify(dto.contentJson));
    }
    if (dto.summary !== undefined) {
      updates.push(`summary = $${paramIndex++}`);
      values.push(dto.summary);
    }
    if (dto.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(dto.tags));
    }
    if (dto.isPinned !== undefined) {
      updates.push(`is_pinned = $${paramIndex++}`);
      values.push(dto.isPinned);
    }
    if (dto.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(dto.color);
    }

    if (updates.length === 0) {
      return this.findByIdWithAccess(id, userId);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    values.push(id);

    const result = await this.db.queryOne<Note>(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    this.logger.log(`Note updated: ${id}`);
    return this.mapNote(result!);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.verifyOwnership(id, userId);
    await this.db.query('DELETE FROM notes WHERE id = $1', [id]);
    this.logger.log(`Note deleted: ${id}`);
  }

  async togglePin(id: string, userId: string): Promise<Note> {
    await this.verifyOwnership(id, userId);

    const result = await this.db.queryOne<Note>(
      `UPDATE notes SET is_pinned = NOT is_pinned, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );

    return this.mapNote(result!);
  }

  async getNotesCount(studySetId: string): Promise<number> {
    const result = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notes WHERE study_set_id = $1',
      [studySetId],
    );
    return parseInt(result?.count || '0', 10);
  }

  async generateMindMap(noteId: string, userId: string) {
    const note = await this.findByIdWithAccess(noteId, userId);

    const prompt = `Based on this note content, generate a mind map structure:

Title: ${note.title}
Content: ${note.content}

Create a hierarchical mind map with:
1. Central topic (main concept)
2. Main branches (3-6 key topics)
3. Sub-branches for each main branch (2-4 subtopics each)

Return JSON:
{
  "centralTopic": {
    "id": "central",
    "label": "Main Topic",
    "color": "#8b5cf6"
  },
  "branches": [
    {
      "id": "branch1",
      "label": "Branch Label",
      "color": "#10b981",
      "children": [
        {"id": "sub1", "label": "Subtopic", "color": "#34d399"}
      ]
    }
  ]
}`;

    const result = await this.aiService.completeJson<{
      centralTopic: { id: string; label: string; color: string };
      branches: Array<{
        id: string;
        label: string;
        color: string;
        children: Array<{ id: string; label: string; color: string }>;
      }>;
    }>([
      { role: 'system', content: 'Generate mind map structure as JSON.' },
      { role: 'user', content: prompt },
    ]);

    return result;
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

  private async verifyOwnership(noteId: string, userId: string): Promise<void> {
    const result = await this.db.queryOne<{ user_id: string }>(
      `SELECT s.user_id FROM notes n
       JOIN study_sets s ON n.study_set_id = s.id
       WHERE n.id = $1`,
      [noteId],
    );

    if (!result) {
      throw new NotFoundException('Note not found');
    }
    if (result.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private mapNote(row: unknown): Note {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      studySetId: r.study_set_id as string,
      title: r.title as string,
      content: r.content as string,
      contentJson: r.content_json
        ? typeof r.content_json === 'string'
          ? JSON.parse(r.content_json)
          : (r.content_json as Record<string, unknown>)
        : null,
      summary: r.summary as string | null,
      sourceType: (r.source_type as NoteSourceType) || 'manual',
      sourceUrl: r.source_url as string | null,
      sourceMetadata: r.source_metadata
        ? typeof r.source_metadata === 'string'
          ? JSON.parse(r.source_metadata)
          : (r.source_metadata as Record<string, unknown>)
        : null,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags as string[]) || [],
      isPinned: r.is_pinned as boolean,
      color: r.color as string | null,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
