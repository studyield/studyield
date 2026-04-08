import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/buttons/primary_button.dart';

/// Task 4: Take Quiz - Shows ONLY a simple quiz screen
class Task4TakeQuiz extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const Task4TakeQuiz({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<Task4TakeQuiz> createState() => _Task4TakeQuizState();
}

class _Task4TakeQuizState extends State<Task4TakeQuiz> {
  late TutorialCoachMark tutorialCoachMark;
  final GlobalKey _questionKey = GlobalKey();
  final GlobalKey _submitButtonKey = GlobalKey();

  int? _selectedAnswer;
  bool _hasAnswered = false;

  final _sampleQuestion = {
    'question': 'What is the capital of France?',
    'options': ['London', 'Paris', 'Berlin', 'Madrid'],
    'correctAnswer': 1, // Paris
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) _showTutorial();
      });
    });
  }

  void _showTutorial() {
    if (!mounted) return;

    tutorialCoachMark = TutorialCoachMark(
      targets: _createTargets(),
      colorShadow: Colors.black,
      paddingFocus: 10,
      opacityShadow: 0.9,
      onSkip: () {
        widget.onSkip();
        return true;
      },
    );

    tutorialCoachMark.show(context: context);
  }

  List<TargetFocus> _createTargets() {
    return [
      TargetFocus(
        identify: "question",
        keyTarget: _questionKey,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: ContentAlign.bottom,
            padding: const EdgeInsets.all(16),
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.quiz,
                iconColor: const Color(0xFF8B5CF6),
                title: '1️⃣ ${'onboarding.tour.step_read_select'.tr()}',
                description: 'Read the question carefully and tap your answer choice below.\n\nTest your knowledge! 🧠',
                buttonText: 'Next →',
                onPressed: () => controller.next(),
              );
            },
          ),
        ],
      ),
      TargetFocus(
        identify: "submitButton",
        keyTarget: _submitButtonKey,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: ContentAlign.top,
            padding: const EdgeInsets.all(16),
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.check_circle,
                iconColor: const Color(0xFF8B5CF6),
                title: '2️⃣ ${'onboarding.tour.step_submit_learn'.tr()}',
                description: 'After selecting, tap here to submit!\n\nGet instant feedback with explanations. 📊',
                buttonText: 'Got it!',
                onPressed: () => controller.next(),
              );
            },
          ),
        ],
      ),
    ];
  }

  Widget _buildTooltip({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String description,
    required String buttonText,
    required VoidCallback onPressed,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: iconColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 22,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.black54,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: iconColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                buttonText,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handleSubmit() {
    if (_selectedAnswer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('onboarding.tour.please_select_answer'.tr())),
      );
      return;
    }

    setState(() {
      _hasAnswered = true;
    });

    // Show result
    final isCorrect = _selectedAnswer == _sampleQuestion['correctAnswer'];
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isCorrect ? '✅ Correct! Great job!' : '❌ Not quite. The answer is Paris',
        ),
        backgroundColor: isCorrect ? const Color(0xFF10B981) : AppColors.error,
        duration: const Duration(seconds: 2),
      ),
    );

    // Complete task after showing result
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) {
        widget.onComplete();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final options = _sampleQuestion['options'] as List<String>;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('onboarding.tour.practice_quiz'.tr()),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: widget.onSkip,
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Task instruction banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.quiz, color: Colors.white, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Task 3: Take Quiz',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Test your knowledge with practice questions',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Progress indicator
              Row(
                children: [
                  const Text(
                    'Question 1 of 1',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.grey600,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.timer, size: 16, color: Color(0xFF8B5CF6)),
                        SizedBox(width: 4),
                        Text(
                          'Practice',
                          style: TextStyle(
                            color: Color(0xFF8B5CF6),
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

              // Question card (with tooltip target)
              Container(
                key: _questionKey,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF8B5CF6).withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: Text(
                  _sampleQuestion['question'] as String,
                  style: AppTextStyles.titleLarge.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 18,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Answer options
              ...List.generate(options.length, (index) {
                final isSelected = _selectedAnswer == index;
                final isCorrect = index == _sampleQuestion['correctAnswer'];
                final showResult = _hasAnswered;

                Color borderColor = AppColors.grey300;
                Color? backgroundColor;

                if (showResult) {
                  if (index == _sampleQuestion['correctAnswer']) {
                    borderColor = const Color(0xFF10B981);
                    backgroundColor = const Color(0xFF10B981).withOpacity(0.1);
                  } else if (isSelected) {
                    borderColor = AppColors.error;
                    backgroundColor = AppColors.error.withOpacity(0.1);
                  }
                } else if (isSelected) {
                  borderColor = const Color(0xFF8B5CF6);
                  backgroundColor = const Color(0xFF8B5CF6).withOpacity(0.1);
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    onTap: _hasAnswered
                        ? null
                        : () {
                            setState(() {
                              _selectedAnswer = index;
                            });
                          },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: backgroundColor ?? Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor, width: 2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: borderColor,
                                width: 2,
                              ),
                              color: isSelected && !showResult
                                  ? const Color(0xFF8B5CF6)
                                  : null,
                            ),
                            child: showResult && isCorrect
                                ? const Icon(
                                    Icons.check,
                                    size: 18,
                                    color: Color(0xFF10B981),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              options[index],
                              style: AppTextStyles.bodyLarge.copyWith(
                                fontWeight: isSelected ? FontWeight.w600 : null,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: 32),

              // Submit button (with tooltip target)
              Container(
                key: _submitButtonKey,
                child: PrimaryButton(
                  text: _hasAnswered ? 'Answered!' : 'Submit Answer',
                  onPressed: _hasAnswered ? null : _handleSubmit,
                  width: double.infinity,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                  ),
                  icon: _hasAnswered ? Icons.check_circle : Icons.send,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
