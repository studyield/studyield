import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuizService, CreateQuizDto, GenerateQuizDto, SubmitAttemptDto } from './quiz.service';
import { LiveQuizService } from './live-quiz.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { SubscriptionService } from '../subscription/subscription.service';

const FREE_QUIZ_TYPES = ['multiple_choice', 'true_false'];

@ApiTags('Quiz')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly liveQuizService: LiveQuizService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuizDto) {
    return this.quizService.create(user.sub, dto);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate quiz with AI' })
  @ApiResponse({ status: 201, description: 'Quiz generated' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateQuizDto) {
    const isPro = await this.subscriptionService.isPro(user.sub);
    if (!isPro && dto.questionTypes) {
      // Free users can only use basic quiz types
      dto.questionTypes = dto.questionTypes.filter((t) =>
        FREE_QUIZ_TYPES.includes(t),
      ) as GenerateQuizDto['questionTypes'];
      if (dto.questionTypes!.length === 0) {
        dto.questionTypes = ['multiple_choice', 'true_false'];
      }
    }
    return this.quizService.generate(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes for current user' })
  @ApiResponse({ status: 200, description: 'Quizzes list' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.quizService.findByUser(user.sub);
  }

  @Get('study-set/:studySetId')
  @ApiOperation({ summary: 'Get quizzes by study set' })
  @ApiResponse({ status: 200, description: 'Quizzes list' })
  async findByStudySet(@Param('studySetId') studySetId: string) {
    return this.quizService.findByStudySet(studySetId);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get attempt details' })
  @ApiResponse({ status: 200, description: 'Attempt details' })
  async getAttemptDetails(@CurrentUser() user: JwtPayload, @Param('attemptId') attemptId: string) {
    return this.quizService.getAttemptDetails(attemptId, user.sub);
  }

  @Get('live/history')
  @ApiOperation({ summary: 'Get live quiz history for current user' })
  @ApiResponse({ status: 200, description: 'Live quiz history' })
  async getLiveQuizHistory(@CurrentUser() user: JwtPayload) {
    return this.liveQuizService.getUserHistory(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quizService.findByIdWithAccess(id, user.sub);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get quiz questions' })
  @ApiResponse({ status: 200, description: 'Questions list' })
  async getQuestions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.quizService.findByIdWithAccess(id, user.sub);
    return this.quizService.getQuestions(id);
  }

  @Post(':id/attempts')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  @ApiResponse({ status: 201, description: 'Attempt submitted' })
  async submitAttempt(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizService.submitAttempt(id, user.sub, dto);
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get quiz attempts' })
  @ApiResponse({ status: 200, description: 'Attempts list' })
  async getAttempts(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quizService.getAttempts(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiResponse({ status: 204, description: 'Quiz deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.quizService.delete(id, user.sub);
  }
}
