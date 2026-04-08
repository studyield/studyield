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
import { KnowledgeBaseService, CreateKnowledgeBaseDto } from './knowledge-base.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload, PlanFeature } from '../../common';

@ApiTags('Knowledge Base')
@Controller('knowledge-bases')
@UseGuards(JwtAuthGuard)
@PlanFeature('knowledge_base')
@ApiBearerAuth()
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new knowledge base' })
  @ApiResponse({ status: 201, description: 'Knowledge base created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeBaseService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all knowledge bases for current user' })
  @ApiResponse({ status: 200, description: 'Knowledge bases list' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.knowledgeBaseService.findByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get knowledge base by ID' })
  @ApiResponse({ status: 200, description: 'Knowledge base' })
  @ApiResponse({ status: 404, description: 'Knowledge base not found' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.knowledgeBaseService.findByIdWithAccess(id, user.sub);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Add a document to the knowledge base' })
  @ApiResponse({ status: 201, description: 'Document queued for processing' })
  async addDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { documentId: string; fileKey: string; mimeType: string },
  ) {
    await this.knowledgeBaseService.addDocument(
      id,
      user.sub,
      body.documentId,
      body.fileKey,
      body.mimeType,
    );
    return { message: 'Document queued for processing' };
  }

  @Post(':id/text')
  @ApiOperation({ summary: 'Add raw text to the knowledge base' })
  @ApiResponse({ status: 201, description: 'Text added' })
  async addText(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { text: string; metadata?: Record<string, unknown> },
  ) {
    const chunks = await this.knowledgeBaseService.addText(id, user.sub, body.text, body.metadata);
    return { chunksAdded: chunks };
  }

  @Post(':id/search')
  @ApiOperation({ summary: 'Search the knowledge base' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { query: string; limit?: number },
  ) {
    return this.knowledgeBaseService.search(id, user.sub, body.query, body.limit);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search multiple knowledge bases' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchMultiple(
    @CurrentUser() user: JwtPayload,
    @Body() body: { knowledgeBaseIds: string[]; query: string; limit?: number },
  ) {
    return this.knowledgeBaseService.searchMultiple(
      body.knowledgeBaseIds,
      user.sub,
      body.query,
      body.limit,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete knowledge base' })
  @ApiResponse({ status: 204, description: 'Knowledge base deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.knowledgeBaseService.delete(id, user.sub);
  }
}
