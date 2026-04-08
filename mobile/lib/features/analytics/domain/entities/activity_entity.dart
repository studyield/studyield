import 'package:equatable/equatable.dart';

class ActivityEntity extends Equatable {
  final String date; // ISO date string YYYY-MM-DD
  final int sessions;
  final int cardsReviewed;
  final int studyMinutes;

  const ActivityEntity({
    required this.date,
    required this.sessions,
    required this.cardsReviewed,
    required this.studyMinutes,
  });

  @override
  List<Object?> get props => [
        date,
        sessions,
        cardsReviewed,
        studyMinutes,
      ];
}
