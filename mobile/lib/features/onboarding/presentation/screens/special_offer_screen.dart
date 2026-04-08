import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../subscription/presentation/screens/checkout_screen.dart';
import '../../constants/onboarding_constants.dart';

class SpecialOfferScreen extends StatefulWidget {
  /// Called when user completes the offer flow (purchase or skip).
  final VoidCallback onComplete;

  /// Called when user skips the offer.
  final VoidCallback onSkip;

  const SpecialOfferScreen({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<SpecialOfferScreen> createState() => _SpecialOfferScreenState();
}

class _SpecialOfferScreenState extends State<SpecialOfferScreen>
    with TickerProviderStateMixin {
  // === Animation Controllers ===
  late AnimationController _entranceController;
  late AnimationController _floatController;
  late AnimationController _pulseController;
  late AnimationController _glowController;
  late AnimationController _shakeController;

  // === Entrance Animations (play once) ===
  late Animation<double> _badgeFade;
  late Animation<Offset> _badgeSlide;
  late Animation<double> _badgeScale;
  late Animation<double> _headlineFade;
  late Animation<Offset> _headlineSlide;
  late Animation<double> _featuresFade;
  late Animation<double> _pricingFade;
  late Animation<Offset> _pricingSlide;
  late Animation<double> _pricingScale;
  late Animation<double> _ctaFade;
  late Animation<double> _ctaScale;
  late Animation<double> _skipFade;
  late Animation<double> _urgencyFade;
  late Animation<double> _feature1Fade;
  late Animation<Offset> _feature1Slide;
  late Animation<double> _feature2Fade;
  late Animation<Offset> _feature2Slide;
  late Animation<double> _feature3Fade;
  late Animation<Offset> _feature3Slide;

  // === Continuous Animations (loop forever) ===
  late Animation<double> _badgeFloat;
  late Animation<double> _discountPulse;
  late Animation<double> _iconGlow1;
  late Animation<double> _iconGlow2;
  late Animation<double> _iconGlow3;
  late Animation<double> _pricePulse;
  late Animation<double> _ctaGlow;
  late Animation<double> _ctaScalePulse;
  late Animation<double> _saveBadgeShake;
  late Animation<double> _urgencyPulse;

  String _selectedCycle = 'monthly'; // 'monthly' or 'yearly'

  @override
  void initState() {
    super.initState();

    _entranceController = AnimationController(
      duration: const Duration(milliseconds: 2500),
      vsync: this,
    );

    _floatController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    )..repeat(reverse: true);

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat(reverse: true);

    _glowController = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    )..repeat(reverse: true);

    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat(reverse: true);

    _setupAnimations();
    _entranceController.forward();
  }

