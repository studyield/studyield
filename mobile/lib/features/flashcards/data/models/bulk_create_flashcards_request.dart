class BulkCreateFlashcardsRequest {
  final String studySetId;
  final List<FlashcardData> flashcards;

  BulkCreateFlashcardsRequest({
    required this.studySetId,
    required this.flashcards,
  });

  Map<String, dynamic> toJson() {
    return {
      'flashcards': flashcards.map((f) => f.toJson()).toList(),
    };
  }
}

class FlashcardData {
  final String front;
  final String back;
  final String? notes;
  final List<String>? tags;
  final String? type;

  FlashcardData({
    required this.front,
    required this.back,
    this.notes,
    this.tags,
    this.type = 'standard',
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'front': front,
      'back': back,
    };

    if (notes != null && notes!.isNotEmpty) {
      json['notes'] = notes;
    }
    if (tags != null && tags!.isNotEmpty) {
      json['tags'] = tags;
    }
    if (type != null && type!.isNotEmpty) {
      json['type'] = type;
    }

    return json;
  }
}
