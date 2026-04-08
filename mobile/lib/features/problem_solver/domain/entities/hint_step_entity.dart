import 'package:equatable/equatable.dart';

class HintStepEntity extends Equatable {
  final String hint;
  final int hintNumber;
  final int totalHintsNeeded;
  final bool isLastHint;
  final String? nextHintPreview;

  const HintStepEntity({
    required this.hint,
    required this.hintNumber,
    required this.totalHintsNeeded,
    required this.isLastHint,
    this.nextHintPreview,
  });

  @override
  List<Object?> get props => [
        hint,
        hintNumber,
        totalHintsNeeded,
        isLastHint,
        nextHintPreview,
      ];
}
