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
import { ResearchService, CreateResearchDto } from './research.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, PlanFeature } from '../../common';

@ApiTags('Research')
@Controller('research')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@PlanFeature('deep_research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  @ApiOperation({ summary: 'Create research session' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateResearchDto) {
    return this.researchService.create(user.sub, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start research' })
  async start(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { includeWebSearch?: boolean },
  ) {
    return this.researchService.research(id, user.sub, body.includeWebSearch ?? true);
  }

  @Get()
  @ApiOperation({ summary: 'Get all research sessions' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.researchService.findByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get research session by ID' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.researchService.findByIdWithAccess(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.researchService.delete(id, user.sub);
  }
}
