import { Module } from '@nestjs/common';
import { CodeSandboxService } from './code-sandbox.service';
import { CodeSandboxController } from './code-sandbox.controller';
import { CodeSandboxGateway } from './code-sandbox.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CodeSandboxController],
  providers: [CodeSandboxService, CodeSandboxGateway],
  exports: [CodeSandboxService],
})
export class CodeSandboxModule {}
