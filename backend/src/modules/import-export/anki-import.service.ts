import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FlashcardsService } from '../content/flashcards.service';
import { ImportResultDto } from './dto/import-export.dto';

@Injectable()
export class AnkiImportService {
  private readonly logger = new Logger(AnkiImportService.name);

  constructor(private readonly flashcardsService: FlashcardsService) {}

  async importApkg(
    userId: string,
    studySetId: string,
    fileBuffer: Buffer,
  ): Promise<ImportResultDto> {
    const result: ImportResultDto = { imported: 0, skipped: 0, errors: [] };
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-import-'));

    try {
      // Extract the .apkg ZIP archive
      const zip = new AdmZip(fileBuffer);
      zip.extractAllTo(tmpDir, true);

      // Find the SQLite database file (collection.anki2 or collection.anki21)
      const dbFile = this.findDatabaseFile(tmpDir);
      if (!dbFile) {
        throw new BadRequestException(
          'Invalid .apkg file: no Anki database found (expected collection.anki2 or collection.anki21)',
        );
      }

      // Open the SQLite database
      const db = new Database(dbFile, { readonly: true });

      try {
        const cards = this.extractCards(db);

        if (cards.length === 0) {
          result.errors.push('No cards found in the Anki deck');
          return result;
        }

        // Batch create flashcards
        const cardData = cards.map((card) => ({
          front: card.front,
          back: card.back,
          tags: card.tags,
        }));

        await this.flashcardsService.createBulk(userId, studySetId, cardData);
        result.imported = cards.length;

        this.logger.log(
          `Imported ${result.imported} cards from Anki deck into study set ${studySetId}`,
        );
      } finally {
        db.close();
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Anki import failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to import Anki deck: ${error.message}`);
    } finally {
      // Clean up temp directory
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    return result;
  }

  private findDatabaseFile(dir: string): string | null {
    const candidates = ['collection.anki21', 'collection.anki2'];
    for (const name of candidates) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  private extractCards(
    db: Database.Database,
  ): Array<{ front: string; back: string; tags: string[] }> {
    const cards: Array<{ front: string; back: string; tags: string[] }> = [];

    // Read the notes table - each note has fields separated by \x1f (unit separator)
    // The first field is typically the front, second is the back
    const notesQuery = db.prepare('SELECT flds, tags FROM notes');
    const notes = notesQuery.all() as Array<{ flds: string; tags: string }>;

    for (const note of notes) {
      try {
        const fields = note.flds.split('\x1f');
        if (fields.length < 2) {
          continue; // Skip notes without at least front and back
        }

        const front = this.stripHtml(fields[0]).trim();
        const back = this.stripHtml(fields[1]).trim();

        if (!front || !back) {
          continue; // Skip empty cards
        }

        // Parse tags (space-separated in Anki)
        const tags = note.tags
          ? note.tags
              .trim()
              .split(/\s+/)
              .filter((t: string) => t.length > 0)
          : [];

        cards.push({ front, back, tags });
      } catch (error) {
        this.logger.warn(`Skipped malformed note: ${error.message}`);
      }
    }

    return cards;
  }

  private stripHtml(html: string): string {
    // Remove HTML tags but preserve text content
    let text = html
      // Replace <br> and <br/> with newlines
      .replace(/<br\s*\/?>/gi, '\n')
      // Replace </div>, </p>, </li> with newlines
      .replace(/<\/(div|p|li)>/gi, '\n')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode common HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Remove [sound:...] references (Anki media)
      .replace(/\[sound:[^\]]*\]/g, '')
      // Remove image references
      .replace(/<img[^>]*>/g, '')
      // Collapse multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return text;
  }
}
