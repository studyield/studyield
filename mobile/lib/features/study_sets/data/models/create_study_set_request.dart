class CreateStudySetRequest {
  final String title;
  final String? description;
  final bool? isPublic;
  final List<String>? tags;
  final String? coverImageUrl;
  final DateTime? examDate;
  final String? examSubject;

  CreateStudySetRequest({
    required this.title,
    this.description,
    this.isPublic,
    this.tags,
    this.coverImageUrl,
    this.examDate,
    this.examSubject,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'title': title,
    };

    if (description != null && description!.isNotEmpty) {
      json['description'] = description;
    }
    if (isPublic != null) {
      json['isPublic'] = isPublic;
    }
    if (tags != null && tags!.isNotEmpty) {
      json['tags'] = tags;
    }
    if (coverImageUrl != null && coverImageUrl!.isNotEmpty) {
      json['coverImageUrl'] = coverImageUrl;
    }
    if (examDate != null) {
      json['examDate'] = examDate!.toIso8601String();
    }
    if (examSubject != null && examSubject!.isNotEmpty) {
      json['examSubject'] = examSubject;
    }

    return json;
  }
}

