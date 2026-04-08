import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_dimensions.dart';
import '../../theme/app_text_styles.dart';

/// Primary button widget used across the app
/// Follows the design system
/// Supports both solid colors and gradients

class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isDisabled;
  final IconData? icon;
  final double? width;
  final double height;
  final Color? backgroundColor;
  final Gradient? gradient;
  final Color? textColor;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.width,
    this.height = AppDimensions.buttonHeightMedium,
    this.backgroundColor,
    this.gradient,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isButtonDisabled = isDisabled || isLoading || onPressed == null;

    // Use gradient if provided, otherwise use solid color
    final buttonGradient = gradient ??
        (backgroundColor == null
            ? LinearGradient(
                colors: [theme.colorScheme.primary, theme.colorScheme.primary],
              )
            : LinearGradient(
                colors: [backgroundColor!, backgroundColor!],
              ));

    final buttonChild = isLoading
        ? SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                textColor ?? Colors.white,
              ),
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: AppDimensions.iconSmall,
                  color: textColor ?? Colors.white,
                ),
                SizedBox(width: AppDimensions.space8),
              ],
              Text(
                text,
                style: AppTextStyles.button.copyWith(
                  color: textColor ?? Colors.white,
                ),
              ),
            ],
          );

    return SizedBox(
      width: width,
      height: height,
      child: isButtonDisabled
          ? Container(
              decoration: BoxDecoration(
                color: AppColors.grey300,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius:
                      BorderRadius.circular(AppDimensions.radiusMedium),
                  onTap: null,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: AppDimensions.space20,
                    ),
                    alignment: Alignment.center,
                    child: buttonChild,
                  ),
                ),
              ),
            )
          : Container(
              decoration: BoxDecoration(
                gradient: buttonGradient,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                boxShadow: [
                  BoxShadow(
                    color: (gradient?.colors.first ?? backgroundColor ?? theme.colorScheme.primary)
                        .withOpacity(0.3),
                    blurRadius: 8,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius:
                      BorderRadius.circular(AppDimensions.radiusMedium),
                  onTap: onPressed,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: AppDimensions.space20,
                    ),
                    alignment: Alignment.center,
                    child: buttonChild,
                  ),
                ),
              ),
            ),
    );
  }
}
