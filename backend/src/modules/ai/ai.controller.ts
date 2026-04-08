import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';

interface GenerateFlashcardsDto {
  content: string;
  count?: number;
  studySetId?: string;
}

interface GeneratedFlashcard {
  front: string;
  back: string;
}

interface AssistCardDto {
  front: string;
  back?: string;
  action: 'suggest_answer' | 'elaborate' | 'mnemonic' | 'simplify';
}

interface AdjustCardsDto {
  flashcards: Array<{ front: string; back: string }>;
  instruction: string;
}

interface GenerateMindMapDto {
  title: string;
  content: string;
  studySetId?: string;
  noteId?: string;
  saveToHistory?: boolean;
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('generate-flashcards')
  @ApiOperation({ summary: 'Generate flashcards from content using AI' })
  @ApiResponse({ status: 201, description: 'Flashcards generated' })
  async generateFlashcards(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateFlashcardsDto,
  ): Promise<{ flashcards: GeneratedFlashcard[] }> {
    if (!dto.content || dto.content.trim().length < 50) {
      throw new BadRequestException('Content must be at least 50 characters long');
    }

    const count = Math.min(Math.max(dto.count || 10, 5), 50);

    const systemPrompt = `You are an expert educational content creator. Your task is to generate high-quality flashcards from the given text content.

Rules:
1. Create exactly ${count} flashcards
2. Each flashcard should have a clear question (front) and concise answer (back)
3. Questions should test understanding, not just memorization
4. Answers should be brief but complete
5. Cover the most important concepts from the text
6. Vary question types: definitions, explanations, comparisons, applications
7. Ensure questions are clear and unambiguous
8. Keep answers focused and accurate

Output format: Return a JSON object with a "flashcards" array containing objects with "front" and "back" properties.`;

    const userPrompt = `Generate ${count} flashcards from this content:\n\n${dto.content.slice(0, 8000)}`;

    try {
      const result = await this.aiService.completeJson<{ flashcards: GeneratedFlashcard[] }>(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.7, maxTokens: 4000 },
      );

      return {
        flashcards: result.flashcards.slice(0, count).map((card) => ({
          front: card.front.trim(),
          back: card.back.trim(),
        })),
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Flashcard generation failed: ${err.message}`, err.stack);
      throw new BadRequestException(
        err.message || 'Failed to generate flashcards. Please try again.',
      );
    }
  }

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize content using AI' })
  @ApiResponse({ status: 201, description: 'Content summarized' })
  async summarize(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { content: string; length?: 'short' | 'medium' | 'long' },
  ): Promise<{ summary: string }> {
    if (!dto.content || dto.content.trim().length < 50) {
      throw new BadRequestException('Content must be at least 50 characters long');
    }

    const lengthInstructions = {
      short: 'Create a brief summary in 2-3 sentences.',
      medium: 'Create a comprehensive summary in 1-2 paragraphs.',
      long: 'Create a detailed summary covering all key points in multiple paragraphs.',
    };

    const systemPrompt = `You are an expert at summarizing educational content. ${lengthInstructions[dto.length || 'medium']}

Focus on:
1. Main concepts and ideas
2. Key facts and details
3. Important relationships between concepts
4. Conclusions or implications`;

    try {
      const result = await this.aiService.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Summarize this content:\n\n${dto.content.slice(0, 8000)}` },
        ],
        { temperature: 0.5, maxTokens: 2000 },
      );

      return { summary: result.content.trim() };
    } catch (error) {
      throw new BadRequestException('Failed to summarize content. Please try again.');
    }
  }

  @Post('assist-card')
  @ApiOperation({ summary: 'AI assistance for a single flashcard' })
  @ApiResponse({ status: 201, description: 'Suggestion generated' })
  async assistCard(
    @CurrentUser() _user: JwtPayload,
    @Body() dto: AssistCardDto,
  ): Promise<{ suggestion: string }> {
    if (!dto.front || dto.front.trim().length < 10) {
      throw new BadRequestException('Front text must be at least 10 characters long');
    }

    const actionPrompts: Record<AssistCardDto['action'], string> = {
      suggest_answer:
        'You are a knowledgeable tutor. Given a flashcard question (front), provide a clear, concise answer. Be accurate and brief — aim for 1-3 sentences.',
      elaborate:
        'You are a knowledgeable tutor. Given a flashcard with a question and answer, provide a more detailed explanation. Add context, examples, or deeper insight. Keep it to 2-4 sentences.',
      mnemonic:
        'You are a memory expert. Given a flashcard question and answer, create a memorable mnemonic device, acronym, or memory trick to help remember the answer. Be creative and concise.',
      simplify:
        'You are a simplification expert. Given a flashcard, rewrite the answer in simpler, easier-to-understand language. Use everyday words and shorter sentences. Keep the core meaning intact.',
    };

    const cardContext = dto.back ? `Front: ${dto.front}\nBack: ${dto.back}` : `Front: ${dto.front}`;

    try {
      const result = await this.aiService.complete(
        [
          { role: 'system', content: actionPrompts[dto.action] },
          { role: 'user', content: cardContext },
        ],
        { temperature: 0.5, maxTokens: 512 },
      );

      return { suggestion: result.content.trim() };
    } catch {
      throw new BadRequestException('Failed to generate suggestion. Please try again.');
    }
  }

  @Post('adjust-cards')
  @ApiOperation({ summary: 'Adjust/refine a batch of flashcards using AI' })
  @ApiResponse({ status: 201, description: 'Cards adjusted' })
  async adjustCards(
    @CurrentUser() _user: JwtPayload,
    @Body() dto: AdjustCardsDto,
  ): Promise<{ flashcards: GeneratedFlashcard[] }> {
    if (!dto.flashcards || dto.flashcards.length === 0) {
      throw new BadRequestException('At least one flashcard is required');
    }
    if (dto.flashcards.length > 50) {
      throw new BadRequestException('Maximum 50 cards allowed');
    }
    if (!dto.instruction || dto.instruction.trim().length < 3) {
      throw new BadRequestException('Instruction must be at least 3 characters long');
    }

    const systemPrompt = `You are an expert flashcard editor. You will receive a set of flashcards and an instruction for how to modify them.

Rules:
1. Apply the user's instruction to every flashcard
2. Keep the same number of flashcards (${dto.flashcards.length} cards)
3. Maintain the same general topics but adjust content per the instruction
4. Each card must still have a clear front (question) and back (answer)
5. Return the modified flashcards in the same order

Output format: Return a JSON object with a "flashcards" array containing objects with "front" and "back" properties.`;

    const cardsText = dto.flashcards
      .map((c, i) => `${i + 1}. Front: ${c.front}\n   Back: ${c.back}`)
      .join('\n');

    try {
      const result = await this.aiService.completeJson<{
        flashcards: GeneratedFlashcard[];
      }>(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Instruction: ${dto.instruction}\n\nFlashcards:\n${cardsText}`,
          },
        ],
        { temperature: 0.7, maxTokens: 4000 },
      );

      return {
        flashcards: result.flashcards.map((card) => ({
          front: card.front.trim(),
          back: card.back.trim(),
        })),
      };
    } catch {
      throw new BadRequestException('Failed to adjust flashcards. Please try again.');
    }
  }

  @Post('generate-slides')
  @ApiOperation({ summary: 'Generate presentation slides from content using AI' })
  @ApiResponse({ status: 201, description: 'Slides generated' })
  async generateSlides(
    @CurrentUser() _user: JwtPayload,
    @Body() dto: { content: string; title: string; slideCount?: number },
  ): Promise<{
    slides: Array<{
      title: string;
      content: string;
      notes: string;
    }>;
  }> {
    if (!dto.content || dto.content.trim().length < 50) {
      throw new BadRequestException('Content must be at least 50 characters long');
    }

    const slideCount = Math.min(Math.max(dto.slideCount || 8, 3), 20);

    const systemPrompt = `You are an expert presentation designer. Create a professional, engaging presentation from the given content.

Rules:
1. Create exactly ${slideCount} slides
2. Each slide should have:
   - title: A short, catchy slide title (max 60 chars)
   - content: The main slide content in Markdown format (use headers, bullet points, bold, etc.)
   - notes: Speaker notes (what the presenter should say, additional context)
3. First slide should be a title slide with the presentation title
4. Last slide should be a summary or Q&A slide
5. Keep each slide focused on ONE main idea
6. Use bullet points for clarity (3-5 points per slide max)
7. Make content visually scannable, not walls of text
8. Add relevant examples or statistics when appropriate
9. Speaker notes should be conversational and helpful

Output format: Return a JSON object with a "slides" array containing objects with "title", "content", and "notes" properties.`;

    try {
      const result = await this.aiService.completeJson<{
        slides: Array<{
          title: string;
          content: string;
          notes: string;
        }>;
      }>(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create a ${slideCount}-slide presentation titled "${dto.title}" from this content:\n\n${dto.content.slice(0, 8000)}`,
          },
        ],
        { temperature: 0.7, maxTokens: 4000 },
      );

      return { slides: result.slides.slice(0, slideCount) };
    } catch {
      throw new BadRequestException('Failed to generate slides. Please try again.');
    }
  }

  @Post('generate-mind-map')
  @ApiOperation({ summary: 'Generate mind map from content using AI' })
  @ApiResponse({ status: 201, description: 'Mind map generated' })
  async generateMindMap(@CurrentUser() user: JwtPayload, @Body() dto: GenerateMindMapDto) {
    if (!dto.content || dto.content.trim().length < 50) {
      throw new BadRequestException('Content must be at least 50 characters long');
    }

    const prompt = `Based on this content, generate a mind map structure:

Title: ${dto.title}
Content: ${dto.content.substring(0, 5000)}

Create a hierarchical mind map with:
1. Central topic (main concept)
2. Main branches (3-6 key topics)
3. Sub-branches for each main branch (2-4 subtopics each)

Use different colors for visual distinction.

Return JSON:
{
  "centralTopic": {
    "id": "central",
    "label": "${dto.title}",
    "color": "#8b5cf6"
  },
  "branches": [
    {
      "id": "branch1",
      "label": "Key Topic 1",
      "color": "#10b981",
      "children": [
        {"id": "sub1", "label": "Subtopic", "color": "#34d399"}
      ]
    }
  ]
}`;

    const result = await this.aiService.completeJson<{
      centralTopic: { id: string; label: string; color: string };
      branches: Array<{
        id: string;
        label: string;
        color: string;
        children: Array<{ id: string; label: string; color: string }>;
      }>;
    }>([
      { role: 'system', content: 'Generate mind map structure as JSON.' },
      { role: 'user', content: prompt },
    ]);

    // Save to history if requested (default true)
    if (dto.saveToHistory !== false) {
      try {
        await this.aiService.saveMindMapToHistory({
          userId: user.sub,
          title: dto.title,
          content: dto.content.substring(0, 1000),
          mindMapData: result,
          studySetId: dto.studySetId,
          noteId: dto.noteId,
        });
      } catch (error) {
        // Log but don't fail the request
        this.logger.error('Failed to save mind map to history:', error);
      }
    }

    return result;
  }

  @Get('mind-maps')
  @ApiOperation({ summary: 'Get mind map history' })
  @ApiResponse({ status: 200, description: 'Mind map history' })
  async getMindMapHistory(@CurrentUser() user: JwtPayload) {
    return this.aiService.getMindMapHistory(user.sub);
  }

  @Get('mind-maps/:id')
  @ApiOperation({ summary: 'Get specific mind map by ID' })
  @ApiResponse({ status: 200, description: 'Mind map found' })
  async getMindMap(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.aiService.getMindMapById(id, user.sub);
  }

  @Delete('mind-maps/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete mind map from history' })
  @ApiResponse({ status: 204, description: 'Mind map deleted' })
  async deleteMindMap(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.aiService.deleteMindMap(id, user.sub);
  }

  @Post('generate-quiz')
  @ApiOperation({ summary: 'Generate quiz questions from content using AI' })
  @ApiResponse({ status: 201, description: 'Quiz generated' })
  async generateQuiz(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: { content: string; count?: number; type?: 'multiple_choice' | 'true_false' | 'mixed' },
  ): Promise<{
    questions: Array<{
      question: string;
      type: 'multiple_choice' | 'true_false';
      options: string[];
      correctAnswer: string;
      explanation: string;
    }>;
  }> {
    if (!dto.content || dto.content.trim().length < 50) {
      throw new BadRequestException('Content must be at least 50 characters long');
    }

    const count = Math.min(Math.max(dto.count || 10, 5), 30);
    const type = dto.type || 'mixed';

    const typeInstructions = {
      multiple_choice: 'All questions should be multiple choice with 4 options.',
      true_false: 'All questions should be true/false format.',
      mixed: 'Mix multiple choice (70%) and true/false (30%) questions.',
    };

    const systemPrompt = `You are an expert quiz creator. Generate ${count} quiz questions from the given content.

${typeInstructions[type]}

Rules:
1. Questions should test understanding, not just memorization
2. For multiple choice: provide exactly 4 options (A, B, C, D)
3. For true/false: provide options ["True", "False"]
4. Include a brief explanation for each correct answer
5. Vary difficulty levels

Output format: Return a JSON object with a "questions" array containing objects with:
- question: string
- type: "multiple_choice" or "true_false"
- options: array of strings
- correctAnswer: the correct option string
- explanation: brief explanation of the answer`;

    try {
      const result = await this.aiService.completeJson<{
        questions: Array<{
          question: string;
          type: 'multiple_choice' | 'true_false';
          options: string[];
          correctAnswer: string;
          explanation: string;
        }>;
      }>(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate quiz questions from this content:\n\n${dto.content.slice(0, 8000)}`,
          },
        ],
        { temperature: 0.7, maxTokens: 4000 },
      );

      return { questions: result.questions.slice(0, count) };
    } catch (error) {
      throw new BadRequestException('Failed to generate quiz. Please try again.');
    }
  }
}
