import '../../domain/entities/activity_entity.dart';

class ActivityModel extends ActivityEntity {
  const ActivityModel({
    required super.date,
    required super.sessions,
    required super.cardsReviewed,
    required super.studyMinutes,
  });

  factory ActivityModel.fromJson(Map<String, dynamic> json) {
    return ActivityModel(
      date: json['date'] ?? '',
      sessions: json['sessions'] ?? 1,
      cardsReviewed: json['flashcardsReviewed'] ?? json['cardsReviewed'] ?? 0,
      studyMinutes: json['studyTime'] ?? json['studyMinutes'] ?? 0,
    );
  }

  ActivityEntity toEntity() => this;
}
