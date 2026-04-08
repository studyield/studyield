import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { AiService } from '../ai/ai.service';

export interface ChallengeMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

export interface TeachBackSession {
  id: string;
  userId: string;
  topic: string;
  referenceContent: string | null;
  userExplanation: string | null;
  evaluation: TeachBackEvaluation | null;
  status: 'pending' | 'submitted' | 'evaluated';
  challengeMessages: ChallengeMessage[];
  studySetId: string | null;
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeachBackEvaluation {
  overallScore: number;
  accuracy: { score: number; feedback: string };
  clarity: { score: number; feedback: string };
  completeness: { score: number; feedback: string };
  understanding: { score: number; feedback: string };
  misconceptions: string[];
  strengths: string[];
  suggestions: string[];
  followUpQuestions: string[];
}

export interface CreateTeachBackDto {
  topic: string;
  referenceContent?: string;
  studySetId?: string;
}

export interface ChallengeResponseDto {
  message: string;
}

export interface CreateFromStudySetDto {
  studySetId: string;
}

export interface SubmitExplanationDto {
  explanation: string;
  difficultyLevel?: 'eli5' | 'classmate' | 'expert';
}

export interface TopicEssentials {
  summary: string;
  keyTerms: string[];
  commonPitfalls: string[];
  examplePrompt: string;
}

@Injectable()
export class TeachBackService {
  private readonly logger = new Logger(TeachBackService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateTeachBackDto): Promise<TeachBackSession> {
    const id = uuidv4();
    const now = new Date();

    // Use basic columns that always exist for backward compatibility
    const result = await this.db.queryOne<TeachBackSession>(
      `INSERT INTO teach_back_sessions (id, user_id, topic, reference_content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       RETURNING *`,
      [id, userId, dto.topic, dto.referenceContent || null, now, now],
    );

    // Set study_set_id if provided (column may not exist on older schemas)
    if (dto.studySetId) {
      try {
        await this.db.query(`UPDATE teach_back_sessions SET study_set_id = $1 WHERE id = $2`, [
          dto.studySetId,
          id,
        ]);
      } catch (err) {
        this.logger.warn(`study_set_id column not available: ${err}`);
      }
    }

    this.logger.log(`Teach-back session created: ${id}`);
    return this.mapSession(result!);
  }

  async submitExplanation(
    sessionId: string,
    userId: string,
    dto: SubmitExplanationDto,
  ): Promise<TeachBackSession> {
    await this.findByIdWithAccess(sessionId, userId);

    await this.db.query(
      `UPDATE teach_back_sessions SET user_explanation = $1, status = 'submitted', updated_at = $2 WHERE id = $3`,
      [dto.explanation, new Date(), sessionId],
    );

    // Set difficulty_level if provided (column may not exist on older schemas)
    if (dto.difficultyLevel) {
      try {
        await this.db.query(`UPDATE teach_back_sessions SET difficulty_level = $1 WHERE id = $2`, [
          dto.difficultyLevel,
          sessionId,
        ]);
      } catch (err) {
        this.logger.warn(`difficulty_level column not available`);
      }
    }

    return this.findById(sessionId) as Promise<TeachBackSession>;
  }

