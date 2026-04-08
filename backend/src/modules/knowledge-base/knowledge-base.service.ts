import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { EmbeddingService } from '../ai/embedding.service';
import { QueueService } from '../queue/queue.service';
import { ChunkingService } from './chunking.service';
import { DocumentProcessorService } from './document-processor.service';

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  documentCount: number;
  chunkCount: number;
  status: 'active' | 'processing' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface KBChunk {
  id: string;
  knowledgeBaseId: string;
  documentId: string | null;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateKnowledgeBaseDto {
  name: string;
  description?: string;
}

export interface SearchResult {
  chunkId: string;
  content: string;
  score: number;
  documentId: string | null;
  metadata: Record<string, unknown>;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly collectionName = 'knowledge_base';
  private readonly vectorDimension: number;

  constructor(
    private readonly db: DatabaseService,
    private readonly qdrantService: QdrantService,
    private readonly embeddingService: EmbeddingService,
    private readonly queueService: QueueService,
    private readonly chunkingService: ChunkingService,
    private readonly documentProcessor: DocumentProcessorService,
  ) {
    this.vectorDimension = this.embeddingService.getVectorDimension();
  }

  async onModuleInit() {
    // Wait for Qdrant to initialize (non-blocking if it fails)
    const qdrantReady = await this.qdrantService.waitForInit(5000);
    if (qdrantReady) {
      await this.qdrantService.createCollection(this.collectionName, this.vectorDimension);
    } else {
      this.logger.warn('Qdrant not available - knowledge base vector features will be limited');
    }
  }

  async create(userId: string, dto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<KnowledgeBase>(
      `INSERT INTO knowledge_bases (id, user_id, name, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', $5, $6)
       RETURNING *`,
      [id, userId, dto.name, dto.description || null, now, now],
    );

    this.logger.log(`Knowledge base created: ${id}`);
    return this.mapKnowledgeBase(result!);
  }

  async findById(id: string): Promise<KnowledgeBase | null> {
    const result = await this.db.queryOne<KnowledgeBase>(
      `SELECT kb.*,
        (SELECT COUNT(*) FROM kb_documents WHERE knowledge_base_id = kb.id) as document_count,
        (SELECT COUNT(*) FROM kb_chunks WHERE knowledge_base_id = kb.id) as chunk_count
       FROM knowledge_bases kb WHERE kb.id = $1`,
      [id],
    );
    return result ? this.mapKnowledgeBase(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<KnowledgeBase> {
    const kb = await this.findById(id);
    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }
    if (kb.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return kb;
  }

  async findByUser(userId: string): Promise<KnowledgeBase[]> {
    const results = await this.db.queryMany<KnowledgeBase>(
      `SELECT kb.*,
        (SELECT COUNT(*) FROM kb_documents WHERE knowledge_base_id = kb.id) as document_count,
        (SELECT COUNT(*) FROM kb_chunks WHERE knowledge_base_id = kb.id) as chunk_count
       FROM knowledge_bases kb
       WHERE kb.user_id = $1
       ORDER BY kb.updated_at DESC`,
      [userId],
    );
    return results.map((r) => this.mapKnowledgeBase(r));
  }

  async addDocument(
    knowledgeBaseId: string,
    userId: string,
    documentId: string,
    fileKey: string,
    mimeType: string,
  ): Promise<void> {
    await this.findByIdWithAccess(knowledgeBaseId, userId);

    await this.queueService.addJob('knowledge-base', 'process-document', {
      knowledgeBaseId,
      documentId,
      fileKey,
      mimeType,
    });

    this.logger.log(`Document ${documentId} queued for processing in KB ${knowledgeBaseId}`);
  }

  async processDocument(
    knowledgeBaseId: string,
    documentId: string,
    fileKey: string,
    mimeType: string,
  ): Promise<void> {
    try {
      await this.updateStatus(knowledgeBaseId, 'processing');

      const processed = await this.documentProcessor.processDocument(fileKey, mimeType);
      const cleanedText = this.documentProcessor.cleanText(processed.text);
      const chunks = this.chunkingService.chunk(cleanedText);

      const chunkIds: string[] = [];
      for (const chunk of chunks) {
        const chunkId = uuidv4();
        chunkIds.push(chunkId);

        await this.db.query(
          `INSERT INTO kb_chunks (id, knowledge_base_id, document_id, content, chunk_index, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            chunkId,
            knowledgeBaseId,
            documentId,
            chunk.content,
            chunk.index,
            JSON.stringify({
              startOffset: chunk.startOffset,
              endOffset: chunk.endOffset,
            }),
            new Date(),
          ],
        );
      }

      const embeddings = await this.embeddingService.embedWithChunking(
        chunks.map((c) => c.content),
      );

      const points = chunkIds.map((id, index) => ({
        id,
        vector: embeddings[index].vector,
        payload: {
          knowledgeBaseId,
          documentId,
          chunkIndex: chunks[index].index,
        },
      }));

      await this.qdrantService.upsertBatch(this.collectionName, points);

      await this.updateStatus(knowledgeBaseId, 'active');
      this.logger.log(`Document ${documentId} processed: ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Failed to process document ${documentId}`, error);
      await this.updateStatus(knowledgeBaseId, 'error');
      throw error;
    }
  }

  async addText(
    knowledgeBaseId: string,
    userId: string,
    text: string,
    metadata?: Record<string, unknown>,
  ): Promise<number> {
    await this.findByIdWithAccess(knowledgeBaseId, userId);

    const cleanedText = this.documentProcessor.cleanText(text);
    const chunks = this.chunkingService.chunk(cleanedText);

    const chunkIds: string[] = [];
    for (const chunk of chunks) {
      const chunkId = uuidv4();
      chunkIds.push(chunkId);

      await this.db.query(
        `INSERT INTO kb_chunks (id, knowledge_base_id, document_id, content, chunk_index, metadata, created_at)
         VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
        [
          chunkId,
          knowledgeBaseId,
          chunk.content,
          chunk.index,
          JSON.stringify({
            ...metadata,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
          }),
          new Date(),
        ],
      );
    }

    const embeddings = await this.embeddingService.embedWithChunking(chunks.map((c) => c.content));

    const points = chunkIds.map((id, index) => ({
      id,
      vector: embeddings[index].vector,
      payload: {
        knowledgeBaseId,
        chunkIndex: chunks[index].index,
        ...metadata,
      },
    }));

    await this.qdrantService.upsertBatch(this.collectionName, points);

    this.logger.log(`Added ${chunks.length} text chunks to KB ${knowledgeBaseId}`);
    return chunks.length;
  }

  async search(
    knowledgeBaseId: string,
    userId: string,
    query: string,
    limit = 5,
  ): Promise<SearchResult[]> {
    await this.findByIdWithAccess(knowledgeBaseId, userId);

    const queryEmbedding = await this.embeddingService.embed(query);

    const results = await this.qdrantService.searchWithPayloadFilter(
      this.collectionName,
      queryEmbedding.vector,
      limit,
      [{ key: 'knowledgeBaseId', match: { value: knowledgeBaseId } }],
    );

    const chunkIds = results.map((r) => r.id);
    if (chunkIds.length === 0) {
      return [];
    }

    const chunks = await this.db.queryMany<KBChunk>(`SELECT * FROM kb_chunks WHERE id = ANY($1)`, [
      chunkIds,
    ]);

    const chunkMap = new Map(chunks.map((c) => [c.id, c]));

    return results.map((r) => {
      const chunk = chunkMap.get(r.id);
      return {
        chunkId: r.id,
        content: chunk?.content || '',
        score: r.score,
        documentId: chunk?.documentId || null,
        metadata: r.payload || {},
      };
    });
  }

  async searchMultiple(
    knowledgeBaseIds: string[],
    userId: string,
    query: string,
    limit = 5,
  ): Promise<SearchResult[]> {
    for (const id of knowledgeBaseIds) {
      await this.findByIdWithAccess(id, userId);
    }

    const queryEmbedding = await this.embeddingService.embed(query);

    const allResults: SearchResult[] = [];

    for (const kbId of knowledgeBaseIds) {
      const results = await this.qdrantService.searchWithPayloadFilter(
        this.collectionName,
        queryEmbedding.vector,
        limit,
        [{ key: 'knowledgeBaseId', match: { value: kbId } }],
      );

      const chunkIds = results.map((r) => r.id);
      if (chunkIds.length > 0) {
        const chunks = await this.db.queryMany<KBChunk>(
          `SELECT * FROM kb_chunks WHERE id = ANY($1)`,
          [chunkIds],
        );

        const chunkMap = new Map(chunks.map((c) => [c.id, c]));

        for (const r of results) {
          const chunk = chunkMap.get(r.id);
          allResults.push({
            chunkId: r.id,
            content: chunk?.content || '',
            score: r.score,
            documentId: chunk?.documentId || null,
            metadata: { ...r.payload, knowledgeBaseId: kbId },
          });
        }
      }
    }

    return allResults.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findByIdWithAccess(id, userId);

    await this.qdrantService.deleteByFilter(this.collectionName, {
      must: [{ key: 'knowledgeBaseId', match: { value: id } }],
    });

    await this.db.query('DELETE FROM kb_chunks WHERE knowledge_base_id = $1', [id]);
    await this.db.query('DELETE FROM knowledge_bases WHERE id = $1', [id]);

    this.logger.log(`Knowledge base deleted: ${id}`);
  }

  private async updateStatus(id: string, status: 'active' | 'processing' | 'error'): Promise<void> {
    await this.db.query('UPDATE knowledge_bases SET status = $1, updated_at = $2 WHERE id = $3', [
      status,
      new Date(),
      id,
    ]);
  }

  private mapKnowledgeBase(row: unknown): KnowledgeBase {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      name: r.name as string,
      description: r.description as string | null,
      documentCount: parseInt(String(r.document_count || 0), 10),
      chunkCount: parseInt(String(r.chunk_count || 0), 10),
      status: r.status as KnowledgeBase['status'],
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
