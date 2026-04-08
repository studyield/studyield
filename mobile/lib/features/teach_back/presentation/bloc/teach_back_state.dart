import 'package:equatable/equatable.dart';
import '../../domain/entities/teach_back_session_entity.dart';
import '../../domain/entities/teach_back_evaluation_entity.dart';

abstract class TeachBackState extends Equatable {
  const TeachBackState();

  @override
  List<Object?> get props => [];
}

class TeachBackInitial extends TeachBackState {}

class TeachBackLoading extends TeachBackState {}

class TeachBackSessionsLoaded extends TeachBackState {
  final List<TeachBackSessionEntity> sessions;

  const TeachBackSessionsLoaded({required this.sessions});

  @override
  List<Object?> get props => [sessions];
}

class TeachBackSessionCreated extends TeachBackState {
  final TeachBackSessionEntity session;

  const TeachBackSessionCreated({required this.session});

  @override
  List<Object?> get props => [session];
}

class SessionDetailLoaded extends TeachBackState {
  final TeachBackSessionEntity session;

  const SessionDetailLoaded({required this.session});

  @override
  List<Object?> get props => [session];
}

class EssentialsLoaded extends TeachBackState {
  final String essentials;

  const EssentialsLoaded({required this.essentials});

  @override
  List<Object?> get props => [essentials];
}

class ExplanationSubmitted extends TeachBackState {
  final TeachBackSessionEntity session;

  const ExplanationSubmitted({required this.session});

  @override
  List<Object?> get props => [session];
}

class EvaluationLoaded extends TeachBackState {
  final TeachBackEvaluationEntity evaluation;

  const EvaluationLoaded({required this.evaluation});

  @override
  List<Object?> get props => [evaluation];
}

class ChallengeStarted extends TeachBackState {
  final List<Map<String, dynamic>> messages;

  const ChallengeStarted({required this.messages});

  @override
  List<Object?> get props => [messages];
}

class ChallengeResponseReceived extends TeachBackState {
  final List<Map<String, dynamic>> messages;
  final bool convinced;

  const ChallengeResponseReceived({required this.messages, required this.convinced});

  @override
  List<Object?> get props => [messages, convinced];
}

class TeachBackSessionDeleted extends TeachBackState {
  final String sessionId;

  const TeachBackSessionDeleted({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class TeachBackError extends TeachBackState {
  final String message;

  const TeachBackError({required this.message});

  @override
  List<Object?> get props => [message];
}
