import 'package:equatable/equatable.dart';

class FormulaCardEntity extends Equatable {
  final String front;
  final String back;
  final String category;
  final String subject;

  const FormulaCardEntity({
    required this.front,
    required this.back,
    required this.category,
    required this.subject,
  });

  @override
  List<Object?> get props => [front, back, category, subject];
}
