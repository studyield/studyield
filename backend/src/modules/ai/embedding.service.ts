import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmbeddingResult {
  vector: number[];
  tokens: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly embeddingModel: string;
  private readonly vectorDimension: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
    this.embeddingModel = this.configService.get<string>(
      'OPENROUTER_EMBEDDING_MODEL',
      'openai/text-embedding-3-small',
    );
    this.vectorDimension = 1536;
  }

  getVectorDimension(): number {
    return this.vectorDimension;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://studyield.com',
        'X-Title': 'Studyield',
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Embedding failed: ${error}`);
      throw new Error(`Embedding failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      vector: data.data[0].embedding,
      tokens: data.usage?.total_tokens || 0,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://studyield.com',
        'X-Title': 'Studyield',
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Batch embedding failed: ${error}`);
      throw new Error(`Batch embedding failed: ${response.status}`);
    }

    const data = await response.json();
    const tokensPerText = Math.ceil((data.usage?.total_tokens || 0) / texts.length);

    return data.data.map((item: { embedding: number[] }) => ({
      vector: item.embedding,
      tokens: tokensPerText,
    }));
  }

  async embedWithChunking(texts: string[], batchSize = 100): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await this.embedBatch(batch);
      results.push(...batchResults);

      this.logger.debug(
        `Embedded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`,
      );
    }

    return results;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async findMostSimilar(
    query: string,
    candidates: Array<{ id: string; text: string }>,
    topK = 5,
  ): Promise<Array<{ id: string; text: string; similarity: number }>> {
    const queryEmbedding = await this.embed(query);
    const candidateEmbeddings = await this.embedBatch(candidates.map((c) => c.text));

    const results = candidates.map((candidate, index) => ({
      id: candidate.id,
      text: candidate.text,
      similarity: this.cosineSimilarity(queryEmbedding.vector, candidateEmbeddings[index].vector),
    }));

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }
}
