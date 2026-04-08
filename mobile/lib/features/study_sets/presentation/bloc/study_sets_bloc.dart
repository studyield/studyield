import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_study_sets_usecase.dart';
import '../../domain/usecases/create_study_set_usecase.dart';
import '../../domain/usecases/delete_study_set_usecase.dart';
import '../../data/models/create_study_set_request.dart';
import '../../domain/repositories/study_sets_repository.dart';
import 'study_sets_event.dart';
import 'study_sets_state.dart';

class StudySetsBloc extends Bloc<StudySetsEvent, StudySetsState> {
  final GetStudySetsUseCase getStudySetsUseCase;
  final CreateStudySetUseCase createStudySetUseCase;
  final DeleteStudySetUseCase deleteStudySetUseCase;
  final StudySetsRepository repository;

  StudySetsBloc({
    required this.getStudySetsUseCase,
    required this.createStudySetUseCase,
    required this.deleteStudySetUseCase,
    required this.repository,
  }) : super(StudySetsInitial()) {
    on<LoadStudySets>(_onLoadStudySets);
    on<RefreshStudySets>(_onRefreshStudySets);
    on<CreateStudySet>(_onCreateStudySet);
    on<UpdateStudySet>(_onUpdateStudySet);
    on<DeleteStudySet>(_onDeleteStudySet);
  }

  Future<void> _onLoadStudySets(
    LoadStudySets event,
    Emitter<StudySetsState> emit,
  ) async {
    emit(StudySetsLoading());

    final result = await getStudySetsUseCase(
      page: event.page,
      limit: event.limit,
    );

    result.fold(
      (failure) => emit(StudySetsError(message: failure.message)),
      (studySets) => emit(StudySetsLoaded(studySets: studySets)),
    );
  }

  Future<void> _onRefreshStudySets(
    RefreshStudySets event,
    Emitter<StudySetsState> emit,
  ) async {
    final result = await getStudySetsUseCase(page: 1, limit: 20);

    result.fold(
      (failure) => emit(StudySetsError(message: failure.message)),
      (studySets) => emit(StudySetsLoaded(studySets: studySets)),
    );
  }

  Future<void> _onCreateStudySet(
    CreateStudySet event,
    Emitter<StudySetsState> emit,
  ) async {
    emit(StudySetCreating());

    final request = CreateStudySetRequest(
      title: event.title,
      description: event.description,
      isPublic: event.isPublic,
      tags: event.tags,
      coverImageUrl: event.coverImageUrl,
      examDate: event.examDate,
      examSubject: event.examSubject,
    );

    final result = await repository.createStudySet(request);

    result.fold(
      (failure) => emit(StudySetsError(message: failure.message)),
      (studySet) => emit(StudySetCreated(studySet: studySet)),
    );
  }

  Future<void> _onUpdateStudySet(
    UpdateStudySet event,
    Emitter<StudySetsState> emit,
  ) async {
    final request = CreateStudySetRequest(
      title: event.title,
      description: event.description,
      isPublic: event.isPublic,
      tags: event.tags,
      coverImageUrl: event.coverImageUrl,
      examDate: event.examDate,
      examSubject: event.examSubject,
    );

    final result = await repository.updateStudySet(event.id, request);

    result.fold(
      (failure) => emit(StudySetsError(message: failure.message)),
      (studySet) => emit(StudySetUpdated(studySet: studySet)),
    );
  }

  Future<void> _onDeleteStudySet(
    DeleteStudySet event,
    Emitter<StudySetsState> emit,
  ) async {
    final result = await deleteStudySetUseCase(event.id);

    result.fold(
      (failure) => emit(StudySetsError(message: failure.message)),
      (_) => emit(StudySetDeleted(id: event.id)),
    );
  }
}
