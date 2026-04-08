import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:another_flushbar/flushbar.dart';
import 'package:audioplayers/audioplayers.dart';
import '../theme/app_colors.dart';

class NotificationUIHelper {
  static final AudioPlayer _audioPlayer = AudioPlayer();

  /// Show in-app notification banner with sound
  static void showNotification(
    BuildContext context, {
    required String title,
    required String message,
    String type = 'info',
    VoidCallback? onTap,
  }) {
    // Play notification sound
    _playNotificationSound();

    // Get configuration based on type
    final config = _getNotificationConfig(type);

    // Show slim notification banner
    Flushbar(
      title: title,
      message: message,
      duration: const Duration(seconds: 3),
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      borderRadius: BorderRadius.circular(12),
      backgroundColor: config['backgroundColor'] as Color,
      boxShadows: [
        BoxShadow(
          color: (config['color'] as Color).withOpacity(0.25),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ],
      flushbarPosition: FlushbarPosition.TOP,
      flushbarStyle: FlushbarStyle.FLOATING,
      reverseAnimationCurve: Curves.easeOut,
      forwardAnimationCurve: Curves.easeOut,
      icon: Icon(
        config['icon'] as IconData,
        color: Colors.white,
        size: 20,
      ),
      titleColor: Colors.white,
      messageColor: Colors.white.withOpacity(0.9),
      titleSize: 14,
      messageSize: 13,
      titleText: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      messageText: Text(
        message,
        style: TextStyle(
          color: Colors.white.withOpacity(0.9),
          fontSize: 13,
          height: 1.3,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      onTap: (_) => onTap?.call(),
      isDismissible: true,
      dismissDirection: FlushbarDismissDirection.HORIZONTAL,
    ).show(context);
  }

  /// Play notification sound
  static Future<void> _playNotificationSound() async {
    try {
      // Play custom notification sound
      await _audioPlayer.play(AssetSource('audios/mixkit-long-pop-2358.wav'));

      // Also add haptic feedback
      await HapticFeedback.mediumImpact();
    } catch (e) {
      print('Could not play notification sound: $e');
      // Fallback to haptic only
      try {
        await HapticFeedback.mediumImpact();
      } catch (_) {}
    }
  }

  /// Get notification configuration based on type
  static Map<String, dynamic> _getNotificationConfig(String type) {
    switch (type) {
      case 'success':
        return {
          'icon': Icons.check_circle_rounded,
          'color': AppColors.success,
          'backgroundColor': AppColors.success,
        };
      case 'warning':
        return {
          'icon': Icons.warning_rounded,
          'color': AppColors.accent,
          'backgroundColor': AppColors.accent,
        };
      case 'reminder':
        return {
          'icon': Icons.alarm_rounded,
          'color': AppColors.purple,
          'backgroundColor': AppColors.purple,
        };
      case 'achievement':
        return {
          'icon': Icons.emoji_events_rounded,
          'color': AppColors.accent,
          'backgroundColor': AppColors.accent,
        };
      case 'info':
      default:
        return {
          'icon': Icons.info_rounded,
          'color': AppColors.primary,
          'backgroundColor': AppColors.primary,
        };
    }
  }

  /// Show success notification
  static void showSuccess(BuildContext context, String title, String message, {VoidCallback? onTap}) {
    showNotification(context, title: title, message: message, type: 'success', onTap: onTap);
  }

  /// Show error notification
  static void showError(BuildContext context, String title, String message, {VoidCallback? onTap}) {
    showNotification(context, title: title, message: message, type: 'warning', onTap: onTap);
  }

  /// Show info notification
  static void showInfo(BuildContext context, String title, String message, {VoidCallback? onTap}) {
    showNotification(context, title: title, message: message, type: 'info', onTap: onTap);
  }
}
