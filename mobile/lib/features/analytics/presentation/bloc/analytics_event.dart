import 'package:equatable/equatable.dart';

abstract class AnalyticsEvent extends Equatable {
  const AnalyticsEvent();

  @override
  List<Object?> get props => [];
}

class LoadAnalytics extends AnalyticsEvent {
  final String range; // '7d', '30d', '90d', 'all'

  const LoadAnalytics({this.range = '30d'});

  @override
  List<Object?> get props => [range];
}

class ChangeTimeRange extends AnalyticsEvent {
  final String range;

  const ChangeTimeRange({required this.range});

  @override
  List<Object?> get props => [range];
}
