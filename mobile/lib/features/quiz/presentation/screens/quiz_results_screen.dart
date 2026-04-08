import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';

class QuizResultsScreen extends StatefulWidget {
  final String quizId;
  final String attemptId;
  final double score;
  final int totalQuestions;
  final int timeSpent;

  const QuizResultsScreen({
    super.key,
    required this.quizId,
    required this.attemptId,
    required this.score,
    required this.totalQuestions,
    required this.timeSpent,
  });

  @override
  State<QuizResultsScreen> createState() => _QuizResultsScreenState();
}

class _QuizResultsScreenState extends State<QuizResultsScreen> {
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: Duration(seconds: 3));
    if (widget.score >= 70) {
      _confettiController.play();
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  Color _getScoreColor() {
    if (widget.score >= 70) return AppColors.success;
    if (widget.score >= 40) return AppColors.warning;
    return AppColors.error;
  }

  String _getScoreMessage() {
    if (widget.score >= 90) return 'quiz.results.outstanding'.tr();
    if (widget.score >= 70) return 'quiz.results.great_job'.tr();
    if (widget.score >= 40) return 'quiz.results.good_effort'.tr();
    return 'quiz.results.keep_practicing'.tr();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final correctCount = ((widget.score / 100) * widget.totalQuestions).round();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'quiz.results.title'.tr(),
          style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.all(AppDimensions.space20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Score Circle
                Center(
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [_getScoreColor(), _getScoreColor().withOpacity(0.7)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: _getScoreColor().withOpacity(0.3),
                          blurRadius: 20,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '${widget.score.round()}%',
                            style: AppTextStyles.headlineLarge.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 48,
                            ),
                          ),
                          Text(
                            'quiz.results.score'.tr(),
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                SizedBox(height: AppDimensions.space24),

                // Message
                Text(
                  _getScoreMessage(),
                  style: AppTextStyles.titleLarge.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),

                SizedBox(height: AppDimensions.space32),

                // Stats Grid
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.check_circle,
                        label: 'quiz.results.correct'.tr(),
                        value: '$correctCount',
                        color: AppColors.success,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.cancel,
                        label: 'quiz.results.incorrect'.tr(),
                        value: '${widget.totalQuestions - correctCount}',
                        color: AppColors.error,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.access_time,
                        label: 'quiz.results.time'.tr(),
                        value: 'quiz.results.time_minutes'.tr(namedArgs: {'minutes': '${(widget.timeSpent / 60).floor()}'}),
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),

                SizedBox(height: AppDimensions.space32),

                // Action Buttons
                PrimaryButton(
                  text: 'quiz.results.back_to_study_set'.tr(),
                  icon: Icons.arrow_back,
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  width: double.infinity,
                  gradient: AppColors.greenGradient,
                ),

                SizedBox(height: 12),

                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: Icon(Icons.refresh),
                  label: Text('quiz.results.try_again'.tr()),
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ],
            ),
          ),

          // Confetti
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              particleDrag: 0.05,
              emissionFrequency: 0.05,
              numberOfParticles: 50,
              gravity: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.all(AppDimensions.space16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: theme.colorScheme.onSurface.withOpacity(0.1),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.titleLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          SizedBox(height: 4),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
            ),
          ),
        ],
      ),
    );
  }
}
