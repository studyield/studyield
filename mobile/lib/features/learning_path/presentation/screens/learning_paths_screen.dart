import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/learning_path_entity.dart';
import '../bloc/learning_path_bloc.dart';
import '../bloc/learning_path_event.dart';
import '../bloc/learning_path_state.dart';
import 'learning_path_detail_screen.dart';
import '../../../../core/widgets/navigation/app_bottom_nav.dart';

class LearningPathsScreen extends StatefulWidget {
  final bool hideBottomNav;

  const LearningPathsScreen({super.key, this.hideBottomNav = false});

  @override
  State<LearningPathsScreen> createState() => _LearningPathsScreenState();
}

class _LearningPathsScreenState extends State<LearningPathsScreen> {
  final TextEditingController _topicController = TextEditingController();
  String _currentLevel = 'beginner';
  String _targetLevel = 'advanced';
  double _hoursPerWeek = 5.0;
  bool _showCreatePanel = false;
  List<LearningPathEntity> _paths = [];

  @override
  void initState() {
    super.initState();
    context.read<LearningPathBloc>().add(const LoadLearningPaths());
  }

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }

  void _generatePath() {
    if (_topicController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('learning_paths.validation.please_enter_topic'.tr())),
      );
      return;
    }

    context.read<LearningPathBloc>().add(GenerateLearningPath(
          topic: _topicController.text.trim(),
          currentLevel: _currentLevel,
          targetLevel: _targetLevel,
          hoursPerWeek: _hoursPerWeek.toInt(),
        ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: false,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text('learning_paths.title'.tr()),
      ),
      body: BlocListener<LearningPathBloc, LearningPathState>(
        listener: (context, state) {
          if (state is LearningPathsLoaded) {
            setState(() => _paths = state.paths);
          } else if (state is PathCreated) {
            _topicController.clear();
            setState(() => _showCreatePanel = false);
            // Navigate directly to the detail page like web does
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<LearningPathBloc>(),
                  child: LearningPathDetailScreen(pathId: state.path.id),
                ),
              ),
            ).then((_) {
              // Reload list when returning from detail
              context.read<LearningPathBloc>().add(const LoadLearningPaths());
            });
          } else if (state is PathDeleted) {
            context.read<LearningPathBloc>().add(const LoadLearningPaths());
          } else if (state is LearningPathError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: BlocBuilder<LearningPathBloc, LearningPathState>(
          builder: (context, state) {
            final isGenerating = state is PathGenerating;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // How it works
                  _buildHowItWorks(),
                  const SizedBox(height: 20),

                  // Create panel toggle
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() => _showCreatePanel = !_showCreatePanel);
                    },
                    icon: Icon(_showCreatePanel ? Icons.close : Icons.auto_awesome),
                    label: Text(_showCreatePanel
                        ? 'learning_paths.buttons.cancel'.tr()
                        : 'learning_paths.buttons.generate_path'.tr()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                      elevation: 0,
                    ),
                  ),

                  // Create form
                  if (_showCreatePanel) ...[
                    const SizedBox(height: 16),
                    _buildCreateForm(isGenerating),
                  ],

                  const SizedBox(height: 24),

                  // Paths list
                  if (_paths.isEmpty && state is! LearningPathLoading)
                    _buildEmptyState()
                  else if (state is LearningPathLoading && _paths.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else
                    ..._paths.map((path) => _buildPathCard(path)),
                ],
              ),
            );
          },
        ),
      ),
      bottomNavigationBar: widget.hideBottomNav ? null : const AppBottomNav(activeTab: 'learn'),
    );
  }

  Widget _buildHowItWorks() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7), // Beige/cream background like web
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt, color: Color(0xFFF59E0B), size: 20),
              const SizedBox(width: 8),
              Text(
                'learning_paths.how_it_works.title'.tr(),
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildHowItWorksStep('1', 'learning_paths.how_it_works.step1_title'.tr(), 'learning_paths.how_it_works.step1_subtitle'.tr())),
              const SizedBox(width: 12),
              Expanded(child: _buildHowItWorksStep('2', 'learning_paths.how_it_works.step2_title'.tr(), 'learning_paths.how_it_works.step2_subtitle'.tr())),
              const SizedBox(width: 12),
              Expanded(child: _buildHowItWorksStep('3', 'learning_paths.how_it_works.step3_title'.tr(), 'learning_paths.how_it_works.step3_subtitle'.tr())),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorksStep(String number, String title, String subtitle) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFF59E0B).withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: Color(0xFFF59E0B),
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
      ],
    );
  }

  Widget _buildCreateForm(bool isGenerating) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'learning_paths.form.title'.tr(),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Topic input
          TextField(
            controller: _topicController,
            decoration: InputDecoration(
              labelText: 'learning_paths.form.topic_label'.tr(),
              hintText: 'learning_paths.form.topic_hint'.tr(),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Current level
          DropdownButtonFormField<String>(
            value: _currentLevel,
            decoration: InputDecoration(
              labelText: 'learning_paths.form.current_level_label'.tr(),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            items: [
              DropdownMenuItem(value: 'beginner', child: Text('learning_paths.form.level_beginner'.tr())),
              DropdownMenuItem(
                  value: 'intermediate', child: Text('learning_paths.form.level_intermediate'.tr())),
              DropdownMenuItem(value: 'advanced', child: Text('learning_paths.form.level_advanced'.tr())),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _currentLevel = value);
            },
          ),
          const SizedBox(height: 16),

          // Target level
          DropdownButtonFormField<String>(
            value: _targetLevel,
            decoration: InputDecoration(
              labelText: 'learning_paths.form.target_level_label'.tr(),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            items: [
              DropdownMenuItem(value: 'beginner', child: Text('learning_paths.form.level_beginner'.tr())),
              DropdownMenuItem(
                  value: 'intermediate', child: Text('learning_paths.form.level_intermediate'.tr())),
              DropdownMenuItem(value: 'advanced', child: Text('learning_paths.form.level_advanced'.tr())),
              DropdownMenuItem(value: 'expert', child: Text('learning_paths.form.level_expert'.tr())),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _targetLevel = value);
            },
          ),
          const SizedBox(height: 16),

          // Hours per week
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'learning_paths.form.study_time_label'.tr(namedArgs: {'hours': '${_hoursPerWeek.toInt()}'}),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              Slider(
                value: _hoursPerWeek,
                min: 1,
                max: 40,
                divisions: 39,
                activeColor: AppColors.purple,
                onChanged: (value) {
                  setState(() => _hoursPerWeek = value);
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Generate button
          PrimaryButton(
            text: isGenerating ? 'learning_paths.buttons.generating'.tr() : 'learning_paths.buttons.generate_path'.tr(),
            onPressed: isGenerating ? null : _generatePath,
            icon: Icons.auto_awesome,
            gradient: AppColors.greenGradient,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(Icons.map, size: 64, color: AppColors.grey400),
          const SizedBox(height: 16),
          Text(
            'learning_paths.empty_state.title'.tr(),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'learning_paths.empty_state.subtitle'.tr(),
            style: const TextStyle(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPathCard(LearningPathEntity path) {
    // Calculate from actual steps array
    final totalSteps = path.steps.length;
    final completedSteps = path.steps.where((s) => s.isCompleted).length;
    final progress = totalSteps > 0 ? completedSteps / totalSteps : 0.0;
    final totalMinutes = path.steps.fold<int>(0, (sum, s) => sum + s.estimatedMinutes);
    final totalHours = (totalMinutes / 60).ceil();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 56,
              height: 56,
              child: CircularProgressIndicator(
                value: progress,
                backgroundColor: AppColors.grey200,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.secondary),
                strokeWidth: 6,
              ),
            ),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.secondary,
              ),
            ),
          ],
        ),
        title: Text(
          path.title,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getDifficultyColor(path.difficulty).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    path.difficulty.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _getDifficultyColor(path.difficulty),
                    ),
                  ),
                ),
                if (path.subject != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      path.subject!,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.list_alt, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  'learning_paths.path_card.steps_count'.tr(namedArgs: {'completed': '$completedSteps', 'total': '$totalSteps'}),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 12),
                Icon(Icons.access_time, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  'learning_paths.path_card.hours_label'.tr(namedArgs: {'hours': '$totalHours'}),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.red),
          onPressed: () => _confirmDelete(path.id),
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => BlocProvider.value(
                value: context.read<LearningPathBloc>(),
                child: LearningPathDetailScreen(pathId: path.id),
              ),
            ),
          ).then((_) {
            // Reload list when returning from detail to reflect step completions
            context.read<LearningPathBloc>().add(const LoadLearningPaths());
          });
        },
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
      case 'beginner':
        return Colors.green;
      case 'medium':
      case 'intermediate':
        return Colors.amber;
      case 'hard':
      case 'advanced':
        return Colors.red;
      default:
        return AppColors.grey600;
    }
  }

  void _confirmDelete(String pathId) {
    final bloc = context.read<LearningPathBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('learning_paths.dialogs.delete_confirm_title'.tr()),
        content:
            Text('learning_paths.dialogs.delete_confirm_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('learning_paths.dialogs.cancel_button'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              bloc.add(DeletePath(pathId: pathId));
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('learning_paths.dialogs.delete_button'.tr()),
          ),
        ],
      ),
    );
  }
}
