import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import 'dart:math' as math;

class MindMapScreen extends StatefulWidget {
  final String noteId;
  final String noteTitle;

  const MindMapScreen({
    super.key,
    required this.noteId,
    required this.noteTitle,
  });

  @override
  State<MindMapScreen> createState() => _MindMapScreenState();
}

class _MindMapScreenState extends State<MindMapScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _mindMapData;
  String? _error;

  TransformationController _transformationController = TransformationController();

  @override
  void initState() {
    super.initState();
    _loadMindMap();
  }

  @override
  void dispose() {
    _transformationController.dispose();
    super.dispose();
  }

  Future<void> _loadMindMap() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/notes/${widget.noteId}/mind-map');

      setState(() {
        _mindMapData = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'notes.mindMapTitle'.tr(),
              style: AppTextStyles.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            Text(
              widget.noteTitle,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _loadMindMap,
            tooltip: 'notes.regenerateButton'.tr(),
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'notes.generatingMindMapMessage'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                ],
              ),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: AppColors.error),
                      SizedBox(height: 16),
                      Text(
                        'notes.mindMapGenerationFailed'.tr(),
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: 8),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          _error!,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _loadMindMap,
                        icon: Icon(Icons.refresh),
                        label: Text('common.tryAgain'.tr()),
                      ),
                    ],
                  ),
                )
              : _mindMapData != null
                  ? InteractiveViewer(
                      transformationController: _transformationController,
                      minScale: 0.5,
                      maxScale: 3.0,
                      boundaryMargin: EdgeInsets.all(100),
                      child: Center(
                        child: MindMapCanvas(data: _mindMapData!),
                      ),
                    )
                  : Center(child: Text('common.noData'.tr())),
    );
  }
}

class MindMapCanvas extends StatelessWidget {
  final Map<String, dynamic> data;

  const MindMapCanvas({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final centralTopic = data['centralTopic'] as Map<String, dynamic>;
    final branches = (data['branches'] as List<dynamic>?) ?? [];

    return CustomPaint(
      size: Size(800, 600),
      painter: MindMapPainter(
        centralTopic: centralTopic,
        branches: branches,
      ),
      child: SizedBox(width: 800, height: 600),
    );
  }
}

class MindMapPainter extends CustomPainter {
  final Map<String, dynamic> centralTopic;
  final List<dynamic> branches;

  MindMapPainter({
    required this.centralTopic,
    required this.branches,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    // Draw central topic
    _drawCentralNode(
      canvas,
      Offset(centerX, centerY),
      centralTopic['label'] as String,
      _parseColor(centralTopic['color'] as String? ?? '#8b5cf6'),
    );

    // Draw branches in circular layout
    final angleStep = (2 * math.pi) / branches.length;
    for (int i = 0; i < branches.length; i++) {
      final branch = branches[i] as Map<String, dynamic>;
      final angle = i * angleStep - math.pi / 2; // Start from top
      final radius = 180.0;

      final branchX = centerX + radius * math.cos(angle);
      final branchY = centerY + radius * math.sin(angle);

      // Draw line from center to branch
      _drawLine(
        canvas,
        Offset(centerX, centerY),
        Offset(branchX, branchY),
        _parseColor(branch['color'] as String? ?? '#10b981'),
      );

      // Draw branch node
      _drawBranchNode(
        canvas,
        Offset(branchX, branchY),
        branch['label'] as String,
        _parseColor(branch['color'] as String? ?? '#10b981'),
      );

      // Draw children
      final children = (branch['children'] as List<dynamic>?) ?? [];
      if (children.isNotEmpty) {
        final childAngleStep = math.pi / (children.length + 1);
        final childRadius = 100.0;

        for (int j = 0; j < children.length; j++) {
          final child = children[j] as Map<String, dynamic>;
          final childAngle = angle - math.pi / 2 + (j + 1) * childAngleStep;

          final childX = branchX + childRadius * math.cos(childAngle);
          final childY = branchY + childRadius * math.sin(childAngle);

          // Draw line from branch to child
          _drawLine(
            canvas,
            Offset(branchX, branchY),
            Offset(childX, childY),
            _parseColor(child['color'] as String? ?? '#34d399'),
          );

          // Draw child node
          _drawChildNode(
            canvas,
            Offset(childX, childY),
            child['label'] as String,
            _parseColor(child['color'] as String? ?? '#34d399'),
          );
        }
      }
    }
  }

  void _drawCentralNode(Canvas canvas, Offset center, String label, Color color) {
    // Draw circle
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    canvas.drawCircle(center, 60, paint);

    // Draw border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawCircle(center, 60, borderPaint);

    // Draw text
    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    textPainter.layout(maxWidth: 100);
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - textPainter.height / 2),
    );
  }

  void _drawBranchNode(Canvas canvas, Offset center, String label, Color color) {
    // Draw rounded rectangle
    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: center, width: 140, height: 60),
      Radius.circular(12),
    );

    final paint = Paint()
      ..color = color.withOpacity(0.9)
      ..style = PaintingStyle.fill;

    canvas.drawRRect(rect, paint);

    // Draw border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRRect(rect, borderPaint);

    // Draw text
    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    textPainter.layout(maxWidth: 120);
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - textPainter.height / 2),
    );
  }

  void _drawChildNode(Canvas canvas, Offset center, String label, Color color) {
    // Draw small rounded rectangle
    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: center, width: 100, height: 40),
      Radius.circular(8),
    );

    final paint = Paint()
      ..color = color.withOpacity(0.8)
      ..style = PaintingStyle.fill;

    canvas.drawRRect(rect, paint);

    // Draw text
    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    textPainter.layout(maxWidth: 85);
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - textPainter.height / 2),
    );
  }

  void _drawLine(Canvas canvas, Offset start, Offset end, Color color) {
    final paint = Paint()
      ..color = color.withOpacity(0.4)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    canvas.drawLine(start, end, paint);
  }

  Color _parseColor(String colorString) {
    String hex = colorString.replaceAll('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex';
    }
    try {
      return Color(int.parse(hex, radix: 16));
    } catch (e) {
      return AppColors.secondary;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
