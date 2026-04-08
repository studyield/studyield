import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

// Types
export interface AgentStep {
  agent: string;
  input: string;
  output: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export interface ProblemSession {
  id: string;
  userId: string;
  problem: string;
  subject: string | null;
  imageUrl: string | null;
  status: 'pending' | 'analyzing' | 'solving' | 'verifying' | 'completed' | 'failed';
  analysisResult: AgentStep | null;
  solutionResult: AgentStep | null;
  verificationResult: AgentStep | null;
  finalAnswer: string | null;
  isCorrect: boolean | null;
  hintSteps: unknown[];
  complexityLevel: string;
  graphData: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface SolveProblemRequest {
  problem: string;
  subject?: string;
  imageUrl?: string;
}

export interface StreamEvent {
  stage: 'analysis' | 'solving' | 'verification' | 'complete' | 'error';
  type: 'start' | 'chunk' | 'result';
  data: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'tutor';
  message: string;
  createdAt: string;
}

export interface SimilarProblem {
  id: string;
  problem: string;
  difficulty: 'easy' | 'medium' | 'hard';
  similarity: string;
  hint?: string;
}

export interface Bookmark {
  id: string;
  sessionId: string;
  tags: string[];
  notes: string | null;
  problem: string;
  subject: string | null;
  finalAnswer: string | null;
  status: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'mcq' | 'true_false' | 'fill_blank';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
}

export interface HintResponse {
  hint: string;
  hintNumber: number;
  totalHintsNeeded: number;
  isLastHint: boolean;
  nextHintPreview: string | null;
}

export interface AlternativeMethod {
  id: string;
  methodName: string;
  methodDescription: string;
  solutionSteps: { output: string; metadata?: Record<string, unknown> };
}

export interface ConceptMap {
  centralTopic: string;
  prerequisites: Array<{ name: string; description: string; difficulty: string }>;
  currentConcepts: Array<{ name: string; description: string; importance: string }>;
  nextConcepts: Array<{ name: string; description: string; difficulty: string }>;
  relatedConcepts: Array<{ name: string; description: string; relationship: string }>;
}

export interface FormulaCard {
  front: string;
  back: string;
  category: string;
  subject: string;
}

export interface GraphData {
  canPlot: boolean;
  plotType: string;
  functions: Array<{ expression: string; label: string; color: string }>;
  xRange: number[];
  yRange: number[];
  specialPoints: Array<{ x: number; y: number; label: string }>;
  gridLines: boolean;
}

export const problemSolverService = {
  // Core
  async create(data: SolveProblemRequest): Promise<ProblemSession> {
    const res = await api.post(ENDPOINTS.problemSolver.create, data);
    return res.data;
  },

  async list(): Promise<ProblemSession[]> {
    const res = await api.get(ENDPOINTS.problemSolver.list);
    return res.data;
  },

  async get(id: string): Promise<ProblemSession> {
    const res = await api.get(ENDPOINTS.problemSolver.get(id));
    return res.data;
  },

  async solve(id: string): Promise<ProblemSession> {
    const res = await api.post(ENDPOINTS.problemSolver.solve(id));
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.problemSolver.delete(id));
  },

  solveStream(id: string): EventSource {
    const url = `${api.defaults.baseURL}${ENDPOINTS.problemSolver.solveStream(id)}`;
    return new EventSource(url);
  },

  // Similar Problems
  async getSimilar(id: string): Promise<SimilarProblem[]> {
    const res = await api.get(ENDPOINTS.problemSolver.similar(id));
    return res.data;
  },

  // Chat
  async sendChatMessage(id: string, message: string): Promise<ChatMessage> {
    const res = await api.post(ENDPOINTS.problemSolver.chat(id), { message });
    return res.data;
  },

  async getChatMessages(id: string): Promise<ChatMessage[]> {
    const res = await api.get(ENDPOINTS.problemSolver.chatMessages(id));
    return res.data;
  },

  // Image extraction
  async extractFromImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(ENDPOINTS.content.extract, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.text || res.data.content || '';
  },

  // ─── New Features ──────────────────────────────

  // Bookmarks
  async addBookmark(id: string, tags?: string[], notes?: string) {
    const res = await api.post(ENDPOINTS.problemSolver.bookmark(id), { tags, notes });
    return res.data;
  },

  async removeBookmark(id: string): Promise<void> {
    await api.delete(ENDPOINTS.problemSolver.bookmark(id));
  },

  async getBookmarks(): Promise<Bookmark[]> {
    const res = await api.get(ENDPOINTS.problemSolver.bookmarks);
    return res.data;
  },

  async isBookmarked(id: string): Promise<boolean> {
    const res = await api.get(ENDPOINTS.problemSolver.bookmarkStatus(id));
    return res.data.isBookmarked;
  },

  // Hints / Guide Mode
  async getNextHint(id: string): Promise<HintResponse> {
    const res = await api.post(ENDPOINTS.problemSolver.hint(id));
    return res.data;
  },

  async resetHints(id: string): Promise<void> {
    await api.post(ENDPOINTS.problemSolver.hintReset(id));
  },

  // Alternative Methods
  async getAlternativeMethods(id: string): Promise<AlternativeMethod[]> {
    const res = await api.get(ENDPOINTS.problemSolver.alternativeMethods(id));
    return res.data;
  },

  // Practice Quiz
  async generatePracticeQuiz(id: string, count?: number): Promise<QuizQuestion[]> {
    const res = await api.post(ENDPOINTS.problemSolver.practiceQuiz(id), { count });
    return res.data;
  },

  async getQuizQuestions(id: string): Promise<QuizQuestion[]> {
    const res = await api.get(ENDPOINTS.problemSolver.practiceQuiz(id));
    return res.data;
  },

  async submitQuizAnswer(questionId: string, answer: string) {
    const res = await api.post(ENDPOINTS.problemSolver.quizAnswer(questionId), { answer });
    return res.data;
  },

  // ELI5 / Complexity
  async explainAtLevel(id: string, level: string): Promise<{ level: string; explanation: string }> {
    const res = await api.post(ENDPOINTS.problemSolver.explain(id), { level });
    return res.data;
  },

  // Concept Map
  async getConceptMap(id: string): Promise<ConceptMap> {
    const res = await api.get(ENDPOINTS.problemSolver.conceptMap(id));
    return res.data;
  },

  // Formula Cards
  async getFormulaCards(id: string): Promise<FormulaCard[]> {
    const res = await api.get(ENDPOINTS.problemSolver.formulaCards(id));
    return res.data;
  },

  // Graph
  async getGraphData(id: string): Promise<GraphData> {
    const res = await api.get(ENDPOINTS.problemSolver.graph(id));
    return res.data;
  },

  // Narration
  async getNarration(id: string): Promise<{ narration: string; language: string }> {
    const res = await api.get(ENDPOINTS.problemSolver.narration(id));
    return res.data;
  },

  // Batch Solve
  async batchExtractProblems(text: string): Promise<string[]> {
    const res = await api.post(ENDPOINTS.problemSolver.batchExtract, { text });
    return res.data;
  },
};
