import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../constants/onboarding_constants.dart';
import '../../widgets/feature_badge.dart';

class Slide2Flashcards extends StatefulWidget {
  const Slide2Flashcards({super.key});

  @override
  State<Slide2Flashcards> createState() => _Slide2FlashcardsState();
}

class _Slide2FlashcardsState extends State<Slide2Flashcards>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

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

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
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
          const SizedBox(height: 40),

          // Badge
          FadeTransition(
            opacity: _fadeAnimation,
            child: FeatureBadge(
              label: 'onboarding.slide_2.badge'.tr(),
              isPro: false,
            ),
          ),

          const SizedBox(height: 16),

          // Title
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_2.title'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.headlineLarge.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Subtitle
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_2.subtitle'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.titleMedium.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          const Spacer(),

          // Animation
          SlideTransition(
            position: _slideAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SizedBox(
                height: 240,
                child: Lottie.asset(
                  OnboardingConstants.flashcardsAnimation,
                  fit: BoxFit.contain,
                  // Fallback to custom flashcard animation
                  errorBuilder: (context, error, stackTrace) {
                    return _buildFlashcardFallback();
                  },
                ),
              ),
            ),
          ),

          const Spacer(),

          // Description
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_2.description'.tr(),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildFlashcardFallback() {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Back cards
        Transform.translate(
          offset: const Offset(-15, -15),
          child: Transform.rotate(
            angle: -0.1,
            child: _buildCard(
              'Question?',
              AppColors.grey200,
              AppColors.grey700,
            ),
          ),
        ),
        Transform.translate(
          offset: const Offset(15, 15),
          child: Transform.rotate(
            angle: 0.1,
            child: _buildCard(
              'Answer',
              AppColors.grey200,
              AppColors.grey700,
            ),
          ),
        ),
        // Front card with gradient
        _buildCard(
          'Tap to flip',
          AppColors.primary,
          AppColors.white,
          isGradient: true,
        ),
      ],
    );
  }

  Widget _buildCard(String text, Color color, Color textColor,
      {bool isGradient = false}) {
    return Container(
      width: 200,
      height: 120,
      decoration: BoxDecoration(
        gradient: isGradient ? AppColors.primaryGradient : null,
        color: isGradient ? null : color,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Center(
        child: Text(
          text,
          style: AppTextStyles.titleLarge.copyWith(
            color: textColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
