import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { WebSearchService } from './web-search.service';
import { ResearchGateway } from './research.gateway';

export interface ResearchSession {
  id: string;
  userId: string;
  query: string;
  knowledgeBaseIds: string[];
  status: 'pending' | 'planning' | 'researching' | 'synthesizing' | 'completed' | 'failed';
  sources: ResearchSource[];
  synthesis: string | null;
  outline: ResearchOutline | null;
  depth: 'quick' | 'standard' | 'comprehensive';
  settings: ResearchSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResearchSource {
  type: 'knowledge_base' | 'web';
  title: string;
  url?: string;
  content: string;
  relevanceScore: number;
}

export interface ResearchOutline {
  title: string;
  executiveSummary: string;
  sections: Array<{
    heading: string;
    content: string;
    keyPoints: string[];
    sources: number[];
  }>;
}

export interface ResearchSettings {
  sourceTypes?: string[];
  outputFormat?: 'detailed' | 'summary' | 'bullets';
  includeWebSearch?: boolean;
}

export interface CreateResearchDto {
  query: string;
  knowledgeBaseIds?: string[];
  depth?: 'quick' | 'standard' | 'comprehensive';
  sourceTypes?: string[];
  outputFormat?: 'detailed' | 'summary' | 'bullets';
}

const DEPTH_CONFIG = {
  quick: { maxSources: 3, maxTokens: 4096 },
  standard: { maxSources: 5, maxTokens: 8192 },
  comprehensive: { maxSources: 10, maxTokens: 16384 },
};

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
    private readonly kbService: KnowledgeBaseService,
    private readonly webSearchService: WebSearchService,
    private readonly gateway: ResearchGateway,
  ) {}

  async create(userId: string, dto: CreateResearchDto): Promise<ResearchSession> {
    const id = uuidv4();
    const now = new Date();
    const depth = dto.depth || 'standard';
    const settings: ResearchSettings = {
      sourceTypes: dto.sourceTypes || ['web'],
      outputFormat: dto.outputFormat || 'detailed',
      includeWebSearch: dto.sourceTypes ? dto.sourceTypes.includes('web') : true,
    };

    const result = await this.db.queryOne<ResearchSession>(
      `INSERT INTO research_sessions (id, user_id, query, knowledge_base_ids, status, sources, depth, settings, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        userId,
        dto.query,
        JSON.stringify(dto.knowledgeBaseIds || []),
        JSON.stringify([]),
        depth,
        JSON.stringify(settings),
        now,
        now,
      ],
    );

    this.logger.log(`Research session created: ${id}`);
    return this.mapSession(result!);
  }

  async research(
    sessionId: string,
    userId: string,
    includeWebSearch = true,
  ): Promise<ResearchSession> {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const sources: ResearchSource[] = [];
    const depthCfg = DEPTH_CONFIG[session.depth] || DEPTH_CONFIG.standard;
    const webEnabled = includeWebSearch && session.settings.includeWebSearch !== false;

    try {
      // ── Phase 1: Planning ─────────────────────────
      await this.updateStatus(sessionId, 'planning');
      this.gateway.notifyProgress(sessionId, {
        stage: 'planning',
        percentage: 10,
        message: 'Generating research plan and subtopics...',
      });

      const planResult = await this.aiService.completeJson<{
        subtopics: string[];
        searchQueries: string[];
      }>(
        [
          {
            role: 'system',
            content:
              'You are a research planning agent. Analyze the query and produce subtopics and search queries.',
          },
          {
            role: 'user',
            content: `Research query: "${session.query}"\nDepth: ${session.depth}\nGenerate a research plan.\n\nReturn JSON: { "subtopics": ["..."], "searchQueries": ["..."] }`,
          },
        ],
        { maxTokens: 1024 },
      );

      this.gateway.notifyProgress(sessionId, {
        stage: 'planning',
        percentage: 25,
        message: `Identified ${planResult.subtopics.length} subtopics to research`,
      });

      // ── Phase 2: Researching ──────────────────────
      await this.updateStatus(sessionId, 'researching');
      this.gateway.notifyProgress(sessionId, {
        stage: 'researching',
        percentage: 30,
        message: 'Searching knowledge base and web sources...',
      });

      // Search knowledge base
      if (session.knowledgeBaseIds.length > 0) {
        const kbResults = await this.kbService.searchMultiple(
          session.knowledgeBaseIds,
          userId,
          session.query,
          depthCfg.maxSources,
        );
        for (const r of kbResults) {
          sources.push({
            type: 'knowledge_base',
            title: 'Study Material',
            content: r.content,
            relevanceScore: r.score,
          });
        }
      }

      this.gateway.notifyProgress(sessionId, {
        stage: 'researching',
        percentage: 50,
        message: `Found ${sources.length} knowledge base results. Searching web...`,
      });

      // Web search with multiple queries
      if (webEnabled) {
        const queries = planResult.searchQueries?.length
          ? planResult.searchQueries.slice(0, Math.ceil(depthCfg.maxSources / 2))
          : [session.query];

        for (const q of queries) {
          const webResults = await this.webSearchService.search(
            q,
            Math.ceil(depthCfg.maxSources / queries.length),
          );
          for (const r of webResults) {
            sources.push({
              type: 'web',
              title: r.title,
              url: r.url,
              content: r.snippet,
              relevanceScore: 0.7,
            });
          }
        }
      }

      // Deduplicate and limit sources
      const uniqueSources = sources.slice(0, depthCfg.maxSources);

      await this.db.query(
        `UPDATE research_sessions SET sources = $1, updated_at = $2 WHERE id = $3`,
        [JSON.stringify(uniqueSources), new Date(), sessionId],
      );

      this.gateway.notifyProgress(sessionId, {
        stage: 'researching',
        percentage: 70,
        message: `Collected ${uniqueSources.length} sources total`,
      });

      // ── Phase 3: Reporting (Synthesis) ────────────
      await this.updateStatus(sessionId, 'synthesizing');
      this.gateway.notifyProgress(sessionId, {
        stage: 'reporting',
        percentage: 75,
        message: 'Synthesizing findings into structured report...',
      });

      const sourcesContext = uniqueSources
        .map((s, i) => `[${i + 1}] ${s.title}${s.url ? ` (${s.url})` : ''}: ${s.content}`)
        .join('\n\n');

      const formatInstruction =
        session.settings.outputFormat === 'bullets'
          ? 'Use bullet points for each section.'
          : session.settings.outputFormat === 'summary'
            ? 'Keep it concise as a summary.'
            : 'Provide detailed analysis for each section.';

      const synthesisPrompt = `Research Query: ${session.query}

Subtopics identified: ${planResult.subtopics.join(', ')}

Sources:
${sourcesContext}

Create a comprehensive research report that:
1. Starts with an executive summary
2. Has structured sections with headings for each major finding/subtopic
3. Each section includes detailed content paragraphs with inline citations [1], [2], etc.
4. Identifies key themes and findings
5. Notes any conflicting information
6. Provides actionable insights and conclusions
${formatInstruction}

Return in JSON format:
{
  "synthesis": "The full report text with citations and markdown formatting...",
  "outline": {
    "title": "Report Title",
    "executiveSummary": "Brief summary of key findings...",
    "sections": [
      { "heading": "Section Title", "content": "Detailed section content with [1] citations...", "keyPoints": ["key point 1", "key point 2"], "sources": [1, 2] }
    ]
  }
}`;

      let result: { synthesis: string; outline: ResearchOutline };
      try {
        result = await this.aiService.completeJson<{ synthesis: string; outline: ResearchOutline }>(
          [
            {
              role: 'system',
              content:
                'You are an expert research synthesizer and report writer. Produce well-structured, citation-rich reports.',
            },
            { role: 'user', content: synthesisPrompt },
          ],
          { maxTokens: depthCfg.maxTokens },
        );
      } catch (synthError) {
        this.logger.warn(`Synthesis JSON parse failed, retrying with higher token limit...`);
        // Retry with higher token limit in case response was truncated
        result = await this.aiService.completeJson<{ synthesis: string; outline: ResearchOutline }>(
          [
            {
              role: 'system',
              content:
                'You are an expert research synthesizer. Return ONLY valid JSON. Keep the response concise.',
            },
            { role: 'user', content: synthesisPrompt },
          ],
          { maxTokens: Math.min(depthCfg.maxTokens * 2, 16384) },
        );
      }

      this.gateway.notifyProgress(sessionId, {
        stage: 'reporting',
        percentage: 95,
        message: 'Finalizing report...',
      });

      await this.db.query(
        `UPDATE research_sessions SET synthesis = $1, outline = $2, status = 'completed', updated_at = $3 WHERE id = $4`,
        [result.synthesis, JSON.stringify(result.outline), new Date(), sessionId],
      );

      this.gateway.notifyProgress(sessionId, {
        stage: 'completed',
        percentage: 100,
        message: 'Research complete!',
      });

      const completed = await this.findById(sessionId);
      this.gateway.notifyComplete(sessionId, completed);

      this.logger.log(`Research completed: ${sessionId}`);
      return completed as ResearchSession;
    } catch (error) {
      this.logger.error(`Research failed: ${sessionId}`, error);
      await this.updateStatus(sessionId, 'failed');
      this.gateway.notifyProgress(sessionId, {
        stage: 'failed',
        percentage: 0,
        message: 'Research failed. Please try again.',
      });
      throw error;
    }
  }

  async findById(id: string): Promise<ResearchSession | null> {
    const result = await this.db.queryOne<ResearchSession>(
      'SELECT * FROM research_sessions WHERE id = $1',
      [id],
    );
    return result ? this.mapSession(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<ResearchSession> {
    const session = await this.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');
    return session;
  }

  async findByUser(userId: string): Promise<ResearchSession[]> {
    const results = await this.db.queryMany<ResearchSession>(
      'SELECT * FROM research_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return results.map((r) => this.mapSession(r));
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findByIdWithAccess(id, userId);
    await this.db.query('DELETE FROM research_sessions WHERE id = $1', [id]);
  }

  private async updateStatus(id: string, status: ResearchSession['status']): Promise<void> {
    await this.db.query('UPDATE research_sessions SET status = $1, updated_at = $2 WHERE id = $3', [
      status,
      new Date(),
      id,
    ]);
  }

  private mapSession(row: unknown): ResearchSession {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      query: r.query as string,
      knowledgeBaseIds:
        typeof r.knowledge_base_ids === 'string'
          ? JSON.parse(r.knowledge_base_ids)
          : (r.knowledge_base_ids as string[]) || [],
      status: r.status as ResearchSession['status'],
      sources:
        typeof r.sources === 'string'
          ? JSON.parse(r.sources)
          : (r.sources as ResearchSource[]) || [],
      synthesis: r.synthesis as string | null,
      outline: r.outline
        ? typeof r.outline === 'string'
          ? JSON.parse(r.outline)
          : (r.outline as ResearchOutline)
        : null,
      depth: (r.depth as ResearchSession['depth']) || 'standard',
      settings: r.settings
        ? typeof r.settings === 'string'
          ? JSON.parse(r.settings)
          : (r.settings as ResearchSettings)
        : {},
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
