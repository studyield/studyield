import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/content/latex_text_widget.dart';
import '../../domain/entities/alternative_method_entity.dart';

class AlternativeMethodCard extends StatefulWidget {
  final AlternativeMethodEntity method;

  const AlternativeMethodCard({
    super.key,
    required this.method,
  });

  @override
  State<AlternativeMethodCard> createState() => _AlternativeMethodCardState();
}

class _AlternativeMethodCardState extends State<AlternativeMethodCard> {
  bool _isExpanded = false;

  Color _getMethodColor(MethodType type) {
    switch (type) {
      case MethodType.algebraic:
        return Colors.blue;
      case MethodType.geometric:
        return AppColors.purple;
      case MethodType.numerical:
        return Colors.green;
      case MethodType.graphical:
        return Colors.orange;
      case MethodType.analytical:
        return Colors.teal;
      case MethodType.other:
        return Colors.grey;
    }
  }

  String _getMethodTypeLabel(MethodType type) {
    switch (type) {
      case MethodType.algebraic:
        return 'problem_solver.widgets.method_type.algebraic'.tr();
      case MethodType.geometric:
        return 'problem_solver.widgets.method_type.geometric'.tr();
      case MethodType.numerical:
        return 'problem_solver.widgets.method_type.numerical'.tr();
      case MethodType.graphical:
        return 'problem_solver.widgets.method_type.graphical'.tr();
      case MethodType.analytical:
        return 'problem_solver.widgets.method_type.analytical'.tr();
      case MethodType.other:
        return 'problem_solver.widgets.method_type.other'.tr();
    }
  }

  void _copyAllSteps() {
    final stepsText = widget.method.steps
        .asMap()
        .entries
        .map((entry) => '${entry.key + 1}. ${entry.value}')
        .join('\n');

    Clipboard.setData(ClipboardData(text: stepsText));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Text('problem_solver.widgets.steps_copied'.tr()),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final methodColor = _getMethodColor(widget.method.type);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: _isExpanded ? methodColor.withOpacity(0.5) : Colors.transparent,
          width: 2,
        ),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Method type badge
                  Flexible(
                    flex: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: methodColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: methodColor.withOpacity(0.5),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.label,
                            size: 14,
                            color: methodColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _getMethodTypeLabel(widget.method.type),
                            style: TextStyle(
                              color: methodColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Method name
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.method.methodName,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (widget.method.complexity != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Complexity: ${widget.method.complexity}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Expand/collapse icon
                  Icon(
                    _isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),
          // Description (always visible)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 20, 0),
            child: LatexRichText(
              text: widget.method.description,
              textStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.black87,
                    fontSize: 13,
                  ),
            ),
          ),
          const SizedBox(height: 16),
          // Expandable steps section
          if (_isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 16, 12, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.method.steps.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'problem_solver.widgets.steps'.tr(),
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: OutlinedButton.icon(
                            onPressed: _copyAllSteps,
                            icon: const Icon(Icons.copy, size: 16),
                            label: Text('problem_solver.widgets.copy'.tr()),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: methodColor,
                              side: BorderSide(color: methodColor),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (widget.method.steps.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                        child: Text(
                          'problem_solver.widgets.no_steps'.tr(),
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    )
                  else
                    ...widget.method.steps.asMap().entries.map(
                    (entry) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: IntrinsicHeight(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: methodColor.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: methodColor,
                                    width: 2,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    '${entry.key + 1}',
                                    style: TextStyle(
                                      color: methodColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(right: 4),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      LatexRichText(
                                        text: entry.value,
                                        textStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: Colors.black,
                                              fontSize: 13,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  // Advantages and disadvantages
                  if (widget.method.advantages != null ||
                      widget.method.disadvantages != null) ...[
                    const SizedBox(height: 16),
                    if (widget.method.advantages != null) ...[
                      _buildProsCons(
                        'problem_solver.widgets.advantages'.tr(),
                        widget.method.advantages!,
                        Colors.green,
                        Icons.check_circle,
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (widget.method.disadvantages != null)
                      _buildProsCons(
                        'problem_solver.widgets.disadvantages'.tr(),
                        widget.method.disadvantages!,
                        Colors.red,
                        Icons.cancel,
                      ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProsCons(
    String title,
    Map<String, dynamic> data,
    Color color,
    IconData icon,
  ) {
    // Extract list from the map (assuming it's stored as a list in 'items' key)
    final items = data['items'] as List<dynamic>? ?? [];

    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...items.map((item) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 4, left: 24),
            child: Text(
              '• ${item.toString()}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          );
        }),
      ],
    );
  }
}
