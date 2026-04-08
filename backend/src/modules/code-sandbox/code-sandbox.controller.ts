import { Controller, Get, Post, Body, Param, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CodeSandboxService, ExecuteCodeDto } from './code-sandbox.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

@ApiTags('Code Sandbox')
@Controller('code-sandbox')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CodeSandboxController {
  constructor(private readonly codeSandboxService: CodeSandboxService) {}

  @Post('execute')
  @ApiOperation({ summary: 'Execute code' })
  async execute(@CurrentUser() user: JwtPayload, @Body() dto: ExecuteCodeDto) {
    return this.codeSandboxService.execute(user.sub, dto);
  }

  @Post('execute/stream')
  @ApiOperation({ summary: 'Execute code with streaming output' })
  async executeStream(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ExecuteCodeDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of this.codeSandboxService.executeStream(user.sub, dto)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get execution history' })
  async getHistory(@CurrentUser() user: JwtPayload) {
    return this.codeSandboxService.getHistory(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get execution by ID' })
  async getExecution(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.codeSandboxService.getExecution(id, user.sub);
  }
}
