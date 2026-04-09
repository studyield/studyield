import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/constants/level_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../config/api_config.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/notification_provider.dart';
import '../../../../shared/providers/theme_provider.dart';
import '../../../study_sets/presentation/screens/study_sets_screen.dart';
import '../../../study_sets/presentation/screens/create_edit_study_set_screen.dart';
import '../../../study_sets/presentation/screens/study_set_detail_screen.dart';
import '../../../study_sets/domain/entities/study_set_entity.dart';
import '../../../study_sets/presentation/bloc/study_sets_bloc.dart';
import '../../../study_sets/presentation/bloc/study_sets_event.dart';
import '../../../study_sets/presentation/bloc/study_sets_state.dart';
import '../../../flashcards/presentation/screens/study_session_screen.dart';
import '../../../flashcards/domain/entities/flashcard_entity.dart';
import '../../../../core/network/api_client.dart';
import '../../../exam_clone/presentation/screens/exam_clone_list_screen.dart';
import '../../../exam_clone/presentation/bloc/exam_clone_bloc.dart';
import '../../../problem_solver/presentation/screens/problem_input_screen.dart';
import '../../../problem_solver/presentation/bloc/problem_solver_bloc.dart';
import '../../../problem_solver/data/repositories/problem_solver_repository_impl.dart';
import '../../../ai_chat/presentation/screens/chat_screen.dart';
import '../../../ai_chat/presentation/bloc/chat_bloc.dart';
import '../../../ai_chat/data/repositories/chat_repository_impl.dart';
import '../../../analytics/presentation/screens/analytics_screen.dart';
import '../../../analytics/presentation/bloc/analytics_bloc.dart';
import '../../../analytics/data/repositories/analytics_repository_impl.dart';
import '../../../learning_path/presentation/screens/learning_paths_screen.dart';
import '../../../learning_path/presentation/bloc/learning_path_bloc.dart';
import '../../../learning_path/data/repositories/learning_path_repository_impl.dart';
import '../../../research/presentation/screens/research_screen.dart';
import '../../../research/presentation/bloc/research_bloc.dart';
import '../../../research/data/repositories/research_repository_impl.dart';
import '../../../teach_back/presentation/screens/teach_back_screen.dart';
import '../../../teach_back/presentation/bloc/teach_back_bloc.dart';
import '../../../teach_back/data/repositories/teach_back_repository_impl.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../notifications/presentation/screens/notifications_screen.dart';
import '../../../../core/widgets/badges/pro_badge.dart';
import '../../../../core/widgets/navigation/app_bottom_nav.dart';

class HomeScreen extends StatefulWidget {
  final bool hideBottomNav;

  const HomeScreen({super.key, this.hideBottomNav = false});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _gamification;
  List<Map<String, dynamic>> _dueFlashcards = [];
  bool _isLoadingStats = true;
  bool _isLoadingDue = true;
  bool _isLoadingGamification = true;

