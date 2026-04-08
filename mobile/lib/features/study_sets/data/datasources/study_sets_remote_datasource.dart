import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../domain/entities/study_set_entity.dart';
import '../models/create_study_set_request.dart';

abstract class StudySetsRemoteDataSource {
  Future<List<StudySetEntity>> getStudySets({int page = 1, int limit = 20});
  Future<StudySetEntity> getStudySetById(String id);
  Future<StudySetEntity> createStudySet(CreateStudySetRequest request);
  Future<StudySetEntity> updateStudySet(String id, CreateStudySetRequest request);
  Future<void> deleteStudySet(String id);
}

class StudySetsRemoteDataSourceImpl implements StudySetsRemoteDataSource {
  final ApiClient apiClient;

  StudySetsRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<StudySetEntity>> getStudySets({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await apiClient.get(
      ApiConstants.studySets,
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );

    final responseData = response.data;
    final List<dynamic> data;
    if (responseData is Map && responseData.containsKey('data')) {
      data = responseData['data'] as List<dynamic>;
    } else if (responseData is List) {
      data = responseData;
    } else {
      data = [];
    }
    return data.map((json) => StudySetEntity.fromJson(json)).toList();
  }

  @override
  Future<StudySetEntity> getStudySetById(String id) async {
    final response = await apiClient.get(
      ApiConstants.studySetById(id),
    );

    return StudySetEntity.fromJson(response.data);
  }

  @override
  Future<StudySetEntity> createStudySet(CreateStudySetRequest request) async {
    final response = await apiClient.post(
      ApiConstants.studySets,
      data: request.toJson(),
    );

    return StudySetEntity.fromJson(response.data);
  }

  @override
  Future<StudySetEntity> updateStudySet(
    String id,
    CreateStudySetRequest request,
  ) async {
    final response = await apiClient.put(
      ApiConstants.studySetById(id),
      data: request.toJson(),
    );

    return StudySetEntity.fromJson(response.data);
  }

  @override
  Future<void> deleteStudySet(String id) async {
    await apiClient.delete(ApiConstants.studySetById(id));
  }
}
