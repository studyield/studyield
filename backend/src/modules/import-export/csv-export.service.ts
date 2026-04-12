import { Injectable, Logger } from '@nestjs/common';
import { FlashcardsService } from '../content/flashcards.service';

@Injectable()
export class CsvExportService {
  private readonly logger = new Logger(CsvExportService.name);

  constructor(private readonly flashcardsService: FlashcardsService) {}

  async exportCsv(studySetId: string): Promise<string> {
    const flashcards = await this.flashcardsService.findByStudySet(studySetId);

    const rows: string[] = [];

    // Header row
    rows.push(this.escapeCsvRow(['front', 'back', 'tags']));

    // Data rows
    for (const card of flashcards) {
      const tags = card.tags.join('; ');
      rows.push(this.escapeCsvRow([card.front, card.back, tags]));
    }

    this.logger.log(`Exported ${flashcards.length} cards as CSV for study set ${studySetId}`);
    return rows.join('\n');
  }

  private escapeCsvRow(fields: string[]): string {
    return fields
      .map((field) => {
        // Escape fields that contain commas, quotes, or newlines
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      })
      .join(',');
  }
}
