import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeGraphService, MergeGraphsDto } from './knowledge-graph.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

@ApiTags('Knowledge Graph')
@Controller('knowledge-graph')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KnowledgeGraphController {
  constructor(private readonly knowledgeGraphService: KnowledgeGraphService) {}

  @Post(':studySetId/extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract entities and relationships from a study set' })
  @ApiResponse({ status: 200, description: 'Entities extracted' })
  async extract(@CurrentUser() user: JwtPayload, @Param('studySetId') studySetId: string) {
    const entities = await this.knowledgeGraphService.extractEntities(user.sub, studySetId);
    return { entitiesExtracted: entities.length, entities };
  }

  @Get(':studySetId')
  @ApiOperation({ summary: 'Get knowledge graph for a study set' })
  @ApiResponse({ status: 200, description: 'Knowledge graph data' })
  async getGraph(@CurrentUser() user: JwtPayload, @Param('studySetId') studySetId: string) {
    return this.knowledgeGraphService.getGraph(user.sub, studySetId);
  }

  @Get(':studySetId/entities')
  @ApiOperation({ summary: 'List all entities for a study set' })
  @ApiResponse({ status: 200, description: 'Entity list' })
  async getEntities(@CurrentUser() user: JwtPayload, @Param('studySetId') studySetId: string) {
    return this.knowledgeGraphService.getEntities(user.sub, studySetId);
  }

  @Get('entity/:id')
  @ApiOperation({ summary: 'Get entity details with relationships' })
  @ApiResponse({ status: 200, description: 'Entity detail' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async getEntity(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.knowledgeGraphService.getEntity(user.sub, id);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Merge knowledge graphs across multiple study sets' })
  @ApiResponse({ status: 200, description: 'Merged graph' })
  async mergeGraphs(@CurrentUser() user: JwtPayload, @Body() dto: MergeGraphsDto) {
    return this.knowledgeGraphService.mergeGraphs(user.sub, dto.studySetIds);
  }
}
