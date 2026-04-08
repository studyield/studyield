import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { ChunkingService } from './chunking.service';
import { DocumentProcessorService } from './document-processor.service';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, ChunkingService, DocumentProcessorService],
  exports: [KnowledgeBaseService, ChunkingService],
})
export class KnowledgeBaseModule {}
