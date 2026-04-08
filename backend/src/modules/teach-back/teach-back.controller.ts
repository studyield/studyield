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
  TeachBackService,
  CreateTeachBackDto,
  SubmitExplanationDto,
  ChallengeResponseDto,
  CreateFromStudySetDto,
} from './teach-back.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, PlanFeature } from '../../common';

@ApiTags('Teach-Back')
@Controller('teach-back')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@PlanFeature('teach_back')
export class TeachBackController {
  constructor(private readonly teachBackService: TeachBackService) {}

  @Post()
  @ApiOperation({ summary: 'Create teach-back session' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeachBackDto) {
    return this.teachBackService.create(user.sub, dto);
  }

  @Post('from-study-set')
  @ApiOperation({ summary: 'Create teach-back from study set' })
  async createFromStudySet(@CurrentUser() user: JwtPayload, @Body() dto: CreateFromStudySetDto) {
    return this.teachBackService.createFromStudySet(user.sub, dto.studySetId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.teachBackService.findByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.teachBackService.findByIdWithAccess(id, user.sub);
  }

  @Get(':id/essentials')
  @ApiOperation({ summary: 'Get topic essentials primer' })
  async getEssentials(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.teachBackService.getEssentials(id, user.sub);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit explanation' })
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitExplanationDto,
  ) {
    return this.teachBackService.submitExplanation(id, user.sub, dto);
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate explanation' })
  async evaluate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.teachBackService.evaluate(id, user.sub);
  }

  @Post(':id/challenge/start')
  @ApiOperation({ summary: 'Start "Convince the AI" challenge' })
  async startChallenge(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.teachBackService.startChallenge(id, user.sub);
  }

  @Post(':id/challenge/respond')
  @ApiOperation({ summary: 'Respond to AI challenge question' })
  async respondToChallenge(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChallengeResponseDto,
  ) {
    return this.teachBackService.respondToChallenge(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.teachBackService.delete(id, user.sub);
  }
}
