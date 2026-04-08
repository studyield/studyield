class StudySetEntity {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final bool isPublic;
  final List<String> tags;
  final String? coverImageUrl;
  final int flashcardsCount;
  final int documentsCount;
  final DateTime? examDate;
  final String? examSubject;
  final DateTime createdAt;
  final DateTime updatedAt;

  StudySetEntity({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    required this.isPublic,
    required this.tags,
    this.coverImageUrl,
    required this.flashcardsCount,
    required this.documentsCount,
    this.examDate,
    this.examSubject,
    required this.createdAt,
    required this.updatedAt,
  });

  static const _months = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
  };

  /// Parse date strings that may be ISO 8601 or JS Date.toString() format
  static DateTime? _tryParseDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;
    // Try ISO 8601 first
    final parsed = DateTime.tryParse(dateStr);
    if (parsed != null) return parsed;
    // Handle JS Date.toString() format:
    // "Sat Feb 28 2026 00:00:00 GMT+0000 (Coordinated Universal Time)"
    final match = RegExp(
      r'\w+\s+(\w+)\s+(\d+)\s+(\d+)\s+(\d+):(\d+):(\d+)',
    ).firstMatch(dateStr);
    if (match != null) {
      final month = _months[match.group(1)] ?? 1;
      return DateTime.utc(
        int.parse(match.group(3)!),
        month,
        int.parse(match.group(2)!),
        int.parse(match.group(4)!),
        int.parse(match.group(5)!),
        int.parse(match.group(6)!),
      );
    }
    return null;
  }

  factory StudySetEntity.fromJson(Map<String, dynamic> json) {
    return StudySetEntity(
      id: json['id'] as String,
      userId: json['userId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      isPublic: json['isPublic'] as bool? ?? false,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      coverImageUrl: json['coverImageUrl'] as String?,
      flashcardsCount: json['flashcardsCount'] as int? ?? 0,
      documentsCount: json['documentsCount'] as int? ?? 0,
      examDate: _tryParseDate(json['examDate'] as String?),
      examSubject: json['examSubject'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'description': description,
      'isPublic': isPublic,
      'tags': tags,
      'coverImageUrl': coverImageUrl,
      'flashcardsCount': flashcardsCount,
      'documentsCount': documentsCount,
      if (examDate != null) 'examDate': examDate!.toIso8601String(),
      if (examSubject != null) 'examSubject': examSubject,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
