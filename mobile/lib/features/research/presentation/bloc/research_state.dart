import 'package:equatable/equatable.dart';
import '../../domain/entities/research_session_entity.dart';
import '../../domain/entities/research_result_entity.dart';

abstract class ResearchState extends Equatable {
  const ResearchState();

  @override
  List<Object?> get props => [];
}

class ResearchInitial extends ResearchState {}

class ResearchLoading extends ResearchState {}

class ResearchSessionsLoaded extends ResearchState {
  final List<ResearchSessionEntity> sessions;

  const ResearchSessionsLoaded({required this.sessions});

  @override
  List<Object?> get props => [sessions];
}

class ResearchSessionCreated extends ResearchState {
  final ResearchSessionEntity session;

  const ResearchSessionCreated({required this.session});

  @override
  List<Object?> get props => [session];
}

class ResearchInProgress extends ResearchState {
  final ResearchSessionEntity session;

  const ResearchInProgress({required this.session});

  @override
  List<Object?> get props => [session];
}

class ResearchCompleted extends ResearchState {
  final ResearchSessionEntity session;
  final ResearchResultEntity result;

  const ResearchCompleted({
    required this.session,
    required this.result,
  });

  @override
  List<Object?> get props => [session, result];
}

class ResearchResultLoaded extends ResearchState {
  final ResearchResultEntity result;

  const ResearchResultLoaded({required this.result});

  @override
  List<Object?> get props => [result];
}

class ResearchDeleted extends ResearchState {
  final String sessionId;

  const ResearchDeleted({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class ResearchError extends ResearchState {
  final String message;

  const ResearchError({required this.message});

  @override
  List<Object?> get props => [message];
}
