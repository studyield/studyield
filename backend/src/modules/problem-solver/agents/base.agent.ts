import { Injectable, Logger } from '@nestjs/common';
import { AiService, ChatMessage } from '../../ai/ai.service';

export interface AgentContext {
  problem: string;
  subject?: string;
  previousSteps?: AgentStep[];
  additionalContext?: string;
}

export interface AgentStep {
  agent: string;
  input: string;
  output: string;
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

export interface AgentResult {
  output: string;
  confidence: number;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export abstract class BaseAgent {
  protected abstract readonly agentName: string;
  protected abstract readonly systemPrompt: string;
  protected readonly logger: Logger;

  constructor(protected readonly aiService: AiService) {
    this.logger = new Logger(this.constructor.name);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const messages = this.buildMessages(context);

    const response = await this.aiService.completeJson<{
      output: string;
      confidence: number;
      reasoning: string;
      metadata?: Record<string, unknown>;
    }>(messages, { maxTokens: 4096 });

    this.logger.debug(`${this.agentName} completed with confidence: ${response.confidence}`);

    return {
      output: response.output,
      confidence: response.confidence,
      reasoning: response.reasoning,
      metadata: response.metadata,
    };
  }

  async *executeStream(
    context: AgentContext,
  ): AsyncGenerator<{ type: 'chunk' | 'result'; data: unknown }> {
    const messages = this.buildMessages(context);

    let fullContent = '';

    for await (const chunk of this.aiService.streamComplete(messages, { maxTokens: 4096 })) {
      if (chunk.done) break;
      fullContent += chunk.content;
      yield { type: 'chunk', data: chunk.content };
    }

    try {
      const parsed = JSON.parse(fullContent);
      yield {
        type: 'result',
        data: {
          output: parsed.output,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          metadata: parsed.metadata,
        },
      };
    } catch {
      yield {
        type: 'result',
        data: {
          output: fullContent,
          confidence: 0.5,
          reasoning: 'Response parsing failed',
        },
      };
    }
  }

  /**
   * Detect the script/language of text using Unicode code point ranges.
   */
  protected detectLanguage(text: string): string {
    const counts: Record<string, number> = {
      bengali: 0,
      devanagari: 0,
      latin: 0,
      arabic: 0,
      tamil: 0,
      telugu: 0,
      gujarati: 0,
      gurmukhi: 0,
    };

    for (const char of text) {
      const code = char.codePointAt(0)!;
      if (code >= 0x0980 && code <= 0x09ff) counts.bengali++;
      else if (code >= 0x0900 && code <= 0x097f) counts.devanagari++;
      else if (code >= 0x0600 && code <= 0x06ff) counts.arabic++;
      else if (code >= 0x0b80 && code <= 0x0bff) counts.tamil++;
      else if (code >= 0x0c00 && code <= 0x0c7f) counts.telugu++;
      else if (code >= 0x0a80 && code <= 0x0aff) counts.gujarati++;
      else if (code >= 0x0a00 && code <= 0x0a7f) counts.gurmukhi++;
      else if ((code >= 0x0041 && code <= 0x007a) || (code >= 0x00c0 && code <= 0x024f))
        counts.latin++;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return 'English';

    const langMap: Record<string, string> = {
      bengali: 'Bengali (Bangla)',
      devanagari: 'Hindi',
      latin: 'English',
      arabic: 'Arabic',
      tamil: 'Tamil',
      telugu: 'Telugu',
      gujarati: 'Gujarati',
      gurmukhi: 'Punjabi',
    };

    return langMap[sorted[0][0]] || 'English';
  }

  protected buildMessages(context: AgentContext): ChatMessage[] {
    const detectedLang = this.detectLanguage(context.problem);

    const messages: ChatMessage[] = [{ role: 'system', content: this.systemPrompt }];

    if (context.previousSteps && context.previousSteps.length > 0) {
      const stepsContext = context.previousSteps
        .map(
          (step) =>
            `[${step.agent}]\nInput: ${step.input}\nOutput: ${step.output}\nReasoning: ${step.reasoning}`,
        )
        .join('\n\n');

      messages.push({
        role: 'user',
        content: `Previous agent outputs:\n${stepsContext}`,
      });
    }

    let userPrompt = `[DETECTED LANGUAGE: ${detectedLang}] — You MUST write ALL text values in ${detectedLang}. Do NOT use any other language or script.\n\nProblem: ${context.problem}`;
    if (context.subject) {
      userPrompt += `\nSubject: ${context.subject}`;
    }
    if (context.additionalContext) {
      userPrompt += `\n\nAdditional Context:\n${context.additionalContext}`;
    }

    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }
}
