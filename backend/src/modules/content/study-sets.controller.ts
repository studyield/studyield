import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudySetsService, CreateStudySetDto, UpdateStudySetDto } from './study-sets.service';
import { FlashcardsService } from './flashcards.service';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, Public } from '../../common';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SubscriptionService } from '../subscription/subscription.service';

@ApiTags('Study Sets')
@Controller('study-sets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudySetsController {
  constructor(
    private readonly studySetsService: StudySetsService,
    private readonly flashcardsService: FlashcardsService,
    private readonly notesService: NotesService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new study set' })
  @ApiResponse({ status: 201, description: 'Study set created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStudySetDto) {
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'study_sets');
    return this.studySetsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user study sets' })
  @ApiResponse({ status: 200, description: 'Study sets list' })
  async findMine(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    const { data, total } = await this.studySetsService.findByUser(
      user.sub,
      pagination.page,
      pagination.limit,
    );
    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public study sets' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Public study sets list' })
  async findPublic(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    const { data, total } = await this.studySetsService.findPublic(
      pagination.page,
      pagination.limit,
      search,
    );
    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get study set by ID' })
  @ApiResponse({ status: 200, description: 'Study set' })
  @ApiResponse({ status: 404, description: 'Study set not found' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.studySetsService.findByIdWithAccess(id, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update study set' })
  @ApiResponse({ status: 200, description: 'Study set updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudySetDto,
  ) {
    return this.studySetsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete study set' })
  @ApiResponse({ status: 204, description: 'Study set deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.studySetsService.delete(id, user.sub);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate study set' })
  @ApiResponse({ status: 201, description: 'Study set duplicated' })
  async duplicate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'study_sets');
    return this.studySetsService.duplicate(id, user.sub);
  }

  @Get(':id/flashcards')
  @ApiOperation({ summary: 'Get flashcards for a study set' })
  @ApiResponse({ status: 200, description: 'Flashcards list' })
  async getFlashcards(@Param('id') studySetId: string, @Query() pagination: PaginationDto) {
    const flashcards = await this.flashcardsService.findByStudySet(studySetId);
    return new PaginatedResponseDto(
      flashcards,
      flashcards.length,
      pagination.page || 1,
      pagination.limit || 100,
    );
  }

  @Post(':id/flashcards')
  @ApiOperation({ summary: 'Create a flashcard for a study set' })
  @ApiResponse({ status: 201, description: 'Flashcard created' })
  async createFlashcard(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @Body()
    body: {
      front: string;
      back: string;
      notes?: string;
      tags?: string[];
      type?: 'standard' | 'cloze' | 'image_occlusion';
    },
  ) {
    await this.studySetsService.findByIdWithAccess(studySetId, user.sub);
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'flashcards');
    return this.flashcardsService.create(user.sub, {
      studySetId,
      ...body,
    });
  }

  @Post(':id/flashcards/bulk')
  @ApiOperation({ summary: 'Create multiple flashcards for a study set' })
  @ApiResponse({ status: 201, description: 'Flashcards created' })
  async createBulkFlashcards(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @Body()
    body: {
      flashcards: Array<{
        front: string;
        back: string;
        notes?: string;
        tags?: string[];
        type?: string;
      }>;
    },
  ) {
    await this.studySetsService.findByIdWithAccess(studySetId, user.sub);
    await this.subscriptionService.checkAndIncrementUsage(
      user.sub,
      'flashcards',
      body.flashcards.length,
    );
    return this.flashcardsService.createBulk(user.sub, studySetId, body.flashcards);
  }

  @Get(':id/study-schedule')
  @ApiOperation({ summary: 'Get optimal study schedule based on exam date' })
  @ApiResponse({ status: 200, description: 'Study schedule' })
  async getStudySchedule(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const studySet = await this.studySetsService.findByIdWithAccess(id, user.sub);
    const flashcards = await this.flashcardsService.findByStudySet(id);
    const progress = await this.flashcardsService.getStudyProgress(id);

    const examDate = studySet.examDate;
    const daysUntilExam = examDate
      ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

    const totalCards = flashcards.length;
    const cardsPerDay =
      daysUntilExam && daysUntilExam > 0 ? Math.ceil(totalCards / daysUntilExam) : 20;

    const dueToday = flashcards.filter(
      (f) => !f.nextReviewAt || new Date(f.nextReviewAt) <= new Date(),
    ).length;

    return {
      studySetId: id,
      examDate: examDate || null,
      daysUntilExam,
      totalCards,
      progress,
      todaysPlan: {
        newCards: Math.min(cardsPerDay, progress.new),
        reviewCards: dueToday,
        estimatedMinutes: Math.ceil((Math.min(cardsPerDay, progress.new) + dueToday) * 0.5),
      },
      recommendation:
        daysUntilExam !== null && daysUntilExam <= 3
          ? 'Focus on reviewing weak cards. Exam is very soon!'
          : daysUntilExam !== null && daysUntilExam <= 7
            ? 'Increase review frequency. Prioritize cards with low ease factor.'
            : 'Maintain steady study pace. Mix new cards with reviews.',
    };
  }

  // ─── NOTES ENDPOINTS ────────────────────────────────────────────────

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get notes for a study set' })
  @ApiResponse({ status: 200, description: 'Notes list' })
  async getNotes(@CurrentUser() user: JwtPayload, @Param('id') studySetId: string) {
    return this.notesService.findByStudySet(studySetId, user.sub);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Create a note for a study set' })
  @ApiResponse({ status: 201, description: 'Note created' })
  async createNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') studySetId: string,
    @Body() body: Omit<CreateNoteDto, 'studySetId'>,
  ) {
    await this.studySetsService.findByIdWithAccess(studySetId, user.sub);
    return this.notesService.create(user.sub, {
      studySetId,
      ...body,
    });
  }
}
