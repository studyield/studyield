import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';

class SessionSummaryDialog extends StatelessWidget {
  final int totalCards;
  final int correctCount;
  final int hardCount;
  final VoidCallback onDone;

  const SessionSummaryDialog({
    super.key,
    required this.totalCards,
    required this.correctCount,
    required this.hardCount,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final againCount = totalCards - correctCount - hardCount;
    final accuracy = totalCards > 0
        ? ((correctCount / totalCards) * 100).toStringAsFixed(0)
        : '0';

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimensions.radiusXLarge),
      ),
      child: Padding(
        padding: EdgeInsets.all(AppDimensions.space24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Success Icon
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
              decoration: BoxDecoration(
                gradient: AppColors.greenGradient,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_circle_outline,
                size: 60,
                color: Colors.white,
              ),
            ),

            SizedBox(height: AppDimensions.space24),

            // Title
            Text(
              'flashcards.widgets.session_summary.title'.tr(),
              style: AppTextStyles.headlineSmall.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),

            SizedBox(height: AppDimensions.space8),

            Text(
              'flashcards.widgets.session_summary.cards_reviewed'.tr(namedArgs: {'count': totalCards.toString()}),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
            ),

            SizedBox(height: AppDimensions.space24),

            // Stats
            Container(
              padding: EdgeInsets.all(AppDimensions.space16),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(
                  AppDimensions.radiusMedium,
                ),
                border: Border.all(
                  color: theme.colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
              child: Column(
                children: [
                  _buildStatRow(
                    'flashcards.widgets.session_summary.accuracy'.tr(),
                    '$accuracy%',
                    AppColors.primary,
                  ),
                  Divider(height: 24),
                  _buildStatRow(
                    'flashcards.widgets.session_summary.easy_good'.tr(),
                    correctCount.toString(),
                    AppColors.success,
                  ),
                  Divider(height: 24),
                  _buildStatRow(
                    'flashcards.widgets.session_summary.hard'.tr(),
                    hardCount.toString(),
                    AppColors.warning,
                  ),
                  Divider(height: 24),
                  _buildStatRow(
                    'flashcards.widgets.session_summary.again'.tr(),
                    againCount.toString(),
                    AppColors.error,
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space24),

            // Done Button
            PrimaryButton(
              text: 'flashcards.widgets.session_summary.done'.tr(),
              onPressed: onDone,
              width: double.infinity,
              gradient: AppColors.greenGradient,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 6,
          ),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            value,
            style: AppTextStyles.titleSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}
