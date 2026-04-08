import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import {
  ChatService,
  CreateConversationDto,
  SendMessageDto,
  SendMessageWithFilesDto,
} from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { SubscriptionService } from '../subscription/subscription.service';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async createConversation(@CurrentUser() user: JwtPayload, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(user.sub, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({ status: 200, description: 'Conversations list' })
  async getConversations(@CurrentUser() user: JwtPayload) {
    return this.chatService.getConversations(user.sub);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation' })
  async getConversation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.chatService.getConversation(id, user.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  async getMessages(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.chatService.getMessages(id, user.sub);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'ai_requests');
    return this.chatService.sendMessage(id, user.sub, dto);
  }

  @Post('conversations/:id/messages/upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Send a message with file attachments (PDF/images)' })
  @ApiResponse({ status: 201, description: 'Message with files sent' })
  async sendMessageWithFiles(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: SendMessageWithFilesDto,
  ) {
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'ai_requests');
    return this.chatService.sendMessageWithFiles(id, user.sub, dto, files);
  }

  @Post('conversations/:id/messages/stream')
  @ApiOperation({ summary: 'Send a message with streaming response' })
  @ApiResponse({ status: 200, description: 'Streamed response' })
  async sendMessageStream(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    await this.subscriptionService.checkAndIncrementUsage(user.sub, 'ai_requests');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.chatService.sendMessageStream(id, user.sub, dto)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', data: (error as Error).message })}\n\n`);
    }

    res.end();
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Update conversation title' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  async updateConversation(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return this.chatService.updateConversationTitle(id, user.sub, body.title);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiResponse({ status: 204, description: 'Conversation deleted' })
  async deleteConversation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.chatService.deleteConversation(id, user.sub);
  }
}
