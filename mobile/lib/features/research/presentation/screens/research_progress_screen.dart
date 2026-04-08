import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/research_session_entity.dart';
import '../bloc/research_bloc.dart';
import '../bloc/research_event.dart';
import '../bloc/research_state.dart';
import 'research_report_screen.dart';

class ResearchProgressScreen extends StatefulWidget {
  final String sessionId;

  const ResearchProgressScreen({super.key, required this.sessionId});

  @override
  State<ResearchProgressScreen> createState() => _ResearchProgressScreenState();
}

class _ResearchProgressScreenState extends State<ResearchProgressScreen> {
  ResearchSessionEntity? _session;

  @override
  void initState() {
    super.initState();
    // Start polling for progress
    context.read<ResearchBloc>().add(PollResearchProgress(sessionId: widget.sessionId));
  }

  @override
  void dispose() {
    // Stop polling when leaving screen
    context.read<ResearchBloc>().add(const StopPolling());
    super.dispose();
  }

  String _getPhaseLabel(ResearchStatus status) {
    switch (status) {
      case ResearchStatus.planning:
        return 'research.progress.phases.planning'.tr();
      case ResearchStatus.researching:
        return 'research.progress.phases.researching'.tr();
      case ResearchStatus.synthesizing:
        return 'research.progress.phases.synthesizing'.tr();
      case ResearchStatus.completed:
        return 'research.progress.phases.completed'.tr();
      case ResearchStatus.failed:
        return 'research.progress.phases.failed'.tr();
      default:
        return 'research.progress.phases.starting'.tr();
    }
  }

  int _getPhaseIndex(ResearchStatus status) {
    switch (status) {
      case ResearchStatus.planning:
        return 0;
      case ResearchStatus.researching:
        return 1;
      case ResearchStatus.synthesizing:
      case ResearchStatus.completed:
        return 2;
      default:
        return -1;
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
        title: Text('research.progress.title'.tr()),
      ),
      body: BlocListener<ResearchBloc, ResearchState>(
        listener: (context, state) {
          if (state is ResearchInProgress) {
            setState(() => _session = state.session);
          } else if (state is ResearchCompleted) {
            setState(() => _session = state.session);
            // Navigate to report screen
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ResearchBloc>(),
                  child: ResearchReportScreen(sessionId: widget.sessionId),
                ),
              ),
            );
          } else if (state is ResearchError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: _session == null
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Query preview
                    Container(
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
                            children: [
                              Icon(Icons.search, size: 18, color: AppColors.secondary),
                              SizedBox(width: 8),
                              Text(
                                'research.progress.query_label'.tr(),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _session!.query,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Overall progress
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: AppColors.greenGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'research.progress.overall_progress'.tr(),
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                '${_session!.progress.toInt()}%',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: _session!.progress / 100,
                              minHeight: 10,
                              backgroundColor: Colors.white.withOpacity(0.3),
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                          if (_session!.progressMessage != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              _session!.progressMessage!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Agent pipeline
                    Text(
                      'research.progress.pipeline_title'.tr(),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    _buildAgentPhase(
                      'research.progress.agents.planning'.tr(),
                      'research.progress.agents.planning_desc'.tr(),
                      Icons.psychology,
                      Colors.blue,
                      0,
                    ),
                    const SizedBox(height: 12),

                    _buildAgentPhase(
                      'research.progress.agents.research'.tr(),
                      'research.progress.agents.research_desc'.tr(),
                      Icons.search,
                      AppColors.secondary,
                      1,
                    ),
                    const SizedBox(height: 12),

                    _buildAgentPhase(
                      'research.progress.agents.synthesis'.tr(),
                      'research.progress.agents.synthesis_desc'.tr(),
                      Icons.auto_awesome,
                      AppColors.purple,
                      2,
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildAgentPhase(
    String title,
    String description,
    IconData icon,
    Color color,
    int phaseIndex,
  ) {
    final currentPhase = _getPhaseIndex(_session!.status);
    final isCompleted = currentPhase > phaseIndex;
    final isActive = currentPhase == phaseIndex;
    final isPending = currentPhase < phaseIndex;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive
              ? color
              : (isCompleted ? Colors.green : AppColors.border),
          width: isActive ? 2 : 1,
        ),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: color.withOpacity(0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: isCompleted
                  ? AppColors.greenGradient
                  : (isActive ? LinearGradient(colors: [color, color.withOpacity(0.7)]) : null),
              color: isCompleted || isActive ? null : color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: isActive
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Icon(
                    isCompleted ? Icons.check_circle : icon,
                    color: isCompleted || isActive ? Colors.white : color,
                    size: 24,
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isActive ? color : (isCompleted ? Colors.green : Colors.black),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (isCompleted)
            const Icon(Icons.check_circle, color: Colors.green, size: 24)
          else if (isPending)
            Icon(Icons.pending_outlined, color: AppColors.grey400, size: 24),
        ],
      ),
    );
  }
}
