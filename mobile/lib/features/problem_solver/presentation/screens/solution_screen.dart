import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/content/code_block_widget.dart';
import '../../../../core/widgets/content/latex_text_widget.dart';
import '../../../../core/widgets/graphs/interactive_graph_widget.dart';
import '../../../../core/widgets/media/tts_controls_widget.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../../domain/entities/code_block_entity.dart';
import '../../domain/entities/alternative_method_entity.dart';
import '../../domain/entities/citation_entity.dart';
import '../../domain/entities/graph_data_entity.dart';
import '../../domain/entities/complexity_explanation_entity.dart';
import '../../domain/entities/narration_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import '../widgets/complexity_selector_widget.dart';
import '../widgets/alternative_method_card_widget.dart';
import '../widgets/citation_card_widget.dart';
import 'hints_screen.dart';
import 'similar_problems_screen.dart';
import 'practice_quiz_screen.dart';
import 'study_buddy_chat_screen.dart';
import 'concept_map_screen.dart';
import 'formula_cards_screen.dart';

class SolutionScreen extends StatefulWidget {
  final String sessionId;

  const SolutionScreen({super.key, required this.sessionId});

  @override
  State<SolutionScreen> createState() => _SolutionScreenState();
}

class _SolutionScreenState extends State<SolutionScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  ProblemSessionEntity? _session;
  bool _isBookmarked = false;
  String? _expandedStep;

  // New state variables for Phase 1 features
  List<CodeBlockEntity> _codeBlocks = [];
  List<AlternativeMethodEntity> _alternativeMethods = [];
  List<CitationEntity> _citations = [];
  GraphDataEntity? _graphData;
  ComplexityExplanationEntity? _currentExplanation;
  ExplanationLevel _explanationLevel = ExplanationLevel.beginner;
  NarrationEntity? _narration;
  bool _isLoadingExplanation = false;
  bool _hasLoadedGraph = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _tabController.addListener(_onTabChanged);
    context.read<ProblemSolverBloc>().add(LoadSession(sessionId: widget.sessionId));

    // Load initial data
    _loadInitialData();
  }

  void _loadInitialData() {
    // Load code blocks, alternative methods, and citations on startup
    context.read<ProblemSolverBloc>().add(LoadCodeBlocks(sessionId: widget.sessionId));
    context.read<ProblemSolverBloc>().add(LoadAlternativeMethods(sessionId: widget.sessionId));
    context.read<ProblemSolverBloc>().add(LoadCitations(sessionId: widget.sessionId));
    // Load default explanation level
    context.read<ProblemSolverBloc>().add(LoadExplanation(
      sessionId: widget.sessionId,
      level: 'beginner',
    ));
    // Load narration
    context.read<ProblemSolverBloc>().add(LoadNarration(sessionId: widget.sessionId));
  }

  void _onTabChanged() {
    // Lazy load graph data when Graph tab is selected
    if (_tabController.index == 3 && !_hasLoadedGraph) {
      context.read<ProblemSolverBloc>().add(LoadGraphData(sessionId: widget.sessionId));
      setState(() => _hasLoadedGraph = true);
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onExplanationLevelChanged(ExplanationLevel level) {
    setState(() {
      _explanationLevel = level;
      _isLoadingExplanation = true;
    });

    final levelString = level.toString().split('.').last;
    context.read<ProblemSolverBloc>().add(LoadExplanation(
      sessionId: widget.sessionId,
      level: levelString,
    ));
  }

  void _generateNarration() {
    context.read<ProblemSolverBloc>().add(GenerateNarration(sessionId: widget.sessionId));
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
        title: Text('problem_solver.solution.title'.tr()),
        actions: [
          // TTS button - always show, use solution text if narration unavailable
          IconButton(
            icon: Icon(
              (_narration != null && _narration!.status == 'ready')
                  ? Icons.volume_up
                  : Icons.volume_up_outlined,
            ),
            color: (_narration != null && _narration!.status == 'ready')
                ? AppColors.purple
                : null,
            onPressed: () {
              if (_narration != null && _narration!.status == 'ready') {
                _showTtsDialog();
              } else {
                // Use solution text as fallback
                _showTtsWithSolutionText();
              }
            },
            tooltip: 'problem_solver.solution.narration.listen_tooltip'.tr(),
          ),
          IconButton(
            icon: Icon(_isBookmarked ? Icons.bookmark : Icons.bookmark_border),
            color: _isBookmarked ? const Color(0xFF3B82F6) : null,
            onPressed: () {
              context
                  .read<ProblemSolverBloc>()
                  .add(ToggleBookmark(sessionId: widget.sessionId));
            },
          ),
        ],
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<ProblemSolverBloc, ProblemSolverState>(
            listener: (context, state) {
              if (state is SessionLoaded) {
                setState(() => _session = state.session);
              } else if (state is BookmarkToggled) {
                setState(() => _isBookmarked = state.isBookmarked);
              } else if (state is CodeBlocksLoaded) {
                setState(() => _codeBlocks = state.codeBlocks);
              } else if (state is AlternativeMethodsLoaded) {
                setState(() => _alternativeMethods = state.methods);
              } else if (state is CitationsLoaded) {
                setState(() => _citations = state.citations);
              } else if (state is GraphDataLoaded) {
                setState(() => _graphData = state.graphData);
              } else if (state is ExplanationLoaded) {
                setState(() {
                  _currentExplanation = state.explanation;
                  _isLoadingExplanation = false;
                });
              } else if (state is NarrationLoaded) {
                setState(() => _narration = state.narration);
              } else if (state is NarrationGenerating) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Row(
                      children: [
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        Text('problem_solver.solution.generating_narration'.tr()),
                      ],
                    ),
                    duration: const Duration(seconds: 3),
                  ),
                );
              }
            },
          ),
        ],
        child: _session == null
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Problem display
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.grey300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_session!.subject != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF9333EA).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _session!.subject!,
                                style: const TextStyle(
                                  color: Color(0xFF9333EA),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          LatexRichText(
                            text: _session!.problem,
                            textStyle: AppTextStyles.bodyMedium,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Final Answer
                    if (_session!.finalAnswer != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.green.withOpacity(0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.check_circle, color: Colors.green, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'problem_solver.solution.final_answer'.tr(),
                                  style: TextStyle(
                                    color: Colors.green[700],
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            LatexRichText(
                              text: _session!.finalAnswer!,
                              textStyle: AppTextStyles.titleMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 16),

                    // Quick Actions
                    Text(
                      'problem_solver.solution.learning_tools'.tr(),
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 1.2,
                      children: [
                        _buildActionCard('problem_solver.solution.tools.hints'.tr(), Icons.lightbulb_outline, () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BlocProvider.value(
                                value: context.read<ProblemSolverBloc>(),
                                child: HintsScreen(sessionId: widget.sessionId),
                              ),
                            ),
                          );
                        }),
                        _buildActionCard('problem_solver.solution.tools.similar'.tr(), Icons.grid_view, () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BlocProvider.value(
                                value: context.read<ProblemSolverBloc>(),
                                child: SimilarProblemsScreen(sessionId: widget.sessionId),
                              ),
                            ),
                          );
                        }),
                        _buildActionCard('problem_solver.solution.tools.quiz'.tr(), Icons.quiz, () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BlocProvider.value(
                                value: context.read<ProblemSolverBloc>(),
                                child: PracticeQuizScreen(sessionId: widget.sessionId),
                              ),
                            ),
                          );
                        }),
                        _buildActionCard('problem_solver.solution.tools.chat'.tr(), Icons.chat_bubble_outline, () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BlocProvider.value(
                                value: context.read<ProblemSolverBloc>(),
                                child: StudyBuddyChatScreen(sessionId: widget.sessionId),
                              ),
                            ),
                          );
                        }),
                        _buildActionCard('problem_solver.solution.tools.concepts'.tr(), Icons.account_tree, () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BlocProvider.value(
                                value: context.read<ProblemSolverBloc>(),
                                child: ConceptMapScreen(sessionId: widget.sessionId),
                              ),
                            ),
                          );
                        }),
                        _buildActionCard('problem_solver.solution.tools.formulas'.tr(), Icons.functions, () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BlocProvider.value(
                                value: context.read<ProblemSolverBloc>(),
                                child: FormulaCardsScreen(sessionId: widget.sessionId),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Complexity Selector
                    ComplexitySelectorWidget(
                      selectedLevel: _explanationLevel,
                      onLevelChanged: _onExplanationLevelChanged,
                      isLoading: _isLoadingExplanation,
                    ),

                    const SizedBox(height: 16),

                    // Explanation Content (below selector like web)
                    if (_currentExplanation != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFF3B82F6).withOpacity(0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            LatexRichText(
                              text: _currentExplanation!.explanation,
                              textStyle: const TextStyle(
                                height: 1.6,
                                color: Colors.black,
                                fontSize: 14,
                              ),
                            ),
                            if (_currentExplanation!.keyPoints != null &&
                                _currentExplanation!.keyPoints!.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              const Divider(),
                              const SizedBox(height: 12),
                              const Text(
                                'Key Points:',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: Color(0xFF3B82F6),
                                ),
                              ),
                              const SizedBox(height: 8),
                              ..._currentExplanation!.keyPoints!.map((point) => Padding(
                                    padding: const EdgeInsets.only(bottom: 6, left: 4),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          '• ',
                                          style: TextStyle(
                                            fontSize: 16,
                                            color: Color(0xFF3B82F6),
                                          ),
                                        ),
                                        Expanded(
                                          child: LatexRichText(
                                            text: point,
                                            textStyle: const TextStyle(
                                              height: 1.5,
                                              color: Colors.black,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )),
                            ],
                          ],
                        ),
                      ),

                    if (_isLoadingExplanation)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.grey50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                              const SizedBox(width: 12),
                              Text('problem_solver.solution.loading_explanation'.tr()),
                            ],
                          ),
                        ),
                      ),

                    const SizedBox(height: 16),

                    // Solution Details with 6 Tabs
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.grey300),
                      ),
                      child: Column(
                        children: [
                          TabBar(
                            controller: _tabController,
                            indicatorColor: const Color(0xFF9333EA),
                            labelColor: const Color(0xFF9333EA),
                            unselectedLabelColor: AppColors.grey600,
                            isScrollable: true,
                            tabs: [
                              Tab(text: 'problem_solver.solution.tabs.steps'.tr()),
                              Tab(text: 'problem_solver.solution.tabs.code'.tr()),
                              Tab(text: 'problem_solver.solution.tabs.alternatives'.tr()),
                              Tab(text: 'problem_solver.solution.tabs.graph'.tr()),
                              Tab(text: 'problem_solver.solution.tabs.analysis'.tr()),
                              Tab(text: 'problem_solver.solution.tabs.citations'.tr()),
                            ],
                          ),
                          SizedBox(
                            height: 400,
                            child: TabBarView(
                              controller: _tabController,
                              children: [
                                _buildSolutionTab(),
                                _buildCodeTab(),
                                _buildAlternativesTab(),
                                _buildGraphTab(),
                                _buildAnalysisTab(),
                                _buildCitationsTab(),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildActionCard(String label, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey300),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFF9333EA), size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSolutionTab() {
    final solutionResult = _session?.solutionResult;
    if (solutionResult == null) {
      return Center(child: Text('problem_solver.solution.steps.no_solution'.tr()));
    }

    // Check if we have structured steps array or need to parse output text
    final steps = solutionResult['steps'] as List? ?? [];

    if (steps.isEmpty) {
      // Parse from output text if steps array doesn't exist
      final output = solutionResult['output'] as String? ?? '';
      if (output.isEmpty) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text('problem_solver.solution.steps.no_steps'.tr()),
          ),
        );
      }

      // Display the full solution text with formatting
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Parse and display steps from the output text
            ..._parseStepsFromOutput(output).asMap().entries.map((entry) {
              final index = entry.key;
              final stepText = entry.value;
              final isExpanded = _expandedStep == 'step_$index';

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.grey300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    InkWell(
                      onTap: () {
                        setState(() {
                          _expandedStep = isExpanded ? null : 'step_$index';
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: const BoxDecoration(
                                color: Color(0xFF9333EA),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  '${index + 1}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Step ${index + 1}',
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                            Icon(
                              isExpanded
                                  ? Icons.keyboard_arrow_up
                                  : Icons.keyboard_arrow_down,
                              color: AppColors.grey600,
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (isExpanded) ...[
                      const Divider(height: 1),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            LatexRichText(
                              text: stepText,
                              textStyle: const TextStyle(
                                height: 1.5,
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () {
                                    Clipboard.setData(
                                      ClipboardData(text: stepText),
                                    );
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('problem_solver.solution.step_copied'.tr())),
                                    );
                                  },
                                  icon: const Icon(Icons.copy, size: 16),
                                  label: Text('problem_solver.solution.copy'.tr()),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }),
          ],
        ),
      );
    }

    // Original code for structured steps
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...steps.asMap().entries.map((entry) {
          final index = entry.key;
          final step = entry.value;
          final isExpanded = _expandedStep == 'step_$index';

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: AppColors.grey50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.grey300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  onTap: () {
                    setState(() {
                      _expandedStep = isExpanded ? null : 'step_$index';
                    });
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: const BoxDecoration(
                            color: Color(0xFF9333EA),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            step['title'] ?? 'Step ${index + 1}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        Icon(
                          isExpanded
                              ? Icons.keyboard_arrow_up
                              : Icons.keyboard_arrow_down,
                          color: AppColors.grey600,
                        ),
                      ],
                    ),
                  ),
                ),
                if (isExpanded) ...[
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LatexRichText(
                          text: step['content'] ?? '',
                          textStyle: const TextStyle(
                            height: 1.5,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              onPressed: () {
                                Clipboard.setData(
                                  ClipboardData(text: step['content'] ?? ''),
                                );
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('problem_solver.solution.step_copied'.tr())),
                                );
                              },
                              icon: const Icon(Icons.copy, size: 16),
                              label: Text('problem_solver.solution.copy'.tr()),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        }),
      ],
    );
  }

  List<String> _parseStepsFromOutput(String output) {
    // Parse numbered steps from text like "1. Step text\n2. Next step..."
    final steps = <String>[];

    // Split by numbered lines (1., 2., 3., etc.)
    final lines = output.split('\n');
    String currentStep = '';

    for (var line in lines) {
      final trimmed = line.trim();
      // Check if line starts with a number followed by period or parenthesis
      final match = RegExp(r'^\d+[\.)]\s+').firstMatch(trimmed);

      if (match != null) {
        // Save previous step if exists
        if (currentStep.isNotEmpty) {
          steps.add(currentStep.trim());
        }
        // Start new step (remove the number prefix)
        currentStep = trimmed.substring(match.end);
      } else if (trimmed.isNotEmpty) {
        // Continue current step
        if (currentStep.isNotEmpty) {
          currentStep += '\n';
        }
        currentStep += trimmed;
      }
    }

    // Add the last step
    if (currentStep.isNotEmpty) {
      steps.add(currentStep.trim());
    }

    // If no steps were parsed, return the whole output as one step
    if (steps.isEmpty && output.isNotEmpty) {
      return [output];
    }

    return steps;
  }

  Widget _buildAnalysisTab() {
    // Show explanation based on selected level
    if (_currentExplanation != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.psychology, color: Color(0xFF3B82F6), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        '${_currentExplanation!.level.toString().split('.').last.toUpperCase()} Level Explanation',
                        style: const TextStyle(
                          color: Color(0xFF3B82F6),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  LatexRichText(
                    text: _currentExplanation!.explanation,
                    textStyle: const TextStyle(height: 1.5),
                  ),
                  if (_currentExplanation!.keyPoints != null &&
                      _currentExplanation!.keyPoints!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Key Points:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ..._currentExplanation!.keyPoints!.map((point) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('• ', style: TextStyle(fontSize: 16)),
                              Expanded(
                                child: LatexRichText(
                                  text: point,
                                  textStyle: const TextStyle(height: 1.5),
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                  if (_currentExplanation!.examples != null &&
                      _currentExplanation!.examples!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Examples:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ..._currentExplanation!.examples!.map((example) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.grey300),
                          ),
                          child: LatexRichText(
                            text: example,
                            textStyle: const TextStyle(height: 1.5),
                          ),
                        )),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Original analysis if available
            if (_session?.analysisResult != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.grey300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Technical Analysis',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    LatexRichText(
                      text: _session!.analysisResult!['output']?.toString() ?? 'No details',
                      textStyle: const TextStyle(height: 1.5),
                    ),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    return const Center(
      child: CircularProgressIndicator(),
    );
  }

  Widget _buildCodeTab() {
    if (_codeBlocks.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.code_off, size: 64, color: AppColors.grey400),
            SizedBox(height: 16),
            Text(
              'No code blocks available',
              style: TextStyle(color: AppColors.grey600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _codeBlocks.length,
      itemBuilder: (context, index) {
        return CodeBlockWidget(
          codeBlock: _codeBlocks[index],
          showLineNumbers: true,
        );
      },
    );
  }

  Widget _buildAlternativesTab() {
    if (_alternativeMethods.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.alt_route, size: 64, color: AppColors.grey400),
            SizedBox(height: 16),
            Text(
              'No alternative methods available',
              style: TextStyle(color: AppColors.grey600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _alternativeMethods.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: AlternativeMethodCard(
            method: _alternativeMethods[index],
          ),
        );
      },
    );
  }

  Widget _buildGraphTab() {
    if (!_hasLoadedGraph) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_graphData == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.show_chart, size: 64, color: AppColors.grey400),
            SizedBox(height: 16),
            Text(
              'No graph data available',
              style: TextStyle(color: AppColors.grey600),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: InteractiveGraphWidget(
        graphData: _graphData!,
        height: 350,
      ),
    );
  }

  Widget _buildCitationsTab() {
    if (_citations.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.source, size: 64, color: AppColors.grey400),
            SizedBox(height: 16),
            Text(
              'No citations available',
              style: TextStyle(color: AppColors.grey600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _citations.length,
      itemBuilder: (context, index) {
        return CitationCard(
          citation: _citations[index],
        );
      },
    );
  }

  void _showTtsDialog() {
    if (_narration == null) return;

    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Solution Narration',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TtsControlsWidget(
                narration: _narration!,
                onComplete: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('problem_solver.solution.narration_completed'.tr()),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showTtsWithSolutionText() {
    // Create narration from solution text
    final solutionText = _session?.solutionResult?['output']?.toString() ?? '';

    if (solutionText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('problem_solver.solution.no_solution_for_narration'.tr()),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Remove LaTeX notation for better TTS
    final cleanText = solutionText
        .replaceAllMapped(RegExp(r'\$\$([^\$]+)\$\$'), (m) => m.group(1) ?? '')
        .replaceAllMapped(RegExp(r'\$([^\$]+)\$'), (m) => m.group(1) ?? '')
        .replaceAllMapped(RegExp(r'\\\(([^)]+)\\\)'), (m) => m.group(1) ?? '')
        .replaceAllMapped(RegExp(r'\\\[([^\]]+)\\\]'), (m) => m.group(1) ?? '')
        .replaceAll('\\frac', 'fraction')
        .replaceAll('\\', '');

    final fallbackNarration = NarrationEntity(
      id: widget.sessionId,
      sessionId: widget.sessionId,
      audioUrl: '',
      segments: [
        NarrationSegment(
          text: cleanText,
          startTime: 0,
          endTime: 0,
        ),
      ],
      duration: 0,
      status: 'ready',
      createdAt: DateTime.now(),
    );

    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Solution Narration',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TtsControlsWidget(
                narration: fallbackNarration,
                onComplete: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('problem_solver.solution.narration_completed'.tr()),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
