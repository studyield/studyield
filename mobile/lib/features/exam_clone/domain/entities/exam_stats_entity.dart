import 'package:equatable/equatable.dart';

class ExamStatsEntity extends Equatable {
  final int totalExams;
  final int totalOriginalQuestions;
  final int totalGeneratedQuestions;
  final int readyToPractice;
  final int reviewQueueCount;

  const ExamStatsEntity({
    required this.totalExams,
    required this.totalOriginalQuestions,
    required this.totalGeneratedQuestions,
    required this.readyToPractice,
    this.reviewQueueCount = 0,
  });

  @override
  List<Object?> get props => [
        totalExams,
        totalOriginalQuestions,
        totalGeneratedQuestions,
        readyToPractice,
        reviewQueueCount,
      ];
}
