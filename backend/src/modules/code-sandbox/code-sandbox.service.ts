import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface ExecutionResult {
  id: string;
  code: string;
  language: string;
  output: string;
  error: string | null;
  executionTime: number;
  memoryUsed: number | null;
  status: 'success' | 'error' | 'timeout';
  createdAt: Date;
}

export interface ExecuteCodeDto {
  code: string;
  language?: string;
  timeout?: number;
  stdin?: string;
}

@Injectable()
export class CodeSandboxService {
  private readonly logger = new Logger(CodeSandboxService.name);
  private readonly sandboxUrl: string;
  private readonly sandboxApiKey: string;
  private readonly defaultTimeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.sandboxUrl = this.configService.get<string>('CODE_SANDBOX_URL', 'http://localhost:8080');
    this.sandboxApiKey = this.configService.get<string>('CODE_SANDBOX_API_KEY', '');
    this.defaultTimeout = this.configService.get<number>('CODE_SANDBOX_TIMEOUT', 30000);
  }

  async execute(userId: string, dto: ExecuteCodeDto): Promise<ExecutionResult> {
    const id = uuidv4();
    const language = dto.language || 'python';
    const timeout = dto.timeout || this.defaultTimeout;
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.sandboxUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sandboxApiKey ? { 'X-API-Key': this.sandboxApiKey } : {}),
        },
        body: JSON.stringify({
          language,
          code: dto.code,
          stdin: dto.stdin || '',
          timeout: timeout / 1000,
        }),
        signal: AbortSignal.timeout(timeout + 5000),
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        const result: ExecutionResult = {
          id,
          code: dto.code,
          language,
          output: '',
          error: `Sandbox error: ${errorText}`,
          executionTime,
          memoryUsed: null,
          status: 'error',
          createdAt: new Date(),
        };
        await this.saveExecution(userId, result);
        return result;
      }

      const data = await response.json();
      const result: ExecutionResult = {
        id,
        code: dto.code,
        language,
        output: data.stdout || '',
        error: data.stderr || null,
        executionTime: data.execution_time_ms || executionTime,
        memoryUsed: data.memory_used_bytes || null,
        status: data.stderr ? 'error' : 'success',
        createdAt: new Date(),
      };

      await this.saveExecution(userId, result);
      this.logger.log(`Code executed: ${id}, status: ${result.status}`);
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const isTimeout = (error as Error).name === 'TimeoutError';

      const result: ExecutionResult = {
        id,
        code: dto.code,
        language,
        output: '',
        error: isTimeout ? 'Execution timed out' : (error as Error).message,
        executionTime,
        memoryUsed: null,
        status: isTimeout ? 'timeout' : 'error',
        createdAt: new Date(),
      };

      await this.saveExecution(userId, result);
      this.logger.warn(`Code execution failed: ${id}, ${result.error}`);
      return result;
    }
  }

  async *executeStream(
    userId: string,
    dto: ExecuteCodeDto,
  ): AsyncGenerator<{ type: 'output' | 'error' | 'done'; data: string }> {
    const language = dto.language || 'python';
    const timeout = dto.timeout || this.defaultTimeout;

    try {
      const response = await fetch(`${this.sandboxUrl}/execute/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sandboxApiKey ? { 'X-API-Key': this.sandboxApiKey } : {}),
        },
        body: JSON.stringify({
          language,
          code: dto.code,
          stdin: dto.stdin || '',
          timeout: timeout / 1000,
        }),
        signal: AbortSignal.timeout(timeout + 5000),
      });

      if (!response.ok) {
        yield { type: 'error', data: `Sandbox error: ${response.status}` };
        yield { type: 'done', data: '' };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { type: 'error', data: 'No response body' };
        yield { type: 'done', data: '' };
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        yield { type: 'output', data: text };
      }

      yield { type: 'done', data: '' };
    } catch (error) {
      yield { type: 'error', data: (error as Error).message };
      yield { type: 'done', data: '' };
    }
  }

  async getHistory(userId: string, limit = 20): Promise<ExecutionResult[]> {
    const results = await this.db.queryMany<ExecutionResult>(
      'SELECT * FROM code_executions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return results.map((r) => this.mapExecution(r));
  }

  async getExecution(id: string, userId: string): Promise<ExecutionResult | null> {
    const result = await this.db.queryOne<ExecutionResult>(
      'SELECT * FROM code_executions WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return result ? this.mapExecution(result) : null;
  }

  private async saveExecution(userId: string, result: ExecutionResult): Promise<void> {
    await this.db.query(
      `INSERT INTO code_executions (id, user_id, code, language, output, error, execution_time, memory_used, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        result.id,
        userId,
        result.code,
        result.language,
        result.output,
        result.error,
        result.executionTime,
        result.memoryUsed,
        result.status,
        result.createdAt,
      ],
    );
  }

  private mapExecution(row: unknown): ExecutionResult {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      code: r.code as string,
      language: r.language as string,
      output: r.output as string,
      error: r.error as string | null,
      executionTime: r.execution_time as number,
      memoryUsed: r.memory_used as number | null,
      status: r.status as ExecutionResult['status'],
      createdAt: new Date(r.created_at as string),
    };
  }
}
