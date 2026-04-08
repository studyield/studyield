class CreateFlashcardRequest {
  final String studySetId;
  final String front;
  final String back;
  final String? notes;
  final List<String>? tags;
  final String? type;

  CreateFlashcardRequest({
    required this.studySetId,
    required this.front,
    required this.back,
    this.notes,
    this.tags,
    this.type = 'standard',
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'studySetId': studySetId,  // camelCase for NestJS
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

    print('CreateFlashcardRequest.toJson(): $json');
    return json;
  }
}
