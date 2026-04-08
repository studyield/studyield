import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/exam_clone_entity.dart';
import '../bloc/exam_clone_bloc.dart';
import '../bloc/exam_clone_event.dart';
import '../bloc/exam_clone_state.dart';
import '../widgets/exam_card.dart';
import '../widgets/stats_card.dart';
import '../widgets/quick_access_button.dart';
import '../widgets/upload_exam_modal.dart';
import 'exam_detail_screen.dart';
import 'practice_screen.dart';
import 'review_queue_screen.dart';
import 'bookmarks_screen.dart';
import 'badges_screen.dart';
import 'leaderboard_screen.dart';

class ExamCloneListScreen extends StatefulWidget {
  const ExamCloneListScreen({super.key});

  @override
  State<ExamCloneListScreen> createState() => _ExamCloneListScreenState();
}

class _ExamCloneListScreenState extends State<ExamCloneListScreen>
    with SingleTickerProviderStateMixin {
  Timer? _pollTimer;
  Timer? _examStatusPollTimer;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    context.read<ExamCloneBloc>().add(const LoadExams());

    // Animation setup
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic));

    _animationController.forward();

    // Poll for review queue updates
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      context.read<ExamCloneBloc>().add(const RefreshReviewQueueCount());
    });

    _startExamPolling();
  }

  void _startExamPolling() {
    _examStatusPollTimer?.cancel();
    _examStatusPollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      context.read<ExamCloneBloc>().add(const LoadExams());
    });
  }

  void _stopExamPollingIfNeeded(List<ExamCloneEntity> exams) {
    final hasProcessingExams = exams.any((exam) =>
        exam.status == ExamCloneStatus.pending ||
        exam.status == ExamCloneStatus.processing);

    if (!hasProcessingExams && _examStatusPollTimer != null) {
      _examStatusPollTimer?.cancel();
      _examStatusPollTimer = null;
    } else if (hasProcessingExams && _examStatusPollTimer == null) {
      _startExamPolling();
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _examStatusPollTimer?.cancel();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: CustomScrollView(
        slivers: [
          // Hero header with gradient
          SliverAppBar(
            expandedHeight: 180,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.purple,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.white),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: AppColors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.add_rounded, color: AppColors.white),
                  onPressed: _showUploadModal,
                  tooltip: 'exam_clone.list.upload_tooltip'.tr(),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.purple,
                      AppColors.purpleLight,
                      AppColors.purple,
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Stack(
                    children: [
                      // Lottie animation background
                      Positioned(
                        right: -30,
                        top: 10,
                        child: Opacity(
                          opacity: 0.25,
                          child: Lottie.network(
                            'https://assets9.lottiefiles.com/packages/lf20_1a8dx7zj.json',
                            width: 200,
                            height: 200,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return const SizedBox.shrink();
                            },
                          ),
                        ),
                      ),
                      // Content
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 60, 16, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: AppColors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.psychology_rounded, color: AppColors.white, size: 24),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'exam_clone.list.title'.tr(),
                                        style: const TextStyle(
                                          color: AppColors.white,
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'exam_clone.list.subtitle'.tr(),
                                        style: const TextStyle(
                                          color: AppColors.white,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                BlocConsumer<ExamCloneBloc, ExamCloneState>(
                  listener: (context, state) {
                    if (state is ExamCloneError) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.message),
                          backgroundColor: AppColors.error,
                        ),
                      );
                    }
                  },
                  builder: (context, state) {
                    if (state is ExamCloneLoading) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(40),
                          child: Column(
                            children: [
                              CircularProgressIndicator(color: AppColors.purple),
                              const SizedBox(height: 16),
                              Text(
                                'exam_clone.list.loading'.tr(),
                                style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    if (state is ExamsLoaded) {
                      _stopExamPollingIfNeeded(state.exams);

                      return FadeTransition(
                        opacity: _fadeAnimation,
                        child: SlideTransition(
                          position: _slideAnimation,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Quick Access Buttons with stagger animation
                              GridView.count(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisCount: 2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 2.2,
                                children: [
                                  _AnimatedQuickAccessButton(
                                    delay: 0,
                                    child: QuickAccessButton(
                                      icon: Icons.psychology_rounded,
                                      iconColor: AppColors.warning,
                                      bgColor: AppColors.warning.withOpacity(0.15),
                                      title: 'exam_clone.list.review_queue'.tr(),
                                      subtitle: state.reviewQueueCount > 0
                                          ? 'exam_clone.list.due_count'.tr(namedArgs: {'count': '${state.reviewQueueCount}'})
                                          : 'exam_clone.list.all_caught_up'.tr(),
                                      onTap: () => _navigateToReviewQueue(context),
                                      showBadge: true,
                                      badgeCount: state.reviewQueueCount,
                                    ),
                                  ),
                                  _AnimatedQuickAccessButton(
                                    delay: 100,
                                    child: QuickAccessButton(
                                      icon: Icons.bookmark_rounded,
                                      iconColor: AppColors.info,
                                      bgColor: AppColors.info.withOpacity(0.15),
                                      title: 'exam_clone.list.bookmarks'.tr(),
                                      subtitle: 'exam_clone.list.saved_questions'.tr(),
                                      onTap: () => _navigateToBookmarks(context),
                                    ),
                                  ),
                                  _AnimatedQuickAccessButton(
                                    delay: 200,
                                    child: QuickAccessButton(
                                      icon: Icons.emoji_events_rounded,
                                      iconColor: AppColors.accent,
                                      bgColor: AppColors.accent.withOpacity(0.15),
                                      title: 'exam_clone.list.badges'.tr(),
                                      subtitle: 'exam_clone.list.achievements'.tr(),
                                      onTap: () => _navigateToBadges(context),
                                    ),
                                  ),
                                  _AnimatedQuickAccessButton(
                                    delay: 300,
                                    child: QuickAccessButton(
                                      icon: Icons.leaderboard_rounded,
                                      iconColor: AppColors.purple,
                                      bgColor: AppColors.purple.withOpacity(0.15),
                                      title: 'exam_clone.list.leaderboard'.tr(),
                                      subtitle: 'exam_clone.list.rankings'.tr(),
                                      onTap: () => _navigateToLeaderboard(context),
                                    ),
                                  ),
                                ],
                              ),

                              // Review Queue Notification
                              if (state.reviewQueueCount > 0) ...[
                                const SizedBox(height: 16),
                                _buildReviewNotification(state.reviewQueueCount),
                              ],

                              // Stats Overview
                              if (state.exams.isNotEmpty && state.stats != null) ...[
                                const SizedBox(height: 24),
                                Row(
                                  children: [
                                    Icon(Icons.analytics_rounded, size: 20, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                                    const SizedBox(width: 8),
                                    Text(
                                      'exam_clone.list.overview'.tr(),
                                      style: AppTextStyles.titleMedium.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                GridView.count(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  crossAxisCount: 2,
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                  childAspectRatio: 2.2,
                                  children: [
                                    _AnimatedStatsCard(
                                      delay: 0,
                                      child: StatsCard(
                                        icon: Icons.description_rounded,
                                        iconColor: AppColors.purple,
                                        bgColor: AppColors.purple.withOpacity(0.1),
                                        value: '${state.stats!.totalExams}',
                                        label: 'exam_clone.list.stats.exams'.tr(),
                                      ),
                                    ),
                                    _AnimatedStatsCard(
                                      delay: 100,
                                      child: StatsCard(
                                        icon: Icons.quiz_rounded,
                                        iconColor: AppColors.info,
                                        bgColor: AppColors.info.withOpacity(0.1),
                                        value: '${state.stats!.totalOriginalQuestions}',
                                        label: 'exam_clone.list.stats.original'.tr(),
                                      ),
                                    ),
                                    _AnimatedStatsCard(
                                      delay: 200,
                                      child: StatsCard(
                                        icon: Icons.auto_awesome_rounded,
                                        iconColor: AppColors.success,
                                        bgColor: AppColors.success.withOpacity(0.1),
                                        value: '${state.stats!.totalGeneratedQuestions}',
                                        label: 'exam_clone.list.stats.generated'.tr(),
                                      ),
                                    ),
                                    _AnimatedStatsCard(
                                      delay: 300,
                                      child: StatsCard(
                                        icon: Icons.check_circle_rounded,
                                        iconColor: AppColors.warning,
                                        bgColor: AppColors.warning.withOpacity(0.1),
                                        value: '${state.stats!.readyToPractice}',
                                        label: 'exam_clone.list.stats.ready'.tr(),
                                      ),
                                    ),
                                  ],
                                ),
                              ],

                              // Exams List
                              const SizedBox(height: 32),
                              Row(
                                children: [
                                  Icon(Icons.folder_special_rounded, size: 20, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'exam_clone.list.your_exams'.tr(),
                                      style: AppTextStyles.titleMedium.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    decoration: BoxDecoration(
                                      gradient: AppColors.purpleGradient,
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.purple.withOpacity(0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: Material(
                                      color: AppColors.transparent,
                                      child: InkWell(
                                        onTap: _showUploadModal,
                                        borderRadius: BorderRadius.circular(20),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.add_rounded, color: AppColors.white, size: 18),
                                              const SizedBox(width: 6),
                                              Text(
                                                'exam_clone.list.upload'.tr(),
                                                style: const TextStyle(
                                                  color: AppColors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              if (state.exams.isEmpty)
                                _buildEmptyState()
                              else
                                ListView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: state.exams.length,
                                  itemBuilder: (context, index) {
                                    final exam = state.exams[index];
                                    return TweenAnimationBuilder<double>(
                                      tween: Tween(begin: 0.0, end: 1.0),
                                      duration: Duration(milliseconds: 400 + (index * 100)),
                                      curve: Curves.easeOut,
                                      builder: (context, value, child) {
                                        return Opacity(
                                          opacity: value,
                                          child: Transform.translate(
                                            offset: Offset(0, 20 * (1 - value)),
                                            child: child,
                                          ),
                                        );
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.only(bottom: 12),
                                        child: ExamCard(
                                          exam: exam,
                                          onTap: () => _navigateToExamDetail(context, exam.id),
                                          onDelete: () => _deleteExam(exam.id),
                                          onPractice: () => _navigateToPractice(context, exam.id),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                            ],
                          ),
                        ),
                      );
                    }

                    return const SizedBox.shrink();
                  },
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewNotification(int count) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: child,
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.warning.withOpacity(0.15),
              AppColors.accent.withOpacity(0.1),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.warning.withOpacity(0.3), width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.warning.withOpacity(0.4),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(Icons.notifications_active_rounded, color: AppColors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    count == 1
                        ? 'exam_clone.list.notification.single_due'.tr()
                        : 'exam_clone.list.notification.multiple_due'.tr(namedArgs: {'count': '$count'}),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.warning,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'exam_clone.list.notification.message'.tr(),
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: AppColors.warning, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            // Lottie animation for empty state
            Lottie.network(
              'https://assets2.lottiefiles.com/packages/lf20_0s6tfbuc.json',
              width: 200,
              height: 200,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.purple.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.upload_file_rounded,
                    size: 60,
                    color: AppColors.purple,
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            Text(
              'exam_clone.list.empty.title'.tr(),
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'exam_clone.list.empty.message'.tr(),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showUploadModal,
              icon: const Icon(Icons.upload_rounded),
              label: Text('exam_clone.list.empty.button'.tr()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showUploadModal() {
    final bloc = context.read<ExamCloneBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => UploadExamModal(
        onUpload: (title, subject, examText, filePath) {
          Navigator.pop(dialogContext);
          bloc.add(
            CreateExam(
              title: title,
              subject: subject,
              examText: examText,
              filePath: filePath,
            ),
          );
        },
      ),
    );
  }

  void _deleteExam(String examId) {
    final bloc = context.read<ExamCloneBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('exam_clone.list.delete_dialog.title'.tr()),
        content: Text('exam_clone.list.delete_dialog.message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('exam_clone.list.delete_dialog.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              bloc.add(DeleteExam(examId: examId));
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text('exam_clone.list.delete_dialog.delete'.tr()),
          ),
        ],
      ),
    );
  }

  void _navigateToExamDetail(BuildContext context, String examId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: ExamDetailScreen(examId: examId),
        ),
      ),
    );
  }

  void _navigateToPractice(BuildContext context, String examId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: PracticeScreen(examId: examId),
        ),
      ),
    );
  }

  void _navigateToReviewQueue(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: const ReviewQueueScreen(),
        ),
      ),
    );
  }

  void _navigateToBookmarks(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: const BookmarksScreen(),
        ),
      ),
    );
  }

  void _navigateToBadges(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: const BadgesScreen(),
        ),
      ),
    );
  }

  void _navigateToLeaderboard(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<ExamCloneBloc>(),
          child: const LeaderboardScreen(),
        ),
      ),
    );
  }
}

// Animated Quick Access Button with stagger effect
class _AnimatedQuickAccessButton extends StatelessWidget {
  final int delay;
  final Widget child;

  const _AnimatedQuickAccessButton({
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
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

// Animated Stats Card with stagger effect
class _AnimatedStatsCard extends StatelessWidget {
  final int delay;
  final Widget child;

  const _AnimatedStatsCard({
    required this.delay,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 500 + delay),
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
      child: child,
    );
  }
}
