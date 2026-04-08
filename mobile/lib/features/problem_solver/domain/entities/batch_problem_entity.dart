import 'package:equatable/equatable.dart';

enum BatchProblemStatus { pending, solving, completed, failed }

class BatchProblemEntity extends Equatable {
  final String id;
  final String problem;
  final String? subject;
  final int sequenceNumber;
  final String? sessionId; // null if not solved
  final BatchProblemStatus status;
  final String? errorMessage;
  final DateTime createdAt;

  const BatchProblemEntity({
    required this.id,
    required this.problem,
    this.subject,
    required this.sequenceNumber,
    this.sessionId,
    required this.status,
    this.errorMessage,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        problem,
        subject,
        sequenceNumber,
        sessionId,
        status,
        errorMessage,
        createdAt,
      ];
}
