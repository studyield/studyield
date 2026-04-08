import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import 'solving_progress_screen.dart';
import 'problem_history_screen.dart';
import 'problem_bookmarks_screen.dart';
import 'camera_scan_screen.dart';
import 'batch_solver_screen.dart';

class ProblemInputScreen extends StatefulWidget {
  const ProblemInputScreen({super.key});

  @override
  State<ProblemInputScreen> createState() => _ProblemInputScreenState();
}

class _ProblemInputScreenState extends State<ProblemInputScreen> {
  final TextEditingController _problemController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  String? _selectedSubject;
  String? _uploadedImagePath;
  bool _isLoading = false;

  List<String> get _subjects => [
    'problem_solver.input.subjects.auto_detect'.tr(),
    'problem_solver.input.subjects.mathematics'.tr(),
    'problem_solver.input.subjects.physics'.tr(),
    'problem_solver.input.subjects.chemistry'.tr(),
    'problem_solver.input.subjects.biology'.tr(),
    'problem_solver.input.subjects.computer_science'.tr(),
    'problem_solver.input.subjects.engineering'.tr(),
    'problem_solver.input.subjects.economics'.tr(),
    'problem_solver.input.subjects.statistics'.tr(),
  ];

  @override
  void dispose() {
    _problemController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() => _uploadedImagePath = image.path);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to pick image: $e')),
        );
      }
    }
  }

  Future<void> _captureImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.camera);
      if (image != null) {
        setState(() => _uploadedImagePath = image.path);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to capture image: $e')),
        );
      }
    }
  }

  void _handleSolve() {
    if (_problemController.text.trim().isEmpty && _uploadedImagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('problem_solver.input.messages.enter_problem'.tr())),
      );
      return;
    }

    context.read<ProblemSolverBloc>().add(
          CreateProblemSession(
            problem: _problemController.text.trim(),
            subject: _selectedSubject == _subjects.first ? null : _selectedSubject,
            imageUrl: _uploadedImagePath,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    // Initialize selected subject with translated value if null
    _selectedSubject ??= _subjects.first;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('problem_solver.input.title'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark_border),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ProblemSolverBloc>(),
                    child: const ProblemBookmarksScreen(),
                  ),
                ),
              );
            },
            tooltip: 'problem_solver.input.menu.bookmarks'.tr(),
          ),
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ProblemSolverBloc>(),
                    child: const ProblemHistoryScreen(),
                  ),
                ),
              );
            },
            tooltip: 'problem_solver.input.menu.history'.tr(),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              if (value == 'batch') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ProblemSolverBloc>(),
                      child: const BatchSolverScreen(),
                    ),
                  ),
                );
              } else if (value == 'camera_scan') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BlocProvider.value(
                      value: context.read<ProblemSolverBloc>(),
                      child: const CameraScanScreen(),
                    ),
                  ),
                );
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'batch',
                child: Row(
                  children: [
                    const Icon(Icons.upload_file, size: 20),
                    const SizedBox(width: 12),
                    Text('problem_solver.input.menu.batch_solver'.tr()),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'camera_scan',
                child: Row(
                  children: [
                    const Icon(Icons.document_scanner, size: 20),
                    const SizedBox(width: 12),
                    Text('problem_solver.input.menu.camera_scan'.tr()),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is SessionCreated) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ProblemSolverBloc>(),
                  child: SolvingProgressScreen(sessionId: state.session.id),
                ),
              ),
            );
          } else if (state is ProblemSolverError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        child: BlocBuilder<ProblemSolverBloc, ProblemSolverState>(
          builder: (context, state) {
            _isLoading = state is ProblemSolverLoading;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Input Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.grey300),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Subject dropdown
                        Text(
                          'problem_solver.input.subject_label'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _selectedSubject,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          items: _subjects.map((subject) {
                            return DropdownMenuItem(
                              value: subject,
                              child: Text(subject),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setState(() => _selectedSubject = value);
                            }
                          },
                        ),

                        const SizedBox(height: 16),

                        // Problem text input
                        Text(
                          'problem_solver.input.problem_label'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _problemController,
                          minLines: 5,
                          maxLines: 10,
                          decoration: InputDecoration(
                            hintText: 'problem_solver.input.problem_hint'.tr(),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(
                                color: Color(0xFF9333EA),
                                width: 2,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Action buttons
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => BlocProvider.value(
                                        value: context.read<ProblemSolverBloc>(),
                                        child: const CameraScanScreen(),
                                      ),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.camera_alt, size: 18),
                                label: Text('problem_solver.input.actions.scan'.tr()),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('problem_solver.input.voice_coming_soon'.tr()),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.mic, size: 18),
                                label: Text('problem_solver.input.actions.voice'.tr()),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: _pickImage,
                                icon: const Icon(Icons.image, size: 18),
                                label: Text('problem_solver.input.actions.image'.tr()),
                              ),
                            ),
                          ],
                        ),

                        // Image preview
                        if (_uploadedImagePath != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.grey100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.image, color: Color(0xFF9333EA)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'problem_solver.input.image_uploaded'.tr(),
                                    style: AppTextStyles.bodySmall,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, size: 18),
                                  onPressed: () {
                                    setState(() => _uploadedImagePath = null);
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Solve button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _handleSolve,
                      icon: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.psychology),
                      label: Text(_isLoading ? 'problem_solver.input.actions.creating'.tr() : 'problem_solver.input.actions.solve'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF9333EA),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // How it works
                  Text(
                    'problem_solver.input.how_it_works'.tr(),
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildAgentCard(
                    'problem_solver.input.agents.analysis.title'.tr(),
                    'problem_solver.input.agents.analysis.description'.tr(),
                    Icons.search,
                    const Color(0xFF3B82F6),
                  ),
                  const SizedBox(height: 8),
                  _buildAgentCard(
                    'problem_solver.input.agents.solver.title'.tr(),
                    'problem_solver.input.agents.solver.description'.tr(),
                    Icons.bolt,
                    const Color(0xFFF59E0B),
                  ),
                  const SizedBox(height: 8),
                  _buildAgentCard(
                    'problem_solver.input.agents.verifier.title'.tr(),
                    'problem_solver.input.agents.verifier.description'.tr(),
                    Icons.verified,
                    const Color(0xFF10B981),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildAgentCard(String title, String description, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey300),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
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
              ],
            ),
          ),
        ],
      ),
    );
  }
}
