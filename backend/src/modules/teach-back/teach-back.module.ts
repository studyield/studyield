import { Module } from '@nestjs/common';
import { TeachBackService } from './teach-back.service';
import { TeachBackController } from './teach-back.controller';
import { TeachBackGateway } from './teach-back.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TeachBackController],
  providers: [TeachBackService, TeachBackGateway],
  exports: [TeachBackService],
})
export class TeachBackModule {}
