import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import 'dart:math' as math;

class StudySetMindMapScreen extends StatefulWidget {
  final String studySetId;
  final String studySetTitle;

  const StudySetMindMapScreen({
    super.key,
    required this.studySetId,
    required this.studySetTitle,
  });

  @override
  State<StudySetMindMapScreen> createState() => _StudySetMindMapScreenState();
}

class _StudySetMindMapScreenState extends State<StudySetMindMapScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _mindMapData;
  String? _error;

  final TransformationController _transformationController = TransformationController();

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

      // Get all notes for the study set
      final notesResponse = await apiClient.get('/study-sets/${widget.studySetId}/notes');
      final notes = notesResponse.data as List<dynamic>;

      if (notes.isEmpty) {
        setState(() {
          _error = 'notes.noNotesForMindMap'.tr();
          _isLoading = false;
        });
        return;
      }

      // Combine all notes content
      final combinedContent = notes.map((note) => note['content'] as String).join('\n\n');

      // Generate mind map from combined content
      final response = await apiClient.post('/ai/generate-mind-map', data: {
        'title': widget.studySetTitle,
        'content': combinedContent,
      });

      setState(() {
        _mindMapData = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
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
              widget.studySetTitle,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMindMap,
            tooltip: 'notes.regenerateButton'.tr(),
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              showDialog(
                context: context,
                builder: (_) => AlertDialog(
                  title: Text('notes.mindMapGuideTitle'.tr()),
                  content: Text('notes.mindMapGuideContent'.tr()),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('common.gotIt'.tr()),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppColors.secondary),
                  const SizedBox(height: 16),
                  Text(
                    'notes.analyzingNotesMessage'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'notes.creatingMindMapMessage'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey500,
                    ),
                  ),
                ],
              ),
            )
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline, size: 64, color: AppColors.error),
                        const SizedBox(height: 16),
                        Text(
                          'notes.mindMapGenerationFailed'.tr(),
                          style: AppTextStyles.bodyLarge.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _error!,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _loadMindMap,
                          icon: const Icon(Icons.refresh),
                          label: Text('common.tryAgain'.tr()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.secondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _mindMapData != null
                  ? Column(
                      children: [
                        // Info banner
                        Container(
                          margin: const EdgeInsets.all(16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: AppColors.secondaryGradient,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, color: Colors.white, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'notes.mindMapHelpText'.tr(),
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Mind map viewer
                        Expanded(
                          child: InteractiveViewer(
                            transformationController: _transformationController,
                            minScale: 0.5,
                            maxScale: 4.0,
                            boundaryMargin: const EdgeInsets.all(200),
                            child: Center(
                              child: MindMapCanvas(data: _mindMapData!),
                            ),
                          ),
                        ),
                      ],
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
      size: const Size(900, 700),
      painter: MindMapPainter(
        centralTopic: centralTopic,
        branches: branches,
      ),
      child: const SizedBox(width: 900, height: 700),
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
    if (branches.isEmpty) return;

    final angleStep = (2 * math.pi) / branches.length;
    for (int i = 0; i < branches.length; i++) {
      final branch = branches[i] as Map<String, dynamic>;
      final angle = i * angleStep - math.pi / 2; // Start from top
      final radius = 220.0;

      final branchX = centerX + radius * math.cos(angle);
      final branchY = centerY + radius * math.sin(angle);

      // Draw curved line from center to branch
      _drawCurvedLine(
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
        final childAngleSpread = math.pi / 3; // 60 degrees spread
        final childAngleStep = childAngleSpread / (children.length + 1);
        final childRadius = 120.0;

        for (int j = 0; j < children.length; j++) {
          final child = children[j] as Map<String, dynamic>;
          final childAngle = angle - childAngleSpread / 2 + (j + 1) * childAngleStep;

          final childX = branchX + childRadius * math.cos(childAngle);
          final childY = branchY + childRadius * math.sin(childAngle);

          // Draw line from branch to child
          _drawCurvedLine(
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
    // Draw outer glow
    final glowPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);
    canvas.drawCircle(center, 70, glowPaint);

    // Draw circle
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 65, paint);

    // Draw border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;
    canvas.drawCircle(center, 65, borderPaint);

    // Draw text
    _drawText(canvas, center, label, Colors.white, 16, FontWeight.bold, 110);
  }

  void _drawBranchNode(Canvas canvas, Offset center, String label, Color color) {
    // Draw shadow
    final shadowRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: center.translate(2, 2), width: 150, height: 65),
      const Radius.circular(14),
    );
    final shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.15)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawRRect(shadowRect, shadowPaint);

    // Draw rounded rectangle
    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: center, width: 150, height: 65),
      const Radius.circular(14),
    );

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rect, paint);

    // Draw border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawRRect(rect, borderPaint);

    // Draw text
    _drawText(canvas, center, label, Colors.white, 14, FontWeight.w600, 130);
  }

  void _drawChildNode(Canvas canvas, Offset center, String label, Color color) {
    // Draw small rounded rectangle
    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: center, width: 110, height: 45),
      const Radius.circular(10),
    );

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rect, paint);

    // Draw border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRRect(rect, borderPaint);

    // Draw text
    _drawText(canvas, center, label, Colors.white, 11, FontWeight.w500, 95);
  }

  void _drawCurvedLine(Canvas canvas, Offset start, Offset end, Color color) {
    final paint = Paint()
      ..color = color.withOpacity(0.5)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final controlPoint = Offset(
      (start.dx + end.dx) / 2,
      (start.dy + end.dy) / 2 - 20,
    );

    final path = Path()
      ..moveTo(start.dx, start.dy)
      ..quadraticBezierTo(
        controlPoint.dx,
        controlPoint.dy,
        end.dx,
        end.dy,
      );

    canvas.drawPath(path, paint);
  }

  void _drawText(Canvas canvas, Offset center, String text, Color color, double fontSize, FontWeight weight, double maxWidth) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: weight,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
      maxLines: 3,
      ellipsis: '...',
    );

    textPainter.layout(maxWidth: maxWidth);
    textPainter.paint(
      canvas,
      Offset(center.dx - textPainter.width / 2, center.dy - textPainter.height / 2),
    );
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
