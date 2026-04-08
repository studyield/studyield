import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:lottie/lottie.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';

class WelcomeOnboardingModal extends StatefulWidget {
  final VoidCallback onStart;
  final VoidCallback onSkip;

  const WelcomeOnboardingModal({
    super.key,
    required this.onStart,
    required this.onSkip,
  });

  @override
  State<WelcomeOnboardingModal> createState() => _WelcomeOnboardingModalState();
}

class _WelcomeOnboardingModalState extends State<WelcomeOnboardingModal>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.2, 1.0, curve: Curves.easeOutBack),
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
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF10B981).withOpacity(0.1),
              Theme.of(context).scaffoldBackgroundColor,
              const Color(0xFF3B82F6).withOpacity(0.05),
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  children: [
                    const SizedBox(height: 10),

                    // Skip button at top
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: widget.onSkip,
                          icon: const Icon(Icons.close, size: 18),
                          label: Text('common.skip'.tr()),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.grey600,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Welcome Animation
                    SizedBox(
                      height: 220,
                      child: Lottie.asset(
                        'assets/animations/welcome.json',
                        repeat: true,
                        animate: true,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              gradient: AppColors.greenGradient,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withOpacity(0.3),
                                  blurRadius: 30,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.waving_hand_rounded,
                              size: 60,
                              color: Colors.white,
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 30),

                    // Title
                    ShaderMask(
                      shaderCallback: (bounds) => AppColors.greenGradient.createShader(bounds),
                      child: Text(
                        'Welcome to Studyield!',
                        style: AppTextStyles.headlineLarge.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 34,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Subtitle
                    Text(
                      'Master any subject with AI-powered tools',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.grey600,
                        fontSize: 17,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 40),

                    // Tour info card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  gradient: AppColors.greenGradient,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(
                                  Icons.bolt,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Text(
                                'Quick Interactive Tour',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Experience 4 powerful features:',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.grey700,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 4 Tasks
                          _buildTaskItem(
                            '1',
                            'Deep Research',
                            'AI analyzes any topic comprehensively',
                            const Color(0xFF3B82F6),
                            Icons.science_rounded,
                          ),
                          const SizedBox(height: 12),
                          _buildTaskItem(
                            '2',
                            'AI Flashcards',
                            'Generate smart study cards instantly',
                            const Color(0xFF10B981),
                            Icons.style_rounded,
                          ),
                          const SizedBox(height: 12),
                          _buildTaskItem(
                            '3',
                            'Problem Solver',
                            'Step-by-step solutions with AI',
                            const Color(0xFFF59E0B),
                            Icons.calculate_rounded,
                          ),
                          const SizedBox(height: 12),
                          _buildTaskItem(
                            '4',
                            'Smart Quiz',
                            'Test knowledge with instant feedback',
                            const Color(0xFF8B5CF6),
                            Icons.quiz_rounded,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Duration badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.timer_outlined,
                            color: Color(0xFF10B981),
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Takes less than 3 minutes',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: const Color(0xFF10B981),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Start Tour Button
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: PrimaryButton(
                        text: 'onboarding.tour.start_interactive'.tr(),
                        onPressed: widget.onStart,
                        width: double.infinity,
                        gradient: AppColors.greenGradient,
                        icon: Icons.rocket_launch_rounded,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Skip text button
                    TextButton(
                      onPressed: widget.onSkip,
                      child: Text(
                        'I\'ll explore on my own',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.grey500,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTaskItem(
    String number,
    String title,
    String description,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          // Number badge
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withOpacity(0.8)],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),

          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.labelLarge.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
