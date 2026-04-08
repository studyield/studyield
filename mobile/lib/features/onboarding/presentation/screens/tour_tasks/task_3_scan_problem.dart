import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/buttons/primary_button.dart';
import 'dart:async';

/// Task 3: Scan Problem - Shows the problem solver with impressive demo
class Task3ScanProblem extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const Task3ScanProblem({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<Task3ScanProblem> createState() => _Task3ScanProblemState();
}

class _Task3ScanProblemState extends State<Task3ScanProblem> {
  final _problemController = TextEditingController();

  late TutorialCoachMark tutorialCoachMark;
  final GlobalKey _problemFieldKey = GlobalKey();
  final GlobalKey _solveButtonKey = GlobalKey();

  bool _isSolving = false;
  bool _showSolution = false;
  String _currentText = '';
  int _charIndex = 0;
  Timer? _typingTimer;

  final String _demoSolution = '''✨ AI Solution

📝 Problem: 2x + 5 = 15

🎯 Step-by-Step Solution:

Step 1: Subtract 5 from both sides
2x + 5 - 5 = 15 - 5
2x = 10

Step 2: Divide both sides by 2
2x ÷ 2 = 10 ÷ 2
x = 5

✅ Answer: x = 5

🔍 Verification:
2(5) + 5 = 10 + 5 = 15 ✓

💡 Concept: Linear Equations
This is a one-variable linear equation. Always perform the same operation on both sides to maintain equality!''';

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
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
    });
  }

  List<TargetFocus> _createTargets() {
    return [
      TargetFocus(
        identify: "problemField",
        keyTarget: _problemFieldKey,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: ContentAlign.bottom,
            padding: const EdgeInsets.all(16),
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.calculate,
                iconColor: const Color(0xFFF59E0B),
                title: '1️⃣ ${'onboarding.tour.step_enter_problem'.tr()}',
                description: 'Type, paste, or scan with camera.\nWorks with math, physics, chemistry & more!\n\nWe\'ve added a sample for you.',
                buttonText: 'Next →',
                onPressed: () => controller.next(),
              );
            },
          ),
        ],
      ),
      TargetFocus(
        identify: "solveButton",
        keyTarget: _solveButtonKey,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: ContentAlign.top,
            padding: const EdgeInsets.all(16),
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.auto_awesome,
                iconColor: const Color(0xFFF59E0B),
                title: '2️⃣ ${'onboarding.tour.step_get_solution'.tr()}',
                description: 'AI analyzes and provides step-by-step solutions with explanations!\n\nLet\'s solve it now! 🚀',
                buttonText: 'Solve It!',
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

  void _solveProblem() {
    setState(() {
      _isSolving = true;
      _showSolution = false;
      _currentText = '';
      _charIndex = 0;
    });

    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() {
          _isSolving = false;
          _showSolution = true;
        });
        _startTypingEffect();
      }
    });
  }

  void _startTypingEffect() {
    _typingTimer = Timer.periodic(const Duration(milliseconds: 15), (timer) {
      if (_charIndex < _demoSolution.length) {
        setState(() {
          _currentText = _demoSolution.substring(0, _charIndex + 1);
          _charIndex++;
        });
      } else {
        timer.cancel();
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            widget.onComplete();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _problemController.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('onboarding.tour.ai_problem_solver'.tr()),
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
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.camera_alt, color: Colors.white, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Task 2: AI Problem Solver',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Instant step-by-step solutions',
                            style: TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              Text(
                'Enter Problem',
                style: AppTextStyles.labelLarge.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                key: _problemFieldKey,
                child: TextFormField(
                controller: _problemController,
                enabled: !_isSolving && !_showSolution,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'onboarding.tour.hint_problem'.tr(),
                  prefixIcon: const Padding(
                    padding: EdgeInsets.only(top: 12),
                    child: Icon(Icons.edit, color: Color(0xFFF59E0B)),
                  ),
                  filled: true,
                  fillColor: Theme.of(context).cardColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.grey300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.grey300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(
                      color: Color(0xFFF59E0B),
                      width: 2,
                    ),
                  ),
                ),
                ),
              ),

              const SizedBox(height: 40),

              Container(
                key: _solveButtonKey,
                child: PrimaryButton(
                text: _isSolving ? 'Solving...' : 'Solve with AI',
                onPressed: (_isSolving || _showSolution) ? null : _solveProblem,
                isLoading: _isSolving,
                width: double.infinity,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  ),
                  icon: Icons.auto_awesome,
                ),
              ),

              if (_showSolution) ...[
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFF59E0B).withOpacity(0.3),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFF59E0B).withOpacity(0.1),
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
                              color: const Color(0xFFF59E0B).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.check_circle,
                              color: Color(0xFFF59E0B),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'Solution',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      SelectableText(
                        _currentText,
                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.6,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
