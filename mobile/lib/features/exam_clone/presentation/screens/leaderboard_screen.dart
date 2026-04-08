import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../config/api_config.dart';
import '../../../../core/network/api_client.dart';

class LeaderboardEntry {
  final String userId;
  final String name;
  final String? avatarUrl;
  final int totalExams;
  final double avgScore;
  final int totalCorrect;
  final double bestScore;
  final int rank;

  LeaderboardEntry({
    required this.userId,
    required this.name,
    this.avatarUrl,
    required this.totalExams,
    required this.avgScore,
    required this.totalCorrect,
    required this.bestScore,
    required this.rank,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['userId'],
      name: json['name'],
      avatarUrl: json['avatarUrl'],
      totalExams: json['totalExams'] ?? 0,
      avgScore: (json['avgScore'] ?? 0).toDouble(),
      totalCorrect: json['totalCorrect'] ?? 0,
      bestScore: (json['bestScore'] ?? 0).toDouble(),
      rank: json['rank'],
    );
  }
}

class UserRank {
  final int? rank;
  final double avgScore;
  final int totalCorrect;

  UserRank({
    this.rank,
    required this.avgScore,
    required this.totalCorrect,
  });

  factory UserRank.fromJson(Map<String, dynamic> json) {
    return UserRank(
      rank: json['rank'],
      avgScore: (json['avgScore'] ?? 0).toDouble(),
      totalCorrect: json['totalCorrect'] ?? 0,
    );
  }
}

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  final ApiClient _apiClient = ApiClient.instance;
  List<LeaderboardEntry> leaderboard = [];
  UserRank? userRank;
  bool isLoading = true;
  String period = 'weekly';

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    setState(() => isLoading = true);

    try {
      final response = await _apiClient.get(
        Endpoints.leaderboard,
        queryParameters: {'period': period, 'limit': 20},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final leaderboardJson = data['leaderboard'] as List;
        final userRankJson = data['userRank'] as Map<String, dynamic>?;

        setState(() {
          leaderboard = leaderboardJson
              .map((e) => LeaderboardEntry.fromJson(e))
              .toList();
          userRank = userRankJson != null ? UserRank.fromJson(userRankJson) : null;
          isLoading = false;
        });
      } else {
        throw Exception('Failed to load leaderboard');
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load leaderboard: $e')),
        );
      }
    }
  }

  Widget _getRankIcon(int rank) {
    switch (rank) {
      case 1:
        return const Icon(Icons.diamond, color: Color(0xFFFBBF24), size: 24);
      case 2:
        return const Icon(Icons.military_tech, color: Color(0xFF9CA3AF), size: 24);
      case 3:
        return const Icon(Icons.military_tech, color: Color(0xFFD97706), size: 24);
      default:
        return Text(
          '#$rank',
          style: AppTextStyles.titleMedium.copyWith(
            color: AppColors.grey600,
            fontWeight: FontWeight.bold,
          ),
        );
    }
  }

  Color _getRankBorderColor(int rank) {
    switch (rank) {
      case 1:
        return const Color(0xFFFBBF24);
      case 2:
        return const Color(0xFF9CA3AF);
      case 3:
        return const Color(0xFFD97706);
      default:
        return AppColors.grey300;
    }
  }

  Color _getRankBgColor(int rank) {
    switch (rank) {
      case 1:
        return const Color(0xFFFBBF24).withOpacity(0.1);
      case 2:
        return const Color(0xFF9CA3AF).withOpacity(0.1);
      case 3:
        return const Color(0xFFD97706).withOpacity(0.1);
      default:
        return Colors.white;
    }
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
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                gradient: const LinearGradient(
                  colors: [Color(0xFF9333EA), Color(0xFFEC4899)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Icon(
                Icons.emoji_events,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'exam_clone.leaderboard.title'.tr(),
                  style: AppTextStyles.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'exam_clone.leaderboard.subtitle'.tr(),
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
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchLeaderboard,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Period Selector
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _PeriodChip(
                            label: 'exam_clone.leaderboard.period.weekly'.tr(),
                            isSelected: period == 'weekly',
                            onTap: () {
                              setState(() => period = 'weekly');
                              _fetchLeaderboard();
                            },
                          ),
                          const SizedBox(width: 8),
                          _PeriodChip(
                            label: 'exam_clone.leaderboard.period.monthly'.tr(),
                            isSelected: period == 'monthly',
                            onTap: () {
                              setState(() => period = 'monthly');
                              _fetchLeaderboard();
                            },
                          ),
                          const SizedBox(width: 8),
                          _PeriodChip(
                            label: 'exam_clone.leaderboard.period.all_time'.tr(),
                            isSelected: period == 'all_time',
                            onTap: () {
                              setState(() => period = 'all_time');
                              _fetchLeaderboard();
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Your Rank Card
                    if (userRank != null && userRank!.rank != null)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFF9333EA).withOpacity(0.1),
                              const Color(0xFFEC4899).withOpacity(0.1),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          border: Border.all(
                            color: const Color(0xFF9333EA).withOpacity(0.3),
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'exam_clone.leaderboard.your_rank'.tr(),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '#${userRank!.rank}',
                                      style: AppTextStyles.headlineLarge.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: userRank!.rank! <= 10
                                            ? Colors.green.withOpacity(0.1)
                                            : AppColors.grey200,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            userRank!.rank! <= 10
                                                ? Icons.trending_up
                                                : Icons.remove,
                                            size: 14,
                                            color: userRank!.rank! <= 10
                                                ? Colors.green
                                                : AppColors.grey600,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            userRank!.rank! <= 10
                                                ? 'exam_clone.leaderboard.top_10'.tr()
                                                : 'exam_clone.leaderboard.keep_practicing'.tr(),
                                            style: AppTextStyles.bodySmall.copyWith(
                                              color: userRank!.rank! <= 10
                                                  ? Colors.green
                                                  : AppColors.grey600,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Column(
                                      children: [
                                        Text(
                                          '${userRank!.avgScore.toStringAsFixed(0)}%',
                                          style: AppTextStyles.headlineSmall.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          'exam_clone.leaderboard.avg_score'.tr(),
                                          style: AppTextStyles.bodySmall.copyWith(
                                            color: AppColors.grey600,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(width: 16),
                                    Column(
                                      children: [
                                        Text(
                                          '${userRank!.totalCorrect}',
                                          style: AppTextStyles.headlineSmall.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          'exam_clone.leaderboard.correct'.tr(),
                                          style: AppTextStyles.bodySmall.copyWith(
                                            color: AppColors.grey600,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 24),

                    // Leaderboard List
                    if (leaderboard.isEmpty)
                      _buildEmptyState()
                    else ...[
                      // Top 3 Podium
                      if (leaderboard.length >= 3) ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            // 2nd Place
                            Expanded(
                              child: _PodiumCard(
                                entry: leaderboard[1],
                                rank: 2,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // 1st Place
                            Expanded(
                              child: _PodiumCard(
                                entry: leaderboard[0],
                                rank: 1,
                                isFirst: true,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // 3rd Place
                            Expanded(
                              child: _PodiumCard(
                                entry: leaderboard[2],
                                rank: 3,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Rest of Leaderboard
                      ...leaderboard.skip(3).map((entry) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: _getRankBgColor(entry.rank),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _getRankBorderColor(entry.rank),
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Rank
                                  SizedBox(
                                    width: 40,
                                    child: Center(child: _getRankIcon(entry.rank)),
                                  ),
                                  const SizedBox(width: 12),

                                  // Avatar
                                  CircleAvatar(
                                    radius: 20,
                                    backgroundColor: const Color(0xFF9333EA),
                                    child: Text(
                                      entry.name.isNotEmpty
                                          ? entry.name[0].toUpperCase()
                                          : '?',
                                      style: AppTextStyles.titleMedium.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),

                                  // Name and Stats
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          entry.name,
                                          style: AppTextStyles.bodyMedium.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          '${entry.totalExams} exams • ${entry.totalCorrect} correct',
                                          style: AppTextStyles.bodySmall.copyWith(
                                            color: AppColors.grey600,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Score
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${entry.avgScore.toStringAsFixed(0)}%',
                                        style: AppTextStyles.titleLarge.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        'exam_clone.leaderboard.avg_score_label'.tr(),
                                        style: AppTextStyles.bodySmall.copyWith(
                                          color: AppColors.grey600,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          )),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.grey300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.people_outline,
            size: 48,
            color: AppColors.grey400,
          ),
          const SizedBox(height: 16),
          Text(
            'exam_clone.leaderboard.empty_title'.tr(),
            style: AppTextStyles.titleMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'exam_clone.leaderboard.empty_message'.tr(),
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.grey600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PeriodChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF9333EA) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF9333EA) : AppColors.grey300,
          ),
        ),
        child: Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: isSelected ? Colors.white : AppColors.grey700,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _PodiumCard extends StatelessWidget {
  final LeaderboardEntry entry;
  final int rank;
  final bool isFirst;

  const _PodiumCard({
    required this.entry,
    required this.rank,
    this.isFirst = false,
  });

  @override
  Widget build(BuildContext context) {
    final iconData = rank == 1
        ? Icons.diamond
        : Icons.military_tech;
    final iconColor = rank == 1
        ? const Color(0xFFFBBF24)
        : rank == 2
            ? const Color(0xFF9CA3AF)
            : const Color(0xFFD97706);
    final borderColor = iconColor;

    return Container(
      padding: const EdgeInsets.all(12),
      margin: EdgeInsets.only(top: isFirst ? 0 : 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: borderColor.withOpacity(0.3),
          width: isFirst ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: isFirst ? 24 : 20,
            backgroundColor: iconColor.withOpacity(0.2),
            child: Icon(
              iconData,
              color: iconColor,
              size: isFirst ? 28 : 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            entry.name,
            style: AppTextStyles.bodySmall.copyWith(
              fontWeight: FontWeight.bold,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          Text(
            '${entry.avgScore.toStringAsFixed(0)}%',
            style: (isFirst
                    ? AppTextStyles.headlineSmall
                    : AppTextStyles.titleLarge)
                .copyWith(
              fontWeight: FontWeight.bold,
              color: iconColor,
            ),
          ),
          Text(
            '${entry.totalExams} exams',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
