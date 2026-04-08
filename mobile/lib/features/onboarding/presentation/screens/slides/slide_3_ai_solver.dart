import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../constants/onboarding_constants.dart';
import '../../widgets/feature_badge.dart';

class Slide3AiSolver extends StatefulWidget {
  const Slide3AiSolver({super.key});

  @override
  State<Slide3AiSolver> createState() => _Slide3AiSolverState();
}

class _Slide3AiSolverState extends State<Slide3AiSolver>
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

          // Badge with sparkle animation
          FadeTransition(
            opacity: _fadeAnimation,
            child: FeatureBadge(
              label: 'onboarding.slide_3.badge'.tr(),
              isPro: true,
            ),
          ),

          const SizedBox(height: 12),

          // Title
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_3.title'.tr(),
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
              shaderCallback: (bounds) => AppColors.purpleGradient
                  .createShader(
                    Rect.fromLTWH(0, 0, bounds.width, bounds.height),
                  ),
              child: Text(
                'onboarding.slide_3.subtitle'.tr(),
                textAlign: TextAlign.center,
                style: AppTextStyles.titleMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Dual Animations - AI Brain + OCR Scan
          ScaleTransition(
            scale: _scaleAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SizedBox(
                height: 220,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // AI Brain Animation
                    Expanded(
                      child: Lottie.asset(
                        'assets/animations/ai_solver.json',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Icon(
                            Icons.psychology,
                            size: 80,
                            color: AppColors.purple,
                          );
                        },
                      ),
                    ),
                    // Divider/Arrow
                    Icon(
                      Icons.arrow_forward,
                      color: AppColors.purple.withOpacity(0.5),
                      size: 28,
                    ),
                    // OCR Scan Animation
                    Expanded(
                      child: Lottie.asset(
                        'assets/animations/ai_solver_ocr.json',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Icon(
                            Icons.document_scanner,
                            size: 80,
                            color: AppColors.purple,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Description
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_3.description'.tr(),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Feature highlights
          FadeTransition(
            opacity: _fadeAnimation,
            child: _buildFeatureHighlights(),
          ),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildAIFallback() {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.purpleGradient.scale(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: AppColors.purpleGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.purple.withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: const Icon(
                Icons.psychology,
                size: 60,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 20),
            const Icon(
              Icons.arrow_downward,
              size: 32,
              color: AppColors.purple,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Text(
                'Step-by-step solution',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureHighlights() {
    final features = [
      {'icon': Icons.camera_alt, 'text': 'onboarding.slide_3.features.scan'.tr()},
      {'icon': Icons.lightbulb_outline, 'text': 'onboarding.slide_3.features.hints'.tr()},
      {'icon': Icons.list_alt, 'text': 'onboarding.slide_3.features.steps'.tr()},
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: features.map((feature) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.purple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                feature['icon'] as IconData,
                color: AppColors.purple,
                size: 20,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              feature['text'] as String,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
                fontSize: 11,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }
}
