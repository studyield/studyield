import 'package:flutter_dotenv/flutter_dotenv.dart';

/// API related constants

class ApiConstants {
  ApiConstants._();

  // Base URLs - loaded from .env file
  static String get baseUrl => dotenv.env['API_URL'] ?? 'http://localhost:3010';
  static String get apiVersion => dotenv.env['API_VERSION'] ?? '/api/v1';
  static String get apiBaseUrl => '$baseUrl$apiVersion';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 120); // Increased for AI operations
  static const Duration sendTimeout = Duration(seconds: 120);

  // Headers
  static const String contentType = 'application/json';
  static const String accept = 'application/json';
  static const String authorization = 'Authorization';
  static const String bearer = 'Bearer';

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String me = '/auth/me';
  static const String googleAuth = '/auth/oauth/google';
  static const String appleAuth = '/auth/oauth/apple';

  // Study Sets endpoints
  static const String studySets = '/study-sets';
  static String studySetById(String id) => '/study-sets/$id';

  // Flashcards endpoints
  static const String flashcards = '/flashcards';
  static String flashcardById(String id) => '/flashcards/$id';
  static String flashcardsByStudySet(String studySetId) =>
      '/flashcards/study-set/$studySetId';
  static String dueFlashcardsByStudySet(String studySetId) =>
      '/flashcards/study-set/$studySetId/due';
  static String reviewFlashcard(String id) => '/flashcards/$id/review';
  static String bulkCreateFlashcards(String studySetId) =>
      '/study-sets/$studySetId/flashcards/bulk';

  // Documents endpoints
  static const String documents = '/documents';
  static String documentById(String id) => '/documents/$id';
  static const String uploadDocument = '/documents/upload';

  // Upload endpoints
  static const String uploadImage = '/storage/upload/image';

  // AI endpoints
  static const String aiGenerateFlashcards = '/ai/generate-flashcards';
  static const String aiAssistCard = '/ai/assist-card';
  static const String aiBulkAdjust = '/ai/adjust-cards';

  // Content extraction endpoints
  static const String contentExtract = '/content/extract';
  static const String contentExtractYoutube = '/content/extract-youtube';
  static const String contentExtractAudio = '/content/extract-audio';
  static const String contentExtractWebsite = '/content/extract-website';

  // Chat endpoints
  static const String conversations = '/conversations';
  static String conversationById(String id) => '/conversations/$id';
  static String messagesByConversation(String conversationId) =>
      '/conversations/$conversationId/messages';

  // Quiz endpoints
  static const String quizzes = '/quizzes';
  static String quizById(String id) => '/quizzes/$id';
  static String startQuiz(String id) => '/quizzes/$id/start';
  static String submitQuiz(String id) => '/quizzes/$id/submit';

  // User endpoints
  static const String profile = '/users/me';
  static const String updateProfile = '/users/me';
  static const String userStats = '/users/me/stats';
  static const String userGamification = '/users/me/gamification';
  static const String subscription = '/users/subscription';

  // Knowledge Base endpoints
  static const String knowledgeBases = '/knowledge-bases';
  static String knowledgeBaseById(String id) => '/knowledge-bases/$id';

  // WebSocket events
  static const String wsConnect = 'connect';
  static const String wsDisconnect = 'disconnect';
  static const String wsError = 'error';
  static const String wsMessage = 'message';
  static const String wsTyping = 'typing';
}
