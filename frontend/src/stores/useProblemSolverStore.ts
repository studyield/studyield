import { create } from 'zustand';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import type { ProblemSession, StreamEvent, ChatMessage, SimilarProblem } from '@/services/problemSolver';

type SolveStage = 'idle' | 'analyzing' | 'solving' | 'verifying' | 'completed' | 'failed';

interface ProblemSolverState {
  // Sessions
  sessions: ProblemSession[];
  currentSession: ProblemSession | null;
  isLoading: boolean;
  error: string | null;

  // Solving progress
  solveStage: SolveStage;
  streamChunks: Record<string, string>;
  stageResults: Record<string, unknown>;

  // Chat
  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  // Similar problems
  similarProblems: SimilarProblem[];

  // Actions
  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  createAndSolve: (problem: string, subject?: string, imageUrl?: string) => Promise<string>;
  solveWithStream: (sessionId: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  fetchSimilarProblems: (id: string) => Promise<void>;
  sendChatMessage: (id: string, message: string) => Promise<void>;
  fetchChatMessages: (id: string) => Promise<void>;
  resetSolving: () => void;
  clearError: () => void;
}

export const useProblemSolverStore = create<ProblemSolverState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  solveStage: 'idle',
  streamChunks: {},
  stageResults: {},
  chatMessages: [],
  isChatLoading: false,
  similarProblems: [],

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.problemSolver.list);
      set({ sessions: res.data, isLoading: false });
    } catch {
      set({ error: 'Failed to load problem history', isLoading: false });
    }
  },

  fetchSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.problemSolver.get(id));
      set({ currentSession: res.data, isLoading: false });
    } catch {
      set({ error: 'Failed to load session', isLoading: false });
    }
  },

  createAndSolve: async (problem: string, subject?: string, imageUrl?: string) => {
    set({ isLoading: true, error: null, solveStage: 'idle', streamChunks: {}, stageResults: {} });
    try {
      const res = await api.post(ENDPOINTS.problemSolver.create, {
        problem,
        subject: subject || undefined,
        imageUrl: imageUrl || undefined,
      });
      const session = res.data as ProblemSession;
      set({ currentSession: session, isLoading: false });

      // Start solving with stream
      get().solveWithStream(session.id);
      return session.id;
    } catch {
      set({ error: 'Failed to create session', isLoading: false });
      return '';
    }
  },

  solveWithStream: async (sessionId: string) => {
    set({ solveStage: 'analyzing', streamChunks: {}, stageResults: {} });

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${api.defaults.baseURL}${ENDPOINTS.problemSolver.solveStream(sessionId)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;
            const { stage, type, data } = event;

            if (type === 'start') {
              const stageMap: Record<string, SolveStage> = {
                analysis: 'analyzing',
                solving: 'solving',
                verification: 'verifying',
              };
              set({ solveStage: stageMap[stage] || 'analyzing' });
            } else if (type === 'chunk') {
              const chunks = { ...get().streamChunks };
              chunks[stage] = (chunks[stage] || '') + (data as string);
              set({ streamChunks: chunks });
            } else if (type === 'result') {
              const results = { ...get().stageResults };
              results[stage] = data;
              set({ stageResults: results });

              if (stage === 'complete') {
                set({ solveStage: 'completed' });
                // Refetch session for full data
                const sessionRes = await api.get(ENDPOINTS.problemSolver.get(sessionId));
                set({ currentSession: sessionRes.data });
              }
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } catch (err) {
      set({
        solveStage: 'failed',
        error: (err as Error).message || 'Solving failed',
      });
    }
  },

  deleteSession: async (id: string) => {
    try {
      await api.delete(ENDPOINTS.problemSolver.delete(id));
      set({ sessions: get().sessions.filter((s) => s.id !== id) });
    } catch {
      set({ error: 'Failed to delete session' });
    }
  },

  fetchSimilarProblems: async (id: string) => {
    try {
      const res = await api.get(ENDPOINTS.problemSolver.similar(id));
      set({ similarProblems: res.data });
    } catch {
      set({ similarProblems: [] });
    }
  },

  sendChatMessage: async (id: string, message: string) => {
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      message,
      createdAt: new Date().toISOString(),
    };
    set({ chatMessages: [...get().chatMessages, userMsg], isChatLoading: true });

    try {
      const res = await api.post(ENDPOINTS.problemSolver.chat(id), { message });
      set({
        chatMessages: [...get().chatMessages, res.data],
        isChatLoading: false,
      });
    } catch (err) {
      // Show error as a tutor message so user can see it
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'tutor',
        message: `Sorry, I encountered an error: ${(err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || 'Failed to get response'}. Please try again.`,
        createdAt: new Date().toISOString(),
      };
      set({
        chatMessages: [...get().chatMessages, errorMsg],
        isChatLoading: false,
      });
    }
  },

  fetchChatMessages: async (id: string) => {
    try {
      const res = await api.get(ENDPOINTS.problemSolver.chatMessages(id));
      set({ chatMessages: res.data });
    } catch {
      set({ chatMessages: [] });
    }
  },

  resetSolving: () => {
    set({
      currentSession: null,
      solveStage: 'idle',
      streamChunks: {},
      stageResults: {},
      chatMessages: [],
      similarProblems: [],
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
