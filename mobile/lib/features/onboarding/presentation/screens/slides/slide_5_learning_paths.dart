import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../constants/onboarding_constants.dart';
import '../../widgets/feature_badge.dart';

class Slide5LearningPaths extends StatefulWidget {
  const Slide5LearningPaths({super.key});

  @override
  State<Slide5LearningPaths> createState() => _Slide5LearningPathsState();
}

class _Slide5LearningPathsState extends State<Slide5LearningPaths>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: OnboardingConstants.slowDuration,
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: OnboardingConstants.defaultCurve,
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: OnboardingConstants.smoothCurve,
      ),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 30),

          // Badge
          FadeTransition(
            opacity: _fadeAnimation,
            child: FeatureBadge(
              label: 'onboarding.slide_5.badge'.tr(),
              isPro: true,
            ),
          ),

          const SizedBox(height: 12),

          // Title
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_5.title'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.headlineLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 28,
              ),
            ),
          ),

          const SizedBox(height: 6),

          // Subtitle with gradient
          FadeTransition(
            opacity: _fadeAnimation,
            child: ShaderMask(
              shaderCallback: (bounds) => LinearGradient(
                colors: [AppColors.primary, AppColors.secondary],
              ).createShader(
                Rect.fromLTWH(0, 0, bounds.width, bounds.height),
              ),
              child: Text(
                'onboarding.slide_5.subtitle'.tr(),
                textAlign: TextAlign.center,
                style: AppTextStyles.titleMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          const Spacer(),

          // Animation
          ScaleTransition(
            scale: _scaleAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SizedBox(
                height: 170,
                width: double.infinity,
                child: Lottie.asset(
                  OnboardingConstants.learningPathAnimation,
                  fit: BoxFit.contain,
                  // Fallback to learning path illustration
                  errorBuilder: (context, error, stackTrace) {
                    return _buildLearningPathFallback();
                  },
                ),
              ),
            ),
          ),

          const SizedBox(height: 10),

          // Description
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_5.description'.tr(),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Benefits list
          FadeTransition(
            opacity: _fadeAnimation,
            child: _buildBenefitsList(),
          ),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildLearningPathFallback() {
    return CustomPaint(
      painter: _LearningPathPainter(),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildPathNode(Icons.flag, AppColors.primary, true),
            _buildPathNode(Icons.menu_book, AppColors.secondary, true),
            _buildPathNode(Icons.quiz, AppColors.accent, false),
            _buildPathNode(Icons.emoji_events, AppColors.purple, false),
          ],
        ),
      ),
    );
  }

  Widget _buildPathNode(IconData icon, Color color, bool completed) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: completed ? color : AppColors.grey200,
        shape: BoxShape.circle,
        border: Border.all(
          color: completed ? color : AppColors.grey400,
          width: 3,
        ),
        boxShadow: completed
            ? [
                BoxShadow(
                  color: color.withOpacity(0.4),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ]
            : null,
      ),
      child: Icon(
        completed ? Icons.check : icon,
        color: completed ? AppColors.white : AppColors.grey500,
        size: 28,
      ),
    );
  }

  Widget _buildBenefitsList() {
    final benefits = [
      'onboarding.slide_5.benefits.benefit_1'.tr(),
      'onboarding.slide_5.benefits.benefit_2'.tr(),
      'onboarding.slide_5.benefits.benefit_3'.tr(),
    ];

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: benefits.map((benefit) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Text(
            benefit,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _LearningPathPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.grey300
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final centerX = size.width / 2;
    final spacing = size.height / 4;

    // Draw connecting path
    path.moveTo(centerX, spacing * 0.5);
    path.lineTo(centerX, spacing * 3.5);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
