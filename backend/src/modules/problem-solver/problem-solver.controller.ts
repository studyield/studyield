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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProblemSolverService, SolveProblemDto } from './problem-solver.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common';
import { PlanFeature } from '../../common/decorators/plan-feature.decorator';

@ApiTags('Problem Solver')
@Controller('problem-solver')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@PlanFeature('problem_solver')
export class ProblemSolverController {
  constructor(private readonly problemSolverService: ProblemSolverService) {}

  // ─── Core ──────────────────────────────────────────

  @Post('ocr')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Extract text from image using AI vision' })
  @ApiResponse({ status: 200, description: 'Text extracted' })
  async extractTextFromImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.problemSolverService.extractTextFromImage(file);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new problem solving session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: SolveProblemDto) {
    return this.problemSolverService.create(user.sub, dto);
  }

  @Post(':id/solve')
  @ApiOperation({ summary: 'Solve the problem (non-streaming)' })
  @ApiResponse({ status: 200, description: 'Problem solved' })
  async solve(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.solve(id, user.sub);
  }

  @Post(':id/solve/stream')
  @ApiOperation({ summary: 'Solve the problem with streaming response' })
  @ApiResponse({ status: 200, description: 'Streaming solution' })
  async solveStream(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const event of this.problemSolverService.solveStream(id, user.sub)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({ stage: 'error', type: 'error', data: (error as Error).message })}\n\n`,
      );
    }

    res.end();
  }

  @Get()
  @ApiOperation({ summary: 'Get all problem solving sessions' })
  @ApiResponse({ status: 200, description: 'Sessions list' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.problemSolverService.findByUser(user.sub);
  }

  @Get('bookmarks')
  @ApiOperation({ summary: 'Get all bookmarked solutions' })
  @ApiResponse({ status: 200, description: 'Bookmarks list' })
  async getBookmarks(@CurrentUser() user: JwtPayload) {
    return this.problemSolverService.getBookmarks(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session' })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.findByIdWithAccess(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete session' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.problemSolverService.delete(id, user.sub);
  }

  // ─── Bookmarks ─────────────────────────────────────

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Bookmark a solution' })
  @ApiResponse({ status: 201, description: 'Bookmarked' })
  async addBookmark(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { tags?: string[]; notes?: string },
  ) {
    return this.problemSolverService.addBookmark(id, user.sub, body.tags, body.notes);
  }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove bookmark' })
  @ApiResponse({ status: 204, description: 'Bookmark removed' })
  async removeBookmark(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.problemSolverService.removeBookmark(id, user.sub);
  }

  @Get(':id/bookmark/status')
  @ApiOperation({ summary: 'Check if session is bookmarked' })
  @ApiResponse({ status: 200, description: 'Bookmark status' })
  async isBookmarked(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return { isBookmarked: await this.problemSolverService.isBookmarked(id, user.sub) };
  }

  // ─── Hints / Guide Mode ───────────────────────────

  @Post(':id/hint')
  @ApiOperation({ summary: 'Get next hint (Socratic guide mode)' })
  @ApiResponse({ status: 201, description: 'Next hint' })
  async getNextHint(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getNextHint(id, user.sub);
  }

  @Post(':id/hint/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset hints and start over' })
  @ApiResponse({ status: 200, description: 'Hints reset' })
  async resetHints(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.problemSolverService.resetHints(id, user.sub);
    return { success: true };
  }

  // ─── Alternative Methods ──────────────────────────

  @Get(':id/alternative-methods')
  @ApiOperation({ summary: 'Get alternative solution methods' })
  @ApiResponse({ status: 200, description: 'Alternative methods' })
  async getAlternativeMethods(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getAlternativeMethods(id, user.sub);
  }

  // ─── Practice Quiz ────────────────────────────────

  @Post(':id/practice-quiz')
  @ApiOperation({ summary: 'Generate practice quiz from solved problem' })
  @ApiResponse({ status: 201, description: 'Quiz generated' })
  async generatePracticeQuiz(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { count?: number },
  ) {
    return this.problemSolverService.generatePracticeQuiz(id, user.sub, body.count);
  }

  @Get(':id/practice-quiz')
  @ApiOperation({ summary: 'Get quiz questions for a session' })
  @ApiResponse({ status: 200, description: 'Quiz questions' })
  async getQuizQuestions(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getQuizQuestions(id, user.sub);
  }

  @Post('quiz/:questionId/answer')
  @ApiOperation({ summary: 'Submit answer for a quiz question' })
  @ApiResponse({ status: 200, description: 'Answer result' })
  async submitQuizAnswer(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() body: { answer: string },
  ) {
    return this.problemSolverService.submitQuizAnswer(questionId, user.sub, body.answer);
  }

  // ─── ELI5 / Complexity Levels ────────────────────

  @Post(':id/explain')
  @ApiOperation({ summary: 'Re-explain at a different complexity level' })
  @ApiResponse({ status: 200, description: 'Explanation at level' })
  async explainAtLevel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { level: string },
  ) {
    return this.problemSolverService.explainAtLevel(id, user.sub, body.level);
  }

  // ─── Concept Map ──────────────────────────────────

  @Get(':id/concept-map')
  @ApiOperation({ summary: 'Get concept map / knowledge graph' })
  @ApiResponse({ status: 200, description: 'Concept map' })
  async getConceptMap(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getConceptMap(id, user.sub);
  }

  // ─── Formula Cards ────────────────────────────────

  @Get(':id/formula-cards')
  @ApiOperation({ summary: 'Auto-generate formula flashcards from solution' })
  @ApiResponse({ status: 200, description: 'Formula cards' })
  async getFormulaCards(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.generateFormulaCards(id, user.sub);
  }

  // ─── Graph Data ───────────────────────────────────

  @Get(':id/graph')
  @ApiOperation({ summary: 'Get graph data for interactive plotting' })
  @ApiResponse({ status: 200, description: 'Graph data' })
  async getGraphData(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getGraphData(id, user.sub);
  }

  // ─── Audio Narration ──────────────────────────────

  @Get(':id/narration')
  @ApiOperation({ summary: 'Get spoken narration text for solution' })
  @ApiResponse({ status: 200, description: 'Narration text' })
  async getNarration(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getNarrationText(id, user.sub);
  }

  // ─── Batch Solve ──────────────────────────────────

  @Post('batch/extract')
  @ApiOperation({ summary: 'Extract problems from text/PDF content' })
  @ApiResponse({ status: 201, description: 'Extracted problems' })
  async batchExtract(@Body() body: { text: string }) {
    return this.problemSolverService.batchExtractProblems(body.text);
  }

  // ─── Similar Problems ─────────────────────────────

  @Get(':id/similar')
  @ApiOperation({ summary: 'Generate similar practice problems' })
  @ApiResponse({ status: 200, description: 'Similar problems list' })
  async getSimilar(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.generateSimilarProblems(id, user.sub);
  }

  // ─── Study Buddy Chat ─────────────────────────────

  @Post(':id/chat')
  @ApiOperation({ summary: 'Send a chat message to the study buddy' })
  @ApiResponse({ status: 201, description: 'Chat response' })
  async sendChatMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.problemSolverService.sendChatMessage(id, user.sub, body.message);
  }

  @Get(':id/chat/messages')
  @ApiOperation({ summary: 'Get chat messages for a session' })
  @ApiResponse({ status: 200, description: 'Chat messages' })
  async getChatMessages(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.problemSolverService.getChatMessages(id, user.sub);
  }
}
