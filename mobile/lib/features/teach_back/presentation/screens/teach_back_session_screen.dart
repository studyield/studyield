import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/teach_back_session_entity.dart';
import '../../domain/entities/teach_back_evaluation_entity.dart';
import '../../data/models/teach_back_evaluation_model.dart';
import '../bloc/teach_back_bloc.dart';
import '../bloc/teach_back_event.dart';
import '../bloc/teach_back_state.dart';

class TeachBackSessionScreen extends StatefulWidget {
  final String sessionId;

  const TeachBackSessionScreen({super.key, required this.sessionId});

  @override
  State<TeachBackSessionScreen> createState() => _TeachBackSessionScreenState();
}

class _TeachBackSessionScreenState extends State<TeachBackSessionScreen> {
  final TextEditingController _explanationController = TextEditingController();
  final TextEditingController _challengeController = TextEditingController();
  final ScrollController _challengeScrollController = ScrollController();
  TeachBackSessionEntity? _session;
  TeachBackEvaluationEntity? _evaluation;
  String? _essentials;
  bool _showEssentials = false;
  bool _showChallenge = false;
  List<Map<String, dynamic>> _challengeMessages = [];
  bool _convinced = false;
  bool _challengeLoading = false;
  bool _submitting = false;
  bool _evaluating = false;

  @override
  void initState() {
    super.initState();
    context.read<TeachBackBloc>().add(LoadSessionDetail(sessionId: widget.sessionId));
    // Auto-load essentials
    _loadEssentials();
  }

  @override
  void dispose() {
    _explanationController.dispose();
    _challengeController.dispose();
    _challengeScrollController.dispose();
    super.dispose();
  }

  void _loadEssentials() {
    context.read<TeachBackBloc>().add(LoadEssentials(sessionId: widget.sessionId));
  }

