import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/study_set_entity.dart';
import '../bloc/study_sets_bloc.dart';
import '../bloc/study_sets_event.dart';
import 'create_edit_study_set_screen.dart';
import 'documents_screen.dart';
import 'analytics_screen.dart';
import 'quiz_history_screen.dart';
import '../../../notes/presentation/screens/notes_list_screen.dart';
import '../../../notes/presentation/bloc/notes_bloc.dart';
import '../../../notes/presentation/bloc/notes_event.dart';
import '../../../notes/presentation/bloc/notes_state.dart';
import '../../../notes/domain/entities/note_entity.dart';
import '../../../flashcards/presentation/screens/flashcards_list_screen.dart';
import '../../../flashcards/presentation/screens/study_session_screen.dart';
import '../../../quiz/presentation/screens/quiz_mode_screen.dart';
import '../../../quiz/presentation/screens/match_game_screen.dart';
import '../../../quiz/presentation/screens/live_quiz_screen.dart';
import '../../../flashcards/domain/entities/flashcard_entity.dart';
import '../../../flashcards/presentation/bloc/flashcards_bloc.dart';
import '../../../flashcards/presentation/bloc/flashcards_event.dart';
import '../../../flashcards/presentation/bloc/flashcards_state.dart';
import '../../../flashcards/presentation/widgets/flashcard_editor_widget.dart';
import '../../../flashcards/presentation/screens/add_flashcard_screen.dart';

class StudySetDetailScreen extends StatefulWidget {
  final StudySetEntity studySet;

  const StudySetDetailScreen({
    super.key,
    required this.studySet,
  });

  @override
  State<StudySetDetailScreen> createState() => _StudySetDetailScreenState();
}

