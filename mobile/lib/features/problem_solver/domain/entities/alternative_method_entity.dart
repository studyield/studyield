import 'package:equatable/equatable.dart';

enum MethodType { algebraic, geometric, numerical, graphical, analytical, other }

class AlternativeMethodEntity extends Equatable {
  final String id;
  final String sessionId;
  final String methodName;
  final MethodType type;
  final String description;
  final List<String> steps;
  final String? complexity;
  final Map<String, dynamic>? advantages;
  final Map<String, dynamic>? disadvantages;
  final DateTime createdAt;

  const AlternativeMethodEntity({
    required this.id,
    required this.sessionId,
    required this.methodName,
    required this.type,
    required this.description,
    required this.steps,
    this.complexity,
    this.advantages,
    this.disadvantages,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        methodName,
        type,
        description,
        steps,
        complexity,
        advantages,
        disadvantages,
        createdAt,
      ];
}
