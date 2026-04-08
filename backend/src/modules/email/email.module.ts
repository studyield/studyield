import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { SESService } from './ses.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, SESService],
  exports: [EmailService, SESService],
})
export class EmailModule {}
