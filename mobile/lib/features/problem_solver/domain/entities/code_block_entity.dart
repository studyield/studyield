import 'package:equatable/equatable.dart';

class CodeBlockEntity extends Equatable {
  final String id;
  final String sessionId;
  final String code;
  final String language;
  final String? description;
  final int? lineStart;
  final int? lineEnd;
  final bool isExecutable;
  final String? output;
  final DateTime createdAt;

  const CodeBlockEntity({
    required this.id,
    required this.sessionId,
    required this.code,
    required this.language,
    this.description,
    this.lineStart,
    this.lineEnd,
    this.isExecutable = false,
    this.output,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        code,
        language,
        description,
        lineStart,
        lineEnd,
        isExecutable,
        output,
        createdAt,
      ];
}
