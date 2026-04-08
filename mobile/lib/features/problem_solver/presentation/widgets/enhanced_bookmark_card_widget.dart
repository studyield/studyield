import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection, DateFormat;
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/bookmark_entity.dart';

class EnhancedBookmarkCard extends StatefulWidget {
  final BookmarkEntity bookmark;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final Function(String tag)? onTagTap;

  const EnhancedBookmarkCard({
    super.key,
    required this.bookmark,
    this.onEdit,
    this.onDelete,
    this.onTagTap,
  });

  @override
  State<EnhancedBookmarkCard> createState() => _EnhancedBookmarkCardState();
}

class _EnhancedBookmarkCardState extends State<EnhancedBookmarkCard> {
  bool _isExpanded = false;

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return '${'problem_solver.widgets.date.today'.tr()} ${DateFormat('HH:mm').format(date)}';
    } else if (difference.inDays == 1) {
      return 'problem_solver.widgets.date.yesterday'.tr();
    } else if (difference.inDays < 7) {
      return 'problem_solver.widgets.date.days_ago'.tr(namedArgs: {'days': difference.inDays.toString()});
    } else {
      return DateFormat('MMM dd, yyyy').format(date);
    }
  }

  Color _getSubjectColor(String? subject) {
    if (subject == null) return AppColors.grey400;

    switch (subject.toLowerCase()) {
      case 'mathematics':
      case 'math':
        return Colors.blue;
      case 'physics':
        return Colors.purple;
      case 'chemistry':
        return Colors.green;
      case 'biology':
        return Colors.teal;
      case 'computer science':
        return Colors.orange;
      default:
        return AppColors.grey600;
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.bookmark.session;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () => setState(() => _isExpanded = !_isExpanded),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header (always visible)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Bookmark icon
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: AppColors.purpleGradient,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.bookmark,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Subject badge
                        if (session?.subject != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: _getSubjectColor(session!.subject)
                                  .withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              session.subject!,
                              style: TextStyle(
                                color: _getSubjectColor(session.subject),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),

                        // Problem preview
                        Text(
                          session?.problem ?? 'problem_solver.widgets.no_problem_text'.tr(),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                          maxLines: _isExpanded ? null : 2,
                          overflow:
                              _isExpanded ? null : TextOverflow.ellipsis,
                        ),

                        const SizedBox(height: 8),

                        // Timestamp
                        Text(
                          _formatDate(widget.bookmark.createdAt),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),

                  // Expand icon
                  Icon(
                    _isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),

              // Expanded content
              if (_isExpanded) ...[
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 16),

                // Tags
                if (widget.bookmark.tags.isNotEmpty) ...[
                  Text(
                    'Tags',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.bookmark.tags.map((tag) {
                      return GestureDetector(
                        onTap: () => widget.onTagTap?.call(tag),
                        child: Chip(
                          label: Text(tag),
                          backgroundColor: AppColors.purple.withOpacity(0.1),
                          side: BorderSide.none,
                          labelStyle: const TextStyle(
                            color: AppColors.purple,
                            fontSize: 12,
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],

                // Notes
                if (widget.bookmark.notes != null &&
                    widget.bookmark.notes!.isNotEmpty) ...[
                  Text(
                    'Notes',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      widget.bookmark.notes!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Actions
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(
                          context,
                          '/problem-solver/solution',
                          arguments: widget.bookmark.sessionId,
                        );
                      },
                      icon: const Icon(Icons.visibility, size: 18),
                      label: Text('problem_solver.widgets.view_solution'.tr()),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.purple,
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: widget.onEdit,
                      icon: const Icon(Icons.edit, size: 18),
                      label: Text('problem_solver.widgets.edit'.tr()),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.blue,
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: widget.onDelete,
                      icon: const Icon(Icons.delete, size: 18),
                      label: Text('problem_solver.widgets.delete'.tr()),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.red,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
