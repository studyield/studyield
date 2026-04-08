import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/analytics_repository.dart';
import 'analytics_event.dart';
import 'analytics_state.dart';

class AnalyticsBloc extends Bloc<AnalyticsEvent, AnalyticsState> {
  final AnalyticsRepository repository;

  AnalyticsBloc({required this.repository}) : super(AnalyticsInitial()) {
    on<LoadAnalytics>(_onLoadAnalytics);
    on<ChangeTimeRange>(_onChangeTimeRange);
  }

  Future<void> _onLoadAnalytics(
    LoadAnalytics event,
    Emitter<AnalyticsState> emit,
  ) async {
    emit(AnalyticsLoading());

    try {
      final analytics = await repository.getAnalytics(range: event.range);
      final activity = await repository.getActivity(range: event.range);
      final performance = await repository.getPerformance(range: event.range);

      emit(AnalyticsLoaded(
        analytics: analytics,
        activity: activity,
        performance: performance,
        currentRange: event.range,
      ));
    } catch (e) {
      emit(AnalyticsError(message: e.toString()));
    }
  }

  Future<void> _onChangeTimeRange(
    ChangeTimeRange event,
    Emitter<AnalyticsState> emit,
  ) async {
    // Reload with new range
    add(LoadAnalytics(range: event.range));
  }
}
