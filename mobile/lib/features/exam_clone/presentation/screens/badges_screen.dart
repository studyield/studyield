import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../config/api_config.dart';
import '../../../../core/network/api_client.dart';

class Badge {
  final String id;
  final String slug;
  final String name;
  final String description;
  final String icon;
  final String color;
  final String category;
  final int? xpReward;
  final String? earnedAt;
  final String? examTitle;

  Badge({
    required this.id,
    required this.slug,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    required this.category,
    this.xpReward,
    this.earnedAt,
    this.examTitle,
  });

  factory Badge.fromJson(Map<String, dynamic> json) {
    return Badge(
      id: json['id'],
      slug: json['slug'],
      name: json['name'],
      description: json['description'],
      icon: json['icon'],
      color: json['color'],
      category: json['category'],
      xpReward: json['xpReward'],
      earnedAt: json['earnedAt'],
      examTitle: json['examTitle'],
    );
  }
}

class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});

  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen> {
  final ApiClient _apiClient = ApiClient.instance;
  List<Badge> allBadges = [];
  List<Badge> userBadges = [];
  bool isLoading = true;
  String? selectedCategory;

  @override
  void initState() {
    super.initState();
    _fetchBadges();
  }

  Future<void> _fetchBadges() async {
    setState(() => isLoading = true);

    try {
      final responses = await Future.wait([
        _apiClient.get(Endpoints.badges),
        _apiClient.get(Endpoints.userBadges),
      ]);

      if (responses[0].statusCode == 200 && responses[1].statusCode == 200) {
        final allBadgesJson = responses[0].data as List;
        final userBadgesJson = responses[1].data as List;

        setState(() {
          allBadges = allBadgesJson.map((b) => Badge.fromJson(b)).toList();
          userBadges = userBadgesJson.map((b) => Badge.fromJson(b)).toList();
          isLoading = false;
        });
      } else {
        throw Exception('Failed to load badges');
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('exam_clone.badges.failed_to_load'.tr(namedArgs: {'error': e.toString()}))),
        );
      }
    }
  }

  IconData _getIconData(String iconName) {
    final iconMap = {
      'Trophy': Icons.emoji_events,
      'Award': Icons.workspace_premium,
      'Medal': Icons.military_tech,
      'Crown': Icons.diamond,
      'Star': Icons.star,
      'TrendingUp': Icons.trending_up,
      'Target': Icons.track_changes,
      'Flame': Icons.local_fire_department,
      'Zap': Icons.flash_on,
      'Clock': Icons.access_time,
      'Brain': Icons.psychology,
      'CheckCircle': Icons.check_circle,
      'Rocket': Icons.rocket_launch,
    };
    return iconMap[iconName] ?? Icons.emoji_events;
  }

  Color _getColorFromName(String colorName) {
    final colorMap = {
      'amber': Colors.amber,
      'blue': Colors.blue,
      'purple': Colors.purple,
      'yellow': Colors.yellow,
      'green': Colors.green,
      'orange': Colors.orange,
      'red': Colors.red,
      'cyan': Colors.cyan,
      'indigo': Colors.indigo,
    };
    return colorMap[colorName] ?? Colors.amber;
  }

  @override
  Widget build(BuildContext context) {
    final earnedBadgeIds = userBadges.map((b) => b.id).toSet();
    final categories = allBadges.map((b) => b.category).toSet().toList();
    final filteredBadges = selectedCategory == null
        ? allBadges
        : allBadges.where((b) => b.category == selectedCategory).toList();

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
                  colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
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
                  'exam_clone.badges.title'.tr(),
                  style: AppTextStyles.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'exam_clone.badges.subtitle'.tr(),
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
              onRefresh: _fetchBadges,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Progress Card
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'exam_clone.badges.your_progress'.tr(),
                                style: AppTextStyles.titleMedium.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${userBadges.length} / ${allBadges.length}',
                                style: AppTextStyles.headlineSmall.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: allBadges.isEmpty
                                  ? 0
                                  : userBadges.length / allBadges.length,
                              minHeight: 16,
                              backgroundColor: AppColors.grey200,
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Color(0xFFF59E0B),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'exam_clone.badges.remaining'.tr(namedArgs: {'count': '${allBadges.length - userBadges.length}'}),
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.grey600,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Category Filters
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _CategoryChip(
                            label: 'exam_clone.badges.all'.tr(),
                            isSelected: selectedCategory == null,
                            onTap: () => setState(() => selectedCategory = null),
                          ),
                          const SizedBox(width: 8),
                          ...categories.map((category) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: _CategoryChip(
                                  label: category,
                                  isSelected: selectedCategory == category,
                                  onTap: () =>
                                      setState(() => selectedCategory = category),
                                ),
                              )),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Badges Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.85,
                      ),
                      itemCount: filteredBadges.length,
                      itemBuilder: (context, index) {
                        final badge = filteredBadges[index];
                        final isEarned = earnedBadgeIds.contains(badge.id);
                        final earnedBadge = userBadges.firstWhere(
                          (b) => b.id == badge.id,
                          orElse: () => badge,
                        );

                        return _BadgeCard(
                          badge: badge,
                          isEarned: isEarned,
                          earnedAt: earnedBadge.earnedAt,
                          getIconData: _getIconData,
                          getColor: _getColorFromName,
                        );
                      },
                    ),

                    // Recently Earned
                    if (userBadges.isNotEmpty) ...[
                      const SizedBox(height: 32),
                      Text(
                        'exam_clone.badges.recently_earned'.tr(),
                        style: AppTextStyles.titleMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...userBadges.take(5).map((badge) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _RecentBadgeCard(
                            badge: badge,
                            getIconData: _getIconData,
                            getColor: _getColorFromName,
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
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

class _BadgeCard extends StatelessWidget {
  final Badge badge;
  final bool isEarned;
  final String? earnedAt;
  final IconData Function(String) getIconData;
  final Color Function(String) getColor;

  const _BadgeCard({
    required this.badge,
    required this.isEarned,
    required this.earnedAt,
    required this.getIconData,
    required this.getColor,
  });

  @override
  Widget build(BuildContext context) {
    final iconData = getIconData(badge.icon);
    final color = getColor(badge.color);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isEarned
              ? color.withOpacity(0.3)
              : AppColors.grey300.withOpacity(0.5),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Badge Icon
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: isEarned ? color : AppColors.grey300,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              isEarned ? iconData : Icons.lock,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(height: 12),

          // Badge Name
          Text(
            badge.name,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),

          // Badge Description
          Text(
            badge.description,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
              fontSize: 11,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),

          // XP Reward
          if (badge.xpReward != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFBBF24).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star, size: 12, color: Color(0xFFFBBF24)),
                  const SizedBox(width: 4),
                  Text(
                    'exam_clone.badges.xp_reward'.tr(namedArgs: {'xp': '${badge.xpReward}'}),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: const Color(0xFFF59E0B),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Earned Date
          if (isEarned && earnedAt != null) ...[
            const SizedBox(height: 4),
            Text(
              'exam_clone.badges.earned_on'.tr(namedArgs: {'date': _formatDate(earnedAt!)}),
              style: AppTextStyles.bodySmall.copyWith(
                color: Colors.green,
                fontSize: 10,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(String dateString) {
    final date = DateTime.parse(dateString);
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _RecentBadgeCard extends StatelessWidget {
  final Badge badge;
  final IconData Function(String) getIconData;
  final Color Function(String) getColor;

  const _RecentBadgeCard({
    required this.badge,
    required this.getIconData,
    required this.getColor,
  });

  @override
  Widget build(BuildContext context) {
    final iconData = getIconData(badge.icon);
    final color = getColor(badge.color);

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
              color: color,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(iconData, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge.name,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  badge.description,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (badge.earnedAt != null)
                Text(
                  _formatDate(badge.earnedAt!),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontSize: 11,
                  ),
                ),
              if (badge.examTitle != null)
                Text(
                  'exam_clone.badges.from_exam'.tr(namedArgs: {'title': badge.examTitle!}),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontSize: 10,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateString) {
    final date = DateTime.parse(dateString);
    return '${date.day}/${date.month}/${date.year}';
  }
}
