import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/learning_path_entity.dart';
import '../../domain/entities/learning_step_entity.dart';
import '../bloc/learning_path_bloc.dart';
import '../bloc/learning_path_event.dart';
import '../bloc/learning_path_state.dart';

class LearningPathDetailScreen extends StatefulWidget {
  final String pathId;

  const LearningPathDetailScreen({super.key, required this.pathId});

  @override
  State<LearningPathDetailScreen> createState() =>
      _LearningPathDetailScreenState();
}

class _LearningPathDetailScreenState extends State<LearningPathDetailScreen> {
  LearningPathEntity? _path;
  Set<String> _expandedSteps = {};
  String? _completingStepId;

  @override
  void initState() {
    super.initState();
    context.read<LearningPathBloc>().add(LoadPathDetail(pathId: widget.pathId));
  }

  void _markStepDone(String stepId) {
    setState(() => _completingStepId = stepId);
    context.read<LearningPathBloc>().add(CompleteStep(
          pathId: widget.pathId,
          stepId: stepId,
        ));
  }

  IconData _getStepIcon(StepType type) {
    switch (type) {
      case StepType.study:
        return Icons.menu_book;
      case StepType.quiz:
        return Icons.quiz;
      case StepType.practice:
        return Icons.fitness_center;
      case StepType.review:
        return Icons.refresh;
      case StepType.project:
        return Icons.rocket_launch;
    }
  }