class _StudySetDetailScreenState extends State<StudySetDetailScreen>
    with SingleTickerProviderStateMixin {
  // Tabs
  late TabController _tabController;

  // Exam countdown
  Timer? _countdownTimer;
  Map<String, int>? _countdown;

  // Due flashcards count
  int _dueCardsCount = 0;
  bool _loadingDue = false;

  // Sources tab data
  List<Map<String, dynamic>> _sources = [];
  bool _loadingSources = false;

  // Quiz History tab data
  List<Map<String, dynamic>> _quizzes = [];
  Map<String, List<Map<String, dynamic>>> _attemptsByQuiz = {};
  bool _loadingQuizHistory = false;

  StudySetEntity get studySet => widget.studySet;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _startCountdownTimer();
    _loadDueCards();
    // Load flashcards for the Flashcards tab
    context.read<FlashcardsBloc>().add(LoadFlashcards(studySetId: studySet.id));
    // Load notes for the Notes tab
    context.read<NotesBloc>().add(LoadNotes(studySetId: studySet.id));
    // Load sources & quiz history
    _loadSources();
    _loadQuizHistory();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  void _startCountdownTimer() {
    if (studySet.examDate == null) return;

    void tick() {
      final diff = studySet.examDate!.difference(DateTime.now());
      if (diff.isNegative) {
        setState(() => _countdown = null);
        _countdownTimer?.cancel();
        return;
      }
      setState(() {
        _countdown = {
          'days': diff.inDays,
          'hours': diff.inHours % 24,
          'minutes': diff.inMinutes % 60,
          'seconds': diff.inSeconds % 60,
        };
      });
    }

    tick();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  Future<void> _loadDueCards() async {
    setState(() => _loadingDue = true);
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get(
        '/flashcards/study-set/${studySet.id}/due',
      );
      final data = response.data as List<dynamic>;
      final cards = data.map((json) => FlashcardEntity.fromJson(json as Map<String, dynamic>)).toList();
      if (mounted) {
        setState(() {
          _dueCardsCount = cards.length;
          _loadingDue = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingDue = false);
    }
  }

  Future<void> _loadSources() async {
    setState(() => _loadingSources = true);
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/study-sets/${studySet.id}/documents');
      final data = response.data as List<dynamic>;
      if (mounted) {
        setState(() {
          _sources = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _loadingSources = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingSources = false);
    }
  }

  Future<void> _loadQuizHistory() async {
    setState(() => _loadingQuizHistory = true);
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/quiz/study-set/${studySet.id}');
      final data = response.data as List<dynamic>;
      final quizzes = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();

      // Load attempts for each quiz
      final attemptsByQuiz = <String, List<Map<String, dynamic>>>{};
      for (final quiz in quizzes) {
        try {
          final attemptsResponse = await apiClient.get('/quiz/${quiz['id']}/attempts');
          final attemptsData = attemptsResponse.data as List<dynamic>;
          attemptsByQuiz[quiz['id'] as String] =
              attemptsData.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        } catch (_) {
          attemptsByQuiz[quiz['id'] as String] = [];
        }
      }

      if (mounted) {
        setState(() {
          _quizzes = quizzes;
          _attemptsByQuiz = attemptsByQuiz;
          _loadingQuizHistory = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingQuizHistory = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      body: SafeArea(
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              // Header section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(theme, isDark, borderColor),
                      const SizedBox(height: 24),
                      _buildStatsRow(theme, isDark, borderColor),
                      const SizedBox(height: 16),
                      if (studySet.flashcardsCount > 0) ...[
                        _buildActionButtons(theme, isDark, borderColor),
                        const SizedBox(height: 16),
                      ],
                      if (_countdown != null && studySet.examDate != null) ...[
                        _buildExamCountdown(theme, isDark),
                        const SizedBox(height: 16),
                      ],
                    ],
                  ),
                ),
              ),
              // Pinned Tab Bar
              SliverPersistentHeader(
                pinned: true,
                delegate: _SliverTabBarDelegate(
                  tabBar: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                    indicatorColor: AppColors.primary,
                    indicatorWeight: 2.5,
                    labelStyle: AppTextStyles.labelLarge.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    unselectedLabelStyle: AppTextStyles.labelLarge.copyWith(
                      fontWeight: FontWeight.normal,
                    ),
                    dividerColor: borderColor,
                    tabs: [
                      Tab(text: 'study_sets.detail.tab_flashcards'.tr()),
                      Tab(text: 'study_sets.detail.tab_notes'.tr()),
                      Tab(text: 'study_sets.detail.tab_sources'.tr()),
                      Tab(text: 'study_sets.detail.tab_analytics'.tr()),
                      Tab(text: 'study_sets.detail.tab_quiz_history'.tr()),
                    ],
                  ),
                  backgroundColor: theme.scaffoldBackgroundColor,
                ),
              ),
            ];
          },
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildFlashcardsTab(theme, isDark, borderColor),
              _buildNotesTab(theme, isDark, borderColor),
              _buildSourcesTab(theme, isDark, borderColor),
              _buildAnalyticsTab(theme, isDark, borderColor),
              _buildQuizHistoryTab(theme, isDark, borderColor),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Header (matching frontend compact header) ────────────────────────
  Widget _buildHeader(ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: () => Navigator.of(context).pop(),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.arrow_back, size: 20, color: theme.colorScheme.onSurface),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: studySet.coverImageUrl != null
                            ? Image.network(
                                studySet.coverImageUrl!,
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => _buildCoverThumbnail(isDark),
                              )
                            : _buildCoverThumbnail(isDark),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              studySet.title,
                              style: AppTextStyles.headlineSmall.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(
                                  studySet.isPublic ? Icons.public : Icons.lock_outline,
                                  size: 14,
                                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  studySet.isPublic ? 'Public' : 'Private',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => CreateEditStudySetScreen(studySet: studySet),
                                ),
                              );
                            },
                            icon: const Icon(Icons.edit, size: 16),
                            label: Text('common.edit'.tr(), style: const TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              side: BorderSide(color: borderColor),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () => _showDeleteConfirmation(context),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.all(6),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              side: BorderSide(color: borderColor),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              foregroundColor: AppColors.error,
                            ),
                            child: const Icon(Icons.delete_outline, size: 16),
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (studySet.description != null && studySet.description!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      studySet.description!,
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                  if (studySet.tags.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: studySet.tags.map((tag) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            tag,
                            style: AppTextStyles.labelSmall.copyWith(
                              color: isDark ? AppColors.primaryLight : AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCoverThumbnail(bool isDark) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        Icons.collections_bookmark_rounded,
        size: 32,
        color: AppColors.primary,
      ),
    );
  }

  // ─── Stats Row ─────────────────────────────────────────────────────────
  Widget _buildStatsRow(ThemeData theme, bool isDark, Color borderColor) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.menu_book_rounded,
            iconColor: AppColors.primary,
            value: studySet.flashcardsCount.toString(),
            label: 'study_sets.detail.stat_flashcards'.tr(),
            isDark: isDark,
            borderColor: borderColor,
            onTap: () => _tabController.animateTo(0),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.description_rounded,
            iconColor: const Color(0xFFF59E0B),
            value: (studySet.documentsCount).toString(),
            label: 'study_sets.detail.stat_sources'.tr(),
            isDark: isDark,
            borderColor: borderColor,
            onTap: () => _tabController.animateTo(2),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.play_arrow_rounded,
            iconColor: AppColors.error,
            value: _loadingDue ? '...' : _dueCardsCount.toString(),
            label: 'study_sets.detail.stat_due_review'.tr(),
            isDark: isDark,
            borderColor: borderColor,
            onTap: () => _startStudySession(context),
          ),
        ),
      ],
    );
  }

  // ─── Action Buttons ────────────────────────────────────────────────────
  Widget _buildActionButtons(ThemeData theme, bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'study_sets.detail.practice_section'.tr(),
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.w700,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionGridCard(
                icon: Icons.play_arrow_rounded,
                title: 'study_sets.detail.practice_study_session'.tr(),
                subtitle: _dueCardsCount > 0
                    ? 'study_sets.detail.practice_cards_due'.tr(namedArgs: {'count': '$_dueCardsCount'})
                    : 'study_sets.detail.practice_all_cards'.tr(),
                color: AppColors.success,
                isFilled: true,
                onTap: () => _startStudySession(context),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionGridCard(
                icon: Icons.quiz_outlined,
                title: 'study_sets.detail.practice_quiz_mode'.tr(),
                subtitle: 'study_sets.detail.practice_quiz_subtitle'.tr(),
                color: AppColors.primary,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => QuizModeScreen(studySet: studySet),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionGridCard(
                icon: Icons.videogame_asset_outlined,
                title: 'study_sets.detail.practice_match_game'.tr(),
                subtitle: 'study_sets.detail.practice_match_subtitle'.tr(),
                color: AppColors.primary,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => MatchGameScreen(
                        studySetId: studySet.id,
                        studySetTitle: studySet.title,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionGridCard(
                icon: Icons.people_outline,
                title: 'study_sets.detail.practice_live_quiz'.tr(),
                subtitle: 'study_sets.detail.practice_live_subtitle'.tr(),
                color: AppColors.purple,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => LiveQuizScreen(studySet: studySet),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ─── Exam Countdown Banner ─────────────────────────────────────────────
  Widget _buildExamCountdown(ThemeData theme, bool isDark) {
    final totalDays = _countdown!['days']!;
    Color primaryColor;
    Color bgStart;
    Color bgEnd;
    Color unitBg;

    if (totalDays > 14) {
      primaryColor = const Color(0xFF16A34A);
      bgStart = const Color(0xFF22C55E).withValues(alpha: 0.1);
      bgEnd = const Color(0xFF10B981).withValues(alpha: 0.1);
      unitBg = const Color(0xFF22C55E).withValues(alpha: 0.1);
    } else if (totalDays > 7) {
      primaryColor = const Color(0xFFD97706);
      bgStart = const Color(0xFFF59E0B).withValues(alpha: 0.1);
      bgEnd = const Color(0xFFEAB308).withValues(alpha: 0.1);
      unitBg = const Color(0xFFF59E0B).withValues(alpha: 0.1);
    } else {
      primaryColor = const Color(0xFFDC2626);
      bgStart = const Color(0xFFEF4444).withValues(alpha: 0.1);
      bgEnd = const Color(0xFFF97316).withValues(alpha: 0.1);
      unitBg = const Color(0xFFEF4444).withValues(alpha: 0.1);
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [bgStart, bgEnd]),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: primaryColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.calendar_today, size: 20, color: primaryColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${studySet.examSubject ?? "Exam"} Countdown',
                      style: AppTextStyles.titleSmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: primaryColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatExamDate(studySet.examDate!),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _CountdownUnit(value: _countdown!['days']!, label: 'study_sets.detail.countdown_days'.tr(), color: primaryColor, bgColor: unitBg),
              const SizedBox(width: 8),
              _CountdownUnit(value: _countdown!['hours']!, label: 'study_sets.detail.countdown_hours'.tr(), color: primaryColor, bgColor: unitBg),
              const SizedBox(width: 8),
              _CountdownUnit(value: _countdown!['minutes']!, label: 'study_sets.detail.countdown_minutes'.tr(), color: primaryColor, bgColor: unitBg),
              const SizedBox(width: 8),
              _CountdownUnit(value: _countdown!['seconds']!, label: 'study_sets.detail.countdown_seconds'.tr(), color: primaryColor, bgColor: unitBg),
            ],
          ),
        ],
      ),
    );
  }

  String _formatExamDate(DateTime date) {
    final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${weekdays[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TAB CONTENT BUILDERS
  // ═══════════════════════════════════════════════════════════════════════

  // ─── FLASHCARDS TAB ────────────────────────────────────────────────────
  Widget _buildFlashcardsTab(ThemeData theme, bool isDark, Color borderColor) {
    return BlocBuilder<FlashcardsBloc, FlashcardsState>(
      builder: (context, state) {
        if (state is FlashcardsLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        List<FlashcardEntity> flashcards = [];
        if (state is FlashcardsLoaded) {
          flashcards = state.flashcards;
        }

        return Column(
          children: [
            // Action bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Text(
                    'study_sets.detail.cards_count'.tr(namedArgs: {'count': '${flashcards.length}'}),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                  const Spacer(),
                  OutlinedButton.icon(
                    onPressed: () => _showAddCardsSheet(context),
                    icon: const Icon(Icons.add, size: 16),
                    label: Text('study_sets.detail.add_cards'.tr(), style: const TextStyle(fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => FlashcardsListScreen(
                            studySetId: studySet.id,
                            studySetTitle: studySet.title,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.open_in_new, size: 16),
                    label: Text('study_sets.detail.full_view'.tr(), style: const TextStyle(fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: BorderSide(color: borderColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
            // Flashcard list
            Expanded(
              child: flashcards.isEmpty
                  ? _buildEmptyTab(
                      icon: Icons.style_outlined,
                      title: 'study_sets.detail.no_flashcards_title'.tr(),
                      subtitle: 'study_sets.detail.no_flashcards_subtitle'.tr(),
                      buttonLabel: 'study_sets.detail.no_flashcards_button'.tr(),
                      onPressed: () => _showAddCardsSheet(context),
                      isDark: isDark,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      itemCount: flashcards.length,
                      itemBuilder: (context, index) {
                        final card = flashcards[index];
                        return _FlashcardListTile(
                          card: card,
                          index: index,
                          isDark: isDark,
                          borderColor: borderColor,
                          onTap: () => _showFlashcardPreview(card),
                          onEdit: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => AddFlashcardScreen(
                                studySetId: card.studySetId,
                                flashcard: card,
                              ),
                            ),
                          ),
                          onDelete: () => _confirmDeleteFlashcard(card),
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  // ─── NOTES TAB ─────────────────────────────────────────────────────────
  Widget _buildNotesTab(ThemeData theme, bool isDark, Color borderColor) {
    return BlocBuilder<NotesBloc, NotesState>(
      builder: (context, state) {
        if (state is NotesLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        List<NoteEntity> notes = [];
        if (state is NotesLoaded) {
          notes = state.notes;
        }

        return Column(
          children: [
            // Action bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Text(
                    'study_sets.detail.notes_count'.tr(namedArgs: {'count': '${notes.length}'}),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                  const Spacer(),
                  OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => BlocProvider.value(
                            value: context.read<NotesBloc>(),
                            child: NotesListScreen(
                              studySetId: studySet.id,
                              studySetTitle: studySet.title,
                            ),
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.open_in_new, size: 16),
                    label: Text('study_sets.detail.full_view'.tr(), style: const TextStyle(fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: BorderSide(color: borderColor),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
            // Notes list
            Expanded(
              child: notes.isEmpty
                  ? _buildEmptyTab(
                      icon: Icons.note_outlined,
                      title: 'study_sets.detail.no_notes_title'.tr(),
                      subtitle: 'study_sets.detail.no_notes_subtitle'.tr(),
                      buttonLabel: 'study_sets.detail.no_notes_button'.tr(),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => BlocProvider.value(
                              value: context.read<NotesBloc>(),
                              child: NotesListScreen(
                                studySetId: studySet.id,
                                studySetTitle: studySet.title,
                              ),
                            ),
                          ),
                        );
                      },
                      isDark: isDark,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      itemCount: notes.length,
                      itemBuilder: (context, index) {
                        final note = notes[index];
                        return _NoteListTile(
                          note: note,
                          isDark: isDark,
                          borderColor: borderColor,
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  // ─── SOURCES TAB ───────────────────────────────────────────────────────
  Widget _buildSourcesTab(ThemeData theme, bool isDark, Color borderColor) {
    if (_loadingSources) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Row(
            children: [
              Text(
                'study_sets.detail.sources_count'.tr(namedArgs: {'count': '${_sources.length}'}),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => DocumentsScreen(studySet: studySet),
                    ),
                  );
                },
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text('study_sets.detail.manage_sources'.tr(), style: const TextStyle(fontSize: 13)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _sources.isEmpty
              ? _buildEmptyTab(
                  icon: Icons.folder_outlined,
                  title: 'study_sets.detail.no_sources_title'.tr(),
                  subtitle: 'study_sets.detail.no_sources_subtitle'.tr(),
                  buttonLabel: 'study_sets.detail.no_sources_button'.tr(),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => DocumentsScreen(studySet: studySet),
                      ),
                    );
                  },
                  isDark: isDark,
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: _sources.length,
                  itemBuilder: (context, index) {
                    final source = _sources[index];
                    return _SourceListTile(
                      source: source,
                      isDark: isDark,
                      borderColor: borderColor,
                    );
                  },
                ),
        ),
      ],
    );
  }

  // ─── ANALYTICS TAB ─────────────────────────────────────────────────────
  Widget _buildAnalyticsTab(ThemeData theme, bool isDark, Color borderColor) {
    return BlocBuilder<FlashcardsBloc, FlashcardsState>(
      builder: (context, state) {
        List<FlashcardEntity> flashcards = [];
        if (state is FlashcardsLoaded) {
          flashcards = state.flashcards;
        }

        final newCards = flashcards.where((c) => c.repetitions == 0).length;
        final learningCards = flashcards.where((c) => c.repetitions > 0 && c.interval < 7).length;
        final reviewCards = flashcards.where((c) => c.interval >= 7 && c.interval < 30).length;
        final masteredCards = flashcards.where((c) => c.interval >= 30).length;
        final dueNow = flashcards.where((c) => c.isDue).length;
        final masteryPercent = flashcards.isEmpty
            ? 0
            : ((masteredCards / flashcards.length) * 100).round();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Summary stats
              Row(
                children: [
                  Expanded(
                    child: _AnalyticsStat(
                      label: 'study_sets.detail.analytics_total_cards'.tr(),
                      value: flashcards.length.toString(),
                      icon: Icons.layers_outlined,
                      color: AppColors.primary,
                      isDark: isDark,
                      borderColor: borderColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _AnalyticsStat(
                      label: 'study_sets.detail.analytics_mastery'.tr(),
                      value: '$masteryPercent%',
                      icon: Icons.emoji_events_outlined,
                      color: const Color(0xFFF59E0B),
                      isDark: isDark,
                      borderColor: borderColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _AnalyticsStat(
                      label: 'study_sets.detail.analytics_due_now'.tr(),
                      value: dueNow.toString(),
                      icon: Icons.schedule,
                      color: AppColors.error,
                      isDark: isDark,
                      borderColor: borderColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _AnalyticsStat(
                      label: 'study_sets.detail.analytics_mastered'.tr(),
                      value: masteredCards.toString(),
                      icon: Icons.check_circle_outline,
                      color: AppColors.success,
                      isDark: isDark,
                      borderColor: borderColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Cards by status
              Text(
                'Cards by Status',
                style: AppTextStyles.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              _StatusBar(
                newCount: newCards,
                learningCount: learningCards,
                reviewCount: reviewCards,
                masteredCount: masteredCards,
                total: flashcards.length,
                isDark: isDark,
              ),
              const SizedBox(height: 24),
              // View full analytics
              Center(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => AnalyticsScreen(studySet: studySet),
                      ),
                    );
                  },
                  icon: const Icon(Icons.bar_chart_rounded, size: 18),
                  label: Text('study_sets.detail.view_full_analytics'.tr()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    side: BorderSide(color: borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ─── QUIZ HISTORY TAB ──────────────────────────────────────────────────
  Widget _buildQuizHistoryTab(ThemeData theme, bool isDark, Color borderColor) {
    if (_loadingQuizHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    // Summary stats
    final totalAttempts = _attemptsByQuiz.values.fold<int>(0, (sum, a) => sum + a.length);
    int bestScore = 0;
    for (final attempts in _attemptsByQuiz.values) {
      for (final attempt in attempts) {
        final score = (attempt['score'] as num?)?.toInt() ?? 0;
        if (score > bestScore) bestScore = score;
      }
    }

    return Column(
      children: [
        // Summary row
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Row(
            children: [
              _QuizSummaryStat(
                label: 'study_sets.detail.quiz_quizzes'.tr(),
                value: _quizzes.length.toString(),
                isDark: isDark,
                borderColor: borderColor,
              ),
              const SizedBox(width: 12),
              _QuizSummaryStat(
                label: 'study_sets.detail.quiz_attempts'.tr(),
                value: totalAttempts.toString(),
                isDark: isDark,
                borderColor: borderColor,
              ),
              const SizedBox(width: 12),
              _QuizSummaryStat(
                label: 'study_sets.detail.quiz_best_score'.tr(),
                value: '$bestScore%',
                isDark: isDark,
                borderColor: borderColor,
              ),
            ],
          ),
        ),
        Expanded(
          child: _quizzes.isEmpty
              ? _buildEmptyTab(
                  icon: Icons.quiz_outlined,
                  title: 'study_sets.detail.no_quiz_title'.tr(),
                  subtitle: 'study_sets.detail.no_quiz_subtitle'.tr(),
                  buttonLabel: 'study_sets.detail.no_quiz_button'.tr(),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => QuizModeScreen(studySet: studySet),
                      ),
                    );
                  },
                  isDark: isDark,
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: _quizzes.length,
                  itemBuilder: (context, index) {
                    final quiz = _quizzes[index];
                    final attempts = _attemptsByQuiz[quiz['id'] as String] ?? [];
                    int quizBest = 0;
                    for (final a in attempts) {
                      final s = (a['score'] as num?)?.toInt() ?? 0;
                      if (s > quizBest) quizBest = s;
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: theme.cardColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEC4899).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.quiz, size: 20, color: Color(0xFFEC4899)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  quiz['title'] as String? ?? 'Quiz',
                                  style: AppTextStyles.titleSmall.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: theme.colorScheme.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${quiz['questionCount'] ?? 0} questions  ·  ${attempts.length} attempts',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (attempts.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: quizBest >= 70
                                    ? AppColors.success.withValues(alpha: 0.1)
                                    : quizBest >= 40
                                        ? const Color(0xFFF59E0B).withValues(alpha: 0.1)
                                        : AppColors.error.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                'Best: $quizBest%',
                                style: AppTextStyles.labelSmall.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: quizBest >= 70
                                      ? AppColors.success
                                      : quizBest >= 40
                                          ? const Color(0xFFF59E0B)
                                          : AppColors.error,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        // Full view button
        Padding(
          padding: const EdgeInsets.all(20),
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => QuizHistoryScreen(studySet: studySet),
                ),
              );
            },
            icon: const Icon(Icons.open_in_new, size: 16),
            label: Text('study_sets.detail.view_full_history'.tr()),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              side: BorderSide(color: borderColor),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ),
      ],
    );
  }

  // ─── Empty tab placeholder ─────────────────────────────────────────────
  Widget _buildEmptyTab({
    required IconData icon,
    required String title,
    required String subtitle,
    required String buttonLabel,
    required VoidCallback onPressed,
    required bool isDark,
  }) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, size: 32, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: AppTextStyles.bodyMedium.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            PrimaryButton(
              text: buttonLabel,
              onPressed: onPressed,
              gradient: AppColors.greenGradient,
            ),
          ],
        ),
      ),
    );
  }

  // ─── Helper Methods ────────────────────────────────────────────────────

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('study_sets.detail.delete_confirm_title'.tr()),
        content: Text(
          'study_sets.detail.delete_confirm_message'.tr(namedArgs: {'title': studySet.title}),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('study_sets.detail.delete_confirm_cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              context.read<StudySetsBloc>().add(
                    DeleteStudySet(id: studySet.id),
                  );
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: Text(
              'study_sets.detail.delete_confirm_delete'.tr(),
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  void _startStudySession(BuildContext context) async {
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get(
        '/flashcards/study-set/${studySet.id}/due',
      );

      if (!mounted) return;
      navigator.pop();

      final flashcardsData = response.data as List<dynamic>;
      final dueCards = flashcardsData
          .map((json) => FlashcardEntity.fromJson(json as Map<String, dynamic>))
          .toList();

      if (dueCards.isEmpty) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('study_sets.detail.study_no_cards_due'.tr()),
            backgroundColor: AppColors.success,
          ),
        );
        return;
      }

      navigator.push(
        MaterialPageRoute(
          builder: (_) => StudySessionScreen(
            flashcards: dueCards,
            studySetTitle: studySet.title,
            onReview: (flashcardId, quality) async {
              await apiClient.post(
                '/flashcards/$flashcardId/review',
                data: {'quality': quality},
              );
            },
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      navigator.pop();
      messenger.showSnackBar(
        SnackBar(
          content: Text('study_sets.detail.study_failed_to_load'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showAddCardsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      builder: (BuildContext sheetContext) {
        List<FlashcardData> cardsToAdd = [];

        return BlocProvider.value(
          value: context.read<FlashcardsBloc>(),
          child: BlocListener<FlashcardsBloc, FlashcardsState>(
            listener: (context, state) {
              if (state is FlashcardsBulkCreated) {
                Navigator.pop(sheetContext);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.white),
                        const SizedBox(width: 12),
                        Text('study_sets.detail.toast_cards_added_success'.tr(
                            namedArgs: {'count': state.flashcards.length.toString()})),
                      ],
                    ),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                );
                // Reload flashcards
                context.read<FlashcardsBloc>().add(LoadFlashcards(studySetId: studySet.id));
              } else if (state is FlashcardsError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('study_sets.detail.toast_cards_add_error'.tr(
                        namedArgs: {'message': state.message})),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            },
            child: StatefulBuilder(
              builder: (context, setState) {
                final theme = Theme.of(context);
                final isDark = theme.brightness == Brightness.dark;

                return Container(
                  height: MediaQuery.of(context).size.height * 0.95,
                  decoration: BoxDecoration(
                    color: theme.scaffoldBackgroundColor,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 20,
                        offset: const Offset(0, -5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 12, bottom: 8),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.grey400,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.fromLTRB(20, 8, 12, 16),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.08),
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                gradient: AppColors.greenGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'study_sets.detail.add_cards_header'.tr(),
                                    style: AppTextStyles.titleLarge.copyWith(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 20,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    studySet.title,
                                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 24),
                              onPressed: () => Navigator.pop(sheetContext),
                              style: IconButton.styleFrom(
                                backgroundColor: isDark ? AppColors.grey800 : AppColors.grey100,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: FlashcardEditorWidget(
                          studySetId: studySet.id,
                          onFlashcardsAdded: (cards) {
                            setState(() => cardsToAdd = cards);
                          },
                        ),
                      ),
                      if (cardsToAdd.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                          decoration: BoxDecoration(
                            color: theme.scaffoldBackgroundColor,
                            border: Border(
                              top: BorderSide(
                                color: theme.colorScheme.onSurface.withValues(alpha: 0.08),
                              ),
                            ),
                          ),
                          child: SafeArea(
                            top: false,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        AppColors.secondary.withValues(alpha: 0.1),
                                        AppColors.primary.withValues(alpha: 0.1),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.secondary.withValues(alpha: 0.3)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.check_circle_outline, color: AppColors.secondary, size: 20),
                                      const SizedBox(width: 8),
                                      Text(
                                        '${cardsToAdd.length} card${cardsToAdd.length == 1 ? '' : 's'} ready',
                                        style: AppTextStyles.titleSmall.copyWith(
                                          color: AppColors.secondary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 12),
                                PrimaryButton(
                                  text: 'study_sets.detail.add_cards_submit_button'.tr(),
                                  icon: Icons.add,
                                  onPressed: () {
                                    context.read<FlashcardsBloc>().add(
                                          BulkCreateFlashcards(
                                            studySetId: studySet.id,
                                            flashcards: cardsToAdd,
                                          ),
                                        );
                                  },
                                  width: double.infinity,
                                  gradient: AppColors.greenGradient,
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }

  // ─── Flashcard Preview ──────────────────────────────────────────────────

  void _showFlashcardPreview(FlashcardEntity card) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final statusColor = card.statusLabel == 'Mastered'
        ? AppColors.success
        : card.statusLabel == 'Review'
            ? const Color(0xFFF59E0B)
            : card.statusLabel == 'Learning'
                ? AppColors.primary
                : AppColors.grey500;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.grey300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Badges row
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        card.statusLabel,
                        style: AppTextStyles.labelSmall.copyWith(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (card.isDue) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Due',
                          style: AppTextStyles.labelSmall.copyWith(
                            color: AppColors.error,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    Text(
                      card.type.toUpperCase(),
                      style: AppTextStyles.labelSmall.copyWith(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Front
                Text(
                  'Front',
                  style: AppTextStyles.labelMedium.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  card.front,
                  style: AppTextStyles.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 16),
                Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                const SizedBox(height: 16),
                // Back
                Text(
                  'Back',
                  style: AppTextStyles.labelMedium.copyWith(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  card.back,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                // Notes
                if (card.notes != null && card.notes!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                  const SizedBox(height: 16),
                  Text(
                    'Notes',
                    style: AppTextStyles.labelMedium.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    card.notes!,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => AddFlashcardScreen(
                                studySetId: card.studySetId,
                                flashcard: card,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.edit_rounded, size: 18),
                        label: Text('study_sets.detail.flashcard_edit'.tr()),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(sheetContext);
                          _confirmDeleteFlashcard(card);
                        },
                        icon: const Icon(Icons.delete_rounded, size: 18),
                        label: Text('study_sets.detail.flashcard_delete'.tr()),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: BorderSide(color: AppColors.error.withValues(alpha: 0.3)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _confirmDeleteFlashcard(FlashcardEntity card) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('study_sets.detail.flashcard_delete_title'.tr()),
        content: Text('study_sets.detail.flashcard_delete_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<FlashcardsBloc>().add(DeleteFlashcard(id: card.id));
              context.read<FlashcardsBloc>().add(LoadFlashcards(studySetId: studySet.id));
            },
            child: const Text(
              'Delete',
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER WIDGETS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Sliver Tab Bar Delegate ─────────────────────────────────────────────
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color backgroundColor;

  _SliverTabBarDelegate({required this.tabBar, required this.backgroundColor});

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return tabBar != oldDelegate.tabBar || backgroundColor != oldDelegate.backgroundColor;
  }
}

// ─── Stat Card Widget ────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;
  final bool isDark;
  final Color borderColor;
  final VoidCallback? onTap;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
    required this.isDark,
    required this.borderColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: AppTextStyles.headlineSmall.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  Text(
                    label,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 11,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Action Grid Card ────────────────────────────────────────────────────
class _ActionGridCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final bool isFilled;
  final VoidCallback onTap;

  const _ActionGridCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    this.isFilled = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bgColor = isFilled
        ? null
        : (isDark ? const Color(0xFF1E1E2E) : Colors.white);
    final gradient = isFilled
        ? LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color, color.withValues(alpha: 0.8)],
          )
        : null;
    final borderSide = isFilled
        ? BorderSide.none
        : BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.06),
          );

    final iconFg = isFilled ? Colors.white : color;
    final iconBg = isFilled
        ? Colors.white.withValues(alpha: 0.2)
        : color.withValues(alpha: 0.1);
    final titleColor = isFilled ? Colors.white : theme.colorScheme.onSurface;
    final subtitleColor = isFilled
        ? Colors.white.withValues(alpha: 0.8)
        : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight);

    return Material(
      color: bgColor,
      borderRadius: BorderRadius.circular(12),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(12),
          border: Border.fromBorderSide(borderSide),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, size: 24, color: iconFg),
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: titleColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: subtitleColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Countdown Unit ──────────────────────────────────────────────────────
class _CountdownUnit extends StatelessWidget {
  final int value;
  final String label;
  final Color color;
  final Color bgColor;

  const _CountdownUnit({
    required this.value,
    required this.label,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              value.toString().padLeft(2, '0'),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label.toUpperCase(),
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: Colors.grey,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Flashcard List Tile ─────────────────────────────────────────────────
class _FlashcardListTile extends StatelessWidget {
  final FlashcardEntity card;
  final int index;
  final bool isDark;
  final Color borderColor;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const _FlashcardListTile({
    required this.card,
    required this.index,
    required this.isDark,
    required this.borderColor,
    this.onTap,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = card.statusLabel == 'Mastered'
        ? AppColors.success
        : card.statusLabel == 'Review'
            ? const Color(0xFFF59E0B)
            : card.statusLabel == 'Learning'
                ? AppColors.primary
                : AppColors.grey500;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              alignment: Alignment.center,
              child: Text(
                '${index + 1}',
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    card.front,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    card.back,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                card.statusLabel,
                style: AppTextStyles.labelSmall.copyWith(
                  color: statusColor,
                  fontWeight: FontWeight.w600,
                  fontSize: 10,
                ),
              ),
            ),
            PopupMenuButton<String>(
              icon: Icon(
                Icons.more_vert,
                size: 18,
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              onSelected: (value) {
                switch (value) {
                  case 'preview':
                    onTap?.call();
                    break;
                  case 'edit':
                    onEdit?.call();
                    break;
                  case 'delete':
                    onDelete?.call();
                    break;
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'preview',
                  child: Row(
                    children: [
                      const Icon(Icons.visibility_rounded, size: 18, color: AppColors.primary),
                      const SizedBox(width: 10),
                      Text('study_sets.detail.flashcard_preview'.tr()),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      const Icon(Icons.edit_rounded, size: 18, color: AppColors.primary),
                      const SizedBox(width: 10),
                      Text('study_sets.detail.flashcard_edit'.tr()),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      const Icon(Icons.delete_rounded, size: 18, color: AppColors.error),
                      const SizedBox(width: 10),
                      Text('study_sets.detail.flashcard_delete'.tr(), style: const TextStyle(color: AppColors.error)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Note List Tile ──────────────────────────────────────────────────────
class _NoteListTile extends StatelessWidget {
  final NoteEntity note;
  final bool isDark;
  final Color borderColor;

  const _NoteListTile({
    required this.note,
    required this.isDark,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (note.isPinned)
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: Icon(Icons.push_pin, size: 14, color: AppColors.primary),
                ),
              Expanded(
                child: Text(
                  note.title,
                  style: AppTextStyles.titleSmall.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (note.sourceType.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _sourceColor(note.sourceType).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _sourceLabel(note.sourceType),
                    style: AppTextStyles.labelSmall.copyWith(
                      color: _sourceColor(note.sourceType),
                      fontSize: 10,
                    ),
                  ),
                ),
            ],
          ),
          if (note.summary != null && note.summary!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              note.summary!,
              style: AppTextStyles.bodySmall.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Color _sourceColor(String type) {
    switch (type) {
      case 'ai_generated':
        return const Color(0xFF8B5CF6);
      case 'extracted':
        return const Color(0xFF3B82F6);
      default:
        return AppColors.primary;
    }
  }

  String _sourceLabel(String type) {
    switch (type) {
      case 'ai_generated':
        return 'AI';
      case 'extracted':
        return 'Extracted';
      default:
        return 'Manual';
    }
  }
}

// ─── Source List Tile ────────────────────────────────────────────────────
class _SourceListTile extends StatelessWidget {
  final Map<String, dynamic> source;
  final bool isDark;
  final Color borderColor;

  const _SourceListTile({
    required this.source,
    required this.isDark,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final type = source['type'] as String? ?? 'document';
    final title = source['title'] as String? ?? source['fileName'] as String? ?? 'Untitled';

    IconData icon;
    Color iconColor;
    switch (type) {
      case 'pdf':
        icon = Icons.picture_as_pdf;
        iconColor = AppColors.error;
        break;
      case 'image':
        icon = Icons.image;
        iconColor = const Color(0xFF8B5CF6);
        break;
      case 'audio':
        icon = Icons.audiotrack;
        iconColor = const Color(0xFFF59E0B);
        break;
      case 'youtube':
        icon = Icons.play_circle_fill;
        iconColor = AppColors.error;
        break;
      default:
        icon = Icons.description;
        iconColor = const Color(0xFF3B82F6);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Analytics Stat Card ─────────────────────────────────────────────────
class _AnalyticsStat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool isDark;
  final Color borderColor;

  const _AnalyticsStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDark,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const Spacer(),
              Text(
                value,
                style: AppTextStyles.headlineSmall.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Status Bar (for Analytics tab) ──────────────────────────────────────
class _StatusBar extends StatelessWidget {
  final int newCount;
  final int learningCount;
  final int reviewCount;
  final int masteredCount;
  final int total;
  final bool isDark;

  const _StatusBar({
    required this.newCount,
    required this.learningCount,
    required this.reviewCount,
    required this.masteredCount,
    required this.total,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    if (total == 0) {
      return const SizedBox.shrink();
    }

    return Column(
      children: [
        // Progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: SizedBox(
            height: 12,
            child: Row(
              children: [
                if (newCount > 0)
                  Expanded(
                    flex: newCount,
                    child: Container(color: AppColors.grey400),
                  ),
                if (learningCount > 0)
                  Expanded(
                    flex: learningCount,
                    child: Container(color: AppColors.primary),
                  ),
                if (reviewCount > 0)
                  Expanded(
                    flex: reviewCount,
                    child: Container(color: const Color(0xFFF59E0B)),
                  ),
                if (masteredCount > 0)
                  Expanded(
                    flex: masteredCount,
                    child: Container(color: AppColors.success),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Legend
        Wrap(
          spacing: 16,
          runSpacing: 8,
          children: [
            _legendItem('New', newCount, AppColors.grey400),
            _legendItem('Learning', learningCount, AppColors.primary),
            _legendItem('Review', reviewCount, const Color(0xFFF59E0B)),
            _legendItem('Mastered', masteredCount, AppColors.success),
          ],
        ),
      ],
    );
  }

  Widget _legendItem(String label, int count, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          '$label ($count)',
          style: AppTextStyles.bodySmall.copyWith(
            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          ),
        ),
      ],
    );
  }
}

// ─── Quiz Summary Stat ───────────────────────────────────────────────────
class _QuizSummaryStat extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  final Color borderColor;

  const _QuizSummaryStat({
    required this.label,
    required this.value,
    required this.isDark,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
