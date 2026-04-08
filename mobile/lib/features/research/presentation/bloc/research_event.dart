import 'package:equatable/equatable.dart';

abstract class ResearchEvent extends Equatable {
  const ResearchEvent();

  @override
  List<Object?> get props => [];
}

class LoadResearchSessions extends ResearchEvent {
  const LoadResearchSessions();
}

class CreateResearchSession extends ResearchEvent {
  final String query;
  final String depth;
  final List<String> sourceTypes;
  final String outputFormat;

  const CreateResearchSession({
    required this.query,
    this.depth = 'standard',
    this.sourceTypes = const ['documents'],
    this.outputFormat = 'detailed',
  });

  @override
  List<Object?> get props => [query, depth, sourceTypes, outputFormat];
}

class StartResearch extends ResearchEvent {
  final String sessionId;

  const StartResearch({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class PollResearchProgress extends ResearchEvent {
  final String sessionId;

  const PollResearchProgress({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class LoadResearchResult extends ResearchEvent {
  final String sessionId;

  const LoadResearchResult({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class DeleteResearchSession extends ResearchEvent {
  final String sessionId;

  const DeleteResearchSession({required this.sessionId});

  @override
  List<Object?> get props => [sessionId];
}

class StopPolling extends ResearchEvent {
  const StopPolling();
}
