import { create } from 'zustand';
import { notesService } from '@/services/notes';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotes: (studySetId: string) => Promise<void>;
  fetchNote: (id: string) => Promise<void>;
  createNote: (data: CreateNoteRequest) => Promise<Note>;
  updateNote: (id: string, data: UpdateNoteRequest) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  clearError: () => void;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,

  fetchNotes: async (studySetId: string) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await notesService.list(studySetId);
      set({ notes, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
        isLoading: false,
      });
    }
  },

  fetchNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const note = await notesService.get(id);
      set({ currentNote: note, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch note',
        isLoading: false,
      });
    }
  },

  createNote: async (data: CreateNoteRequest) => {
    set({ isLoading: true, error: null });
    try {
      const note = await notesService.create(data);
      set((state) => ({
        notes: [note, ...state.notes],
        isLoading: false,
      }));
      return note;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create note',
        isLoading: false,
      });
      throw error;
    }
  },

  updateNote: async (id: string, data: UpdateNoteRequest) => {
    set({ isLoading: true, error: null });
    try {
      const updatedNote = await notesService.update(id, data);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        currentNote: state.currentNote?.id === id ? updatedNote : state.currentNote,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update note',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteNote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await notesService.delete(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete note',
        isLoading: false,
      });
      throw error;
    }
  },

  togglePin: async (id: string) => {
    try {
      const updatedNote = await notesService.togglePin(id);
      set((state) => {
        // Re-sort notes: pinned first, then by date
        const updatedNotes = state.notes.map((n) => (n.id === id ? updatedNote : n));
        updatedNotes.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return {
          notes: updatedNotes,
          currentNote: state.currentNote?.id === id ? updatedNote : state.currentNote,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle pin',
      });
    }
  },

  setCurrentNote: (note: Note | null) => set({ currentNote: note }),

  clearError: () => set({ error: null }),

  clearNotes: () => set({ notes: [], currentNote: null }),
}));
