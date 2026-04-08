import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/research_session_entity.dart';
import '../../domain/repositories/research_repository.dart';
import 'research_event.dart';
import 'research_state.dart';

class ResearchBloc extends Bloc<ResearchEvent, ResearchState> {
  final ResearchRepository repository;
  Timer? _pollingTimer;

  // Expose repository for direct access
  ResearchRepository get repo => repository;

  ResearchBloc({required this.repository}) : super(ResearchInitial()) {
    on<LoadResearchSessions>(_onLoadSessions);
    on<CreateResearchSession>(_onCreateSession);
    on<StartResearch>(_onStartResearch);
    on<PollResearchProgress>(_onPollProgress);
    on<LoadResearchResult>(_onLoadResult);
    on<DeleteResearchSession>(_onDeleteSession);
    on<StopPolling>(_onStopPolling);
  }

  @override
  Future<void> close() {
    _pollingTimer?.cancel();
    return super.close();
  }

  Future<void> _onLoadSessions(
    LoadResearchSessions event,
    Emitter<ResearchState> emit,
  ) async {
    emit(ResearchLoading());

    try {
      final sessions = await repository.getSessions();
      emit(ResearchSessionsLoaded(sessions: sessions));
    } catch (e) {
      emit(ResearchError(message: e.toString()));
    }
  }

  Future<void> _onCreateSession(
    CreateResearchSession event,
    Emitter<ResearchState> emit,
  ) async {
    emit(ResearchLoading());

    try {
      final session = await repository.createSession(
        query: event.query,
        depth: event.depth,
        sourceTypes: event.sourceTypes,
        outputFormat: event.outputFormat,
      );
      emit(ResearchSessionCreated(session: session));
    } catch (e) {
      emit(ResearchError(message: e.toString()));
    }
  }

  Future<void> _onStartResearch(
    StartResearch event,
    Emitter<ResearchState> emit,
  ) async {
    try {
      // Start research (fire-and-forget, may timeout but that's OK)
      repository.startResearch(event.sessionId);

      // Immediately start polling - don't wait for start() to complete
      _pollingTimer?.cancel();
      _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        add(PollResearchProgress(sessionId: event.sessionId));
      });

      // Initial progress check
      await Future.delayed(const Duration(milliseconds: 500));
      add(PollResearchProgress(sessionId: event.sessionId));
    } catch (e) {
      // Don't emit error for start() failures
      // Polling will catch any real issues
    }
  }

  Future<void> _onPollProgress(
    PollResearchProgress event,
    Emitter<ResearchState> emit,
  ) async {
    try {
      final session = await repository.getSession(event.sessionId);

      if (session.status == ResearchStatus.completed) {
        _pollingTimer?.cancel();

        // Load result
        final result = await repository.getResult(event.sessionId);
        if (result != null) {
          emit(ResearchCompleted(session: session, result: result));
        } else {
          emit(ResearchError(message: 'Research completed but no results found'));
        }
      } else if (session.status == ResearchStatus.failed) {
        _pollingTimer?.cancel();
        emit(ResearchError(message: 'Research failed'));
      } else {
        // Still in progress
        emit(ResearchInProgress(session: session));
      }
    } catch (e) {
      // Don't emit error during polling, just log
      // emit(ResearchError(message: e.toString()));
    }
  }

  Future<void> _onLoadResult(
    LoadResearchResult event,
    Emitter<ResearchState> emit,
  ) async {
    emit(ResearchLoading());

    try {
      final result = await repository.getResult(event.sessionId);
      if (result != null) {
        emit(ResearchResultLoaded(result: result));
      } else {
        emit(const ResearchError(message: 'No results available'));
      }
    } catch (e) {
      emit(ResearchError(message: e.toString()));
    }
  }

  Future<void> _onDeleteSession(
    DeleteResearchSession event,
    Emitter<ResearchState> emit,
  ) async {
    try {
      await repository.deleteSession(event.sessionId);
      emit(ResearchDeleted(sessionId: event.sessionId));
    } catch (e) {
      emit(ResearchError(message: e.toString()));
    }
  }

  void _onStopPolling(
    StopPolling event,
    Emitter<ResearchState> emit,
  ) {
    _pollingTimer?.cancel();
  }
}
