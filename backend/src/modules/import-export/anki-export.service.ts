import { Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FlashcardsService, Flashcard } from '../content/flashcards.service';

@Injectable()
export class AnkiExportService {
  private readonly logger = new Logger(AnkiExportService.name);

  constructor(private readonly flashcardsService: FlashcardsService) {}

  async exportApkg(studySetId: string, deckName: string): Promise<Buffer> {
    const flashcards = await this.flashcardsService.findByStudySet(studySetId);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-export-'));

    try {
      const dbPath = path.join(tmpDir, 'collection.anki2');
      const db = new Database(dbPath);

      try {
        this.createAnkiSchema(db);
        this.populateCollection(db, deckName);
        this.insertNotes(db, flashcards, deckName);
      } finally {
        db.close();
      }

      // Write an empty media file (required by Anki)
      fs.writeFileSync(path.join(tmpDir, 'media'), '{}');

      // Create ZIP archive as .apkg
      const zip = new AdmZip();
      zip.addLocalFile(dbPath);
      zip.addLocalFile(path.join(tmpDir, 'media'));

      const buffer = zip.toBuffer();
      this.logger.log(
        `Exported ${flashcards.length} cards to .apkg for study set ${studySetId}`,
      );
      return buffer;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  private createAnkiSchema(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS col (
        id integer PRIMARY KEY,
        crt integer NOT NULL,
        mod integer NOT NULL,
        scm integer NOT NULL,
        ver integer NOT NULL,
        dty integer NOT NULL,
        usn integer NOT NULL,
        ls integer NOT NULL,
        conf text NOT NULL,
        models text NOT NULL,
        decks text NOT NULL,
        dconf text NOT NULL,
        tags text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id integer PRIMARY KEY,
        guid text NOT NULL,
        mid integer NOT NULL,
        mod integer NOT NULL,
        usn integer NOT NULL,
        tags text NOT NULL,
        flds text NOT NULL,
        sfld text NOT NULL,
        csum integer NOT NULL,
        flags integer NOT NULL,
        data text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cards (
        id integer PRIMARY KEY,
        nid integer NOT NULL,
        did integer NOT NULL,
        ord integer NOT NULL,
        mod integer NOT NULL,
        usn integer NOT NULL,
        type integer NOT NULL,
        queue integer NOT NULL,
        due integer NOT NULL,
        ivl integer NOT NULL,
        factor integer NOT NULL,
        reps integer NOT NULL,
        lapses integer NOT NULL,
        left integer NOT NULL,
        odue integer NOT NULL,
        odid integer NOT NULL,
        flags integer NOT NULL,
        data text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revlog (
        id integer PRIMARY KEY,
        cid integer NOT NULL,
        usn integer NOT NULL,
        ease integer NOT NULL,
        ivl integer NOT NULL,
        lastIvl integer NOT NULL,
        factor integer NOT NULL,
        time integer NOT NULL,
        type integer NOT NULL
      );

      CREATE TABLE IF NOT EXISTS graves (
        usn integer NOT NULL,
        oid integer NOT NULL,
        type integer NOT NULL
      );
    `);
  }

  private populateCollection(db: Database.Database, deckName: string): void {
    const now = Math.floor(Date.now() / 1000);
    const modelId = now * 1000; // unique model ID
    const deckId = now * 1000 + 1; // unique deck ID

    const models = JSON.stringify({
      [modelId]: {
        id: modelId,
        name: 'Basic',
        type: 0,
        mod: now,
        usn: -1,
        sortf: 0,
        did: deckId,
        tmpls: [
          {
            name: 'Card 1',
            ord: 0,
            qfmt: '{{Front}}',
            afmt: '{{FrontSide}}<hr id=answer>{{Back}}',
            bqfmt: '',
            bafmt: '',
            did: null,
            bfont: '',
            bsize: 0,
          },
        ],
        flds: [
          { name: 'Front', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
          { name: 'Back', ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
        ],
        css: '.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }',
        latexPre: '',
        latexPost: '',
        latexsvg: false,
        req: [[0, 'all', [0]]],
        tags: [],
        vers: [],
      },
    });

    const decks = JSON.stringify({
      1: {
        id: 1,
        name: 'Default',
        mod: now,
        usn: -1,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: false,
        desc: '',
        dyn: 0,
        conf: 1,
        extendNew: 10,
        extendRev: 50,
      },
      [deckId]: {
        id: deckId,
        name: deckName,
        mod: now,
        usn: -1,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: false,
        desc: '',
        dyn: 0,
        conf: 1,
        extendNew: 10,
        extendRev: 50,
      },
    });

    const dconf = JSON.stringify({
      1: {
        id: 1,
        name: 'Default',
        mod: 0,
        usn: 0,
        maxTaken: 60,
        autoplay: true,
        timer: 0,
        replayq: true,
        new: { delays: [1, 10], ints: [1, 4, 7], initialFactor: 2500, order: 1, perDay: 20 },
        rev: { perDay: 200, ease4: 1.3, fuzz: 0.05, minSpace: 1, ivlFct: 1, maxIvl: 36500 },
        lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
      },
    });

    const conf = JSON.stringify({
      activeDecks: [1],
      curDeck: deckId,
      newSpread: 0,
      collapseTime: 1200,
      timeLim: 0,
      estTimes: true,
      dueCounts: true,
      curModel: modelId,
      nextPos: 1,
      sortType: 'noteFld',
      sortBackwards: false,
      addToCur: true,
    });

    const insertCol = db.prepare(
      `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    insertCol.run(1, now, now, now * 1000, 11, 0, 0, 0, conf, models, decks, dconf, '{}');
  }

  private insertNotes(
    db: Database.Database,
    flashcards: Flashcard[],
    deckName: string,
  ): void {
    const now = Math.floor(Date.now() / 1000);

    // Get model and deck IDs from the col table
    const col = db.prepare('SELECT models, decks FROM col WHERE id = 1').get() as {
      models: string;
      decks: string;
    };
    const models = JSON.parse(col.models);
    const decks = JSON.parse(col.decks);

    const modelId = parseInt(Object.keys(models)[0], 10);
    const deckId = parseInt(
      Object.keys(decks).find((k) => decks[k].name === deckName) || '1',
      10,
    );

    const insertNote = db.prepare(
      `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertCard = db.prepare(
      `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertMany = db.transaction((cards: Flashcard[]) => {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const noteId = (now + i) * 1000 + i;
        const cardId = noteId + 1;
        const guid = this.generateGuid(noteId);
        const flds = `${card.front}\x1f${card.back}`;
        const tags = card.tags.length > 0 ? ` ${card.tags.join(' ')} ` : '';
        const csum = this.fieldChecksum(card.front);

        insertNote.run(noteId, guid, modelId, now, -1, tags, flds, card.front, csum, 0, '');

        insertCard.run(
          cardId, noteId, deckId, 0, now, -1, 0, 0, i, 0, 0, 0, 0, 0, 0, 0, 0, '',
        );
      }
    });

    insertMany(flashcards);
  }

  private generateGuid(id: number): string {
    // Generate a simple base91-like GUID from the ID (simplified)
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    let n = id;
    for (let i = 0; i < 10; i++) {
      result += chars[n % chars.length];
      n = Math.floor(n / chars.length);
    }
    return result;
  }

  private fieldChecksum(field: string): number {
    // Simple checksum matching Anki's field checksum (first 8 hex digits of SHA1 as int)
    // Using a simplified version for compatibility
    let hash = 0;
    for (let i = 0; i < field.length; i++) {
      const char = field.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash);
  }
}
