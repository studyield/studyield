import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StudyPlannerService } from './study-planner.service';
import { StudyPlannerController } from './study-planner.controller';

@Module({
  imports: [AuthModule],
  controllers: [StudyPlannerController],
  providers: [StudyPlannerService],
  exports: [StudyPlannerService],
})
export class StudyPlannerModule {}
