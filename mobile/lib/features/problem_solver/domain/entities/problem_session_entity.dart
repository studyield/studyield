import 'package:equatable/equatable.dart';

enum SessionStatus { pending, analyzing, solving, verifying, completed, failed }

class ProblemSessionEntity extends Equatable {
  final String id;
  final String userId;
  final String problem;
  final String? subject;
  final String? imageUrl;
  final SessionStatus status;
  final Map<String, dynamic>? analysisResult;
  final Map<String, dynamic>? solutionResult;
  final Map<String, dynamic>? verificationResult;
  final String? finalAnswer;
  final bool? isCorrect;
  final List<dynamic> hintSteps;
  final String? complexityLevel;
  final Map<String, dynamic>? graphData;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ProblemSessionEntity({
    required this.id,
    required this.userId,
    required this.problem,
    this.subject,
    this.imageUrl,
    required this.status,
    this.analysisResult,
    this.solutionResult,
    this.verificationResult,
    this.finalAnswer,
    this.isCorrect,
    this.hintSteps = const [],
    this.complexityLevel,
    this.graphData,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        problem,
        subject,
        imageUrl,
        status,
        analysisResult,
        solutionResult,
        verificationResult,
        finalAnswer,
        isCorrect,
        hintSteps,
        complexityLevel,
        graphData,
        createdAt,
        updatedAt,
      ];
}
