import 'package:equatable/equatable.dart';

class RetentionPoint {
  final int day;
  final double retention; // percentage 0-100

  const RetentionPoint({
    required this.day,
    required this.retention,
  });
}

class PerformanceEntity extends Equatable {
  final double accuracy; // percentage 0-100
  final double improvementRate; // percentage
  final Map<String, int> cardsByStatus; // {new: 10, learning: 5, review: 3, mastered: 20}
  final List<RetentionPoint> retentionCurve;

  const PerformanceEntity({
    required this.accuracy,
    required this.improvementRate,
    required this.cardsByStatus,
    required this.retentionCurve,
  });

  @override
  List<Object?> get props => [
        accuracy,
        improvementRate,
        cardsByStatus,
        retentionCurve,
      ];
}
