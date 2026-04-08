import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { create, all } from 'mathjs';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';
import { AnalysisAgent } from './agents/analysis.agent';
import { SolverAgent } from './agents/solver.agent';
import { VerifierAgent } from './agents/verifier.agent';
import { HintAgent } from './agents/hint.agent';
import { AlternativeMethodAgent } from './agents/alternative-method.agent';
import { AgentStep, AgentContext, AgentResult } from './agents/base.agent';

const math = create(all);

export interface ProblemSolvingSession {
  id: string;
  userId: string;
  problem: string;
  subject: string | null;
  imageUrl: string | null;
  status: 'pending' | 'analyzing' | 'solving' | 'verifying' | 'completed' | 'failed';
  analysisResult: AgentStep | null;
  solutionResult: AgentStep | null;
  verificationResult: AgentStep | null;
  finalAnswer: string | null;
  isCorrect: boolean | null;
  hintSteps: unknown[];
  complexityLevel: string;
  graphData: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface SolveProblemDto {
  problem: string;
  subject?: string;
  imageUrl?: string;
}

@Injectable()
export class ProblemSolverService {
  private readonly logger = new Logger(ProblemSolverService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
    private readonly analysisAgent: AnalysisAgent,
    private readonly solverAgent: SolverAgent,
    private readonly verifierAgent: VerifierAgent,
    private readonly hintAgent: HintAgent,
    private readonly alternativeMethodAgent: AlternativeMethodAgent,
  ) {}

  // ═══════════════════════════════════════════
  // CORE: Create & Solve
  // ═══════════════════════════════════════════

  async extractTextFromImage(
    file: Express.Multer.File,
  ): Promise<{ text: string; confidence: number }> {
    try {
      this.logger.log('Extracting text from image using AI vision...');

      // Convert image buffer to base64
      const base64Image = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      // Use AI vision to analyze the image
      const prompt = `You are a precise multilingual OCR system for academic content. Analyze this image and extract the question or problem shown.

LANGUAGE SUPPORT:
- Detect and extract text in ANY language including:
  * English
  * Japanese (日本語) - Hiragana, Katakana, Kanji, handwritten
  * Bengali (বাংলা) - including handwritten
  * Chinese (中文)
  * Korean (한국어)
  * Arabic (العربية)
  * And ALL other languages
- Preserve the original language exactly as written

CONTENT RULES:
- Extract the exact question/problem text as written
- Preserve ALL content including:
  * Mathematical expressions (use x^2 for x squared, √ for square root, etc.)
  * Code snippets or algorithms
  * Chemical formulas and equations
  * Physics equations and diagrams descriptions
  * Essay questions or discussion prompts
  * Mixed language text (e.g., English + Japanese)
  * Handwritten text in any script
- For math: use / for fractions, ^ for exponents (e.g., x^2)
- For chemistry: preserve subscripts (H2O) and arrows (→)
- For code: preserve syntax and formatting
- If multiple questions/problems exist, extract all of them separated by line breaks
- Do NOT add solutions, explanations, or answers - only the question/problem text

IMPORTANT: Pay special attention to handwritten text and non-Latin scripts.

Return ONLY the extracted text exactly as shown in the image, preserving the original language and characters.`;

      const response = await this.aiService.generateWithVision({
        prompt,
        imageData: base64Image,
        mimeType,
      });

      const extractedText = response.trim();

      this.logger.log(`Text extracted: ${extractedText}`);

      return {
        text: extractedText,
        confidence: 0.95, // AI vision is typically very accurate
      };
    } catch (error) {
      this.logger.error('Failed to extract text from image', error);
      throw error;
    }
  }

  async create(userId: string, dto: SolveProblemDto): Promise<ProblemSolvingSession> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db.queryOne<ProblemSolvingSession>(
      `INSERT INTO problem_solving_sessions (id, user_id, problem, subject, image_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
       RETURNING *`,
      [id, userId, dto.problem, dto.subject || null, dto.imageUrl || null, now, now],
    );

    this.logger.log(`Problem solving session created: ${id}`);
    return this.mapSession(result!);
  }

