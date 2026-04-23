import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { ImportExportController } from './import-export.controller';
import { AnkiImportService } from './anki-import.service';
import { AnkiExportService } from './anki-export.service';
import { CsvImportService } from './csv-import.service';
import { CsvExportService } from './csv-export.service';

@Module({
  imports: [ContentModule],
  controllers: [ImportExportController],
  providers: [AnkiImportService, AnkiExportService, CsvImportService, CsvExportService],
  exports: [AnkiImportService, AnkiExportService, CsvImportService, CsvExportService],
})
export class ImportExportModule {}
