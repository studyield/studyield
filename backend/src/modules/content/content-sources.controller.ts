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
import { ContentSourcesService, CreateContentSourceDto } from './content-sources.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

@ApiTags('Content Sources')
@Controller('content-sources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentSourcesController {
  constructor(private readonly contentSourcesService: ContentSourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Track a new content source' })
  @ApiResponse({ status: 201, description: 'Source tracked' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateContentSourceDto) {
    return this.contentSourcesService.create(user.sub, dto);
  }

  @Get('study-set/:studySetId')
  @ApiOperation({ summary: 'Get all sources for a study set' })
  @ApiResponse({ status: 200, description: 'Sources list' })
  async findByStudySet(@CurrentUser() user: JwtPayload, @Param('studySetId') studySetId: string) {
    return this.contentSourcesService.findByStudySet(studySetId, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content source' })
  @ApiResponse({ status: 204, description: 'Source deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.contentSourcesService.delete(id, user.sub);
  }
}
