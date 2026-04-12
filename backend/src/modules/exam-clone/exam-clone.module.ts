import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ExamCloneService } from './exam-clone.service';
import { ExamCloneController } from './exam-clone.controller';
import { ExamCloneGateway } from './exam-clone.gateway';
import { AuthModule } from '../auth/auth.module';
import { GamificationModule } from '../gamification/gamification.module';
import { QueueService } from '../queue/queue.service';

@Module({
  imports: [AuthModule, GamificationModule],
  controllers: [ExamCloneController],
  providers: [ExamCloneService, ExamCloneGateway],
  exports: [ExamCloneService],
})
export class ExamCloneModule implements OnModuleInit {
  private readonly logger = new Logger(ExamCloneModule.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly examCloneService: ExamCloneService,
  ) {}

  async onModuleInit() {
    // Register worker for exam-clone queue
    this.queueService.registerWorker('exam-clone', async (job) => {
      this.logger.log(`Processing job ${job.name} for exam-clone queue`);

      const { examCloneId, fileUrl, mimeType } = job.data as {
        examCloneId: string;
        fileUrl?: string;
        mimeType?: string;
      };

      if (job.name === 'process-file' && fileUrl && mimeType) {
        await this.examCloneService.processFile(examCloneId, fileUrl, mimeType);
      } else if (job.name === 'analyze') {
        await this.examCloneService.analyze(examCloneId);
      }

      return { success: true };
    });

    this.logger.log('Exam clone queue worker registered');
  }
}
