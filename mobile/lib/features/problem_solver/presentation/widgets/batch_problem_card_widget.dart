import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/batch_problem_entity.dart';

class BatchProblemCard extends StatelessWidget {
  final BatchProblemEntity problem;
  final VoidCallback? onSolve;
  final VoidCallback? onDelete;
  final VoidCallback? onLongPress;

  const BatchProblemCard({
    super.key,
    required this.problem,
    this.onSolve,
    this.onDelete,
    this.onLongPress,
  });

  Color _getStatusColor() {
    switch (problem.status) {
      case BatchProblemStatus.pending:
        return AppColors.grey400;
      case BatchProblemStatus.solving:
        return AppColors.purple;
      case BatchProblemStatus.completed:
        return Colors.green;
      case BatchProblemStatus.failed:
        return Colors.red;
    }
  }

  IconData _getStatusIcon() {
    switch (problem.status) {
      case BatchProblemStatus.pending:
        return Icons.pending_outlined;
      case BatchProblemStatus.solving:
        return Icons.sync;
      case BatchProblemStatus.completed:
        return Icons.check_circle;
      case BatchProblemStatus.failed:
        return Icons.error_outline;
    }
  }

  String _getStatusLabel() {
    switch (problem.status) {
      case BatchProblemStatus.pending:
        return 'problem_solver.widgets.status.pending'.tr();
      case BatchProblemStatus.solving:
        return 'problem_solver.widgets.status.solving'.tr();
      case BatchProblemStatus.completed:
        return 'problem_solver.widgets.status.completed'.tr();
      case BatchProblemStatus.failed:
        return 'problem_solver.widgets.status.failed'.tr();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onLongPress,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: _getStatusColor().withOpacity(0.3),
            width: 2,
          ),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: sequence number and status
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: _getStatusColor().withOpacity(0.1),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _getStatusColor(),
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '${problem.sequenceNumber}',
                            style: TextStyle(
                              color: _getStatusColor(),
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Row(
                          children: [
                            Icon(
                              _getStatusIcon(),
                              size: 16,
                              color: _getStatusColor(),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _getStatusLabel(),
                              style: TextStyle(
                                color: _getStatusColor(),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (problem.status == BatchProblemStatus.pending ||
                          problem.status == BatchProblemStatus.failed)
                        IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          color: Colors.red,
                          onPressed: onDelete,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Subject badge (if available)
                  if (problem.subject != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        problem.subject!,
                        style: const TextStyle(
                          color: AppColors.purple,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),

                  // Problem preview
                  Text(
                    problem.problem,
                    style: Theme.of(context).textTheme.bodyMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 8),

                  // Error message (if failed)
                  if (problem.status == BatchProblemStatus.failed &&
                      problem.errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.error_outline,
                            size: 14,
                            color: Colors.red,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              problem.errorMessage!,
                              style: const TextStyle(
                                color: Colors.red,
                                fontSize: 11,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Solve button
                  if (problem.status == BatchProblemStatus.pending ||
                      problem.status == BatchProblemStatus.failed) ...[
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        text: problem.status == BatchProblemStatus.failed
                            ? 'problem_solver.widgets.retry'.tr()
                            : 'problem_solver.widgets.solve'.tr(),
                        onPressed: onSolve,
                        height: 32,
                      ),
                    ),
                  ],

                  // View solution button
                  if (problem.status == BatchProblemStatus.completed &&
                      problem.sessionId != null) ...[
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            '/problem-solver/solution',
                            arguments: problem.sessionId,
                          );
                        },
                        icon: const Icon(Icons.visibility, size: 14),
                        label: Text('problem_solver.widgets.view_solution'.tr()),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.green,
                          side: const BorderSide(color: Colors.green),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Solving progress indicator
            if (problem.status == BatchProblemStatus.solving)
              const Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
