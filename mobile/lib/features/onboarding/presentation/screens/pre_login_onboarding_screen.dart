import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../constants/onboarding_constants.dart';
import '../../data/datasources/onboarding_local_datasource.dart';
import '../widgets/custom_page_indicator.dart';
import '../widgets/gradient_background.dart';
import 'feature_slide.dart';

class PreLoginOnboardingScreen extends StatefulWidget {
  const PreLoginOnboardingScreen({super.key});

  @override
  State<PreLoginOnboardingScreen> createState() =>
      _PreLoginOnboardingScreenState();
}

class _PreLoginOnboardingScreenState extends State<PreLoginOnboardingScreen> {
  late PageController _pageController;
  int _currentPage = 0;
  late OnboardingLocalDataSource _dataSource;

  static const _brandGradient = LinearGradient(
    colors: [Color(0xFF2563EB), Color(0xFF06B6D4), Color(0xFF9333EA)],
  );

  final List<FeatureSlideData> _slideData = [
    FeatureSlideData(
      titleKey: 'onboarding.slides.welcome_title',
      descriptionKey: 'onboarding.slides.welcome_desc',
      bulletKeys: [],
      gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF14B8A6)]),
      gradientStart: const Color(0xFF10B981),
      gradientEnd: const Color(0xFF14B8A6),
      slideIndex: 0,
      extraType: 'welcome',
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.study_sets_title',
      descriptionKey: 'onboarding.slides.study_sets_desc',
      bulletKeys: ['onboarding.slides.study_sets_bullet1', 'onboarding.slides.study_sets_bullet2', 'onboarding.slides.study_sets_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)]),
      gradientStart: const Color(0xFF3B82F6),
      gradientEnd: const Color(0xFF06B6D4),
      slideIndex: 1,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.ai_chat_title',
      descriptionKey: 'onboarding.slides.ai_chat_desc',
      bulletKeys: ['onboarding.slides.ai_chat_bullet1', 'onboarding.slides.ai_chat_bullet2', 'onboarding.slides.ai_chat_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
      gradientStart: const Color(0xFF10B981),
      gradientEnd: const Color(0xFF059669),
      slideIndex: 2,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.problem_solver_title',
      descriptionKey: 'onboarding.slides.problem_solver_desc',
      bulletKeys: ['onboarding.slides.problem_solver_bullet1', 'onboarding.slides.problem_solver_bullet2', 'onboarding.slides.problem_solver_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFF59E0B)]),
      gradientStart: const Color(0xFFF97316),
      gradientEnd: const Color(0xFFF59E0B),
      slideIndex: 3,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.exam_clone_title',
      descriptionKey: 'onboarding.slides.exam_clone_desc',
      bulletKeys: ['onboarding.slides.exam_clone_bullet1', 'onboarding.slides.exam_clone_bullet2', 'onboarding.slides.exam_clone_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
      gradientStart: const Color(0xFF6366F1),
      gradientEnd: const Color(0xFF8B5CF6),
      slideIndex: 4,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.live_quiz_title',
      descriptionKey: 'onboarding.slides.live_quiz_desc',
      bulletKeys: ['onboarding.slides.live_quiz_bullet1', 'onboarding.slides.live_quiz_bullet2', 'onboarding.slides.live_quiz_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFF43F5E)]),
      gradientStart: const Color(0xFFEC4899),
      gradientEnd: const Color(0xFFF43F5E),
      slideIndex: 5,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.spaced_rep_title',
      descriptionKey: 'onboarding.slides.spaced_rep_desc',
      bulletKeys: ['onboarding.slides.spaced_rep_bullet1', 'onboarding.slides.spaced_rep_bullet2', 'onboarding.slides.spaced_rep_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFF9333EA), Color(0xFF8B5CF6)]),
      gradientStart: const Color(0xFF9333EA),
      gradientEnd: const Color(0xFF8B5CF6),
      slideIndex: 6,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.analytics_title',
      descriptionKey: 'onboarding.slides.analytics_desc',
      bulletKeys: ['onboarding.slides.analytics_bullet1', 'onboarding.slides.analytics_bullet2', 'onboarding.slides.analytics_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF3B82F6)]),
      gradientStart: const Color(0xFF0EA5E9),
      gradientEnd: const Color(0xFF3B82F6),
      slideIndex: 7,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.handwriting_title',
      descriptionKey: 'onboarding.slides.handwriting_desc',
      bulletKeys: ['onboarding.slides.handwriting_bullet1', 'onboarding.slides.handwriting_bullet2', 'onboarding.slides.handwriting_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFFEF4444), Color(0xFFF97316)]),
      gradientStart: const Color(0xFFEF4444),
      gradientEnd: const Color(0xFFF97316),
      slideIndex: 8,
    ),
    FeatureSlideData(
      titleKey: 'onboarding.slides.ad_free_title',
      descriptionKey: 'onboarding.slides.ad_free_desc',
      bulletKeys: ['onboarding.slides.ad_free_bullet1', 'onboarding.slides.ad_free_bullet2', 'onboarding.slides.ad_free_bullet3'],
      gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF14B8A6)]),
      gradientStart: const Color(0xFF10B981),
      gradientEnd: const Color(0xFF14B8A6),
      slideIndex: 9,
      extraType: 'adFree',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _initDataSource();
  }

  Future<void> _initDataSource() async {
    final prefs = await SharedPreferences.getInstance();
    _dataSource = OnboardingLocalDataSourceImpl(sharedPreferences: prefs);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() {
      _currentPage = page;
    });
  }

  void _nextPage() {
    if (_currentPage < _slideData.length - 1) {
      _pageController.nextPage(
        duration: OnboardingConstants.slideTransition,
        curve: OnboardingConstants.smoothCurve,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: OnboardingConstants.slideTransition,
        curve: OnboardingConstants.smoothCurve,
      );
    }
  }

  Future<void> _skipOnboarding() async {
    await _dataSource.incrementSkipCount();
    _navigateToLogin();
  }

  Future<void> _completeOnboarding() async {
    await _dataSource.markPreLoginOnboardingSeen();
    _navigateToLogin();
  }

  void _navigateToLogin() {
    Navigator.of(context).pushReplacementNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Top bar with logo + skip
              _buildTopBar(),

              // Page view with slides (button-only navigation)
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  onPageChanged: _onPageChanged,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _slideData.length,
                  itemBuilder: (context, index) =>
                      FeatureSlide(data: _slideData[index]),
                ),
              ),

              // Bottom controls
              _buildBottomControls(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Back button (visible from page 2 onwards)
          if (_currentPage > 0)
            IconButton(
              onPressed: _previousPage,
              icon: const Icon(Icons.arrow_back),
              color: AppColors.textPrimary,
            )
          else
            const SizedBox(width: 48),

          // Logo + App name with gradient
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                'assets/logo/studyield-logo.png',
                width: 44,
                height: 44,
                errorBuilder: (_, __, ___) => const SizedBox(width: 44, height: 44),
              ),
              const SizedBox(width: 8),
              ShaderMask(
                shaderCallback: (bounds) => _brandGradient.createShader(
                  Rect.fromLTWH(0, 0, bounds.width, bounds.height),
                ),
                child: Text(
                  'onboarding.app_name'.tr(),
                  style: AppTextStyles.titleLarge.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          // Skip button
          TextButton(
            onPressed: _skipOnboarding,
            child: Text(
              'onboarding.skip'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomControls() {
    final isLastPage = _currentPage == _slideData.length - 1;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Page indicator
          CustomPageIndicator(
            currentPage: _currentPage,
            pageCount: _slideData.length,
          ),

          const SizedBox(height: 32),

          // Action buttons
          Row(
            children: [
              // "I have an account" button
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    await _dataSource.markPreLoginOnboardingSeen();
                    _navigateToLogin();
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(
                      color: AppColors.primary,
                      width: 2,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'onboarding.i_have_account'.tr(),
                    style: AppTextStyles.button.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 16),

              // Next/Get Started button
              Expanded(
                child: ElevatedButton(
                  onPressed: _nextPage,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: AppColors.greenGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Container(
                      alignment: Alignment.center,
                      constraints: const BoxConstraints(minHeight: 48),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            isLastPage ? 'onboarding.get_started'.tr() : 'onboarding.next'.tr(),
                            style: AppTextStyles.button.copyWith(
                              color: AppColors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            isLastPage ? Icons.rocket_launch : Icons.arrow_forward,
                            color: AppColors.white,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