  void _submitExplanation() {
    if (_explanationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('teach_back.messages.please_enter_explanation'.tr())),
      );
      return;
    }

    setState(() => _submitting = true);
    context.read<TeachBackBloc>().add(SubmitExplanation(
          sessionId: widget.sessionId,
          explanation: _explanationController.text.trim(),
        ));
  }

  void _evaluate() {
    setState(() => _evaluating = true);
    context.read<TeachBackBloc>().add(EvaluateExplanation(sessionId: widget.sessionId));
  }

  void _startChallenge() {
    setState(() => _showChallenge = true);
    context.read<TeachBackBloc>().add(StartChallenge(sessionId: widget.sessionId));
  }

  void _respondToChallenge() {
    if (_challengeController.text.trim().isEmpty) return;

    final message = _challengeController.text.trim();

    // Optimistically add user message to UI
    setState(() {
      _challengeMessages.add({
        'role': 'user',
        'content': message,
        'timestamp': DateTime.now().toIso8601String(),
      });
      _challengeLoading = true;
    });

    _challengeController.clear();
    _scrollChallengeToBottom();

    context.read<TeachBackBloc>().add(
      RespondToChallenge(sessionId: widget.sessionId, message: message),
    );
  }

  void _scrollChallengeToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_challengeScrollController.hasClients) {
        _challengeScrollController.animateTo(
          _challengeScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  int _getCurrentPhase() {
    if (_session == null) return 0;
    if (_session!.status == TeachBackStatus.pending) return 0;
    if (_session!.status == TeachBackStatus.submitted) return 1;
    return 2;
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
        title: Text(_session?.topic ?? 'teach_back.title'.tr()),
      ),
      body: BlocListener<TeachBackBloc, TeachBackState>(
        listener: (context, state) {
          if (state is SessionDetailLoaded) {
            setState(() {
              _session = state.session;
              if (state.session.explanation != null) {
                _explanationController.text = state.session.explanation!;
              }
              // Parse evaluation data if session is already evaluated
              if (state.session.status == TeachBackStatus.evaluated &&
                  state.session.evaluation != null) {
                try {
                  _evaluation = TeachBackEvaluationModel.fromJson(
                    state.session.evaluation!
                  ).toEntity();
                } catch (e) {
                  print('Error parsing evaluation: $e');
                }
              }
            });
          } else if (state is EssentialsLoaded) {
            setState(() {
              _essentials = state.essentials;
              _showEssentials = true;
            });
          } else if (state is ExplanationSubmitted) {
            setState(() {
              _session = state.session;
              _submitting = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('teach_back.messages.explanation_submitted'.tr()),
                backgroundColor: Colors.green,
              ),
            );
            // Reload session to get updated data
            context.read<TeachBackBloc>().add(
                  LoadSessionDetail(sessionId: widget.sessionId),
                );
          } else if (state is EvaluationLoaded) {
            setState(() {
              _evaluation = state.evaluation;
              _evaluating = false;
              // Update session status to evaluated
              if (_session != null) {
                _session = TeachBackSessionEntity(
                  id: _session!.id,
                  userId: _session!.userId,
                  topic: _session!.topic,
                  difficulty: _session!.difficulty,
                  status: TeachBackStatus.evaluated,
                  explanation: _session!.explanation,
                  evaluation: null,
                  overallScore: state.evaluation.overallScore,
                  createdAt: _session!.createdAt,
                  updatedAt: DateTime.now(),
                );
              }
            });
          } else if (state is ChallengeStarted) {
            setState(() {
              _challengeMessages = state.messages;
              _challengeLoading = false;
            });
            _scrollChallengeToBottom();
          } else if (state is ChallengeResponseReceived) {
            setState(() {
              _challengeMessages = state.messages;
              _convinced = state.convinced;
              _challengeLoading = false;
            });
            _scrollChallengeToBottom();
          } else if (state is TeachBackError) {
            setState(() {
              _challengeLoading = false;
              _submitting = false;
              _evaluating = false;
            });
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
            : Column(
                children: [
                  // Progress indicator
                  _buildProgressIndicator(),

                  // Phase content
                  Expanded(
                    child: _buildPhaseContent(),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    final currentPhase = _getCurrentPhase();

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildPhaseStep(0, 'teach_back.progress.phase_explain'.tr(), currentPhase >= 0, currentPhase > 0),
          Expanded(
            child: Container(
              height: 2,
              color: currentPhase > 0 ? AppColors.secondary : AppColors.grey300,
            ),
          ),
          _buildPhaseStep(1, 'teach_back.progress.phase_submit'.tr(), currentPhase >= 1, currentPhase > 1),
          Expanded(
            child: Container(
              height: 2,
              color: currentPhase > 1 ? AppColors.secondary : AppColors.grey300,
            ),
          ),
          _buildPhaseStep(2, 'teach_back.progress.phase_evaluate'.tr(), currentPhase >= 2, currentPhase > 2),
        ],
      ),
    );
  }

  Widget _buildPhaseStep(int step, String label, bool isActive, bool isCompleted) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            gradient: isCompleted
                ? AppColors.greenGradient
                : (isActive ? LinearGradient(
                    colors: [AppColors.purple, AppColors.purple.withOpacity(0.8)],
                  ) : null),
            color: isCompleted || isActive ? null : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: isCompleted
                  ? AppColors.secondary
                  : (isActive ? AppColors.purple : AppColors.grey300),
              width: isActive ? 3 : 2,
            ),
            boxShadow: isActive || isCompleted
                ? [
                    BoxShadow(
                      color: (isCompleted ? AppColors.secondary : AppColors.purple)
                          .withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, color: Colors.white, size: 18)
                : Text(
                    '${step + 1}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: isActive ? Colors.white : AppColors.grey400,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive || isCompleted ? FontWeight.w600 : FontWeight.normal,
            color: isActive ? AppColors.purple : (isCompleted ? AppColors.secondary : AppColors.grey400),
          ),
        ),
      ],
    );
  }

  Widget _buildPhaseContent() {
    final phase = _getCurrentPhase();

    if (phase == 0) {
      return _buildExplainPhase();
    } else if (phase == 1) {
      return _buildSubmitPhase();
    } else {
      return _buildEvaluatePhase();
    }
  }

  Widget _buildExplainPhase() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Essentials card (always shown, loads automatically)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7), // Light yellow/cream
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.lightbulb_outline, color: Color(0xFFF59E0B), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'teach_back.session.essentials_title'.tr(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (_essentials != null) ...[
                  Text(
                    _essentials!,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: Colors.black87,
                    ),
                  ),
                ] else ...[
                  TextButton.icon(
                    onPressed: _loadEssentials,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: Text('teach_back.session.load_essentials'.tr()),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFFF59E0B),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Who are you explaining to?
          Text(
            'teach_back.session.who_explaining'.tr(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildDifficultyCard(
                  '👶',
                  'teach_back.session.difficulty_eli5'.tr(),
                  'teach_back.session.difficulty_eli5_desc'.tr(),
                  'eli5',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDifficultyCard(
                  '🎓',
                  'teach_back.session.difficulty_classmate'.tr(),
                  'teach_back.session.difficulty_classmate_desc'.tr(),
                  'classmate',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDifficultyCard(
                  '👨‍🏫',
                  'teach_back.session.difficulty_expert'.tr(),
                  'teach_back.session.difficulty_expert_desc'.tr(),
                  'expert',
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Explanation input
          Text(
            'teach_back.session.explanation_title'.tr(),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _explanationController,
            maxLines: 12,
            decoration: InputDecoration(
              hintText: 'teach_back.session.explanation_hint'.tr(),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'teach_back.session.characters_count'.tr(namedArgs: {'count': _explanationController.text.length.toString()}),
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),

          // Submit button
          PrimaryButton(
            text: _submitting ? 'teach_back.session.submitting'.tr() : 'teach_back.session.submit_explanation'.tr(),
            onPressed: _submitting ? null : _submitExplanation,
            isLoading: _submitting,
            icon: Icons.send,
            gradient: AppColors.greenGradient,
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitPhase() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Instruction
          Text(
            'teach_back.session.review_explanation'.tr(),
            style: const TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // Your Explanation card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'teach_back.session.explanation_title'.tr(),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _session!.explanation ?? _explanationController.text,
                  style: const TextStyle(
                    fontSize: 15,
                    height: 1.7,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'teach_back.session.characters_count'.tr(namedArgs: {'count': (_session!.explanation ?? _explanationController.text).length.toString()}),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action buttons
          Row(
            children: [
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: _evaluating ? null : _evaluate,
                  icon: _evaluating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.psychology, size: 20),
                  label: Text(_evaluating ? 'teach_back.session.evaluating'.tr() : 'teach_back.session.evaluate_button'.tr()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _showChallenge ? null : _startChallenge,
                  icon: const Icon(Icons.bolt, size: 18),
                  label: Text('teach_back.session.challenge_button'.tr()),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.purple,
                    side: const BorderSide(color: AppColors.purple),
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Challenge Mode UI
          if (_showChallenge) ...[
            const SizedBox(height: 24),
            _buildChallengeMode(),
          ],
        ],
      ),
    );
  }

  Widget _buildChallengeMode() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        border: Border.all(color: Colors.orange.shade200, width: 2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.shade100,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                const Icon(Icons.bolt, color: Colors.orange, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'teach_back.session.convince_ai_title'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'teach_back.session.convince_ai_desc'.tr(),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_convinced)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          'teach_back.session.convinced_badge'.tr(),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Messages
          Container(
            constraints: const BoxConstraints(maxHeight: 320),
            padding: const EdgeInsets.all(16),
            child: ListView.builder(
              controller: _challengeScrollController,
              itemCount: _challengeMessages.length + (_challengeLoading ? 1 : 0),
              itemBuilder: (context, index) {
                // Show typing indicator at the end when loading
                if (index == _challengeMessages.length && _challengeLoading) {
                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12).copyWith(
                          bottomLeft: const Radius.circular(4),
                        ),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.orange.shade400),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'teach_back.session.thinking'.tr(),
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final message = _challengeMessages[index];
                final isUser = message['role'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.purple : Colors.white,
                      borderRadius: BorderRadius.circular(12).copyWith(
                        bottomRight: isUser ? const Radius.circular(4) : null,
                        bottomLeft: isUser ? null : const Radius.circular(4),
                      ),
                      border: isUser ? null : Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!isUser)
                          Row(
                            children: [
                              const Icon(Icons.forum, size: 12, color: Colors.orange),
                              const SizedBox(width: 4),
                              Text(
                                'teach_back.session.skeptical_student'.tr(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange,
                                ),
                              ),
                            ],
                          ),
                        if (!isUser) const SizedBox(height: 4),
                        Text(
                          message['content'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            color: isUser ? Colors.white : Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Input (if not convinced)
          if (!_convinced)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(14)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _challengeController,
                      decoration: InputDecoration(
                        hintText: 'teach_back.session.defend_hint'.tr(),
                        border: const OutlineInputBorder(),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        isDense: true,
                      ),
                      onSubmitted: (_) => _respondToChallenge(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _respondToChallenge,
                    icon: const Icon(Icons.send),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.purple,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEvaluatePhase() {
    if (_evaluation == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // XP Reward Banner
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7), // Cream/yellow
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.celebration, color: Color(0xFFF59E0B), size: 20),
                const SizedBox(width: 8),
                Text(
                  'teach_back.evaluation.xp_earned'.tr(),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange[800],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Overall score (Large purple circle)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    color: AppColors.purple,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.purple.withOpacity(0.3),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '${_evaluation!.overallScore.toInt()}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 64,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'teach_back.evaluation.overall_score'.tr(),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _getScoreLabel(_evaluation!.overallScore),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Radar Chart
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Text(
                  'teach_back.evaluation.score_breakdown'.tr(),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 300,
                  child: RadarChart(
                    RadarChartData(
                      radarShape: RadarShape.polygon,
                      tickCount: 5,
                      ticksTextStyle: const TextStyle(fontSize: 10, color: Colors.transparent),
                      radarBackgroundColor: AppColors.purple.withOpacity(0.05),
                      radarBorderData: BorderSide(color: AppColors.purple.withOpacity(0.2)),
                      gridBorderData: BorderSide(color: AppColors.grey300, width: 1),
                      tickBorderData: const BorderSide(color: Colors.transparent),
                      titlePositionPercentageOffset: 0.12,
                      dataSets: [
                        // Invisible min reference (0) to set scale minimum
                        RadarDataSet(
                          fillColor: Colors.transparent,
                          borderColor: Colors.transparent,
                          borderWidth: 0,
                          entryRadius: 0,
                          dataEntries: const [
                            RadarEntry(value: 0),
                            RadarEntry(value: 0),
                            RadarEntry(value: 0),
                            RadarEntry(value: 0),
                          ],
                        ),
                        // Invisible max reference (100) to set scale maximum
                        RadarDataSet(
                          fillColor: Colors.transparent,
                          borderColor: Colors.transparent,
                          borderWidth: 0,
                          entryRadius: 0,
                          dataEntries: const [
                            RadarEntry(value: 100),
                            RadarEntry(value: 100),
                            RadarEntry(value: 100),
                            RadarEntry(value: 100),
                          ],
                        ),
                        // Actual data - MUST be last to render on top
                        RadarDataSet(
                          fillColor: AppColors.purple.withOpacity(0.25),
                          borderColor: AppColors.purple,
                          borderWidth: 3,
                          entryRadius: 5,
                          dataEntries: [
                            RadarEntry(value: _evaluation!.accuracy.score),
                            RadarEntry(value: _evaluation!.clarity.score),
                            RadarEntry(value: _evaluation!.completeness.score),
                            RadarEntry(value: _evaluation!.understanding.score),
                          ],
                        ),
                      ],
                      titleTextStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      getTitle: (index, angle) {
                        switch (index) {
                          case 0:
                            return RadarChartTitle(
                              text: '${'teach_back.evaluation.accuracy'.tr()}\n${_evaluation!.accuracy.score.toInt()}%',
                              angle: 0,
                            );
                          case 1:
                            return RadarChartTitle(
                              text: '${'teach_back.evaluation.clarity'.tr()}\n${_evaluation!.clarity.score.toInt()}%',
                              angle: 0,
                            );
                          case 2:
                            return RadarChartTitle(
                              text: '${'teach_back.evaluation.completeness'.tr()}\n${_evaluation!.completeness.score.toInt()}%',
                              angle: 0,
                            );
                          case 3:
                            return RadarChartTitle(
                              text: '${'teach_back.evaluation.understanding'.tr()}\n${_evaluation!.understanding.score.toInt()}%',
                              angle: 0,
                            );
                          default:
                            return const RadarChartTitle(text: '');
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Detailed Metric cards (full width with feedback)
          _buildDetailedMetricCard(_evaluation!.accuracy, Colors.green),
          const SizedBox(height: 12),
          _buildDetailedMetricCard(_evaluation!.clarity, Colors.blue),
          const SizedBox(height: 12),
          _buildDetailedMetricCard(_evaluation!.completeness, Colors.orange),
          const SizedBox(height: 12),
          _buildDetailedMetricCard(_evaluation!.understanding, AppColors.purple),
          const SizedBox(height: 24),

          // Strengths (green background)
          if (_evaluation!.strengths.isNotEmpty) ...[
            _buildFeedbackSection(
              'teach_back.evaluation.strengths'.tr(),
              _evaluation!.strengths,
              Icons.check_circle,
              Colors.green,
              backgroundColor: const Color(0xFFDCFCE7), // Light green
            ),
            const SizedBox(height: 16),
          ],

          // How to Improve (yellow background)
          if (_evaluation!.misconceptions.isNotEmpty || _evaluation!.suggestions.isNotEmpty) ...[
            _buildFeedbackSection(
              'teach_back.evaluation.improve'.tr(),
              [..._evaluation!.misconceptions, ..._evaluation!.suggestions],
              Icons.lightbulb_outline,
              const Color(0xFFF59E0B), // Orange
              backgroundColor: const Color(0xFFFEF3C7), // Cream
            ),
            const SizedBox(height: 16),
          ],

          // Deepen Your Understanding
          if (_evaluation!.followUpQuestions.isNotEmpty) ...[
            _buildFeedbackSection(
              'teach_back.evaluation.deepen'.tr(),
              _evaluation!.followUpQuestions,
              Icons.psychology_outlined,
              Colors.blue,
              backgroundColor: const Color(0xFFE0F2FE), // Light blue
            ),
          ],

          const SizedBox(height: 32),

          // Action buttons (matching web)
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _explanationController.clear();
                      _evaluation = null;
                    });
                    context.read<TeachBackBloc>().add(
                          LoadSessionDetail(sessionId: widget.sessionId),
                        );
                  },
                  icon: const Icon(Icons.refresh),
                  label: Text('teach_back.evaluation.try_again'.tr()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: AppColors.border),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.school),
                  label: Text('teach_back.evaluation.new_topic'.tr()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(MetricScore metric) {
    Color color;
    if (metric.score >= 80) {
      color = Colors.green;
    } else if (metric.score >= 60) {
      color = Colors.amber;
    } else {
      color = Colors.red;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(_getMetricIcon(metric.metric), color: color, size: 20),
              Text(
                '${metric.score.toInt()}',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            metric.metric,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: metric.score / 100,
              minHeight: 6,
              backgroundColor: AppColors.grey200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDifficultyCard(
    String emoji,
    String title,
    String subtitle,
    String value,
  ) {
    final isSelected = _session?.difficulty == value;

    return InkWell(
      onTap: () {
        // Can't change difficulty after creation
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.purple : AppColors.border,
            width: isSelected ? 3 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.purple.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Column(
          children: [
            Text(
              emoji,
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                color: isSelected ? AppColors.purple : Colors.black,
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
            ),
          ],
        ),
      ),
    );
  }

  IconData _getMetricIcon(String metric) {
    switch (metric.toLowerCase()) {
      case 'accuracy':
        return Icons.check_circle_outline;
      case 'clarity':
        return Icons.visibility;
      case 'completeness':
        return Icons.checklist;
      case 'understanding':
        return Icons.psychology;
      default:
        return Icons.star;
    }
  }

  Widget _buildDetailedMetricCard(MetricScore metric, Color color) {
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
            children: [
              Icon(_getMetricIcon(metric.metric), color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                metric.metric,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Text(
                '${metric.score.toInt()}%',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: metric.score / 100,
              minHeight: 10,
              backgroundColor: AppColors.grey200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            metric.feedback,
            style: const TextStyle(
              fontSize: 13,
              height: 1.6,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  String _getScoreLabel(double score) {
    if (score >= 90) return 'teach_back.evaluation.score_excellent'.tr();
    if (score >= 75) return 'teach_back.evaluation.score_good'.tr();
    if (score >= 60) return 'teach_back.evaluation.score_fair'.tr();
    return 'teach_back.evaluation.score_needs_improvement'.tr();
  }

  Widget _buildFeedbackSection(
    String title,
    List<String> items,
    IconData icon,
    Color color, {
    Color? backgroundColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...items.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      title == 'teach_back.evaluation.strengths'.tr() ? Icons.check : Icons.circle,
                      size: title == 'teach_back.evaluation.strengths'.tr() ? 18 : 8,
                      color: color,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        item,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.6,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
