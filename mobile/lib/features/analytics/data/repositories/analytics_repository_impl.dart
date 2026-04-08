import '../../../../core/network/api_client.dart';
import '../../domain/entities/analytics_entity.dart';
import '../../domain/entities/activity_entity.dart';
import '../../domain/entities/performance_entity.dart';
import '../../domain/repositories/analytics_repository.dart';
import '../models/analytics_model.dart';
import '../models/activity_model.dart';
import '../models/performance_model.dart';

class AnalyticsRepositoryImpl implements AnalyticsRepository {
  final ApiClient apiClient;

  AnalyticsRepositoryImpl({required this.apiClient});

  @override
  Future<AnalyticsEntity> getAnalytics({String range = '30d'}) async {
    final response = await apiClient.get(
      '/analytics/me',
      queryParameters: {'range': range},
    );
    return AnalyticsModel.fromJson(response.data).toEntity();
  }

  @override
  Future<List<ActivityEntity>> getActivity({String range = '30d'}) async {
    final response = await apiClient.get(
      '/analytics/me/activity',
      queryParameters: {'range': range},
    );
    final List<dynamic> data = response.data;
    return data.map((json) => ActivityModel.fromJson(json).toEntity()).toList();
  }

  @override
  Future<PerformanceEntity> getPerformance({String range = '30d'}) async {
    final response = await apiClient.get(
      '/analytics/me/performance',
      queryParameters: {'range': range},
    );
    return PerformanceModel.fromJson(response.data).toEntity();
  }
}
