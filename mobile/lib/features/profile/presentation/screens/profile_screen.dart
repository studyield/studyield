import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/level_constants.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../core/widgets/navigation/app_bottom_nav.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/api_config.dart';
import '../../../notifications/presentation/screens/notifications_screen.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import 'profile_edit_screen.dart';
import 'account_settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  final bool hideBottomNav;

  const ProfileScreen({super.key, this.hideBottomNav = false});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
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
        setState(() {
          _userLevel = (data['level'] ?? 0) as int;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final theme = Theme.of(context);
    final levelInfo = LevelConstants.getLevelInfo(_userLevel);

    return Scaffold(
      extendBody: false,
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.appBarTheme.backgroundColor,
        elevation: 0,
        automaticallyImplyLeading: false,
        leading: widget.hideBottomNav
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        centerTitle: false,
        titleSpacing: widget.hideBottomNav ? 0 : 20,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('profile.title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(
              'profile.subtitle'.tr(),
              style: const TextStyle(fontSize: 12, color: AppColors.grey600),
            ),
          ],
        ),
        toolbarHeight: 70,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Info Card
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ProfileEditScreen()),
                ).then((_) => _fetchGamification());
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.grey200),
                ),
                child: Row(
                  children: [
                    // Avatar with level star badge
                    SizedBox(
                      width: 60,
                      height: 60,
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: levelInfo.gradient,
                              shape: BoxShape.circle,
                              border: Border.all(color: theme.scaffoldBackgroundColor, width: 2),
                            ),
                            child: user?.avatarUrl != null
                                ? ClipOval(
                                    child: Image.network(user!.avatarUrl!, fit: BoxFit.cover, width: 56, height: 56),
                                  )
                                : Center(
                                    child: Text(
                                      user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'U',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                          ),
                          // Star badge
                          Positioned(
                            bottom: -2,
                            right: -2,
                            child: Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                gradient: levelInfo.gradient,
                                shape: BoxShape.circle,
                                border: Border.all(color: theme.scaffoldBackgroundColor, width: 2),
                              ),
                              child: const Icon(Icons.star, color: Colors.white, size: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),

                    // User Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'User',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.email ?? '',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.grey600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              // Level badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  gradient: levelInfo.gradient,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.star, color: Colors.white, size: 11),
                                    const SizedBox(width: 3),
                                    Text(
                                      levelInfo.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
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

                    // Arrow
                    const Icon(Icons.chevron_right, color: AppColors.grey400, size: 20),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Settings Sections
            _buildSettingCard(
              context,
              icon: Icons.person,
              iconColor: const Color(0xFF10B981),
              title: 'profile.settings.profile.title'.tr(),
              subtitle: 'profile.settings.profile.subtitle'.tr(),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ProfileEditScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            _buildSettingCard(
              context,
              icon: Icons.shield,
              iconColor: const Color(0xFF3B82F6),
              title: 'profile.settings.account.title'.tr(),
              subtitle: 'profile.settings.account.subtitle'.tr(),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const AccountSettingsScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            _buildSettingCard(
              context,
              icon: Icons.notifications,
              iconColor: const Color(0xFFF59E0B),
              title: 'profile.settings.notifications.title'.tr(),
              subtitle: 'profile.settings.notifications.subtitle'.tr(),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const NotificationsScreen(),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            // Language Setting Card
            _buildLanguageSettingCard(context),

            const SizedBox(height: 24),

            // Logout Button
            _buildSettingCard(
              context,
              icon: Icons.logout,
              iconColor: const Color(0xFFEF4444),
              title: 'profile.settings.logout.title'.tr(),
              subtitle: null,
              isDestructive: true,
              onTap: () {
                _showLogoutDialog(context);
              },
            ),

            const SizedBox(height: 32),

            // Version
            Center(
              child: Text(
                'profile.version'.tr(),
                style: const TextStyle(
                  color: AppColors.grey400,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: widget.hideBottomNav ? null : const AppBottomNav(activeTab: 'profile'),
    );
  }

  Widget _buildSettingCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    bool isDestructive = false,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey200),
          ),
          child: Row(
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),

              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isDestructive ? const Color(0xFFEF4444) : Colors.black87,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.grey600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Arrow
              if (!isDestructive)
                Icon(
                  Icons.chevron_right,
                  color: AppColors.grey400,
                  size: 20,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLanguageSettingCard(BuildContext context) {
    final theme = Theme.of(context);
    final currentLocale = context.locale;
    final languageName = currentLocale.languageCode == 'ja' ? '日本語' : 'English';
    final languageFlag = currentLocale.languageCode == 'ja' ? '🇯🇵' : '🇺🇸';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _showLanguageDialog(context),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey200),
          ),
          child: Row(
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.language,
                  color: Color(0xFF8B5CF6),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),

              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'profile.settings.language.title'.tr(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$languageFlag $languageName',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.grey600,
                      ),
                    ),
                  ],
                ),
              ),

              // Arrow
              const Icon(
                Icons.chevron_right,
                color: AppColors.grey400,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.language, color: Color(0xFF8B5CF6)),
            const SizedBox(width: 12),
            Text('profile.settings.language.choose'.tr()),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildLanguageOption(
              context: context,
              flag: '🇺🇸',
              language: 'English',
              locale: const Locale('en', 'US'),
              isSelected: context.locale.languageCode == 'en',
            ),
            const SizedBox(height: 12),
            // _buildLanguageOption(
            //   context: context,
            //   flag: '🇪🇸',
            //   language: 'Español',
            //   locale: const Locale('es', 'ES'),
            //   isSelected: context.locale.languageCode == 'es',
            // ),
            // const SizedBox(height: 12),
            _buildLanguageOption(
              context: context,
              flag: '🇯🇵',
              language: '日本語',
              locale: const Locale('ja', 'JP'),
              isSelected: context.locale.languageCode == 'ja',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('profile.settings.language.close'.tr()),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageOption({
    required BuildContext context,
    required String flag,
    required String language,
    required Locale locale,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () {
        context.setLocale(locale);
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.grey300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(flag, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 12),
            Text(
              language,
              style: TextStyle(
                fontSize: 16,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? AppColors.primary : Colors.black87,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: AppColors.primary,
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
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
            onPressed: () => Navigator.pop(context),
            child: Text('profile.settings.logout.cancel'.tr()),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              navigator.pop(); // Close dialog
              await context.read<AuthProvider>().logout();
              // Navigate to login screen and clear all previous routes
              navigator.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            child: Text('profile.settings.logout.confirm'.tr()),
          ),
        ],
      ),
    );
  }
}
