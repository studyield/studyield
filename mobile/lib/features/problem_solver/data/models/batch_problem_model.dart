import '../../domain/entities/batch_problem_entity.dart';

class BatchProblemModel extends BatchProblemEntity {
  const BatchProblemModel({
    required super.id,
    required super.problem,
    super.subject,
    required super.sequenceNumber,
    super.sessionId,
    required super.status,
    super.errorMessage,
    required super.createdAt,
  });

  factory BatchProblemModel.fromJson(Map<String, dynamic> json) {
    return BatchProblemModel(
      id: json['id'] ?? '',
      problem: json['problem'] ?? '',
      subject: json['subject'],
      sequenceNumber: json['sequenceNumber'] ?? 0,
      sessionId: json['sessionId'],
      status: _parseStatus(json['status']),
      errorMessage: json['errorMessage'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  static BatchProblemStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return BatchProblemStatus.pending;
      case 'solving':
        return BatchProblemStatus.solving;
      case 'completed':
        return BatchProblemStatus.completed;
      case 'failed':
        return BatchProblemStatus.failed;
      default:
        return BatchProblemStatus.pending;
    }
  }

  BatchProblemEntity toEntity() => this;
}
