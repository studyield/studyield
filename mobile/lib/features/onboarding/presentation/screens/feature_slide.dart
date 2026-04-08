import 'dart:math';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

/// Data model for a single onboarding feature slide
class FeatureSlideData {
  final String titleKey;
  final String descriptionKey;
  final List<String> bulletKeys;
  final LinearGradient gradient;
  final Color gradientStart;
  final Color gradientEnd;
  final String? extraType; // 'welcome' or 'adFree'
  final int slideIndex;

  const FeatureSlideData({
    required this.titleKey,
    required this.descriptionKey,
    required this.bulletKeys,
    required this.gradient,
    required this.gradientStart,
    required this.gradientEnd,
    required this.slideIndex,
    this.extraType,
  });
}

/// Generic feature slide widget with unique animated visual per slide
class FeatureSlide extends StatefulWidget {
  final FeatureSlideData data;

  const FeatureSlide({super.key, required this.data});

  @override
  State<FeatureSlide> createState() => _FeatureSlideState();
}

class _FeatureSlideState extends State<FeatureSlide>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _visualController;
  late Animation<double> _fadeAnim;
  late Animation<double> _slideAnim;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _visualController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeOut),
    );
    _slideAnim = Tween<double>(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeOutCubic),
    );

    _fadeController.forward();
    _visualController.repeat();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _visualController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _fadeController,
      builder: (context, child) {
        return Opacity(
          opacity: _fadeAnim.value,
          child: Transform.translate(
            offset: Offset(0, _slideAnim.value),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  // Unique animated visual per slide
                  SizedBox(
                    height: 180,
                    child: _buildSlideVisual(),
                  ),
                  const SizedBox(height: 20),
                  // Title
                  Text(
                    widget.data.titleKey.tr(),
                    textAlign: TextAlign.center,
                    style: AppTextStyles.headlineLarge.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w900,
                      fontSize: 24,
                      height: 1.2,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Description
                  Text(
                    widget.data.descriptionKey.tr(),
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.5,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Welcome badges
                  if (widget.data.extraType == 'welcome') _buildWelcomeBadges(),
                  // Bullets
                  if (widget.data.bulletKeys.isNotEmpty)
                    ...widget.data.bulletKeys.asMap().entries.map(
                      (e) => _buildBulletItem(e.value.tr(), e.key),
                    ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ─── Unique visual per slide (always animated) ──────────────

  Widget _buildSlideVisual() {
    return AnimatedBuilder(
      animation: _visualController,
      builder: (context, _) {
        final t = _visualController.value;
        final float = sin(t * 2 * pi) * 4;
        final pulse = 1.0 + sin(t * 2 * pi) * 0.02;
        return Transform.translate(
          offset: Offset(0, float),
          child: Transform.scale(
            scale: pulse,
            child: _getSlideVisual(),
          ),
        );
      },
    );
  }

  Widget _getSlideVisual() {
    switch (widget.data.slideIndex) {
      case 0: return _welcomeVisual();
      case 1: return _studySetsVisual();
      case 2: return _aiChatVisual();
      case 3: return _problemSolverVisual();
      case 4: return _examCloneVisual();
      case 5: return _liveQuizVisual();
      case 6: return _spacedRepVisual();
      case 7: return _analyticsVisual();
      case 8: return _handwritingVisual();
      case 9: return _adFreeVisual();
      default: return const SizedBox.shrink();
    }
  }

  // 0: Welcome - Logo with orbiting feature icons (always animated)
  Widget _welcomeVisual() {
    final icons = [
      Icons.menu_book, Icons.psychology, Icons.auto_awesome, Icons.copy,
      Icons.groups, Icons.replay, Icons.bar_chart, Icons.draw,
    ];
    final t = _visualController.value;
    return SizedBox(
      width: 180, height: 180,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Center logo - pulsing
          Transform.scale(
            scale: 0.9 + sin(t * 2 * pi) * 0.1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.asset(
                'assets/logo/studyield-logo.png',
                width: 72, height: 72,
                errorBuilder: (_, __, ___) => Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(
                    gradient: AppColors.greenGradient,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.school, size: 40, color: Colors.white),
                ),
              ),
            ),
          ),
          // Orbiting icons - continuously scaling
          ...icons.asMap().entries.map((e) {
            final angle = (e.key / icons.length) * 2 * pi;
            final iconPulse = 1.0 + sin((t + e.key * 0.125) * 2 * pi) * 0.12;
            return Transform.translate(
              offset: Offset(cos(angle) * 80, sin(angle) * 80),
              child: Transform.scale(
                scale: iconPulse,
                child: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.grey200),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 2))],
                  ),
                  child: Icon(e.value, size: 16, color: AppColors.primary),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // 1: Study Sets - Stacked cards floating continuously
  Widget _studySetsVisual() {
    final t = _visualController.value;
    return Center(
      child: SizedBox(
        width: 200, height: 160,
        child: Stack(
          alignment: Alignment.center,
          children: [
            ...[2, 1, 0].map((i) {
              final cardFloat = sin((t + i * 0.15) * 2 * pi) * 3;
              return Transform.translate(
                offset: Offset(i * 10.0 - 10, i * 6.0 - 6 + cardFloat),
                child: Transform.rotate(
                  angle: -0.1 + i * 0.1,
                  child: Container(
                    width: 160, height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(height: 4, decoration: const BoxDecoration(
                          gradient: LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF06B6D4)]),
                          borderRadius: BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)),
                        )),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Container(height: 6, width: 100, decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(3))),
                            const SizedBox(height: 6),
                            Container(height: 6, width: 70, decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(3))),
                            const SizedBox(height: 6),
                            Container(height: 6, width: 50, decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(3))),
                          ]),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            // Sparkles badge - pulsing
            Positioned(
              right: 10, bottom: 10,
              child: Transform.scale(
                scale: 1.0 + sin(t * 2 * pi) * 0.15,
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF06B6D4)]),
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: const Color(0xFF2563EB).withValues(alpha: 0.4), blurRadius: 10)],
                  ),
                  child: const Icon(Icons.auto_awesome, size: 20, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2: AI Chat - Chat bubbles continuously bobbing
  Widget _aiChatVisual() {
    final t = _visualController.value;
    return Center(
      child: SizedBox(
        width: 220,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // User message - floating
            Transform.translate(
              offset: Offset(0, sin(t * 2 * pi) * 2),
              child: Opacity(opacity: 0.7 + sin(t * 2 * pi) * 0.3,
              child: Align(
                alignment: Alignment.centerRight,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16), topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(16), bottomRight: Radius.circular(4),
                    ),
                    boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 8)],
                  ),
                  child: Text('onboarding.feature_slide.sample_question'.tr(),
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
                ),
              ),
            )),
            const SizedBox(height: 10),
            // AI response - floating with delay
            Transform.translate(
              offset: Offset(0, sin((t + 0.25) * 2 * pi) * 2),
              child: Opacity(opacity: 0.7 + sin((t + 0.25) * 2 * pi) * 0.3,
              child: Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16), topRight: Radius.circular(16),
                      bottomLeft: Radius.circular(4), bottomRight: Radius.circular(16),
                    ),
                    border: Border.all(color: AppColors.grey200),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8)],
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Container(
                        width: 18, height: 18,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(colors: [Color(0xFF059669), Color(0xFF10B981)]),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.psychology, size: 10, color: Colors.white),
                      ),
                      const SizedBox(width: 6),
                      Text('onboarding.feature_slide.ai_tutor'.tr(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ]),
                    const SizedBox(height: 6),
                    Text('onboarding.feature_slide.sample_answer'.tr(),
                      style: const TextStyle(fontSize: 12, color: Colors.black87)),
                  ]),
                ),
              ),
            )),
            const SizedBox(height: 10),
            // Typing indicator
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.grey200),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6)],
                ),
                child: const _TypingDots(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 3: Problem Solver - Equation → solution (floating)
  Widget _problemSolverVisual() {
    final t = _visualController.value;
    return Center(
      child: SizedBox(
        width: 220,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Problem card - floating
            Transform.translate(
              offset: Offset(0, sin(t * 2 * pi) * 3),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.grey200),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10)],
                ),
                child: Column(children: [
                  Text('onboarding.feature_slide.problem_label'.tr(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFF97316))),
                  const SizedBox(height: 4),
                  const Text('x\u00B2 + 5x + 6 = 0', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                ]),
              ),
            ),
            // Arrow connector - pulsing
            SizedBox(
              height: 16,
              child: Transform.scale(
                scaleY: 0.8 + sin(t * 2 * pi) * 0.2,
                child: Container(width: 2, color: const Color(0xFFF97316)),
              ),
            ),
            // Solution card - floating opposite
            Transform.translate(
              offset: Offset(0, sin((t + 0.5) * 2 * pi) * 3),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFED7AA), width: 2),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10)],
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    const Icon(Icons.check, size: 12, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text('onboarding.feature_slide.solution_label'.tr(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ]),
                  const SizedBox(height: 6),
                  const Text('(x + 2)(x + 3) = 0', style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: Colors.black54)),
                  const Text('x = -2, x = -3', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 4: Exam Clone - Past exam → New exam (floating)
  Widget _examCloneVisual() {
    final t = _visualController.value;
    return Center(
      child: SizedBox(
        width: 240, height: 160,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Past exam (left, faded) - floating
            Positioned(
              left: 10, top: 10 + sin(t * 2 * pi) * 2,
              child: Opacity(opacity: 0.5 + sin(t * 2 * pi) * 0.1,
                child: _buildMiniExamCard('PAST EXAM', const Color(0xFF6366F1), false),
              ),
            ),
            // Arrow - bouncing right
            Transform.translate(
              offset: Offset(sin(t * 2 * pi) * 4, 0),
              child: Opacity(opacity: 0.6 + sin(t * 2 * pi) * 0.4,
                child: const Icon(Icons.arrow_forward, size: 22, color: Color(0xFF818CF8)),
              ),
            ),
            // New exam (right) - floating
            Positioned(
              right: 10, top: 20 + sin((t + 0.25) * 2 * pi) * 3,
              child: _buildMiniExamCard('NEW EXAM', AppColors.primary, true),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniExamCard(String label, Color color, bool isNew) {
    return Container(
      width: 100, height: 120,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isNew ? color.withValues(alpha: 0.5) : AppColors.grey200, width: isNew ? 2 : 1),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isNew ? 0.12 : 0.06), blurRadius: 8)],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          if (isNew) Icon(Icons.auto_awesome, size: 10, color: color),
          if (isNew) const SizedBox(width: 2),
          Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: color)),
        ]),
        const SizedBox(height: 8),
        ...List.generate(3, (i) => Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Row(children: [
            Text('${i + 1}.', style: const TextStyle(fontSize: 8, color: Colors.grey)),
            const SizedBox(width: 4),
            Expanded(child: Container(height: 5, decoration: BoxDecoration(
              color: isNew ? color.withValues(alpha: 0.15) : const Color(0xFFE0E7FF),
              borderRadius: BorderRadius.circular(3),
            ))),
          ]),
        )),
      ]),
    );
  }

  // 5: Live Quiz - Leaderboard (continuously animated)
  Widget _liveQuizVisual() {
    final t = _visualController.value;
    final players = [
      {'name': 'You', 'score': '850', 'color': const Color(0xFFEC4899)},
      {'name': 'Alex', 'score': '720', 'color': const Color(0xFF3B82F6)},
      {'name': 'Mia', 'score': '680', 'color': const Color(0xFF9333EA)},
    ];
    return Center(
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.grey200),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12)],
        ),
        child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Transform.rotate(
              angle: sin(t * 2 * pi) * 0.3,
              child: const Icon(Icons.bolt, size: 14, color: Color(0xFFEC4899)),
            ),
            const SizedBox(width: 4),
            Text('onboarding.feature_slide.live_leaderboard'.tr(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFEC4899))),
          ]),
          const SizedBox(height: 10),
          ...players.asMap().entries.map((e) {
            final i = e.key;
            final p = e.value;
            return Transform.translate(
              offset: Offset(sin((t + i * 0.15) * 2 * pi) * 3, 0),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(children: [
                  SizedBox(width: 20, child: Text(
                    i == 0 ? '\u{1F451}' : '${i + 1}',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: i == 0 ? const Color(0xFFF59E0B) : Colors.grey),
                  )),
                  Container(
                    width: 22, height: 22,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [p['color'] as Color, (p['color'] as Color).withValues(alpha: 0.7)]),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(child: Text(p['name'] as String, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))),
                  Transform.scale(
                    scale: 1.0 + sin((t + i * 0.1) * 2 * pi) * 0.08,
                    child: Text(p['score'] as String, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFFEC4899))),
                  ),
                ]),
              ),
            );
          }),
        ]),
      ),
    );
  }

  // 6: Spaced Repetition - Retention curve (bars oscillating)
  Widget _spacedRepVisual() {
    final t = _visualController.value;
    final bars = [90.0, 50.0, 85.0, 45.0, 80.0, 42.0, 78.0, 95.0];
    return Center(
      child: Container(
        width: 220,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.grey200),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12)],
        ),
        child: Column(children: [
          Row(children: [
            Transform.rotate(
              angle: t * 2 * pi,
              child: const Icon(Icons.replay, size: 14, color: Color(0xFF9333EA)),
            ),
            const SizedBox(width: 4),
            Text('onboarding.feature_slide.retention_curve'.tr(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF9333EA))),
          ]),
          const SizedBox(height: 10),
          SizedBox(
            height: 60,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: bars.asMap().entries.map((e) {
                final i = e.key;
                final h = e.value;
                final isLast = i == bars.length - 1;
                final barH = (h * 0.7 + h * 0.3 * (0.5 + 0.5 * sin((t + i * 0.05) * 2 * pi))) / 100.0;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 1.5),
                    child: FractionallySizedBox(
                      heightFactor: barH.clamp(0.0, 1.0),
                      alignment: Alignment.bottomCenter,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: isLast
                                ? [const Color(0xFF10B981), const Color(0xFF34D399)]
                                : [const Color(0xFF9333EA).withValues(alpha: 0.6), const Color(0xFFA855F7).withValues(alpha: 0.6)],
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(3),
                            topRight: Radius.circular(3),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 6),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('onboarding.feature_slide.day_1'.tr(), style: TextStyle(fontSize: 8, color: Colors.grey)),
            Text('Today \u2713', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.primary)),
          ]),
        ]),
      ),
    );
  }

  // 7: Analytics - Mini dashboard (stats pulsing, heatmap fading)
  Widget _analyticsVisual() {
    final rng = Random(42); // fixed seed for consistent display
    return Center(
      child: Container(
          width: 200,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.grey200),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12)],
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            // Stats row
            Row(children: [
              _buildStatBox('7 days', 'Streak', const Color(0xFFF97316)),
              const SizedBox(width: 6),
              _buildStatBox('2,400', 'XP', const Color(0xFF0EA5E9)),
            ]),
            const SizedBox(height: 6),
            Align(alignment: Alignment.centerLeft, child: Text('onboarding.feature_slide.study_heatmap'.tr(), style: TextStyle(fontSize: 7, color: Colors.grey))),
            const SizedBox(height: 4),
            // Heatmap grid 7x4
            Wrap(
              spacing: 2, runSpacing: 2,
              children: List.generate(28, (i) {
                final intensity = rng.nextDouble();
                Color c;
                if (intensity > 0.7) {
                  c = const Color(0xFF22C55E);
                } else if (intensity > 0.4) {
                  c = const Color(0xFF86EFAC);
                } else if (intensity > 0.15) {
                  c = const Color(0xFFDCFCE7);
                } else {
                  c = const Color(0xFFF3F4F6);
                }
                final cellOpacity = 0.5 + 0.5 * sin((_visualController.value + i * 0.02) * 2 * pi);
                return Opacity(
                  opacity: cellOpacity.clamp(0.3, 1.0),
                  child: Container(
                    width: 18, height: 18,
                    decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(3)),
                  ),
                );
              }),
            ),
          ]),
        ),
    );
  }

  Widget _buildStatBox(String value, String label, Color color) {
    final t = _visualController.value;
    return Expanded(
      child: Transform.scale(
        scale: 1.0 + sin(t * 2 * pi) * 0.03,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.grey100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
            Text(label, style: const TextStyle(fontSize: 7, color: Colors.grey)),
          ]),
        ),
      ),
    );
  }

  // 8: Handwriting OCR - Handwritten → Digital (floating)
  Widget _handwritingVisual() {
    final t = _visualController.value;
    return Center(
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: SizedBox(
        width: 240,
        child: Row(
          children: [
            // Handwritten side - gentle rotate
            Expanded(
              child: Transform.rotate(
                angle: -0.03 + sin(t * 2 * pi) * 0.02,
                child: Transform.translate(
                  offset: Offset(0, sin(t * 2 * pi) * 2),
                  child: Container(
                  height: 90,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFED7AA)),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 6)],
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('onboarding.feature_slide.handwritten'.tr(), style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: const Color(0xFFD97706))),
                    const SizedBox(height: 8),
                    // Wavy lines (simulating handwriting)
                    ...List.generate(2, (i) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: CustomPaint(
                        size: Size(double.infinity, 8),
                        painter: _WavyLinePainter(const Color(0xFF92400E)),
                      ),
                    )),
                  ]),
                ),
              ),
            )),
            // Arrow - bouncing
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Transform.translate(
                offset: Offset(sin(t * 2 * pi) * 4, 0),
                child: Opacity(opacity: 0.6 + sin(t * 2 * pi) * 0.4,
                  child: const Icon(Icons.arrow_forward, size: 18, color: Color(0xFFEF4444)),
                ),
              ),
            ),
            // Digital side - floating
            Expanded(
              child: Transform.translate(
                offset: Offset(0, sin((t + 0.25) * 2 * pi) * 2),
                child: Container(
                  height: 90,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBBF7D0), width: 2),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 6)],
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      const Icon(Icons.check, size: 10, color: AppColors.primary),
                      const SizedBox(width: 2),
                      Text('onboarding.feature_slide.digital'.tr(), style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ]),
                    const SizedBox(height: 8),
                    Text('onboarding.feature_slide.sample_ocr'.tr(),
                      style: const TextStyle(fontSize: 10, height: 1.4)),
                  ]),
                ),
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }

  // 9: Ad-Free - Shield pulsing with ad icons breathing
  Widget _adFreeVisual() {
    final t = _visualController.value;
    final adPositions = [
      const Offset(-55, -30), const Offset(55, -25),
      const Offset(-50, 35), const Offset(52, 38),
    ];
    return Center(
      child: SizedBox(
        width: 180, height: 180,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Central shield - pulsing
            Transform.scale(
              scale: 1.0 + sin(t * 2 * pi) * 0.06,
              child: Container(
                width: 90, height: 90,
                decoration: BoxDecoration(
                  gradient: AppColors.greenGradient,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 24, spreadRadius: 4)],
                ),
                child: const Icon(Icons.verified_user, size: 48, color: Colors.white),
              ),
            ),
            // Crossed-out ad icons - breathing
            ...adPositions.asMap().entries.map((e) {
              final i = e.key;
              final pos = e.value;
              final iconScale = 0.9 + sin((t + i * 0.15) * 2 * pi) * 0.1;
              final iconOpacity = 0.5 + sin((t + i * 0.15) * 2 * pi) * 0.5;
              return Transform.translate(
                offset: Offset(pos.dx, pos.dy),
                child: Transform.scale(
                  scale: iconScale,
                  child: Opacity(
                    opacity: iconOpacity.clamp(0.3, 1.0),
                    child: Container(
                      width: 34, height: 34,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: const Icon(Icons.block, size: 18, color: Color(0xFFF87171)),
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  // ─── Bullet & Badge helpers ──────────────────────────────────

  Widget _buildBulletItem(String text, int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + index * 60),
      builder: (_, v, child) => Opacity(opacity: v, child: Transform.translate(offset: Offset(-10 * (1 - v), 0), child: child)),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 3),
              width: 22, height: 22,
              decoration: BoxDecoration(
                gradient: widget.data.gradient,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check, size: 12, color: Colors.white),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(text,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textPrimary.withValues(alpha: 0.8),
                  height: 1.4,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeBadges() {
    final badges = [
      {'label': 'onboarding.slides.badge_ad_free'.tr(), 'icon': Icons.block, 'color': AppColors.primary},
      {'label': 'onboarding.slides.badge_free'.tr(), 'icon': Icons.verified_user, 'color': AppColors.blue},
      {'label': 'onboarding.slides.badge_ai'.tr(), 'icon': Icons.bolt, 'color': AppColors.purple},
    ];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Wrap(
        spacing: 8, runSpacing: 8,
        alignment: WrapAlignment.center,
        children: badges.asMap().entries.map((e) {
          final badge = e.value;
          final color = badge['color'] as Color;
          return TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: Duration(milliseconds: 300 + e.key * 60),
            curve: Curves.elasticOut,
            builder: (_, v, child) => Transform.scale(scale: v, child: Opacity(opacity: v.clamp(0.0, 1.0), child: child)),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: color.withValues(alpha: 0.2)),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(badge['icon'] as IconData, size: 14, color: color),
                const SizedBox(width: 5),
                Text(badge['label'] as String,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
              ]),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ─── Typing dots animation ──────────────────────────────────

class _TypingDots extends StatefulWidget {
  const _TypingDots();

  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots> with TickerProviderStateMixin {
  late List<AnimationController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(3, (i) {
      return AnimationController(
        duration: const Duration(milliseconds: 600),
        vsync: this,
      )..repeat(reverse: true);
    });
    // Stagger
    for (int i = 0; i < 3; i++) {
      Future.delayed(Duration(milliseconds: i * 150), () {
        if (mounted) _controllers[i].forward();
      });
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) { c.dispose(); }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: _controllers[i],
          builder: (_, __) {
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              child: Transform.translate(
                offset: Offset(0, -4 * _controllers[i].value),
                child: Container(
                  width: 6, height: 6,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          },
        );
      }),
    );
  }
}

// ─── Wavy line painter (for handwriting visual) ──────────────

class _WavyLinePainter extends CustomPainter {
  final Color color;
  _WavyLinePainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    path.moveTo(2, size.height * 0.7);
    path.quadraticBezierTo(size.width * 0.15, 2, size.width * 0.3, size.height * 0.6);
    path.quadraticBezierTo(size.width * 0.45, size.height, size.width * 0.58, size.height * 0.5);
    path.quadraticBezierTo(size.width * 0.75, 2, size.width * 0.85, size.height * 0.65);
    path.quadraticBezierTo(size.width * 0.92, size.height, size.width - 2, size.height * 0.4);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
