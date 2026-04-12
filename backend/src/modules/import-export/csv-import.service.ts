import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FlashcardsService } from '../content/flashcards.service';
import { ImportResultDto } from './dto/import-export.dto';

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(private readonly flashcardsService: FlashcardsService) {}

  async importCsv(
    userId: string,
    studySetId: string,
    fileBuffer: Buffer,
    options?: {
      delimiter?: string;
      frontColumn?: number;
      backColumn?: number;
      hasHeader?: boolean;
    },
  ): Promise<ImportResultDto> {
    const result: ImportResultDto = { imported: 0, skipped: 0, errors: [] };

    try {
      const content = fileBuffer.toString('utf-8');
      const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

      if (lines.length === 0) {
        throw new BadRequestException('File is empty');
      }

      // Auto-detect delimiter if not specified
      const delimiter = options?.delimiter || this.detectDelimiter(lines[0]);
      const frontCol = options?.frontColumn ?? 0;
      const backCol = options?.backColumn ?? 1;

      // Determine if first row is a header
      const hasHeader = options?.hasHeader ?? this.detectHeader(lines[0], delimiter);
      const startIndex = hasHeader ? 1 : 0;

      const cards: Array<{ front: string; back: string }> = [];

      for (let i = startIndex; i < lines.length; i++) {
        const columns = this.parseLine(lines[i], delimiter);

        if (columns.length <= Math.max(frontCol, backCol)) {
          result.skipped++;
          result.errors.push(`Row ${i + 1}: not enough columns (found ${columns.length})`);
          continue;
        }

        const front = columns[frontCol].trim();
        const back = columns[backCol].trim();

        if (!front || !back) {
          result.skipped++;
          result.errors.push(`Row ${i + 1}: empty front or back field`);
          continue;
        }

        cards.push({ front, back });
      }

      if (cards.length > 0) {
        await this.flashcardsService.createBulk(userId, studySetId, cards);
        result.imported = cards.length;
      }

      this.logger.log(
        `CSV import: ${result.imported} imported, ${result.skipped} skipped for study set ${studySetId}`,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`CSV import failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to import CSV: ${error.message}`);
    }

    return result;
  }

  private detectDelimiter(firstLine: string): string {
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;

    // Quizlet exports use tabs by default
    if (tabCount >= 1 && tabCount >= commaCount) return '\t';
    if (commaCount >= 1 && commaCount >= semicolonCount) return ',';
    if (semicolonCount >= 1) return ';';

    // Default to tab (Quizlet compatibility)
    return '\t';
  }

  private detectHeader(firstLine: string, delimiter: string): boolean {
    const columns = this.parseLine(firstLine, delimiter);
    // Heuristic: if the first row contains common header words, treat it as a header
    const headerWords = ['term', 'definition', 'front', 'back', 'question', 'answer', 'word', 'meaning'];
    const lowerColumns = columns.map((c) => c.toLowerCase().trim());
    return lowerColumns.some((col) => headerWords.includes(col));
  }

  private parseLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
