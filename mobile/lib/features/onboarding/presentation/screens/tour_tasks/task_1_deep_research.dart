import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/buttons/primary_button.dart';
import 'dart:async';

/// Task 1: Deep Research - Shows the research feature with impressive demo
class Task1DeepResearch extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const Task1DeepResearch({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<Task1DeepResearch> createState() => _Task1DeepResearchState();
}

class _Task1DeepResearchState extends State<Task1DeepResearch> {
  final _topicController = TextEditingController();

  late TutorialCoachMark tutorialCoachMark;
  final GlobalKey _topicFieldKey = GlobalKey();
  final GlobalKey _researchButtonKey = GlobalKey();

  bool _isResearching = false;
  bool _showResults = false;
  String _currentText = '';
  int _charIndex = 0;
  Timer? _typingTimer;

  final String _demoResearch = '''🔬 Deep Research Report: Quantum Computing

📌 Overview
Quantum computing harnesses quantum mechanics principles to process information exponentially faster than classical computers for specific problems.

🔑 Key Concepts
• Qubits: Unlike classical bits (0 or 1), qubits exist in superposition
• Entanglement: Qubits can be correlated in ways impossible classically
• Quantum Gates: Operations that manipulate qubit states

💡 Applications
✓ Cryptography & Security
✓ Drug Discovery & Molecular Modeling
✓ Financial Optimization
✓ Artificial Intelligence

⚡ Current Leaders
IBM, Google, Microsoft, and IonQ are racing to achieve quantum advantage.

🎯 Challenges
- Decoherence (qubits losing their quantum state)
- Error correction requirements
- Extreme cooling needs (-273°C)

📊 Market Impact
Expected to reach \$65B by 2030, revolutionizing computing paradigms.''';

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
    // Ensure widgets are laid out before showing tutorial
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
        identify: "topicField",
        keyTarget: _topicFieldKey,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: ContentAlign.bottom,
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.science,
                iconColor: const Color(0xFF3B82F6),
                title: '1️⃣ ${'onboarding.tour.step_enter_topic'.tr()}',
                description: 'AI will research any topic in depth.\nWe\'ve added "Quantum Computing" for you!',
                buttonText: 'Next →',
                onPressed: () => controller.next(),
              );
            },
          ),
        ],
      ),
      TargetFocus(
        identify: "researchButton",
        keyTarget: _researchButtonKey,
        shape: ShapeLightFocus.RRect,
        radius: 16,
        contents: [
          TargetContent(
            align: ContentAlign.top,
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.auto_awesome,
                iconColor: const Color(0xFF3B82F6),
                title: '2️⃣ ${'onboarding.tour.step_start_research'.tr()}',
                description: 'Watch AI analyze multiple sources and create a comprehensive report in seconds!',
                buttonText: 'Let\'s Go! 🚀',
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
      margin: const EdgeInsets.all(16),
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
          // Icon
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(height: 16),

          // Title
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 22,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),

          // Description
          Text(
            description,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.black54,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),

          // Button
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

  void _startResearch() {
    setState(() {
      _isResearching = true;
      _showResults = false;
      _currentText = '';
      _charIndex = 0;
    });

    // Simulate research delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isResearching = false;
          _showResults = true;
        });
        _startTypingEffect();
      }
    });
  }

  void _startTypingEffect() {
    _typingTimer = Timer.periodic(const Duration(milliseconds: 20), (timer) {
      if (_charIndex < _demoResearch.length) {
        setState(() {
          _currentText = _demoResearch.substring(0, _charIndex + 1);
          _charIndex++;
        });
      } else {
        timer.cancel();
        // Complete task after typing finishes
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
    _topicController.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('onboarding.tour.deep_research'.tr()),
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
                    colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.science, color: Colors.white, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Task 1: Deep Research',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'AI researches any topic comprehensively',
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

              // Topic input field
              Text(
                'Research Topic',
                style: AppTextStyles.labelLarge.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                key: _topicFieldKey,
                controller: _topicController,
                enabled: !_isResearching && !_showResults,
                decoration: InputDecoration(
                  hintText: 'onboarding.tour.hint_research_topic'.tr(),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF3B82F6)),
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
                      color: Color(0xFF3B82F6),
                      width: 2,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Research button
              PrimaryButton(
                key: _researchButtonKey,
                text: _isResearching ? 'Researching...' : 'Start Deep Research',
                onPressed: (_isResearching || _showResults) ? null : _startResearch,
                isLoading: _isResearching,
                width: double.infinity,
                gradient: const LinearGradient(
                  colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                ),
                icon: Icons.auto_awesome,
              ),

              if (_showResults) ...[
                const SizedBox(height: 32),

                // Results container
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFF3B82F6).withOpacity(0.3),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3B82F6).withOpacity(0.1),
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
                              color: const Color(0xFF3B82F6).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.lightbulb,
                              color: Color(0xFF3B82F6),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Text(
                              'AI Research Results',
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
