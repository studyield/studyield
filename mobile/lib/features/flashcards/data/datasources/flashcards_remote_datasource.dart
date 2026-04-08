import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../models/create_flashcard_request.dart';
import '../models/bulk_create_flashcards_request.dart';
import '../models/generate_flashcards_request.dart';
import '../models/import_flashcards_request.dart';
import '../models/ai_assist_request.dart';

abstract class FlashcardsRemoteDataSource {
  Future<List<FlashcardEntity>> getFlashcardsByStudySet(String studySetId);
  Future<List<FlashcardEntity>> getDueFlashcardsByStudySet(String studySetId);
  Future<FlashcardEntity> getFlashcardById(String id);
  Future<FlashcardEntity> createFlashcard(CreateFlashcardRequest request);
  Future<List<FlashcardEntity>> bulkCreateFlashcards(BulkCreateFlashcardsRequest request);
  Future<List<FlashcardEntity>> generateFlashcards(GenerateFlashcardsRequest request);
  Future<List<FlashcardEntity>> importFlashcards(ImportFlashcardsRequest request);
  Future<String> assistCard(AiAssistRequest request);
  Future<FlashcardEntity> updateFlashcard(String id, CreateFlashcardRequest request);
  Future<void> deleteFlashcard(String id);
  Future<FlashcardEntity> reviewFlashcard(String id, int quality);
}

class FlashcardsRemoteDataSourceImpl implements FlashcardsRemoteDataSource {
  final ApiClient apiClient;

  FlashcardsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<FlashcardEntity>> getFlashcardsByStudySet(String studySetId) async {
    final response = await apiClient.get(
      ApiConstants.flashcardsByStudySet(studySetId),
    );

    final data = response.data as List<dynamic>;
    return data.map((json) => FlashcardEntity.fromJson(json)).toList();
  }

  @override
  Future<FlashcardEntity> getFlashcardById(String id) async {
    final response = await apiClient.get(
      ApiConstants.flashcardById(id),
    );

    return FlashcardEntity.fromJson(response.data);
  }

  @override
  Future<FlashcardEntity> createFlashcard(CreateFlashcardRequest request) async {
    final payload = request.toJson();
    print('Creating flashcard with payload: $payload');

    final response = await apiClient.post(
      ApiConstants.flashcards,
      data: payload,
    );

    return FlashcardEntity.fromJson(response.data);
  }

  @override
  Future<List<FlashcardEntity>> bulkCreateFlashcards(
    BulkCreateFlashcardsRequest request,
  ) async {
    final payload = request.toJson();
    print('Bulk creating flashcards with payload: $payload');

    final response = await apiClient.post(
      ApiConstants.bulkCreateFlashcards(request.studySetId),
      data: payload,
    );

    final responseData = response.data;
    final List<dynamic> data;
    if (responseData is List) {
      data = responseData;
    } else if (responseData is Map && responseData.containsKey('data')) {
      data = responseData['data'] as List<dynamic>;
    } else if (responseData is Map && responseData.containsKey('flashcards')) {
      data = responseData['flashcards'] as List<dynamic>;
    } else {
      data = [];
    }
    return data.map((json) => FlashcardEntity.fromJson(json)).toList();
  }

  @override
  Future<List<FlashcardEntity>> generateFlashcards(
    GenerateFlashcardsRequest request,
  ) async {
    final payload = request.toJson();
    print('Generating flashcards with AI: $payload');

    final response = await apiClient.post(
      ApiConstants.aiGenerateFlashcards,
      data: payload,
    );

    // API returns {flashcards: [...]} or direct array
    final responseData = response.data;
    final List<dynamic> data;
    if (responseData is List) {
      data = responseData;
    } else if (responseData is Map && responseData.containsKey('flashcards')) {
      data = responseData['flashcards'] as List<dynamic>;
    } else if (responseData is Map && responseData.containsKey('data')) {
      data = responseData['data'] as List<dynamic>;
    } else {
      data = [];
    }
    return data.map((json) => FlashcardEntity.fromJson(json as Map<String, dynamic>)).toList();
  }

  @override
  Future<List<FlashcardEntity>> importFlashcards(
    ImportFlashcardsRequest request,
  ) async {
    final payload = request.toJson();
    print('Importing flashcards: $payload');

    // Use appropriate endpoint based on source
    String endpoint;
    switch (request.source) {
      case 'youtube':
        endpoint = ApiConstants.contentExtractYoutube;
        break;
      case 'audio':
        endpoint = ApiConstants.contentExtractAudio;
        break;
      case 'website':
        endpoint = ApiConstants.contentExtractWebsite;
        break;
      default:
        endpoint = ApiConstants.contentExtract;
    }

    final response = await apiClient.post(
      endpoint,
      data: payload,
    );

    // API returns {flashcards: [...]} or direct array depending on endpoint
    final data = response.data is Map
        ? response.data['flashcards'] as List<dynamic>
        : response.data as List<dynamic>;
    return data.map((json) => FlashcardEntity.fromJson(json)).toList();
  }

  @override
  Future<String> assistCard(AiAssistRequest request) async {
    final payload = request.toJson();
    print('AI assisting card: $payload');

    final response = await apiClient.post(
      ApiConstants.aiAssistCard,
      data: payload,
    );

    return response.data['result'] as String;
  }

  @override
  Future<FlashcardEntity> updateFlashcard(
    String id,
    CreateFlashcardRequest request,
  ) async {
    final response = await apiClient.put(
      ApiConstants.flashcardById(id),
      data: {
        'front': request.front,
        'back': request.back,
        if (request.notes != null) 'notes': request.notes,
        if (request.tags != null) 'tags': request.tags,
      },
    );

    return FlashcardEntity.fromJson(response.data);
  }

  @override
  Future<List<FlashcardEntity>> getDueFlashcardsByStudySet(String studySetId) async {
    final response = await apiClient.get(
      ApiConstants.dueFlashcardsByStudySet(studySetId),
    );

    final data = response.data as List<dynamic>;
    return data.map((json) => FlashcardEntity.fromJson(json)).toList();
  }

  @override
  Future<FlashcardEntity> reviewFlashcard(String id, int quality) async {
    final response = await apiClient.post(
      ApiConstants.reviewFlashcard(id),
      data: {'quality': quality},
    );

    return FlashcardEntity.fromJson(response.data);
  }

  @override
  Future<void> deleteFlashcard(String id) async {
    await apiClient.delete(ApiConstants.flashcardById(id));
  }
}
