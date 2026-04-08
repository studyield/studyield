import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../screens/add_flashcard_screen.dart';

class FlashcardListItem extends StatelessWidget {
  final FlashcardEntity flashcard;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const FlashcardListItem({
    super.key,
    required this.flashcard,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: () {
          _showOptionsBottomSheet(context);
        },
        borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
        child: Container(
          padding: EdgeInsets.all(AppDimensions.space16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
            border: Border.all(
              color: theme.colorScheme.onSurface.withOpacity(0.1),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badges Row
              Row(
                children: [
                  // New badge
                  if (flashcard.repetitions == 0)
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.info.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'New',
                        style: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.info,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  if (flashcard.repetitions == 0 && flashcard.isDue)
                    SizedBox(width: 8),
                  // Due badge
                  if (flashcard.isDue)
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Due',
                        style: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  Spacer(),
                ],
              ),
              SizedBox(height: AppDimensions.space12),
              Text(
                flashcard.front,
                style: AppTextStyles.titleSmall.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: AppDimensions.space8),
              Text(
                flashcard.back,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (flashcard.tags.isNotEmpty) ...[
                SizedBox(height: AppDimensions.space12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: flashcard.tags.take(3).map((tag) {
                    return Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.grey200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        tag,
                        style: AppTextStyles.labelSmall.copyWith(
                          color: AppColors.grey700,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (flashcard.statusLabel) {
      case 'New':
        return AppColors.info;
      case 'Learning':
        return AppColors.warning;
      case 'Review':
        return AppColors.primary;
      case 'Mastered':
        return AppColors.success;
      default:
        return AppColors.grey600;
    }
  }

  void _showOptionsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppDimensions.radiusXLarge),
        ),
      ),
      builder: (bottomSheetContext) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: AppDimensions.space16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.grey300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                SizedBox(height: AppDimensions.space16),
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: AppDimensions.space16,
                  ),
                  child: Text(
                    flashcard.front,
                    style: AppTextStyles.titleSmall.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                SizedBox(height: AppDimensions.space16),
                Divider(height: 1),
                ListTile(
                  leading: Icon(
                    Icons.edit_rounded,
                    color: AppColors.primary,
                  ),
                  title: Text('flashcards.list_item.edit_card'.tr()),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => AddFlashcardScreen(
                          studySetId: flashcard.studySetId,
                          flashcard: flashcard,
                        ),
                      ),
                    );
                  },
                ),
                ListTile(
                  leading: Icon(
                    Icons.delete_rounded,
                    color: AppColors.error,
                  ),
                  title: Text(
                    'Delete Card',
                    style: TextStyle(color: AppColors.error),
                  ),
                  onTap: () {
                    Navigator.pop(bottomSheetContext);
                    _showDeleteConfirmation(context);
                  },
                ),
                SizedBox(height: AppDimensions.space8),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('flashcards.list_item.delete_title'.tr()),
        content: Text('flashcards.list_item.delete_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              onDelete();
            },
            child: Text(
              'Delete',
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
