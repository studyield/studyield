import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../constants/onboarding_constants.dart';
import '../../widgets/feature_badge.dart';

class Slide4Gamification extends StatefulWidget {
  const Slide4Gamification({super.key});

  @override
  State<Slide4Gamification> createState() => _Slide4GamificationState();
}

class _Slide4GamificationState extends State<Slide4Gamification>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _xpController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _xpBarAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: OnboardingConstants.slowDuration,
      vsync: this,
    );

    _xpController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: OnboardingConstants.defaultCurve,
      ),
    );

    _xpBarAnimation = Tween<double>(begin: 0.0, end: 0.75).animate(
      CurvedAnimation(
        parent: _xpController,
        curve: Curves.easeOutCubic,
      ),
    );

    _controller.forward();
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _xpController.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _xpController.dispose();
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
              label: 'onboarding.slide_4.badge'.tr(),
              isPro: false,
            ),
          ),

          const SizedBox(height: 16),

          // Title
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_4.title'.tr(),
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
              'onboarding.slide_4.subtitle'.tr(),
              textAlign: TextAlign.center,
              style: AppTextStyles.titleMedium.copyWith(
                color: AppColors.accent,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          const Spacer(),

          // Animation or custom gamification visuals
          FadeTransition(
            opacity: _fadeAnimation,
            child: SizedBox(
              height: 240,
              child: Lottie.asset(
                OnboardingConstants.gamificationAnimation,
                fit: BoxFit.contain,
                // Fallback to custom gamification widgets
                errorBuilder: (context, error, stackTrace) {
                  return _buildGamificationFallback();
                },
              ),
            ),
          ),

          const Spacer(),

          // Description
          FadeTransition(
            opacity: _fadeAnimation,
            child: Text(
              'onboarding.slide_4.description'.tr(),
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

  Widget _buildGamificationFallback() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Level badge
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.4),
                blurRadius: 20,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Level',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '5',
                style: AppTextStyles.displayMedium.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // XP Bar
        AnimatedBuilder(
          animation: _xpBarAnimation,
          builder: (context, child) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Experience Points',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${(750 * _xpBarAnimation.value).toInt()} / 1000 XP',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  height: 12,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: AppColors.grey200,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: _xpBarAnimation.value,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: AppColors.greenGradient,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),

        const SizedBox(height: 32),

        // Achievement icons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildAchievementBadge(Icons.local_fire_department, AppColors.accent, '7'),
            const SizedBox(width: 16),
            _buildAchievementBadge(Icons.emoji_events, AppColors.primary, '12'),
            const SizedBox(width: 16),
            _buildAchievementBadge(Icons.star, AppColors.purple, '25'),
          ],
        ),
      ],
    );
  }

  Widget _buildAchievementBadge(IconData icon, Color color, String count) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: color.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: Icon(
            icon,
            color: color,
            size: 28,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          count,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
