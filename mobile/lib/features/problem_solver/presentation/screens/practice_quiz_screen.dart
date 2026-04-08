import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/quiz_question_entity.dart';
import '../../domain/entities/similar_problem_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';

class PracticeQuizScreen extends StatefulWidget {
  final String sessionId;

  const PracticeQuizScreen({super.key, required this.sessionId});

  @override
  State<PracticeQuizScreen> createState() => _PracticeQuizScreenState();
}

class _PracticeQuizScreenState extends State<PracticeQuizScreen> with SingleTickerProviderStateMixin {
  List<QuizQuestionEntity> _questions = [];
  int _currentIndex = 0;
  bool _showResult = false;
  String? _selectedAnswer;
  bool _isSubmitting = false;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    context.read<ProblemSolverBloc>().add(LoadPracticeQuiz(sessionId: widget.sessionId));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _submitAnswer(String answer) {
    if (_showResult || _isSubmitting) return;

    setState(() {
      _selectedAnswer = answer;
      _isSubmitting = true;
    });

    final question = _questions[_currentIndex];
    context.read<ProblemSolverBloc>().add(
          SubmitQuizAnswer(questionId: question.id, answer: answer),
        );
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _showResult = false;
        _selectedAnswer = null;
        _isSubmitting = false;
      });
      _animationController.forward(from: 0);
    } else {
      _showFinalResults();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(_questions.isNotEmpty ? 'problem_solver.practice_quiz.title_with_progress'.tr(namedArgs: {'current': (_currentIndex + 1).toString(), 'total': _questions.length.toString()}) : 'problem_solver.practice_quiz.title'.tr()),
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is PracticeQuizLoaded) {
            setState(() {
              _questions = state.questions;
              _currentIndex = 0;
              _showResult = false;
              _selectedAnswer = null;
              _isSubmitting = false;
            });
            _animationController.forward(from: 0);
          } else if (state is QuizAnswerSubmitted) {
            setState(() {
              // Update the current question with the answer result
              _questions[_currentIndex] = _questions[_currentIndex].copyWith(
                userAnswer: state.userAnswer,
                isCorrect: state.isCorrect,
                answeredAt: DateTime.now(),
              );
              _showResult = true;
              _isSubmitting = false;
            });
          } else if (state is ProblemSolverError) {
            setState(() => _isSubmitting = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: _questions.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _buildQuizQuestion(),
      ),
    );
  }

  Widget _buildQuizQuestion() {
    final q = _questions[_currentIndex];
    final answered = _questions.where((q) => q.isCorrect != null).length;
    final correct = _questions.where((q) => q.isCorrect == true).length;

    return Column(
      children: [
        // Progress Bar
        Container(
          height: 6,
          color: Colors.white,
          child: LinearProgressIndicator(
            value: answered / _questions.length,
            backgroundColor: AppColors.grey200,
            valueColor: const AlwaysStoppedAnimation(Color(0xFF9333EA)),
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: FadeTransition(
              opacity: _animationController,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Stats Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF9333EA).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Question ${_currentIndex + 1}/${_questions.length}',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: const Color(0xFF9333EA),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.green, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              'problem_solver.practice_quiz.stats.correct'.tr(namedArgs: {'count': correct.toString()}),
                              style: const TextStyle(
                                color: Colors.green,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Question Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF9333EA).withOpacity(0.1),
                          const Color(0xFF7C3AED).withOpacity(0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF9333EA).withOpacity(0.2),
                        width: 2,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF9333EA),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.quiz,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              q.questionType == 'mcq'
                                  ? 'problem_solver.practice_quiz.question_types.multiple_choice'.tr()
                                  : q.questionType == 'true_false'
                                      ? 'problem_solver.practice_quiz.question_types.true_false'.tr()
                                      : 'problem_solver.practice_quiz.question_types.fill_blank'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: const Color(0xFF9333EA),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Text(
                          q.question,
                          style: AppTextStyles.titleMedium.copyWith(
                            height: 1.6,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Options
                  ...q.options.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final option = entry.value;
                    final isCorrect = option == q.correctAnswer;
                    final isSelected = option == _selectedAnswer || option == q.userAnswer;
                    final showFeedback = _showResult;

                    Color? bgColor;
                    Color? borderColor;
                    Color? textColor;

                    if (showFeedback) {
                      if (isCorrect) {
                        bgColor = const Color(0xFFDCFCE7); // Light green
                        borderColor = Colors.green;
                        textColor = Colors.green.shade800;
                      } else if (isSelected) {
                        bgColor = const Color(0xFFFFEBEE); // Light red
                        borderColor = Colors.red;
                        textColor = Colors.red.shade800;
                      }
                    } else if (isSelected) {
                      bgColor = const Color(0xFF9333EA).withOpacity(0.1);
                      borderColor = const Color(0xFF9333EA);
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: showFeedback ? null : () => _submitAnswer(option),
                          borderRadius: BorderRadius.circular(16),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: bgColor ?? Colors.white,
                              border: Border.all(
                                color: borderColor ?? AppColors.grey300,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: isSelected && !showFeedback
                                  ? [
                                      BoxShadow(
                                        color: const Color(0xFF9333EA).withOpacity(0.2),
                                        blurRadius: 8,
                                        offset: const Offset(0, 4),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: showFeedback
                                        ? (isCorrect
                                            ? Colors.green
                                            : isSelected
                                                ? Colors.red
                                                : AppColors.grey300)
                                        : (isSelected
                                            ? const Color(0xFF9333EA)
                                            : Colors.white),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: showFeedback
                                          ? (isCorrect ? Colors.green : isSelected ? Colors.red : AppColors.grey300)
                                          : AppColors.grey300,
                                      width: 2,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      String.fromCharCode(65 + idx),
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: (showFeedback && (isCorrect || isSelected)) || (!showFeedback && isSelected)
                                            ? Colors.white
                                            : AppColors.grey600,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Text(
                                    option,
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      color: textColor,
                                      fontWeight: (showFeedback && isCorrect) || isSelected
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ),
                                if (showFeedback && isCorrect)
                                  const Icon(Icons.check_circle, color: Colors.green, size: 24),
                                if (showFeedback && isSelected && !isCorrect)
                                  const Icon(Icons.cancel, color: Colors.red, size: 24),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),

                  // Result Banner (when answer is submitted)
                  if (_showResult) ...[
                    const SizedBox(height: 20),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: q.isCorrect == true
                              ? [const Color(0xFFDCFCE7), const Color(0xFFBBF7D0)]
                              : [const Color(0xFFFFEBEE), const Color(0xFFFFCDD2)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: q.isCorrect == true ? Colors.green : Colors.red,
                          width: 2,
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Icon(
                                q.isCorrect == true ? Icons.check_circle : Icons.cancel,
                                color: q.isCorrect == true ? Colors.green.shade700 : Colors.red.shade700,
                                size: 32,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      q.isCorrect == true ? 'problem_solver.practice_quiz.feedback.correct'.tr() : 'problem_solver.practice_quiz.feedback.incorrect'.tr(),
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: q.isCorrect == true ? Colors.green.shade700 : Colors.red.shade700,
                                      ),
                                    ),
                                    if (q.isCorrect == false && q.correctAnswer != null) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        'Correct answer: ${q.correctAnswer}',
                                        style: AppTextStyles.bodySmall.copyWith(
                                          color: Colors.red.shade700,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (q.explanation.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.lightbulb_outline,
                                        color: Colors.amber.shade700,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'problem_solver.practice_quiz.feedback.explanation'.tr(),
                                        style: TextStyle(
                                          color: Colors.amber.shade700,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    q.explanation,
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      height: 1.6,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Next button (when result is shown)
                  if (_showResult)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _nextQuestion,
                        icon: Icon(
                          _currentIndex < _questions.length - 1
                              ? Icons.arrow_forward
                              : Icons.emoji_events,
                        ),
                        label: Text(
                          _currentIndex < _questions.length - 1
                              ? 'problem_solver.practice_quiz.actions.next_question'.tr()
                              : 'problem_solver.practice_quiz.actions.view_results'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF9333EA),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),
              ],
            ),
          ),
        ),
      ),
    ],

    );
  }

  void _showFinalResults() {
    final correct = _questions.where((q) => q.isCorrect == true).length;
    final score = ((correct / _questions.length) * 100).round();
    final isPerfect = score == 100;
    final isGreat = score >= 80;
    final isGood = score >= 60;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isPerfect
                  ? [const Color(0xFFFFD700).withOpacity(0.2), const Color(0xFFFFA500).withOpacity(0.1)]
                  : isGreat
                      ? [const Color(0xFFDCFCE7), const Color(0xFFBBF7D0)]
                      : isGood
                          ? [const Color(0xFFDEEDFF), const Color(0xFFBFDBFE)]
                          : [const Color(0xFFFFEBEE), const Color(0xFFFFCDD2)],
            ),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Trophy/Icon
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isPerfect
                      ? const Color(0xFFFFD700)
                      : isGreat
                          ? Colors.green
                          : isGood
                              ? Colors.blue
                              : Colors.orange,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: (isPerfect
                              ? const Color(0xFFFFD700)
                              : isGreat
                                  ? Colors.green
                                  : Colors.blue)
                          .withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(
                  isPerfect ? Icons.emoji_events : isGreat ? Icons.star : Icons.thumb_up,
                  size: 48,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                isPerfect
                    ? 'problem_solver.practice_quiz.results.perfect'.tr()
                    : isGreat
                        ? 'problem_solver.practice_quiz.results.great'.tr()
                        : isGood
                            ? 'problem_solver.practice_quiz.results.good'.tr()
                            : 'problem_solver.practice_quiz.results.practice'.tr(),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'problem_solver.practice_quiz.results.quiz_complete'.tr(),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.grey600,
                ),
              ),
              const SizedBox(height: 24),

              // Score Circle
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isPerfect
                        ? const Color(0xFFFFD700)
                        : isGreat
                            ? Colors.green
                            : isGood
                                ? Colors.blue
                                : Colors.orange,
                    width: 6,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$score%',
                        style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: isPerfect
                              ? const Color(0xFFFFD700)
                              : isGreat
                                  ? Colors.green
                                  : isGood
                                      ? Colors.blue
                                      : Colors.orange,
                        ),
                      ),
                      Text(
                        '$correct/${_questions.length}',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.grey600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.close),
                      label: Text('problem_solver.practice_quiz.results.close'.tr()),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        setState(() {
                          _currentIndex = 0;
                          _showResult = false;
                          _selectedAnswer = null;
                          _isSubmitting = false;
                        });
                        context.read<ProblemSolverBloc>().add(
                              LoadPracticeQuiz(sessionId: widget.sessionId),
                            );
                      },
                      icon: const Icon(Icons.refresh),
                      label: Text('problem_solver.practice_quiz.results.try_again'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF9333EA),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getDifficultyColor(Difficulty difficulty) {
    switch (difficulty) {
      case Difficulty.easy:
        return Colors.green;
      case Difficulty.medium:
        return Colors.amber;
      case Difficulty.hard:
        return Colors.red;
    }
  }
}
