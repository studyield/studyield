import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

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
  difficultyLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopicEssentials {
  summary: string;
  keyTerms: string[];
  commonPitfalls: string[];
  examplePrompt: string;
}

export const teachBackService = {
  async create(topic: string, referenceContent?: string, studySetId?: string): Promise<TeachBackSession> {
    const res = await api.post(ENDPOINTS.teachBack.create, { topic, referenceContent, studySetId });
    return res.data;
  },

  async createFromStudySet(studySetId: string): Promise<TeachBackSession> {
    const res = await api.post(ENDPOINTS.teachBack.createFromStudySet, { studySetId });
    return res.data;
  },

  async list(): Promise<TeachBackSession[]> {
    const res = await api.get(ENDPOINTS.teachBack.list);
    return res.data;
  },

  async get(id: string): Promise<TeachBackSession> {
    const res = await api.get(ENDPOINTS.teachBack.get(id));
    return res.data;
  },

  async getEssentials(id: string): Promise<TopicEssentials> {
    const res = await api.get(ENDPOINTS.teachBack.essentials(id));
    return res.data;
  },

  async submit(id: string, explanation: string, difficultyLevel?: string): Promise<TeachBackSession> {
    const res = await api.post(ENDPOINTS.teachBack.submit(id), { explanation, difficultyLevel });
    return res.data;
  },

  async evaluate(id: string): Promise<TeachBackSession> {
    const res = await api.post(ENDPOINTS.teachBack.evaluate(id));
    return res.data;
  },

  async startChallenge(id: string): Promise<{ messages: ChallengeMessage[] }> {
    const res = await api.post(ENDPOINTS.teachBack.challengeStart(id));
    return res.data;
  },

  async respondToChallenge(id: string, message: string): Promise<{ messages: ChallengeMessage[]; convinced: boolean }> {
    const res = await api.post(ENDPOINTS.teachBack.challengeRespond(id), { message });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.teachBack.delete(id));
  },
};
