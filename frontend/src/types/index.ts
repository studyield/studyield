// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'team';
  billingCycle?: 'monthly' | 'yearly' | null;
  educationLevel?: string;
  subjects?: string[];
  profileCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Study Set types
export interface StudySet {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  coverImageUrl?: string;
  examDate?: string;
  examSubject?: string;
  flashcardsCount: number;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudySetRequest {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  coverImageUrl?: string;
  examDate?: string;
  examSubject?: string;
}

export interface UpdateStudySetRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  coverImageUrl?: string;
  examDate?: string;
  examSubject?: string;
}

// Document types
export interface Document {
  id: string;
  studySetId: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  createdAt: string;
}

// Flashcard types
export type FlashcardType = 'standard' | 'cloze' | 'image_occlusion';

export interface Flashcard {
  id: string;
  studySetId: string;
  front: string;
  back: string;
  notes?: string;
  tags: string[];
  type?: FlashcardType;
  difficulty: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Cloze deletion utilities
export const CLOZE_REGEX = /\{\{(.+?)\}\}/g;

export function hasClozeMarkers(text: string): boolean {
  return CLOZE_REGEX.test(text);
}

export function extractClozeBlanks(text: string): string[] {
  const matches = text.match(CLOZE_REGEX);
  return matches ? matches.map((m) => m.slice(2, -2)) : [];
}

export function renderClozeWithBlanks(text: string, revealedIndices: Set<number>): { segments: Array<{ text: string; isBlank: boolean; index: number; answer: string }> } {
  const segments: Array<{ text: string; isBlank: boolean; index: number; answer: string }> = [];
  let lastIndex = 0;
  let blankIndex = 0;
  const regex = /\{\{(.+?)\}\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isBlank: false, index: -1, answer: '' });
    }
    const revealed = revealedIndices.has(blankIndex);
    segments.push({ text: revealed ? match[1] : '______', isBlank: true, index: blankIndex, answer: match[1] });
    blankIndex++;
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isBlank: false, index: -1, answer: '' });
  }
  return { segments };
}

// Image Occlusion types
export interface OcclusionRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface CreateFlashcardRequest {
  studySetId: string;
  front: string;
  back: string;
  notes?: string;
  tags?: string[];
  type?: 'standard' | 'cloze' | 'image_occlusion';
}

export interface UpdateFlashcardRequest {
  front?: string;
  back?: string;
  notes?: string;
  tags?: string[];
  type?: 'standard' | 'cloze' | 'image_occlusion';
}

export interface ReviewFlashcardRequest {
  quality: 1 | 2 | 3 | 4 | 5;
}

// Flashcard status helpers
export const getFlashcardStatus = (flashcard: Flashcard): string => {
  if (flashcard.repetitions === 0) return 'New';
  if (flashcard.interval < 7) return 'Learning';
  if (flashcard.interval < 30) return 'Review';
  return 'Mastered';
};

export const isFlashcardDue = (flashcard: Flashcard): boolean => {
  if (!flashcard.nextReviewAt) return true;
  return new Date(flashcard.nextReviewAt) <= new Date();
};

// Knowledge Base types
export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description?: string;
  documentCount: number;
  chunkCount: number;
  status: 'active' | 'processing' | 'error';
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  knowledgeBaseId?: string;
  studySetId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface Citation {
  chunkId: string;
  content: string;
  score: number;
  documentId?: string;
}

// Quiz types
export interface Quiz {
  id: string;
  studySetId: string;
  title: string;
  questionCount: number;
  timeLimit?: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt?: string;
  createdAt: string;
}

export interface QuizAttemptDetail {
  attempt: QuizAttempt;
  answers: QuizAttemptAnswer[];
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  createdAt: string;
}

// Common API types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Gamification types
export interface GamificationStats {
  totalXp: number;
  level: number;
  streakDays: number;
  dailyXp: number;
  dailyGoal: number;
  nextLevelXp: number;
  currentLevelXp: number;
}

export type XPEventType = 'card_review' | 'quiz_complete' | 'perfect_quiz' | 'daily_streak' | 'daily_goal';

export interface XPEvent {
  type: XPEventType;
  xp: number;
  timestamp: string;
}

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

export const LEVEL_NAMES = [
  { name: 'Beginner',    gradient: 'from-gray-400 to-gray-500',       shadow: 'shadow-gray-400/20',     text: 'text-gray-500' },
  { name: 'Bronze',      gradient: 'from-amber-600 to-amber-700',     shadow: 'shadow-amber-600/20',    text: 'text-amber-600' },
  { name: 'Silver',      gradient: 'from-slate-400 to-slate-500',     shadow: 'shadow-slate-400/20',    text: 'text-slate-500' },
  { name: 'Gold',        gradient: 'from-yellow-400 to-yellow-500',   shadow: 'shadow-yellow-400/20',   text: 'text-yellow-500' },
  { name: 'Platinum',    gradient: 'from-cyan-400 to-cyan-500',       shadow: 'shadow-cyan-400/20',     text: 'text-cyan-500' },
  { name: 'Diamond',     gradient: 'from-blue-400 to-blue-500',       shadow: 'shadow-blue-400/20',     text: 'text-blue-500' },
  { name: 'Master',      gradient: 'from-purple-500 to-purple-600',   shadow: 'shadow-purple-500/20',   text: 'text-purple-500' },
  { name: 'Grandmaster', gradient: 'from-red-500 to-rose-600',        shadow: 'shadow-red-500/20',      text: 'text-red-500' },
  { name: 'Champion',    gradient: 'from-orange-500 to-red-500',      shadow: 'shadow-orange-500/20',   text: 'text-orange-500' },
  { name: 'Legend',      gradient: 'from-indigo-500 to-violet-600',   shadow: 'shadow-indigo-500/20',   text: 'text-indigo-500' },
  { name: 'Mythic',      gradient: 'from-fuchsia-500 to-pink-600',    shadow: 'shadow-fuchsia-500/20',  text: 'text-fuchsia-500' },
  { name: 'Immortal',    gradient: 'from-amber-400 via-red-500 to-purple-600', shadow: 'shadow-amber-400/20', text: 'text-amber-500' },
] as const;

export function getLevelInfo(level: number) {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)];
}

export function getLevelFromXP(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const currentLevelXp = LEVEL_THRESHOLDS[level] || 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 2500;
  return { level, currentLevelXp, nextLevelXp };
}

// Study Schedule types
export interface StudySchedule {
  daysUntilExam: number;
  dailyCardTarget: number;
  recommendedMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  todayPlan: {
    newCards: number;
    reviewCards: number;
    estimatedMinutes: number;
  };
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'reminder';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  studyReminders: boolean;
  weeklyDigest: boolean;
  achievementAlerts: boolean;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
}

// Note types
export type NoteSourceType = 'manual' | 'ai_generated' | 'pdf' | 'youtube' | 'audio' | 'website' | 'handwriting';

export interface Note {
  id: string;
  studySetId: string;
  title: string;
  content: string;
  contentJson?: Record<string, unknown>;
  summary?: string;
  sourceType: NoteSourceType;
  sourceUrl?: string;
  sourceMetadata?: Record<string, unknown>;
  tags: string[];
  isPinned: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  studySetId: string;
  title: string;
  content: string;
  contentJson?: Record<string, unknown>;
  summary?: string;
  sourceType?: NoteSourceType;
  sourceUrl?: string;
  sourceMetadata?: Record<string, unknown>;
  tags?: string[];
  isPinned?: boolean;
  color?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  contentJson?: Record<string, unknown>;
  summary?: string;
  tags?: string[];
  isPinned?: boolean;
  color?: string;
}
