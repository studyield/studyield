class GenerateQuizRequest {
  final String? studySetId;
  final String? content;
  final String title;
  final int? questionCount;
  final List<String>? questionTypes;
  final String? difficulty;

  GenerateQuizRequest({
    this.studySetId,
    this.content,
    required this.title,
    this.questionCount,
    this.questionTypes,
    this.difficulty,
  });

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{
      'title': title,
    };

    if (studySetId != null) json['studySetId'] = studySetId;
    if (content != null) json['content'] = content;
    if (questionCount != null) json['questionCount'] = questionCount;
    if (questionTypes != null) json['questionTypes'] = questionTypes;
    if (difficulty != null) json['difficulty'] = difficulty;

    return json;
  }
}
