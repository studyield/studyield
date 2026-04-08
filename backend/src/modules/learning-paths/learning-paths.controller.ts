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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  LearningPathsService,
  CreateLearningPathDto,
  GenerateLearningPathDto,
} from './learning-paths.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, PlanFeature } from '../../common';

@ApiTags('Learning Paths')
@Controller('learning-paths')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@PlanFeature('learning_paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Post()
  @ApiOperation({ summary: 'Create learning path' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLearningPathDto) {
    return this.learningPathsService.create(user.sub, dto);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI learning path' })
  async generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateLearningPathDto) {
    return this.learningPathsService.generate(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all learning paths' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.learningPathsService.findByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get learning path by ID' })
  async findOne(@Param('id') id: string) {
    return this.learningPathsService.findById(id);
  }

  @Post(':id/steps/:stepId/complete')
  @ApiOperation({ summary: 'Mark step as complete' })
  async completeStep(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ) {
    return this.learningPathsService.completeStep(id, stepId, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.learningPathsService.delete(id, user.sub);
  }
}
