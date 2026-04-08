import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/study_set_entity.dart';

class StudySetCard extends StatelessWidget {
  final StudySetEntity studySet;
  final VoidCallback onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const StudySetCard({
    super.key,
    required this.studySet,
    required this.onTap,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
        child: Container(
          padding: EdgeInsets.all(AppDimensions.space16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardDark : AppColors.cardLight,
            borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── Top row: icon + title + menu ────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cover image or icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: studySet.coverImageUrl == null
                          ? AppColors.greenGradient
                          : null,
                      borderRadius: BorderRadius.circular(
                        AppDimensions.radiusMedium,
                      ),
                    ),
                    child: studySet.coverImageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(
                              AppDimensions.radiusMedium,
                            ),
                            child: Image.network(
                              studySet.coverImageUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _buildIconPlaceholder(),
                            ),
                          )
                        : _buildIconPlaceholder(),
                  ),
                  SizedBox(width: AppDimensions.space12),

                  // Title + visibility
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          studySet.title,
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: 4),
                        // Visibility badge
                        Row(
                          children: [
                            Icon(
                              studySet.isPublic ? Icons.public : Icons.lock_outline,
                              size: 13,
                              color: studySet.isPublic
                                  ? AppColors.primary
                                  : AppColors.grey500,
                            ),
                            SizedBox(width: 4),
                            Text(
                              studySet.isPublic
                                  ? 'study_sets.card.public'.tr()
                                  : 'study_sets.card.private'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 11,
                                color: studySet.isPublic
                                    ? AppColors.primary
                                    : AppColors.grey500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Popup menu
                  if (onEdit != null || onDelete != null)
                    PopupMenuButton<String>(
                      icon: Icon(
                        Icons.more_vert,
                        size: 20,
                        color: AppColors.grey500,
                      ),
                      padding: EdgeInsets.zero,
                      constraints: BoxConstraints(),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      ),
                      onSelected: (value) {
                        if (value == 'edit') onEdit?.call();
                        if (value == 'delete') onDelete?.call();
                      },
                      itemBuilder: (context) => [
                        if (onEdit != null)
                          PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit_outlined, size: 18, color: AppColors.primary),
                                SizedBox(width: AppDimensions.space8),
                                Text('study_sets.card.edit'.tr()),
                              ],
                            ),
                          ),
                        if (onDelete != null)
                          PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                                SizedBox(width: AppDimensions.space8),
                                Text(
                                  'study_sets.card.delete'.tr(),
                                  style: TextStyle(color: AppColors.error),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                ],
              ),

              // ─── Description ─────────────────────────────────
              if (studySet.description != null &&
                  studySet.description!.isNotEmpty) ...[
                SizedBox(height: AppDimensions.space8),
                Text(
                  studySet.description!,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              SizedBox(height: AppDimensions.space12),

              // ─── Counts row ──────────────────────────────────
              Row(
                children: [
                  _buildCountChip(
                    Icons.style_outlined,
                    'study_sets.card.cards_count'.tr(
                      namedArgs: {'count': studySet.flashcardsCount.toString()},
                    ),
                    isDark,
                  ),
                  SizedBox(width: AppDimensions.space8),
                  _buildCountChip(
                    Icons.description_outlined,
                    'study_sets.card.docs_count'.tr(
                      namedArgs: {'count': studySet.documentsCount.toString()},
                    ),
                    isDark,
                  ),
                  Spacer(),
                  // Tags
                  if (studySet.tags.isNotEmpty) ..._buildTagChips(isDark),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIconPlaceholder() {
    return Center(
      child: Icon(
        Icons.collections_bookmark_rounded,
        color: Colors.white,
        size: 24,
      ),
    );
  }

  Widget _buildCountChip(IconData icon, String text, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.grey500),
        SizedBox(width: 4),
        Text(
          text,
          style: AppTextStyles.bodySmall.copyWith(
            fontSize: 11,
            color: AppColors.grey500,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildTagChips(bool isDark) {
    final maxTags = 2;
    final visibleTags = studySet.tags.take(maxTags).toList();
    final remaining = studySet.tags.length - maxTags;

    final chips = <Widget>[];
    for (final tag in visibleTags) {
      chips.add(
        Container(
          margin: EdgeInsets.only(left: 4),
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppDimensions.radiusRound),
          ),
          child: Text(
            tag,
            style: AppTextStyles.bodySmall.copyWith(
              fontSize: 10,
              color: isDark ? AppColors.primaryLight : AppColors.primaryDark,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    if (remaining > 0) {
      chips.add(
        Container(
          margin: EdgeInsets.only(left: 4),
          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.grey200.withValues(alpha: isDark ? 0.2 : 1),
            borderRadius: BorderRadius.circular(AppDimensions.radiusRound),
          ),
          child: Text(
            '+$remaining',
            style: AppTextStyles.bodySmall.copyWith(
              fontSize: 10,
              color: AppColors.grey600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    return chips;
  }
}