  @override
  void initState() {
    super.initState();
    context.read<StudySetsBloc>().add(LoadStudySets(page: 1, limit: 5));

    // Fetch notifications after build completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications();
    });

    _fetchDueCards();
    _fetchStatsAndGamification();
  }

  Future<void> _fetchStatsAndGamification() async {
    await _fetchUserStats();
    await _fetchGamification();
  }

  Future<void> _fetchUserStats() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get(Endpoints.stats);
      setState(() {
        _stats = response.data as Map<String, dynamic>;
        _isLoadingStats = false;
      });
    } catch (e) {
      print('Failed to fetch stats: $e');
      setState(() => _isLoadingStats = false);
    }
  }

  Future<void> _fetchDueCards() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/flashcards/due?limit=100');
      final data = response.data;
      final flashcards = (data is Map ? data['data'] : data) as List<dynamic>;

      setState(() {
        _dueFlashcards = flashcards.map((f) => f as Map<String, dynamic>).toList();
        _isLoadingDue = false;
      });
    } catch (e) {
      print('Failed to fetch due cards: $e');
      setState(() => _isLoadingDue = false);
    }
  }

  /// Compute level from totalXp using thresholds (same as frontend getLevelFromXP)
  Map<String, dynamic> _computeGamificationFromStats(Map<String, dynamic> stats) {
    final thresholds = LevelConstants.thresholds;
    final flashcardsCount = (stats['flashcardsCount'] ?? 0) as int;
    final quizzesCompleted = (stats['quizzesCompleted'] ?? 0) as int;
    final totalXp = flashcardsCount * 10 + quizzesCompleted * 50;

    int level = 0;
    for (int i = thresholds.length - 1; i >= 0; i--) {
      if (totalXp >= thresholds[i]) {
        level = i;
        break;
      }
    }
    final currentLevelXp = thresholds[level];
    final nextLevelXp = (level + 1 < thresholds.length)
        ? thresholds[level + 1]
        : thresholds[level] + 2500;

    return {
      'totalXp': totalXp,
      'level': level,
      'streakDays': stats['streakDays'] ?? 0,
      'dailyXp': 0,
      'dailyGoal': 100,
      'nextLevelXp': nextLevelXp,
      'currentLevelXp': currentLevelXp,
    };
  }

  Future<void> _fetchGamification() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/users/me/gamification');
      var data = response.data as Map<String, dynamic>;

      // Match frontend: if API returns 0 totalXp but user has stats, compute from stats
      final totalXp = (data['totalXp'] ?? 0) as int;
      if (totalXp == 0 && _stats != null) {
        data = _computeGamificationFromStats(_stats!);
      }

      setState(() {
        _gamification = data;
        _isLoadingGamification = false;
      });
    } catch (e) {
      print('Failed to fetch gamification: $e');
      // Fallback: compute from user stats (same as frontend useGamificationStore)
      if (_stats != null) {
        setState(() {
          _gamification = _computeGamificationFromStats(_stats!);
          _isLoadingGamification = false;
        });
      } else {
        setState(() => _isLoadingGamification = false);
      }
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'home.greeting.morning'.tr();
    if (hour < 17) return 'home.greeting.afternoon'.tr();
    return 'home.greeting.evening'.tr();
  }

  Widget _buildXPProgressCard() {
    final gamification = _gamification!;
    final level = (gamification['level'] ?? 0) as int;
    final totalXP = (gamification['totalXp'] ?? 0) as int;
    final currentLevelXP = (gamification['currentLevelXp'] ?? 0) as int;
    final nextLevelXP = (gamification['nextLevelXp'] ?? 100) as int;
    final streakDays = (gamification['streakDays'] ?? 0) as int;
    final dailyXP = (gamification['dailyXp'] ?? 0) as int;
    final dailyXPGoal = (gamification['dailyGoal'] ?? 100) as int;

    // Match frontend: xpInLevel = totalXp - currentLevelXp
    final xpInLevel = totalXP - currentLevelXP;
    final xpNeeded = nextLevelXP - currentLevelXP;
    final progressPct = xpNeeded > 0 ? (xpInLevel / xpNeeded).clamp(0.0, 1.0) : 1.0;
    final dailyPct = dailyXPGoal > 0 ? (dailyXP / dailyXPGoal).clamp(0.0, 1.0) : 0.0;

    final levelInfo = LevelConstants.getLevelInfo(level);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.all(AppDimensions.space16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        children: [
          // Row 1: Level badge + XP progress bar
          Row(
            children: [
              // Level badge with star
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: levelInfo.gradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: levelInfo.gradientColors.first.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        '$level',
                        style: AppTextStyles.titleMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Icon(
                      Icons.star_rounded,
                      size: 16,
                      color: const Color(0xFFFBBF24), // amber-400
                    ),
                  ),
                ],
              ),
              SizedBox(width: 12),
              // XP progress
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'home.gamification.level_names.$level'.tr(),
                          style: AppTextStyles.labelMedium.copyWith(
                            color: levelInfo.textColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '$xpInLevel / $xpNeeded ${'home.gamification.xp'.tr()}',
                          style: AppTextStyles.labelSmall.copyWith(
                            color: isDark ? AppColors.grey400 : AppColors.grey600,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(
                        height: 10,
                        child: Stack(
                          children: [
                            // Background
                            Container(
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.grey800 : AppColors.grey200,
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            // Progress fill with level gradient
                            FractionallySizedBox(
                              widthFactor: progressPct,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: levelInfo.gradient,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          SizedBox(height: 12),

          // Row 2: Streak + Daily XP goal
          Row(
            children: [
              // Streak pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withValues(alpha: 0.1), // orange-500/10
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.local_fire_department,
                      color: const Color(0xFFF97316), // orange-500
                      size: 16,
                    ),
                    SizedBox(width: 6),
                    Text(
                      '$streakDays ${streakDays == 1 ? 'home.gamification.day'.tr() : 'home.gamification.days'.tr()}',
                      style: AppTextStyles.labelMedium.copyWith(
                        color: isDark ? const Color(0xFFFB923C) : const Color(0xFFEA580C), // orange-400 / orange-600
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),

              SizedBox(width: 12),

              // Daily XP with circular ring
              Expanded(
                child: Row(
                  children: [
                    // Circular progress ring
                    SizedBox(
                      width: 32,
                      height: 32,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          CustomPaint(
                            size: const Size(32, 32),
                            painter: _DailyXPRingPainter(
                              progress: dailyPct,
                              bgColor: isDark ? AppColors.grey800 : AppColors.grey200,
                              fgColor: const Color(0xFF22C55E), // green-500
                            ),
                          ),
                          Icon(
                            Icons.bolt,
                            size: 14,
                            color: const Color(0xFF22C55E), // green-500
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 8),
                    Flexible(
                      child: Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: '$dailyXP',
                              style: AppTextStyles.labelMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextSpan(
                              text: ' / $dailyXPGoal ${'home.gamification.daily_xp'.tr()}',
                              style: AppTextStyles.labelSmall.copyWith(
                                color: isDark ? AppColors.grey400 : AppColors.grey600,
                              ),
                            ),
                          ],
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = Theme.of(context);

    return Scaffold(
      extendBody: false,
      body: Stack(
        children: [
          // Gradient background - only at top
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 250,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.primary.withOpacity(0.25),
                    AppColors.primaryLight.withOpacity(0.15),
                    AppColors.transparent,
                  ],
                ),
              ),
            ),
          ),
          // Content
          CustomScrollView(
          slivers: [
            // App Bar with transparent background
            SliverAppBar(
              floating: true,
              backgroundColor: AppColors.transparent,
              elevation: 0,
              title: Row(
                children: [
                  Image.asset(
                    'assets/logo/studyield-logo.png',
                    width: 36,
                    height: 36,
                    errorBuilder: (_, __, ___) => const SizedBox(width: 36, height: 36),
                  ),
                  SizedBox(width: AppDimensions.space8),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF34D399)],
                    ).createShader(Rect.fromLTWH(0, 0, bounds.width, bounds.height)),
                    child: Text(
                      'Studyield',
                      style: AppTextStyles.titleLarge.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  SizedBox(width: AppDimensions.space12),
                ],
              ),
              actions: [
                // Theme Toggle
                Consumer<ThemeProvider>(
                  builder: (context, themeProvider, _) {
                    return IconButton(
                      icon: Icon(
                        themeProvider.isDarkMode
                            ? Icons.light_mode_rounded
                            : Icons.dark_mode_rounded,
                        color: theme.colorScheme.primary,
                      ),
                      onPressed: () => themeProvider.toggleTheme(),
                    );
                  },
                ),
                // Notifications
                Consumer<NotificationProvider>(
                  builder: (context, notificationProvider, _) {
                    return IconButton(
                      icon: Stack(
                        children: [
                          Icon(
                            Icons.notifications_rounded,
                            color: theme.colorScheme.primary,
                          ),
                          if (notificationProvider.unreadCount > 0)
                            Positioned(
                              right: 0,
                              top: 0,
                              child: Container(
                                padding: EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: AppColors.error,
                                  shape: BoxShape.circle,
                                ),
                                constraints: BoxConstraints(
                                  minWidth: 16,
                                  minHeight: 16,
                                ),
                                child: Text(
                                  '${notificationProvider.unreadCount}',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                        ],
                      ),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const NotificationsScreen(),
                          ),
                        );
                      },
                    );
                  },
                ),
                SizedBox(width: AppDimensions.space8),
              ],
            ),

            // Content
            SliverPadding(
              padding: EdgeInsets.only(
                left: AppDimensions.screenPaddingHorizontal,
                right: AppDimensions.screenPaddingHorizontal,
                top: AppDimensions.space12,
                bottom: AppDimensions.space20,
              ),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Greeting with Lottie animation
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_getGreeting()}, ${auth.user?.name?.split(' ')[0] ?? 'Learner'}! 👋',
                              style: AppTextStyles.headlineMedium.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              _dueFlashcards.isNotEmpty
                                  ? 'home.welcome_message'.tr(namedArgs: {'count': '${_dueFlashcards.length}'})
                                  : 'home.welcome_message_empty'.tr(),
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.grey600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: 8),
                      // Lottie animation
                      Lottie.network(
                        'https://assets10.lottiefiles.com/packages/lf20_DMgKk1.json',
                        width: 90,
                        height: 90,
                        fit: BoxFit.contain,
                      ),
                    ],
                  ),

                  SizedBox(height: AppDimensions.space20),

                  // XP Progress Bar
                  if (_gamification != null) ...[
                    _buildXPProgressCard(),
                    SizedBox(height: AppDimensions.space16),
                  ],

                  // Continue Studying (if due cards) — matches frontend order
                  if (_dueFlashcards.isNotEmpty)
                    BlocBuilder<StudySetsBloc, StudySetsState>(
                      builder: (context, state) {
                        if (state is! StudySetsLoaded) return SizedBox();

                        // Group by study set
                        final dueByStudySet = <String, List<Map<String, dynamic>>>{};
                        for (var card in _dueFlashcards) {
                          final studySetId = card['studySetId'] as String;
                          if (!dueByStudySet.containsKey(studySetId)) {
                            dueByStudySet[studySetId] = [];
                          }
                          dueByStudySet[studySetId]!.add(card);
                        }

                        if (dueByStudySet.isEmpty) return SizedBox();

                        // Get study set with most due cards
                        final topStudySetId = dueByStudySet.entries
                            .reduce((a, b) => a.value.length > b.value.length ? a : b)
                            .key;
                        final dueCount = dueByStudySet[topStudySetId]!.length;
                        final studySet = state.studySets.firstWhere(
                          (s) => s.id == topStudySetId,
                          orElse: () => state.studySets.first,
                        );

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildContinueStudyCard(studySet, dueCount),
                            SizedBox(height: AppDimensions.space16),
                          ],
                        );
                      },
                    ),

                  // Stats Overview
                  BlocBuilder<StudySetsBloc, StudySetsState>(
                    builder: (context, state) {
                      final studySetsCount = state is StudySetsLoaded ? state.studySets.length : 0;
                      final flashcardsCount = state is StudySetsLoaded
                          ? state.studySets.fold<int>(0, (sum, s) => sum + s.flashcardsCount)
                          : 0;
                      return _buildStatsSection(studySetsCount, flashcardsCount);
                    },
                  ),

                  SizedBox(height: AppDimensions.space16),

                  // Quick Actions
                  _buildSectionTitle(context, 'home.sections.quick_actions'.tr()),
                  SizedBox(height: AppDimensions.space12),
                  _buildQuickActions(context),

                  SizedBox(height: AppDimensions.space20),

                  // Recent Study Sets
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionTitle(context, 'home.sections.recent_study_sets'.tr()),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => StudySetsScreen()),
                          );
                        },
                        child: Row(
                          children: [
                            Text('home.sections.view_all'.tr()),
                            const SizedBox(width: 4),
                            const Icon(Icons.arrow_forward, size: 16),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: AppDimensions.space12),
                  BlocBuilder<StudySetsBloc, StudySetsState>(
                    builder: (context, state) {
                      if (state is StudySetsLoading) {
                        return Center(child: CircularProgressIndicator());
                      }
                      if (state is StudySetsLoaded) {
                        if (state.studySets.isEmpty) {
                          return _buildEmptyState();
                        }
                        return _buildRecentStudySets(state.studySets);
                      }
                      return SizedBox();
                    },
                  ),

                  SizedBox(height: AppDimensions.space16),
                ]),
              ),
            ),
          ],
        ),
        ],
      ),
      bottomNavigationBar: widget.hideBottomNav ? null : const AppBottomNav(activeTab: 'home'),
    );
  }

  Widget _buildStatsSection(int studySetsCount, int flashcardsCount) {
    final stats = _stats;
    final totalDue = _dueFlashcards.length;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _StatCard(
          icon: Icons.library_books,
          label: 'home.stats.study_sets'.tr(),
          value: '$studySetsCount',
          color: const Color(0xFF22C55E), // green-500 (matches frontend)
        ),
        _StatCard(
          icon: Icons.style,
          label: 'home.stats.flashcards'.tr(),
          value: '$flashcardsCount',
          color: const Color(0xFF3B82F6), // blue-500 (matches frontend)
        ),
        _StatCard(
          icon: Icons.assignment,
          label: 'home.stats.due_today'.tr(),
          value: '$totalDue',
          color: const Color(0xFFF59E0B), // amber-500 (matches frontend)
        ),
        _StatCard(
          icon: Icons.quiz,
          label: 'home.stats.quizzes_done'.tr(),
          value: '${stats?['quizzesCompleted'] ?? 0}',
          color: const Color(0xFF9333EA), // purple-600 (matches frontend)
        ),
      ],
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: AppTextStyles.titleLarge.copyWith(
        fontWeight: FontWeight.bold,
      ),
    );
  }


  Widget _buildContinueStudyCard(StudySetEntity studySet, int dueCount) {
    // Match frontend: green gradient bg, green icon, green text
    return Container(
      padding: EdgeInsets.all(AppDimensions.space20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF22C55E).withValues(alpha: 0.1),
            const Color(0xFF10B981).withValues(alpha: 0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: const Color(0xFF22C55E).withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF22C55E).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.play_circle, color: const Color(0xFF22C55E), size: 28),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'home.continue_studying.title'.tr(),
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                ),
                const SizedBox(height: 4),
                Text(
                  studySet.title,
                  style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'home.continue_studying.cards_due'.tr(namedArgs: {'count': '$dueCount'}),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: const Color(0xFF16A34A), // green-600
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final apiClient = ApiClient.instance;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.15,
      children: [
        // Exactly matching frontend 5 quick actions
        // 1. New Study Set (green)
        _QuickActionCard(
          icon: Icons.add,
          title: 'home.quick_actions.new_study_set.title'.tr(),
          description: 'home.quick_actions.new_study_set.description'.tr(),
          color: const Color(0xFF22C55E), // green-500
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => CreateEditStudySetScreen()),
            );
          },
        ),
        // 2. Knowledge Base (purple)
        _QuickActionCard(
          icon: Icons.psychology,
          title: 'home.quick_actions.knowledge_base.title'.tr(),
          description: 'home.quick_actions.knowledge_base.description'.tr(),
          color: const Color(0xFF9333EA), // purple-600
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('home.quick_actions.coming_soon'.tr())),
            );
          },
        ),
        // 3. AI Chat (blue)
        _QuickActionCard(
          icon: Icons.chat_bubble_outline,
          title: 'home.quick_actions.ai_chat.title'.tr(),
          description: 'home.quick_actions.ai_chat.description'.tr(),
          color: const Color(0xFF3B82F6), // blue-500
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => BlocProvider(
                  create: (_) => ChatBloc(
                    repository: ChatRepositoryImpl(apiClient: apiClient),
                  ),
                  child: const ChatScreen(),
                ),
              ),
            );
          },
        ),
        // 4. View Analytics (amber)
        _QuickActionCard(
          icon: Icons.bar_chart_rounded,
          title: 'home.quick_actions.view_analytics.title'.tr(),
          description: 'home.quick_actions.view_analytics.description'.tr(),
          color: const Color(0xFFF59E0B), // amber-500
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => BlocProvider(
                  create: (_) => AnalyticsBloc(
                    repository: AnalyticsRepositoryImpl(apiClient: apiClient),
                  ),
                  child: const AnalyticsScreen(),
                ),
              ),
            );
          },
        ),
        // 5. Join Live Quiz (pink)
        _QuickActionCard(
          icon: Icons.gamepad_rounded,
          title: 'home.quick_actions.join_live_quiz.title'.tr(),
          description: 'home.quick_actions.join_live_quiz.description'.tr(),
          color: const Color(0xFFEC4899), // pink-500
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('home.quick_actions.coming_soon'.tr())),
            );
          },
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.all(AppDimensions.space24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
        ),
      ),
      child: Column(
        children: [
          const Icon(Icons.library_books, size: 64, color: AppColors.grey400),
          const SizedBox(height: 16),
          Text(
            'home.empty_state.title'.tr(),
            style: AppTextStyles.titleLarge.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'home.empty_state.subtitle'.tr(),
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            text: 'home.empty_state.button'.tr(),
            icon: Icons.add,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => CreateEditStudySetScreen()),
              );
            },
            gradient: AppColors.greenGradient,
          ),
        ],
      ),
    );
  }

  Widget _buildRecentStudySets(List<StudySetEntity> studySets) {
    return Column(
      children: studySets.take(5).map((studySet) {
        return Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => StudySetDetailScreen(studySet: studySet),
                ),
              );
            },
            borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            child: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                border: Border.all(
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
              child: Row(
                children: [
                  if (studySet.coverImageUrl != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        studySet.coverImageUrl!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                      ),
                    )
                  else
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: AppColors.greenGradient,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.library_books, color: Colors.white),
                    ),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          studySet.title,
                          style: AppTextStyles.titleSmall.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'home.stats.cards'.tr(namedArgs: {'count': '${studySet.flashcardsCount}'}),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.grey400),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBottomNavBar(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.secondary, // Emerald green
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withOpacity(0.3),
            blurRadius: 15,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: AppDimensions.space16,
            vertical: AppDimensions.space8,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                context,
                icon: Icons.home_rounded,
                label: 'navigation.home'.tr(),
                isActive: true,
              ),
              _buildNavItem(
                context,
                icon: Icons.collections_bookmark_rounded,
                label: 'navigation.library'.tr(),
                isActive: false,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => StudySetsScreen()),
                  );
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.analytics_rounded,
                label: 'navigation.analytics'.tr(),
                isActive: false,
                onTap: () {
                  final apiClient = ApiClient.instance;
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => AnalyticsBloc(
                          repository: AnalyticsRepositoryImpl(apiClient: apiClient),
                        ),
                        child: const AnalyticsScreen(),
                      ),
                    ),
                  );
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.school_rounded,
                label: 'navigation.learn'.tr(),
                isActive: false,
                onTap: () {
                  final apiClient = ApiClient.instance;
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => BlocProvider(
                        create: (_) => LearningPathBloc(
                          repository: LearningPathRepositoryImpl(apiClient: apiClient),
                        ),
                        child: const LearningPathsScreen(),
                      ),
                    ),
                  );
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.person_rounded,
                label: 'navigation.profile'.tr(),
                isActive: false,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const ProfileScreen(),
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

  Widget _buildNavItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required bool isActive,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: AppDimensions.space16,
          vertical: AppDimensions.space8,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? Colors.white
              : Colors.transparent,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive
                  ? AppColors.secondary
                  : Colors.white.withOpacity(0.6),
              size: AppDimensions.iconMedium,
            ),
            SizedBox(height: 4),
            Text(
              label,
              style: AppTextStyles.labelSmall.copyWith(
                color: isActive
                    ? AppColors.secondary
                    : Colors.white.withOpacity(0.6),
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.all(AppDimensions.space16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: theme.colorScheme.onSurface.withOpacity(0.1),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: AppTextStyles.titleLarge.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  label,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontSize: 11,
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

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        padding: EdgeInsets.all(AppDimensions.space16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          border: Border.all(
            color: theme.colorScheme.onSurface.withOpacity(0.1),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            Spacer(),
            Text(
              title,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 4),
            Text(
              description,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DailyXPRingPainter extends CustomPainter {
  final double progress;
  final Color bgColor;
  final Color fgColor;

  _DailyXPRingPainter({
    required this.progress,
    required this.bgColor,
    required this.fgColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    const strokeWidth = 3.0;

    // Background ring
    final bgPaint = Paint()
      ..color = bgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final fgPaint = Paint()
      ..color = fgColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    const startAngle = -1.5708; // -90 degrees (top)
    final sweepAngle = 2 * 3.14159265 * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _DailyXPRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