  async evaluate(sessionId: string, userId: string): Promise<TeachBackSession> {
    const session = await this.findByIdWithAccess(sessionId, userId);

    if (!session.userExplanation) {
      throw new Error('No explanation submitted yet');
    }

    const evaluationPrompt = `You are the Feynman Technique evaluator. Evaluate how well the student explains the topic as if teaching it to someone else.

Topic: ${session.topic}
${session.referenceContent ? `Reference Material:\n${session.referenceContent}\n` : ''}
Student's Explanation:
${session.userExplanation}

Evaluate based on:
1. Accuracy - Are the facts and concepts correct?
2. Clarity - Is the explanation clear and easy to understand?
3. Completeness - Does it cover the key aspects?
4. Understanding - Does the student show deep understanding or just memorization?

Return in this JSON format:
{
  "overallScore": 0-100,
  "accuracy": { "score": 0-100, "feedback": "specific feedback" },
  "clarity": { "score": 0-100, "feedback": "specific feedback" },
  "completeness": { "score": 0-100, "feedback": "specific feedback" },
  "understanding": { "score": 0-100, "feedback": "specific feedback" },
  "misconceptions": ["any misconceptions identified"],
  "strengths": ["what they did well"],
  "suggestions": ["how to improve"],
  "followUpQuestions": ["questions to deepen understanding"]
}`;

    const evaluation = await this.aiService.completeJson<TeachBackEvaluation>(
      [
        {
          role: 'system',
          content: 'You are an expert educational evaluator using the Feynman Technique.',
        },
        { role: 'user', content: evaluationPrompt },
      ],
      { maxTokens: 2048 },
    );

    // Award XP based on score
    let xp = 15;
    if (evaluation.overallScore >= 90) xp = 50;
    else if (evaluation.overallScore >= 70) xp = 30;

    await this.db.query(
      `UPDATE teach_back_sessions SET evaluation = $1, status = 'evaluated', updated_at = $2 WHERE id = $3`,
      [JSON.stringify(evaluation), new Date(), sessionId],
    );

    // Set xp_awarded (column may not exist on older schemas)
    try {
      await this.db.query(`UPDATE teach_back_sessions SET xp_awarded = $1 WHERE id = $2`, [
        xp,
        sessionId,
      ]);
    } catch (err) {
      this.logger.warn(`xp_awarded column not available`);
    }

    // Record XP event
    try {
      await this.db.query(
        `INSERT INTO user_xp_events (id, user_id, type, xp, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), userId, 'teach_back', xp, new Date()],
      );
    } catch (err) {
      this.logger.warn(`Failed to award XP: ${err}`);
    }

    this.logger.log(
      `Teach-back evaluated: ${sessionId}, score: ${evaluation.overallScore}, xp: ${xp}`,
    );
    return this.findById(sessionId) as Promise<TeachBackSession>;
  }

  async findById(id: string): Promise<TeachBackSession | null> {
    const result = await this.db.queryOne<TeachBackSession>(
      'SELECT * FROM teach_back_sessions WHERE id = $1',
      [id],
    );
    return result ? this.mapSession(result) : null;
  }

  async findByIdWithAccess(id: string, userId: string): Promise<TeachBackSession> {
    const session = await this.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');
    return session;
  }

  async findByUser(userId: string): Promise<TeachBackSession[]> {
    const results = await this.db.queryMany<TeachBackSession>(
      'SELECT * FROM teach_back_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return results.map((r) => this.mapSession(r));
  }

  async getEssentials(sessionId: string, userId: string): Promise<TopicEssentials> {
    const session = await this.findByIdWithAccess(sessionId, userId);

    const essentials = await this.aiService.completeJson<TopicEssentials>(
      [
        {
          role: 'system',
          content:
            'You are a study coach preparing a student to explain a topic using the Feynman Technique. Generate a concise primer.',
        },
        {
          role: 'user',
          content: `Topic: ${session.topic}\n${session.referenceContent ? `Reference:\n${session.referenceContent}\n` : ''}\nReturn JSON:\n{\n  "summary": "1-2 sentence overview",\n  "keyTerms": ["term1", "term2", ...],\n  "commonPitfalls": ["pitfall1", "pitfall2"],\n  "examplePrompt": "A creative way to frame the explanation, e.g. Explain as if teaching a curious 10-year-old"\n}`,
        },
      ],
      { maxTokens: 1024 },
    );

    return essentials;
  }

  // ─── "Convince the AI" Challenge Mode ───

  async startChallenge(
    sessionId: string,
    userId: string,
  ): Promise<{ messages: ChallengeMessage[] }> {
    const session = await this.findByIdWithAccess(sessionId, userId);

    if (!session.userExplanation) {
      throw new BadRequestException('Submit your explanation first before starting the challenge');
    }

    const firstQuestion = await this.aiService.completeJson<{ question: string }>(
      [
        {
          role: 'system',
          content: `You are a skeptical but friendly student. The user just explained "${session.topic}" to you. Ask a probing question that tests their understanding. Be specific, challenge assumptions, and ask "why" or "how". Return JSON: { "question": "your question" }`,
        },
        { role: 'user', content: `Here is my explanation:\n\n${session.userExplanation}` },
      ],
      { maxTokens: 512 },
    );

    const messages: ChallengeMessage[] = [
      { role: 'ai', content: firstQuestion.question, timestamp: new Date().toISOString() },
    ];

    try {
      await this.db.query(
        `UPDATE teach_back_sessions SET challenge_messages = $1, updated_at = $2 WHERE id = $3`,
        [JSON.stringify(messages), new Date(), sessionId],
      );
    } catch (err) {
      this.logger.warn(`challenge_messages column not available`);
    }

    return { messages };
  }

  async respondToChallenge(
    sessionId: string,
    userId: string,
    dto: ChallengeResponseDto,
  ): Promise<{ messages: ChallengeMessage[]; convinced: boolean }> {
    const session = await this.findByIdWithAccess(sessionId, userId);
    const messages: ChallengeMessage[] = [...(session.challengeMessages || [])];

    messages.push({ role: 'user', content: dto.message, timestamp: new Date().toISOString() });

    // Build conversation history for AI
    const chatHistory = messages.map((m) => ({
      role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

    const aiResponse = await this.aiService.completeJson<{
      response: string;
      convinced: boolean;
      reason: string;
    }>(
      [
        {
          role: 'system',
          content: `You are a skeptical student learning about "${session.topic}". The user is trying to convince you they understand the topic by answering your probing questions.

Rules:
- If the user's response demonstrates deep understanding, set convinced=true and give an encouraging response
- If there are gaps or vague answers, set convinced=false and ask a follow-up question that digs deeper
- Be fair — don't be impossible to convince. 3-5 good exchanges should suffice.
- Keep questions specific and focused

Return JSON: { "response": "your reply or next question", "convinced": true/false, "reason": "brief reason for your decision" }`,
        },
        ...chatHistory,
      ],
      { maxTokens: 512 },
    );

    messages.push({
      role: 'ai',
      content: aiResponse.response,
      timestamp: new Date().toISOString(),
    });

    try {
      await this.db.query(
        `UPDATE teach_back_sessions SET challenge_messages = $1, updated_at = $2 WHERE id = $3`,
        [JSON.stringify(messages), new Date(), sessionId],
      );
    } catch (err) {
      this.logger.warn(`challenge_messages column not available`);
    }

    // Award bonus XP if convinced
    if (aiResponse.convinced) {
      try {
        await this.db.query(
          `INSERT INTO user_xp_events (id, user_id, type, xp, created_at) VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), userId, 'teach_back_challenge', 20, new Date()],
        );
      } catch (err) {
        this.logger.warn(`Failed to award challenge XP: ${err}`);
      }
    }

    return { messages, convinced: aiResponse.convinced };
  }

  // ─── Auto-generate from Study Sets ───

  async createFromStudySet(userId: string, studySetId: string): Promise<TeachBackSession> {
    // Verify study set access
    const studySet = await this.db.queryOne<Record<string, unknown>>(
      `SELECT s.*, (SELECT COUNT(*) FROM flashcards WHERE study_set_id = s.id) as card_count
       FROM study_sets s WHERE s.id = $1 AND (s.user_id = $2 OR s.is_public = true)`,
      [studySetId, userId],
    );

    if (!studySet) throw new NotFoundException('Study set not found');

    // Get flashcards to build reference content
    const flashcards = await this.db.queryMany<Record<string, unknown>>(
      `SELECT front, back FROM flashcards WHERE study_set_id = $1 ORDER BY created_at ASC LIMIT 30`,
      [studySetId],
    );

    if (flashcards.length === 0) {
      throw new BadRequestException('Study set has no flashcards');
    }

    // Build a topic and reference from flashcard content
    const topic = (studySet.title as string) || (studySet.name as string) || 'Study Set Topic';
    const referenceContent = flashcards
      .map((fc, i) => `${i + 1}. ${fc.front}\n   → ${fc.back}`)
      .join('\n\n');

    return this.create(userId, {
      topic: `${topic} — Key Concepts`,
      referenceContent,
      studySetId,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findByIdWithAccess(id, userId);
    await this.db.query('DELETE FROM teach_back_sessions WHERE id = $1', [id]);
  }

  private mapSession(row: unknown): TeachBackSession {
    const r = row as Record<string, unknown>;
    const parseJson = (val: unknown) => {
      if (!val) return null;
      return typeof val === 'string' ? JSON.parse(val) : val;
    };
    return {
      id: r.id as string,
      userId: r.user_id as string,
      topic: r.topic as string,
      referenceContent: r.reference_content as string | null,
      userExplanation: r.user_explanation as string | null,
      evaluation: r.evaluation ? (parseJson(r.evaluation) as TeachBackEvaluation) : null,
      status: r.status as TeachBackSession['status'],
      challengeMessages: r.challenge_messages
        ? (parseJson(r.challenge_messages) as ChallengeMessage[])
        : [],
      studySetId: (r.study_set_id as string) || null,
      xpAwarded: (r.xp_awarded as number) || 0,
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
    };
  }
}
