import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/teach_back_session_entity.dart';
import '../../../study_sets/domain/entities/study_set_entity.dart';
import '../bloc/teach_back_bloc.dart';
import '../bloc/teach_back_event.dart';
import '../bloc/teach_back_state.dart';
import 'teach_back_session_screen.dart';

class TeachBackScreen extends StatefulWidget {
  const TeachBackScreen({super.key});

  @override
  State<TeachBackScreen> createState() => _TeachBackScreenState();
}

class _TeachBackScreenState extends State<TeachBackScreen> {
  final TextEditingController _topicController = TextEditingController();
  final TextEditingController _referenceController = TextEditingController();
  String _difficulty = 'classmate';
  bool _showCreatePanel = false;
  String _createMode = 'topic'; // 'topic' or 'study_set'
  List<TeachBackSessionEntity> _sessions = [];
  List<StudySetEntity> _studySets = [];
  bool _studySetsLoading = false;
  String? _selectedStudySetId;

  final List<String> _quickPicks = [
    'Pythagorean Theorem',
    'Photosynthesis',
    'Newton\'s Laws of Motion',
    'Supply and Demand',
    'DNA Replication',
    'Quadratic Formula',
    'Ohm\'s Law',
    'Cell Division (Mitosis)',
  ];

  @override
  void initState() {
    super.initState();
    context.read<TeachBackBloc>().add(const LoadTeachBackSessions());
  }

  @override
  void dispose() {
    _topicController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  void _createSession() {
    if (_topicController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('teach_back.messages.please_enter_topic'.tr())),
      );
      return;
    }