  void _setupAnimations() {
    // ========== ENTRANCE (one-time staggered) ==========

    _badgeFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.2, curve: Curves.easeOut),
    );
    _badgeSlide = Tween<Offset>(
      begin: const Offset(0, -0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.0, 0.25, curve: Curves.easeOutBack),
    ));
    _badgeScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.0, 0.25, curve: Curves.elasticOut),
      ),
    );

    _headlineFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.08, 0.3, curve: Curves.easeOut),
    );
    _headlineSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.08, 0.35, curve: Curves.easeOutCubic),
    ));

    _featuresFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.15, 0.45, curve: Curves.easeOut),
    );

    _feature1Fade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.2, 0.4, curve: Curves.easeOut),
    );
    _feature1Slide = Tween<Offset>(
      begin: const Offset(-0.5, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.2, 0.45, curve: Curves.easeOutCubic),
    ));
    _feature2Fade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.28, 0.48, curve: Curves.easeOut),
    );
    _feature2Slide = Tween<Offset>(
      begin: const Offset(-0.5, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.28, 0.53, curve: Curves.easeOutCubic),
    ));
    _feature3Fade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.36, 0.56, curve: Curves.easeOut),
    );
    _feature3Slide = Tween<Offset>(
      begin: const Offset(-0.5, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.36, 0.61, curve: Curves.easeOutCubic),
    ));

    _pricingFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.4, 0.65, curve: Curves.easeOut),
    );
    _pricingSlide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.4, 0.7, curve: Curves.easeOutCubic),
    ));
    _pricingScale = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.4, 0.7, curve: Curves.easeOutBack),
      ),
    );

    _ctaFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.55, 0.8, curve: Curves.easeOut),
    );
    _ctaScale = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _entranceController,
        curve: const Interval(0.55, 0.85, curve: Curves.elasticOut),
      ),
    );

    _skipFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.7, 0.85, curve: Curves.easeOut),
    );
    _urgencyFade = CurvedAnimation(
      parent: _entranceController,
      curve: const Interval(0.8, 1.0, curve: Curves.easeOut),
    );

    // ========== CONTINUOUS (looping) ==========

    _badgeFloat = Tween<double>(begin: -6.0, end: 6.0).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    _discountPulse = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _iconGlow1 = Tween<double>(begin: 0.12, end: 0.4).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
    _iconGlow2 = Tween<double>(begin: 0.4, end: 0.12).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );
    _iconGlow3 = Tween<double>(begin: 0.12, end: 0.35).animate(
      CurvedAnimation(
        parent: _glowController,
        curve: const Interval(0.3, 1.0, curve: Curves.easeInOut),
      ),
    );

    _pricePulse = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _ctaGlow = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    _ctaScalePulse = Tween<double>(begin: 1.0, end: 1.03).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    _saveBadgeShake = Tween<double>(begin: -0.05, end: 0.05).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.easeInOut),
    );

    _urgencyPulse = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _floatController.dispose();
    _pulseController.dispose();
    _glowController.dispose();
    _shakeController.dispose();
    super.dispose();
  }

  double _getPrice() {
    return _selectedCycle == 'yearly' ? 79.99 : 7.99;
  }

  String _getOriginalPrice() {
    return _selectedCycle == 'yearly' ? '\$99.99' : '\$9.99';
  }

  String _getDiscountedPrice() {
    return _selectedCycle == 'yearly' ? '\$79.99' : '\$7.99';
  }

  String _getBillingLabel() {
    return _selectedCycle == 'yearly'
        ? 'special_offer.pricing.per_year'.tr()
        : 'special_offer.pricing.per_month'.tr();
  }

  Future<void> _markOfferSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(OnboardingConstants.hasSeenWelcomeOfferKey, true);
  }

  void _handlePurchase() {
    _markOfferSeen();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckoutScreen(
          plan: 'pro',
          billingCycle: _selectedCycle,
          price: _getPrice(),
          isSpecialOffer: true,
        ),
      ),
    ).then((_) {
      widget.onComplete();
    });
  }

  void _handleSkip() {
    _markOfferSeen();
    widget.onSkip();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        body: SafeArea(
          child: AnimatedBuilder(
            animation: Listenable.merge([
              _entranceController,
              _floatController,
              _pulseController,
              _glowController,
              _shakeController,
            ]),
            builder: (context, _) {
              return SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    const SizedBox(height: 20),

                    // === BADGE (drop in + float) ===
                    SlideTransition(
                      position: _badgeSlide,
                      child: FadeTransition(
                        opacity: _badgeFade,
                        child: ScaleTransition(
                          scale: _badgeScale,
                          child: Transform.translate(
                            offset: Offset(0, _badgeFloat.value),
                            child: _buildBadge(theme),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // === HEADLINE (slide up + "50% OFF" pulses) ===
                    SlideTransition(
                      position: _headlineSlide,
                      child: FadeTransition(
                        opacity: _headlineFade,
                        child: _buildHeadline(theme),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // === FEATURES TIMELINE (fade in + staggered) ===
                    FadeTransition(
                      opacity: _featuresFade,
                      child: _buildFeatureTimeline(theme),
                    ),

                    const SizedBox(height: 20),

                    // === PRICING (scale bounce in + price pulses) ===
                    SlideTransition(
                      position: _pricingSlide,
                      child: FadeTransition(
                        opacity: _pricingFade,
                        child: ScaleTransition(
                          scale: _pricingScale,
                          child: _buildPricing(theme),
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // === CTA BUTTON (elastic scale in + glow + pulse) ===
                    FadeTransition(
                      opacity: _ctaFade,
                      child: ScaleTransition(
                        scale: _ctaScale,
                        child: Transform.scale(
                          scale: _ctaScalePulse.value,
                          child: _buildCTAButton(theme),
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // === SKIP LINK ===
                    FadeTransition(
                      opacity: _skipFade,
                      child: _buildSkipLink(theme),
                    ),

                    const SizedBox(height: 6),

                    // === URGENCY TEXT (fade in + pulse) ===
                    FadeTransition(
                      opacity: _urgencyFade,
                      child: _buildUrgencyText(theme),
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  // =============================================
  // WIDGET BUILDERS
  // =============================================

  Widget _buildBadge(ThemeData theme) {
    const primary = Color(0xFF10B981);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: primary.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: 0.15),
            blurRadius: 12,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome, color: primary, size: 20),
          const SizedBox(width: 8),
          Text(
            'special_offer.badge'.tr(),
            style: const TextStyle(
              color: primary,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeadline(ThemeData theme) {
    return Column(
      children: [
        Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: 'special_offer.headline_start'.tr(),
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: theme.colorScheme.onSurface,
                  height: 1.2,
                ),
              ),
              WidgetSpan(
                alignment: PlaceholderAlignment.baseline,
                baseline: TextBaseline.alphabetic,
                child: Transform.scale(
                  scale: _discountPulse.value,
                  child: Text(
                    'special_offer.headline_discount'.tr(),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF10B981),
                      height: 1.2,
                    ),
                  ),
                ),
              ),
              TextSpan(
                text: 'special_offer.headline_end'.tr(),
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: theme.colorScheme.onSurface,
                  height: 1.2,
                ),
              ),
            ],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'special_offer.subtitle'.tr(),
          style: TextStyle(
            fontSize: 14,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildFeatureTimeline(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildTimelineTrack(theme),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SlideTransition(
                    position: _feature1Slide,
                    child: FadeTransition(
                      opacity: _feature1Fade,
                      child: _buildTimelineStep(
                        theme: theme,
                        title: 'special_offer.features.unlimited_title'.tr(),
                        description: 'special_offer.features.unlimited_desc'.tr(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SlideTransition(
                    position: _feature2Slide,
                    child: FadeTransition(
                      opacity: _feature2Fade,
                      child: _buildTimelineStep(
                        theme: theme,
                        title: 'special_offer.features.ai_title'.tr(),
                        description: 'special_offer.features.ai_desc'.tr(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SlideTransition(
                    position: _feature3Slide,
                    child: FadeTransition(
                      opacity: _feature3Fade,
                      child: _buildTimelineStep(
                        theme: theme,
                        title: 'special_offer.features.premium_title'.tr(),
                        description: 'special_offer.features.premium_desc'.tr(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineTrack(ThemeData theme) {
    const primary = Color(0xFF10B981);

    return SizedBox(
      width: 40,
      child: Stack(
        children: [
          Positioned(
            left: 18,
            top: 14,
            bottom: 14,
            child: Container(
              width: 4,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(2),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    primary.withValues(alpha: 0.3),
                    primary.withValues(alpha: 0.6),
                    primary,
                  ],
                ),
              ),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTimelineIcon(
                icon: Icons.all_inclusive_rounded,
                color: primary,
                glowAlpha: _iconGlow1.value,
              ),
              _buildTimelineIcon(
                icon: Icons.auto_awesome_rounded,
                color: primary,
                glowAlpha: _iconGlow2.value,
              ),
              _buildTimelineIcon(
                icon: Icons.workspace_premium_rounded,
                color: primary,
                glowAlpha: _iconGlow3.value,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineIcon({
    required IconData icon,
    required Color color,
    required double glowAlpha,
  }) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withValues(alpha: glowAlpha),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: glowAlpha * 0.6),
            blurRadius: 12 + (glowAlpha * 10),
            spreadRadius: glowAlpha * 4,
          ),
        ],
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }

  Widget _buildTimelineStep({
    required ThemeData theme,
    required String title,
    required String description,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          description,
          style: TextStyle(
            fontSize: 14,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildPricing(ThemeData theme) {
    const primary = Color(0xFF10B981);

    return Column(
      children: [
        // Cycle toggle
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.grey100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              _buildCycleToggle(
                label: 'special_offer.pricing.monthly'.tr(),
                isSelected: _selectedCycle == 'monthly',
                onTap: () => setState(() => _selectedCycle = 'monthly'),
                theme: theme,
              ),
              _buildCycleToggle(
                label: 'special_offer.pricing.yearly'.tr(),
                badge: 'special_offer.pricing.best_value'.tr(),
                isSelected: _selectedCycle == 'yearly',
                onTap: () => setState(() => _selectedCycle = 'yearly'),
                theme: theme,
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              // Original price (crossed out)
              Text(
                _getOriginalPrice(),
                style: TextStyle(
                  fontSize: 18,
                  decoration: TextDecoration.lineThrough,
                  decorationColor: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(width: 10),
              // Discounted price with pulse
              Transform.scale(
                scale: _pricePulse.value,
                child: Text(
                  _getDiscountedPrice(),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: primary,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                _getBillingLabel(),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),

        // Save badge with rotation shake
        Transform.rotate(
          angle: _saveBadgeShake.value,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFEF4444).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Text(
              'special_offer.pricing.save_badge'.tr(),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFFEF4444),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCycleToggle({
    required String label,
    String? badge,
    required bool isSelected,
    required VoidCallback onTap,
    required ThemeData theme,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF10B981) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF10B981).withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: isSelected ? Colors.white : AppColors.grey600,
                ),
              ),
              if (badge != null) ...[
                const SizedBox(height: 2),
                Text(
                  badge,
                  style: TextStyle(
                    fontSize: 10,
                    color: isSelected
                        ? Colors.white.withValues(alpha: 0.7)
                        : const Color(0xFF10B981),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCTAButton(ThemeData theme) {
    const primary = Color(0xFF10B981);
    final glow = _ctaGlow.value;
    final glowOpacity = 0.2 + (glow * 0.35);
    final glowSpread = 4.0 + (glow * 14.0);
    final glowBlur = 16.0 + (glow * 20.0);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: primary.withValues(alpha: glowOpacity),
            blurRadius: glowBlur,
            spreadRadius: glowSpread,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _handlePurchase,
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
        child: Text(
          'special_offer.cta'.tr(),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }

  Widget _buildSkipLink(ThemeData theme) {
    return TextButton(
      onPressed: _handleSkip,
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      ),
      child: Text(
        'special_offer.skip'.tr(),
        style: TextStyle(
          fontSize: 15,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
          fontWeight: FontWeight.w500,
          decoration: TextDecoration.underline,
          decorationColor: theme.colorScheme.onSurface.withValues(alpha: 0.35),
        ),
      ),
    );
  }

  Widget _buildUrgencyText(ThemeData theme) {
    final opacity = _urgencyPulse.value;

    return Opacity(
      opacity: opacity,
      child: Transform.scale(
        scale: 0.95 + (opacity * 0.05),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Transform.rotate(
              angle: math.sin(_shakeController.value * math.pi * 2) * 0.3,
              child: const Icon(
                Icons.timer_outlined,
                size: 16,
                color: Color(0xFFEF4444),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              'special_offer.urgency'.tr(),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFFEF4444),
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
