import { Module, OnModuleInit } from '@nestjs/common';
import { EducatorService } from './educator.service';
import { EducatorController, ClassController } from './educator.controller';
import { DatabaseModule } from '../database';

@Module({
  imports: [DatabaseModule],
  controllers: [EducatorController, ClassController],
  providers: [EducatorService],
  exports: [EducatorService],
})
export class EducatorModule implements OnModuleInit {
  constructor(private readonly educatorService: EducatorService) {}

  async onModuleInit() {
    await this.educatorService.ensureTables();
  }
}
