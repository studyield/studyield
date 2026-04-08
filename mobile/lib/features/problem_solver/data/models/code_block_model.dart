import '../../domain/entities/code_block_entity.dart';

class CodeBlockModel extends CodeBlockEntity {
  const CodeBlockModel({
    required super.id,
    required super.sessionId,
    required super.code,
    required super.language,
    super.description,
    super.lineStart,
    super.lineEnd,
    super.isExecutable,
    super.output,
    required super.createdAt,
  });

  factory CodeBlockModel.fromJson(Map<String, dynamic> json) {
    return CodeBlockModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      code: json['code'] ?? '',
      language: json['language'] ?? 'text',
      description: json['description'],
      lineStart: json['lineStart'],
      lineEnd: json['lineEnd'],
      isExecutable: json['isExecutable'] ?? false,
      output: json['output'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  CodeBlockEntity toEntity() => this;
}
