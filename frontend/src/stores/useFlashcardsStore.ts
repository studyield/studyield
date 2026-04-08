import { create } from 'zustand';
import type {
  Flashcard,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  ReviewFlashcardRequest,
} from '@/types';
import { flashcardsService, type FlashcardsListParams } from '@/services/flashcards';
import { isFlashcardDue } from '@/types';

interface FlashcardsState {
  flashcards: Flashcard[];
  currentFlashcard: Flashcard | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  total: number;

  // Study session state
  studyQueue: Flashcard[];
  currentStudyIndex: number;
  isFlipped: boolean;
  sessionStats: {
    reviewed: number;
    correct: number;
    incorrect: number;
  };

  // Actions
  fetchFlashcards: (studySetId: string, params?: FlashcardsListParams) => Promise<void>;
  createFlashcard: (data: CreateFlashcardRequest) => Promise<Flashcard>;
  updateFlashcard: (id: string, data: UpdateFlashcardRequest) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  reviewFlashcard: (id: string, data: ReviewFlashcardRequest) => Promise<void>;
  clearError: () => void;

  // Study session actions
  startStudySession: (flashcards: Flashcard[]) => void;
  flipCard: () => void;
  nextCard: () => void;
  prevCard: () => void;
  goToCard: (index: number) => void;
  resetSession: () => void;
}

export const useFlashcardsStore = create<FlashcardsState>((set) => ({
  flashcards: [],
  currentFlashcard: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  total: 0,

  // Study session state
  studyQueue: [],
  currentStudyIndex: 0,
  isFlipped: false,
  sessionStats: {
    reviewed: 0,
    correct: 0,
    incorrect: 0,
  },

  fetchFlashcards: async (studySetId, params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await flashcardsService.list(studySetId, params);
      set({
        flashcards: response.data,
        totalPages: response.totalPages,
        currentPage: response.page,
        total: response.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch flashcards',
        isLoading: false,
      });
    }
  },

  createFlashcard: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const flashcard = await flashcardsService.create(data);
      set((state) => ({
        flashcards: [...state.flashcards, flashcard],
        isLoading: false,
      }));
      return flashcard;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create flashcard',
        isLoading: false,
      });
      throw error;
    }
  },

  updateFlashcard: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedFlashcard = await flashcardsService.update(id, data);
      set((state) => ({
        flashcards: state.flashcards.map((f) => (f.id === id ? updatedFlashcard : f)),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update flashcard',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteFlashcard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await flashcardsService.delete(id);
      set((state) => ({
        flashcards: state.flashcards.filter((f) => f.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete flashcard',
        isLoading: false,
      });
      throw error;
    }
  },

  reviewFlashcard: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const isCorrect = data.quality >= 3;
      const updatedFlashcard = await flashcardsService.review(id, data);

      set((state) => ({
        flashcards: state.flashcards.map((f) => (f.id === id ? updatedFlashcard : f)),
        studyQueue: state.studyQueue.map((f) => (f.id === id ? updatedFlashcard : f)),
        sessionStats: {
          reviewed: state.sessionStats.reviewed + 1,
          correct: state.sessionStats.correct + (isCorrect ? 1 : 0),
          incorrect: state.sessionStats.incorrect + (isCorrect ? 0 : 1),
        },
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to review flashcard',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  // Study session actions
  startStudySession: (flashcards) => {
    const dueCards = flashcards.filter(isFlashcardDue);
    set({
      studyQueue: dueCards.length > 0 ? dueCards : flashcards,
      currentStudyIndex: 0,
      isFlipped: false,
      sessionStats: { reviewed: 0, correct: 0, incorrect: 0 },
    });
  },

  flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

  nextCard: () =>
    set((state) => ({
      currentStudyIndex: Math.min(state.currentStudyIndex + 1, state.studyQueue.length),
      isFlipped: false,
    })),

  prevCard: () =>
    set((state) => ({
      currentStudyIndex: Math.max(state.currentStudyIndex - 1, 0),
      isFlipped: false,
    })),

  goToCard: (index: number) =>
    set((state) => ({
      currentStudyIndex: Math.max(0, Math.min(index, state.studyQueue.length - 1)),
      isFlipped: false,
    })),

  resetSession: () =>
    set({
      studyQueue: [],
      currentStudyIndex: 0,
      isFlipped: false,
      sessionStats: { reviewed: 0, correct: 0, incorrect: 0 },
    }),
}));
