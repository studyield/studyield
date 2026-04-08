import '../../domain/entities/study_set_entity.dart';

abstract class StudySetsState {}

class StudySetsInitial extends StudySetsState {}

class StudySetsLoading extends StudySetsState {}

class StudySetsLoaded extends StudySetsState {
  final List<StudySetEntity> studySets;

  StudySetsLoaded({required this.studySets});
}

class StudySetsError extends StudySetsState {
  final String message;

  StudySetsError({required this.message});
}

class StudySetCreating extends StudySetsState {}

class StudySetCreated extends StudySetsState {
  final StudySetEntity studySet;

  StudySetCreated({required this.studySet});
}

class StudySetUpdated extends StudySetsState {
  final StudySetEntity studySet;

  StudySetUpdated({required this.studySet});
}

class StudySetDeleted extends StudySetsState {
  final String id;

  StudySetDeleted({required this.id});
}
