import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import 'solution_screen.dart';

class ProblemHistoryScreen extends StatefulWidget {
  const ProblemHistoryScreen({super.key});

  @override
  State<ProblemHistoryScreen> createState() => _ProblemHistoryScreenState();
}

class _ProblemHistoryScreenState extends State<ProblemHistoryScreen> {
  List<ProblemSessionEntity> _sessions = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    context.read<ProblemSolverBloc>().add(const LoadSessions());
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
        title: Text('problem_solver.history.title'.tr()),
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is SessionsLoaded) {
            setState(() => _sessions = state.sessions);
          } else if (state is SessionDeleted) {
            context.read<ProblemSolverBloc>().add(const LoadSessions());
          }
        },
        child: Column(
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: InputDecoration(
                  hintText: 'problem_solver.history.search_placeholder'.tr(),
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.grey300),
                  ),
                ),
              ),
            ),

            // Sessions list
            Expanded(
              child: _sessions.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredSessions.length,
                      itemBuilder: (context, index) {
                        final session = _filteredSessions[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.grey300),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(12),
                            title: Text(
                              session.problem,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 8),
                                if (session.subject != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF9333EA).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      session.subject!,
                                      style: const TextStyle(
                                        color: Color(0xFF9333EA),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                const SizedBox(height: 4),
                                Text(
                                  _formatDate(session.createdAt),
                                  style: const TextStyle(fontSize: 11),
                                ),
                              ],
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _confirmDelete(session.id),
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => BlocProvider.value(
                                    value: context.read<ProblemSolverBloc>(),
                                    child: SolutionScreen(sessionId: session.id),
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  List<ProblemSessionEntity> get _filteredSessions {
    if (_searchQuery.isEmpty) return _sessions;
    return _sessions.where((s) {
      return s.problem.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (s.subject?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
    }).toList();
  }

  void _confirmDelete(String sessionId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('problem_solver.history.delete_dialog.title'.tr()),
        content: Text('problem_solver.history.delete_dialog.message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('problem_solver.history.delete_dialog.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<ProblemSolverBloc>().add(DeleteSession(sessionId: sessionId));
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('problem_solver.history.delete_dialog.delete'.tr()),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) return 'problem_solver.history.time.today'.tr();
    if (diff.inDays == 1) return 'problem_solver.history.time.yesterday'.tr();
    if (diff.inDays < 7) return 'problem_solver.history.time.days_ago'.tr(namedArgs: {'days': diff.inDays.toString()});
    return '${date.day}/${date.month}/${date.year}';
  }
}
