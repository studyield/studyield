import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { StudySetsService } from '../content/study-sets.service';
import { AnkiImportService } from './anki-import.service';
import { AnkiExportService } from './anki-export.service';
import { CsvImportService } from './csv-import.service';
import { CsvExportService } from './csv-export.service';
import { CsvImportOptionsDto } from './dto/import-export.dto';

@ApiTags('Import/Export')
@Controller('study-sets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportExportController {
  constructor(
    private readonly studySetsService: StudySetsService,
    private readonly ankiImportService: AnkiImportService,
    private readonly ankiExportService: AnkiExportService,
    private readonly csvImportService: CsvImportService,
    private readonly csvExportService: CsvExportService,
  ) {}

  @Post(':id/import/anki')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
      fileFilter: (_req: unknown, file: { originalname: string }, cb: (error: Error | null, accept: boolean) => void) => {
        if (!file.originalname.endsWith('.apkg')) {
          cb(new BadRequestException('Only .apkg files are accepted'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Import an Anki .apkg deck into a study set' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Anki .apkg file' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Import results' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async importAnki(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await this.studySetsService.findByIdWithAccess(studySetId, user.sub);
    return this.ankiImportService.importApkg(user.sub, studySetId, file.buffer);
  }

  @Post(':id/import/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (_req: unknown, file: { originalname: string }, cb: (error: Error | null, accept: boolean) => void) => {
        const ext = file.originalname.toLowerCase();
        if (!ext.endsWith('.csv') && !ext.endsWith('.tsv') && !ext.endsWith('.txt')) {
          cb(new BadRequestException('Only .csv, .tsv, and .txt files are accepted'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Import a CSV/TSV file (Quizlet compatible) into a study set' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV or TSV file' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Import results' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async importCsv(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query() options: CsvImportOptionsDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await this.studySetsService.findByIdWithAccess(studySetId, user.sub);

    return this.csvImportService.importCsv(user.sub, studySetId, file.buffer, {
      delimiter: options.delimiter,
      frontColumn: options.frontColumn ? parseInt(options.frontColumn, 10) : undefined,
      backColumn: options.backColumn ? parseInt(options.backColumn, 10) : undefined,
      hasHeader: options.hasHeader ? options.hasHeader === 'true' : undefined,
    });
  }

  @Get(':id/export/anki')
  @ApiOperation({ summary: 'Export a study set as an Anki .apkg file' })
  @ApiResponse({ status: 200, description: 'Anki .apkg file download' })
  async exportAnki(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @Res() res: Response,
  ) {
    const studySet = await this.studySetsService.findByIdWithAccess(studySetId, user.sub);
    const buffer = await this.ankiExportService.exportApkg(studySetId, studySet.title);

    const filename = `${studySet.title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.apkg`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  @Get(':id/export/csv')
  @ApiOperation({ summary: 'Export a study set as a CSV file' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCsv(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @Res() res: Response,
  ) {
    const studySet = await this.studySetsService.findByIdWithAccess(studySetId, user.sub);
    const csv = await this.csvExportService.exportCsv(studySetId);

    const filename = `${studySet.title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.csv`;
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }
}
