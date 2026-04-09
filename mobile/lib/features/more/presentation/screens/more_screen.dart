import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/level_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/api_config.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../core/widgets/navigation/app_bottom_nav.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../ai_chat/presentation/screens/chat_screen.dart';
import '../../../ai_chat/presentation/bloc/chat_bloc.dart';
import '../../../ai_chat/data/repositories/chat_repository_impl.dart';
import '../../../problem_solver/presentation/screens/problem_input_screen.dart';
import '../../../problem_solver/presentation/bloc/problem_solver_bloc.dart';
import '../../../problem_solver/data/repositories/problem_solver_repository_impl.dart';
import '../../../exam_clone/presentation/screens/exam_clone_list_screen.dart';
import '../../../exam_clone/presentation/bloc/exam_clone_bloc.dart';
import '../../../exam_clone/data/repositories/exam_clone_repository_impl.dart';
import '../../../teach_back/presentation/screens/teach_back_screen.dart';
import '../../../teach_back/presentation/bloc/teach_back_bloc.dart';
import '../../../teach_back/data/repositories/teach_back_repository_impl.dart';
import '../../../research/presentation/screens/research_screen.dart';
import '../../../research/presentation/bloc/research_bloc.dart';
import '../../../research/data/repositories/research_repository_impl.dart';
import '../../../notifications/presentation/screens/notifications_screen.dart';
import '../../../auth/presentation/screens/login_screen.dart';

class MoreScreen extends StatefulWidget {
  final bool hideBottomNav;

  const MoreScreen({super.key, this.hideBottomNav = false});

  @override
  State<MoreScreen> createState() => _MoreScreenState();
}

class _MoreScreenState extends State<MoreScreen> {
  int _userLevel = 0;

  @override
  void initState() {
    super.initState();
    _fetchGamification();
  }

  Future<void> _fetchGamification() async {
    try {
      final response = await ApiClient.instance.get(Endpoints.gamification);
      final data = response.data as Map<String, dynamic>;
      if (mounted) {
        setState(() => _userLevel = (data['level'] ?? 0) as int);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final theme = Theme.of(context);
    final levelInfo = LevelConstants.getLevelInfo(_userLevel);
    final apiClient = ApiClient.instance;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: 0,
        automaticallyImplyLeading: false,
        centerTitle: false,
        titleSpacing: 20,
        title: Text('more.title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Profile Card
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen(hideBottomNav: true)),
            ),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: levelInfo.gradientColors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: user?.avatarUrl != null
                        ? ClipOval(
                            child: Image.network(user!.avatarUrl!, fit: BoxFit.cover, width: 52, height: 52),
                          )
                        : Center(
                            child: Text(
                              user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U',
                              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                            ),
                          ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'User',
                          style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? '',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star, color: Colors.white, size: 12),
                              const SizedBox(width: 4),
                              Text(
                                '${levelInfo.name} — Level $_userLevel',
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.settings_outlined, color: Colors.white, size: 20),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // AI Tools Section
          _buildSectionLabel('more.section_ai_tools'.tr()),
          const SizedBox(height: 8),
          _buildMenuGroup(context, [
            _MenuItemData(
              icon: Icons.chat_bubble_outline,
              title: 'more.ai_chat'.tr(),
              subtitle: 'more.ai_chat_subtitle'.tr(),
              color: const Color(0xFF3B82F6),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider(
                    create: (_) => ChatBloc(repository: ChatRepositoryImpl(apiClient: apiClient)),
                    child: const ChatScreen(),
                  ),
                ),
              ),
            ),
            _MenuItemData(
              icon: Icons.lightbulb_outline,
              title: 'more.problem_solver'.tr(),
              subtitle: 'more.problem_solver_subtitle'.tr(),
              color: const Color(0xFFF59E0B),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider(
                    create: (_) => ProblemSolverBloc(repository: ProblemSolverRepositoryImpl(apiClient: apiClient)),
                    child: const ProblemInputScreen(),
                  ),
                ),
              ),
            ),
            _MenuItemData(
              icon: Icons.search,
              title: 'more.deep_research'.tr(),
              subtitle: 'more.deep_research_subtitle'.tr(),
              color: const Color(0xFF8B5CF6),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider(
                    create: (_) => ResearchBloc(repository: ResearchRepositoryImpl(apiClient: apiClient)),
                    child: const ResearchScreen(),
                  ),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 24),

