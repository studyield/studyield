import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/exam_clone_entity.dart';

class ExamCard extends StatelessWidget {
  final ExamCloneEntity exam;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback? onPractice;
  final VoidCallback? onViewAnalysis;

  const ExamCard({
    super.key,
    required this.exam,
    required this.onTap,
    required this.onDelete,
    this.onPractice,
    this.onViewAnalysis,
  });

  @override
  Widget build(BuildContext context) {
    final statusConfig = _getStatusConfig(exam.status);

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: AppColors.grey300.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with icon and status
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF9333EA), Color(0xFFEC4899)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.description_outlined,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exam.title,
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (exam.subject != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            exam.subject!,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.grey600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusConfig.bgColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          statusConfig.icon,
                          size: 14,
                          color: statusConfig.color,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          statusConfig.label,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: statusConfig.color,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // Stats (only for completed exams)
              if (exam.status == ExamCloneStatus.completed &&
                  exam.extractedStyle != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildStatItem(
                      Icons.book_outlined,
                      '${exam.originalQuestionCount} original',
                    ),
                    const SizedBox(width: 16),
                    _buildStatItem(
                      Icons.auto_awesome,
                      '${exam.generatedQuestionCount} generated',
                    ),
                  ],
                ),
                if (exam.extractedStyle!.questionTypes.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _buildStatItem(
                    Icons.bar_chart,
                    '${exam.extractedStyle!.questionTypes.length} types',
                  ),
                ],
              ],

              // Topics
              if (exam.extractedStyle?.topicsCovered != null &&
                  exam.extractedStyle!.topicsCovered.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    ...exam.extractedStyle!.topicsCovered.take(3).map(
                          (topic) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.grey200,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              topic,
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ),
                    if (exam.extractedStyle!.topicsCovered.length > 3)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        child: Text(
                          '+${exam.extractedStyle!.topicsCovered.length - 3} more',
                          style: AppTextStyles.bodySmall.copyWith(
                            fontSize: 11,
                            color: AppColors.grey600,
                          ),
                        ),
                      ),
                  ],
                ),
              ],

              // Actions
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Uploaded ${_formatDate(exam.createdAt)}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey600,
                        fontSize: 11,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        onPressed: onDelete,
                        icon: const Icon(Icons.delete_outline),
                        iconSize: 20,
                        color: AppColors.error,
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.all(8),
                      ),
                      if (exam.status == ExamCloneStatus.completed) ...[
                        const SizedBox(width: 2),
                        TextButton(
                          onPressed: onViewAnalysis,
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
                            minimumSize: const Size(0, 32),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'exam_clone.list.analysis'.tr(),
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(width: 2),
                              const Icon(Icons.chevron_right, size: 14),
                            ],
                          ),
                        ),
                        const SizedBox(width: 2),
                        ElevatedButton(
                          onPressed: onPractice,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF9333EA),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 8,
                            ),
                            minimumSize: const Size(0, 32),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            textStyle: AppTextStyles.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.play_arrow, size: 14),
                              const SizedBox(width: 4),
                              Text('exam_clone.list.practice'.tr()),
                            ],
                          ),
                        ),
                      ],
                      if (exam.status == ExamCloneStatus.failed)
                        TextButton.icon(
                          onPressed: null,
                          icon: const Icon(Icons.error_outline, size: 16),
                          label: Text('exam_clone.list.failed'.tr()),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.error,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.grey600),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.grey600,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'research.date.today'.tr();
    } else if (difference.inDays == 1) {
      return 'research.date.yesterday'.tr();
    } else if (difference.inDays < 7) {
      return 'research.date.days_ago'.tr(namedArgs: {'days': '${difference.inDays}'});
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  _StatusConfig _getStatusConfig(ExamCloneStatus status) {
    switch (status) {
      case ExamCloneStatus.pending:
        return _StatusConfig(
          label: 'exam_clone.list.stats.pending'.tr(),
          color: const Color(0xFFF59E0B),
          bgColor: const Color(0xFFFEF3C7),
          icon: Icons.schedule,
        );
      case ExamCloneStatus.processing:
        return _StatusConfig(
          label: 'exam_clone.list.stats.processing'.tr(),
          color: const Color(0xFF3B82F6),
          bgColor: const Color(0xFFDBEAFE),
          icon: Icons.autorenew,
        );
      case ExamCloneStatus.completed:
        return _StatusConfig(
          label: 'exam_clone.list.stats.ready'.tr(),
          color: const Color(0xFF10B981),
          bgColor: const Color(0xFFD1FAE5),
          icon: Icons.check_circle_outline,
        );
      case ExamCloneStatus.failed:
        return _StatusConfig(
          label: 'exam_clone.list.stats.failed'.tr(),
          color: const Color(0xFFEF4444),
          bgColor: const Color(0xFFFEE2E2),
          icon: Icons.error_outline,
        );
    }
  }
}

class _StatusConfig {
  final String label;
  final Color color;
  final Color bgColor;
  final IconData icon;

  _StatusConfig({
    required this.label,
    required this.color,
    required this.bgColor,
    required this.icon,
  });
}
