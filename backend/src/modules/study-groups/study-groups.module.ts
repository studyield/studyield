import { Module } from '@nestjs/common';
import { StudyGroupsService } from './study-groups.service';
import { StudyGroupsController } from './study-groups.controller';

@Module({
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService],
  exports: [StudyGroupsService],
})
export class StudyGroupsModule {}
