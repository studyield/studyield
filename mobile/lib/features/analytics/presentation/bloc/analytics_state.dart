import 'package:equatable/equatable.dart';
import '../../domain/entities/analytics_entity.dart';
import '../../domain/entities/activity_entity.dart';
import '../../domain/entities/performance_entity.dart';

abstract class AnalyticsState extends Equatable {
  const AnalyticsState();

  @override
  List<Object?> get props => [];
}

class AnalyticsInitial extends AnalyticsState {}

class AnalyticsLoading extends AnalyticsState {}

class AnalyticsLoaded extends AnalyticsState {
  final AnalyticsEntity analytics;
  final List<ActivityEntity> activity;
  final PerformanceEntity performance;
  final String currentRange;

  const AnalyticsLoaded({
    required this.analytics,
    required this.activity,
    required this.performance,
    required this.currentRange,
  });

  @override
  List<Object?> get props => [analytics, activity, performance, currentRange];
}

class AnalyticsError extends AnalyticsState {
  final String message;

  const AnalyticsError({required this.message});

  @override
  List<Object?> get props => [message];
}
