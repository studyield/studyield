import { Module } from '@nestjs/common';
import { TeachBackService } from './teach-back.service';
import { TeachBackController } from './teach-back.controller';
import { TeachBackGateway } from './teach-back.gateway';
import { AuthModule } from '../auth/auth.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [AuthModule, GamificationModule],
  controllers: [TeachBackController],
  providers: [TeachBackService, TeachBackGateway],
  exports: [TeachBackService],
})
export class TeachBackModule {}
