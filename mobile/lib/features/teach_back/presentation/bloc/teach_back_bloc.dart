import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/teach_back_repository.dart';
import 'teach_back_event.dart';
import 'teach_back_state.dart';

class TeachBackBloc extends Bloc<TeachBackEvent, TeachBackState> {
  final TeachBackRepository repository;

  TeachBackBloc({required this.repository}) : super(TeachBackInitial()) {
    on<LoadTeachBackSessions>(_onLoadSessions);
    on<CreateTeachBackSession>(_onCreateSession);
    on<CreateTeachBackFromStudySet>(_onCreateFromStudySet);
    on<LoadSessionDetail>(_onLoadSessionDetail);
    on<LoadEssentials>(_onLoadEssentials);
    on<SubmitExplanation>(_onSubmitExplanation);
    on<EvaluateExplanation>(_onEvaluate);
    on<StartChallenge>(_onStartChallenge);
    on<RespondToChallenge>(_onRespondToChallenge);
    on<DeleteTeachBackSession>(_onDeleteSession);
  }

  Future<void> _onLoadSessions(
    LoadTeachBackSessions event,
    Emitter<TeachBackState> emit,
  ) async {
    emit(TeachBackLoading());

    try {
      final sessions = await repository.getSessions();
      emit(TeachBackSessionsLoaded(sessions: sessions));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onCreateSession(
    CreateTeachBackSession event,
    Emitter<TeachBackState> emit,
  ) async {
    emit(TeachBackLoading());

    try {
      final session = await repository.createSession(
        topic: event.topic,
        difficulty: event.difficulty,
        referenceMaterial: event.referenceMaterial,
      );
      emit(TeachBackSessionCreated(session: session));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onCreateFromStudySet(
    CreateTeachBackFromStudySet event,
    Emitter<TeachBackState> emit,
  ) async {
    emit(TeachBackLoading());

    try {
      final session = await repository.createFromStudySet(event.studySetId);
      emit(TeachBackSessionCreated(session: session));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onLoadSessionDetail(
    LoadSessionDetail event,
    Emitter<TeachBackState> emit,
  ) async {
    emit(TeachBackLoading());

    try {
      final session = await repository.getSession(event.sessionId);
      emit(SessionDetailLoaded(session: session));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onLoadEssentials(
    LoadEssentials event,
    Emitter<TeachBackState> emit,
  ) async {
    try {
      final essentials = await repository.getEssentials(event.sessionId);
      if (essentials != null) {
        emit(EssentialsLoaded(essentials: essentials));
      }
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onSubmitExplanation(
    SubmitExplanation event,
    Emitter<TeachBackState> emit,
  ) async {
    emit(TeachBackLoading());

    try {
      final session = await repository.submitExplanation(
        event.sessionId,
        event.explanation,
      );
      emit(ExplanationSubmitted(session: session));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onEvaluate(
    EvaluateExplanation event,
    Emitter<TeachBackState> emit,
  ) async {
    emit(TeachBackLoading());

    try {
      final evaluation = await repository.evaluate(event.sessionId);
      emit(EvaluationLoaded(evaluation: evaluation));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onStartChallenge(
    StartChallenge event,
    Emitter<TeachBackState> emit,
  ) async {
    try {
      final result = await repository.startChallenge(event.sessionId);
      final messages = result['messages'] as List<dynamic>;
      emit(ChallengeStarted(
        messages: messages.map((m) => m as Map<String, dynamic>).toList(),
      ));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onRespondToChallenge(
    RespondToChallenge event,
    Emitter<TeachBackState> emit,
  ) async {
    try {
      final result = await repository.respondToChallenge(event.sessionId, event.message);
      final messages = result['messages'] as List<dynamic>;
      final convinced = result['convinced'] as bool? ?? false;
      emit(ChallengeResponseReceived(
        messages: messages.map((m) => m as Map<String, dynamic>).toList(),
        convinced: convinced,
      ));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }

  Future<void> _onDeleteSession(
    DeleteTeachBackSession event,
    Emitter<TeachBackState> emit,
  ) async {
    try {
      await repository.deleteSession(event.sessionId);
      emit(TeachBackSessionDeleted(sessionId: event.sessionId));
    } catch (e) {
      emit(TeachBackError(message: e.toString()));
    }
  }
}
