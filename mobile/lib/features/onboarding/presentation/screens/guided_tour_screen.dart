import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../bloc/post_login_onboarding_cubit.dart';
import '../bloc/post_login_onboarding_state.dart';
import '../widgets/onboarding_progress_banner.dart';
import 'tour_tasks/task_1_deep_research.dart';
import 'tour_tasks/task_2_create_flashcards.dart';
import 'tour_tasks/task_3_scan_problem.dart';
import 'tour_tasks/task_4_take_quiz.dart';

/// Guided tour that shows ONE screen at a time for each task
class GuidedTourScreen extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const GuidedTourScreen({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<GuidedTourScreen> createState() => _GuidedTourScreenState();
}

class _GuidedTourScreenState extends State<GuidedTourScreen> {
  int _currentTaskIndex = 0; // 0 = Task 1, 1 = Task 2, 2 = Task 3, 3 = Task 4

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _showWelcomeDialog();
    });
  }

  void _showWelcomeDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Row(
            children: [
              Icon(Icons.school, color: Color(0xFF10B981), size: 28),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Quick Tour',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Complete these 3 tasks to learn the basics:',
                style: TextStyle(fontSize: 15),
              ),
              const SizedBox(height: 16),
              _TaskListItem(number: '1', text: 'onboarding.tour.task_research'.tr()),
              _TaskListItem(number: '2', text: 'onboarding.tour.task_flashcards'.tr()),
              _TaskListItem(number: '3', text: 'onboarding.tour.task_solve'.tr()),
              _TaskListItem(number: '4', text: 'onboarding.tour.task_quiz'.tr()),
              const SizedBox(height: 16),
              _InfoBox(
                icon: Icons.lightbulb_outline,
                text: 'onboarding.tour.follow_tooltips'.tr(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                widget.onSkip();
              },
              child: Text('onboarding.tour.skip'.tr()),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text('${'onboarding.tour.start'.tr()} →'),
            ),
          ],
        );
      },
    );
  }

  void _onTaskComplete() {
    final cubit = context.read<PostLoginOnboardingCubit>();

    // Mark current task as complete
    switch (_currentTaskIndex) {
      case 0:
        cubit.completeTaskOne();
        break;
      case 1:
        cubit.completeTaskTwo();
        break;
      case 2:
        cubit.completeTaskThree();
        break;
      case 3:
        cubit.completeTaskFour();
        break;
    }

    // Move to next task or complete
    if (_currentTaskIndex < 3) {
      // Wait a bit before switching to ensure smooth transition
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          setState(() {
            _currentTaskIndex++;
          });
        }
      });
    }
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Row(
            children: [
              Icon(Icons.celebration, color: Color(0xFF10B981), size: 32),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Amazing Work!',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'You\'ve completed all the basic tasks! 🎉',
                style: TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              _InfoBox(
                icon: Icons.card_giftcard,
                text: 'onboarding.tour.welcome_offer'.tr(),
                backgroundColor: const Color(0xFF10B981),
                iconColor: Colors.white,
                textColor: Colors.white,
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                widget.onComplete();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text('${'onboarding.tour.continue_tour'.tr()} →'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<PostLoginOnboardingCubit, PostLoginOnboardingState>(
      listener: (context, state) {
        if (state.allTasksComplete && state.canProceedToOffer) {
          _showCompletionDialog();
        }
      },
      child: BlocBuilder<PostLoginOnboardingCubit, PostLoginOnboardingState>(
        builder: (context, state) {
          return Scaffold(
            body: Stack(
              children: [
                // Show ONLY the current task screen
                _buildCurrentTaskScreen(),

                // Progress Banner at top
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: SafeArea(
                    child: OnboardingProgressBanner(
                      currentTask: state.completedTaskCount + 1,
                      totalTasks: 4,
                      taskOneComplete: state.taskOneComplete,
                      taskTwoComplete: state.taskTwoComplete,
                      taskThreeComplete: state.taskThreeComplete,
                      taskFourComplete: state.taskFourComplete,
                      onSkip: widget.onSkip,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCurrentTaskScreen() {
    switch (_currentTaskIndex) {
      case 0:
        return Task1DeepResearch(
          key: const ValueKey('task1'),
          onComplete: _onTaskComplete,
          onSkip: widget.onSkip,
        );
      case 1:
        return Task2CreateFlashcards(
          key: const ValueKey('task2'),
          onComplete: _onTaskComplete,
          onSkip: widget.onSkip,
        );
      case 2:
        return Task3ScanProblem(
          key: const ValueKey('task3'),
          onComplete: _onTaskComplete,
          onSkip: widget.onSkip,
        );
      case 3:
        return Task4TakeQuiz(
          key: const ValueKey('task4'),
          onComplete: _onTaskComplete,
          onSkip: widget.onSkip,
        );
      default:
        return Task1DeepResearch(
          onComplete: _onTaskComplete,
          onSkip: widget.onSkip,
        );
    }
  }
}

// Helper widgets
class _TaskListItem extends StatelessWidget {
  final String number;
  final String text;

  const _TaskListItem({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(
              color: Color(0xFFE5E7EB),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? backgroundColor;
  final Color? iconColor;
  final Color? textColor;

  const _InfoBox({
    required this.icon,
    required this.text,
    this.backgroundColor,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: backgroundColor ?? const Color(0xFF10B981).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor ?? const Color(0xFF10B981), size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: textColor ?? const Color(0xFF10B981),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
