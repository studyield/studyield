import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:http/http.dart' as http;
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/services/auth_token_service.dart';
import '../../../../core/constants/api_constants.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import 'solution_screen.dart';

class SolvingProgressScreen extends StatefulWidget {
  final String sessionId;

  const SolvingProgressScreen({super.key, required this.sessionId});

  @override
  State<SolvingProgressScreen> createState() => _SolvingProgressScreenState();
}

class _SolvingProgressScreenState extends State<SolvingProgressScreen> {
  SessionStatus _currentStatus = SessionStatus.analyzing;
  Map<String, String> _streamChunks = {};
  Map<String, dynamic> _stageResults = {};
  StreamSubscription? _streamSubscription;

  @override
  void initState() {
    super.initState();
    _startStreamingSolve();
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    super.dispose();
  }

  Future<void> _startStreamingSolve() async {
    print('🌊 Starting stream solve for session: ${widget.sessionId}');
    setState(() => _currentStatus = SessionStatus.analyzing);

    try {
      final token = AuthTokenService.instance.accessToken;
      if (token == null) {
        throw Exception('No auth token available');
      }

      final url = Uri.parse(
        '${ApiConstants.apiBaseUrl}/problem-solver/${widget.sessionId}/solve/stream',
      );

      print('🌊 Stream URL: $url');

      final request = http.Request('POST', url);
      request.headers['Authorization'] = 'Bearer $token';
      request.headers['Content-Type'] = 'application/json';

      print('🌊 Sending stream request...');
      final response = await request.send();

      print('🌊 Stream response status: ${response.statusCode}');

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Stream failed: ${response.statusCode}');
      }

      print('✅ Stream connected, listening for events...');

      // Listen to stream
      _streamSubscription = response.stream
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen(
            (line) {
              print('📨 Stream line: $line');
              _handleStreamEvent(line);
            },
            onError: (error) {
              print('❌ Stream error: $error');
              setState(() => _currentStatus = SessionStatus.failed);
            },
            onDone: () {
              print('🏁 Stream completed');
              if (_currentStatus != SessionStatus.completed) {
                // Load final session data
                context.read<ProblemSolverBloc>().add(
                      LoadSession(sessionId: widget.sessionId),
                    );
              }
            },
          );
    } catch (e) {
      print('❌ Stream setup failed: $e');
      setState(() => _currentStatus = SessionStatus.failed);
    }
  }

  void _handleStreamEvent(String line) {
    if (!line.startsWith('data: ')) return;

    try {
      final data = jsonDecode(line.substring(6));
      final stage = data['stage'] as String;
      final type = data['type'] as String;
      final eventData = data['data'];

      if (type == 'start') {
        print('🚀 Stage started: $stage');
        setState(() {
          if (stage == 'analysis') _currentStatus = SessionStatus.analyzing;
          if (stage == 'solving') _currentStatus = SessionStatus.solving;
          if (stage == 'verification') _currentStatus = SessionStatus.verifying;
        });
      } else if (type == 'chunk') {
        setState(() {
          _streamChunks[stage] = (_streamChunks[stage] ?? '') + (eventData as String);
        });
      } else if (type == 'result') {
        print('✅ Stage result: $stage');
        setState(() {
          _stageResults[stage] = eventData;
          if (stage == 'complete') {
            print('🎉 Solution complete! Navigating...');
            _currentStatus = SessionStatus.completed;
            // Navigate after a short delay to show completion state
            Future.delayed(const Duration(seconds: 2), () {
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ProblemSolverBloc>(),
                      child: SolutionScreen(sessionId: widget.sessionId),
                    ),
                  ),
                );
              }
            });
          }
        });
      }
    } catch (e) {
      debugPrint('Failed to parse stream event: $e');
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
        title: Text('problem_solver.solving_progress.title'.tr()),
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is SessionLoaded && state.session.status == SessionStatus.completed) {
            // Auto-navigate to solution
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ProblemSolverBloc>(),
                  child: SolutionScreen(sessionId: widget.sessionId),
                ),
              ),
            );
          }
        },
        child: BlocBuilder<ProblemSolverBloc, ProblemSolverState>(
          builder: (context, state) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Analysis stage
                  _buildAgentStage(
                    'problem_solver.solving_progress.stages.analysis.title'.tr(),
                    'problem_solver.solving_progress.stages.analysis.description'.tr(),
                    Icons.search,
                    AppColors.blue,
                    SessionStatus.analyzing,
                    _currentStatus,
                    _streamChunks['analysis'],
                  ),

                  _buildArrow(),

                  // Solving stage
                  _buildAgentStage(
                    'problem_solver.solving_progress.stages.solving.title'.tr(),
                    'problem_solver.solving_progress.stages.solving.description'.tr(),
                    Icons.bolt,
                    AppColors.warning,
                    SessionStatus.solving,
                    _currentStatus,
                    _streamChunks['solving'],
                  ),

                  _buildArrow(),

                  // Verification stage
                  _buildAgentStage(
                    'problem_solver.solving_progress.stages.verification.title'.tr(),
                    'problem_solver.solving_progress.stages.verification.description'.tr(),
                    Icons.verified,
                    AppColors.success,
                    SessionStatus.verifying,
                    _currentStatus,
                    _streamChunks['verification'],
                  ),

                  const SizedBox(height: 24),

                  // Completed state
                  if (_currentStatus == SessionStatus.completed)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.withOpacity(0.3)),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            'problem_solver.solving_progress.status.solution_ready'.tr(),
                            style: AppTextStyles.titleLarge.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text('problem_solver.solving_progress.status.redirecting'.tr()),
                        ],
                      ),
                    ),

                  // Failed state
                  if (_currentStatus == SessionStatus.failed)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.error, color: Colors.red, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            'problem_solver.solving_progress.status.failed'.tr(),
                            style: AppTextStyles.titleLarge.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.red,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              context.read<ProblemSolverBloc>().add(
                                    SolveSession(sessionId: widget.sessionId),
                                  );
                            },
                            child: Text('problem_solver.solving_progress.status.retry'.tr()),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildAgentStage(
    String title,
    String description,
    IconData icon,
    Color color,
    SessionStatus stageStatus,
    SessionStatus currentStatus,
    String? streamText,
  ) {
    final isPending = currentStatus.index < stageStatus.index;
    final isActive = currentStatus == stageStatus;
    final isComplete = currentStatus.index > stageStatus.index;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive
              ? color
              : isComplete
                  ? Colors.green
                  : AppColors.grey300,
          width: isActive ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isComplete
                  ? Colors.green.withOpacity(0.1)
                  : isActive
                      ? color.withOpacity(0.1)
                      : AppColors.grey200,
              borderRadius: BorderRadius.circular(10),
            ),
            child: isActive
                ? const Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : Icon(
                    isComplete ? Icons.check_circle : icon,
                    color: isComplete
                        ? Colors.green
                        : isActive
                            ? color
                            : AppColors.grey400,
                    size: 24,
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  description,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                  ),
                ),
                if (isActive && streamText != null && streamText.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      streamText,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: color,
                        fontStyle: FontStyle.italic,
                        height: 1.4,
                      ),
                      maxLines: 8,
                      overflow: TextOverflow.fade,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (isComplete)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'problem_solver.solving_progress.status.complete'.tr(),
                style: const TextStyle(
                  color: Colors.green,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildArrow() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: Icon(
          Icons.arrow_downward,
          color: AppColors.grey400,
          size: 24,
        ),
      ),
    );
  }
}
