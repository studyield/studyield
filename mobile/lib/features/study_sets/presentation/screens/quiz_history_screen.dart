import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/study_set_entity.dart';

class QuizHistoryScreen extends StatefulWidget {
  final StudySetEntity studySet;

  const QuizHistoryScreen({
    super.key,
    required this.studySet,
  });

  @override
  State<QuizHistoryScreen> createState() => _QuizHistoryScreenState();
}

class _QuizHistoryScreenState extends State<QuizHistoryScreen> {
  List<Map<String, dynamic>> _quizzes = [];
  Map<String, List<Map<String, dynamic>>> _attemptsByQuiz = {};
  bool _isLoading = true;
  String? _expandedQuizId;

  @override
  void initState() {
    super.initState();
    _loadQuizHistory();
  }

  Future<void> _loadQuizHistory() async {
    setState(() => _isLoading = true);

    try {
      final apiClient = ApiClient.instance;

      // Fetch quizzes for this study set
      final quizzesResponse = await apiClient.get(
        '/quizzes/study-set/${widget.studySet.id}',
      );

      final quizzes = (quizzesResponse.data as List<dynamic>)
          .map((q) => q as Map<String, dynamic>)
          .toList();

      // Fetch attempts for each quiz
      Map<String, List<Map<String, dynamic>>> attemptsMap = {};
      for (var quiz in quizzes) {
        try {
          final attemptsResponse = await apiClient.get(
            '/quizzes/${quiz['id']}/attempts',
          );
          attemptsMap[quiz['id']] = (attemptsResponse.data as List<dynamic>)
              .map((a) => a as Map<String, dynamic>)
              .toList();
        } catch (e) {
          attemptsMap[quiz['id']] = [];
        }
      }

      setState(() {
        _quizzes = quizzes;
        _attemptsByQuiz = attemptsMap;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('study_sets.quiz_history.failed_to_load'.tr(namedArgs: {'error': e.toString()})),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  int get _totalAttempts =>
      _attemptsByQuiz.values.fold(0, (sum, attempts) => sum + attempts.length);

  double get _bestScore => _attemptsByQuiz.values
      .expand((attempts) => attempts)
      .fold(0.0, (best, a) => (a['score'] as num).toDouble() > best ? (a['score'] as num).toDouble() : best);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'study_sets.quiz_history.quiz_history'.tr(),
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.studySet.title,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _quizzes.isEmpty
              ? Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppDimensions.space24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.quiz_outlined,
                          size: 64,
                          color: AppColors.grey400,
                        ),
                        SizedBox(height: AppDimensions.space16),
                        Text(
                          'study_sets.quiz_history.no_quiz_history'.tr(),
                          style: AppTextStyles.titleLarge.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'study_sets.quiz_history.no_quiz_history_description'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.grey600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: EdgeInsets.all(AppDimensions.space20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Summary Stats
                      Row(
                        children: [
                          Expanded(
                            child: _SummaryCard(
                              icon: Icons.quiz,
                              label: 'study_sets.quiz_history.quizzes'.tr(),
                              value: '${_quizzes.length}',
                              color: AppColors.secondary,
                            ),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: _SummaryCard(
                              icon: Icons.sports_score,
                              label: 'study_sets.quiz_history.attempts'.tr(),
                              value: '$_totalAttempts',
                              color: AppColors.primary,
                            ),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: _SummaryCard(
                              icon: Icons.emoji_events,
                              label: 'study_sets.quiz_history.best_score'.tr(),
                              value: '${_bestScore.round()}%',
                              color: AppColors.warning,
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: AppDimensions.space24),

                      // Quizzes List
                      ..._quizzes.map((quiz) {
                        final quizId = quiz['id'] as String;
                        final attempts = _attemptsByQuiz[quizId] ?? [];
                        final isExpanded = _expandedQuizId == quizId;
                        final topScore = attempts.isEmpty
                            ? 0.0
                            : attempts
                                .map((a) => (a['score'] as num).toDouble())
                                .reduce((a, b) => a > b ? a : b);

                        return Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: Container(
                            decoration: BoxDecoration(
                              color: theme.cardColor,
                              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                              border: Border.all(
                                color: theme.colorScheme.onSurface.withOpacity(0.1),
                              ),
                            ),
                            child: Column(
                              children: [
                                // Quiz Header
                                InkWell(
                                  onTap: () {
                                    setState(() {
                                      _expandedQuizId = isExpanded ? null : quizId;
                                    });
                                  },
                                  child: Padding(
                                    padding: EdgeInsets.all(AppDimensions.space16),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: EdgeInsets.all(10),
                                          decoration: BoxDecoration(
                                            color: AppColors.secondary.withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Icon(
                                            Icons.quiz,
                                            color: AppColors.secondary,
                                            size: 20,
                                          ),
                                        ),
                                        SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                quiz['title'] as String,
                                                style: AppTextStyles.titleSmall.copyWith(
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              SizedBox(height: 4),
                                              Text(
                                                attempts.isNotEmpty
                                                    ? 'study_sets.quiz_history.questions_and_attempts'.tr(namedArgs: {
                                                        'questionCount': quiz['questionCount'].toString(),
                                                        'attemptCount': attempts.length.toString()
                                                      })
                                                    : 'study_sets.quiz_history.questions_only'.tr(namedArgs: {
                                                        'questionCount': quiz['questionCount'].toString()
                                                      }),
                                                style: AppTextStyles.bodySmall.copyWith(
                                                  color: AppColors.grey600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (attempts.isNotEmpty)
                                          Container(
                                            padding: EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: _getScoreColor(topScore).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              'study_sets.quiz_history.best'.tr(namedArgs: {'score': topScore.round().toString()}),
                                              style: AppTextStyles.bodySmall.copyWith(
                                                color: _getScoreColor(topScore),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                        SizedBox(width: 8),
                                        Icon(
                                          isExpanded ? Icons.expand_less : Icons.expand_more,
                                          color: AppColors.grey600,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                                // Attempts List
                                if (isExpanded) ...[
                                  Divider(height: 1),
                                  if (attempts.isEmpty)
                                    Padding(
                                      padding: EdgeInsets.all(AppDimensions.space16),
                                      child: Text(
                                        'study_sets.quiz_history.no_attempts_yet'.tr(),
                                        style: AppTextStyles.bodySmall.copyWith(
                                          color: AppColors.grey600,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    )
                                  else
                                    ...attempts.map((attempt) {
                                      final score = (attempt['score'] as num).toDouble();
                                      final timeSpent = attempt['timeSpent'] as int;
                                      final createdAt = DateTime.parse(attempt['createdAt'] as String);

                                      return InkWell(
                                        onTap: () {
                                          // TODO: Show attempt details
                                        },
                                        child: Container(
                                          padding: EdgeInsets.all(AppDimensions.space16),
                                          decoration: BoxDecoration(
                                            border: Border(
                                              bottom: BorderSide(
                                                color: theme.colorScheme.onSurface.withOpacity(0.05),
                                              ),
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              Container(
                                                width: 48,
                                                height: 48,
                                                decoration: BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  color: _getScoreColor(score),
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    '${score.round()}%',
                                                    style: AppTextStyles.labelMedium.copyWith(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      '${createdAt.month}/${createdAt.day}/${createdAt.year} at ${createdAt.hour}:${createdAt.minute.toString().padLeft(2, '0')}',
                                                      style: AppTextStyles.bodyMedium.copyWith(
                                                        fontWeight: FontWeight.w500,
                                                      ),
                                                    ),
                                                    SizedBox(height: 4),
                                                    Text(
                                                      'study_sets.quiz_history.questions_and_time'.tr(namedArgs: {
                                                        'totalQuestions': attempt['totalQuestions'].toString(),
                                                        'minutes': (timeSpent ~/ 60).toString(),
                                                        'seconds': (timeSpent % 60).toString()
                                                      }),
                                                      style: AppTextStyles.bodySmall.copyWith(
                                                        color: AppColors.grey600,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Icon(
                                                Icons.chevron_right,
                                                color: AppColors.grey400,
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    }),
                                ],
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }

  Color _getScoreColor(double score) {
    if (score >= 70) return AppColors.success;
    if (score >= 40) return AppColors.warning;
    return AppColors.error;
  }
}

class _SummaryCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _SummaryCard({
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
          Icon(icon, color: color, size: 24),
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
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
