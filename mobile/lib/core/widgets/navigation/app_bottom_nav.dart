import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../theme/app_colors.dart';
import '../../network/api_client.dart';
import '../../../features/home/presentation/screens/home_screen.dart';
import '../../../features/study_sets/presentation/screens/study_sets_screen.dart';
import '../../../features/analytics/presentation/screens/analytics_screen.dart';
import '../../../features/analytics/presentation/bloc/analytics_bloc.dart';
import '../../../features/analytics/data/repositories/analytics_repository_impl.dart';
import '../../../features/learning_path/presentation/screens/learning_paths_screen.dart';
import '../../../features/learning_path/presentation/bloc/learning_path_bloc.dart';
import '../../../features/learning_path/data/repositories/learning_path_repository_impl.dart';
import '../../../features/more/presentation/screens/more_screen.dart';

class AppBottomNav extends StatelessWidget {
  final String activeTab;

  const AppBottomNav({super.key, required this.activeTab});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        border: Border(
          top: BorderSide(color: AppColors.grey200, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildNavItem(
                context,
                icon: Icons.rocket_rounded,
                label: 'navigation.home'.tr(),
                isActive: activeTab == 'home',
                onTap: () {
                  if (activeTab != 'home') {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const HomeScreen()),
                    );
                  }
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.collections_bookmark_rounded,
                label: 'navigation.library'.tr(),
                isActive: activeTab == 'library',
                onTap: () {
                  if (activeTab != 'library') {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => StudySetsScreen()),
                    );
                  }
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.analytics_rounded,
                label: 'navigation.stats'.tr(),
                isActive: activeTab == 'analytics',
                onTap: () {
                  if (activeTab != 'analytics') {
                    final apiClient = ApiClient.instance;
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => BlocProvider(
                          create: (_) => AnalyticsBloc(
                            repository: AnalyticsRepositoryImpl(apiClient: apiClient),
                          ),
                          child: const AnalyticsScreen(),
                        ),
                      ),
                    );
                  }
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.school_rounded,
                label: 'navigation.learn'.tr(),
                isActive: activeTab == 'learn',
                onTap: () {
                  if (activeTab != 'learn') {
                    final apiClient = ApiClient.instance;
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => BlocProvider(
                          create: (_) => LearningPathBloc(
                            repository: LearningPathRepositoryImpl(apiClient: apiClient),
                          ),
                          child: const LearningPathsScreen(),
                        ),
                      ),
                    );
                  }
                },
              ),
              _buildNavItem(
                context,
                icon: Icons.grid_view_rounded,
                label: 'navigation.more'.tr(),
                isActive: activeTab == 'more',
                onTap: () {
                  if (activeTab != 'more') {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const MoreScreen()),
                    );
                  }
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
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isActive ? AppColors.primary : AppColors.grey400,
                size: 24,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: isActive ? AppColors.primary : AppColors.grey400,
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
