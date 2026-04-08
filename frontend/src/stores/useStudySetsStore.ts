import { create } from 'zustand';
import type { StudySet, CreateStudySetRequest, UpdateStudySetRequest } from '@/types';
import { studySetsService, type StudySetsListParams } from '@/services/studySets';

interface StudySetsState {
  studySets: StudySet[];
  currentStudySet: StudySet | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  total: number;

  // Actions
  fetchStudySets: (params?: StudySetsListParams) => Promise<void>;
  fetchStudySet: (id: string) => Promise<void>;
  createStudySet: (data: CreateStudySetRequest) => Promise<StudySet>;
  updateStudySet: (id: string, data: UpdateStudySetRequest) => Promise<void>;
  deleteStudySet: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentStudySet: (studySet: StudySet | null) => void;
}

export const useStudySetsStore = create<StudySetsState>((set) => ({
  studySets: [],
  currentStudySet: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  total: 0,

  fetchStudySets: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await studySetsService.list(params);
      set({
        studySets: response.data,
        totalPages: response.totalPages,
        currentPage: response.page,
        total: response.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch study sets',
        isLoading: false,
      });
    }
  },

  fetchStudySet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const studySet = await studySetsService.get(id);
      set({ currentStudySet: studySet, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch study set',
        isLoading: false,
      });
    }
  },

  createStudySet: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const studySet = await studySetsService.create(data);
      set((state) => ({
        studySets: [studySet, ...state.studySets],
        isLoading: false,
      }));
      return studySet;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create study set',
        isLoading: false,
      });
      throw error;
    }
  },

  updateStudySet: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedStudySet = await studySetsService.update(id, data);
      set((state) => ({
        studySets: state.studySets.map((s) => (s.id === id ? updatedStudySet : s)),
        currentStudySet:
          state.currentStudySet?.id === id ? updatedStudySet : state.currentStudySet,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update study set',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteStudySet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await studySetsService.delete(id);
      set((state) => ({
        studySets: state.studySets.filter((s) => s.id !== id),
        currentStudySet: state.currentStudySet?.id === id ? null : state.currentStudySet,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete study set',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  setCurrentStudySet: (studySet) => set({ currentStudySet: studySet }),
}));
