export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3010',
  timeout: 30000,
};

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/users/me',
    google: '/auth/google',
    apple: '/auth/apple',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    changePassword: '/auth/change-password',
  },
  // Users
  users: {
    profile: '/users/me',
    preferences: '/users/preferences',
    stats: '/users/me/stats',
    gamification: '/users/me/gamification',
    addXp: '/users/me/xp',
  },
  // Analytics
  analytics: {
    me: '/analytics/me',
    activity: '/analytics/me/activity',
    performance: '/analytics/me/performance',
    track: '/analytics/track',
  },
  // Study Sets
  studySets: {
    list: '/study-sets',
    create: '/study-sets',
    get: (id: string) => `/study-sets/${id}`,
    update: (id: string) => `/study-sets/${id}`,
    delete: (id: string) => `/study-sets/${id}`,
    studySchedule: (id: string) => `/study-sets/${id}/study-schedule`,
  },
  // Documents
  documents: {
    list: '/documents',
    upload: '/documents',
    get: (id: string) => `/documents/${id}`,
    delete: (id: string) => `/documents/${id}`,
    byStudySet: (studySetId: string) => `/documents/study-set/${studySetId}`,
    downloadUrl: (id: string) => `/documents/${id}/download-url`,
  },
  // Flashcards
  flashcards: {
    list: (studySetId: string) => `/study-sets/${studySetId}/flashcards`,
    create: (studySetId: string) => `/study-sets/${studySetId}/flashcards`,
    update: (id: string) => `/flashcards/${id}`,
    delete: (id: string) => `/flashcards/${id}`,
    review: (id: string) => `/flashcards/${id}/review`,
  },
  // Knowledge Base
  knowledgeBase: {
    list: '/knowledge-bases',
    create: '/knowledge-bases',
    get: (id: string) => `/knowledge-bases/${id}`,
    delete: (id: string) => `/knowledge-bases/${id}`,
    search: (id: string) => `/knowledge-bases/${id}/search`,
    addDocument: (id: string) => `/knowledge-bases/${id}/documents`,
  },
  // Chat
  chat: {
    conversations: '/chat/conversations',
    create: '/chat/conversations',
    get: (id: string) => `/chat/conversations/${id}`,
    messages: (id: string) => `/chat/conversations/${id}/messages`,
    send: (id: string) => `/chat/conversations/${id}/messages`,
    stream: (id: string) => `/chat/conversations/${id}/messages/stream`,
    update: (id: string) => `/chat/conversations/${id}`,
    delete: (id: string) => `/chat/conversations/${id}`,
  },
  // Quiz
  quiz: {
    list: '/quizzes',
    create: '/quizzes',
    get: (id: string) => `/quizzes/${id}`,
    generate: '/quizzes/generate',
    questions: (id: string) => `/quizzes/${id}/questions`,
    attempt: (id: string) => `/quizzes/${id}/attempts`,
    attemptDetail: (attemptId: string) => `/quizzes/attempts/${attemptId}`,
    byStudySet: (studySetId: string) => `/quizzes/study-set/${studySetId}`,
    submit: (id: string, attemptId: string) =>
      `/quizzes/${id}/attempts/${attemptId}/submit`,
  },
  // Exam Clone
  examClone: {
    list: '/exam-clones',
    upload: (id: string) => `/exam-clones/${id}/upload`,
    get: (id: string) => `/exam-clones/${id}`,
    generate: (id: string) => `/exam-clones/${id}/generate`,
    questions: (id: string) => `/exam-clones/${id}/questions`,
    // Analytics & Practice
    analytics: (id: string) => `/exam-clones/${id}/analytics`,
    submitAttempt: (id: string) => `/exam-clones/${id}/attempt`,
    explanation: (questionId: string) => `/exam-clones/questions/${questionId}/explanation`,
    reviewQueue: '/exam-clones/review-queue',
    completeReview: (questionId: string) => `/exam-clones/review/${questionId}`,
    adaptiveQuestions: (id: string) => `/exam-clones/${id}/adaptive-questions`,
    templates: '/exam-clones/templates/list',
    generateFromTemplate: (id: string) => `/exam-clones/${id}/generate-from-template`,
    // Bookmarks
    bookmarks: '/exam-clones/bookmarks',
    bookmark: (questionId: string) => `/exam-clones/bookmarks/${questionId}`,
    // Badges
    badges: '/exam-clones/badges',
    userBadges: '/exam-clones/badges/user',
    // Leaderboard
    leaderboard: '/exam-clones/leaderboard',
  },
  // Problem Solver
  problemSolver: {
    create: '/problem-solver',
    list: '/problem-solver',
    get: (id: string) => `/problem-solver/${id}`,
    solve: (id: string) => `/problem-solver/${id}/solve`,
    solveStream: (id: string) => `/problem-solver/${id}/solve/stream`,
    delete: (id: string) => `/problem-solver/${id}`,
    similar: (id: string) => `/problem-solver/${id}/similar`,
    chat: (id: string) => `/problem-solver/${id}/chat`,
    chatMessages: (id: string) => `/problem-solver/${id}/chat/messages`,
    // New features
    bookmark: (id: string) => `/problem-solver/${id}/bookmark`,
    bookmarkStatus: (id: string) => `/problem-solver/${id}/bookmark/status`,
    bookmarks: '/problem-solver/bookmarks',
    hint: (id: string) => `/problem-solver/${id}/hint`,
    hintReset: (id: string) => `/problem-solver/${id}/hint/reset`,
    alternativeMethods: (id: string) => `/problem-solver/${id}/alternative-methods`,
    practiceQuiz: (id: string) => `/problem-solver/${id}/practice-quiz`,
    quizAnswer: (questionId: string) => `/problem-solver/quiz/${questionId}/answer`,
    explain: (id: string) => `/problem-solver/${id}/explain`,
    conceptMap: (id: string) => `/problem-solver/${id}/concept-map`,
    formulaCards: (id: string) => `/problem-solver/${id}/formula-cards`,
    graph: (id: string) => `/problem-solver/${id}/graph`,
    narration: (id: string) => `/problem-solver/${id}/narration`,
    batchExtract: '/problem-solver/batch/extract',
  },

  // Teach Back
  teachBack: {
    list: '/teach-back',
    create: '/teach-back',
    createFromStudySet: '/teach-back/from-study-set',
    get: (id: string) => `/teach-back/${id}`,
    essentials: (id: string) => `/teach-back/${id}/essentials`,
    submit: (id: string) => `/teach-back/${id}/submit`,
    evaluate: (id: string) => `/teach-back/${id}/evaluate`,
    challengeStart: (id: string) => `/teach-back/${id}/challenge/start`,
    challengeRespond: (id: string) => `/teach-back/${id}/challenge/respond`,
    delete: (id: string) => `/teach-back/${id}`,
  },
  // Research
  research: {
    list: '/research',
    create: '/research',
    get: (id: string) => `/research/${id}`,
    start: (id: string) => `/research/${id}/start`,
    delete: (id: string) => `/research/${id}`,
  },
  // Code Sandbox
  codeSandbox: {
    execute: '/code-sandbox/execute',
    sessions: '/code-sandbox/sessions',
  },
  // Content Import
  content: {
    extract: '/content/extract',
    extractYoutube: '/content/extract-youtube',
    extractWebsite: '/content/extract-website',
    extractAudio: '/content/extract-audio',
    extractHandwriting: '/content/extract-handwriting',
  },
  // Content Sources
  contentSources: {
    create: '/content-sources',
    byStudySet: (studySetId: string) => `/content-sources/study-set/${studySetId}`,
    delete: (id: string) => `/content-sources/${id}`,
  },
  // AI
  ai: {
    generateFlashcards: '/ai/generate-flashcards',
    generateQuiz: '/ai/generate-quiz',
    summarize: '/ai/summarize',
    assistCard: '/ai/assist-card',
    adjustCards: '/ai/adjust-cards',
    generateSlides: '/ai/generate-slides',
  },
  // Learning Paths
  learningPaths: {
    list: '/learning-paths',
    create: '/learning-paths',
    generate: '/learning-paths/generate',
    get: (id: string) => `/learning-paths/${id}`,
    completeStep: (id: string, stepId: string) => `/learning-paths/${id}/steps/${stepId}/complete`,
    delete: (id: string) => `/learning-paths/${id}`,
  },
  // Subscription
  subscription: {
    current: '/subscription',
    plans: '/subscription/plans',
    checkout: '/subscription/checkout',
    portal: '/subscription/portal',
    cancel: '/subscription/cancel',
    usage: '/subscription/usage',
    verifySession: '/subscription/verify-session',
  },
  // Notifications
  notifications: {
    list: '/notifications',
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
    deleteAll: '/notifications',
    preferences: '/notifications/preferences',
  },
  // Blog
  blog: {
    list: '/blog',
    categories: '/blog/categories',
    get: (slug: string) => `/blog/${slug}`,
    related: (slug: string) => `/blog/${slug}/related`,
    rating: (postId: string) => `/blog/${postId}/rating`,
    rate: (postId: string) => `/blog/${postId}/rating`,
    comments: (postId: string) => `/blog/${postId}/comments`,
    addComment: (postId: string) => `/blog/${postId}/comments`,
    deleteComment: (commentId: string) => `/blog/comments/${commentId}`,
  },
  // Notes
  notes: {
    list: (studySetId: string) => `/study-sets/${studySetId}/notes`,
    create: (studySetId: string) => `/study-sets/${studySetId}/notes`,
    get: (id: string) => `/notes/${id}`,
    update: (id: string) => `/notes/${id}`,
    delete: (id: string) => `/notes/${id}`,
    togglePin: (id: string) => `/notes/${id}/pin`,
  },
};
