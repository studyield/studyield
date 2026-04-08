import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [KnowledgeBaseModule, AuthModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
