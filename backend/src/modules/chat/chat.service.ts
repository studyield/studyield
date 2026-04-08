import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import pdf = require('pdf-parse');
import { DatabaseService } from '../database/database.service';
import { AiService, ChatMessage } from '../ai/ai.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { StorageService } from '../storage/storage.service';

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  knowledgeBaseIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Citation {
  chunkId: string;
  content: string;
  documentId: string | null;
  score: number;
}

export interface CreateConversationDto {
  title?: string;
  knowledgeBaseIds?: string[];
}

export interface SendMessageDto {
  content: string;
  stream?: boolean;
}

export interface SendMessageWithFilesDto {
  content: string;
  stream?: boolean;
}

export interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  extractedText?: string;
  analysisResult?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly storageService: StorageService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto): Promise<Conversation> {
    const id = uuidv4();
    const now = new Date();

    // Generate a better default title based on timestamp
    const defaultTitle =
      dto.title ||
      `Chat ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`;

    const result = await this.db.queryOne<Conversation>(
      `INSERT INTO conversations (id, user_id, title, knowledge_base_ids, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId, defaultTitle, JSON.stringify(dto.knowledgeBaseIds || []), now, now],
    );

    this.logger.log(`Conversation created: ${id}`);
    return this.mapConversation(result!);
  }

  async getConversation(id: string, userId: string): Promise<Conversation> {
    const result = await this.db.queryOne<Conversation>(
      'SELECT * FROM conversations WHERE id = $1',
      [id],
    );

    if (!result) {
      throw new NotFoundException('Conversation not found');
    }

    const conversation = this.mapConversation(result);
    if (conversation.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return conversation;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const results = await this.db.queryMany<Conversation>(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId],
    );
    return results.map((r) => this.mapConversation(r));
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    await this.getConversation(conversationId, userId);

    const results = await this.db.queryMany<Message>(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId],
    );
    return results.map((r) => this.mapMessage(r));
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto): Promise<Message> {
    const conversation = await this.getConversation(conversationId, userId);

    await this.saveMessage(conversationId, 'user', dto.content);

    let context = '';
    let citations: Citation[] = [];

    if (conversation.knowledgeBaseIds.length > 0) {
      const searchResults = await this.knowledgeBaseService.searchMultiple(
        conversation.knowledgeBaseIds,
        userId,
        dto.content,
        5,
      );

      if (searchResults.length > 0) {
        context = searchResults.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n');
        citations = searchResults.map((r) => ({
          chunkId: r.chunkId,
          content: r.content.substring(0, 200) + '...',
          documentId: r.documentId,
          score: r.score,
        }));
      }
    }

    const messages = await this.buildMessageHistory(conversationId, context);
    messages.push({ role: 'user', content: dto.content });

    const response = await this.aiService.complete(messages, {
      maxTokens: 2048,
    });

    const assistantMessage = await this.saveMessage(
      conversationId,
      'assistant',
      response.content,
      citations,
    );

    await this.updateConversationTimestamp(conversationId);

    // Auto-generate title from first message if still using default
    await this.autoGenerateTitleIfNeeded(conversationId, dto.content);

    return assistantMessage;
  }

  private async autoGenerateTitleIfNeeded(
    conversationId: string,
    firstMessage: string,
  ): Promise<void> {
    try {
      const conversation = await this.db.queryOne<Conversation>(
        'SELECT title FROM conversations WHERE id = $1',
        [conversationId],
      );

      // Only update if title starts with "Chat " (default title)
      if (conversation && conversation.title && conversation.title.startsWith('Chat ')) {
        // Generate title from first message (take first 50 chars)
        const title =
          firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;

        await this.db.query('UPDATE conversations SET title = $1 WHERE id = $2', [
          title,
          conversationId,
        ]);

        this.logger.log(`Auto-generated title for conversation ${conversationId}: ${title}`);
      }
    } catch (error) {
      // Non-critical, log and continue
      this.logger.warn(`Failed to auto-generate title: ${(error as Error).message}`);
    }
  }

  async sendMessageWithFiles(
    conversationId: string,
    userId: string,
    dto: SendMessageWithFilesDto,
    files: Express.Multer.File[],
  ): Promise<Message> {
    const conversation = await this.getConversation(conversationId, userId);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Process each file
    const fileAttachments: FileAttachment[] = [];
    let fileContext = '';

    for (const file of files) {
      const fileId = uuidv4();
      const mimeType = file.mimetype;

      let extractedText = '';
      let analysisResult = '';
      let fileUrl = '';

      // Upload file to storage for later retrieval
      try {
        const result = await this.storageService.upload(file.buffer, file.originalname, {
          folder: `chat-attachments/${userId}`,
          contentType: mimeType,
        });
        fileUrl = result.url;
        this.logger.log(`Uploaded file to storage: ${fileUrl}`);
      } catch (error) {
        this.logger.warn(`Failed to upload file to storage: ${(error as Error).message}`);
        // Continue anyway - file URL will be empty
      }

      // Handle PDF files
      if (mimeType === 'application/pdf') {
        try {
          const pdfData = await pdf(file.buffer);
          extractedText = pdfData.text;
          this.logger.log(
            `Extracted ${extractedText.length} characters from PDF: ${file.originalname}`,
          );

          // If PDF has very little text (< 100 chars), it's likely a scanned image
          if (extractedText.trim().length < 100) {
            this.logger.warn(
              `PDF appears to be scanned/image-based with minimal text (${extractedText.length} chars)`,
            );

            // Add note to help AI inform user
            analysisResult = `[NOTE: This PDF appears to be a scanned document or image-based PDF with minimal extractable text. Only "${extractedText.trim()}" was extracted. For better results with scanned documents, the user should take a photo or screenshot and upload it as an image (JPG/PNG) instead of PDF.]`;
          }
        } catch (error) {
          this.logger.error(`Failed to extract PDF text: ${(error as Error).message}`);
          throw new BadRequestException('Failed to process PDF file');
        }
      }
      // Handle image files
      else if (mimeType.startsWith('image/')) {
        try {
          const base64Image = file.buffer.toString('base64');
          analysisResult = await this.aiService.generateWithVision({
            prompt: `You are an image analyzer. Your job is to DESCRIBE what you see in this image, NOT to answer questions or explain concepts.

Extract and describe:
1. Any visible TEXT (transcribe it word-for-word, including handwritten text)
2. Mathematical equations or formulas (transcribe using LaTeX notation)
3. Diagrams, charts, or visual elements (describe their structure)
4. Screenshots of text or code (transcribe exactly)
5. Handwritten notes (transcribe carefully, including Japanese, Bengali, or other languages)
6. Document structure (headings, bullet points, tables)

IMPORTANT: Just DESCRIBE what you see. Do NOT:
- Answer questions shown in the image
- Explain concepts
- Provide code examples
- Give solutions

Example:
Image shows: "What is photosynthesis?"
Your response: "The image contains the text: 'What is photosynthesis?'"

Now analyze this image and describe what you see:`,
            imageData: base64Image,
            mimeType,
          });
          this.logger.log(`Analyzed image: ${file.originalname}`);
        } catch (error) {
          this.logger.error(`Failed to analyze image: ${(error as Error).message}`);
          throw new BadRequestException('Failed to process image file');
        }
      } else {
        throw new BadRequestException(
          `Unsupported file type: ${mimeType}. Only PDF and images are supported.`,
        );
      }

      // Store file metadata with URL
      fileAttachments.push({
        id: fileId,
        filename: file.originalname,
        mimeType,
        size: file.size,
        url: fileUrl,
        extractedText,
        analysisResult,
      });

      // Build context from file
      if (extractedText) {
        fileContext += `\n\n[Document: ${file.originalname}]\n${extractedText.substring(0, 4000)}\n`;
      }
      if (analysisResult) {
        fileContext += `\n\n[Image Analysis: ${file.originalname}]\n${analysisResult}\n`;
      }
    }

    // Save user message with file references
    await this.saveMessage(
      conversationId,
      'user',
      dto.content || 'Uploaded files for analysis',
      [],
      { files: fileAttachments },
    );

    // Build message history with file context
    let contextText = fileContext;
    let citations: Citation[] = [];

    // Also search knowledge base if configured
    if (conversation.knowledgeBaseIds.length > 0 && dto.content) {
      const searchResults = await this.knowledgeBaseService.searchMultiple(
        conversation.knowledgeBaseIds,
        userId,
        dto.content,
        5,
      );

      if (searchResults.length > 0) {
        contextText += '\n\n' + searchResults.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n');
        citations = searchResults.map((r) => ({
          chunkId: r.chunkId,
          content: r.content.substring(0, 200) + '...',
          documentId: r.documentId,
          score: r.score,
        }));
      }
    }

    const messages = await this.buildMessageHistory(conversationId, contextText);
    messages.push({
      role: 'user',
      content:
        dto.content || 'Please analyze the uploaded files and answer any questions about them.',
    });

    const response = await this.aiService.complete(messages, {
      maxTokens: 3000,
    });

    const assistantMessage = await this.saveMessage(
      conversationId,
      'assistant',
      response.content,
      citations,
    );

    await this.updateConversationTimestamp(conversationId);

    return assistantMessage;
  }

  async *sendMessageStream(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ): AsyncGenerator<{ type: 'content' | 'citation' | 'done'; data: unknown }> {
    const conversation = await this.getConversation(conversationId, userId);

    await this.saveMessage(conversationId, 'user', dto.content);

    let context = '';
    let citations: Citation[] = [];

    if (conversation.knowledgeBaseIds.length > 0) {
      const searchResults = await this.knowledgeBaseService.searchMultiple(
        conversation.knowledgeBaseIds,
        userId,
        dto.content,
        5,
      );

      if (searchResults.length > 0) {
        context = searchResults.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n');
        citations = searchResults.map((r) => ({
          chunkId: r.chunkId,
          content: r.content.substring(0, 200) + '...',
          documentId: r.documentId,
          score: r.score,
        }));

        for (const citation of citations) {
          yield { type: 'citation', data: citation };
        }
      }
    }

    const messages = await this.buildMessageHistory(conversationId, context);
    messages.push({ role: 'user', content: dto.content });

    let fullContent = '';

    for await (const chunk of this.aiService.streamComplete(messages, { maxTokens: 2048 })) {
      if (chunk.done) {
        break;
      }
      fullContent += chunk.content;
      yield { type: 'content', data: chunk.content };
    }

    await this.saveMessage(conversationId, 'assistant', fullContent, citations);
    await this.updateConversationTimestamp(conversationId);

    yield { type: 'done', data: { messageId: uuidv4() } };
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    await this.getConversation(id, userId);

    await this.db.query('DELETE FROM messages WHERE conversation_id = $1', [id]);
    await this.db.query('DELETE FROM conversations WHERE id = $1', [id]);

    this.logger.log(`Conversation deleted: ${id}`);
  }

  async updateConversationTitle(id: string, userId: string, title: string): Promise<Conversation> {
    await this.getConversation(id, userId);

    const result = await this.db.queryOne<Conversation>(
      'UPDATE conversations SET title = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [title, new Date(), id],
    );

    return this.mapConversation(result!);
  }

  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    citations: Citation[] = [],
    metadata: Record<string, unknown> = {},
  ): Promise<Message> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<Message>(
      `INSERT INTO messages (id, conversation_id, role, content, citations, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, conversationId, role, content, JSON.stringify(citations), JSON.stringify(metadata), now],
    );

    return this.mapMessage(result!);
  }

  private async buildMessageHistory(
    conversationId: string,
    context: string,
  ): Promise<ChatMessage[]> {
    const messages: ChatMessage[] = [];

    let systemPrompt = `You are a helpful AI learning assistant for Studyield, an AI-powered study platform.
Your goal is to help students learn and understand their study materials.
Be concise, accurate, and educational in your responses.
When explaining concepts, use clear examples and break down complex ideas.`;

    if (context) {
      systemPrompt += `

IMPORTANT: The user has uploaded files (PDFs or images) for you to analyze. Use the content below to answer their questions.
The content includes extracted text from PDFs and/or analysis of uploaded images.
You MUST reference this content in your response.

Uploaded Files Content:
${context}

Instructions:
- Analyze the file content thoroughly
- Answer questions based on what's shown in the files
- If the user asks "What's in this PDF/image?", describe the content you see above
- Provide detailed explanations using the file content
- When referencing specific parts, cite using [1], [2], etc.`;
    }

    messages.push({ role: 'system', content: systemPrompt });

    const recentMessages = await this.db.queryMany<Message>(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [conversationId],
    );

    for (const msg of recentMessages.reverse()) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content as string,
        });
      }
    }

    return messages;
  }

  private async updateConversationTimestamp(id: string): Promise<void> {
    await this.db.query('UPDATE conversations SET updated_at = $1 WHERE id = $2', [new Date(), id]);
  }

  private mapConversation(row: unknown): Conversation {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      title: r.title as string,
      knowledgeBaseIds:
        typeof r.knowledge_base_ids === 'string'
          ? JSON.parse(r.knowledge_base_ids)
          : (r.knowledge_base_ids as string[]) || [],
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }

  private mapMessage(row: unknown): Message {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      conversationId: r.conversation_id as string,
      role: r.role as Message['role'],
      content: r.content as string,
      citations:
        typeof r.citations === 'string'
          ? JSON.parse(r.citations)
          : (r.citations as Citation[]) || [],
      metadata:
        typeof r.metadata === 'string'
          ? JSON.parse(r.metadata)
          : (r.metadata as Record<string, unknown>) || {},
      createdAt: new Date(r.created_at as string),
    };
  }
}
