import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../constants/onboarding_constants.dart';

class Slide1Welcome extends StatefulWidget {
  const Slide1Welcome({super.key});

  @override
  State<Slide1Welcome> createState() => _Slide1WelcomeState();
}

class _Slide1WelcomeState extends State<Slide1Welcome>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: OnboardingConstants.slowDuration,
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: OnboardingConstants.bounceCurve,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: OnboardingConstants.defaultCurve,
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
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 60),

          // Animated Logo/Illustration
          ScaleTransition(
            scale: _scaleAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                height: 280,
                width: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient.scale(0.1),
                ),
                child: Center(
                  child: Lottie.asset(
                    OnboardingConstants.welcomeAnimation,
                    height: 240,
                    width: 240,
                    fit: BoxFit.contain,
                    // Fallback to icon if animation not found
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 120,
                        width: 120,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.school,
                          size: 60,
                          color: AppColors.white,
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 48),

          // Title with staggered animation
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_1.title'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.displaySmall.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Subtitle
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_1.subtitle'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.titleLarge.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Description
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_1.description'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
                height: 1.6,
              ),
            ),
          ),

          const Spacer(),
        ],
      ),
    );
  }
}
