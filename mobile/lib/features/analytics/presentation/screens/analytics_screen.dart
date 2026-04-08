import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/analytics_entity.dart';
import '../../domain/entities/activity_entity.dart';
import '../../domain/entities/performance_entity.dart';
import '../bloc/analytics_bloc.dart';
import '../bloc/analytics_event.dart';
import '../bloc/analytics_state.dart';
import '../../../../core/widgets/navigation/app_bottom_nav.dart';

class AnalyticsScreen extends StatefulWidget {
  final bool hideBottomNav;

  const AnalyticsScreen({super.key, this.hideBottomNav = false});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _selectedRange = '30d';
  String _studyTimeView = 'daily'; // 'daily' or 'weekly'

  @override
  void initState() {
    super.initState();
    context.read<AnalyticsBloc>().add(LoadAnalytics(range: _selectedRange));
  }

  String _formatStudyTime(int minutes) {
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0) {
      return '$hours${'analytics.time.hoursSymbol'.tr()} $mins${'analytics.time.minutesSymbol'.tr()}';
    }
    return '$mins${'analytics.time.minutesSymbol'.tr()}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: false,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text('analytics.title'.tr()),
      ),
      body: BlocBuilder<AnalyticsBloc, AnalyticsState>(
        builder: (context, state) {
          if (state is AnalyticsLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is AnalyticsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(state.message),
                ],
              ),
            );
          }

          if (state is AnalyticsLoaded) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Date range selector
                  _buildRangeSelector(),
                  const SizedBox(height: 20),

                  // Top 4 stats cards
                  _buildStatsGrid(state.analytics),
                  const SizedBox(height: 24),

                  // Study heatmap
                  _buildSectionTitle('analytics.sections.studyActivity'.tr()),
                  const SizedBox(height: 12),
                  _buildStudyHeatmap(state.activity),
                  const SizedBox(height: 24),

                  // Streak calendar
                  _buildSectionTitle('analytics.sections.streak'.tr()),
                  const SizedBox(height: 12),
                  _buildStreakCalendar(state.activity, state.analytics),
                  const SizedBox(height: 24),

                  // Charts grid
                  _buildSectionTitle('analytics.sections.performance'.tr()),
                  const SizedBox(height: 12),
                  _buildCardMasteryPieChart(state.performance),
                  const SizedBox(height: 20),

                  _buildRetentionCurve(state.performance),
                  const SizedBox(height: 20),

                  _buildStudyTimeChart(state.activity),
                ],
              ),
            );
          }

          return const SizedBox();
        },
      ),
      bottomNavigationBar: widget.hideBottomNav ? null : const AppBottomNav(activeTab: 'analytics'),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildRangeSelector() {
    final ranges = [
      {'value': '7d', 'label': 'analytics.timeRange.sevenDays'.tr()},
      {'value': '30d', 'label': 'analytics.timeRange.thirtyDays'.tr()},
      {'value': '90d', 'label': 'analytics.timeRange.ninetyDays'.tr()},
      {'value': 'all', 'label': 'analytics.timeRange.allTime'.tr()},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: ranges.map((range) {
          final isSelected = _selectedRange == range['value'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () {
                setState(() => _selectedRange = range['value']!);
                context.read<AnalyticsBloc>().add(
                      ChangeTimeRange(range: range['value']!),
                    );
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  gradient:
                      isSelected ? AppColors.purpleGradient : null,
                  color: isSelected ? null : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? Colors.transparent : AppColors.border,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.purple.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  range['label']!,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatsGrid(AnalyticsEntity analytics) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _buildStatCard(
          icon: Icons.schedule,
          label: 'analytics.stats.studyTime'.tr(),
          value: _formatStudyTime(analytics.totalStudyTime),
          color: Colors.blue,
        ),
        _buildStatCard(
          icon: Icons.style,
          label: 'analytics.stats.cardsReviewed'.tr(),
          value: '${analytics.cardsReviewed}',
          color: Colors.green,
        ),
        _buildStatCard(
          icon: Icons.quiz,
          label: 'analytics.stats.quizzes'.tr(),
          value: '${analytics.quizzesTaken}',
          color: AppColors.purple,
        ),
        _buildStatCard(
          icon: Icons.trending_up,
          label: 'analytics.stats.avgScore'.tr(),
          value: '${analytics.avgScore.toInt()}%',
          color: Colors.amber,
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStudyHeatmap(List<ActivityEntity> activity) {
    // Create a map of date to session count
    final Map<String, int> heatmapData = {};
    for (var act in activity) {
      heatmapData[act.date] = act.sessions;
    }

    // Get the last 16 weeks (for 30d range)
    final now = DateTime.now();
    final startDate = now.subtract(const Duration(days: 112)); // 16 weeks

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
          Text(
            'analytics.heatmap.title'.tr(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: _buildHeatmapGrid(heatmapData, startDate, 16),
          ),
          const SizedBox(height: 12),
          _buildHeatmapLegend(),
        ],
      ),
    );
  }

  Widget _buildHeatmapGrid(
      Map<String, int> data, DateTime startDate, int weeks) {
    return Row(
      children: List.generate(weeks, (weekIndex) {
        return Column(
          children: List.generate(7, (dayIndex) {
            final date = startDate.add(Duration(days: weekIndex * 7 + dayIndex));
            final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
            final sessions = data[dateStr] ?? 0;

            return Container(
              width: 14,
              height: 14,
              margin: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: _getHeatmapColor(sessions),
                borderRadius: BorderRadius.circular(3),
              ),
            );
          }),
        );
      }),
    );
  }

  Color _getHeatmapColor(int sessions) {
    if (sessions == 0) return AppColors.grey200;
    if (sessions == 1) return Colors.green.withOpacity(0.3);
    if (sessions == 2) return Colors.green.withOpacity(0.5);
    if (sessions >= 3) return Colors.green.withOpacity(0.8);
    return Colors.green;
  }

  Widget _buildHeatmapLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          'analytics.heatmap.less'.tr(),
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(width: 4),
        ...List.generate(5, (i) {
          return Container(
            width: 12,
            height: 12,
            margin: const EdgeInsets.symmetric(horizontal: 2),
            decoration: BoxDecoration(
              color: i == 0
                  ? AppColors.grey200
                  : Colors.green.withOpacity(0.2 + i * 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          );
        }),
        const SizedBox(width: 4),
        Text(
          'analytics.heatmap.more'.tr(),
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildCardMasteryPieChart(PerformanceEntity performance) {
    final pieData = performance.cardsByStatus.entries
        .where((e) => e.value > 0)
        .toList();

    if (pieData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Center(child: Text('analytics.cardMastery.noData'.tr())),
      );
    }

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
          Text(
            'analytics.cardMastery.title'.tr(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sections: pieData.asMap().entries.map((entry) {
                  final status = entry.value.key;
                  final count = entry.value.value;
                  final color = _getStatusColor(status);

                  return PieChartSectionData(
                    value: count.toDouble(),
                    title: '$count',
                    color: color,
                    radius: 80,
                    titleStyle: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  );
                }).toList(),
                sectionsSpace: 2,
                centerSpaceRadius: 40,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: pieData.map((entry) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: _getStatusColor(entry.key),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${_getStatusLabel(entry.key)}: ${entry.value}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return Colors.blue;
      case 'learning':
        return Colors.amber;
      case 'review':
        return AppColors.purple;
      case 'mastered':
        return Colors.green;
      default:
        return AppColors.grey400;
    }
  }

  String _capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return 'analytics.cardStatus.new'.tr();
      case 'learning':
        return 'analytics.cardStatus.learning'.tr();
      case 'review':
        return 'analytics.cardStatus.review'.tr();
      case 'mastered':
        return 'analytics.cardStatus.mastered'.tr();
      default:
        return _capitalize(status);
    }
  }

  Widget _buildRetentionCurve(PerformanceEntity performance) {
    if (performance.retentionCurve.isEmpty) {
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
            Text(
              'analytics.retentionCurve.title'.tr(),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  Icon(Icons.show_chart, size: 40, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  Text(
                    'analytics.retentionCurve.noData'.tr(),
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      );
    }

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
          Text(
            'analytics.retentionCurve.title'.tr(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: true),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}${'analytics.chart.percentageSymbol'.tr()}',
                          style: const TextStyle(fontSize: 10),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${'analytics.chart.dayLabel'.tr()}${value.toInt()}',
                          style: const TextStyle(fontSize: 10),
                        );
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border.all(color: AppColors.border),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: performance.retentionCurve
                        .map((p) => FlSpot(p.day.toDouble(), p.retention))
                        .toList(),
                    isCurved: true,
                    color: Colors.green,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudyTimeChart(List<ActivityEntity> activity) {
    if (activity.isEmpty) {
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
            Text(
              'analytics.studyTime.title'.tr(),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  Icon(Icons.schedule, size: 40, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  Text(
                    'analytics.studyTime.noData'.tr(),
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      );
    }

    // Take last 14 days for daily view
    final data = activity.reversed.take(14).toList().reversed.toList();

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'analytics.studyTime.title'.tr(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Row(
                children: [
                  _buildViewToggle('analytics.studyTime.daily'.tr(), _studyTimeView == 'daily', () {
                    setState(() => _studyTimeView = 'daily');
                  }),
                  const SizedBox(width: 8),
                  _buildViewToggle('analytics.studyTime.weekly'.tr(), _studyTimeView == 'weekly', () {
                    setState(() => _studyTimeView = 'weekly');
                  }),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                gridData: const FlGridData(show: true, drawVerticalLine: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}${'analytics.chart.minutesSymbol'.tr()}',
                          style: const TextStyle(fontSize: 10),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= data.length) return const Text('');
                        final date = DateTime.parse(data[value.toInt()].date);
                        return Text(
                          '${date.day}/${date.month}',
                          style: const TextStyle(fontSize: 9),
                        );
                      },
                    ),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border.all(color: AppColors.border),
                ),
                barGroups: data.asMap().entries.map((entry) {
                  return BarChartGroupData(
                    x: entry.key,
                    barRods: [
                      BarChartRodData(
                        toY: entry.value.studyMinutes.toDouble(),
                        color: Colors.green,
                        width: 16,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(4),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewToggle(String label, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.purple.withOpacity(0.1) : null,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.purple : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isSelected ? AppColors.purple : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildStreakCalendar(
      List<ActivityEntity> activity, AnalyticsEntity analytics) {
    final now = DateTime.now();
    final activeDates = activity
        .where((a) => a.sessions > 0)
        .map((a) => a.date)
        .toSet();

    // Get current month info
    final firstDayOfMonth = DateTime(now.year, now.month, 1);
    final lastDayOfMonth = DateTime(now.year, now.month + 1, 0);
    final daysInMonth = lastDayOfMonth.day;
    final startWeekday = firstDayOfMonth.weekday % 7; // Sunday = 0

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'analytics.streak.title'.tr(),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.local_fire_department,
                          color: Colors.orange, size: 18),
                      const SizedBox(width: 4),
                      Text(
                        '${analytics.currentStreak} ${'analytics.streak.dayStreak'.tr()}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.orange,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Text(
                '${_getMonthName(now.month)} ${now.year}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Day names
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) {
              return SizedBox(
                width: 40,
                child: Text(
                  day,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),

          // Calendar grid
          Wrap(
            children: List.generate(startWeekday + daysInMonth, (index) {
              if (index < startWeekday) {
                // Empty cells before month starts
                return const SizedBox(width: 40, height: 40);
              }

              final day = index - startWeekday + 1;
              final date = DateTime(now.year, now.month, day);
              final dateStr =
                  '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
              final isActive = activeDates.contains(dateStr);
              final isToday = date.day == now.day &&
                  date.month == now.month &&
                  date.year == now.year;

              return Container(
                width: 40,
                height: 40,
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: isActive
                      ? Colors.green.withOpacity(0.1)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isToday
                        ? Colors.green
                        : (isActive
                            ? Colors.green.withOpacity(0.3)
                            : Colors.transparent),
                    width: isToday ? 2 : 1,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$day',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                          color: isActive ? Colors.green : Colors.black,
                        ),
                      ),
                      if (isActive)
                        const Icon(
                          Icons.local_fire_department,
                          size: 10,
                          color: Colors.orange,
                        ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  String _getMonthName(int month) {
    final months = [
      'analytics.months.january'.tr(),
      'analytics.months.february'.tr(),
      'analytics.months.march'.tr(),
      'analytics.months.april'.tr(),
      'analytics.months.may'.tr(),
      'analytics.months.june'.tr(),
      'analytics.months.july'.tr(),
      'analytics.months.august'.tr(),
      'analytics.months.september'.tr(),
      'analytics.months.october'.tr(),
      'analytics.months.november'.tr(),
      'analytics.months.december'.tr()
    ];
    return months[month - 1];
  }
}
