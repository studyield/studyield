import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizGeneratorService } from './quiz-generator.service';
import { LiveQuizService } from './live-quiz.service';
import { LiveQuizGateway } from './live-quiz.gateway';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [QuizController],
  providers: [QuizService, QuizGeneratorService, LiveQuizService, LiveQuizGateway],
  exports: [QuizService, QuizGeneratorService, LiveQuizService],
})
export class QuizModule {}
