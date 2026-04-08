import 'package:equatable/equatable.dart';

enum Difficulty { easy, medium, hard }

class SimilarProblemEntity extends Equatable {
  final String id;
  final String problem;
  final Difficulty difficulty;
  final String similarity;
  final String? hint;

  const SimilarProblemEntity({
    required this.id,
    required this.problem,
    required this.difficulty,
    required this.similarity,
    this.hint,
  });

  @override
  List<Object?> get props => [id, problem, difficulty, similarity, hint];
}
