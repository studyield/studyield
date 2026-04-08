import { Module, OnModuleInit } from '@nestjs/common';
import { StudySetsService } from './study-sets.service';
import { StudySetsController } from './study-sets.controller';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './flashcards.controller';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { ContentExtractController } from './content-extract.controller';
import { ContentSourcesService } from './content-sources.service';
import { ContentSourcesController } from './content-sources.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [
    StudySetsController,
    DocumentsController,
    FlashcardsController,
    NotesController,
    ContentExtractController,
    ContentSourcesController,
  ],
  providers: [
    StudySetsService,
    DocumentsService,
    FlashcardsService,
    NotesService,
    ContentSourcesService,
  ],
  exports: [
    StudySetsService,
    DocumentsService,
    FlashcardsService,
    NotesService,
    ContentSourcesService,
  ],
})
export class ContentModule implements OnModuleInit {
  constructor(private readonly contentSourcesService: ContentSourcesService) {}

  async onModuleInit() {
    // Ensure the content_sources table exists
    await this.contentSourcesService.ensureTableExists();
  }
}
