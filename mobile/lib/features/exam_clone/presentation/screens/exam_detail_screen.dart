import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/exam_clone_entity.dart';
import '../../domain/entities/exam_question_entity.dart';
import '../bloc/exam_clone_bloc.dart';
import '../bloc/exam_clone_event.dart';
import '../bloc/exam_clone_state.dart';
import '../widgets/generate_questions_modal.dart';
import '../widgets/export_pdf_modal.dart';
import 'practice_screen.dart';
import 'review_queue_screen.dart';
import 'live_exam_session_screen.dart';

class ExamDetailScreen extends StatefulWidget {
  final String examId;

  const ExamDetailScreen({
    super.key,
    required this.examId,
  });

  @override
  State<ExamDetailScreen> createState() => _ExamDetailScreenState();
}

class _ExamDetailScreenState extends State<ExamDetailScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  String? _expandedQuestionId;
  List<ExamQuestionEntity> _allQuestions = [];
  ExamCloneEntity? _exam;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    // Setup animations
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic));

    _animationController.forward();

    context.read<ExamCloneBloc>().add(LoadExamDetail(examId: widget.examId));
    context.read<ExamCloneBloc>().add(LoadQuestions(examId: widget.examId));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _animationController.dispose();
    super.dispose();
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
        title: _exam != null
            ? Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: AppColors.purpleGradient,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.description_rounded, color: AppColors.white, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _exam!.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (_exam!.subject != null)
                          Text(
                            _exam!.subject!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              )
            : Text('exam_clone.detail.title'.tr()),
      ),
      body: BlocListener<ExamCloneBloc, ExamCloneState>(
        listener: (context, state) {
          if (state is ExamDetailLoaded) {
            setState(() {
              _exam = state.exam;
              _isLoading = false;
            });
          } else if (state is QuestionsLoaded) {
            setState(() {
              _allQuestions = state.questions;
            });
          }
        },
        child: Builder(
          builder: (context) {
            if (_isLoading || _exam == null) {
              return const Center(child: CircularProgressIndicator());
            }

            final exam = _exam!;
            final originalQuestions = _allQuestions.where((q) => q.isOriginal).toList();
            final generatedQuestions = _allQuestions.where((q) => !q.isOriginal).toList();

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Action Buttons (like web)
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: _exam != null && _allQuestions.isNotEmpty
                                ? () => showDialog(
                                      context: context,
                                      builder: (_) => ExportPdfModal(
                                        exam: _exam!,
                                        questions: _allQuestions,
                                      ),
                                    )
                                : null,
                            icon: const Icon(Icons.download, size: 16),
                            label: Text('exam_clone.detail.export_pdf'.tr()),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ReviewQueueScreen()),
                            ),
                            icon: const Icon(Icons.refresh, size: 16),
                            label: Text('exam_clone.detail.review_queue'.tr()),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: _exam != null && _allQuestions.isNotEmpty
                                ? () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => LiveExamSessionScreen(
                                          examId: widget.examId,
                                          questions: _allQuestions,
                                        ),
                                      ),
                                    )
                                : null,
                            icon: const Icon(Icons.people, size: 16),
                            label: Text('exam_clone.detail.live_session'.tr()),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: () => _navigateToPractice(context),
                            icon: const Icon(Icons.play_arrow, size: 16),
                            label: Text('exam_clone.detail.practice'.tr()),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.purple,
                              foregroundColor: AppColors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Style Analysis Card (if analyzed) with animation
                    if (exam.extractedStyle != null) ...[
                      TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0.0, end: 1.0),
                        duration: const Duration(milliseconds: 600),
                        curve: Curves.easeOut,
                        builder: (context, value, child) {
                          return Opacity(
                            opacity: value,
                            child: Transform.translate(
                              offset: Offset(0, 30 * (1 - value)),
                              child: child,
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppColors.purple.withOpacity(0.08),
                                AppColors.purpleLight.withOpacity(0.04),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: AppColors.purple.withOpacity(0.3),
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.purple.withOpacity(0.1),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.psychology,
                                    color: Color(0xFF9333EA), size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'exam_clone.detail.exam_style_analysis'.tr(),
                                  style: AppTextStyles.titleMedium.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Question Types
                            Text(
                              'exam_clone.detail.question_types'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: exam.extractedStyle!.questionTypes
                                  .map((type) => Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.purple
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(16),
                                        ),
                                        child: Text(
                                          _formatQuestionType(type),
                                          style: const TextStyle(
                                            color: Color(0xFF9333EA),
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ))
                                  .toList(),
                            ),

                            const SizedBox(height: 16),

                            // Difficulty Distribution
                            Text(
                              'exam_clone.detail.difficulty_distribution'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            _buildDifficultyBar(
                                'exam_clone.detail.easy'.tr(),
                                exam.extractedStyle!.difficultyDistribution.easy,
                                AppColors.success),
                            const SizedBox(height: 8),
                            _buildDifficultyBar(
                                'exam_clone.detail.medium'.tr(),
                                exam.extractedStyle!.difficultyDistribution.medium,
                                AppColors.warning),
                            const SizedBox(height: 8),
                            _buildDifficultyBar(
                                'exam_clone.detail.hard'.tr(),
                                exam.extractedStyle!.difficultyDistribution.hard,
                                AppColors.error),

                            const SizedBox(height: 16),

                            // Topics Covered
                            Text(
                              'exam_clone.detail.topics_covered'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                ...exam.extractedStyle!.topicsCovered
                                    .take(6)
                                    .map((topic) => Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppColors.grey200,
                                            borderRadius:
                                                BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            topic,
                                            style: const TextStyle(fontSize: 11),
                                          ),
                                        )),
                                if (exam.extractedStyle!.topicsCovered.length >
                                    6)
                                  Text(
                                    'exam_clone.detail.more_topics'.tr(namedArgs: {'count': '${exam.extractedStyle!.topicsCovered.length - 6}'}),
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.grey600,
                                      fontSize: 11,
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                        ),
                      const SizedBox(height: 20),
                    ],

                    // Stats Cards
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 2.2,
                      children: [
                        _buildStatCard(
                          Icons.book,
                          const Color(0xFF3B82F6),
                          '${originalQuestions.length}',
                          'exam_clone.detail.original'.tr(),
                        ),
                        _buildStatCard(
                          Icons.auto_awesome,
                          const Color(0xFF10B981),
                          '${generatedQuestions.length}',
                          'exam_clone.detail.generated'.tr(),
                        ),
                        _buildStatCard(
                          Icons.quiz,
                          AppColors.purple,
                          '${originalQuestions.length + generatedQuestions.length}',
                          'exam_clone.detail.total'.tr(),
                        ),
                        _buildStatCard(
                          Icons.workspace_premium,
                          const Color(0xFFF59E0B),
                          '0%',
                          'exam_clone.detail.best_score'.tr(),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Questions Tabs with Analytics
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.cardLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.grey300),
                      ),
                      child: Column(
                        children: [
                          // Tab Bar
                          Container(
                            decoration: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: AppColors.grey300,
                                  width: 1,
                                ),
                              ),
                            ),
                            child: TabBar(
                              controller: _tabController,
                              indicatorColor: AppColors.purple,
                              labelColor: AppColors.purple,
                              unselectedLabelColor: AppColors.grey600,
                              labelPadding: const EdgeInsets.symmetric(horizontal: 8),
                              labelStyle: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                              tabs: [
                                Tab(
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.book, size: 14),
                                      const SizedBox(width: 4),
                                      Text('exam_clone.detail.tabs.original'.tr(namedArgs: {'count': '${originalQuestions.length}'})),
                                    ],
                                  ),
                                ),
                                Tab(
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.auto_awesome, size: 14),
                                      const SizedBox(width: 4),
                                      Text('exam_clone.detail.tabs.generated'.tr(namedArgs: {'count': '${generatedQuestions.length}'})),
                                    ],
                                  ),
                                ),
                                Tab(
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.bar_chart, size: 14),
                                      const SizedBox(width: 4),
                                      Text('exam_clone.detail.tabs.analytics'.tr()),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Generate More Button (for Original and Generated tabs only)
                          AnimatedBuilder(
                            animation: _tabController,
                            builder: (context, _) {
                              if (_tabController.index != 2) {
                                return Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color: AppColors.grey300,
                                        width: 1,
                                      ),
                                    ),
                                  ),
                                  child: ElevatedButton.icon(
                                    onPressed: () => _showGenerateModal(exam),
                                    icon: const Icon(Icons.add, size: 16),
                                    label: Text('exam_clone.detail.generate_more'.tr()),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                );
                              }
                              return const SizedBox();
                            },
                          ),

                          // Tab Content
                          SizedBox(
                            height: 400,
                            child: TabBarView(
                              controller: _tabController,
                              children: [
                                _buildQuestionsList(originalQuestions),
                                _buildQuestionsList(generatedQuestions),
                                _buildAnalyticsTab(),
                              ],
                            ),
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

  Widget _buildDifficultyBar(String label, int percentage, Color color) {
    return Row(
      children: [
        SizedBox(
          width: 55,
          child: Text(label, style: const TextStyle(fontSize: 11)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage / 100,
              minHeight: 8,
              backgroundColor: AppColors.grey200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$percentage%',
          style: const TextStyle(fontSize: 11, color: AppColors.grey600),
        ),
      ],
    );
  }

  Widget _buildStatCard(
      IconData icon, Color color, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey300),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: AppTextStyles.headlineSmall.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                ),
                Text(
                  label,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionsList(List<ExamQuestionEntity> questions) {
    if (questions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text('exam_clone.detail.no_questions'.tr()),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: questions.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final q = questions[index];
        final isExpanded = _expandedQuestionId == q.id;

        return InkWell(
          onTap: () {
            setState(() {
              _expandedQuestionId = isExpanded ? null : q.id;
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        color: AppColors.grey200,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            q.questionText,
                            style: AppTextStyles.bodyMedium,
                            maxLines: isExpanded ? null : 2,
                            overflow: isExpanded ? null : TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getDifficultyColor(q.difficulty)
                                      .withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  q.difficulty,
                                  style: TextStyle(
                                    color: _getDifficultyColor(q.difficulty),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              if (q.tags.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.grey200,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    q.tags.first,
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                ),
                            ],
                          ),
                        ],
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
                if (isExpanded) ...[
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.only(left: 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (q.options.isNotEmpty) ...[
                          ...q.options.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final option = entry.value;
                            final isCorrect = option == q.correctAnswer;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isCorrect
                                    ? AppColors.success.withOpacity(0.1)
                                    : AppColors.grey100,
                                border: Border.all(
                                  color: isCorrect
                                      ? AppColors.success.withOpacity(0.3)
                                      : AppColors.grey300,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      color: isCorrect
                                          ? AppColors.success
                                          : AppColors.grey300,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Center(
                                      child: Text(
                                        String.fromCharCode(65 + idx),
                                        style: TextStyle(
                                          color: isCorrect
                                              ? Colors.white
                                              : AppColors.grey700,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(option, style: const TextStyle(fontSize: 13)),
                                  ),
                                  if (isCorrect)
                                    const Icon(Icons.check_circle,
                                        color: AppColors.success, size: 18),
                                ],
                              ),
                            );
                          }).toList(),
                        ] else ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.1),
                              border:
                                  Border.all(color: AppColors.success.withOpacity(0.3)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'exam_clone.detail.correct_answer'.tr(),
                                  style: const TextStyle(
                                    color: AppColors.success,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  q.correctAnswer,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (q.explanation != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color:
                                  const Color(0xFF3B82F6).withOpacity(0.1),
                              border: Border.all(
                                  color: const Color(0xFF3B82F6)
                                      .withOpacity(0.3)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.lightbulb_outline,
                                        color: Color(0xFF3B82F6), size: 14),
                                    const SizedBox(width: 4),
                                    Text(
                                      'exam_clone.detail.explanation'.tr(),
                                      style: const TextStyle(
                                        color: Color(0xFF3B82F6),
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(q.explanation!,
                                    style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return AppColors.success;
      case 'medium':
        return AppColors.warning;
      case 'hard':
        return AppColors.error;
      default:
        return AppColors.grey600;
    }
  }

  String _formatQuestionType(String type) {
    final typeLabels = {
      'multiple_choice': 'exam_clone.detail.question_type.multiple_choice'.tr(),
      'short_answer': 'exam_clone.detail.question_type.short_answer'.tr(),
      'true_false': 'exam_clone.detail.question_type.true_false'.tr(),
      'essay': 'exam_clone.detail.question_type.essay'.tr(),
      'fill_blank': 'exam_clone.detail.question_type.fill_blank'.tr(),
    };
    return typeLabels[type] ?? type;
  }

  Widget _buildAnalyticsTab() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.bar_chart,
              size: 48,
              color: AppColors.grey400,
            ),
            const SizedBox(height: 16),
            Text(
              'exam_clone.detail.no_practice_data'.tr(),
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'exam_clone.detail.complete_practice'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showGenerateModal(ExamCloneEntity exam) {
    showDialog(
      context: context,
      builder: (context) => GenerateQuestionsModal(
        examId: widget.examId,
        availableTopics: exam.extractedStyle?.topicsCovered,
        onSuccess: () {
          // Reload questions after generation
          this.context.read<ExamCloneBloc>().add(LoadQuestions(examId: widget.examId));
        },
      ),
    );
  }

  void _navigateToPractice(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: PracticeScreen(examId: widget.examId),
        ),
      ),
    );
  }
}

// Animated Stat Card with stagger effect
class _AnimatedStatCard extends StatelessWidget {
  final int delay;
  final Widget child;

  const _AnimatedStatCard({
    required this.delay,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 600 + delay),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.scale(
            scale: 0.8 + (0.2 * value),
            child: Transform.translate(
              offset: Offset(0, 20 * (1 - value)),
              child: child,
            ),
          ),
        );
      },
      child: child,
    );
  }
}
