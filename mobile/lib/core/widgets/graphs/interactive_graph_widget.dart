import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:math_expressions/math_expressions.dart';
import '../../../features/problem_solver/domain/entities/graph_data_entity.dart';
import '../../theme/app_colors.dart';

class InteractiveGraphWidget extends StatefulWidget {
  final GraphDataEntity graphData;
  final double height;

  const InteractiveGraphWidget({
    super.key,
    required this.graphData,
    this.height = 400,
  });

  @override
  State<InteractiveGraphWidget> createState() => _InteractiveGraphWidgetState();
}

class _InteractiveGraphWidgetState extends State<InteractiveGraphWidget> {
  double _minX = -10;
  double _maxX = 10;
  double _minY = -10;
  double _maxY = 10;

  @override
  void initState() {
    super.initState();
    _resetToInitialBounds();
  }

  @override
  void didUpdateWidget(InteractiveGraphWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reset bounds if graph data changes
    if (oldWidget.graphData != widget.graphData) {
      _resetToInitialBounds();
    }
  }

  void _resetToInitialBounds() {
    setState(() {
      _minX = widget.graphData.minX;
      _maxX = widget.graphData.maxX;
      _minY = widget.graphData.minY;
      _maxY = widget.graphData.maxY;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Check if we have valid data
    if (widget.graphData.functions.isEmpty) {
      return SizedBox(
        height: widget.height,
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.show_chart, size: 64, color: AppColors.grey400),
              SizedBox(height: 16),
              Text(
                'No graph functions available',
                style: TextStyle(color: AppColors.grey600),
              ),
            ],
          ),
        ),
      );
    }

    // Note: We can generate points from expressions even if backend doesn't provide them
    // So we don't need to check for points, just check for valid expressions

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.graphData.title != null)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              widget.graphData.title!,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
              textAlign: TextAlign.center,
            ),
          ),
        Container(
          height: widget.height,
          padding: const EdgeInsets.all(16.0),
          child: LineChart(
            _buildChartData(),
            duration: const Duration(milliseconds: 250),
          ),
        ),
        if (widget.graphData.functions.isNotEmpty) _buildLegend(),
        _buildControls(),
      ],
    );
  }

  LineChartData _buildChartData() {
    return LineChartData(
      minX: _minX,
      maxX: _maxX,
      minY: _minY,
      maxY: _maxY,
      gridData: FlGridData(
        show: true,
        drawVerticalLine: true,
        drawHorizontalLine: true,
        horizontalInterval: (_maxY - _minY) / 10,
        verticalInterval: (_maxX - _minX) / 10,
        getDrawingHorizontalLine: (value) {
          return FlLine(
            color: AppColors.border.withOpacity(0.3),
            strokeWidth: value == 0 ? 2 : 1,
          );
        },
        getDrawingVerticalLine: (value) {
          return FlLine(
            color: AppColors.border.withOpacity(0.3),
            strokeWidth: value == 0 ? 2 : 1,
          );
        },
      ),
      titlesData: FlTitlesData(
        leftTitles: AxisTitles(
          axisNameWidget: widget.graphData.yAxisLabel != null
              ? Text(widget.graphData.yAxisLabel!)
              : null,
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 40,
            interval: (_maxY - _minY) / 5,
          ),
        ),
        bottomTitles: AxisTitles(
          axisNameWidget: widget.graphData.xAxisLabel != null
              ? Text(widget.graphData.xAxisLabel!)
              : null,
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 30,
            interval: (_maxX - _minX) / 5,
          ),
        ),
        rightTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        topTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
      ),
      borderData: FlBorderData(
        show: true,
        border: Border.all(color: AppColors.border, width: 1),
      ),
      clipData: FlClipData.all(),
      lineBarsData: _buildLineBars(),
      extraLinesData: ExtraLinesData(
        horizontalLines: [
          HorizontalLine(
            y: 0,
            color: AppColors.textPrimary.withOpacity(0.5),
            strokeWidth: 2,
          ),
        ],
        verticalLines: [
          VerticalLine(
            x: 0,
            color: AppColors.textPrimary.withOpacity(0.5),
            strokeWidth: 2,
          ),
        ],
      ),
      showingTooltipIndicators: _buildSpecialPointIndicators(),
      lineTouchData: LineTouchData(
        enabled: true,
        touchTooltipData: LineTouchTooltipData(
          getTooltipItems: (List<LineBarSpot> touchedSpots) {
            return touchedSpots.map((spot) {
              final function = widget.graphData.functions[spot.barIndex];
              return LineTooltipItem(
                '${function.label ?? function.expression}\n(${spot.x.toStringAsFixed(2)}, ${spot.y.toStringAsFixed(2)})',
                const TextStyle(color: Colors.white),
              );
            }).toList();
          },
        ),
      ),
    );
  }

  List<LineChartBarData> _buildLineBars() {
    if (widget.graphData.functions.isEmpty) {
      return [];
    }

    return widget.graphData.functions.map((function) {
      final color = _parseColor(function.color);

      // Dynamically generate points for current zoom level
      final spots = _evaluateFunction(function.expression, 200);

      return LineChartBarData(
        spots: spots,
        isCurved: true,
        curveSmoothness: 0.35,
        color: color,
        barWidth: 3,
        isStrokeCapRound: true,
        dotData: FlDotData(
          show: true,
          getDotPainter: (spot, percent, barData, index) {
            // Show dots only for special points
            final isSpecial = widget.graphData.specialPoints.any(
              (sp) => (sp.x - spot.x).abs() < 0.1 && (sp.y - spot.y).abs() < 0.1,
            );

            if (isSpecial) {
              return FlDotCirclePainter(
                radius: 5,
                color: color,
                strokeWidth: 2,
                strokeColor: Colors.white,
              );
            }

            return FlDotCirclePainter(
              radius: 0,
              color: Colors.transparent,
            );
          },
        ),
        belowBarData: BarAreaData(show: false),
        preventCurveOverShooting: true,
      );
    }).toList();
  }

  /// Evaluate a mathematical expression for the current zoom range
  List<FlSpot> _evaluateFunction(String expression, int numPoints) {
    final spots = <FlSpot>[];

    try {
      // Parse expression using math_expressions
      final parser = Parser();
      final exp = parser.parse(expression);
      final variable = Variable('x');
      final contextModel = ContextModel();

      final step = (_maxX - _minX) / (numPoints - 1);

      for (int i = 0; i < numPoints; i++) {
        final x = _minX + i * step;
        contextModel.bindVariable(variable, Number(x));

        try {
          final y = exp.evaluate(EvaluationType.REAL, contextModel);

          if (y is num && y.isFinite) {
            spots.add(FlSpot(x, y.toDouble()));
          }
        } catch (e) {
          // Skip invalid points (division by zero, etc.)
          continue;
        }
      }
    } catch (e) {
      // If expression can't be parsed, return empty
      debugPrint('Failed to evaluate expression "$expression": $e');
    }

    return spots;
  }

  List<ShowingTooltipIndicators> _buildSpecialPointIndicators() {
    // Show indicators for special points (critical points, intercepts, etc.)
    return [];
  }

  Widget _buildLegend() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Wrap(
        spacing: 16,
        runSpacing: 8,
        children: widget.graphData.functions.map((function) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 24,
                height: 3,
                decoration: BoxDecoration(
                  color: _parseColor(function.color),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                function.label ?? function.expression,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildControls() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _resetZoom,
            icon: const Icon(Icons.refresh),
            tooltip: 'Reset',
            style: IconButton.styleFrom(
              backgroundColor: AppColors.purple.withOpacity(0.1),
              foregroundColor: AppColors.purple,
            ),
          ),
          const SizedBox(width: 16),
          IconButton(
            onPressed: _zoomOut,
            icon: const Icon(Icons.remove),
            tooltip: 'Zoom Out',
            style: IconButton.styleFrom(
              backgroundColor: AppColors.purple.withOpacity(0.1),
              foregroundColor: AppColors.purple,
            ),
          ),
          const SizedBox(width: 16),
          IconButton(
            onPressed: _zoomIn,
            icon: const Icon(Icons.add),
            tooltip: 'Zoom In',
            style: IconButton.styleFrom(
              backgroundColor: AppColors.purple.withOpacity(0.1),
              foregroundColor: AppColors.purple,
            ),
          ),
        ],
      ),
    );
  }

  void _resetZoom() {
    _resetToInitialBounds();
  }

  void _zoomIn() {
    setState(() {
      final centerX = (_minX + _maxX) / 2;
      final centerY = (_minY + _maxY) / 2;
      final rangeX = (_maxX - _minX);
      final rangeY = (_maxY - _minY);

      // Zoom in by 50% (reduce range by half)
      _minX = centerX - rangeX * 0.25;
      _maxX = centerX + rangeX * 0.25;
      _minY = centerY - rangeY * 0.25;
      _maxY = centerY + rangeY * 0.25;
    });
  }

  void _zoomOut() {
    setState(() {
      final centerX = (_minX + _maxX) / 2;
      final centerY = (_minY + _maxY) / 2;
      final rangeX = (_maxX - _minX);
      final rangeY = (_maxY - _minY);

      // Zoom out by 100% (double the range)
      _minX = centerX - rangeX;
      _maxX = centerX + rangeX;
      _minY = centerY - rangeY;
      _maxY = centerY + rangeY;
    });
  }

  Color _parseColor(String colorString) {
    // Remove # if present
    String hex = colorString.replaceAll('#', '');

    // Add alpha if not present
    if (hex.length == 6) {
      hex = 'FF$hex';
    }

    try {
      return Color(int.parse(hex, radix: 16));
    } catch (e) {
      // Default to purple if parsing fails
      return AppColors.purple;
    }
  }
}