          // Study Tools Section
          _buildSectionLabel('more.section_study_tools'.tr()),
          const SizedBox(height: 8),
          _buildMenuGroup(context, [
            _MenuItemData(
              icon: Icons.description_outlined,
              title: 'more.exam_clone'.tr(),
              subtitle: 'more.exam_clone_subtitle'.tr(),
              color: const Color(0xFFEF4444),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider(
                    create: (_) => ExamCloneBloc(repository: ExamCloneRepositoryImpl(apiClient: apiClient)),
                    child: const ExamCloneListScreen(),
                  ),
                ),
              ),
            ),
            _MenuItemData(
              icon: Icons.school_outlined,
              title: 'more.teach_back'.tr(),
              subtitle: 'more.teach_back_subtitle'.tr(),
              color: const Color(0xFF10B981),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider(
                    create: (_) => TeachBackBloc(repository: TeachBackRepositoryImpl(apiClient: apiClient)),
                    child: const TeachBackScreen(),
                  ),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 24),

          // Account Section
          _buildSectionLabel('more.section_account'.tr()),
          const SizedBox(height: 8),
          _buildMenuGroup(context, [
            _MenuItemData(
              icon: Icons.notifications_outlined,
              title: 'more.notifications'.tr(),
              subtitle: 'more.notifications_subtitle'.tr(),
              color: const Color(0xFFF59E0B),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              ),
            ),
          ]),
          const SizedBox(height: 24),

          // Logout
          Container(
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.logout, color: Color(0xFFEF4444), size: 22),
              ),
              title: Text('more.logout'.tr(), style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFFEF4444))),
              subtitle: Text('more.logout_subtitle'.tr(), style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              trailing: const Icon(Icons.chevron_right, color: Color(0xFFEF4444)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              onTap: () => _showLogoutDialog(context),
            ),
          ),
          const SizedBox(height: 32),

          // Version
          Center(
            child: Text(
              'v1.0.0',
              style: TextStyle(color: Colors.grey[400], fontSize: 12),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
      bottomNavigationBar: widget.hideBottomNav ? null : const AppBottomNav(activeTab: 'more'),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.logout, color: Color(0xFFEF4444)),
            const SizedBox(width: 12),
            Text('profile.settings.logout.confirm_title'.tr()),
          ],
        ),
        content: Text('profile.settings.logout.confirm_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('profile.settings.logout.cancel'.tr()),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(ctx);
              navigator.pop();
              if (!mounted) return;
              await context.read<AuthProvider>().logout();
              if (!mounted) return;
              navigator.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('profile.settings.logout.confirm'.tr()),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Colors.grey[500],
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildMenuGroup(BuildContext context, List<_MenuItemData> items) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final item = entry.value;
          final isLast = entry.key == items.length - 1;
          return Column(
            children: [
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: item.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: item.color, size: 22),
                ),
                title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                subtitle: Text(item.subtitle, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                trailing: Icon(Icons.chevron_right, color: Colors.grey[400], size: 22),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(
                    top: entry.key == 0 ? const Radius.circular(16) : Radius.zero,
                    bottom: isLast ? const Radius.circular(16) : Radius.zero,
                  ),
                ),
                onTap: item.onTap,
              ),
              if (!isLast) Divider(height: 1, indent: 68, color: Colors.grey[100]),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MenuItemData {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _MenuItemData({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });
}
