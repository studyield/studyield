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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto, UpdateFlashcardDto, ReviewFlashcardDto } from './dto/flashcard.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { SubscriptionService } from '../subscription/subscription.service';

@ApiTags('Flashcards')
@Controller('flashcards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FlashcardsController {
  constructor(
    private readonly flashcardsService: FlashcardsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new flashcard' })
  @ApiResponse({ status: 201, description: 'Flashcard created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFlashcardDto) {
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'flashcards');
    return this.flashcardsService.create(user.sub, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple flashcards' })
  @ApiResponse({ status: 201, description: 'Flashcards created' })
  async createBulk(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      studySetId: string;
      cards: Array<{ front: string; back: string; notes?: string; tags?: string[] }>;
    },
  ) {
    await this.subscriptionService.checkAndIncrementUsage(
      user.sub,
      'flashcards',
      body.cards.length,
    );
    return this.flashcardsService.createBulk(user.sub, body.studySetId, body.cards);
  }

  @Get('due')
  @ApiOperation({ summary: 'Get flashcards due for review' })
  @ApiResponse({ status: 200, description: 'Due flashcards' })
  async getDue(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number) {
    return this.flashcardsService.findDueForReview(user.sub, limit || 20);
  }

  @Get('study-set/:studySetId')
  @ApiOperation({ summary: 'Get flashcards by study set' })
  @ApiResponse({ status: 200, description: 'Flashcards list' })
  async findByStudySet(@Param('studySetId') studySetId: string) {
    return this.flashcardsService.findByStudySet(studySetId);
  }

  @Get('study-set/:studySetId/due')
  @ApiOperation({ summary: 'Get flashcards due for review in a study set' })
  @ApiResponse({ status: 200, description: 'Due flashcards' })
  async getDueByStudySet(@Param('studySetId') studySetId: string, @Query('limit') limit?: number) {
    return this.flashcardsService.findByStudySetDueForReview(studySetId, limit || 20);
  }

  @Get('study-set/:studySetId/progress')
  @ApiOperation({ summary: 'Get study progress for a study set' })
  @ApiResponse({ status: 200, description: 'Study progress' })
  async getProgress(@Param('studySetId') studySetId: string) {
    return this.flashcardsService.getStudyProgress(studySetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get flashcard by ID' })
  @ApiResponse({ status: 200, description: 'Flashcard' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async findOne(@Param('id') id: string) {
    return this.flashcardsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.update(id, user.sub, dto);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review flashcard (spaced repetition)' })
  @ApiResponse({ status: 200, description: 'Flashcard reviewed' })
  async review(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewFlashcardDto,
  ) {
    return this.flashcardsService.review(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete flashcard' })
  @ApiResponse({ status: 204, description: 'Flashcard deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.flashcardsService.delete(id, user.sub);
  }
}
