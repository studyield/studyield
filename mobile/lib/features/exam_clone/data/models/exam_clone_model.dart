import '../../domain/entities/exam_clone_entity.dart';
import 'exam_style_model.dart';

class ExamCloneModel extends ExamCloneEntity {
  const ExamCloneModel({
    required super.id,
    required super.userId,
    required super.title,
    super.subject,
    super.originalFileUrl,
    super.extractedStyle,
    required super.status,
    super.originalQuestionCount,
    super.generatedQuestionCount,
    required super.createdAt,
    required super.updatedAt,
  });

  factory ExamCloneModel.fromJson(Map<String, dynamic> json) {
    return ExamCloneModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      title: json['title'] as String,
      subject: json['subject'] as String?,
      originalFileUrl: json['originalFileUrl'] as String?,
      extractedStyle: json['extractedStyle'] != null
          ? ExamStyleModel.fromJson(
              json['extractedStyle'] as Map<String, dynamic>)
          : null,
      status: _parseStatus(json['status'] as String?),
      originalQuestionCount: json['originalQuestionCount'] as int? ?? 0,
      generatedQuestionCount: json['generatedQuestionCount'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  static ExamCloneStatus _parseStatus(String? status) {
    switch (status) {
      case 'pending':
        return ExamCloneStatus.pending;
      case 'processing':
        return ExamCloneStatus.processing;
      case 'completed':
        return ExamCloneStatus.completed;
      case 'failed':
        return ExamCloneStatus.failed;
      default:
        return ExamCloneStatus.pending;
    }
  }

  static String _statusToString(ExamCloneStatus status) {
    switch (status) {
      case ExamCloneStatus.pending:
        return 'pending';
      case ExamCloneStatus.processing:
        return 'processing';
      case ExamCloneStatus.completed:
        return 'completed';
      case ExamCloneStatus.failed:
        return 'failed';
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'subject': subject,
      'originalFileUrl': originalFileUrl,
      'extractedStyle': extractedStyle != null
          ? (extractedStyle as ExamStyleModel).toJson()
          : null,
      'status': _statusToString(status),
      'originalQuestionCount': originalQuestionCount,
      'generatedQuestionCount': generatedQuestionCount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  ExamCloneEntity toEntity() {
    return ExamCloneEntity(
      id: id,
      userId: userId,
      title: title,
      subject: subject,
      originalFileUrl: originalFileUrl,
      extractedStyle: extractedStyle,
      status: status,
      originalQuestionCount: originalQuestionCount,
      generatedQuestionCount: generatedQuestionCount,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
