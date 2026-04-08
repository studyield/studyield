import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../theme/app_colors.dart';

class ProBadge extends StatefulWidget {
  final String planName;
  final bool isLifetime;
  final VoidCallback? onTap;

  const ProBadge({
    super.key,
    required this.planName,
    this.isLifetime = false,
    this.onTap,
  });

  @override
  State<ProBadge> createState() => _ProBadgeState();
}

class _ProBadgeState extends State<ProBadge>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _shimmerAnimation = Tween<double>(
      begin: -2,
      end: 2,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedBuilder(
          animation: _shimmerAnimation,
          builder: (context, child) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.accentDark,
                    AppColors.accent,
                    AppColors.accentLight,
                    AppColors.accent,
                    AppColors.accentDark,
                  ],
                  stops: const [0.0, 0.25, 0.5, 0.75, 1.0],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  transform: GradientRotation(_shimmerAnimation.value),
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accent.withOpacity(0.5),
                    blurRadius: 8,
                    spreadRadius: 0,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    widget.isLifetime ? Icons.emoji_events : Icons.workspace_premium,
                    color: Colors.white,
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    widget.planName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(width: 4),
                  // Sparkle effect
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0.0, end: 1.0),
                    duration: const Duration(milliseconds: 1500),
                    curve: Curves.easeInOut,
                    builder: (context, value, child) {
                      return Transform.rotate(
                        angle: value * 2 * math.pi,
                        child: Icon(
                          Icons.auto_awesome,
                          color: Colors.white.withOpacity(0.8),
                          size: 14,
                        ),
                      );
                    },
                    onEnd: () {
                      // Restart animation
                      setState(() {});
                    },
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class GradientRotation extends GradientTransform {
  final double radians;

  const GradientRotation(this.radians);

  @override
  Matrix4 transform(Rect bounds, {TextDirection? textDirection}) {
    final double centerX = bounds.center.dx;
    final double centerY = bounds.center.dy;
    return Matrix4.identity()
      ..translate(centerX, centerY)
      ..rotateZ(radians)
      ..translate(-centerX, -centerY);
  }
}
