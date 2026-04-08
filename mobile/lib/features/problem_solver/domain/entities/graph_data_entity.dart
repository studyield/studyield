import 'package:equatable/equatable.dart';

class GraphPoint {
  final double x;
  final double y;

  const GraphPoint({
    required this.x,
    required this.y,
  });
}

class GraphFunction {
  final String expression;
  final List<GraphPoint> points;
  final String color;
  final String? label;

  const GraphFunction({
    required this.expression,
    required this.points,
    required this.color,
    this.label,
  });
}

class SpecialPoint {
  final double x;
  final double y;
  final String type; // 'critical', 'intercept', 'asymptote', etc.
  final String? label;

  const SpecialPoint({
    required this.x,
    required this.y,
    required this.type,
    this.label,
  });
}

class GraphDataEntity extends Equatable {
  final String id;
  final String sessionId;
  final List<GraphFunction> functions;
  final List<SpecialPoint> specialPoints;
  final double minX;
  final double maxX;
  final double minY;
  final double maxY;
  final String? title;
  final String? xAxisLabel;
  final String? yAxisLabel;
  final DateTime createdAt;

  const GraphDataEntity({
    required this.id,
    required this.sessionId,
    required this.functions,
    required this.specialPoints,
    required this.minX,
    required this.maxX,
    required this.minY,
    required this.maxY,
    this.title,
    this.xAxisLabel,
    this.yAxisLabel,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        functions,
        specialPoints,
        minX,
        maxX,
        minY,
        maxY,
        title,
        xAxisLabel,
        yAxisLabel,
        createdAt,
      ];
}
