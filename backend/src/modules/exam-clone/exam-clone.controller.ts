import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
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
import { ExamCloneService, CreateExamCloneDto, GenerateQuestionsDto } from './exam-clone.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, PlanFeature } from '../../common';

@ApiTags('Exam Clone')
@Controller('exam-clones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@PlanFeature('exam_clone')
export class ExamCloneController {
  constructor(private readonly examCloneService: ExamCloneService) {}

  // ==================== STATIC ROUTES FIRST ====================

  @Post()
  @ApiOperation({ summary: 'Create a new exam clone' })
  @ApiResponse({ status: 201, description: 'Exam clone created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExamCloneDto) {
    return this.examCloneService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exam clones' })
  @ApiResponse({ status: 200, description: 'Exam clones list' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.examCloneService.findByUser(user.sub);
  }

  @Get('review-queue')
  @ApiOperation({ summary: 'Get spaced repetition review queue' })
  @ApiResponse({ status: 200, description: 'Questions due for review' })
  async getReviewQueue(@CurrentUser() user: JwtPayload) {
    return this.examCloneService.getReviewQueue(user.sub);
  }

  @Get('templates/list')
  @ApiOperation({ summary: 'Get all exam templates' })
  @ApiResponse({ status: 200, description: 'Templates list' })
  async getTemplates() {
    return this.examCloneService.getTemplates();
  }

  // ==================== BOOKMARKS ====================

  @Get('bookmarks')
  @ApiOperation({ summary: 'Get all bookmarked questions' })
  @ApiResponse({ status: 200, description: 'Bookmarked questions list' })
  async getBookmarks(@CurrentUser() user: JwtPayload) {
    return this.examCloneService.getBookmarkedQuestions(user.sub);
  }

  @Post('bookmarks/:questionId')
  @ApiOperation({ summary: 'Bookmark a question' })
  @ApiResponse({ status: 201, description: 'Question bookmarked' })
  async bookmarkQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() dto: { note?: string },
  ) {
    await this.examCloneService.bookmarkQuestion(user.sub, questionId, dto.note);
    return { success: true };
  }

  @Delete('bookmarks/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove bookmark from question' })
  @ApiResponse({ status: 204, description: 'Bookmark removed' })
  async unbookmarkQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
  ) {
    await this.examCloneService.unbookmarkQuestion(user.sub, questionId);
  }

  // ==================== BADGES ====================

  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  @ApiResponse({ status: 200, description: 'All badges' })
  async getAllBadges() {
    return this.examCloneService.getBadges();
  }

  @Get('badges/user')
  @ApiOperation({ summary: 'Get user earned badges' })
  @ApiResponse({ status: 200, description: 'User badges' })
  async getUserBadges(@CurrentUser() user: JwtPayload) {
    return this.examCloneService.getUserBadges(user.sub);
  }

  // ==================== LEADERBOARD ====================

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard data' })
  async getLeaderboard(
    @CurrentUser() user: JwtPayload,
    @Query() query: { period?: 'weekly' | 'monthly' | 'all_time'; limit?: number },
  ) {
    const leaderboard = await this.examCloneService.getLeaderboard(
      query.period || 'weekly',
      query.limit || 10,
    );
    const userRank = await this.examCloneService.getUserRank(user.sub, query.period || 'weekly');
    return { leaderboard, userRank };
  }

  @Post('questions/:questionId/explanation')
  @ApiOperation({ summary: 'Get AI explanation for question' })
  @ApiResponse({ status: 200, description: 'Explanation returned' })
  async getExplanation(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() dto: { userAnswer: string },
  ) {
    return this.examCloneService.getExplanation(questionId, dto.userAnswer, user.sub);
  }

  @Post('review/:questionId')
  @ApiOperation({ summary: 'Complete review item' })
  @ApiResponse({ status: 200, description: 'Review completed' })
  async completeReview(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() dto: { correct: boolean },
  ) {
    await this.examCloneService.completeReview(user.sub, questionId, dto.correct);
    return { success: true };
  }

  @Post('questions/:questionId/evaluate')
  @ApiOperation({ summary: 'Evaluate written answer using AI' })
  @ApiResponse({ status: 200, description: 'Answer evaluated' })
  async evaluateAnswer(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() dto: { userAnswer: string },
  ) {
    return this.examCloneService.evaluateAnswerAI(questionId, dto.userAnswer);
  }

  // ==================== DYNAMIC :id ROUTES ====================

  @Post(':id/upload')
  @ApiOperation({ summary: 'Upload exam file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded and queued for processing' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      await this.examCloneService.uploadExam(
        id,
        user.sub,
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      return { message: 'File uploaded and queued for processing' };
    } catch (error) {
      // Handle PDF parsing errors with user-friendly messages
      if (
        error.message?.includes('Failed to parse PDF') ||
        error.message?.includes('Command token too long')
      ) {
        throw new BadRequestException(
          error.message ||
            'Unable to parse this PDF. Please try: (1) Re-saving the PDF, (2) Converting to text format, or (3) Copy-pasting the content directly.',
        );
      }
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam clone by ID' })
  @ApiResponse({ status: 200, description: 'Exam clone' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.examCloneService.findByIdWithAccess(id, user.sub);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get exam questions' })
  @ApiResponse({ status: 200, description: 'Questions list' })
  async getQuestions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.examCloneService.findByIdWithAccess(id, user.sub);
    return this.examCloneService.getQuestions(id);
  }

  @Get(':id/questions/original')
  @ApiOperation({ summary: 'Get original exam questions only' })
  @ApiResponse({ status: 200, description: 'Original questions list' })
  async getOriginalQuestions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.examCloneService.findByIdWithAccess(id, user.sub);
    return this.examCloneService.getQuestions(id, true);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get performance analytics for exam' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.examCloneService.getAnalytics(id, user.sub);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate new questions in exam style' })
  @ApiResponse({ status: 201, description: 'Questions generated' })
  async generateQuestions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: GenerateQuestionsDto,
  ) {
    return this.examCloneService.generateQuestions(id, user.sub, dto);
  }

  @Post(':id/attempt')
  @ApiOperation({ summary: 'Submit practice attempt' })
  @ApiResponse({ status: 201, description: 'Attempt submitted' })
  async submitAttempt(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    dto: {
      answers: Array<{ questionId: string; answer: string; timeSpent: number }>;
      totalTime: number;
    },
  ) {
    return this.examCloneService.submitAttempt(id, user.sub, dto.answers, dto.totalTime);
  }

  @Post(':id/adaptive-questions')
  @ApiOperation({ summary: 'Get questions with adaptive difficulty' })
  @ApiResponse({ status: 200, description: 'Adaptive questions' })
  async getAdaptiveQuestions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body()
    dto: { count: number; recentPerformance: Array<{ questionId: string; correct: boolean }> },
  ) {
    return this.examCloneService.getAdaptiveQuestions(
      id,
      user.sub,
      dto.count,
      dto.recentPerformance,
    );
  }

  @Post(':id/generate-from-template')
  @ApiOperation({ summary: 'Generate questions using template style' })
  @ApiResponse({ status: 201, description: 'Questions generated from template' })
  async generateFromTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: { templateSlug: string; subject: string; count: number },
  ) {
    return this.examCloneService.generateFromTemplate(
      id,
      user.sub,
      dto.templateSlug,
      dto.subject,
      dto.count,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exam clone' })
  @ApiResponse({ status: 204, description: 'Exam clone deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.examCloneService.delete(id, user.sub);
  }
}
