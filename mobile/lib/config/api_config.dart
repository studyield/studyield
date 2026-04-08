import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl => dotenv.env['API_URL'] ?? 'http://10.0.2.2:3010';
  static const Duration timeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 10);
}

class Endpoints {
  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String me = '/auth/me';
  static const String googleLogin = '/auth/google';
  static const String appleLogin = '/auth/apple';

  // Users
  static const String profile = '/users/me';
  static const String updateProfile = '/users/me';
  static const String preferences = '/users/preferences';
  static const String stats = '/users/me/stats';
  static const String gamification = '/users/me/gamification';
  static const String addXp = '/users/me/xp';

  // Study Sets
  static const String studySets = '/study-sets';
  static String studySet(String id) => '/study-sets/$id';

  // Documents
  static const String documents = '/documents';
  static const String uploadDocument = '/documents/upload';
  static String document(String id) => '/documents/$id';

  // Flashcards
  static String flashcards(String studySetId) => '/study-sets/$studySetId/flashcards';
  static String flashcard(String id) => '/flashcards/$id';
  static String reviewFlashcard(String id) => '/flashcards/$id/review';

  // Knowledge Base
  static const String knowledgeBases = '/knowledge-bases';
  static String knowledgeBase(String id) => '/knowledge-bases/$id';
  static String searchKnowledgeBase(String id) => '/knowledge-bases/$id/search';

  // Chat
  static const String conversations = '/conversations';
  static String conversation(String id) => '/conversations/$id';
  static String messages(String id) => '/conversations/$id/messages';

  // Quiz
  static const String quizzes = '/quizzes';
  static String quiz(String id) => '/quizzes/$id';
  static const String generateQuiz = '/quizzes/generate';
  static String quizAttempt(String id) => '/quizzes/$id/attempts';

  // Exam Clone
  static const String examClones = '/exam-clones';
  static const String uploadExam = '/exam-clones/upload';
  static String examClone(String id) => '/exam-clones/$id';
  static String generateFromExam(String id) => '/exam-clones/$id/generate';
  static const String reviewQueue = '/exam-clones/review-queue';
  static const String bookmarks = '/exam-clones/bookmarks';
  static String bookmark(String questionId) => '/exam-clones/bookmarks/$questionId';
  static const String badges = '/exam-clones/badges';
  static const String userBadges = '/exam-clones/badges/user';
  static const String leaderboard = '/exam-clones/leaderboard';

  // Problem Solver
  static const String solveProblem = '/problem-solver/solve';
  static const String problemSessions = '/problem-solver/sessions';

  // Knowledge Graph
  static String knowledgeGraph(String studySetId) => '/knowledge-graph/$studySetId';

  // Teach Back
  static const String teachBackSessions = '/teach-back/sessions';
  static String teachBackSession(String id) => '/teach-back/sessions/$id';

  // Research
  static const String researchSessions = '/research/sessions';
  static String researchSession(String id) => '/research/sessions/$id';

  // Code Sandbox
  static const String executeCode = '/code-sandbox/execute';

  // Learning Paths
  static const String learningPaths = '/learning-paths';
  static String learningPath(String id) => '/learning-paths/$id';

  // Subscription
  static const String subscription = '/subscription';
  static const String subscriptionPlans = '/subscription/plans';
  static const String subscriptionUsage = '/subscription/usage';
}
