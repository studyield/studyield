abstract class StudySetsEvent {}

class LoadStudySets extends StudySetsEvent {
  final int page;
  final int limit;

  LoadStudySets({
    this.page = 1,
    this.limit = 20,
  });
}

class RefreshStudySets extends StudySetsEvent {}

class CreateStudySet extends StudySetsEvent {
  final String title;
  final String? description;
  final bool? isPublic;
  final List<String>? tags;
  final String? coverImageUrl;
  final DateTime? examDate;
  final String? examSubject;

  CreateStudySet({
    required this.title,
    this.description,
    this.isPublic,
    this.tags,
    this.coverImageUrl,
    this.examDate,
    this.examSubject,
  });
}

class UpdateStudySet extends StudySetsEvent {
  final String id;
  final String title;
  final String? description;
  final bool? isPublic;
  final List<String>? tags;
  final String? coverImageUrl;
  final DateTime? examDate;
  final String? examSubject;

  UpdateStudySet({
    required this.id,
    required this.title,
    this.description,
    this.isPublic,
    this.tags,
    this.coverImageUrl,
    this.examDate,
    this.examSubject,
  });
}

class DeleteStudySet extends StudySetsEvent {
  final String id;

  DeleteStudySet({required this.id});
}
