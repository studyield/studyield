import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { StorageService } from '../storage/storage.service';

export interface ProcessedDocument {
  text: string;
  pageCount: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(private readonly storageService: StorageService) {}

  async processDocument(fileKey: string, mimeType: string): Promise<ProcessedDocument> {
    const buffer = await this.storageService.download(fileKey);

    switch (mimeType) {
      case 'application/pdf':
        return this.processPdf(buffer);
      case 'text/plain':
      case 'text/markdown':
        return this.processText(buffer);
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.processDocx(buffer);
      default:
        throw new Error(`Unsupported document type: ${mimeType}`);
    }
  }

  private async processPdf(buffer: Buffer): Promise<ProcessedDocument> {
    try {
      const data = await pdfParse(buffer);

      return {
        text: data.text,
        pageCount: data.numpages,
        metadata: {
          info: data.info,
          version: data.version,
        },
      };
    } catch (error) {
      this.logger.error('PDF processing failed', error);
      throw new Error('Failed to process PDF');
    }
  }

  private async processText(buffer: Buffer): Promise<ProcessedDocument> {
    const text = buffer.toString('utf-8');

    return {
      text,
      pageCount: 1,
      metadata: {},
    };
  }

  private async processDocx(buffer: Buffer): Promise<ProcessedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = this.cleanText(result.value);

      // Extract any warnings/messages as metadata
      const warnings = result.messages.filter((m) => m.type === 'warning').map((m) => m.message);

      return {
        text,
        pageCount: this.estimatePageCount(text),
        metadata: {
          warnings: warnings.length > 0 ? warnings : undefined,
          format: 'docx',
        },
      };
    } catch (error) {
      this.logger.error('DOCX processing failed', error);
      throw new Error('Failed to process DOCX document');
    }
  }

  private estimatePageCount(text: string): number {
    // Estimate based on ~3000 characters per page (with typical margins)
    const charsPerPage = 3000;
    return Math.max(1, Math.ceil(text.length / charsPerPage));
  }

  async extractTextFromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const html = await response.text();

      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return textContent;
    } catch (error) {
      this.logger.error('URL text extraction failed', error);
      throw new Error('Failed to extract text from URL');
    }
  }

  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
  }
}
