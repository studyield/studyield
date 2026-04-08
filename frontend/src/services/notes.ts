import api from './api';
import { ENDPOINTS } from '@/config/api';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types';

export const notesService = {
  async list(studySetId: string): Promise<Note[]> {
    const response = await api.get<Note[]>(ENDPOINTS.notes.list(studySetId));
    return response.data;
  },

  async get(id: string): Promise<Note> {
    const response = await api.get<Note>(ENDPOINTS.notes.get(id));
    return response.data;
  },

  async create(data: CreateNoteRequest): Promise<Note> {
    const response = await api.post<Note>(
      ENDPOINTS.notes.create(data.studySetId),
      data,
    );
    return response.data;
  },

  async update(id: string, data: UpdateNoteRequest): Promise<Note> {
    const response = await api.put<Note>(ENDPOINTS.notes.update(id), data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.notes.delete(id));
  },

  async togglePin(id: string): Promise<Note> {
    const response = await api.post<Note>(ENDPOINTS.notes.togglePin(id));
    return response.data;
  },
};
