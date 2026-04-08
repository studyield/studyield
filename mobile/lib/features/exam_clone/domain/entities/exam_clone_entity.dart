import 'package:equatable/equatable.dart';
import 'exam_style_entity.dart';

enum ExamCloneStatus { pending, processing, completed, failed }

class ExamCloneEntity extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String? subject;
  final String? originalFileUrl;
  final ExamStyleEntity? extractedStyle;
  final ExamCloneStatus status;
  final int originalQuestionCount;
  final int generatedQuestionCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ExamCloneEntity({
    required this.id,
    required this.userId,
    required this.title,
    this.subject,
    this.originalFileUrl,
    this.extractedStyle,
    required this.status,
    this.originalQuestionCount = 0,
    this.generatedQuestionCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        subject,
        originalFileUrl,
        extractedStyle,
        status,
        originalQuestionCount,
        generatedQuestionCount,
        createdAt,
        updatedAt,
      ];

  ExamCloneEntity copyWith({
    String? id,
    String? userId,
    String? title,
    String? subject,
    String? originalFileUrl,
    ExamStyleEntity? extractedStyle,
    ExamCloneStatus? status,
    int? originalQuestionCount,
    int? generatedQuestionCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ExamCloneEntity(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      subject: subject ?? this.subject,
      originalFileUrl: originalFileUrl ?? this.originalFileUrl,
      extractedStyle: extractedStyle ?? this.extractedStyle,
      status: status ?? this.status,
      originalQuestionCount: originalQuestionCount ?? this.originalQuestionCount,
      generatedQuestionCount: generatedQuestionCount ?? this.generatedQuestionCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
