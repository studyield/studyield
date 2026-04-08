import '../../domain/entities/graph_data_entity.dart';

class GraphPointModel extends GraphPoint {
  const GraphPointModel({
    required super.x,
    required super.y,
  });

  factory GraphPointModel.fromJson(Map<String, dynamic> json) {
    return GraphPointModel(
      x: (json['x'] ?? 0.0).toDouble(),
      y: (json['y'] ?? 0.0).toDouble(),
    );
  }
}

class GraphFunctionModel extends GraphFunction {
  const GraphFunctionModel({
    required super.expression,
    required super.points,
    required super.color,
    super.label,
  });

  factory GraphFunctionModel.fromJson(Map<String, dynamic> json) {
    return GraphFunctionModel(
      expression: json['expression'] ?? '',
      points: (json['points'] as List<dynamic>?)
              ?.map((e) => GraphPointModel.fromJson(e))
              .toList() ??
          [],
      color: json['color'] ?? '#000000',
      label: json['label'],
    );
  }
}

class SpecialPointModel extends SpecialPoint {
  const SpecialPointModel({
    required super.x,
    required super.y,
    required super.type,
    super.label,
  });

  factory SpecialPointModel.fromJson(Map<String, dynamic> json) {
    return SpecialPointModel(
      x: (json['x'] ?? 0.0).toDouble(),
      y: (json['y'] ?? 0.0).toDouble(),
      type: json['type'] ?? 'point',
      label: json['label'],
    );
  }
}

class GraphDataModel extends GraphDataEntity {
  const GraphDataModel({
    required super.id,
    required super.sessionId,
    required super.functions,
    required super.specialPoints,
    required super.minX,
    required super.maxX,
    required super.minY,
    required super.maxY,
    super.title,
    super.xAxisLabel,
    super.yAxisLabel,
    required super.createdAt,
  });

  factory GraphDataModel.fromJson(Map<String, dynamic> json) {
    return GraphDataModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      functions: (json['functions'] as List<dynamic>?)
              ?.map((e) => GraphFunctionModel.fromJson(e))
              .toList() ??
          [],
      specialPoints: (json['specialPoints'] as List<dynamic>?)
              ?.map((e) => SpecialPointModel.fromJson(e))
              .toList() ??
          [],
      minX: (json['minX'] ?? -10.0).toDouble(),
      maxX: (json['maxX'] ?? 10.0).toDouble(),
      minY: (json['minY'] ?? -10.0).toDouble(),
      maxY: (json['maxY'] ?? 10.0).toDouble(),
      title: json['title'],
      xAxisLabel: json['xAxisLabel'],
      yAxisLabel: json['yAxisLabel'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  GraphDataEntity toEntity() => this;
}