  Color _getStepColor(StepType type) {
    switch (type) {
      case StepType.study:
        return Colors.blue;
      case StepType.quiz:
        return Colors.deepPurple;
      case StepType.practice:
        return Colors.green;
      case StepType.review:
        return Colors.amber;
      case StepType.project:
        return Colors.red;
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
        title: Text('learning_paths.detail.learning_path'.tr()),
      ),
      body: BlocListener<LearningPathBloc, LearningPathState>(
        listener: (context, state) {
          if (state is PathDetailLoaded) {
            setState(() {
              _path = state.path;
              _completingStepId = null;
            });
          } else if (state is StepCompleted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('learning_paths.detail.step_completed'.tr()),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is LearningPathError) {
            setState(() => _completingStepId = null);
          }
        },
        child: _path == null
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Progress circle
                    _buildProgressSection(),
                    const SizedBox(height: 20),

                    // Stats cards
                    _buildStatsCards(),
                    const SizedBox(height: 20),

                    // Overall progress bar
                    _buildProgressBar(),
                    const SizedBox(height: 24),

                    // Timeline
                    Text(
                      'learning_paths.detail.your_learning_journey'.tr(),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildTimeline(),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildProgressSection() {
    final completedCount = _path!.steps.where((s) => s.isCompleted).length;
    final totalCount = _path!.steps.length;
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;
    final isComplete = progress >= 1.0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.greenGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 130,
                height: 130,
                child: CircularProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.white.withOpacity(0.3),
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 12,
                ),
              ),
              Column(
                children: [
                  if (isComplete)
                    const Icon(Icons.emoji_events_rounded,
                        color: Colors.white, size: 36)
                  else
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  Text(
                    isComplete
                        ? 'learning_paths.detail.path_completed'.tr()
                        : 'learning_paths.detail.complete'.tr(),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            _path!.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${_path!.currentLevel} → ${_path!.targetLevel}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCards() {
    final completedCount = _path!.steps.where((s) => s.isCompleted).length;
    final totalCount = _path!.steps.length;

    final completedMinutes = _path!.steps
        .where((s) => s.isCompleted)
        .fold<int>(0, (sum, s) => sum + s.estimatedMinutes);
    final totalMinutes =
        _path!.steps.fold<int>(0, (sum, s) => sum + s.estimatedMinutes);
    final remainingMinutes = totalMinutes - completedMinutes;

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            '$completedCount/$totalCount',
            'learning_paths.detail.steps'.tr(),
            Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            '${(remainingMinutes / 60).ceil()}h',
            'learning_paths.detail.remaining'.tr(),
            Colors.orange,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            '${(totalMinutes / 60).ceil()}h',
            'learning_paths.detail.total_time'.tr(),
            AppColors.secondary,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            maxLines: 1,
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    final completedCount = _path!.steps.where((s) => s.isCompleted).length;
    final totalCount = _path!.steps.length;
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'learning_paths.detail.overall_progress'.tr(),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                'learning_paths.detail.steps_count'.tr(namedArgs: {
                  'completed': completedCount.toString(),
                  'total': totalCount.toString()
                }),
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 12,
              backgroundColor: AppColors.grey200,
              valueColor: AlwaysStoppedAnimation<Color>(
                  progress >= 1.0 ? Colors.green : AppColors.secondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    final nextStep = _path!.steps
        .cast<LearningStepEntity?>()
        .firstWhere((s) => !s!.isCompleted, orElse: () => null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Next step recommendation with Mark Done button
        if (nextStep != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.secondary.withOpacity(0.1),
                  AppColors.secondary.withOpacity(0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: AppColors.secondary.withOpacity(0.3), width: 2),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: AppColors.greenGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.play_arrow,
                      color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'learning_paths.detail.next_up'.tr(),
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        nextStep.title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${nextStep.estimatedMinutes} min · ${nextStep.type.name}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Mark Done button on next step banner
                SizedBox(
                  height: 36,
                  child: ElevatedButton.icon(
                    onPressed: _completingStepId == nextStep.id
                        ? null
                        : () => _markStepDone(nextStep.id),
                    icon: _completingStepId == nextStep.id
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.check_circle_outline, size: 16),
                    label: Text(
                      'learning_paths.detail.mark_done'.tr(),
                      style: const TextStyle(fontSize: 12),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Timeline steps
        ..._path!.steps.asMap().entries.map((entry) {
          final index = entry.key;
          final step = entry.value;
          final isExpanded = _expandedSteps.contains(step.id);
          final isLast = index == _path!.steps.length - 1;

          return _buildTimelineStep(step, isExpanded, isLast, nextStep);
        }),
      ],
    );
  }

  Widget _buildTimelineStep(LearningStepEntity step, bool isExpanded,
      bool isLast, LearningStepEntity? nextStep) {
    final stepColor = _getStepColor(step.type);
    final isNextStep = nextStep?.id == step.id;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline indicator
        Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: step.isCompleted
                    ? AppColors.greenGradient
                    : (isNextStep
                        ? LinearGradient(
                            colors: [
                              stepColor.withOpacity(0.8),
                              stepColor
                            ],
                          )
                        : null),
                color: step.isCompleted || isNextStep
                    ? null
                    : stepColor.withOpacity(0.15),
                shape: BoxShape.circle,
                border: Border.all(
                  color: step.isCompleted ? Colors.green : stepColor,
                  width: step.isCompleted || isNextStep ? 3 : 2,
                ),
                boxShadow: step.isCompleted || isNextStep
                    ? [
                        BoxShadow(
                          color:
                              (step.isCompleted ? Colors.green : stepColor)
                                  .withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                step.isCompleted
                    ? Icons.check_circle
                    : _getStepIcon(step.type),
                color: step.isCompleted || isNextStep
                    ? Colors.white
                    : stepColor,
                size: 24,
              ),
            ),
            if (!isLast)
              Container(
                width: 3,
                height: isExpanded ? 120 : 70,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      step.isCompleted
                          ? AppColors.secondary
                          : AppColors.border,
                      AppColors.border,
                    ],
                  ),
                ),
                margin: const EdgeInsets.symmetric(vertical: 4),
              ),
          ],
        ),

        const SizedBox(width: 16),

        // Step content
        Expanded(
          child: GestureDetector(
            onTap: () {
              setState(() {
                if (isExpanded) {
                  _expandedSteps.remove(step.id);
                } else {
                  _expandedSteps.add(step.id);
                }
              });
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: step.isCompleted
                      ? Colors.green.withOpacity(0.3)
                      : (isNextStep
                          ? AppColors.secondary.withOpacity(0.5)
                          : AppColors.border),
                  width: isNextStep ? 2 : 1,
                ),
                boxShadow: isNextStep
                    ? [
                        BoxShadow(
                          color: AppColors.secondary.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'learning_paths.detail.step_number'.tr(
                                      namedArgs: {
                                        'number':
                                            step.stepNumber.toString()
                                      }),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: stepColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: stepColor.withOpacity(0.1),
                                    borderRadius:
                                        BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    step.type.name,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: stepColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              step.title,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                decoration: step.isCompleted
                                    ? TextDecoration.lineThrough
                                    : null,
                                color: step.isCompleted
                                    ? AppColors.textSecondary
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Mark Done button visible on every incomplete step
                      if (!step.isCompleted) ...[
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => _markStepDone(step.id),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: _completingStepId == step.id
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.green,
                                    ),
                                  )
                                : const Icon(Icons.check_circle_outline,
                                    color: Colors.green, size: 20),
                          ),
                        ),
                      ],
                      if (step.isCompleted) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.check_circle,
                            color: Colors.green, size: 22),
                      ],
                      const SizedBox(width: 4),
                      Icon(
                        isExpanded
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down,
                        color: AppColors.textSecondary,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.access_time,
                          size: 13, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        'learning_paths.detail.minutes'.tr(namedArgs: {
                          'minutes':
                              step.estimatedMinutes.toString()
                        }),
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      if (step.isCompleted && step.completedAt != null) ...[
                        const SizedBox(width: 12),
                        Icon(Icons.check,
                            size: 13, color: Colors.green),
                        const SizedBox(width: 4),
                        Text(
                          'learning_paths.detail.completed_on'.tr(
                              namedArgs: {
                                'date': _formatDate(step.completedAt!)
                              }),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),

                  if (isExpanded) ...[
                    const SizedBox(height: 12),
                    Divider(),
                    const SizedBox(height: 12),
                    Text(
                      step.description,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: Colors.black87,
                      ),
                    ),
                    if (step.resourceUrl != null) ...[
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: () => _launchUrl(step.resourceUrl!),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.secondary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.link,
                                  size: 16, color: AppColors.secondary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'learning_paths.detail.view_resource'
                                      .tr(),
                                  style: TextStyle(
                                    color: AppColors.secondary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              Icon(Icons.open_in_new,
                                  size: 16, color: AppColors.secondary),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (!step.isCompleted) ...[
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _completingStepId == step.id
                              ? null
                              : () => _markStepDone(step.id),
                          icon: _completingStepId == step.id
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white),
                                )
                              : Icon(Icons.check),
                          label: Text(
                              'learning_paths.detail.mark_as_done'.tr()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ] else ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle,
                                color: Colors.green, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'learning_paths.detail.completed_on'.tr(
                                  namedArgs: {
                                    'date':
                                        _formatDate(step.completedAt!)
                                  }),
                              style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  Future<void> _launchUrl(String urlString) async {
    try {
      final uri = Uri.parse(urlString);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('common.could_not_open_link'.tr())),
      );
    }
  }
}
