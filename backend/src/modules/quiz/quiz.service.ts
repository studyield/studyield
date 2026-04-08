import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { QuizGeneratorService, QuestionType } from './quiz-generator.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface Quiz {
  id: string;
  userId: string;
  studySetId: string | null;
  title: string;
  description: string | null;
  questionCount: number;
  timeLimit: number | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
  createdAt: Date;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  studySetId?: string;
  timeLimit?: number;
  isPublic?: boolean;
  questions?: Array<{
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty?: string;
  }>;
}

export interface GenerateQuizDto {
  studySetId?: string;
  content?: string;
  title: string;
  questionCount?: number;
  questionTypes?: QuestionType[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export interface SubmitAttemptDto {
  answers: Array<{
    questionId: string;
    answer: string;
    timeSpent: number;
  }>;
  totalTimeSpent: number;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly quizGenerator: QuizGeneratorService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateQuizDto): Promise<Quiz> {
    const id = uuidv4();
    const now = new Date();

    await this.db.queryOne<Quiz>(
      `INSERT INTO quizzes (id, user_id, study_set_id, title, description, time_limit, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        userId,
        dto.studySetId || null,
        dto.title,
        dto.description || null,
        dto.timeLimit || null,
        dto.isPublic || false,
        now,
        now,
      ],
    );

    if (dto.questions && dto.questions.length > 0) {
      for (let i = 0; i < dto.questions.length; i++) {
        await this.addQuestion(id, dto.questions[i], i);
      }
    }

    this.logger.log(`Quiz created: ${id}`);
    return this.findById(id) as Promise<Quiz>;
  }

  async generate(userId: string, dto: GenerateQuizDto): Promise<Quiz> {
    let content = dto.content || '';

    if (dto.studySetId && !content) {
      const flashcards = await this.db.queryMany<{ front: string; back: string }>(
        'SELECT front, back FROM flashcards WHERE study_set_id = $1',
        [dto.studySetId],
      );

      if (flashcards.length === 0) {
        throw new NotFoundException('No flashcards found in study set');
      }

      content = flashcards.map((f) => `Q: ${f.front}\nA: ${f.back}`).join('\n\n');
    }

    if (!content) {
      throw new Error('No content provided for quiz generation');
    }

    const questions = await this.quizGenerator.generateQuestions({
      content,
      questionCount: dto.questionCount || 10,
      questionTypes: dto.questionTypes || ['multiple_choice', 'true_false'],
      difficulty: dto.difficulty || 'mixed',
    });

    const quiz = await this.create(userId, {
      title: dto.title,
      studySetId: dto.studySetId,
      questions: questions.map((q) => ({
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
    });

    return quiz;
  }

  async findById(id: string): Promise<Quiz | null> {
    const result = await this.db.queryOne<Quiz>(
      `SELECT q.*,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q WHERE q.id = $1`,
      [id],
    );
    return result ? this.mapQuiz(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<Quiz> {
    const quiz = await this.findById(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (!quiz.isPublic && quiz.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return quiz;
  }

  async findByUser(userId: string): Promise<Quiz[]> {
    const results = await this.db.queryMany<Quiz>(
      `SELECT q.*,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q
       WHERE q.user_id = $1
       ORDER BY q.updated_at DESC`,
      [userId],
    );
    return results.map((r) => this.mapQuiz(r));
  }

  async findByStudySet(studySetId: string): Promise<Quiz[]> {
    const results = await this.db.queryMany<Quiz>(
      `SELECT q.*,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
       FROM quizzes q
       WHERE q.study_set_id = $1
       ORDER BY q.created_at DESC`,
      [studySetId],
    );
    return results.map((r) => this.mapQuiz(r));
  }

  async getQuestions(quizId: string): Promise<QuizQuestion[]> {
    const results = await this.db.queryMany<QuizQuestion>(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY "order" ASC',
      [quizId],
    );
    return results.map((r) => this.mapQuestion(r));
  }

  async submitAttempt(quizId: string, userId: string, dto: SubmitAttemptDto): Promise<QuizAttempt> {
    await this.findByIdWithAccess(quizId, userId);

    const questions = await this.getQuestions(quizId);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let correctCount = 0;
    const attemptId = uuidv4();
    const now = new Date();

    await this.db.query(
      `INSERT INTO quiz_attempts (id, quiz_id, user_id, time_spent, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [attemptId, quizId, userId, dto.totalTimeSpent, now],
    );

    for (const answer of dto.answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const isCorrect = this.checkAnswer(question, answer.answer);
      if (isCorrect) correctCount++;

      await this.db.query(
        `INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, user_answer, is_correct, time_spent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), attemptId, answer.questionId, answer.answer, isCorrect, answer.timeSpent],
      );
    }

    const score = (correctCount / questions.length) * 100;

    await this.db.query(
      `UPDATE quiz_attempts SET score = $1, total_questions = $2, completed_at = $3 WHERE id = $4`,
      [score, questions.length, now, attemptId],
    );

    const attempt = await this.db.queryOne<QuizAttempt>(
      'SELECT * FROM quiz_attempts WHERE id = $1',
      [attemptId],
    );

    // Send notification based on score
    await this.sendQuizCompletionNotification(userId, score, correctCount, questions.length);

    this.logger.log(`Quiz attempt submitted: ${attemptId}, score: ${score.toFixed(1)}%`);
    return this.mapAttempt(attempt!);
  }

  async getAttempts(quizId: string, userId: string): Promise<QuizAttempt[]> {
    const results = await this.db.queryMany<QuizAttempt>(
      `SELECT * FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [quizId, userId],
    );
    return results.map((r) => this.mapAttempt(r));
  }

  async getAttemptDetails(
    attemptId: string,
    userId: string,
  ): Promise<{ attempt: QuizAttempt; answers: QuizAttemptAnswer[] }> {
    const attempt = await this.db.queryOne<QuizAttempt>(
      'SELECT * FROM quiz_attempts WHERE id = $1',
      [attemptId],
    );

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if ((attempt as unknown as Record<string, unknown>).user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const answers = await this.db.queryMany<QuizAttemptAnswer>(
      'SELECT * FROM quiz_attempt_answers WHERE attempt_id = $1',
      [attemptId],
    );

    return {
      attempt: this.mapAttempt(attempt),
      answers: answers.map((a) => this.mapAttemptAnswer(a)),
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const quiz = await this.findById(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (quiz.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.db.query(
      'DELETE FROM quiz_attempt_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = $1)',
      [id],
    );
    await this.db.query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [id]);
    await this.db.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [id]);
    await this.db.query('DELETE FROM quizzes WHERE id = $1', [id]);

    this.logger.log(`Quiz deleted: ${id}`);
  }

  private async addQuestion(
    quizId: string,
    question: {
      type: QuestionType;
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
      difficulty?: string;
    },
    order: number,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO quiz_questions (id, quiz_id, type, question, options, correct_answer, explanation, difficulty, "order")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuidv4(),
        quizId,
        question.type,
        question.question,
        question.options ? JSON.stringify(question.options) : null,
        question.correctAnswer,
        question.explanation || null,
        question.difficulty || 'medium',
        order,
      ],
    );
  }

  private async sendQuizCompletionNotification(
    userId: string,
    score: number,
    correctCount: number,
    totalQuestions: number,
  ): Promise<void> {
    try {
      let title: string;
      let message: string;
      let type: 'success' | 'info' | 'warning' | 'reminder';

      if (score >= 90) {
        type = 'success';
        title = '🎉 Perfect Score!';
        message = `Amazing! You scored ${score.toFixed(0)}% (${correctCount}/${totalQuestions} correct). Keep up the great work!`;
      } else if (score >= 70) {
        type = 'success';
        title = '✅ Great Job!';
        message = `Well done! You scored ${score.toFixed(0)}% (${correctCount}/${totalQuestions} correct). You're making progress!`;
      } else if (score >= 50) {
        type = 'info';
        title = '📚 Good Effort!';
        message = `You scored ${score.toFixed(0)}% (${correctCount}/${totalQuestions} correct). Review the material and try again!`;
      } else {
        type = 'warning';
        title = '💪 Keep Practicing!';
        message = `You scored ${score.toFixed(0)}% (${correctCount}/${totalQuestions} correct). Don't give up, practice makes perfect!`;
      }

      await this.notificationsService.create({
        userId,
        type,
        title,
        message,
        link: '/quiz/history',
      });
    } catch (error) {
      this.logger.error(`Failed to send quiz completion notification: ${error.message}`);
    }
  }

  private checkAnswer(question: QuizQuestion, userAnswer: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim();
    return normalize(question.correctAnswer) === normalize(userAnswer);
  }

  private mapQuiz(row: unknown): Quiz {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      studySetId: r.study_set_id as string | null,
      title: r.title as string,
      description: r.description as string | null,
      questionCount: parseInt(String(r.question_count || 0), 10),
      timeLimit: r.time_limit as number | null,
      isPublic: r.is_public as boolean,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }

  private mapQuestion(row: unknown): QuizQuestion {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      quizId: r.quiz_id as string,
      type: r.type as QuestionType,
      question: r.question as string,
      options: r.options
        ? typeof r.options === 'string'
          ? JSON.parse(r.options)
          : (r.options as string[])
        : null,
      correctAnswer: r.correct_answer as string,
      explanation: r.explanation as string | null,
      difficulty: r.difficulty as string,
      order: r.order as number,
    };
  }

  private mapAttempt(row: unknown): QuizAttempt {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      quizId: r.quiz_id as string,
      userId: r.user_id as string,
      score: parseFloat(String(r.score || 0)),
      totalQuestions: r.total_questions as number,
      timeSpent: r.time_spent as number,
      completedAt: r.completed_at ? new Date(r.completed_at as string) : new Date(),
      createdAt: new Date(r.created_at as string),
    };
  }

  private mapAttemptAnswer(row: unknown): QuizAttemptAnswer {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      attemptId: r.attempt_id as string,
      questionId: r.question_id as string,
      userAnswer: r.user_answer as string,
      isCorrect: r.is_correct as boolean,
      timeSpent: r.time_spent as number,
    };
  }
}
