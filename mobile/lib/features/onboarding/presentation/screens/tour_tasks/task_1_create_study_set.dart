import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:tutorial_coach_mark/tutorial_coach_mark.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/buttons/primary_button.dart';
import '../../../../study_sets/presentation/bloc/study_sets_bloc.dart';
import '../../../../study_sets/presentation/bloc/study_sets_event.dart';
import '../../../../study_sets/presentation/bloc/study_sets_state.dart';

/// Task 1: Create Study Set - Shows ONLY the study set creation form
class Task1CreateStudySet extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const Task1CreateStudySet({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  State<Task1CreateStudySet> createState() => _Task1CreateStudySetState();
}

class _Task1CreateStudySetState extends State<Task1CreateStudySet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;

  late TutorialCoachMark tutorialCoachMark;
  final GlobalKey _titleFieldKey = GlobalKey();
  final GlobalKey _saveButtonKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: 'onboarding.tour.sample_set_title'.tr());
    _descriptionController = TextEditingController(text: 'onboarding.tour.sample_set_desc'.tr());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) _showTutorial();
      });
    });
  }

  void _showTutorial() {
    tutorialCoachMark = TutorialCoachMark(
      targets: _createTargets(),
      colorShadow: const Color(0xFF10B981),
      paddingFocus: 10,
      opacityShadow: 0.8,
      onFinish: () {
        // Tutorial finished, user can now interact
      },
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
        identify: "titleField",
        keyTarget: _titleFieldKey,
        alignSkip: Alignment.topRight,
        contents: [
          TargetContent(
            align: ContentAlign.bottom,
            builder: (context, controller) {
              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '1️⃣ Study Set Title',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        color: Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Enter a name for your study set.\nWe\'ve filled it in for you!',
                      style: TextStyle(fontSize: 15),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        controller.next();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                      ),
                      child: Text('${'onboarding.tour.next'.tr()} →'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      TargetFocus(
        identify: "saveButton",
        keyTarget: _saveButtonKey,
        alignSkip: Alignment.topRight,
        contents: [
          TargetContent(
            align: ContentAlign.top,
            builder: (context, controller) {
              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '2️⃣ Create Your Study Set',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        color: Color(0xFF10B981),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Tap this button to create your first study set!',
                      style: TextStyle(fontSize: 15),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        controller.next();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                      ),
                      child: Text('onboarding.tour.got_it'.tr()),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    ];
  }

  void _handleCreate() {
    if (_formKey.currentState!.validate()) {
      context.read<StudySetsBloc>().add(
            CreateStudySet(
              title: _titleController.text.trim(),
              description: _descriptionController.text.trim(),
              tags: ['onboarding'],
              isPublic: false,
            ),
          );
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<StudySetsBloc, StudySetsState>(
      listener: (context, state) {
        if (state is StudySetCreated) {
          // Study set created successfully!
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('onboarding.tour.study_set_created'.tr()),
              backgroundColor: const Color(0xFF10B981),
              duration: const Duration(seconds: 2),
            ),
          );

          // Complete task after a short delay
          Future.delayed(const Duration(milliseconds: 800), () {
            if (mounted) {
              widget.onComplete();
            }
          });
        } else if (state is StudySetsError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          title: Text('onboarding.tour.create_study_set'.tr()),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: widget.onSkip,
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Task instruction banner
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
                        Icon(Icons.task_alt, color: Colors.white, size: 28),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Task 1: Create Study Set',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Fill in the details and create your first study set',
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

                  // Title field (with tooltip target)
                  Text(
                    'Title *',
                    style: AppTextStyles.labelLarge.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    key: _titleFieldKey,
                    controller: _titleController,
                    decoration: InputDecoration(
                      hintText: 'onboarding.tour.hint_set_name'.tr(),
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
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a title';
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 24),

                  // Description field
                  Text(
                    'Description (Optional)',
                    style: AppTextStyles.labelLarge.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'onboarding.tour.hint_set_desc'.tr(),
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

                  const SizedBox(height: 40),

                  // Create button (with tooltip target)
                  BlocBuilder<StudySetsBloc, StudySetsState>(
                    builder: (context, state) {
                      final isLoading = state is StudySetsLoading;
                      return PrimaryButton(
                        key: _saveButtonKey,
                        text: isLoading ? 'Creating...' : 'onboarding.tour.create_study_set'.tr(),
                        onPressed: isLoading ? null : _handleCreate,
                        isLoading: isLoading,
                        width: double.infinity,
                        gradient: AppColors.greenGradient,
                        icon: Icons.check_circle,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
