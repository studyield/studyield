class ImportFlashcardsRequest {
  final String studySetId;
  final String source;
  final String? content;
  final String? filePath;
  final String? separator;

  ImportFlashcardsRequest({
    required this.studySetId,
    required this.source,
    this.content,
    this.filePath,
    this.separator,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'studySetId': studySetId,
      'source': source,
    };

    if (content != null && content!.isNotEmpty) {
      json['content'] = content;
    }
    if (filePath != null && filePath!.isNotEmpty) {
      json['filePath'] = filePath;
    }
    if (separator != null && separator!.isNotEmpty) {
      json['separator'] = separator;
    }

    return json;
  }
}
