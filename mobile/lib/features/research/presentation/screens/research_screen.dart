import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/research_session_entity.dart';
import '../bloc/research_bloc.dart';
import '../bloc/research_event.dart';
import '../bloc/research_state.dart';
import 'research_progress_screen.dart';
import 'research_report_screen.dart';

class ResearchScreen extends StatefulWidget {
  const ResearchScreen({super.key});

  @override
  State<ResearchScreen> createState() => _ResearchScreenState();
}

class _ResearchScreenState extends State<ResearchScreen> {
  final TextEditingController _queryController = TextEditingController();
  String _depth = 'standard';
  Set<String> _sourceTypes = {'documents'};
  String _outputFormat = 'detailed';
  List<ResearchSessionEntity> _recentSessions = [];

  @override
  void initState() {
    super.initState();
    context.read<ResearchBloc>().add(const LoadResearchSessions());
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  void _startResearch() {
    if (_queryController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('research.messages.please_enter_query'.tr())),
      );
      return;
    }

    context.read<ResearchBloc>().add(CreateResearchSession(
          query: _queryController.text.trim(),
          depth: _depth,
          sourceTypes: _sourceTypes.toList(),
          outputFormat: _outputFormat,
        ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.cardLight,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: AppColors.secondaryGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.science_rounded, color: AppColors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              'research.title'.tr(),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
      body: BlocListener<ResearchBloc, ResearchState>(
        listener: (context, state) {
          if (state is ResearchSessionsLoaded) {
            setState(() => _recentSessions = state.sessions);
          } else if (state is ResearchSessionCreated) {
            // Start research and navigate to progress screen
            context.read<ResearchBloc>().add(StartResearch(sessionId: state.session.id));

            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ResearchBloc>(),
                  child: ResearchProgressScreen(sessionId: state.session.id),
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero section with gradient
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.secondary.withOpacity(0.1),
                      AppColors.secondaryLight.withOpacity(0.05),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.secondary.withOpacity(0.2),
                    width: 1.5,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: AppColors.secondaryGradient,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.secondary.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.psychology, color: AppColors.white, size: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'research.form.ai_powered_research'.tr(),
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'research.form.deep_dive_topic'.tr(),
                                style: TextStyle(
                                  fontSize: 13,
                                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _queryController,
                      maxLines: 3,
                      style: TextStyle(fontSize: 15, color: theme.colorScheme.onSurface),
                      decoration: InputDecoration(
                        hintText: 'research.form.query_hint'.tr(),
                        hintStyle: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.4), fontSize: 14),
                        filled: true,
                        fillColor: AppColors.cardLight,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.all(16),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Options section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.cardLight,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Source types
                    _buildSectionTitle('research.sections.source_types'.tr()),
                    const SizedBox(height: 12),
                    _buildSourceTypeSelector(),

                    const SizedBox(height: 20),

                    // Depth
                    _buildSectionTitle('research.sections.research_depth'.tr()),
                    const SizedBox(height: 12),
                    _buildDepthSelector(),

                    const SizedBox(height: 20),

                    // Output format
                    _buildSectionTitle('research.sections.output_format'.tr()),
                    const SizedBox(height: 12),
                    _buildOutputFormatSelector(),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Start button
              BlocBuilder<ResearchBloc, ResearchState>(
                builder: (context, state) {
                  final isLoading = state is ResearchLoading;
                  return Container(
                    decoration: BoxDecoration(
                      gradient: AppColors.greenGradient,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Material(
                      color: AppColors.transparent,
                      child: InkWell(
                        onTap: isLoading ? null : _startResearch,
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (isLoading)
                                const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: AppColors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              else
                                const Icon(Icons.rocket_launch_rounded, color: AppColors.white, size: 22),
                              const SizedBox(width: 12),
                              Text(
                                isLoading ? 'research.messages.creating'.tr() : 'research.buttons.start_research'.tr(),
                                style: const TextStyle(
                                  color: AppColors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),

              // Recent sessions
              if (_recentSessions.isNotEmpty) ...[
                const SizedBox(height: 40),
                Row(
                  children: [
                    Icon(Icons.history_rounded, size: 20, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                    const SizedBox(width: 8),
                    Text(
                      'research.recent.title'.tr(),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ..._recentSessions.take(5).map((session) => _buildRecentCard(session)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: AppColors.textPrimary,
        letterSpacing: 0.3,
      ),
    );
  }

  Widget _buildSourceTypeSelector() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _buildToggleChip('research.source_types.documents'.tr(), 'documents', Icons.folder),
        _buildToggleChip('research.source_types.web'.tr(), 'web', Icons.public),
        _buildToggleChip('research.source_types.academic'.tr(), 'academic', Icons.school),
      ],
    );
  }

  Widget _buildToggleChip(String label, String value, IconData icon) {
    final isSelected = _sourceTypes.contains(value);

    return InkWell(
      onTap: () {
        setState(() {
          if (isSelected) {
            _sourceTypes.remove(value);
          } else {
            _sourceTypes.add(value);
          }
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.greenGradient : null,
          color: isSelected ? null : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.transparent : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.white : AppColors.textPrimary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.white : AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDepthSelector() {
    return Row(
      children: [
        Expanded(child: _buildOptionButton('research.depth.quick'.tr(), 'quick', _depth)),
        const SizedBox(width: 8),
        Expanded(child: _buildOptionButton('research.depth.standard'.tr(), 'standard', _depth)),
        const SizedBox(width: 8),
        Expanded(child: _buildOptionButton('research.depth.comprehensive'.tr(), 'comprehensive', _depth)),
      ],
    );
  }

  Widget _buildOutputFormatSelector() {
    return Row(
      children: [
        Expanded(child: _buildOptionButton('research.output_format.detailed'.tr(), 'detailed', _outputFormat)),
        const SizedBox(width: 8),
        Expanded(child: _buildOptionButton('research.output_format.summary'.tr(), 'summary', _outputFormat)),
        const SizedBox(width: 8),
        Expanded(child: _buildOptionButton('research.output_format.bullets'.tr(), 'bullets', _outputFormat)),
      ],
    );
  }

  Widget _buildOptionButton(String label, String value, String currentValue) {
    final isSelected = currentValue == value;

    return InkWell(
      onTap: () {
        setState(() {
          if (currentValue == _depth) {
            _depth = value;
          } else {
            _outputFormat = value;
          }
        });
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.secondary.withOpacity(0.1) : AppColors.cardLight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.secondary : AppColors.borderLight,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            color: isSelected ? AppColors.secondary : AppColors.textPrimary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildRecentCard(ResearchSessionEntity session) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: AppColors.secondaryGradient,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: AppColors.secondary.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.science_rounded, color: AppColors.white, size: 24),
        ),
        title: Text(
          session.query,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(
            children: [
              Icon(Icons.access_time, size: 14, color: AppColors.primary.withOpacity(0.6)),
              const SizedBox(width: 4),
              Text(
                _formatDate(session.createdAt),
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.primary.withOpacity(0.8),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        trailing: _buildStatusBadge(session.status),
        onTap: () {
          if (session.status == ResearchStatus.completed) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ResearchBloc>(),
                  child: ResearchReportScreen(sessionId: session.id),
                ),
              ),
            );
          } else if (session.status != ResearchStatus.failed) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ResearchBloc>(),
                  child: ResearchProgressScreen(sessionId: session.id),
                ),
              ),
            );
          }
        },
      ),
    );
  }

  Widget _buildStatusBadge(ResearchStatus status) {
    Color color;
    String text;

    switch (status) {
      case ResearchStatus.completed:
        color = Colors.green;
        text = 'research.recent.done'.tr();
        break;
      case ResearchStatus.failed:
        color = Colors.red;
        text = 'research.recent.failed'.tr();
        break;
      default:
        color = Colors.amber;
        text = 'research.recent.in_progress'.tr();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) return 'research.date.today'.tr();
    if (diff.inDays == 1) return 'research.date.yesterday'.tr();
    if (diff.inDays < 7) return 'research.date.days_ago'.tr(namedArgs: {'days': diff.inDays.toString()});
    return '${date.day}/${date.month}/${date.year}';
  }
}
