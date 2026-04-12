import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'coding'
  | 'essay';

export interface MatchingPair {
  left: string;
  right: string;
}

export interface CodingTestCase {
  input: string;
  expected: string;
}

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** For matching questions: pairs of left-right items */
  pairs?: MatchingPair[];
  /** For ordering questions: items to order */
  items?: string[];
  /** For ordering questions: correct order as indices */
  correctOrder?: number[];
  /** For coding questions: programming language */
  language?: string;
  /** For coding questions: test cases */
  testCases?: CodingTestCase[];
  /** For essay questions: grading rubric */
  rubric?: string;
  /** For essay questions: maximum word count */
  maxWords?: number;
}

export interface GenerateQuizOptions {
  content: string;
  questionCount?: number;
  questionTypes?: QuestionType[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  focusTopics?: string[];
}

@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);

  constructor(private readonly aiService: AiService) {}

  async generateQuestions(options: GenerateQuizOptions): Promise<GeneratedQuestion[]> {
    const {
      content,
      questionCount = 10,
      questionTypes = ['multiple_choice', 'true_false', 'short_answer'],
      difficulty = 'mixed',
      focusTopics = [],
    } = options;

    const systemPrompt = `You are an expert educational content creator specializing in generating high-quality quiz questions.

Generate ${questionCount} questions based on the provided study material.

Requirements:
- Question types to include: ${questionTypes.join(', ')}
- Difficulty level: ${difficulty}
${focusTopics.length > 0 ? `- Focus on these topics: ${focusTopics.join(', ')}` : ''}
- Each question should test understanding, not just memorization
- Provide clear explanations for each answer
- For multiple choice, provide 4 options with only one correct answer
- Ensure questions are varied and cover different aspects of the material

Return the questions in this exact JSON format:
{
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer" | "fill_blank" | "matching" | "ordering" | "coding" | "essay",
      "question": "The question text",
      "options": ["A", "B", "C", "D"], // only for multiple_choice
      "correctAnswer": "The correct answer", // for multiple_choice, true_false, short_answer, fill_blank
      "explanation": "Why this is correct",
      "difficulty": "easy" | "medium" | "hard",

      // For matching questions only:
      "pairs": [{"left": "Term", "right": "Definition"}, ...], // 4-6 pairs to match

      // For ordering questions only:
      "items": ["Step 1", "Step 2", "Step 3"], // items in correct order
      "correctOrder": [0, 1, 2], // indices representing the correct sequence

      // For coding questions only:
      "language": "python", // programming language
      "testCases": [{"input": "...", "expected": "..."}], // test cases for validation

      // For essay questions only:
      "rubric": "Key points: X, Y, Z", // grading criteria
      "maxWords": 500 // maximum word count
    }
  ]
}

Important type-specific rules:
- matching: Always include "pairs" array with 4-6 items. Set "correctAnswer" to JSON string of the pairs array.
- ordering: Always include "items" and "correctOrder". Set "correctAnswer" to JSON string of correctOrder array.
- coding: Always include "language", "testCases" with at least 2 test cases. Set "correctAnswer" to a sample solution.
- essay: Always include "rubric" and "maxWords". Set "correctAnswer" to key points expected.`;

    const userPrompt = `Study Material:
${content}

Generate ${questionCount} quiz questions based on this material.`;

    const response = await this.aiService.completeJson<{ questions: GeneratedQuestion[] }>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 4096 },
    );

    this.logger.log(`Generated ${response.questions.length} questions`);
    return response.questions;
  }

  async generateFromFlashcards(
    flashcards: Array<{ front: string; back: string }>,
    questionCount = 10,
  ): Promise<GeneratedQuestion[]> {
    const content = flashcards
      .map((f, i) => `${i + 1}. Q: ${f.front}\n   A: ${f.back}`)
      .join('\n\n');

    return this.generateQuestions({
      content,
      questionCount,
      questionTypes: ['multiple_choice', 'true_false', 'fill_blank'],
      difficulty: 'mixed',
    });
  }

  async generateAdaptive(
    content: string,
    userPerformance: { correct: number; total: number },
    previousQuestions: string[],
  ): Promise<GeneratedQuestion[]> {
    const accuracy =
      userPerformance.total > 0 ? userPerformance.correct / userPerformance.total : 0.5;

    let difficulty: 'easy' | 'medium' | 'hard';
    if (accuracy < 0.4) {
      difficulty = 'easy';
    } else if (accuracy > 0.8) {
      difficulty = 'hard';
    } else {
      difficulty = 'medium';
    }

    const systemPrompt = `You are an expert educational content creator specializing in adaptive quiz questions.

Generate 5 questions based on the provided study material.
The student's current accuracy is ${(accuracy * 100).toFixed(0)}%, so generate ${difficulty} difficulty questions.

${previousQuestions.length > 0 ? `Avoid repeating these previous questions:\n${previousQuestions.join('\n')}` : ''}

Return the questions in this exact JSON format:
{
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer" | "fill_blank" | "matching" | "ordering" | "coding" | "essay",
      "question": "The question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "The correct answer",
      "explanation": "Why this is correct",
      "difficulty": "${difficulty}",
      "pairs": [{"left": "Term", "right": "Definition"}, ...],
      "items": ["Step 1", "Step 2", "Step 3"],
      "correctOrder": [0, 1, 2],
      "language": "python",
      "testCases": [{"input": "...", "expected": "..."}],
      "rubric": "Key points: X, Y, Z",
      "maxWords": 500
    }
  ]
}
Include only the fields relevant to each question type.`;

    const response = await this.aiService.completeJson<{ questions: GeneratedQuestion[] }>(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ],
      { maxTokens: 2048 },
    );

    return response.questions;
  }
}
