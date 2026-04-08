import api, { type PaginatedResponse } from './api';
import { ENDPOINTS } from '@/config/api';
import type {
  StudySet,
  CreateStudySetRequest,
  UpdateStudySetRequest,
} from '@/types';

export interface StudySetsListParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  isPublic?: boolean;
}

export const studySetsService = {
  async list(params?: StudySetsListParams): Promise<PaginatedResponse<StudySet>> {
    const response = await api.get(ENDPOINTS.studySets.list, { params });
    return response.data;
  },

  async get(id: string): Promise<StudySet> {
    const response = await api.get(ENDPOINTS.studySets.get(id));
    return response.data;
  },

  async create(data: CreateStudySetRequest): Promise<StudySet> {
    const response = await api.post(ENDPOINTS.studySets.create, data);
    return response.data;
  },

  async update(id: string, data: UpdateStudySetRequest): Promise<StudySet> {
    const response = await api.put(ENDPOINTS.studySets.update(id), data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.studySets.delete(id));
  },
};
