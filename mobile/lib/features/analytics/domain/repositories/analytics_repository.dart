import '../entities/analytics_entity.dart';
import '../entities/activity_entity.dart';
import '../entities/performance_entity.dart';

abstract class AnalyticsRepository {
  Future<AnalyticsEntity> getAnalytics({String range = '30d'});
  Future<List<ActivityEntity>> getActivity({String range = '30d'});
  Future<PerformanceEntity> getPerformance({String range = '30d'});
}
