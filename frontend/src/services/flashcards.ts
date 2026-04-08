import api, { type PaginatedResponse } from './api';
import { ENDPOINTS } from '@/config/api';
import type {
  Flashcard,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  ReviewFlashcardRequest,
} from '@/types';

export interface FlashcardsListParams {
  page?: number;
  limit?: number;
  tags?: string[];
  dueOnly?: boolean;
}

export const flashcardsService = {
  async list(
    studySetId: string,
    params?: FlashcardsListParams
  ): Promise<PaginatedResponse<Flashcard>> {
    const response = await api.get(ENDPOINTS.flashcards.list(studySetId), { params });
    return response.data;
  },

  async create(data: CreateFlashcardRequest): Promise<Flashcard> {
    const response = await api.post(
      ENDPOINTS.flashcards.create(data.studySetId),
      data
    );
    return response.data;
  },

  async update(id: string, data: UpdateFlashcardRequest): Promise<Flashcard> {
    const response = await api.put(ENDPOINTS.flashcards.update(id), data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.flashcards.delete(id));
  },

  async review(id: string, data: ReviewFlashcardRequest): Promise<Flashcard> {
    const response = await api.post(ENDPOINTS.flashcards.review(id), data);
    return response.data;
  },
};
