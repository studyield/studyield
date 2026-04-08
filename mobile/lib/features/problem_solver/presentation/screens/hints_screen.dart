import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/hint_step_entity.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';

class HintsScreen extends StatefulWidget {
  final String sessionId;
  final String? problem;

  const HintsScreen({super.key, required this.sessionId, this.problem});

  @override
  State<HintsScreen> createState() => _HintsScreenState();
}

class _HintsScreenState extends State<HintsScreen> {
  HintStepEntity? _currentHint;
  List<HintStepEntity> _hintHistory = [];
  bool _isLoading = false;

  void _getNextHint() {
    setState(() => _isLoading = true);
    context.read<ProblemSolverBloc>().add(GetNextHint(sessionId: widget.sessionId));
  }

  void _resetHints() {
    context.read<ProblemSolverBloc>().add(ResetHints(sessionId: widget.sessionId));
    setState(() {
      _currentHint = null;
      _hintHistory = [];
    });
  }

  void _seeSolution() {
    Navigator.pop(context); // Go back to solution screen
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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.lightbulb, color: Color(0xFFF59E0B), size: 20),
                const SizedBox(width: 8),
                Text(
                  'problem_solver.hints.title'.tr(),
                  style: AppTextStyles.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Text(
              'problem_solver.hints.subtitle'.tr(),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        toolbarHeight: 70,
        actions: [
          if (_hintHistory.isNotEmpty)
            TextButton.icon(
              onPressed: _resetHints,
              icon: const Icon(Icons.refresh, size: 18),
              label: Text('problem_solver.hints.actions.reset'.tr()),
            ),
        ],
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is HintLoaded) {
            setState(() {
              _currentHint = state.hint;
              _hintHistory.add(state.hint);
              _isLoading = false;
            });
          } else if (state is HintsReset) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('problem_solver.hints.messages.hints_reset'.tr())),
            );
          } else if (state is ProblemSolverError) {
            setState(() => _isLoading = false);
          }
        },
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Problem Box
                    if (widget.problem != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'problem_solver.hints.problem_label'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              widget.problem!,
                              style: AppTextStyles.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    // Hint Cards
                    if (_hintHistory.isNotEmpty)
                      ..._hintHistory.map((hint) {
                        final isLast = hint == _hintHistory.last;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF59E0B).withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(
                                      child: Text(
                                        '${hint.hintNumber}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFFF59E0B),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Hint ${hint.hintNumber} of ~${hint.totalHintsNeeded}',
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                hint.hint,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  height: 1.6,
                                ),
                              ),
                              if (hint.nextHintPreview != null && !hint.isLastHint) ...[
                                const SizedBox(height: 16),
                                Text(
                                  'Next hint covers: ${hint.nextHintPreview}',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.grey600,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      }).toList(),

                    // All hints revealed message
                    if (_currentHint?.isLastHint ?? false) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          border: Border.all(color: Colors.green.withOpacity(0.2)),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.green, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'All hints revealed! Try solving now.',
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: Colors.green.shade700,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ],
                ),
              ),
            ),

            // Progress Bar (only show if hints exist)
            if (_hintHistory.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: _hintHistory.length /
                        (_currentHint?.totalHintsNeeded ?? 1),
                    backgroundColor: AppColors.grey200,
                    valueColor: const AlwaysStoppedAnimation(Color(0xFFF59E0B)),
                    minHeight: 8,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Action Buttons
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Next Hint / All Hints Revealed
                  Expanded(
                    flex: 2,
                    child: _currentHint?.isLastHint ?? false
                        ? Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.1),
                              border: Border.all(color: Colors.green.withOpacity(0.2)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(
                                'All Hints Revealed',
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: Colors.green.shade700,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          )
                        : ElevatedButton.icon(
                            onPressed: _isLoading ? null : _getNextHint,
                            icon: _isLoading
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation(Colors.white),
                                    ),
                                  )
                                : Icon(
                                    _hintHistory.isEmpty
                                        ? Icons.lightbulb_outline
                                        : Icons.chevron_right,
                                    size: 20,
                                  ),
                            label: Text(
                              _isLoading
                                  ? 'Thinking...'
                                  : _hintHistory.isEmpty
                                      ? 'Get First Hint'
                                      : 'Next Hint',
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFF59E0B),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(width: 12),
                  // See Solution Button
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _seeSolution,
                      icon: const Icon(Icons.visibility, size: 18),
                      label: Text('problem_solver.hints.see_solution'.tr()),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
