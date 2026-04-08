import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/buttons/primary_button.dart';
import 'dart:async';

/// Task 2: Create AI Flashcards - Shows AI-powered flashcard generation
class Task2CreateFlashcards extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const Task2CreateFlashcards({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<Task2CreateFlashcards> createState() => _Task2CreateFlashcardsState();
}

class _Task2CreateFlashcardsState extends State<Task2CreateFlashcards> {
  final _topicController = TextEditingController();

  late TutorialCoachMark tutorialCoachMark;
  final GlobalKey _topicFieldKey = GlobalKey();
  final GlobalKey _generateButtonKey = GlobalKey();

  bool _isGenerating = false;
  bool _showFlashcards = false;
  int _currentCardIndex = 0;

  final List<Map<String, String>> _demoFlashcards = [
    {
      'front': 'What is the largest planet in our solar system?',
      'back': 'Jupiter\n\nIt\'s more than twice as massive as all other planets combined and has 79 known moons.'
    },
    {
      'front': 'Which planet is known as the Red Planet?',
      'back': 'Mars\n\nIts reddish appearance is due to iron oxide (rust) on its surface.'
    },
    {
      'front': 'How many planets are in our solar system?',
      'back': '8 Planets\n\nMercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.'
    },
  ];

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
        identify: "topicField",
        keyTarget: _topicFieldKey,
        shape: ShapeLightFocus.RRect,
        radius: 12,
        contents: [
          TargetContent(
            align: ContentAlign.bottom,
            padding: const EdgeInsets.all(16),
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.lightbulb_outline,
                iconColor: const Color(0xFF10B981),
                title: '1️⃣ ${'onboarding.tour.step_enter_topic'.tr()}',
                description: 'AI will generate flashcards for any subject!\n\nTry: "History", "Biology", "Math formulas"',
                buttonText: 'Next →',
                onPressed: () => controller.next(),
              );
            },
          ),
        ],
      ),
      TargetFocus(
        identify: "generateButton",
        keyTarget: _generateButtonKey,
        shape: ShapeLightFocus.RRect,
        radius: 12,
        contents: [
          TargetContent(
            align: ContentAlign.top,
            padding: const EdgeInsets.all(16),
            builder: (context, controller) {
              return _buildTooltip(
                icon: Icons.auto_awesome,
                iconColor: const Color(0xFF10B981),
                title: '2️⃣ ${'onboarding.tour.step_generate_ai'.tr()}',
                description: 'Watch AI create perfect study flashcards instantly!\n\nEach card has a question and detailed answer.',
                buttonText: 'Generate! ✨',
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

  void _generateFlashcards() {
    setState(() {
      _isGenerating = true;
      _showFlashcards = false;
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isGenerating = false;
          _showFlashcards = true;
        });
      }
    });
  }

  void _nextCard() {
    if (_currentCardIndex < _demoFlashcards.length - 1) {
      setState(() {
        _currentCardIndex++;
      });
    } else {
      // Completed all cards
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          widget.onComplete();
        }
      });
    }
  }

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('onboarding.tour.ai_flashcard_generator'.tr()),
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
              // Task banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.style, color: Colors.white, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Task 1: AI Flashcards',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Generate smart flashcards instantly',
                            style: TextStyle(color: Colors.white, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Topic input
              Text(
                'What do you want to study?',
                style: AppTextStyles.labelLarge.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                key: _topicFieldKey,
                child: TextFormField(
                  controller: _topicController,
                  enabled: !_isGenerating && !_showFlashcards,
                  decoration: InputDecoration(
                    hintText: 'onboarding.tour.hint_flashcard_topic'.tr(),
                    prefixIcon: const Icon(Icons.book, color: Color(0xFF10B981)),
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
                        color: Color(0xFF10B981),
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Generate button
              Container(
                key: _generateButtonKey,
                child: PrimaryButton(
                  text: _isGenerating ? 'Generating...' : 'Generate Flashcards',
                  onPressed: (_isGenerating || _showFlashcards) ? null : _generateFlashcards,
                  isLoading: _isGenerating,
                  width: double.infinity,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                  ),
                  icon: Icons.auto_awesome,
                ),
              ),

              if (_showFlashcards) ...[
                const SizedBox(height: 32),

                // Flashcard counter
                Center(
                  child: Text(
                    'Card ${_currentCardIndex + 1} of ${_demoFlashcards.length}',
                    style: AppTextStyles.labelLarge.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Flashcard
                _FlipCard(
                  front: _demoFlashcards[_currentCardIndex]['front']!,
                  back: _demoFlashcards[_currentCardIndex]['back']!,
                ),

                const SizedBox(height: 24),

                // Next button
                PrimaryButton(
                  text: _currentCardIndex < _demoFlashcards.length - 1
                      ? 'Next Card →'
                      : 'Finish! 🎉',
                  onPressed: _nextCard,
                  width: double.infinity,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
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

class _FlipCard extends StatefulWidget {
  final String front;
  final String back;

  const _FlipCard({required this.front, required this.back});

  @override
  State<_FlipCard> createState() => _FlipCardState();
}

class _FlipCardState extends State<_FlipCard> {
  bool _showBack = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _showBack = !_showBack;
        });
      },
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: Container(
          key: ValueKey(_showBack),
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: _showBack
                  ? [const Color(0xFF059669), const Color(0xFF10B981)]
                  : [const Color(0xFF10B981), const Color(0xFF059669)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(
                _showBack ? Icons.lightbulb : Icons.help_outline,
                color: Colors.white,
                size: 32,
              ),
              const SizedBox(height: 16),
              Text(
                _showBack ? 'Answer' : 'Question',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _showBack ? widget.back : widget.front,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.touch_app, color: Colors.white, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'Tap to flip',
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
      ),
    );
  }
}
