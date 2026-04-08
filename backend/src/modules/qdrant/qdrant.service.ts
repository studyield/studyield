import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}

export interface CollectionInfo {
  name: string;
  vectorSize: number;
  pointsCount: number;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private hostConfigured = false;
  private collectionPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.hostConfigured = !!this.configService.get<string>('QDRANT_HOST');
    this.collectionPrefix = this.configService.get<string>('QDRANT_COLLECTION_PREFIX', 'studyield');
  }

  async onModuleInit() {
    // Initialize Qdrant in background to not block app startup
    this.initializeQdrantAsync();
  }

  private initializeQdrantAsync(): void {
    if (!this.hostConfigured) {
      this.logger.warn('QDRANT_HOST not configured - Qdrant features disabled');
      return;
    }

    this.initPromise = this.initializeQdrant().catch((error) => {
      this.logger.error('Qdrant initialization failed:', error.message);
    });
  }

  private async initializeQdrant(): Promise<void> {
    const host = this.configService.get<string>('QDRANT_HOST', 'localhost');
    const port = this.configService.get<number>('QDRANT_PORT', 6333);
    const apiKey = this.configService.get<string>('QDRANT_API_KEY');

    let url: string;
    if (host.startsWith('http://') || host.startsWith('https://')) {
      url = port === 6333 ? host : `${host}:${port}`;
    } else {
      url = `http://${host}:${port}`;
    }

    this.logger.log(`Connecting to Qdrant at ${url}...`);

    const clientConfig: Record<string, unknown> = {
      url,
      checkCompatibility: false,
      timeout: 5000,
    };

    if (apiKey) {
      clientConfig.apiKey = apiKey;
    }

    this.client = new QdrantClient(clientConfig as ConstructorParameters<typeof QdrantClient>[0]);

    // Validate connection
    const collections = await this.client.getCollections();
    this.initialized = true;
    this.logger.log(`Qdrant connected. Found ${collections.collections.length} collections`);
  }

  isConfigured(): boolean {
    return this.initialized && this.client !== null;
  }

  async waitForInit(timeoutMs = 10000): Promise<boolean> {
    if (!this.hostConfigured) {
      return false;
    }

    if (this.initialized) {
      return true;
    }

    if (this.initPromise) {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
      await Promise.race([this.initPromise, timeout]);
    }

    return this.initialized;
  }

  private getCollectionName(name: string): string {
    return `${this.collectionPrefix}_${name}`;
  }

  async createCollection(name: string, vectorSize: number): Promise<void> {
    if (!this.client) {
      this.logger.warn(`Qdrant not available - skipping collection creation for ${name}`);
      return;
    }

    const collectionName = this.getCollectionName(name);
    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      this.logger.log(`Collection ${collectionName} created`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        this.logger.debug(`Collection ${collectionName} already exists`);
      } else {
        throw error;
      }
    }
  }

  async deleteCollection(name: string): Promise<void> {
    if (!this.client) return;

    const collectionName = this.getCollectionName(name);
    try {
      await this.client.deleteCollection(collectionName);
      this.logger.log(`Collection ${collectionName} deleted`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('not found')) {
        throw error;
      }
    }
  }

  async upsertPoints(collectionName: string, points: VectorPoint[]): Promise<void> {
    if (!this.client) {
      this.logger.warn('Qdrant not available - skipping upsert');
      return;
    }

    const fullName = this.getCollectionName(collectionName);
    await this.client.upsert(fullName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  }

  async deletePoints(collectionName: string, ids: string[]): Promise<void> {
    if (!this.client) return;

    const fullName = this.getCollectionName(collectionName);
    await this.client.delete(fullName, {
      wait: true,
      points: ids,
    });
  }

  async search(
    collectionName: string,
    vector: number[],
    limit = 10,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    if (!this.client) {
      this.logger.warn('Qdrant not available - returning empty search results');
      return [];
    }

    const fullName = this.getCollectionName(collectionName);
    const results = await this.client.search(fullName, {
      vector,
      limit,
      with_payload: true,
      filter: filter as Parameters<typeof this.client.search>[1]['filter'],
    });

    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload as Record<string, unknown>,
    }));
  }

  async getPoint(collectionName: string, id: string): Promise<VectorPoint | null> {
    if (!this.client) return null;

    const fullName = this.getCollectionName(collectionName);
    try {
      const results = await this.client.retrieve(fullName, {
        ids: [id],
        with_payload: true,
        with_vector: true,
      });

      if (results.length === 0) return null;

      const point = results[0];
      return {
        id: String(point.id),
        vector: point.vector as number[],
        payload: point.payload as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  async getCollectionInfo(name: string): Promise<CollectionInfo | null> {
    if (!this.client) return null;

    const collectionName = this.getCollectionName(name);
    try {
      const info = await this.client.getCollection(collectionName);
      const vectors = info.config.params.vectors;
      let vectorSize = 0;
      if (typeof vectors === 'object' && vectors !== null && 'size' in vectors) {
        vectorSize = (vectors as { size: number }).size;
      }
      return {
        name: collectionName,
        vectorSize,
        pointsCount: info.points_count || 0,
      };
    } catch {
      return null;
    }
  }

  async upsertBatch(collectionName: string, points: VectorPoint[]): Promise<void> {
    if (!this.client) {
      this.logger.warn('Qdrant not available - skipping batch upsert');
      return;
    }

    const fullName = this.getCollectionName(collectionName);
    await this.client.upsert(fullName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  }

  async searchWithPayloadFilter(
    collectionName: string,
    vector: number[],
    limit: number,
    filter: Array<{ key: string; match: { value: string } }>,
  ): Promise<SearchResult[]> {
    if (!this.client) {
      this.logger.warn('Qdrant not available - returning empty search results');
      return [];
    }

    const fullName = this.getCollectionName(collectionName);
    const qdrantFilter = {
      must: filter.map((f) => ({
        key: f.key,
        match: f.match,
      })),
    };

    const results = await this.client.search(fullName, {
      vector,
      limit,
      with_payload: true,
      filter: qdrantFilter as Parameters<typeof this.client.search>[1]['filter'],
    });

    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload as Record<string, unknown>,
    }));
  }

  async deleteByFilter(collectionName: string, filter: Record<string, unknown>): Promise<void> {
    if (!this.client) {
      this.logger.warn('Qdrant not available - skipping delete');
      return;
    }

    const fullName = this.getCollectionName(collectionName);
    await this.client.delete(fullName, {
      wait: true,
      filter: filter as unknown as Parameters<typeof this.client.delete>[1] extends {
        filter?: infer F;
      }
        ? F
        : never,
    });
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}
