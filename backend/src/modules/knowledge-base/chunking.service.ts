import { Injectable, Logger } from '@nestjs/common';

export interface TextChunk {
  content: string;
  index: number;
  startOffset: number;
  endOffset: number;
  metadata?: Record<string, unknown>;
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
  preserveParagraphs?: boolean;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  chunk(text: string, options: ChunkingOptions = {}): TextChunk[] {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      separator = '\n\n',
      preserveParagraphs = true,
    } = options;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];

    if (preserveParagraphs) {
      const paragraphs = text.split(separator).filter((p) => p.trim().length > 0);
      let currentChunk = '';
      let currentStartOffset = 0;
      let chunkIndex = 0;
      let offset = 0;

      for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();

        if (currentChunk.length + trimmedParagraph.length + separator.length > chunkSize) {
          if (currentChunk.length > 0) {
            chunks.push({
              content: currentChunk.trim(),
              index: chunkIndex++,
              startOffset: currentStartOffset,
              endOffset: offset - separator.length,
            });

            const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
            currentChunk = currentChunk.substring(overlapStart);
            currentStartOffset = offset - currentChunk.length;
          }
        }

        if (trimmedParagraph.length > chunkSize) {
          const sentenceChunks = this.chunkBySentences(trimmedParagraph, chunkSize, chunkOverlap);
          for (const sentenceChunk of sentenceChunks) {
            chunks.push({
              content: sentenceChunk.content,
              index: chunkIndex++,
              startOffset: offset + sentenceChunk.startOffset,
              endOffset: offset + sentenceChunk.endOffset,
            });
          }
          offset += trimmedParagraph.length + separator.length;
          currentChunk = '';
          currentStartOffset = offset;
        } else {
          currentChunk += (currentChunk.length > 0 ? separator : '') + trimmedParagraph;
          offset += trimmedParagraph.length + separator.length;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex,
          startOffset: currentStartOffset,
          endOffset: offset,
        });
      }
    } else {
      return this.chunkBySize(text, chunkSize, chunkOverlap);
    }

    this.logger.debug(`Text chunked into ${chunks.length} chunks`);
    return chunks;
  }

  private chunkBySentences(text: string, chunkSize: number, chunkOverlap: number): TextChunk[] {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const sentences: string[] = [];
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      sentences.push(match[0].trim());
    }

    if (sentences.length === 0) {
      sentences.push(text);
    }

    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentStartOffset = 0;
    let chunkIndex = 0;
    let offset = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length + 1 > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          startOffset: currentStartOffset,
          endOffset: offset,
        });

        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        currentChunk = currentChunk.substring(overlapStart);
        currentStartOffset = offset - currentChunk.length;
      }

      currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
      offset += sentence.length + 1;
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        startOffset: currentStartOffset,
        endOffset: offset,
      });
    }

    return chunks;
  }

  private chunkBySize(text: string, chunkSize: number, chunkOverlap: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    let startOffset = 0;
    let chunkIndex = 0;

    while (startOffset < text.length) {
      const endOffset = Math.min(startOffset + chunkSize, text.length);
      const content = text.substring(startOffset, endOffset);

      chunks.push({
        content,
        index: chunkIndex++,
        startOffset,
        endOffset,
      });

      startOffset = endOffset - chunkOverlap;
      if (startOffset >= text.length - chunkOverlap) {
        break;
      }
    }

    return chunks;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  mergeChunks(chunks: TextChunk[], maxTokens: number): TextChunk[] {
    const merged: TextChunk[] = [];
    let currentContent = '';
    let currentStartOffset = 0;
    let mergedIndex = 0;

    for (const chunk of chunks) {
      const combinedTokens = this.estimateTokens(currentContent + '\n' + chunk.content);

      if (combinedTokens > maxTokens && currentContent.length > 0) {
        merged.push({
          content: currentContent,
          index: mergedIndex++,
          startOffset: currentStartOffset,
          endOffset: chunk.startOffset,
        });
        currentContent = chunk.content;
        currentStartOffset = chunk.startOffset;
      } else {
        currentContent += (currentContent.length > 0 ? '\n' : '') + chunk.content;
        if (merged.length === 0) {
          currentStartOffset = chunk.startOffset;
        }
      }
    }

    if (currentContent.length > 0) {
      merged.push({
        content: currentContent,
        index: mergedIndex,
        startOffset: currentStartOffset,
        endOffset: chunks[chunks.length - 1]?.endOffset || 0,
      });
    }

    return merged;
  }
}
