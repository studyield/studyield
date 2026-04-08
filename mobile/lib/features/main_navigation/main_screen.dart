import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/network/api_client.dart';
import '../home/presentation/screens/home_screen.dart';
import '../study_sets/presentation/screens/study_sets_screen.dart';
import '../analytics/presentation/screens/analytics_screen.dart';
import '../analytics/presentation/bloc/analytics_bloc.dart';
import '../analytics/data/repositories/analytics_repository_impl.dart';
import '../learning_path/presentation/screens/learning_paths_screen.dart';
import '../learning_path/presentation/bloc/learning_path_bloc.dart';
import '../learning_path/data/repositories/learning_path_repository_impl.dart';
import '../more/presentation/screens/more_screen.dart';

class MainScreen extends StatefulWidget {
  final int initialPage;

  const MainScreen({
    super.key,
    this.initialPage = 0,
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  late PageController _pageController;
  int _currentPage = 0;

  final List<String> _tabs = ['home', 'library', 'analytics', 'learn', 'more'];

  @override
  void initState() {
    super.initState();
    _currentPage = widget.initialPage;
    _pageController = PageController(initialPage: widget.initialPage);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() {
      _currentPage = page;
    });
  }

  void _onNavTap(String tab) {
    final index = _tabs.indexOf(tab);
    if (index != -1) {
      _pageController.animateToPage(
        index,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final apiClient = ApiClient.instance;

    return Scaffold(
      extendBody: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: PageView(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        children: [
          // Home - without bottom nav bar
          const HomeScreen(hideBottomNav: true),

          // Library
          const StudySetsScreen(hideBottomNav: true),

          // Analytics
          BlocProvider(
            create: (_) => AnalyticsBloc(
              repository: AnalyticsRepositoryImpl(apiClient: apiClient),
            ),
            child: const AnalyticsScreen(hideBottomNav: true),
          ),

          // Learn
          BlocProvider(
            create: (_) => LearningPathBloc(
              repository: LearningPathRepositoryImpl(apiClient: apiClient),
            ),
            child: const LearningPathsScreen(hideBottomNav: true),
          ),

          // More
          const MoreScreen(hideBottomNav: true),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Theme.of(context).primaryColor,
            width: 2,
          ),
        ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(
                  icon: Icons.home,
                  isActive: _currentPage == 0,
                  onTap: () => _onNavTap('home'),
                ),
                _buildNavItem(
                  icon: Icons.collections_bookmark_rounded,
                  isActive: _currentPage == 1,
                  onTap: () => _onNavTap('library'),
                ),
                _buildNavItem(
                  icon: Icons.analytics_rounded,
                  isActive: _currentPage == 2,
                  onTap: () => _onNavTap('analytics'),
                ),
                _buildNavItem(
                  icon: Icons.school_rounded,
                  isActive: _currentPage == 3,
                  onTap: () => _onNavTap('learn'),
                ),
                _buildNavItem(
                  icon: Icons.grid_view_rounded,
                  isActive: _currentPage == 4,
                  onTap: () => _onNavTap('more'),
                ),
              ],
            ),
          ),
        );
  }

  Widget _buildNavItem({
    required IconData icon,
    required bool isActive,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        child: Icon(
          icon,
          color: isActive
              ? Theme.of(context).primaryColor
              : Theme.of(context).primaryColor.withValues(alpha: 0.5),
          size: 24,
        ),
      ),
    );
  }
}
