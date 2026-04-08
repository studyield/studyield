import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_dimensions.dart';
import '../../theme/app_text_styles.dart';
import '../buttons/primary_button.dart';

/// Global error dialog widget

class ErrorDialog extends StatelessWidget {
  final String title;
  final String message;
  final String? buttonText;
  final VoidCallback? onPressed;

  const ErrorDialog({
    super.key,
    this.title = 'Error',
    required this.message,
    this.buttonText,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimensions.dialogBorderRadius),
      ),
      child: Padding(
        padding: EdgeInsets.all(AppDimensions.space24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Error Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 32,
                color: AppColors.error,
              ),
            ),

            SizedBox(height: AppDimensions.space16),

            // Title
            Text(
              title,
              style: AppTextStyles.titleLarge,
              textAlign: TextAlign.center,
            ),

            SizedBox(height: AppDimensions.space8),

            // Message
            Text(
              message,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey700,
              ),
              textAlign: TextAlign.center,
            ),

            SizedBox(height: AppDimensions.space24),

            // Button
            PrimaryButton(
              text: buttonText ?? 'OK',
              onPressed: () {
                Navigator.of(context).pop();
                onPressed?.call();
              },
              width: double.infinity,
              backgroundColor: AppColors.error,
            ),
          ],
        ),
      ),
    );
  }

  /// Show error dialog helper
  static Future<void> show(
    BuildContext context, {
    String title = 'Error',
    required String message,
    String? buttonText,
    VoidCallback? onPressed,
  }) {
    return showDialog(
      context: context,
      builder: (context) => ErrorDialog(
        title: title,
        message: message,
        buttonText: buttonText,
        onPressed: onPressed,
      ),
    );
  }
}
