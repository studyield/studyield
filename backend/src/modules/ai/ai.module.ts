import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [AiService, EmbeddingService],
  exports: [AiService, EmbeddingService],
})
export class AiModule {}
