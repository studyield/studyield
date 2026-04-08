import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class FeatureBadge extends StatelessWidget {
  final String label;
  final bool isPro;

  const FeatureBadge({
    super.key,
    required this.label,
    this.isPro = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: isPro ? AppColors.purpleGradient : null,
        color: isPro ? null : AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        boxShadow: isPro
            ? [
                BoxShadow(
                  color: AppColors.purple.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isPro)
            const Icon(
              Icons.diamond,
              size: 14,
              color: AppColors.white,
            ),
          if (isPro) const SizedBox(width: 4),
          Text(
            label,
            style: AppTextStyles.labelSmall.copyWith(
              color: isPro ? AppColors.white : AppColors.primary,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
