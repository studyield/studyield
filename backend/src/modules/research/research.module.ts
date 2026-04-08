import { Module } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ResearchController } from './research.controller';
import { ResearchGateway } from './research.gateway';
import { WebSearchService } from './web-search.service';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [KnowledgeBaseModule, AuthModule],
  controllers: [ResearchController],
  providers: [ResearchService, ResearchGateway, WebSearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
