import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

export interface LearningStep {
  id: string;
  order: number;
  title: string;
  description: string;
  type: 'study' | 'quiz' | 'practice' | 'review';
  resourceId: string | null;
  resourceType: 'study_set' | 'quiz' | 'document' | null;
  estimatedMinutes: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  steps: LearningStep[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export const learningPathsService = {
  async list(): Promise<LearningPath[]> {
    const res = await api.get(ENDPOINTS.learningPaths.list);
    return res.data;
  },

  async get(id: string): Promise<LearningPath> {
    const res = await api.get(ENDPOINTS.learningPaths.get(id));
    return res.data;
  },

  async create(data: { title: string; subject: string; difficulty?: string }): Promise<LearningPath> {
    const res = await api.post(ENDPOINTS.learningPaths.create, data);
    return res.data;
  },

  async generate(data: {
    topic: string;
    currentLevel: string;
    targetLevel: string;
    availableHoursPerWeek: number;
  }): Promise<LearningPath> {
    const res = await api.post(ENDPOINTS.learningPaths.generate, data);
    return res.data;
  },

  async completeStep(pathId: string, stepId: string): Promise<LearningPath> {
    const res = await api.post(ENDPOINTS.learningPaths.completeStep(pathId, stepId));
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.learningPaths.delete(id));
  },
};
