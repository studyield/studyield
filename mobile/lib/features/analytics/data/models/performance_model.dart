import '../../domain/entities/performance_entity.dart';

class PerformanceModel extends PerformanceEntity {
  const PerformanceModel({
    required super.accuracy,
    required super.improvementRate,
    required super.cardsByStatus,
    required super.retentionCurve,
  });

  factory PerformanceModel.fromJson(Map<String, dynamic> json) {
    // Generate mock card status data if not provided
    final mockCardsByStatus = {
      'new': 15,
      'learning': 25,
      'review': 30,
      'mastered': 45,
    };

    // Generate mock retention curve if not provided
    final mockRetention = List.generate(
      30,
      (i) => RetentionPoint(
        day: i + 1,
        retention: 100 - (i * 1.5), // Decreasing retention over time
      ),
    );

    return PerformanceModel(
      accuracy: (json['flashcardAccuracy'] ?? json['accuracy'] ?? 0.0).toDouble(),
      improvementRate: (json['improvementRate'] ?? 0.0).toDouble(),
      cardsByStatus: json['cardsByStatus'] != null
          ? Map<String, int>.from(json['cardsByStatus'])
          : mockCardsByStatus,
      retentionCurve: json['retentionCurve'] != null
          ? (json['retentionCurve'] as List<dynamic>)
              .map((e) => RetentionPoint(
                    day: e['day'] ?? 0,
                    retention: (e['retention'] ?? 0.0).toDouble(),
                  ))
              .toList()
          : mockRetention,
    );
  }

  PerformanceEntity toEntity() => this;
}
