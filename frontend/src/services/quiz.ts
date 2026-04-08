import api from './api';
import { ENDPOINTS } from '@/config/api';
import type { Quiz, QuizQuestion, QuizAttempt, QuizAttemptDetail } from '@/types';

export interface GenerateQuizParams {
  studySetId: string;
  title: string;
  questionCount: number;
  questionTypes: string[];
  timeLimit?: number;
}

export const quizService = {
  async generate(params: GenerateQuizParams): Promise<Quiz> {
    const response = await api.post(ENDPOINTS.quiz.generate, params);
    return response.data;
  },

  async get(id: string): Promise<Quiz> {
    const response = await api.get(ENDPOINTS.quiz.get(id));
    return response.data;
  },

  async getByStudySet(studySetId: string): Promise<Quiz[]> {
    const response = await api.get(ENDPOINTS.quiz.byStudySet(studySetId));
    return response.data;
  },

  async getQuestions(id: string): Promise<QuizQuestion[]> {
    const response = await api.get(ENDPOINTS.quiz.questions(id));
    return response.data;
  },

  async getAttempts(quizId: string): Promise<QuizAttempt[]> {
    const response = await api.get(ENDPOINTS.quiz.attempt(quizId));
    return response.data;
  },

  async getAttemptDetail(attemptId: string): Promise<QuizAttemptDetail> {
    const response = await api.get(ENDPOINTS.quiz.attemptDetail(attemptId));
    return response.data;
  },

  async submitAttempt(
    quizId: string,
    data: {
      answers: Array<{ questionId: string; answer: string; timeSpent: number }>;
      totalTimeSpent: number;
    }
  ): Promise<QuizAttempt> {
    const response = await api.post(ENDPOINTS.quiz.attempt(quizId), data);
    return response.data;
  },
};
