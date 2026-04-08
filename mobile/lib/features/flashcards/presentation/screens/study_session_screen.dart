import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../widgets/rating_button.dart';
import '../widgets/session_summary_dialog.dart';

class StudySessionScreen extends StatefulWidget {
  final List<FlashcardEntity> flashcards;
  final String studySetTitle;
  final Function(String flashcardId, int quality) onReview;

  const StudySessionScreen({
    super.key,
    required this.flashcards,
    required this.studySetTitle,
    required this.onReview,
  });

  @override
  State<StudySessionScreen> createState() => _StudySessionScreenState();
}

class _StudySessionScreenState extends State<StudySessionScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;
  late Animation<double> _scaleAnimation;

  int _currentIndex = 0;
  bool _showingFront = true;
  int _correctCount = 0;
  int _hardCount = 0;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _flipAnimation = Tween<double>(begin: 0, end: pi).animate(
      CurvedAnimation(
        parent: _flipController,
        curve: Curves.easeInOutCubic,
      ),
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(
        parent: _flipController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flipCard() {
    if (_showingFront) {
      _flipController.forward();
      setState(() {
        _showingFront = false;
      });
    } else {
      _flipController.reverse();
      setState(() {
        _showingFront = true;
      });
    }
  }

  void _handleRating(int quality) async {
    final currentCard = widget.flashcards[_currentIndex];

    // Track stats
    if (quality >= 4) _correctCount++;
    if (quality == 3) _hardCount++;

    // Submit review to backend
    widget.onReview(currentCard.id, quality);

    // Move to next card
    if (_currentIndex < widget.flashcards.length - 1) {
      await Future.delayed(Duration(milliseconds: 300));
      setState(() {
        _currentIndex++;
        _showingFront = true;
        _flipController.reset();
      });
    } else {
      // Session complete - show summary
      _showSessionSummary();
    }
  }

  void _showSessionSummary() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => SessionSummaryDialog(
        totalCards: widget.flashcards.length,
        correctCount: _correctCount,
        hardCount: _hardCount,
        onDone: () {
          Navigator.of(context).pop(); // Close dialog
          Navigator.of(context).pop(); // Close session screen
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currentCard = widget.flashcards[_currentIndex];

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.close,
            color: theme.colorScheme.onSurface,
          ),
          onPressed: () {
            _showExitConfirmation();
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.studySetTitle,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            Text(
              'flashcards.study.card_progress'.tr(namedArgs: {
                'current': '${_currentIndex + 1}',
                'total': '${widget.flashcards.length}',
              }),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Bar
            LinearProgressIndicator(
              value: (_currentIndex + 1) / widget.flashcards.length,
              backgroundColor: AppColors.grey200,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 4,
            ),

            SizedBox(height: AppDimensions.space32),

            // Flashcard with 3D Flip
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: AppDimensions.space20,
                  vertical: AppDimensions.space16,
                ),
                child: GestureDetector(
                  onTap: _flipCard,
                  child: AnimatedBuilder(
                    animation: _flipController,
                    builder: (context, child) {
                      final angle = _flipAnimation.value;
                      final isFrontVisible = angle < pi / 2;

                      return Transform(
                        transform: Matrix4.identity()
                          ..setEntry(3, 2, 0.002) // More pronounced perspective
                          ..scale(_scaleAnimation.value)
                          ..rotateY(angle),
                        alignment: Alignment.center,
                        child: isFrontVisible
                            ? _buildCardFront(currentCard, theme)
                            : Transform(
                                transform: Matrix4.identity()..rotateY(pi),
                                alignment: Alignment.center,
                                child: _buildCardBack(currentCard, theme),
                              ),
                      );
                    },
                  ),
                ),
              ),
            ),

            SizedBox(height: AppDimensions.space24),

            // Rating Buttons (only show when back is visible)
            if (!_showingFront) ...[
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: AppDimensions.space20,
                ),
                child: Column(
                  children: [
                    Text(
                      'flashcards.study.question_rating'.tr(),
                      style: AppTextStyles.titleSmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    SizedBox(height: AppDimensions.space16),
                    Row(
                      children: [
                        Expanded(
                          child: RatingButton(
                            label: 'flashcards.study.rating_again'.tr(),
                            subtitle: 'flashcards.study.rating_again_subtitle'.tr(),
                            color: AppColors.error,
                            onPressed: () => _handleRating(1),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: RatingButton(
                            label: 'flashcards.study.rating_hard'.tr(),
                            subtitle: 'flashcards.study.rating_hard_subtitle'.tr(),
                            color: AppColors.warning,
                            onPressed: () => _handleRating(3),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: RatingButton(
                            label: 'flashcards.study.rating_good'.tr(),
                            subtitle: 'flashcards.study.rating_good_subtitle'.tr(),
                            color: AppColors.info,
                            onPressed: () => _handleRating(4),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: RatingButton(
                            label: 'flashcards.study.rating_easy'.tr(),
                            subtitle: 'flashcards.study.rating_easy_subtitle'.tr(),
                            color: AppColors.success,
                            onPressed: () => _handleRating(5),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: AppDimensions.space24),
            ] else ...[
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: AppDimensions.space20,
                ),
                child: Container(
                  padding: EdgeInsets.all(AppDimensions.space16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(
                      AppDimensions.radiusMedium,
                    ),
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.touch_app_rounded,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'flashcards.study.hint_tap_card'.tr(),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: AppDimensions.space24),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCardFront(FlashcardEntity card, ThemeData theme) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primaryLight,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.5),
            blurRadius: 30,
            spreadRadius: 2,
            offset: Offset(0, 15),
          ),
        ],
      ),
      child: Container(
        padding: EdgeInsets.all(AppDimensions.space32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'flashcards.study.label_question'.tr(),
                style: AppTextStyles.labelSmall.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            SizedBox(height: AppDimensions.space32),
            Expanded(
              child: Center(
                child: Text(
                  card.front,
                  style: AppTextStyles.headlineMedium.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            if (card.tags.isNotEmpty) ...[
              Wrap(
                spacing: 8,
                alignment: WrapAlignment.center,
                children: card.tags.map((tag) {
                  return Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      tag,
                      style: AppTextStyles.labelSmall.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCardBack(FlashcardEntity card, ThemeData theme) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF059669), // Green-600
            Color(0xFF10B981), // Emerald-500
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF10B981).withOpacity(0.5),
            blurRadius: 30,
            spreadRadius: 2,
            offset: Offset(0, 15),
          ),
        ],
      ),
      child: Container(
        padding: EdgeInsets.all(AppDimensions.space32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'flashcards.study.label_answer'.tr(),
                style: AppTextStyles.labelSmall.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            SizedBox(height: AppDimensions.space32),
            Expanded(
              child: Center(
                child: Text(
                  card.back,
                  style: AppTextStyles.headlineMedium.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            if (card.notes != null && card.notes!.isNotEmpty) ...[
              SizedBox(height: AppDimensions.space16),
              Container(
                padding: EdgeInsets.all(AppDimensions.space16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(
                    AppDimensions.radiusMedium,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      color: Colors.white.withOpacity(0.9),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        card.notes!,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('flashcards.study.exit_dialog_title'.tr()),
        content: Text(
          'flashcards.study.exit_dialog_message'.tr(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('flashcards.study.exit_button_continue'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close session
            },
            child: Text(
              'flashcards.study.exit_button_exit'.tr(),
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
