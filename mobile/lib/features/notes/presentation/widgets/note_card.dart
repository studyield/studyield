import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/note_entity.dart';

class NoteCard extends StatelessWidget {
  final NoteEntity note;
  final VoidCallback onTap;
  final VoidCallback onPin;
  final VoidCallback onDelete;
  final Function(String) onTagTap;

  const NoteCard({
    super.key,
    required this.note,
    required this.onTap,
    required this.onPin,
    required this.onDelete,
    required this.onTagTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPinned = note.isPinned;
    final isAIGenerated = note.sourceType == 'ai_generated';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isPinned
              ? AppColors.accent.withOpacity(0.05)
              : theme.cardColor,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          border: Border.all(
            color: isPinned
                ? AppColors.accent.withOpacity(0.3)
                : theme.colorScheme.onSurface.withOpacity(0.1),
            width: isPinned ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              children: [
                // Pinned Indicator
                if (isPinned) ...[
                  Icon(
                    Icons.push_pin,
                    size: 14,
                    color: AppColors.accent,
                  ),
                  const SizedBox(width: 4),
                ],

                // Source Type Badge
                if (note.sourceType != 'manual')
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: isAIGenerated
                          ? AppColors.purple.withOpacity(0.1)
                          : AppColors.secondary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isAIGenerated)
                          Icon(
                            Icons.auto_awesome,
                            size: 10,
                            color: AppColors.purple,
                          ),
                        const SizedBox(width: 2),
                        Text(
                          note.sourceType.replaceAll('_', ' '),
                          style: AppTextStyles.bodySmall.copyWith(
                            fontSize: 9,
                            color: isAIGenerated
                                ? AppColors.purple
                                : AppColors.secondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),

                const Spacer(),

                // Action Buttons
                IconButton(
                  onPressed: onPin,
                  icon: Icon(
                    isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                    size: 18,
                    color: isPinned ? AppColors.accent : AppColors.grey600,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: onDelete,
                  icon: const Icon(
                    Icons.delete_outline,
                    size: 18,
                    color: AppColors.error,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Title
            Text(
              note.title,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.w600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            // Summary (if available)
            if (note.summary != null && note.summary!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.auto_awesome,
                    size: 12,
                    color: AppColors.purple.withOpacity(0.8),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      note.summary!.length > 80
                          ? '${note.summary!.substring(0, 80)}...'
                          : note.summary!,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.purple.withOpacity(0.8),
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 8),

            // Content Preview
            Text(
              _stripHtml(note.content),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 12),

            // Footer Row
            Row(
              children: [
                // Date
                Text(
                  DateFormat('MMM d, yyyy').format(note.updatedAt),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey500,
                    fontSize: 11,
                  ),
                ),

                const SizedBox(width: 12),

                // Tags
                if (note.tags.isNotEmpty) ...[
                  Expanded(
                    child: Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: note.tags.take(3).map((tag) {
                        return InkWell(
                          onTap: () => onTagTap(tag),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '#$tag',
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 10,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  if (note.tags.length > 3)
                    Text(
                      '+${note.tags.length - 3}',
                      style: AppTextStyles.bodySmall.copyWith(
                        fontSize: 10,
                        color: AppColors.grey500,
                      ),
                    ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _stripHtml(String html) {
    final stripped = html
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll(RegExp(r'[#*_=]'), '');
    final length = stripped.length;
    return stripped.substring(0, length > 150 ? 150 : length);
  }
}
