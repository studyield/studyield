import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/complexity_explanation_entity.dart';

class ComplexitySelectorWidget extends StatefulWidget {
  final ExplanationLevel selectedLevel;
  final Function(ExplanationLevel) onLevelChanged;
  final bool isLoading;

  const ComplexitySelectorWidget({
    super.key,
    required this.selectedLevel,
    required this.onLevelChanged,
    this.isLoading = false,
  });

  @override
  State<ComplexitySelectorWidget> createState() =>
      _ComplexitySelectorWidgetState();
}

class _ComplexitySelectorWidgetState extends State<ComplexitySelectorWidget> {
  final Map<ExplanationLevel, String> _levelLabels = {
    ExplanationLevel.eli5: 'ELI5',
    ExplanationLevel.beginner: 'Beginner',
    ExplanationLevel.intermediate: 'Intermediate',
    ExplanationLevel.advanced: 'Advanced',
  };

  final Map<ExplanationLevel, IconData> _levelIcons = {
    ExplanationLevel.eli5: Icons.lightbulb_outline,
    ExplanationLevel.beginner: Icons.school,
    ExplanationLevel.intermediate: Icons.work_outline,
    ExplanationLevel.advanced: Icons.psychology,
  };

  final Map<ExplanationLevel, String> _levelDescriptions = {
    ExplanationLevel.eli5: 'Simple explanation for everyone',
    ExplanationLevel.beginner: 'Basic concepts and steps',
    ExplanationLevel.intermediate: 'Detailed technical explanation',
    ExplanationLevel.advanced: 'In-depth analysis and theory',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.border.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.tune,
                size: 20,
                color: AppColors.purple,
              ),
              const SizedBox(width: 8),
              Text(
                'Explanation Level',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 2.5,
            children: ExplanationLevel.values.map((level) {
              return _buildLevelButton(level);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelButton(ExplanationLevel level) {
    final isSelected = widget.selectedLevel == level;
    final isLoadingThis = widget.isLoading && isSelected;

    return InkWell(
      onTap: isLoadingThis ? null : () => widget.onLevelChanged(level),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.purpleGradient : null,
          color: isSelected ? null : AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : AppColors.border.withOpacity(0.5),
            width: 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.purple.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Stack(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _levelIcons[level],
                  size: 20,
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _levelLabels[level]!,
                    style: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (isLoadingThis)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.purpleGradient.scale(0.8),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