  async solve(sessionId: string, userId: string): Promise<ProblemSolvingSession> {
    const session = await this.findByIdWithAccess(sessionId, userId);

    const context: AgentContext = {
      problem: session.problem,
      subject: session.subject || undefined,
      previousSteps: [],
    };

    try {
      await this.updateStatus(sessionId, 'analyzing');
      const analysisResult = await this.analysisAgent.execute(context);
      const analysisStep: AgentStep = {
        agent: 'Analysis',
        input: session.problem,
        output: analysisResult.output,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        timestamp: new Date(),
      };
      await this.saveStep(sessionId, 'analysis', analysisStep);

      await this.updateStatus(sessionId, 'solving');
      context.previousSteps = [analysisStep];
      const solverResult = await this.solverAgent.execute(context);
      const solverStep: AgentStep = {
        agent: 'Solver',
        input: analysisResult.output,
        output: solverResult.output,
        confidence: solverResult.confidence,
        reasoning: solverResult.reasoning,
        timestamp: new Date(),
      };
      await this.saveStep(sessionId, 'solution', solverStep);

      await this.updateStatus(sessionId, 'verifying');
      context.previousSteps = [analysisStep, solverStep];
      const verifierResult = await this.verifierAgent.execute(context);
      const verifierStep: AgentStep = {
        agent: 'Verifier',
        input: solverResult.output,
        output: verifierResult.output,
        confidence: verifierResult.confidence,
        reasoning: verifierResult.reasoning,
        timestamp: new Date(),
      };
      await this.saveStep(sessionId, 'verification', verifierStep);

      const finalAnswer =
        (verifierResult.metadata?.finalAnswer as string) ||
        (solverResult.metadata?.finalAnswer as string) ||
        'See solution';
      const isCorrect = (verifierResult.metadata?.isCorrect as boolean) ?? true;

      await this.db.query(
        `UPDATE problem_solving_sessions
         SET status = 'completed', final_answer = $1, is_correct = $2, updated_at = $3
         WHERE id = $4`,
        [finalAnswer, isCorrect, new Date(), sessionId],
      );

      this.logger.log(`Problem solved: ${sessionId}, correct: ${isCorrect}`);
      return this.findById(sessionId) as Promise<ProblemSolvingSession>;
    } catch (error) {
      this.logger.error(`Problem solving failed: ${sessionId}`, error);
      await this.updateStatus(sessionId, 'failed');
      throw error;
    }
  }

  async *solveStream(
    sessionId: string,
    userId: string,
  ): AsyncGenerator<{
    stage: string;
    type: 'start' | 'chunk' | 'result';
    data: unknown;
  }> {
    const session = await this.findByIdWithAccess(sessionId, userId);

    const context: AgentContext = {
      problem: session.problem,
      subject: session.subject || undefined,
      previousSteps: [],
    };

    try {
      yield { stage: 'analysis', type: 'start', data: null };
      await this.updateStatus(sessionId, 'analyzing');

      let analysisResult: AgentResult | null = null;

      for await (const chunk of this.analysisAgent.executeStream(context)) {
        if (chunk.type === 'chunk') {
          yield { stage: 'analysis', type: 'chunk', data: chunk.data };
        } else {
          analysisResult = chunk.data as AgentResult;
          yield { stage: 'analysis', type: 'result', data: analysisResult };
        }
      }

      if (!analysisResult) throw new Error('Analysis failed');

      const analysisStep: AgentStep = {
        agent: 'Analysis',
        input: session.problem,
        output: analysisResult.output,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        timestamp: new Date(),
      };
      await this.saveStep(sessionId, 'analysis', analysisStep);

      yield { stage: 'solving', type: 'start', data: null };
      await this.updateStatus(sessionId, 'solving');
      context.previousSteps = [analysisStep];

      let solverResult: AgentResult | null = null;

      for await (const chunk of this.solverAgent.executeStream(context)) {
        if (chunk.type === 'chunk') {
          yield { stage: 'solving', type: 'chunk', data: chunk.data };
        } else {
          solverResult = chunk.data as AgentResult;
          yield { stage: 'solving', type: 'result', data: solverResult };
        }
      }

      if (!solverResult) throw new Error('Solving failed');

      const solverStep: AgentStep = {
        agent: 'Solver',
        input: analysisResult.output,
        output: solverResult.output,
        confidence: solverResult.confidence,
        reasoning: solverResult.reasoning,
        timestamp: new Date(),
      };
      await this.saveStep(sessionId, 'solution', solverStep);

      yield { stage: 'verification', type: 'start', data: null };
      await this.updateStatus(sessionId, 'verifying');
      context.previousSteps = [analysisStep, solverStep];

      let verifierResult: AgentResult | null = null;

      for await (const chunk of this.verifierAgent.executeStream(context)) {
        if (chunk.type === 'chunk') {
          yield { stage: 'verification', type: 'chunk', data: chunk.data };
        } else {
          verifierResult = chunk.data as AgentResult;
          yield { stage: 'verification', type: 'result', data: verifierResult };
        }
      }

      if (!verifierResult) throw new Error('Verification failed');

      const verifierStep: AgentStep = {
        agent: 'Verifier',
        input: solverResult.output,
        output: verifierResult.output,
        confidence: verifierResult.confidence,
        reasoning: verifierResult.reasoning,
        timestamp: new Date(),
      };
      await this.saveStep(sessionId, 'verification', verifierStep);

      const finalAnswer =
        (verifierResult.metadata?.finalAnswer as string) ||
        (solverResult.metadata?.finalAnswer as string) ||
        'See solution';
      const isCorrect = (verifierResult.metadata?.isCorrect as boolean) ?? true;

      await this.db.query(
        `UPDATE problem_solving_sessions
         SET status = 'completed', final_answer = $1, is_correct = $2, updated_at = $3
         WHERE id = $4`,
        [finalAnswer, isCorrect, new Date(), sessionId],
      );

      yield {
        stage: 'complete',
        type: 'result',
        data: { finalAnswer, isCorrect },
      };
    } catch (error) {
      await this.updateStatus(sessionId, 'failed');
      throw error;
    }
  }

  // ═══════════════════════════════════════════
  // BOOKMARKS
  // ═══════════════════════════════════════════

