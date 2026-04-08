import 'package:equatable/equatable.dart';

abstract class TeachBackEvent extends Equatable {
  const TeachBackEvent();

  @override
  List<Object?> get props => [];
}

class LoadTeachBackSessions extends TeachBackEvent {
  const LoadTeachBackSessions();
}

class CreateTeachBackSession extends TeachBackEvent {
  final String topic;
  final String difficulty;
  final String? referenceMaterial;

  const CreateTeachBackSession({
    required this.topic,
    this.difficulty = 'classmate',
    this.referenceMaterial,
  });

  @override
  List<Object?> get props => [topic, difficulty, referenceMaterial];
}

class LoadSessionDetail extends TeachBackEvent {
  final String sessionId;

  const LoadSessionDetail({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadEssentials extends TeachBackEvent {
  final String sessionId;

  const LoadEssentials({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class SubmitExplanation extends TeachBackEvent {
  final String sessionId;
  final String explanation;

  const SubmitExplanation({
    required this.sessionId,
    required this.explanation,
  });

  @override
  List<Object?> get props => [sessionId, explanation];
}

class EvaluateExplanation extends TeachBackEvent {
  final String sessionId;

  const EvaluateExplanation({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class CreateTeachBackFromStudySet extends TeachBackEvent {
  final String studySetId;

  const CreateTeachBackFromStudySet({required this.studySetId});

  @override
  List<Object?> get props => [studySetId];
}

class StartChallenge extends TeachBackEvent {
  final String sessionId;

  const StartChallenge({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class RespondToChallenge extends TeachBackEvent {
  final String sessionId;
  final String message;

  const RespondToChallenge({required this.sessionId, required this.message});

  @override
  List<Object?> get props => [sessionId, message];
}

class DeleteTeachBackSession extends TeachBackEvent {
  final String sessionId;

  const DeleteTeachBackSession({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}
