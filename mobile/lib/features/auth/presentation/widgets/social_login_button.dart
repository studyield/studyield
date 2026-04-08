import 'package:flutter/material.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';

class SocialLoginButton extends StatelessWidget {
  final String text;
  final IconData icon;
  final Color backgroundColor;
  final Color textColor;
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isSquare;
  final Widget? customChild;

  const SocialLoginButton({
    super.key,
    required this.text,
    required this.icon,
    required this.backgroundColor,
    required this.textColor,
    required this.onPressed,
    this.isLoading = false,
    this.isSquare = false,
    this.customChild,
  });

  @override
  Widget build(BuildContext context) {
    if (isSquare) {
      return SizedBox(
        width: 56,
        height: 56,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: backgroundColor,
            padding: EdgeInsets.zero,
            side: BorderSide(
              color: textColor.withValues(alpha: 0.15),
              width: 1,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
            ),
          ),
          child: isLoading
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(textColor),
                  ),
                )
              : customChild ?? Icon(
                  icon,
                  color: textColor,
                  size: AppDimensions.iconLarge,
                ),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: AppDimensions.buttonHeightMedium,
      child: OutlinedButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(textColor),
                ),
              )
            : Icon(
                icon,
                color: textColor,
                size: AppDimensions.iconMedium,
              ),
        label: Text(
          text,
          style: AppTextStyles.button.copyWith(
            color: textColor,
          ),
        ),
        style: OutlinedButton.styleFrom(
          backgroundColor: backgroundColor,
          side: BorderSide(
            color: textColor.withValues(alpha: 0.3),
            width: 1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          ),
        ),
      ),
    );
  }
}
