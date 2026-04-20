import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';

// ── Interfaces ──────────────────────────────────────────────

export interface KnowledgeEntity {
  id: string;
  userId: string;
  studySetId: string;
  name: string;
  entityType: string;
  description: string;
  sourceText: string | null;
  createdAt: Date;
}

export interface KnowledgeRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  description: string;
  createdAt: Date;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  description: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExtractEntitiesDto {
  studySetId: string;
}

export interface MergeGraphsDto {
  studySetIds: string[];
}

// ── Service ─────────────────────────────────────────────────

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS knowledge_entities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          study_set_id UUID NOT NULL,
          name VARCHAR(500) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          source_text TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_entities_user_study
        ON knowledge_entities(user_id, study_set_id)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_entities_name
        ON knowledge_entities(name)
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS knowledge_relationships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          from_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
          to_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
          relationship_type VARCHAR(100) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_from
        ON knowledge_relationships(from_entity_id)
      `);

      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_to
        ON knowledge_relationships(to_entity_id)
      `);

      this.logger.log('Knowledge graph tables ready');
    } catch (error) {
      this.logger.warn(`Failed to ensure knowledge graph tables: ${(error as Error).message}`);
    }
  }

  // ── Entity Extraction ───────────────────────────────────

  async extractEntities(userId: string, studySetId: string): Promise<KnowledgeEntity[]> {
    // Verify study set ownership
    await this.verifyStudySetAccess(userId, studySetId);

    // Gather text from the study set's content
    const text = await this.gatherStudySetText(studySetId);
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Study set has no content to extract entities from');
    }

    // Prompt AI to extract entities
    const response = await this.aiService.complete(
      [
        {
          role: 'system',
          content:
            'You are an expert knowledge extraction assistant. You extract structured entities from educational content. Always respond with valid JSON only, no markdown fences.',
        },
        {
          role: 'user',
          content: `Extract all key concepts, people, dates, formulas, and definitions from the following study material. For each entity, provide: name, type (one of: concept, person, date, formula, definition, event), description (brief), and source_text (the exact excerpt it came from, max 200 chars).

Return JSON in this exact format:
{"entities":[{"name":"...","type":"...","description":"...","source_text":"..."}]}

Study material:
${text.substring(0, 12000)}`,
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 4096,
        responseFormat: { type: 'json_object' },
      },
    );

    let parsed: { entities: Array<{ name: string; type: string; description: string; source_text?: string }> };
    try {
      parsed = JSON.parse(response.content);
    } catch {
      this.logger.error('Failed to parse AI entity extraction response');
      throw new BadRequestException('AI returned invalid JSON for entity extraction');
    }

    if (!parsed.entities || !Array.isArray(parsed.entities)) {
      throw new BadRequestException('AI returned unexpected format for entity extraction');
    }

    // Clear previous entities for this study set (idempotent re-extraction)
    await this.clearEntities(userId, studySetId);

    // Store entities
    const entities: KnowledgeEntity[] = [];
    for (const raw of parsed.entities) {
      const id = uuidv4();
      const now = new Date();
      await this.db.query(
        `INSERT INTO knowledge_entities (id, user_id, study_set_id, name, entity_type, description, source_text, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, userId, studySetId, raw.name, raw.type, raw.description, raw.source_text || null, now],
      );
      entities.push({
        id,
        userId,
        studySetId,
        name: raw.name,
        entityType: raw.type,
        description: raw.description,
        sourceText: raw.source_text || null,
        createdAt: now,
      });
    }

    this.logger.log(`Extracted ${entities.length} entities from study set ${studySetId}`);

    // Automatically extract relationships after entities
    await this.extractRelationships(userId, studySetId);

    return entities;
  }

  // ── Relationship Extraction ─────────────────────────────

  async extractRelationships(userId: string, studySetId: string): Promise<KnowledgeRelationship[]> {
    await this.verifyStudySetAccess(userId, studySetId);

    // Get existing entities for this study set
    const entityRows = await this.db.queryMany<Record<string, unknown>>(
      `SELECT id, name, entity_type, description FROM knowledge_entities
       WHERE user_id = $1 AND study_set_id = $2
       ORDER BY name`,
      [userId, studySetId],
    );

    if (entityRows.length < 2) {
      this.logger.log('Not enough entities to extract relationships');
      return [];
    }

    const entityList = entityRows
      .map((e) => `- ${e.name} (${e.entity_type}): ${e.description}`)
      .join('\n');

    const response = await this.aiService.complete(
      [
        {
          role: 'system',
          content:
            'You are an expert knowledge graph builder. You identify meaningful relationships between entities. Always respond with valid JSON only, no markdown fences.',
        },
        {
          role: 'user',
          content: `Given these entities from a study set, identify meaningful relationships between them.

Entities:
${entityList.substring(0, 8000)}

Return JSON in this exact format:
{"relationships":[{"from":"<entity name>","to":"<entity name>","relationship_type":"<type>","description":"<brief description>"}]}

Where relationship_type is one of: relates_to, is_part_of, causes, precedes, depends_on, defines, contrasts_with, example_of, derived_from.`,
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 4096,
        responseFormat: { type: 'json_object' },
      },
    );

    let parsed: {
      relationships: Array<{ from: string; to: string; relationship_type: string; description: string }>;
    };
    try {
      parsed = JSON.parse(response.content);
    } catch {
      this.logger.error('Failed to parse AI relationship extraction response');
      throw new BadRequestException('AI returned invalid JSON for relationship extraction');
    }

    if (!parsed.relationships || !Array.isArray(parsed.relationships)) {
      return [];
    }

    // Build name-to-id lookup (case-insensitive)
    const nameToId = new Map<string, string>();
    for (const e of entityRows) {
      nameToId.set((e.name as string).toLowerCase(), e.id as string);
    }

    // Clear previous relationships for this study set's entities
    await this.clearRelationships(userId, studySetId);

    const relationships: KnowledgeRelationship[] = [];
    for (const raw of parsed.relationships) {
      const fromId = nameToId.get(raw.from.toLowerCase());
      const toId = nameToId.get(raw.to.toLowerCase());

      if (!fromId || !toId || fromId === toId) {
        continue; // Skip invalid or self-referential relationships
      }

      const id = uuidv4();
      const now = new Date();
      await this.db.query(
        `INSERT INTO knowledge_relationships (id, from_entity_id, to_entity_id, relationship_type, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, fromId, toId, raw.relationship_type, raw.description, now],
      );
      relationships.push({
        id,
        fromEntityId: fromId,
        toEntityId: toId,
        relationshipType: raw.relationship_type,
        description: raw.description,
        createdAt: now,
      });
    }

    this.logger.log(`Extracted ${relationships.length} relationships for study set ${studySetId}`);
    return relationships;
  }

  // ── Graph Retrieval ─────────────────────────────────────

  async getGraph(userId: string, studySetId: string): Promise<KnowledgeGraph> {
    await this.verifyStudySetAccess(userId, studySetId);

    const entityRows = await this.db.queryMany<Record<string, unknown>>(
      `SELECT id, name, entity_type, description FROM knowledge_entities
       WHERE user_id = $1 AND study_set_id = $2
       ORDER BY name`,
      [userId, studySetId],
    );

    const entityIds = entityRows.map((e) => e.id as string);

    let relationshipRows: Array<Record<string, unknown>> = [];
    if (entityIds.length > 0) {
      relationshipRows = await this.db.queryMany<Record<string, unknown>>(
        `SELECT id, from_entity_id, to_entity_id, relationship_type, description
         FROM knowledge_relationships
         WHERE from_entity_id = ANY($1) OR to_entity_id = ANY($1)`,
        [entityIds],
      );
    }

    const nodes: GraphNode[] = entityRows.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      type: e.entity_type as string,
      description: e.description as string,
    }));

    const edges: GraphEdge[] = relationshipRows.map((r) => ({
      source: r.from_entity_id as string,
      target: r.to_entity_id as string,
      label: r.relationship_type as string,
      description: r.description as string,
    }));

    return { nodes, edges };
  }

  // ── Entity Detail ───────────────────────────────────────

  async getEntities(userId: string, studySetId: string): Promise<KnowledgeEntity[]> {
    await this.verifyStudySetAccess(userId, studySetId);

    const rows = await this.db.queryMany<Record<string, unknown>>(
      `SELECT * FROM knowledge_entities
       WHERE user_id = $1 AND study_set_id = $2
       ORDER BY name`,
      [userId, studySetId],
    );

    return rows.map((r) => this.mapEntity(r));
  }

  async getEntity(userId: string, entityId: string): Promise<{
    entity: KnowledgeEntity;
    relationships: Array<{
      id: string;
      relatedEntity: GraphNode;
      relationshipType: string;
      description: string;
      direction: 'outgoing' | 'incoming';
    }>;
  }> {
    const row = await this.db.queryOne<Record<string, unknown>>(
      `SELECT * FROM knowledge_entities WHERE id = $1`,
      [entityId],
    );

    if (!row) {
      throw new NotFoundException('Entity not found');
    }

    if ((row.user_id as string) !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const entity = this.mapEntity(row);

    // Get all relationships involving this entity
    const relRows = await this.db.queryMany<Record<string, unknown>>(
      `SELECT r.id, r.from_entity_id, r.to_entity_id, r.relationship_type, r.description,
              e.id AS related_id, e.name AS related_name, e.entity_type AS related_type, e.description AS related_description
       FROM knowledge_relationships r
       JOIN knowledge_entities e
         ON (e.id = CASE WHEN r.from_entity_id = $1 THEN r.to_entity_id ELSE r.from_entity_id END)
       WHERE r.from_entity_id = $1 OR r.to_entity_id = $1`,
      [entityId],
    );

    const relationships = relRows.map((r) => ({
      id: r.id as string,
      relatedEntity: {
        id: r.related_id as string,
        name: r.related_name as string,
        type: r.related_type as string,
        description: r.related_description as string,
      },
      relationshipType: r.relationship_type as string,
      description: r.description as string,
      direction: ((r.from_entity_id as string) === entityId ? 'outgoing' : 'incoming') as 'outgoing' | 'incoming',
    }));

    return { entity, relationships };
  }

  // ── Merge Graphs ────────────────────────────────────────

  async mergeGraphs(userId: string, studySetIds: string[]): Promise<KnowledgeGraph> {
    if (!studySetIds || studySetIds.length < 2) {
      throw new BadRequestException('At least two study set IDs are required for merging');
    }

    // Verify access to all study sets
    for (const id of studySetIds) {
      await this.verifyStudySetAccess(userId, id);
    }

    // Get all entities across the study sets
    const entityRows = await this.db.queryMany<Record<string, unknown>>(
      `SELECT * FROM knowledge_entities
       WHERE user_id = $1 AND study_set_id = ANY($2)
       ORDER BY name`,
      [userId, studySetIds],
    );

    // Merge entities with same name (case-insensitive)
    const mergedMap = new Map<string, GraphNode>();
    const idRemapping = new Map<string, string>(); // old id -> canonical id

    for (const row of entityRows) {
      const key = (row.name as string).toLowerCase();
      const entityId = row.id as string;

      if (mergedMap.has(key)) {
        // Map this duplicate to the canonical entity
        const canonical = mergedMap.get(key)!;
        idRemapping.set(entityId, canonical.id);
      } else {
        const node: GraphNode = {
          id: entityId,
          name: row.name as string,
          type: row.entity_type as string,
          description: row.description as string,
        };
        mergedMap.set(key, node);
        idRemapping.set(entityId, entityId);
      }
    }

    const nodes = Array.from(mergedMap.values());

    // Get all relationships
    const allEntityIds = entityRows.map((e) => e.id as string);
    let relationshipRows: Array<Record<string, unknown>> = [];
    if (allEntityIds.length > 0) {
      relationshipRows = await this.db.queryMany<Record<string, unknown>>(
        `SELECT * FROM knowledge_relationships
         WHERE from_entity_id = ANY($1) OR to_entity_id = ANY($1)`,
        [allEntityIds],
      );
    }

    // Deduplicate edges after remapping
    const edgeSet = new Set<string>();
    const edges: GraphEdge[] = [];

    for (const r of relationshipRows) {
      const source = idRemapping.get(r.from_entity_id as string) || (r.from_entity_id as string);
      const target = idRemapping.get(r.to_entity_id as string) || (r.to_entity_id as string);
      const label = r.relationship_type as string;
      const edgeKey = `${source}|${target}|${label}`;

      if (source === target || edgeSet.has(edgeKey)) {
        continue;
      }

      edgeSet.add(edgeKey);
      edges.push({
        source,
        target,
        label,
        description: r.description as string,
      });
    }

    this.logger.log(
      `Merged graph: ${nodes.length} nodes, ${edges.length} edges across ${studySetIds.length} study sets`,
    );

    return { nodes, edges };
  }

  // ── Private Helpers ─────────────────────────────────────

  private async verifyStudySetAccess(userId: string, studySetId: string): Promise<void> {
    const studySet = await this.db.queryOne<Record<string, unknown>>(
      `SELECT id, user_id FROM study_sets WHERE id = $1`,
      [studySetId],
    );

    if (!studySet) {
      throw new NotFoundException('Study set not found');
    }

    if ((studySet.user_id as string) !== userId) {
      throw new ForbiddenException('Access denied to this study set');
    }
  }

  private async gatherStudySetText(studySetId: string): Promise<string> {
    // Gather text from flashcards
    const flashcards = await this.db.queryMany<Record<string, unknown>>(
      `SELECT front, back FROM flashcards WHERE study_set_id = $1 ORDER BY position`,
      [studySetId],
    );

    // Gather text from study set notes / description
    const studySet = await this.db.queryOne<Record<string, unknown>>(
      `SELECT name, description FROM study_sets WHERE id = $1`,
      [studySetId],
    );

    const parts: string[] = [];

    if (studySet) {
      if (studySet.name) parts.push(`Title: ${studySet.name}`);
      if (studySet.description) parts.push(`Description: ${studySet.description}`);
    }

    for (const card of flashcards) {
      if (card.front) parts.push(`Q: ${card.front}`);
      if (card.back) parts.push(`A: ${card.back}`);
    }

    // Also try documents/notes linked to study set
    const notes = await this.db.queryMany<Record<string, unknown>>(
      `SELECT content FROM study_notes WHERE study_set_id = $1`,
      [studySetId],
    );

    for (const note of notes) {
      if (note.content) parts.push(note.content as string);
    }

    return parts.join('\n\n');
  }

  private async clearEntities(userId: string, studySetId: string): Promise<void> {
    // First clear relationships that reference these entities
    await this.clearRelationships(userId, studySetId);

    await this.db.query(
      `DELETE FROM knowledge_entities WHERE user_id = $1 AND study_set_id = $2`,
      [userId, studySetId],
    );
  }

  private async clearRelationships(userId: string, studySetId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM knowledge_relationships
       WHERE from_entity_id IN (SELECT id FROM knowledge_entities WHERE user_id = $1 AND study_set_id = $2)
          OR to_entity_id IN (SELECT id FROM knowledge_entities WHERE user_id = $1 AND study_set_id = $2)`,
      [userId, studySetId, userId, studySetId],
    );
  }

  private mapEntity(row: Record<string, unknown>): KnowledgeEntity {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      studySetId: row.study_set_id as string,
      name: row.name as string,
      entityType: row.entity_type as string,
      description: row.description as string,
      sourceText: (row.source_text as string) || null,
      createdAt: new Date(row.created_at as string),
    };
  }
}
