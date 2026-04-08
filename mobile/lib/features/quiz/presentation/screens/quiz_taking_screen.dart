import 'dart:async';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import 'quiz_results_screen.dart';

class QuizTakingScreen extends StatefulWidget {
  final String quizId;
  final String quizTitle;
  final List<dynamic> questions;
  final int? timeLimit;

  const QuizTakingScreen({
    super.key,
    required this.quizId,
    required this.quizTitle,
    required this.questions,
    this.timeLimit,
  });

  @override
  State<QuizTakingScreen> createState() => _QuizTakingScreenState();
}

class _QuizTakingScreenState extends State<QuizTakingScreen> {
  int _currentIndex = 0;
  Map<String, String> _answers = {};
  Map<String, bool> _answeredCorrectly = {};
  Map<String, int> _timeSpent = {};
  Timer? _questionTimer;
  int _questionStartTime = 0;
  int _totalTimeSpent = 0;
  bool _isSubmitting = false;
  bool _hasAnswered = false;
  final TextEditingController _fillBlankController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _startQuestionTimer();
  }

  @override
  void dispose() {
    _questionTimer?.cancel();
    _fillBlankController.dispose();
    super.dispose();
  }

  void _startQuestionTimer() {
    _questionStartTime = DateTime.now().millisecondsSinceEpoch;
    _questionTimer?.cancel();
    _questionTimer = Timer.periodic(Duration(seconds: 1), (_) {
      setState(() {});
    });
  }

  int _getQuestionTime() {
    return ((DateTime.now().millisecondsSinceEpoch - _questionStartTime) / 1000).round();
  }

  void _selectAnswer(String answer) {
    if (_hasAnswered) return;

    final question = widget.questions[_currentIndex];
    final questionId = question['id'] as String;
    final correctAnswer = question['correctAnswer'] as String;
    final isCorrect = answer.toLowerCase().trim() == correctAnswer.toLowerCase().trim();

    setState(() {
      _answers[questionId] = answer;
      _answeredCorrectly[questionId] = isCorrect;
      _hasAnswered = true;
    });
  }

  void _nextQuestion() {
    final question = widget.questions[_currentIndex];
    final questionId = question['id'] as String;
    _timeSpent[questionId] = _getQuestionTime();

    if (_currentIndex < widget.questions.length - 1) {
      setState(() {
        _currentIndex++;
        _hasAnswered = false;
        _fillBlankController.clear();
      });
      _startQuestionTimer();
    } else {
      _submitQuiz();
    }
  }

  void _previousQuestion() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
      });
      _startQuestionTimer();
    }
  }

  Future<void> _submitQuiz() async {
    setState(() => _isSubmitting = true);

    try {
      _totalTimeSpent = _timeSpent.values.fold(0, (sum, time) => sum + time);

      final apiClient = ApiClient.instance;
      final response = await apiClient.post(
        '/quizzes/${widget.quizId}/attempts',
        data: {
          'answers': _answers.entries.map((e) => {
            'questionId': e.key,
            'answer': e.value,
            'timeSpent': _timeSpent[e.key] ?? 0,
          }).toList(),
          'totalTimeSpent': _totalTimeSpent,
        },
      );

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => QuizResultsScreen(
            quizId: widget.quizId,
            attemptId: response.data['id'] as String,
            score: (response.data['score'] as num).toDouble(),
            totalQuestions: widget.questions.length,
            timeSpent: _totalTimeSpent,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('quiz.taking.failed_to_submit'.tr(namedArgs: {'error': '$e'})),
          backgroundColor: AppColors.error,
        ),
      );
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final question = widget.questions[_currentIndex];
    final questionId = question['id'] as String;
    final selectedAnswer = _answers[questionId];
    final questionType = question['type'] as String;
    final correctAnswer = question['correctAnswer'] as String;
    final isCorrect = _answeredCorrectly[questionId];

    // Get options - generate True/False if not provided
    List<String>? options;
    if (questionType == 'true_false') {
      options = ['True', 'False'];
    } else if (questionType == 'multiple_choice') {
      options = (question['options'] as List<dynamic>?)?.map((e) => e.toString()).toList();
    }

    return WillPopScope(
      onWillPop: () async {
        final result = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('quiz.taking.exit_quiz'.tr()),
            content: Text('quiz.taking.exit_message'.tr()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text('quiz.taking.cancel'.tr()),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text('quiz.taking.exit'.tr(), style: TextStyle(color: AppColors.error)),
              ),
            ],
          ),
        );
        return result ?? false;
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: theme.scaffoldBackgroundColor,
          elevation: 0,
          title: Text(
            widget.quizTitle,
            style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
          ),
          actions: [
            Center(
              child: Padding(
                padding: EdgeInsets.only(right: 16),
                child: Text(
                  'quiz.taking.question_progress'.tr(namedArgs: {
                    'current': '${_currentIndex + 1}',
                    'total': '${widget.questions.length}'
                  }),
                  style: AppTextStyles.titleSmall.copyWith(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
        body: _isSubmitting
            ? Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Progress bar
                  LinearProgressIndicator(
                    value: (_currentIndex + 1) / widget.questions.length,
                    backgroundColor: AppColors.grey200,
                    valueColor: AlwaysStoppedAnimation(AppColors.secondary),
                  ),

                  Expanded(
                    child: SingleChildScrollView(
                      padding: EdgeInsets.all(AppDimensions.space20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Question
                          Container(
                            padding: EdgeInsets.all(AppDimensions.space20),
                            decoration: BoxDecoration(
                              color: theme.cardColor,
                              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                              border: Border.all(
                                color: theme.colorScheme.onSurface.withOpacity(0.1),
                              ),
                            ),
                            child: Text(
                              question['question'] as String,
                              style: AppTextStyles.titleMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),

                          SizedBox(height: AppDimensions.space24),

                          // Options for Multiple Choice and True/False
                          if (questionType != 'fill_blank' && options != null)
                            ...options.map((option) {
                              final isSelected = selectedAnswer == option;
                              final isThisCorrect = option == correctAnswer;
                              final showFeedback = _hasAnswered;

                              Color? borderColor;
                              Color? backgroundColor;
                              IconData? feedbackIcon;
                              Color? feedbackIconColor;

                              if (showFeedback && isCorrect != null) {
                                if (isSelected) {
                                  if (isCorrect) {
                                    borderColor = AppColors.success;
                                    backgroundColor = AppColors.success.withOpacity(0.1);
                                    feedbackIcon = Icons.check_circle;
                                    feedbackIconColor = AppColors.success;
                                  } else {
                                    borderColor = AppColors.error;
                                    backgroundColor = AppColors.error.withOpacity(0.1);
                                    feedbackIcon = Icons.cancel;
                                    feedbackIconColor = AppColors.error;
                                  }
                                } else if (isThisCorrect && !isCorrect) {
                                  // Show correct answer in green
                                  borderColor = AppColors.success;
                                  backgroundColor = AppColors.success.withOpacity(0.05);
                                  feedbackIcon = Icons.check_circle;
                                  feedbackIconColor = AppColors.success;
                                }
                              } else {
                                borderColor = isSelected
                                    ? AppColors.secondary
                                    : theme.colorScheme.onSurface.withOpacity(0.1);
                                backgroundColor = isSelected
                                    ? AppColors.secondary.withOpacity(0.1)
                                    : theme.cardColor;
                              }

                              return Padding(
                                padding: EdgeInsets.only(bottom: 12),
                                child: InkWell(
                                  onTap: _hasAnswered ? null : () => _selectAnswer(option),
                                  borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                                  child: Container(
                                    padding: EdgeInsets.all(AppDimensions.space16),
                                    decoration: BoxDecoration(
                                      color: backgroundColor,
                                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                                      border: Border.all(
                                        color: borderColor ?? theme.colorScheme.onSurface.withOpacity(0.1),
                                        width: showFeedback && isCorrect != null && (isSelected || (isThisCorrect && !isCorrect)) ? 2 : 1,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        if (showFeedback && feedbackIcon != null)
                                          Icon(
                                            feedbackIcon,
                                            color: feedbackIconColor,
                                            size: 24,
                                          )
                                        else
                                          Container(
                                            width: 24,
                                            height: 24,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: isSelected
                                                  ? AppColors.secondary
                                                  : Colors.transparent,
                                              border: Border.all(
                                                color: isSelected
                                                    ? AppColors.secondary
                                                    : AppColors.grey400,
                                                width: 2,
                                              ),
                                            ),
                                            child: isSelected
                                                ? Icon(Icons.check, size: 16, color: Colors.white)
                                                : null,
                                          ),
                                        SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            option,
                                            style: AppTextStyles.bodyMedium.copyWith(
                                              fontWeight: (showFeedback && isCorrect != null && (isSelected || (isThisCorrect && !isCorrect)))
                                                  ? FontWeight.w600
                                                  : FontWeight.normal,
                                              color: showFeedback && isCorrect != null && isThisCorrect && !isCorrect
                                                  ? AppColors.success
                                                  : null,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),

                          // Fill in the Blank input
                          if (questionType == 'fill_blank')
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                TextFormField(
                                  controller: _fillBlankController,
                                  enabled: !_hasAnswered,
                                  decoration: InputDecoration(
                                    hintText: 'quiz.taking.type_answer_here'.tr(),
                                    prefixIcon: Icon(Icons.edit),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                                    ),
                                    filled: true,
                                    fillColor: _hasAnswered && isCorrect != null
                                        ? (isCorrect ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1))
                                        : theme.cardColor,
                                  ),
                                  onFieldSubmitted: (value) {
                                    if (value.trim().isNotEmpty && !_hasAnswered) {
                                      _selectAnswer(value.trim());
                                    }
                                  },
                                ),
                                if (_hasAnswered && isCorrect != null) ...[
                                  SizedBox(height: 16),
                                  Container(
                                    padding: EdgeInsets.all(AppDimensions.space16),
                                    decoration: BoxDecoration(
                                      color: isCorrect
                                          ? AppColors.success.withOpacity(0.1)
                                          : AppColors.error.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                                      border: Border.all(
                                        color: isCorrect ? AppColors.success : AppColors.error,
                                        width: 2,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isCorrect ? Icons.check_circle : Icons.cancel,
                                          color: isCorrect ? AppColors.success : AppColors.error,
                                        ),
                                        SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                isCorrect ? 'quiz.taking.correct_feedback'.tr() : 'quiz.taking.incorrect_feedback'.tr(),
                                                style: AppTextStyles.titleSmall.copyWith(
                                                  fontWeight: FontWeight.bold,
                                                  color: isCorrect ? AppColors.success : AppColors.error,
                                                ),
                                              ),
                                              if (!isCorrect) ...[
                                                SizedBox(height: 4),
                                                Text(
                                                  'quiz.taking.correct_answer'.tr(namedArgs: {'answer': correctAnswer}),
                                                  style: AppTextStyles.bodySmall.copyWith(
                                                    color: AppColors.success,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                                SizedBox(height: 16),
                                if (!_hasAnswered)
                                  PrimaryButton(
                                    text: 'quiz.taking.submit_answer'.tr(),
                                    icon: Icons.check,
                                    onPressed: () {
                                      final answer = _fillBlankController.text.trim();
                                      if (answer.isNotEmpty) {
                                        _selectAnswer(answer);
                                      }
                                    },
                                    gradient: AppColors.secondaryGradient,
                                  ),
                              ],
                            ),

                          // Explanation (if answered and available)
                          if (_hasAnswered && question['explanation'] != null)
                            Container(
                              margin: EdgeInsets.only(top: 16),
                              padding: EdgeInsets.all(AppDimensions.space16),
                              decoration: BoxDecoration(
                                color: AppColors.info.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                                border: Border.all(
                                  color: AppColors.info.withOpacity(0.3),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.info_outline, color: AppColors.info, size: 20),
                                  SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'quiz.taking.explanation'.tr(),
                                          style: AppTextStyles.labelMedium.copyWith(
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.info,
                                          ),
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          question['explanation'] as String,
                                          style: AppTextStyles.bodySmall.copyWith(
                                            color: theme.colorScheme.onSurface,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),

                  // Navigation buttons
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space20),
                    decoration: BoxDecoration(
                      color: theme.scaffoldBackgroundColor,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: Offset(0, -5),
                        ),
                      ],
                    ),
                    child: SafeArea(
                      top: false,
                      child: Row(
                        children: [
                          if (_currentIndex > 0)
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _previousQuestion,
                                icon: Icon(Icons.arrow_back),
                                label: Text('quiz.taking.previous'.tr()),
                                style: OutlinedButton.styleFrom(
                                  padding: EdgeInsets.symmetric(vertical: 16),
                                ),
                              ),
                            ),
                          if (_currentIndex > 0) SizedBox(width: 12),
                          Expanded(
                            child: PrimaryButton(
                              text: _currentIndex == widget.questions.length - 1
                                  ? 'quiz.taking.submit_quiz'.tr()
                                  : 'quiz.taking.next_question'.tr(),
                              icon: _currentIndex == widget.questions.length - 1
                                  ? Icons.check
                                  : Icons.arrow_forward,
                              onPressed: _hasAnswered ? _nextQuestion : null,
                              gradient: AppColors.greenGradient,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
