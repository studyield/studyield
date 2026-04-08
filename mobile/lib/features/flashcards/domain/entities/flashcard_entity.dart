import 'flashcard_type.dart';

class FlashcardEntity {
  final String id;
  final String studySetId;
  final String front;
  final String back;
  final String? notes;
  final List<String> tags;
  final String type;
  final int difficulty;
  final int interval;
  final int repetitions;
  final double easeFactor;
  final DateTime? nextReviewAt;
  final DateTime? lastReviewedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  FlashcardEntity({
    required this.id,
    required this.studySetId,
    required this.front,
    required this.back,
    this.notes,
    required this.tags,
    this.type = 'standard',
    required this.difficulty,
    required this.interval,
    required this.repetitions,
    required this.easeFactor,
    this.nextReviewAt,
    this.lastReviewedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FlashcardEntity.fromJson(Map<String, dynamic> json) {
    // Handle both full entities from DB and AI-generated flashcards
    final now = DateTime.now();
    return FlashcardEntity(
      id: json['id'] as String? ?? '',
      studySetId: json['studySetId'] as String? ?? '',
      front: json['front'] as String,
      back: json['back'] as String,
      notes: json['notes'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      type: json['type'] as String? ?? 'standard',
      difficulty: json['difficulty'] as int? ?? 0,
      interval: json['interval'] as int? ?? 0,
      repetitions: json['repetitions'] as int? ?? 0,
      easeFactor: (json['easeFactor'] as num?)?.toDouble() ?? 2.5,
      nextReviewAt: json['nextReviewAt'] != null
          ? DateTime.parse(json['nextReviewAt'] as String)
          : null,
      lastReviewedAt: json['lastReviewedAt'] != null
          ? DateTime.parse(json['lastReviewedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : now,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : now,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studySetId': studySetId,
      'front': front,
      'back': back,
      'notes': notes,
      'tags': tags,
      'type': type,
      'difficulty': difficulty,
      'interval': interval,
      'repetitions': repetitions,
      'easeFactor': easeFactor,
      'nextReviewAt': nextReviewAt?.toIso8601String(),
      'lastReviewedAt': lastReviewedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isDue {
    if (nextReviewAt == null) return true;
    return nextReviewAt!.isBefore(DateTime.now());
  }

  String get statusLabel {
    if (repetitions == 0) return 'New';
    if (interval < 7) return 'Learning';
    if (interval < 30) return 'Review';
    return 'Mastered';
  }

  bool get isStandard => type == 'standard';
  bool get isCloze => type == 'cloze';
  bool get isImageOcclusion => type == 'image_occlusion';

  FlashcardType get flashcardType => FlashcardType.fromString(type);
}
