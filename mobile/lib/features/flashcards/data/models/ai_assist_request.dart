class AiAssistRequest {
  final String flashcardId;
  final String action;
  final String front;
  final String? back;

  AiAssistRequest({
    required this.flashcardId,
    required this.action,
    required this.front,
    this.back,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'flashcardId': flashcardId,
      'action': action,
      'front': front,
    };

    if (back != null && back!.isNotEmpty) {
      json['back'] = back;
    }

    return json;
  }
}
