import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/inputs/file_upload_widget.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/batch_problem_entity.dart';
import '../../domain/entities/problem_session_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import '../widgets/batch_problem_card_widget.dart';

class BatchSolverScreen extends StatefulWidget {
  const BatchSolverScreen({super.key});

  @override
  State<BatchSolverScreen> createState() => _BatchSolverScreenState();
}

class _BatchSolverScreenState extends State<BatchSolverScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _textController = TextEditingController();
  String? _selectedFilePath;
  List<BatchProblemEntity> _extractedProblems = [];
  String? _extractionId;
  Set<int> _selectedIndices = {};
  int _totalProblems = 0;
  int _solvedProblems = 0;
  List<ProblemSessionEntity> _completedSessions = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _textController.dispose();
    super.dispose();
  }

  void _onFileSelected(String filePath) {
    setState(() => _selectedFilePath = filePath);
  }

  void _extractFromPdf() {
    if (_selectedFilePath == null) return;

    context.read<ProblemSolverBloc>().add(
          UploadBatchFile(
            filePath: _selectedFilePath!,
            fileType: 'pdf',
          ),
        );
  }

  void _extractFromText() {
    if (_textController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('problem_solver.batch.please_enter_text'.tr()),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<ProblemSolverBloc>().add(
          ExtractProblemsFromText(text: _textController.text),
        );
  }

  void _solveSingle(int index) {
    if (_extractionId == null) return;

    context.read<ProblemSolverBloc>().add(
          SolveSingleExtractedProblem(
            extractionId: _extractionId!,
            problemIndex: index,
          ),
        );
  }

  void _solveSelected() {
    if (_extractionId == null || _selectedIndices.isEmpty) return;

    context.read<ProblemSolverBloc>().add(
          SolveBatchProblems(
            extractionId: _extractionId!,
            problemIndices: _selectedIndices.toList(),
          ),
        );
  }

  void _solveAll() {
    if (_extractionId == null || _extractedProblems.isEmpty) return;

    final allIndices =
        _extractedProblems.map((p) => p.sequenceNumber).toList();

    context.read<ProblemSolverBloc>().add(
          SolveBatchProblems(
            extractionId: _extractionId!,
            problemIndices: allIndices,
          ),
        );
  }

  void _deleteProblem(int index) {
    setState(() {
      _extractedProblems.removeWhere((p) => p.sequenceNumber == index);
      _selectedIndices.remove(index);
    });
  }

  void _toggleSelection(int index) {
    setState(() {
      if (_selectedIndices.contains(index)) {
        _selectedIndices.remove(index);
      } else {
        _selectedIndices.add(index);
      }
    });
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
        title: Text('problem_solver.batch_solver.title'.tr()),
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is BatchProblemsExtracted) {
            setState(() {
              _extractedProblems = state.problems;
              _extractionId = state.extractionId;
            });
          } else if (state is BatchSolving) {
            setState(() {
              _totalProblems = state.totalProblems;
              _solvedProblems = state.solvedProblems;
            });
          } else if (state is BatchSolvingCompleted) {
            setState(() {
              _completedSessions = state.sessions;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('problem_solver.batch_solver.messages.problems_solved'.tr(namedArgs: {'count': '${state.sessions.length}'})),
                backgroundColor: Colors.green,
              ),
            );
          } else if (state is ProblemSolverError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: _extractedProblems.isEmpty
            ? _buildExtractionView()
            : _buildProblemsView(),
      ),
      floatingActionButton: _extractedProblems.isNotEmpty
          ? _buildFloatingActions()
          : null,
    );
  }

  Widget _buildExtractionView() {
    return Column(
      children: [
        // Tabs
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            indicatorColor: AppColors.purple,
            labelColor: AppColors.purple,
            unselectedLabelColor: AppColors.grey600,
            tabs: [
              Tab(text: 'problem_solver.batch_solver.tabs.pdf_upload'.tr()),
              Tab(text: 'problem_solver.batch_solver.tabs.text_input'.tr()),
            ],
          ),
        ),

        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildPdfUploadTab(),
              _buildTextInputTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPdfUploadTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          FileUploadWidget(
            allowedExtensions: const ['pdf'],
            maxSizeInMB: 50,
            label: 'problem_solver.batch_solver.pdf_tab.upload_label'.tr(),
            hint: 'Select a PDF file containing problems',
            onFileSelected: _onFileSelected,
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'problem_solver.batch_solver.pdf_tab.extract_button'.tr(),
            onPressed: _selectedFilePath != null ? _extractFromPdf : null,
            icon: Icons.auto_awesome,
          ),
        ],
      ),
    );
  }

  Widget _buildTextInputTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 16),
          Text(
            'problem_solver.batch_solver.text_tab.title'.tr(),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Paste your problems below. Each problem should be on a new line or separated by numbers.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _textController,
            maxLines: 15,
            decoration: InputDecoration(
              hintText: 'problem_solver.batch.hint_problems'.tr(),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.purple, width: 2),
              ),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'problem_solver.batch_solver.pdf_tab.extract_button'.tr(),
            onPressed: _extractFromText,
            icon: Icons.auto_awesome,
          ),
        ],
      ),
    );
  }

  Widget _buildProblemsView() {
    return Column(
      children: [
        // Stats card
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppColors.purpleGradient,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.purple.withOpacity(0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('problem_solver.batch_solver.stats.total'.tr(), '${_extractedProblems.length}'),
              _buildStatItem('problem_solver.batch_solver.stats.selected'.tr(), '${_selectedIndices.length}'),
              _buildStatItem(
                'problem_solver.batch_solver.stats.solved'.tr(),
                '${_extractedProblems.where((p) => p.status == BatchProblemStatus.completed).length}',
              ),
            ],
          ),
        ),

        // Problems grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.75,
            ),
            itemCount: _extractedProblems.length,
            itemBuilder: (context, index) {
              final problem = _extractedProblems[index];
              return BatchProblemCard(
                problem: problem,
                onSolve: () => _solveSingle(problem.sequenceNumber),
                onDelete: () => _deleteProblem(problem.sequenceNumber),
                onLongPress: () => _toggleSelection(problem.sequenceNumber),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildFloatingActions() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (_selectedIndices.isNotEmpty)
          FloatingActionButton.extended(
            onPressed: _solveSelected,
            backgroundColor: AppColors.purple,
            label: Text('problem_solver.batch_solver.actions.solve_selected'.tr(namedArgs: {'count': '${_selectedIndices.length}'})),
            icon: const Icon(Icons.play_arrow),
            heroTag: 'solve_selected',
          ),
        if (_selectedIndices.isNotEmpty) const SizedBox(height: 12),
        FloatingActionButton.extended(
          onPressed: _solveAll,
          backgroundColor: Colors.green,
          label: Text('problem_solver.batch.solve_all'.tr()),
          icon: const Icon(Icons.play_arrow),
          heroTag: 'solve_all',
        ),
      ],
    );
  }
}