  async addBookmark(sessionId: string, userId: string, tags?: string[], notes?: string) {
    await this.findByIdWithAccess(sessionId, userId);
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO solution_bookmarks (id, user_id, session_id, tags, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, session_id) DO UPDATE SET tags = $4, notes = $5`,
      [id, userId, sessionId, JSON.stringify(tags || []), notes || null, new Date()],
    );
    return { id, sessionId, tags: tags || [], notes };
  }

  async removeBookmark(sessionId: string, userId: string) {
    await this.db.query('DELETE FROM solution_bookmarks WHERE session_id = $1 AND user_id = $2', [
      sessionId,
      userId,
    ]);
  }

  async getBookmarks(userId: string) {
    const rows = await this.db.queryMany(
      `SELECT b.id, b.session_id, b.tags, b.notes, b.created_at,
              s.problem, s.subject, s.final_answer, s.status
       FROM solution_bookmarks b
       JOIN problem_solving_sessions s ON s.id = b.session_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId],
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      sessionId: r.session_id as string,
      tags: r.tags as string[],
      notes: r.notes as string | null,
      problem: r.problem as string,
      subject: r.subject as string | null,
      finalAnswer: r.final_answer as string | null,
      status: r.status as string,
      createdAt: (r.created_at as Date).toISOString(),
    }));
  }

  async isBookmarked(sessionId: string, userId: string): Promise<boolean> {
    const result = await this.db.queryOne(
      'SELECT id FROM solution_bookmarks WHERE session_id = $1 AND user_id = $2',
      [sessionId, userId],
    );
    return !!result;
  }

  // ═══════════════════════════════════════════
  // HINT / GUIDE MODE
  // ═══════════════════════════════════════════

  async getNextHint(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const currentHints = (session.hintSteps || []) as Array<{ output: string }>;
    const detectedLang = this.detectLanguage(session.problem);

    const context: AgentContext = {
      problem: session.problem,
      subject: session.subject || undefined,
      previousSteps: currentHints.map((h, i) => ({
        agent: 'Hint',
        input: `Hint ${i + 1}`,
        output: typeof h === 'string' ? h : h.output || JSON.stringify(h),
        confidence: 1,
        reasoning: '',
        timestamp: new Date(),
      })),
      additionalContext: `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.\nThis is hint request #${currentHints.length + 1}. Previous hints given: ${currentHints.length}`,
    };

    const result = await this.hintAgent.execute(context);

    const updatedHints = [...currentHints, { output: result.output, metadata: result.metadata }];
    await this.db.query(
      'UPDATE problem_solving_sessions SET hint_steps = $1, updated_at = $2 WHERE id = $3',
      [JSON.stringify(updatedHints), new Date(), sessionId],
    );

    return {
      hint: result.output,
      hintNumber: updatedHints.length,
      totalHintsNeeded: result.metadata?.totalHintsNeeded || 5,
      isLastHint: result.metadata?.isLastHint || false,
      nextHintPreview: result.metadata?.nextHintPreview || null,
    };
  }

  async resetHints(sessionId: string, userId: string) {
    await this.findByIdWithAccess(sessionId, userId);
    await this.db.query(
      `UPDATE problem_solving_sessions SET hint_steps = '[]'::jsonb, updated_at = $1 WHERE id = $2`,
      [new Date(), sessionId],
    );
  }

  // ═══════════════════════════════════════════
  // ALTERNATIVE SOLUTION METHODS
  // ═══════════════════════════════════════════

  async getAlternativeMethods(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);

    // Check cache first
    const cached = await this.db.queryMany(
      'SELECT * FROM solution_alternative_methods WHERE session_id = $1',
      [sessionId],
    );
    if (cached.length > 0) {
      return cached.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        methodName: r.method_name as string,
        methodDescription: r.method_description as string,
        solutionSteps: r.solution_steps,
        createdAt: (r.created_at as Date).toISOString(),
      }));
    }

    const detectedLang = this.detectLanguage(session.problem);
    const originalMethod = session.solutionResult?.output || '';

    const context: AgentContext = {
      problem: session.problem,
      subject: session.subject || undefined,
      previousSteps: session.solutionResult
        ? [
            {
              agent: 'Solver',
              input: session.problem,
              output: originalMethod,
              confidence: 1,
              reasoning: 'Original solution method',
              timestamp: new Date(),
            },
          ]
        : [],
      additionalContext: `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.\nProvide 2 DIFFERENT alternative methods to solve this problem. Each method must be different from the original.`,
    };

    // Generate 2 alternative methods
    const methods: Array<{
      id: string;
      methodName: string;
      methodDescription: string;
      solutionSteps: unknown;
    }> = [];

    for (let i = 0; i < 2; i++) {
      if (i > 0) {
        context.additionalContext = `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.\nProvide yet another DIFFERENT method. Already used: ${methods.map((m) => m.methodName).join(', ')}. Use a completely different approach.`;
      }

      const result = await this.alternativeMethodAgent.execute(context);
      const id = uuidv4();
      const methodName = (result.metadata?.methodName as string) || `Method ${i + 2}`;
      const methodDesc = (result.metadata?.methodDescription as string) || '';

      await this.db.query(
        `INSERT INTO solution_alternative_methods (id, session_id, method_name, method_description, solution_steps, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          sessionId,
          methodName,
          methodDesc,
          JSON.stringify({ output: result.output, metadata: result.metadata }),
          new Date(),
        ],
      );

      methods.push({
        id,
        methodName,
        methodDescription: methodDesc,
        solutionSteps: { output: result.output, metadata: result.metadata },
      });
    }

    return methods;
  }

  // ═══════════════════════════════════════════
  // PRACTICE QUIZ
  // ═══════════════════════════════════════════

  async generatePracticeQuiz(sessionId: string, userId: string, count = 5) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const detectedLang = this.detectLanguage(session.problem);

    const prompt = `[DETECTED LANGUAGE: ${detectedLang}] — Generate ALL text in ${detectedLang}.

Based on this solved problem: "${session.problem}"
${session.subject ? `Subject: ${session.subject}` : ''}
${session.finalAnswer ? `Answer: ${session.finalAnswer}` : ''}
${session.solutionResult?.output ? `Solution approach: ${session.solutionResult.output.substring(0, 500)}` : ''}

Generate ${count} practice quiz questions that test understanding of the same concepts. Mix question types.

Rules:
1. Create exactly ${count} questions
2. Test understanding of the core concepts
3. Mix question types (multiple choice, true/false, fill in blank)
4. Provide clear explanations for correct answers
5. Vary difficulty levels

Output format: Return a JSON object with a "questions" array containing objects with:
- question: the question text
- questionType: "mcq" | "true_false" | "fill_blank"
- options: array of 4 option strings (for mcq) or ["True", "False"] (for true_false) or [] (for fill_blank)
- correctAnswer: the correct answer text (must match one of the options exactly)
- explanation: brief explanation of why this is correct
- difficulty: "easy" | "medium" | "hard"

CRITICAL LaTeX Formatting Rules:
1. ALWAYS wrap math expressions in $...$ delimiters
2. Use double backslashes in JSON strings for LaTeX commands
3. Examples:
   - Good: "What is the derivative of $\\sin(x)$?"
   - Bad: "What is the derivative of \\sin(x)?"
   - Good: "Answer: $\\frac{d}{dx}[\\sin(x)] = \\cos(x)$"
   - Bad: "Answer: \\frac{d}{dx}[\\sin(x)] = \\cos(x)"
   - Good option: "$\\sec^2(x)$"
   - Bad option: "\\sec^2(x)"`;

    const result = await this.aiService.completeJson<{
      questions: Array<{
        question: string;
        questionType: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        difficulty: string;
      }>;
    }>([
      {
        role: 'system',
        content: `You are a quiz generator. Create practice questions in JSON format. Write all text in ${detectedLang}.

CRITICAL: When writing LaTeX in JSON strings, you MUST use double backslashes:
- Correct: "\\\\frac{1}{2}", "\\\\tan(x)", "\\\\sin(x)"
- Wrong: "\\frac{1}{2}", "\\tan(x)", "\\sin(x)"

This is because JSON parsing treats single backslash as escape characters.

EXPLANATION GUIDELINES:
1. For derivative questions: Always STATE the derivative first, then explain
   - Good: "The derivative of $\\\\sin(x)$ is $\\\\cos(x)$. Since $\\\\cos(x)$ can be negative in quadrants II and III, the statement is false."
   - Bad: "The derivative $\\\\cos(x)$ can take on negative values..." (doesn't state what it's the derivative OF)

2. For true/false: Clearly state why the statement is true or false
3. For MCQ: Explain why the correct answer is right
4. Be complete but concise - connect the answer to the question explicitly`,
      },
      { role: 'user', content: prompt },
    ]);

    const questions = result?.questions || [];

    // Helper function to fix LaTeX formatting (restore missing backslashes and add $ delimiters)
    const fixLatex = (text: string): string => {
      if (!text) return text;

      let fixed = text;

      // First, fix cases where \t became a tab character (shows as spaces) - e.g., "\tan" -> "  an"
      fixed = fixed.replace(/\s+an\(/gi, ' \\tan(').replace(/\s+ext\{/gi, ' \\text{');

      // Fix cases where backslash was simply removed or is missing
      fixed = fixed
        .replace(/([^\\$]|^)\s*frac\{/g, '$1\\frac{')
        .replace(/([^\\$]|^)\s*sqrt\{/g, '$1\\sqrt{')
        .replace(/([^\\$]|^)\s*sin\(/g, '$1\\sin(')
        .replace(/([^\\$]|^)\s*cos\(/g, '$1\\cos(')
        .replace(/([^\\$]|^)\s*sec\^/g, '$1\\sec^')
        .replace(/([^\\$]|^)\s*csc\^/g, '$1\\csc^')
        .replace(/([^\\$]|^)\s*cot\(/g, '$1\\cot(')
        .replace(/([^\\$]|^)\s*tan\(/g, '$1\\tan(')
        .replace(/([^\\$]|^)\s*log\(/g, '$1\\log(')
        .replace(/([^\\$]|^)\s*ln\(/g, '$1\\ln(');

      // Wrap isolated LaTeX commands in $ delimiters if not already wrapped
      // Match LaTeX commands that are not already inside $...$
      const latexPattern =
        /(?<!\$)\\(sin|cos|tan|sec|csc|cot|frac|sqrt|log|ln)\s*\([^)]*\)|\\(sin|cos|tan|sec|csc|cot)\^?\d*\([^)]*\)/g;
      fixed = fixed.replace(latexPattern, (match) => {
        // Check if already in $...$
        const beforeMatch = fixed.substring(0, fixed.indexOf(match));
        const dollarsBeforeCount = (beforeMatch.match(/\$/g) || []).length;
        if (dollarsBeforeCount % 2 === 1) return match; // Already inside $...$
        return `$${match}$`;
      });

      return fixed;
    };

    const savedQuestions = [];

    for (const q of questions) {
      const id = uuidv4();

      // Sanitize LaTeX in all text fields
      const sanitizedQuestion = fixLatex(q.question);
      const sanitizedOptions = (q.options || []).map((opt) => fixLatex(opt));
      const sanitizedCorrectAnswer = fixLatex(q.correctAnswer);
      const sanitizedExplanation = fixLatex(q.explanation);

      await this.db.query(
        `INSERT INTO practice_quiz_questions (id, session_id, user_id, question, question_type, options, correct_answer, explanation, difficulty, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          sessionId,
          userId,
          sanitizedQuestion,
          q.questionType || 'mcq',
          JSON.stringify(sanitizedOptions),
          sanitizedCorrectAnswer,
          sanitizedExplanation,
          q.difficulty || 'medium',
          new Date(),
        ],
      );
      savedQuestions.push({
        id,
        question: sanitizedQuestion,
        questionType: q.questionType,
        options: sanitizedOptions,
        correctAnswer: sanitizedCorrectAnswer,
        explanation: sanitizedExplanation,
        difficulty: q.difficulty,
      });
    }

    return savedQuestions;
  }

  async submitQuizAnswer(questionId: string, userId: string, answer: string) {
    const q = await this.db.queryOne<Record<string, unknown>>(
      'SELECT * FROM practice_quiz_questions WHERE id = $1 AND user_id = $2',
      [questionId, userId],
    );
    if (!q) throw new NotFoundException('Question not found');

    const isCorrect =
      (q.correct_answer as string).trim().toLowerCase() === answer.trim().toLowerCase();

    await this.db.query(
      'UPDATE practice_quiz_questions SET user_answer = $1, is_correct = $2, answered_at = $3 WHERE id = $4',
      [answer, isCorrect, new Date(), questionId],
    );

    return {
      isCorrect,
      correctAnswer: q.correct_answer as string,
      explanation: q.explanation as string,
    };
  }

  async getQuizQuestions(sessionId: string, userId: string) {
    const rows = await this.db.queryMany(
      'SELECT * FROM practice_quiz_questions WHERE session_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [sessionId, userId],
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      question: r.question as string,
      questionType: r.question_type as string,
      options: r.options as string[],
      correctAnswer: r.correct_answer as string,
      explanation: r.explanation as string,
      difficulty: r.difficulty as string,
      userAnswer: r.user_answer as string | null,
      isCorrect: r.is_correct as boolean | null,
      answeredAt: r.answered_at ? (r.answered_at as Date).toISOString() : null,
    }));
  }

  // ═══════════════════════════════════════════
  // ELI5 / COMPLEXITY LEVELS
  // ═══════════════════════════════════════════

  async explainAtLevel(sessionId: string, userId: string, level: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const detectedLang = this.detectLanguage(session.problem);

    const levelDescriptions: Record<string, string> = {
      eli5: 'Explain like the student is 5 years old. Use very simple words, everyday analogies, and no technical jargon at all.',
      beginner:
        'Explain for a complete beginner. Use simple language, basic analogies, and define any technical terms.',
      intermediate:
        'Explain at a standard high school level. Use proper terminology with clear explanations.',
      advanced:
        'Explain at a university/expert level. Use formal mathematical notation and rigorous proofs where applicable.',
    };

    const prompt = `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.

Problem: "${session.problem}"
${session.solutionResult?.output ? `Full solution: ${session.solutionResult.output}` : ''}
${session.finalAnswer ? `Answer: ${session.finalAnswer}` : ''}

${levelDescriptions[level] || levelDescriptions.intermediate}

Re-explain the entire solution at this complexity level. Use LaTeX ($...$) for any math.`;

    const response = await this.aiService.complete([
      {
        role: 'system',
        content: `You are an expert tutor who adapts explanations to different levels. Write in ${detectedLang}.`,
      },
      { role: 'user', content: prompt },
    ]);

    await this.db.query(
      'UPDATE problem_solving_sessions SET complexity_level = $1, updated_at = $2 WHERE id = $3',
      [level, new Date(), sessionId],
    );

    return { level, explanation: response.content };
  }

  // ═══════════════════════════════════════════
  // CONCEPT MAP
  // ═══════════════════════════════════════════

  async getConceptMap(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const detectedLang = this.detectLanguage(session.problem);

    const prompt = `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.

Problem: "${session.problem}"
${session.subject ? `Subject: ${session.subject}` : ''}
${session.solutionResult?.output ? `Solution used: ${session.solutionResult.output.substring(0, 500)}` : ''}

Generate a concept map showing the knowledge graph for this problem. Include:
1. Prerequisites (what the student should know before this)
2. Current concepts (used in this problem)
3. Next concepts (what they can learn after mastering this)
4. Related concepts (tangentially related topics)

Return a JSON object:
{
  "centralTopic": "Main topic name",
  "prerequisites": [{"name": "concept", "description": "brief desc", "difficulty": "easy|medium|hard"}],
  "currentConcepts": [{"name": "concept", "description": "how it's used here", "importance": "core|supporting"}],
  "nextConcepts": [{"name": "concept", "description": "what you can learn next", "difficulty": "easy|medium|hard"}],
  "relatedConcepts": [{"name": "concept", "description": "how it relates", "relationship": "similar|builds_on|application"}]
}`;

    const result = await this.aiService.completeJson<{
      centralTopic: string;
      prerequisites: Array<{ name: string; description: string; difficulty: string }>;
      currentConcepts: Array<{ name: string; description: string; importance: string }>;
      nextConcepts: Array<{ name: string; description: string; difficulty: string }>;
      relatedConcepts: Array<{ name: string; description: string; relationship: string }>;
    }>([
      {
        role: 'system',
        content: `You are an education expert. Generate concept maps in JSON. Write in ${detectedLang}.`,
      },
      { role: 'user', content: prompt },
    ]);

    return result;
  }

  // ═══════════════════════════════════════════
  // FORMULA CARDS (Auto-generate flashcards)
  // ═══════════════════════════════════════════

  async generateFormulaCards(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const detectedLang = this.detectLanguage(session.problem);

    const prompt = `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.

Problem: "${session.problem}"
${session.subject ? `Subject: ${session.subject}` : ''}
${session.solutionResult?.output ? `Solution: ${session.solutionResult.output}` : ''}

Extract ALL formulas, theorems, rules, and key concepts used in this solution. For each, create a flashcard.

Return a JSON array:
[
  {
    "front": "Formula/concept name (e.g., 'Quadratic Formula')",
    "back": "The formula or definition using LaTeX: $x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}$\\n\\nWhen to use: ...",
    "category": "formula|theorem|rule|definition|concept",
    "subject": "math|physics|chemistry|etc"
  }
]`;

    const result = await this.aiService.completeJson<
      Array<{ front: string; back: string; category: string; subject: string }>
    >([
      {
        role: 'system',
        content: `You are an education expert. Extract formulas and concepts as flashcards. Write in ${detectedLang}.`,
      },
      { role: 'user', content: prompt },
    ]);

    return result || [];
  }

  // ═══════════════════════════════════════════
  // GRAPH DATA (for interactive plotting)
  // ═══════════════════════════════════════════

  async getGraphData(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);

    // Check if already cached
    if (session.graphData) {
      // If cached data has points, return it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cached = session.graphData as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (cached.functions && cached.functions.some((f: any) => f.points && f.points.length > 0)) {
        return cached;
      }
      // If cached but no points, regenerate with points
    }

    const prompt = `Analyze this math/science problem and extract any equations or functions that can be plotted on a graph.

Problem: "${session.problem}"
${session.solutionResult?.output ? `Solution: ${session.solutionResult.output}` : ''}
${session.finalAnswer ? `Answer: ${session.finalAnswer}` : ''}

Return a JSON object:
{
  "canPlot": true|false,
  "plotType": "2d"|"none",
  "functions": [
    {
      "expression": "x^2 + 3*x - 4",
      "label": "f(x) = x² + 3x - 4",
      "color": "#8b5cf6"
    }
  ],
  "xRange": [-10, 10],
  "yRange": [-10, 10],
  "specialPoints": [
    {"x": 1, "y": 0, "label": "root"},
    {"x": -4, "y": 0, "label": "root"}
  ],
  "gridLines": true
}

IMPORTANT: Only set canPlot=true if there are actual mathematical functions to plot. For non-mathematical problems, set canPlot=false.
The "expression" must use standard math notation: use * for multiplication, ^ for power, sqrt() for square root, sin()/cos()/tan() for trig.`;

    const result = await this.aiService.completeJson<{
      canPlot: boolean;
      plotType: string;
      functions: Array<{ expression: string; label: string; color: string }>;
      xRange: number[];
      yRange: number[];
      specialPoints: Array<{ x: number; y: number; label: string }>;
      gridLines: boolean;
    }>([
      {
        role: 'system',
        content:
          'You are a math visualization expert. Extract plottable functions from problems. Return JSON.',
      },
      { role: 'user', content: prompt },
    ]);

    if (result && result.canPlot && result.functions) {
      // Generate points for each function
      const functionsWithPoints = result.functions.map((func) => ({
        ...func,
        points: this.evaluateFunctionPoints(
          func.expression,
          result.xRange || [-10, 10],
          200, // Number of points
        ),
      }));

      const enhancedResult = {
        ...result,
        functions: functionsWithPoints,
      };

      await this.db.query(
        'UPDATE problem_solving_sessions SET graph_data = $1, updated_at = $2 WHERE id = $3',
        [JSON.stringify(enhancedResult), new Date(), sessionId],
      );

      return enhancedResult;
    }

    if (result) {
      await this.db.query(
        'UPDATE problem_solving_sessions SET graph_data = $1, updated_at = $2 WHERE id = $3',
        [JSON.stringify(result), new Date(), sessionId],
      );
    }

    return result;
  }

  /**
   * Evaluate a mathematical expression and generate points for plotting
   */
  private evaluateFunctionPoints(
    expression: string,
    xRange: number[],
    numPoints: number = 200,
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const [minX, maxX] = xRange;
    const step = (maxX - minX) / (numPoints - 1);

    try {
      // mathjs already understands standard notation
      // Just replace ^ with ** for power
      const normalizedExpr = expression.replace(/\^/g, '**');

      this.logger.debug(`Evaluating expression: ${normalizedExpr}`);

      // Compile the expression
      const node = math.parse(normalizedExpr);
      const code = node.compile();

      for (let i = 0; i < numPoints; i++) {
        const x = minX + i * step;

        try {
          const y = code.evaluate({ x });

          // Skip invalid points (NaN, Infinity, undefined)
          if (typeof y === 'number' && isFinite(y)) {
            points.push({
              x: Math.round(x * 10000) / 10000, // Round to 4 decimal places
              y: Math.round(y * 10000) / 10000,
            });
          }
        } catch (e) {
          // Skip points that can't be evaluated (e.g., division by zero)
          continue;
        }
      }

      this.logger.debug(`Generated ${points.length} points for expression: ${expression}`);
      return points;
    } catch (error) {
      this.logger.error(`Failed to evaluate expression "${expression}": ${error.message}`);
      // Return empty points array if expression can't be evaluated
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // BATCH SOLVE (PDF)
  // ═══════════════════════════════════════════

  async batchExtractProblems(text: string) {
    const prompt = `Extract individual problems/questions from this text. Each problem should be a separate item.

Text:
${text}

Return a JSON array of strings, each being one complete problem:
["problem 1 text", "problem 2 text", ...]`;

    const result = await this.aiService.completeJson<string[]>([
      {
        role: 'system',
        content:
          'You are a text extraction expert. Extract individual problems from worksheets/documents. Return JSON array of strings.',
      },
      { role: 'user', content: prompt },
    ]);

    return result || [];
  }

  // ═══════════════════════════════════════════
  // AUDIO NARRATION (TTS-like explanation)
  // ═══════════════════════════════════════════

  async getNarrationText(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const detectedLang = this.detectLanguage(session.problem);

    const prompt = `[DETECTED LANGUAGE: ${detectedLang}] — Write in ${detectedLang}.

Convert this solution into a natural spoken narration script. Write it as if a tutor is explaining to a student out loud.
- Do NOT use LaTeX notation (replace with spoken words like "x squared" instead of "$x^2$")
- Use natural pauses (indicated by "...")
- Be conversational and encouraging
- Number each step clearly

Problem: "${session.problem}"
${session.solutionResult?.output ? `Solution: ${session.solutionResult.output}` : ''}
${session.finalAnswer ? `Final Answer: ${session.finalAnswer}` : ''}`;

    const response = await this.aiService.complete([
      {
        role: 'system',
        content: `You are a friendly tutor narrating a solution. Write in ${detectedLang}. Make it sound natural when read aloud.`,
      },
      { role: 'user', content: prompt },
    ]);

    return { narration: response.content, language: detectedLang };
  }

  // ═══════════════════════════════════════════
  // SIMILAR PROBLEMS
  // ═══════════════════════════════════════════

  async generateSimilarProblems(sessionId: string, userId: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const detectedLang = this.detectLanguage(session.problem);

    const prompt = `[DETECTED LANGUAGE: ${detectedLang}] — Generate ALL problem text in ${detectedLang}. Do NOT use any other language or script.

Given this problem: "${session.problem}"
${session.subject ? `Subject: ${session.subject}` : ''}
${session.finalAnswer ? `Answer: ${session.finalAnswer}` : ''}

Generate 5 similar practice problems. For each, vary the difficulty and change specific values/concepts while keeping the same type of problem.

Return a JSON array with objects having these fields:
- id: a unique string (e.g. "sim-1", "sim-2")
- problem: the problem text
- difficulty: "easy", "medium", or "hard"
- similarity: brief explanation of what makes it similar to the original
- hint: an optional hint for solving it`;

    const result = await this.aiService.completeJson<
      Array<{ id: string; problem: string; difficulty: string; similarity: string; hint?: string }>
    >([
      {
        role: 'system',
        content: `You are a math/science tutor. Generate practice problems in JSON format. You MUST write all text in ${detectedLang}.`,
      },
      { role: 'user', content: prompt },
    ]);

    return result || [];
  }

  // ═══════════════════════════════════════════
  // STUDY BUDDY CHAT
  // ═══════════════════════════════════════════

  private detectLanguage(text: string): string {
    const counts: Record<string, number> = {
      bengali: 0,
      devanagari: 0,
      latin: 0,
      arabic: 0,
    };
    for (const char of text) {
      const code = char.codePointAt(0)!;
      if (code >= 0x0980 && code <= 0x09ff) counts.bengali++;
      else if (code >= 0x0900 && code <= 0x097f) counts.devanagari++;
      else if (code >= 0x0600 && code <= 0x06ff) counts.arabic++;
      else if ((code >= 0x0041 && code <= 0x007a) || (code >= 0x00c0 && code <= 0x024f))
        counts.latin++;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === 0) return 'English';
    const map: Record<string, string> = {
      bengali: 'Bengali (Bangla)',
      devanagari: 'Hindi',
      latin: 'English',
      arabic: 'Arabic',
    };
    return map[sorted[0][0]] || 'English';
  }

  async sendChatMessage(sessionId: string, userId: string, message: string) {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const msgId = uuidv4();
    const now = new Date();
    const detectedLang = this.detectLanguage(message);

    await this.db.query(
      `INSERT INTO problem_chat_messages (id, session_id, role, message, created_at)
       VALUES ($1, $2, 'user', $3, $4)`,
      [msgId, sessionId, message, now],
    );

    const history = await this.db.queryMany<{ role: string; message: string }>(
      `SELECT role, message FROM problem_chat_messages
       WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [sessionId],
    );

    const solutionContext = [
      `Problem: ${session.problem}`,
      session.subject ? `Subject: ${session.subject}` : '',
      session.finalAnswer ? `Answer: ${session.finalAnswer}` : '',
      session.solutionResult?.output ? `Solution: ${session.solutionResult.output}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `You are a friendly Study Buddy tutor. The student has solved a problem and is asking follow-up questions.

Context of the solved problem:
${solutionContext}

[DETECTED LANGUAGE: ${detectedLang}] — You MUST reply in ${detectedLang}. Do NOT use any other language or script.

Guidelines:
- Be encouraging and supportive
- Use LaTeX notation ($..$ for inline, $$...$$ for block) for math expressions
- Reference specific steps from the solution when relevant
- If the student seems confused, break it down into simpler terms
- Suggest related concepts they might want to explore
- Keep responses concise but thorough`,
      },
      ...history.map((h) => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: h.message,
      })),
    ];

    const response = await this.aiService.complete(messages);
    const tutorMsgId = uuidv4();

    await this.db.query(
      `INSERT INTO problem_chat_messages (id, session_id, role, message, created_at)
       VALUES ($1, $2, 'tutor', $3, $4)`,
      [tutorMsgId, sessionId, response.content, new Date()],
    );

    return {
      id: tutorMsgId,
      role: 'tutor',
      message: response.content,
      createdAt: new Date().toISOString(),
    };
  }

  async getChatMessages(sessionId: string, userId: string) {
    await this.findByIdWithAccess(sessionId, userId);

    const rows = await this.db.queryMany(
      `SELECT id, role, message, created_at FROM problem_chat_messages
       WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId],
    );

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      role: r.role as string,
      message: r.message as string,
      createdAt: (r.created_at as Date).toISOString(),
    }));
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  async findById(id: string): Promise<ProblemSolvingSession | null> {
    const result = await this.db.queryOne<ProblemSolvingSession>(
      'SELECT * FROM problem_solving_sessions WHERE id = $1',
      [id],
    );
    return result ? this.mapSession(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<ProblemSolvingSession> {
    const session = await this.findById(id);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return session;
  }

  async findByUser(userId: string): Promise<ProblemSolvingSession[]> {
    const results = await this.db.queryMany<ProblemSolvingSession>(
      'SELECT * FROM problem_solving_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return results.map((r) => this.mapSession(r));
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findByIdWithAccess(id, userId);
    await this.db.query('DELETE FROM problem_solving_sessions WHERE id = $1', [id]);
    this.logger.log(`Session deleted: ${id}`);
  }

  private async updateStatus(id: string, status: ProblemSolvingSession['status']): Promise<void> {
    await this.db.query(
      'UPDATE problem_solving_sessions SET status = $1, updated_at = $2 WHERE id = $3',
      [status, new Date(), id],
    );
  }

  private async saveStep(
    id: string,
    field: 'analysis' | 'solution' | 'verification',
    step: AgentStep,
  ): Promise<void> {
    const column =
      field === 'analysis'
        ? 'analysis_result'
        : field === 'solution'
          ? 'solution_result'
          : 'verification_result';
    await this.db.query(
      `UPDATE problem_solving_sessions SET ${column} = $1, updated_at = $2 WHERE id = $3`,
      [JSON.stringify(step), new Date(), id],
    );
  }

  private mapSession(row: unknown): ProblemSolvingSession {
    const r = row as Record<string, unknown>;
    const parseStep = (data: unknown): AgentStep | null => {
      if (!data) return null;
      return typeof data === 'string' ? JSON.parse(data) : (data as AgentStep);
    };
    const parseJson = (data: unknown): unknown => {
      if (!data) return null;
      if (typeof data === 'string')
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      return data;
    };

    return {
      id: r.id as string,
      userId: r.user_id as string,
      problem: r.problem as string,
      subject: r.subject as string | null,
      imageUrl: r.image_url as string | null,
      status: r.status as ProblemSolvingSession['status'],
      analysisResult: parseStep(r.analysis_result),
      solutionResult: parseStep(r.solution_result),
      verificationResult: parseStep(r.verification_result),
      finalAnswer: r.final_answer as string | null,
      isCorrect: r.is_correct as boolean | null,
      hintSteps: (parseJson(r.hint_steps) as unknown[]) || [],
      complexityLevel: (r.complexity_level as string) || 'intermediate',
      graphData: parseJson(r.graph_data),
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