    context.read<TeachBackBloc>().add(CreateTeachBackSession(
          topic: _topicController.text.trim(),
          difficulty: _difficulty,
          referenceMaterial: _referenceController.text.trim().isEmpty
              ? null
              : _referenceController.text.trim(),
        ));
  }

  Future<void> _loadStudySets() async {
    if (_studySets.isNotEmpty) return;

    setState(() => _studySetsLoading = true);
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/study-sets?limit=100');
      final data = response.data;
      final items = (data is Map ? data['data'] : data) as List<dynamic>;

      setState(() {
        _studySets = items.map((item) {
          final map = item as Map<String, dynamic>;
          return StudySetEntity.fromJson(map);
        }).toList();
      });
    } catch (e) {
      print('Error loading study sets: $e');
    } finally {
      setState(() => _studySetsLoading = false);
    }
  }

  void _createFromStudySet() {
    if (_selectedStudySetId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('teach_back.messages.please_select_study_set'.tr())),
      );
      return;
    }

    context.read<TeachBackBloc>().add(CreateTeachBackFromStudySet(
          studySetId: _selectedStudySetId!,
        ));
  }

  Color _getScoreColor(double? score) {
    if (score == null) return AppColors.grey400;
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.amber;
    return Colors.red;
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
        title: Text('teach_back.title'.tr()),
      ),
      body: BlocListener<TeachBackBloc, TeachBackState>(
        listener: (context, state) {
          if (state is TeachBackSessionsLoaded) {
            setState(() => _sessions = state.sessions);
          } else if (state is TeachBackSessionCreated) {
            _topicController.clear();
            _referenceController.clear();
            setState(() => _showCreatePanel = false);

            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<TeachBackBloc>(),
                  child: TeachBackSessionScreen(sessionId: state.session.id),
                ),
              ),
            );
          } else if (state is TeachBackSessionDeleted) {
            context.read<TeachBackBloc>().add(const LoadTeachBackSessions());
          } else if (state is TeachBackError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: BlocBuilder<TeachBackBloc, TeachBackState>(
          builder: (context, state) {
            final isLoading = state is TeachBackLoading;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // How it works (Feynman Technique)
                  _buildHowItWorks(),
                  const SizedBox(height: 20),

                  // Create toggle
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() => _showCreatePanel = !_showCreatePanel);
                    },
                    icon: Icon(_showCreatePanel ? Icons.close : Icons.add),
                    label: Text(_showCreatePanel ? 'teach_back.form.cancel'.tr() : 'teach_back.title'.tr()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                    ),
                  ),

                  // Create form
                  if (_showCreatePanel) ...[
                    const SizedBox(height: 16),
                    _buildCreateForm(isLoading),
                  ],

                  const SizedBox(height: 24),

                  // Sessions list
                  if (_sessions.isEmpty && !isLoading)
                    _buildEmptyState()
                  else
                    ..._sessions.map((session) => _buildSessionCard(session)),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHowItWorks() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFDCFCE7), // Light green background
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology_outlined, color: AppColors.secondary, size: 20),
              const SizedBox(width: 8),
              Text(
                'teach_back.feynman.title'.tr(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildFeynmanStep('1', 'teach_back.feynman.step1'.tr(), 'teach_back.feynman.step1_desc'.tr())),
              const SizedBox(width: 12),
              Expanded(child: _buildFeynmanStep('2', 'teach_back.feynman.step2'.tr(), 'teach_back.feynman.step2_desc'.tr())),
              const SizedBox(width: 12),
              Expanded(child: _buildFeynmanStep('3', 'teach_back.feynman.step3'.tr(), 'teach_back.feynman.step3_desc'.tr())),
              const SizedBox(width: 12),
              Expanded(child: _buildFeynmanStep('4', 'teach_back.feynman.step4'.tr(), 'teach_back.feynman.step4_desc'.tr())),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeynmanStep(String number, String title, String subtitle) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.secondary.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: AppColors.secondary,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
      ],
    );
  }

  Widget _buildCreateForm(bool isLoading) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Mode tabs
          Row(
            children: [
              Expanded(child: _buildModeTab('teach_back.form.mode_topic'.tr(), 'topic', Icons.edit)),
              const SizedBox(width: 12),
              Expanded(child: _buildModeTab('teach_back.form.mode_study_set'.tr(), 'study_set', Icons.collections_bookmark)),
            ],
          ),
          const SizedBox(height: 20),

          if (_createMode == 'topic') ...[
            // Topic input
            Text(
              'teach_back.form.topic_label'.tr(),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _topicController,
              decoration: InputDecoration(
                hintText: 'teach_back.form.topic_hint'.tr(),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: AppColors.grey50,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
            const SizedBox(height: 16),

            // Quick picks
            Text(
              'teach_back.form.quick_picks'.tr(),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickPicks.map((topic) {
                return InkWell(
                  onTap: () => setState(() => _topicController.text = topic),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.purple.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.purple.withOpacity(0.3)),
                    ),
                    child: Text(
                      topic,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.purple,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Reference material
            Text(
              'teach_back.form.reference_label'.tr(),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _referenceController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'teach_back.form.reference_hint'.tr(),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                filled: true,
                fillColor: AppColors.grey50,
              ),
            ),
          ] else ...[
            // From Study Set
            Text(
              'teach_back.form.study_set_label'.tr(),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            if (_studySetsLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_studySets.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    'teach_back.messages.no_study_sets'.tr(),
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              Container(
                constraints: const BoxConstraints(maxHeight: 240),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _studySets.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final studySet = _studySets[index];
                    final isSelected = _selectedStudySetId == studySet.id;

                    return InkWell(
                      onTap: () {
                        setState(() => _selectedStudySetId = studySet.id);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        color: isSelected
                            ? AppColors.purple.withOpacity(0.1)
                            : Colors.transparent,
                        child: Row(
                          children: [
                            Icon(
                              Icons.collections_bookmark,
                              color: isSelected ? AppColors.purple : AppColors.grey400,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    studySet.title,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                      color: isSelected ? AppColors.purple : Colors.black87,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'teach_back.form.cards_count'.tr(namedArgs: {'count': studySet.flashcardsCount.toString()}),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle,
                                color: AppColors.purple,
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],

          const SizedBox(height: 20),

          // Buttons
          Row(
            children: [
              Expanded(
                child: PrimaryButton(
                  text: isLoading
                      ? (_createMode == 'study_set' ? 'teach_back.form.generating'.tr() : 'teach_back.form.creating'.tr())
                      : (_createMode == 'study_set' ? 'teach_back.form.generate_start'.tr() : 'teach_back.form.start_teaching'.tr()),
                  onPressed: isLoading
                      ? null
                      : (_createMode == 'study_set' ? _createFromStudySet : _createSession),
                  icon: _createMode == 'study_set' ? Icons.bolt : Icons.school,
                  gradient: AppColors.greenGradient,
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton(
                onPressed: () {
                  setState(() {
                    _showCreatePanel = false;
                    _topicController.clear();
                    _referenceController.clear();
                    _selectedStudySetId = null;
                  });
                },
                child: Text('teach_back.form.cancel'.tr()),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModeTab(String label, String mode, IconData icon) {
    final isSelected = _createMode == mode;

    return InkWell(
      onTap: () {
        setState(() => _createMode = mode);
        if (mode == 'study_set') {
          _loadStudySets();
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.purple : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? AppColors.purple : AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: isSelected ? Colors.white : AppColors.textPrimary),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
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
          const Icon(Icons.school, size: 64, color: AppColors.grey400),
          const SizedBox(height: 16),
          Text(
            'teach_back.empty_state.title'.tr(),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            'teach_back.empty_state.subtitle'.tr(),
            style: const TextStyle(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSessionCard(TeachBackSessionEntity session) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: _getScoreColor(session.overallScore).withOpacity(0.1),
            shape: BoxShape.circle,
            border: Border.all(
              color: _getScoreColor(session.overallScore),
              width: 3,
            ),
          ),
          child: Center(
            child: Text(
              session.overallScore != null
                  ? '${session.overallScore!.toInt()}'
                  : '—',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: _getScoreColor(session.overallScore),
              ),
            ),
          ),
        ),
        title: Text(
          session.topic,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getDifficultyColor(session.difficulty).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'teach_back.difficulty.${session.difficulty.toLowerCase()}'.tr(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _getDifficultyColor(session.difficulty),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(session.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _getStatusLabel(session.status),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(session.status),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.red),
          onPressed: () {
            context.read<TeachBackBloc>().add(
                  DeleteTeachBackSession(sessionId: session.id),
                );
          },
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => BlocProvider.value(
                value: context.read<TeachBackBloc>(),
                child: TeachBackSessionScreen(sessionId: session.id),
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'eli5':
        return Colors.green;
      case 'classmate':
        return Colors.blue;
      case 'expert':
        return Colors.purple;
      default:
        return AppColors.grey600;
    }
  }

  Color _getStatusColor(TeachBackStatus status) {
    switch (status) {
      case TeachBackStatus.pending:
        return Colors.amber;
      case TeachBackStatus.submitted:
        return Colors.blue;
      case TeachBackStatus.evaluated:
        return Colors.green;
    }
  }

  String _getStatusLabel(TeachBackStatus status) {
    switch (status) {
      case TeachBackStatus.pending:
        return 'teach_back.status.pending'.tr();
      case TeachBackStatus.submitted:
        return 'teach_back.status.submitted'.tr();
      case TeachBackStatus.evaluated:
        return 'teach_back.status.evaluated'.tr();
    }
  }
}
