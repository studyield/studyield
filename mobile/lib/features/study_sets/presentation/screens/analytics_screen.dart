import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/study_set_entity.dart';
import '../../../flashcards/domain/entities/flashcard_entity.dart';
import '../../../flashcards/presentation/bloc/flashcards_bloc.dart';
import '../../../flashcards/presentation/bloc/flashcards_event.dart';
import '../../../flashcards/presentation/bloc/flashcards_state.dart';

class AnalyticsScreen extends StatefulWidget {
  final StudySetEntity studySet;

  const AnalyticsScreen({
    super.key,
    required this.studySet,
  });

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<FlashcardsBloc>().add(
          LoadFlashcards(studySetId: widget.studySet.id),
        );
  }

  Map<String, int> _getStatusCounts(List<FlashcardEntity> flashcards) {
    final counts = {'New': 0, 'Learning': 0, 'Review': 0, 'Mastered': 0};
    for (var fc in flashcards) {
      counts[fc.statusLabel] = (counts[fc.statusLabel] ?? 0) + 1;
    }
    return counts;
  }

  Map<String, int> _getDifficultyDistribution(List<FlashcardEntity> flashcards) {
    int easy = 0, medium = 0, hard = 0;
    for (var fc in flashcards) {
      if (fc.difficulty <= 2) {
        easy++;
      } else if (fc.difficulty <= 4) {
        medium++;
      } else {
        hard++;
      }
    }
    return {'Easy': easy, 'Medium': medium, 'Hard': hard};
  }

  Map<String, int> _getUpcomingReviews(List<FlashcardEntity> flashcards) {
    final now = DateTime.now();
    final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);
    final tomorrowEnd = todayEnd.add(Duration(days: 1));
    final weekEnd = todayEnd.add(Duration(days: 7));

    final counts = {'Today': 0, 'Tomorrow': 0, 'This Week': 0, 'Later': 0};

    for (var fc in flashcards) {
      if (fc.nextReviewAt == null) continue;
      if (fc.nextReviewAt!.isBefore(todayEnd)) {
        counts['Today'] = counts['Today']! + 1;
      } else if (fc.nextReviewAt!.isBefore(tomorrowEnd)) {
        counts['Tomorrow'] = counts['Tomorrow']! + 1;
      } else if (fc.nextReviewAt!.isBefore(weekEnd)) {
        counts['This Week'] = counts['This Week']! + 1;
      } else {
        counts['Later'] = counts['Later']! + 1;
      }
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Analytics',
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.studySet.title,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
      body: BlocBuilder<FlashcardsBloc, FlashcardsState>(
        builder: (context, state) {
          if (state is FlashcardsLoading) {
            return Center(child: CircularProgressIndicator());
          }

          if (state is FlashcardsError) {
            return Center(
              child: Text(
                state.message,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.error),
              ),
            );
          }

          if (state is FlashcardsLoaded) {
            if (state.flashcards.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.bar_chart, size: 64, color: AppColors.grey400),
                    SizedBox(height: 16),
                    Text(
                      'No analytics yet',
                      style: AppTextStyles.titleLarge.copyWith(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Add flashcards and start studying to see analytics',
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }

            final flashcards = state.flashcards;
            final reviewedCount = flashcards.where((f) => f.repetitions > 0).length;
            final masteredCount = flashcards.where((f) => f.statusLabel == 'Mastered').length;
            final masteryPct = ((masteredCount / flashcards.length) * 100).round();
            final avgDifficulty = (flashcards.fold<double>(0, (sum, f) => sum + f.difficulty) / flashcards.length).toStringAsFixed(1);
            final dueCount = flashcards.where((f) => f.isDue).length;
            final statusCounts = _getStatusCounts(flashcards);
            final difficultyDist = _getDifficultyDistribution(flashcards);
            final upcomingReviews = _getUpcomingReviews(flashcards);

            return SingleChildScrollView(
              padding: EdgeInsets.all(AppDimensions.space20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Summary Stats
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.3,
                    children: [
                      _StatCard(
                        title: 'study_sets.analytics_screen.total_reviewed'.tr(),
                        value: '$reviewedCount',
                        icon: Icons.school,
                        color: AppColors.primary,
                      ),
                      _StatCard(
                        title: 'study_sets.analytics_screen.mastery'.tr(),
                        value: '$masteryPct%',
                        icon: Icons.emoji_events,
                        color: AppColors.success,
                      ),
                      _StatCard(
                        title: 'study_sets.analytics_screen.avg_difficulty'.tr(),
                        value: avgDifficulty,
                        icon: Icons.bar_chart,
                        color: AppColors.warning,
                      ),
                      _StatCard(
                        title: 'study_sets.analytics_screen.due_now'.tr(),
                        value: '$dueCount',
                        icon: Icons.access_time,
                        color: AppColors.error,
                      ),
                    ],
                  ),

                  SizedBox(height: AppDimensions.space24),

                  // Cards by Status
                  Text(
                    'Cards by Status',
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space16),
                  Container(
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
                        Expanded(
                          flex: 2,
                          child: SizedBox(
                            height: 140,
                            child: PieChart(
                              PieChartData(
                                sectionsSpace: 2,
                                centerSpaceRadius: 30,
                                sections: _getPieSections(statusCounts),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: AppDimensions.space16),
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: statusCounts.entries.map((entry) {
                              return Padding(
                                padding: EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: BoxDecoration(
                                        color: _getStatusColor(entry.key),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    SizedBox(width: 8),
                                    Text(
                                      entry.key,
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.grey600,
                                      ),
                                    ),
                                    Spacer(),
                                    Text(
                                      '${entry.value}',
                                      style: AppTextStyles.labelMedium.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: AppDimensions.space24),

                  // Difficulty Distribution
                  Text(
                    'Difficulty Distribution',
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space16),
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space16),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        SizedBox(
                          height: 140,
                          child: BarChart(
                            BarChartData(
                              alignment: BarChartAlignment.spaceEvenly,
                              maxY: difficultyDist.values.reduce((a, b) => a > b ? a : b).toDouble() * 1.2,
                              barTouchData: BarTouchData(enabled: false),
                              titlesData: FlTitlesData(
                                show: true,
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    getTitlesWidget: (value, meta) {
                                      final labels = ['Easy', 'Medium', 'Hard'];
                                      if (value.toInt() >= 0 && value.toInt() < labels.length) {
                                        return Padding(
                                          padding: EdgeInsets.only(top: 8),
                                          child: Text(
                                            labels[value.toInt()],
                                            style: AppTextStyles.bodySmall.copyWith(
                                              color: AppColors.grey600,
                                            ),
                                          ),
                                        );
                                      }
                                      return SizedBox();
                                    },
                                  ),
                                ),
                                leftTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                topTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                                rightTitles: AxisTitles(
                                  sideTitles: SideTitles(showTitles: false),
                                ),
                              ),
                              borderData: FlBorderData(show: false),
                              gridData: FlGridData(show: false),
                              barGroups: [
                                BarChartGroupData(
                                  x: 0,
                                  barRods: [
                                    BarChartRodData(
                                      toY: difficultyDist['Easy']!.toDouble(),
                                      color: AppColors.success,
                                      width: 40,
                                      borderRadius: BorderRadius.vertical(
                                        top: Radius.circular(6),
                                      ),
                                    ),
                                  ],
                                ),
                                BarChartGroupData(
                                  x: 1,
                                  barRods: [
                                    BarChartRodData(
                                      toY: difficultyDist['Medium']!.toDouble(),
                                      color: AppColors.warning,
                                      width: 40,
                                      borderRadius: BorderRadius.vertical(
                                        top: Radius.circular(6),
                                      ),
                                    ),
                                  ],
                                ),
                                BarChartGroupData(
                                  x: 2,
                                  barRods: [
                                    BarChartRodData(
                                      toY: difficultyDist['Hard']!.toDouble(),
                                      color: AppColors.error,
                                      width: 40,
                                      borderRadius: BorderRadius.vertical(
                                        top: Radius.circular(6),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: AppDimensions.space24),

                  // Upcoming Reviews
                  Text(
                    'Upcoming Reviews',
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space16),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 2,
                    children: upcomingReviews.entries.map((entry) {
                      return Container(
                        padding: EdgeInsets.all(AppDimensions.space12),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                          border: Border.all(
                            color: theme.colorScheme.onSurface.withOpacity(0.1),
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '${entry.value}',
                              style: AppTextStyles.titleLarge.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              entry.key,
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          }

          return SizedBox();
        },
      ),
    );
  }

  List<PieChartSectionData> _getPieSections(Map<String, int> counts) {
    return counts.entries.where((e) => e.value > 0).map((entry) {
      return PieChartSectionData(
        color: _getStatusColor(entry.key),
        value: entry.value.toDouble(),
        radius: 50,
        showTitle: false,
      );
    }).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'New':
        return AppColors.info;
      case 'Learning':
        return AppColors.warning;
      case 'Review':
        return AppColors.purpleReview;
      case 'Mastered':
        return AppColors.success;
      default:
        return AppColors.grey600;
    }
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
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
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          SizedBox(height: AppDimensions.space8),
          Text(
            value,
            style: AppTextStyles.headlineSmall.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          SizedBox(height: 4),
          Text(
            title,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
