import '../../domain/entities/alternative_method_entity.dart';

class AlternativeMethodModel extends AlternativeMethodEntity {
  const AlternativeMethodModel({
    required super.id,
    required super.sessionId,
    required super.methodName,
    required super.type,
    required super.description,
    required super.steps,
    super.complexity,
    super.advantages,
    super.disadvantages,
    required super.createdAt,
  });

  factory AlternativeMethodModel.fromJson(Map<String, dynamic> json) {
    // Parse solution steps which contains the actual steps
    final solutionSteps = json['solutionSteps'] as Map<String, dynamic>? ?? {};
    final output = solutionSteps['output'] as String? ?? '';
    final metadata = solutionSteps['metadata'] as Map<String, dynamic>? ?? {};

    // Parse steps from output text
    final steps = _parseStepsFromOutput(output);

    return AlternativeMethodModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      methodName: json['methodName'] ?? '',
      type: _parseMethodType(metadata['methodType'] as String?),
      description: json['methodDescription'] ?? '',
      steps: steps,
      complexity: metadata['complexity'] as String?,
      advantages: metadata['advantages'] as Map<String, dynamic>?,
      disadvantages: metadata['disadvantages'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  static List<String> _parseStepsFromOutput(String output) {
    if (output.isEmpty) return [];

    final steps = <String>[];
    final lines = output.split('\n');
    String currentStep = '';

    for (var line in lines) {
      final trimmed = line.trim();
      // Check if line starts with a number followed by period or parenthesis
      final match = RegExp(r'^\d+[\.)]\s+').firstMatch(trimmed);

      if (match != null) {
        // Save previous step if exists
        if (currentStep.isNotEmpty) {
          steps.add(currentStep.trim());
        }
        // Start new step (remove the number prefix)
        currentStep = trimmed.substring(match.end);
      } else if (trimmed.isNotEmpty && !trimmed.startsWith('**')) {
        // Continue current step (skip markdown headers)
        if (currentStep.isNotEmpty) {
          currentStep += '\n';
        }
        currentStep += trimmed;
      }
    }

    // Add the last step
    if (currentStep.isNotEmpty) {
      steps.add(currentStep.trim());
    }

    // If no numbered steps found, split by double newlines
    if (steps.isEmpty && output.isNotEmpty) {
      return output.split('\n\n').where((s) => s.trim().isNotEmpty).toList();
    }

    return steps;
  }

  static MethodType _parseMethodType(String? type) {
    switch (type?.toLowerCase()) {
      case 'algebraic':
        return MethodType.algebraic;
      case 'geometric':
        return MethodType.geometric;
      case 'numerical':
        return MethodType.numerical;
      case 'graphical':
        return MethodType.graphical;
      case 'analytical':
        return MethodType.analytical;
      default:
        return MethodType.other;
    }
  }

  AlternativeMethodEntity toEntity() => this;
}
