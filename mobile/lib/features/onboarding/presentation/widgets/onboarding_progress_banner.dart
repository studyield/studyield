import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class OnboardingProgressBanner extends StatelessWidget {
  final int currentTask;
  final int totalTasks;
  final bool taskOneComplete;
  final bool taskTwoComplete;
  final bool taskThreeComplete;
  final bool taskFourComplete;
  final VoidCallback onSkip;

  const OnboardingProgressBanner({
    super.key,
    required this.currentTask,
    required this.totalTasks,
    required this.taskOneComplete,
    required this.taskTwoComplete,
    required this.taskThreeComplete,
    required this.taskFourComplete,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    final completedCount = [taskOneComplete, taskTwoComplete, taskThreeComplete, taskFourComplete]
        .where((e) => e)
        .length;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: AppColors.greenGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              // Tour Icon
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.explore,
                  color: Colors.white,
                  size: 20,
                ),
              ),

              const SizedBox(width: 12),

              // Progress Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Tour',
                      style: AppTextStyles.labelLarge.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$completedCount of $totalTasks tasks completed',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              // Skip Button
              TextButton(
                onPressed: onSkip,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Skip',
                      style: AppTextStyles.labelMedium.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.close, color: Colors.white, size: 16),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: completedCount / totalTasks,
              minHeight: 6,
              backgroundColor: Colors.white.withOpacity(0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),

          const SizedBox(height: 12),

          // Task Checklist
          Row(
            children: [
              Expanded(
                child: _buildTaskIndicator(
                  '1. Research',
                  taskOneComplete,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: _buildTaskIndicator(
                  '2. Cards',
                  taskTwoComplete,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: _buildTaskIndicator(
                  '3. Solver',
                  taskThreeComplete,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: _buildTaskIndicator(
                  '4. Quiz',
                  taskFourComplete,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTaskIndicator(String label, bool isComplete) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: isComplete
            ? Colors.white.withOpacity(0.25)
            : Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isComplete ? Colors.white : Colors.white.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isComplete ? Icons.check_circle : Icons.radio_button_unchecked,
            color: Colors.white,
            size: 16,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: Colors.white,
                fontSize: 11,
                fontWeight: isComplete ? FontWeight.bold : FontWeight.normal,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
