class QuizEntity {
  final String id;
  final String userId;
  final String? studySetId;
  final String title;
  final String? description;
  final int questionCount;
  final int? timeLimit;
  final bool isPublic;
  final DateTime createdAt;
  final DateTime updatedAt;

  QuizEntity({
    required this.id,
    required this.userId,
    this.studySetId,
    required this.title,
    this.description,
    required this.questionCount,
    this.timeLimit,
    required this.isPublic,
    required this.createdAt,
    required this.updatedAt,
  });

  factory QuizEntity.fromJson(Map<String, dynamic> json) {
    return QuizEntity(
      id: json['id'] as String,
      userId: json['userId'] as String,
      studySetId: json['studySetId'] as String?,
      title: json['title'] as String,
      description: json['description'] as String?,
      questionCount: json['questionCount'] as int,
      timeLimit: json['timeLimit'] as int?,
      isPublic: json['isPublic'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'studySetId': studySetId,
      'title': title,
      'description': description,
      'questionCount': questionCount,
      'timeLimit': timeLimit,
      'isPublic': isPublic,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
