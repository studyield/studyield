import '../../domain/entities/problem_session_entity.dart';

class ProblemSessionModel extends ProblemSessionEntity {
  const ProblemSessionModel({
    required super.id,
    required super.userId,
    required super.problem,
    super.subject,
    super.imageUrl,
    required super.status,
    super.analysisResult,
    super.solutionResult,
    super.verificationResult,
    super.finalAnswer,
    super.isCorrect,
    super.hintSteps,
    super.complexityLevel,
    super.graphData,
    required super.createdAt,
    required super.updatedAt,
  });

  factory ProblemSessionModel.fromJson(Map<String, dynamic> json) {
    return ProblemSessionModel(
      id: json['id'],
      userId: json['userId'],
      problem: json['problem'],
      subject: json['subject'],
      imageUrl: json['imageUrl'],
      status: _parseStatus(json['status']),
      analysisResult: json['analysisResult'],
      solutionResult: json['solutionResult'],
      verificationResult: json['verificationResult'],
      finalAnswer: json['finalAnswer'],
      isCorrect: json['isCorrect'],
      hintSteps: json['hintSteps'] ?? [],
      complexityLevel: json['complexityLevel'],
      graphData: json['graphData'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  static SessionStatus _parseStatus(String? status) {
    switch (status) {
      case 'pending':
        return SessionStatus.pending;
      case 'analyzing':
        return SessionStatus.analyzing;
      case 'solving':
        return SessionStatus.solving;
      case 'verifying':
        return SessionStatus.verifying;
      case 'completed':
        return SessionStatus.completed;
      case 'failed':
        return SessionStatus.failed;
      default:
        return SessionStatus.pending;
    }
  }

  ProblemSessionEntity toEntity() => this;
}
