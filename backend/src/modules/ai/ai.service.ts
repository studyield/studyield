/**
 * AI Service
 *
 * Supports multiple AI providers via the OpenAI SDK:
 * - OpenRouter: unified cloud gateway for all models (default)
 * - Ollama: local/offline LLM for privacy-sensitive deployments
 * - OpenAI: direct OpenAI API access
 *
 * Set AI_PROVIDER env var to choose the provider.
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';

// AI provider type
type AiProvider = 'openrouter' | 'ollama' | 'openai';

// Default models per provider
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_VISION_MODEL = 'openai/gpt-4o';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TranscriptionResponse {
  text: string;
  duration?: number;
  language?: string;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  // Active AI provider
  private provider: AiProvider = 'openrouter';

  // OpenRouter client (PRIMARY gateway for all models)
  private openRouterClient: OpenAI | null = null;

  // Direct OpenAI client (fallback only)
  private openaiClient: OpenAI | null = null;

  // Ollama client (local/offline)
  private ollamaClient: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {}

  async onModuleInit() {
    await this.initializeClients();
  }

  private async initializeClients() {
    // Determine the active provider (default: openrouter for backward compat)
    this.provider = (
      this.configService.get<string>('AI_PROVIDER', 'openrouter') as AiProvider
    );

    // Initialize Ollama (local LLM)
    if (this.provider === 'ollama') {
      const ollamaBaseUrl = this.configService.get<string>(
        'OLLAMA_BASE_URL',
        'http://localhost:11434/v1',
      );
      this.ollamaClient = new OpenAI({
        apiKey: 'ollama', // Ollama doesn't need a key, but the SDK requires a non-empty string
        baseURL: ollamaBaseUrl,
        timeout: 120000,
      });
      this.logger.log(`Ollama client initialized (${ollamaBaseUrl})`);
    }

    // Initialize OpenRouter (PRIMARY gateway for all models)
    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');

    if (openRouterKey && !openRouterKey.includes('your-')) {
      this.openRouterClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189'),
          'X-Title': 'Studyield',
        },
        timeout: 120000,
      });
      this.logger.log('OpenRouter client initialized (unified gateway for all models)');
    }

    // Initialize direct OpenAI (FALLBACK only for OpenAI models)
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey && !openaiKey.includes('your-')) {
      this.openaiClient = new OpenAI({
        apiKey: openaiKey,
        timeout: 120000,
      });
      this.logger.log('OpenAI direct client initialized (fallback)');
    }

    // Log status
    if (!this.ollamaClient && !this.openRouterClient && !this.openaiClient) {
      this.logger.warn(
        'No AI clients available! Set AI_PROVIDER and the corresponding config in .env',
      );
    }
  }

  private getClient(): OpenAI {
    // Use the configured provider first
    if (this.provider === 'ollama' && this.ollamaClient) {
      return this.ollamaClient;
    }

    if (this.provider === 'openai' && this.openaiClient) {
      return this.openaiClient;
    }

    // Primary: Use OpenRouter for everything (unified gateway)
    if (this.openRouterClient) {
      return this.openRouterClient;
    }

    // Fallback: Direct OpenAI
    if (this.openaiClient) {
      return this.openaiClient;
    }

    throw new BadRequestException(
      'No AI API key configured. Set AI_PROVIDER and the corresponding config in .env file.',
    );
  }

  private getModel(type: 'text' | 'vision' = 'text'): string {
    // Ollama uses its own model names
    if (this.provider === 'ollama') {
      // Ollama vision models: use the same model (most Ollama models handle both)
      return this.configService.get<string>('OLLAMA_MODEL', DEFAULT_OLLAMA_MODEL);
    }

    // When using OpenRouter, use provider/model format
    if (this.provider === 'openrouter' && this.openRouterClient) {
      return type === 'vision'
        ? this.configService.get('OPENROUTER_VISION_MODEL', DEFAULT_VISION_MODEL)
        : this.configService.get('OPENROUTER_DEFAULT_MODEL', DEFAULT_MODEL);
    }

    // Direct OpenAI - use model name without provider prefix
    return type === 'vision'
      ? this.configService.get('OPENAI_VISION_MODEL', 'gpt-4o')
      : this.configService.get('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async complete(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<CompletionResponse> {
    const client = this.getClient();
    // When using Ollama, always use the configured Ollama model
    // (ignore OpenRouter-style model names like "openai/gpt-4o")
    const model =
      this.provider === 'ollama'
        ? this.getModel('text')
        : options.model || this.getModel('text');

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 1,
        ...(options.responseFormat && { response_format: options.responseFormat }),
      });

      const choice = response.choices[0];

      return {
        content: choice.message.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`AI completion failed: ${err.message}`);

      // Try fallback to direct OpenAI if OpenRouter fails (not applicable for Ollama)
      if (this.provider !== 'ollama' && this.openRouterClient && this.openaiClient) {
        this.logger.warn('Attempting fallback to direct OpenAI...');
        return this.completeFallback(messages, options);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`AI completion failed: ${errorMessage}`);
    }
  }

  private async completeFallback(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<CompletionResponse> {
    if (!this.openaiClient) {
      throw new BadRequestException('No fallback client available');
    }

    const model = options.model?.replace(/^[^/]+\//, '') || 'gpt-4o-mini';

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 1,
      ...(options.responseFormat && { response_format: options.responseFormat }),
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async generateWithVision(params: {
    prompt: string;
    imageData: string;
    mimeType: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const client = this.getClient();
      const model = this.getModel('vision');

      // Ollama multimodal models support vision via the same API
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: params.prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${params.mimeType};base64,${params.imageData}`,
                },
              },
            ],
          },
        ],
        temperature: params.temperature ?? 0.3, // Low temperature for accuracy
        max_tokens: params.maxTokens ?? 1000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Vision generation failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Vision AI failed: ${errorMessage}`);
    }
  }

  async completeJson<T>(messages: ChatMessage[], options: CompletionOptions = {}): Promise<T> {
    const response = await this.complete(messages, {
      ...options,
      responseFormat: { type: 'json_object' },
    });

    try {
      // Clean up response if it has markdown code blocks
      let content = response.content.trim();
      if (content.startsWith('```json')) content = content.slice(7);
      else if (content.startsWith('```')) content = content.slice(3);
      if (content.endsWith('```')) content = content.slice(0, -3);

      return JSON.parse(content.trim()) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON response: ${response.content}`);
      throw new BadRequestException('Failed to parse AI response as JSON');
    }
  }

  async *streamComplete(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): AsyncGenerator<{ content: string; done: boolean }> {
    const client = this.getClient();
    const model =
      this.provider === 'ollama'
        ? this.getModel('text')
        : options.model || this.getModel('text');

    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { content, done };
    }
  }

  buildSystemPrompt(template: string, variables: Record<string, string>): string {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return prompt;
  }

  async generateWithRetry(
    messages: ChatMessage[],
    options: CompletionOptions = {},
    maxRetries = 3,
  ): Promise<CompletionResponse> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.complete(messages, options);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`AI completion attempt ${i + 1} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw lastError;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * Note: Whisper requires direct OpenAI client (not available via OpenRouter)
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<TranscriptionResponse> {
    if (!this.openaiClient) {
      throw new BadRequestException(
        'Audio transcription requires OpenAI API key. Set OPENAI_API_KEY in .env file.',
      );
    }

    try {
      // Use OpenAI SDK's toFile helper which handles Buffer properly
      const file = await OpenAI.toFile(audioBuffer, filename, { type: mimeType });

      const response = await this.openaiClient.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      return {
        text: response.text,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        duration: (response as any).duration,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        language: (response as any).language,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Audio transcription failed: ${err.message}`);
      throw new BadRequestException(`Audio transcription failed: ${err.message}`);
    }
  }

  isAvailable(): boolean {
    return this.ollamaClient !== null || this.openRouterClient !== null || this.openaiClient !== null;
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.ollamaClient) {
      providers.push('ollama');
    }
    if (this.openRouterClient) {
      providers.push('openrouter', 'openai', 'anthropic', 'google', 'deepseek');
    } else if (this.openaiClient) {
      providers.push('openai');
    }
    return providers;
  }

  // ═══════════════════════════════════════════
  // Mind Map History
  // ═══════════════════════════════════════════

  async saveMindMapToHistory(params: {
    userId: string;
    title: string;
    content: string;
    mindMapData: unknown;
    studySetId?: string;
    noteId?: string;
  }) {
    const id = uuidv4();

    await this.db.query(
      `INSERT INTO mind_maps (id, user_id, study_set_id, note_id, title, content_snapshot, mind_map_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        id,
        params.userId,
        params.studySetId || null,
        params.noteId || null,
        params.title,
        params.content,
        JSON.stringify(params.mindMapData),
      ],
    );

    this.logger.log(`Mind map saved to history: ${id}`);
    return { id };
  }

  async getMindMapHistory(userId: string) {
    const results = await this.db.queryMany(
      `SELECT id, title, study_set_id, note_id, created_at
       FROM mind_maps
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    return results.map((r) => ({
      id: (r as { id: string }).id,
      title: (r as { title: string }).title,
      studySetId: (r as { study_set_id: string | null }).study_set_id,
      noteId: (r as { note_id: string | null }).note_id,
      createdAt: (r as { created_at: Date }).created_at,
    }));
  }

  async getMindMapById(id: string, userId: string) {
    const result = await this.db.queryOne(`SELECT * FROM mind_maps WHERE id = $1`, [id]);

    if (!result) {
      throw new NotFoundException('Mind map not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = result as any;
    if (r.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: r.id,
      title: r.title,
      contentSnapshot: r.content_snapshot,
      mindMapData:
        typeof r.mind_map_data === 'string' ? JSON.parse(r.mind_map_data) : r.mind_map_data,
      studySetId: r.study_set_id,
      noteId: r.note_id,
      createdAt: r.created_at,
    };
  }

  async deleteMindMap(id: string, userId: string) {
    const result = await this.db.queryOne(
      `DELETE FROM mind_maps WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId],
    );

    if (!result) {
      throw new NotFoundException('Mind map not found or access denied');
    }

    this.logger.log(`Mind map deleted: ${id}`);
  }
}
