import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lottie/lottie.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../providers/notification_provider.dart';

enum NotificationType { info, success, warning, reminder, achievement, study }

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final bool isRead;
  final DateTime createdAt;
  final String? link;
  final String? actionLabel;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.link,
    this.actionLabel,
  });
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Notification preferences
  bool _inApp = true;
  bool _email = true;
  bool _push = true;
  bool _studyReminders = true;
  bool _achievements = true;
  bool _weeklyDigest = true;
  bool _isLoadingPreferences = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
    _loadNotifications();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/notifications/preferences');
      final prefs = response.data as Map<String, dynamic>;

      setState(() {
        _inApp = prefs['inApp'] ?? true;
        _email = prefs['email'] ?? true;
        _push = prefs['push'] ?? true;
        _studyReminders = prefs['studyReminders'] ?? true;
        _achievements = prefs['achievementAlerts'] ?? true;
        _weeklyDigest = prefs['weeklyDigest'] ?? true;
        _isLoadingPreferences = false;
      });

      print('✅ Notification preferences loaded');
    } catch (e) {
      print('❌ Failed to load preferences: $e');
      setState(() => _isLoadingPreferences = false);
    }
  }

  Future<void> _updatePreference(String key, bool value) async {
    try {
      final apiClient = ApiClient.instance;
      await apiClient.post('/notifications/preferences', data: {key: value});
      print('✅ Preference updated: $key = $value');
    } catch (e) {
      print('❌ Failed to update preference: $e');
    }
  }

  List<NotificationItem> _convertToNotificationItems(List<Map<String, dynamic>> notifications) {
    return notifications.map((n) {
      return NotificationItem(
        id: n['id'] ?? '',
        title: n['title'] ?? '',
        message: n['message'] ?? '',
        type: _parseNotificationType(n['type']),
        isRead: n['isRead'] ?? false,
        createdAt: DateTime.tryParse(n['createdAt'] ?? '') ?? DateTime.now(),
        link: n['link'],
      );
    }).toList();
  }

  NotificationType _parseNotificationType(String? type) {
    switch (type) {
      case 'success':
        return NotificationType.success;
      case 'warning':
        return NotificationType.warning;
      case 'reminder':
        return NotificationType.reminder;
      default:
        return NotificationType.info;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadNotifications() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  void _markAsRead(String id) {
    context.read<NotificationProvider>().markAsRead(id);
  }

  void _markAllAsRead() {
    context.read<NotificationProvider>().markAllAsRead();
  }

  void _deleteNotification(String id) {
    // TODO: Implement delete in provider
    context.read<NotificationProvider>().markAsRead(id);
  }

  void _deleteAll() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.delete_forever, color: AppColors.error, size: 24),
            ),
            const SizedBox(width: 12),
            Text('notifications.dialogs.clear_all_title'.tr()),
          ],
        ),
        content: Text('notifications.dialogs.clear_all_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('notifications.dialogs.cancel'.tr()),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<NotificationProvider>().markAllAsRead();
              Navigator.pop(dialogContext);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text('notifications.dialogs.delete_all'.tr()),
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'notifications.time.just_now'.tr();
    } else if (difference.inMinutes < 60) {
      return 'notifications.time.minutes_ago'.tr(namedArgs: {'minutes': '${difference.inMinutes}'});
    } else if (difference.inHours < 24) {
      return 'notifications.time.hours_ago'.tr(namedArgs: {'hours': '${difference.inHours}'});
    } else if (difference.inDays < 7) {
      return 'notifications.time.days_ago'.tr(namedArgs: {'days': '${difference.inDays}'});
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Consumer<NotificationProvider>(
      builder: (context, notificationProvider, _) {
        final notifications = _convertToNotificationItems(notificationProvider.notifications);
        final unreadCount = notificationProvider.unreadCount;
        final filteredNotifications = _tabController.index == 1
            ? notifications.where((n) => !n.isRead).toList()
            : notifications;

        return _buildScaffold(theme, notifications, unreadCount, filteredNotifications);
      },
    );
  }

  Widget _buildScaffold(
    ThemeData theme,
    List<NotificationItem> notifications,
    int unreadCount,
    List<NotificationItem> filteredNotifications,
  ) {
    return Scaffold(
      backgroundColor: AppColors.grey50,
      body: Stack(
        children: [
          // Gradient Background at top
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.primary.withOpacity(0.15),
                    AppColors.secondary.withOpacity(0.1),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Content
          SafeArea(
            child: Column(
              children: [
                // Custom AppBar
                _buildCustomAppBar(notifications, unreadCount),

                // Tab Bar
                _buildTabBar(notifications, unreadCount),

                // Tab Content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildNotificationsList(filteredNotifications),
                      _buildNotificationsList(filteredNotifications),
                      _buildSettingsTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomAppBar(List<NotificationItem> notifications, int unreadCount) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        children: [
          // Back button with style
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.primary),
              onPressed: () => Navigator.pop(context),
            ),
          ),
          const SizedBox(width: 16),

          // Title & Subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'notifications.header.title'.tr(),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        gradient: unreadCount > 0
                            ? AppColors.primaryGradient
                            : null,
                        color: unreadCount == 0 ? AppColors.grey200 : null,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        unreadCount > 0
                            ? 'notifications.header.unread_count'.tr(namedArgs: {'count': '$unreadCount'})
                            : 'notifications.header.all_caught_up'.tr(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: unreadCount > 0 ? Colors.white : AppColors.grey600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          if (notifications.isNotEmpty && _tabController.index != 2) ...[
            if (unreadCount > 0)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: IconButton(
                  icon: const Icon(Icons.done_all, color: AppColors.success, size: 20),
                  onPressed: _markAllAsRead,
                  tooltip: 'notifications.header.mark_all_as_read'.tr(),
                ),
              ),
            const SizedBox(width: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                icon: const Icon(Icons.delete_sweep, size: 20, color: AppColors.error),
                onPressed: _deleteAll,
                tooltip: 'notifications.header.clear_all'.tr(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTabBar(List<NotificationItem> notifications, int unreadCount) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: AppColors.grey200,
            width: 1,
          ),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: const UnderlineTabIndicator(
          borderSide: BorderSide(
            color: AppColors.primary,
            width: 3,
          ),
          insets: EdgeInsets.symmetric(horizontal: 20),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.grey600,
        labelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.2,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        tabs: [
          _buildTab('notifications.tabs.all'.tr(), notifications.length),
          _buildTab('notifications.tabs.unread'.tr(), unreadCount),
          Tab(
            height: 48,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.settings, size: 18),
                const SizedBox(width: 6),
                Text('notifications.tabs.settings'.tr()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(String label, int count) {
    return Tab(
      height: 48,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          if (count > 0) ...[
            const SizedBox(width: 8),
            Container(
              constraints: const BoxConstraints(minWidth: 22),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                '$count',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildNotificationsList(List<NotificationItem> filteredNotifications) {
    if (filteredNotifications.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: filteredNotifications.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final notification = filteredNotifications[index];
        return _buildNotificationCard(notification, index);
      },
    );
  }

  Widget _buildEmptyState() {
    final isUnreadTab = _tabController.index == 1;

    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Lottie Animation
              Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary.withOpacity(0.1),
                      AppColors.secondary.withOpacity(0.1),
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: Lottie.network(
                  'https://assets2.lottiefiles.com/packages/lf20_kuhijlnm.json', // Bell animation
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return Icon(
                      isUnreadTab ? Icons.check_circle_outline : Icons.notifications_none,
                      size: 80,
                      color: AppColors.grey400,
                    );
                  },
                ),
              ),

              const SizedBox(height: 24),

              // Title
              Text(
                isUnreadTab ? 'notifications.empty.all_caught_up_title'.tr() : 'notifications.empty.no_notifications_title'.tr(),
                style: AppTextStyles.headlineMedium.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),

              const SizedBox(height: 12),

              // Subtitle
              Text(
                isUnreadTab
                    ? 'notifications.empty.all_caught_up_message'.tr()
                    : 'notifications.empty.no_notifications_message'.tr(),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.grey600,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 32),

              // Decorative elements
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildEmptyStateFeature(
                    Icons.notifications_active,
                    'notifications.empty.feature_stay_updated'.tr(),
                    AppColors.primary,
                  ),
                  const SizedBox(width: 16),
                  _buildEmptyStateFeature(
                    Icons.bolt,
                    'notifications.empty.feature_quick_actions'.tr(),
                    AppColors.accent,
                  ),
                  const SizedBox(width: 16),
                  _buildEmptyStateFeature(
                    Icons.trending_up,
                    'notifications.empty.feature_track_progress'.tr(),
                    AppColors.secondary,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyStateFeature(IconData icon, String label, Color color) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: color.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.grey600,
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationCard(NotificationItem notification, int index) {
    final config = _getTypeConfig(notification.type);

    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 400 + (index * 80)),
      curve: Curves.easeOutCubic,
      tween: Tween(begin: 0.0, end: 1.0),
      builder: (context, value, child) {
        return Transform.scale(
          scale: 0.95 + (0.05 * value),
          child: Opacity(
            opacity: value,
            child: Transform.translate(
              offset: Offset(0, 30 * (1 - value)),
              child: child,
            ),
          ),
        );
      },
      child: Dismissible(
        key: Key(notification.id),
        direction: DismissDirection.endToStart,
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 24),
          margin: const EdgeInsets.symmetric(vertical: 4),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.error.withOpacity(0.8),
                AppColors.error,
              ],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.delete_forever, color: Colors.white, size: 28),
              const SizedBox(height: 4),
              Text(
                'notifications.card.delete'.tr(),
                style: AppTextStyles.bodySmall.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        onDismissed: (_) => _deleteNotification(notification.id),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              if (!notification.isRead) {
                _markAsRead(notification.id);
              }
              // Navigate to link if available
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: notification.isRead
                      ? AppColors.grey200
                      : (config['color'] as Color).withOpacity(0.3),
                  width: notification.isRead ? 1 : 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: notification.isRead
                        ? Colors.black.withOpacity(0.04)
                        : (config['color'] as Color).withOpacity(0.15),
                    blurRadius: notification.isRead ? 8 : 15,
                    offset: Offset(0, notification.isRead ? 2 : 4),
                    spreadRadius: notification.isRead ? 0 : 1,
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon with gradient
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: config['gradient'] as LinearGradient,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: (config['color'] as Color).withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      config['icon'] as IconData,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title with unread dot
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                notification.title,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: notification.isRead
                                      ? FontWeight.w600
                                      : FontWeight.bold,
                                  color: AppColors.textPrimary,
                                  height: 1.3,
                                ),
                              ),
                            ),
                            if (!notification.isRead) ...[
                              const SizedBox(width: 8),
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  gradient: AppColors.primaryGradient,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withOpacity(0.5),
                                      blurRadius: 6,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 6),

                        // Message
                        Text(
                          notification.message,
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.grey600,
                            height: 1.5,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 12),

                        // Footer: Type badge + Time + Action
                        Row(
                          children: [
                            // Type badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: config['bgColor'] as Color,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: (config['color'] as Color).withOpacity(0.2),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    config['icon'] as IconData,
                                    size: 12,
                                    color: config['color'] as Color,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    config['label'] as String,
                                    style: TextStyle(
                                      color: config['color'] as Color,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),

                            // Time
                            Icon(
                              Icons.access_time,
                              size: 12,
                              color: AppColors.grey400,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatTimeAgo(notification.createdAt),
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.grey500,
                                fontWeight: FontWeight.w500,
                              ),
                            ),

                            const Spacer(),

                            // Action button
                            if (notification.actionLabel != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  gradient: config['gradient'] as LinearGradient,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  notification.actionLabel!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // More menu
                  PopupMenuButton<String>(
                    icon: Icon(
                      Icons.more_horiz,
                      color: AppColors.grey400,
                      size: 20,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 8,
                    itemBuilder: (context) => [
                      if (!notification.isRead)
                        PopupMenuItem(
                          value: 'read',
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.check,
                                  size: 16,
                                  color: AppColors.success,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text('notifications.card.mark_as_read'.tr()),
                            ],
                          ),
                        ),
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.error.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.delete,
                                size: 16,
                                color: AppColors.error,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text('notifications.card.delete'.tr()),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (value) {
                      if (value == 'read') {
                        _markAsRead(notification.id);
                      } else if (value == 'delete') {
                        _deleteNotification(notification.id);
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Info Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.secondary.withOpacity(0.1),
                  AppColors.primary.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.lightbulb,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'notifications.settings.info_card_title'.tr(),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'notifications.settings.info_card_message'.tr(),
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.grey600,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Notification Channels
          _buildSettingSection(
            title: 'notifications.settings.channels_section'.tr(),
            icon: Icons.tune,
            iconColor: AppColors.secondary,
            children: [
              _buildModernToggleTile(
                icon: Icons.smartphone,
                iconGradient: AppColors.blueGradient,
                title: 'notifications.settings.in_app_title'.tr(),
                subtitle: 'notifications.settings.in_app_subtitle'.tr(),
                value: _inApp,
                onChanged: (val) {
                  setState(() => _inApp = val);
                  _updatePreference('inApp', val);
                },
              ),
              const SizedBox(height: 12),
              _buildModernToggleTile(
                icon: Icons.email_outlined,
                iconGradient: AppColors.purpleGradient,
                title: 'notifications.settings.email_title'.tr(),
                subtitle: 'notifications.settings.email_subtitle'.tr(),
                value: _email,
                onChanged: (val) {
                  setState(() => _email = val);
                  _updatePreference('email', val);
                },
              ),
              const SizedBox(height: 12),
              _buildModernToggleTile(
                icon: Icons.notifications_active,
                iconGradient: LinearGradient(
                  colors: [AppColors.accent, AppColors.accentDark],
                ),
                title: 'notifications.settings.push_title'.tr(),
                subtitle: 'notifications.settings.push_subtitle'.tr(),
                value: _push,
                onChanged: (val) {
                  setState(() => _push = val);
                  _updatePreference('push', val);
                },
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Notification Types
          _buildSettingSection(
            title: 'notifications.settings.types_section'.tr(),
            icon: Icons.category,
            iconColor: AppColors.purple,
            children: [
              _buildModernToggleTile(
                icon: Icons.access_alarm,
                iconGradient: AppColors.primaryGradient,
                title: 'notifications.settings.study_reminders_title'.tr(),
                subtitle: 'notifications.settings.study_reminders_subtitle'.tr(),
                value: _studyReminders,
                onChanged: (val) {
                  setState(() => _studyReminders = val);
                  _updatePreference('studyReminders', val);
                },
              ),
              const SizedBox(height: 12),
              _buildModernToggleTile(
                icon: Icons.emoji_events,
                iconGradient: LinearGradient(
                  colors: [AppColors.accent, AppColors.accentLight],
                ),
                title: 'notifications.settings.achievements_title'.tr(),
                subtitle: 'notifications.settings.achievements_subtitle'.tr(),
                value: _achievements,
                onChanged: (val) {
                  setState(() => _achievements = val);
                  _updatePreference('achievementAlerts', val);
                },
              ),
              const SizedBox(height: 12),
              _buildModernToggleTile(
                icon: Icons.insights,
                iconGradient: LinearGradient(
                  colors: [AppColors.blue, AppColors.blueLight],
                ),
                title: 'notifications.settings.weekly_digest_title'.tr(),
                subtitle: 'notifications.settings.weekly_digest_subtitle'.tr(),
                value: _weeklyDigest,
                onChanged: (val) {
                  setState(() => _weeklyDigest = val);
                  _updatePreference('weeklyDigest', val);
                },
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Info footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.grey100,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 18,
                  color: AppColors.grey600,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'notifications.settings.footer_message'.tr(),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.grey600,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingSection({
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.grey200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildModernToggleTile({
    required IconData icon,
    required LinearGradient iconGradient,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: value ? iconGradient.colors[0].withOpacity(0.05) : AppColors.grey50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: value
              ? iconGradient.colors[0].withOpacity(0.2)
              : AppColors.grey200,
        ),
      ),
      child: Row(
        children: [
          // Icon with gradient
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: value ? iconGradient : null,
              color: !value ? AppColors.grey200 : null,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: value ? Colors.white : AppColors.grey400,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),

          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.grey600,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),

          // Animated Switch
          Transform.scale(
            scale: 0.9,
            child: Switch(
              value: value,
              onChanged: onChanged,
              activeColor: iconGradient.colors[0],
              activeTrackColor: iconGradient.colors[0].withOpacity(0.3),
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getTypeConfig(NotificationType type) {
    switch (type) {
      case NotificationType.info:
        return {
          'icon': Icons.info,
          'color': AppColors.blue,
          'bgColor': AppColors.blue.withOpacity(0.1),
          'gradient': AppColors.blueGradient,
          'label': 'notifications.types.info'.tr(),
        };
      case NotificationType.success:
        return {
          'icon': Icons.check_circle,
          'color': AppColors.primary,
          'bgColor': AppColors.primary.withOpacity(0.1),
          'gradient': AppColors.primaryGradient,
          'label': 'notifications.types.success'.tr(),
        };
      case NotificationType.warning:
        return {
          'icon': Icons.warning_amber,
          'color': AppColors.accent,
          'bgColor': AppColors.accent.withOpacity(0.1),
          'gradient': LinearGradient(
            colors: [AppColors.accent, AppColors.accentDark],
          ),
          'label': 'notifications.types.warning'.tr(),
        };
      case NotificationType.reminder:
        return {
          'icon': Icons.alarm,
          'color': AppColors.purple,
          'bgColor': AppColors.purple.withOpacity(0.1),
          'gradient': AppColors.purpleGradient,
          'label': 'notifications.types.reminder'.tr(),
        };
      case NotificationType.achievement:
        return {
          'icon': Icons.emoji_events,
          'color': AppColors.accent,
          'bgColor': AppColors.accent.withOpacity(0.1),
          'gradient': LinearGradient(
            colors: [AppColors.accent, AppColors.accentLight],
          ),
          'label': 'notifications.types.achievement'.tr(),
        };
      case NotificationType.study:
        return {
          'icon': Icons.school,
          'color': AppColors.blue,
          'bgColor': AppColors.blue.withOpacity(0.1),
          'gradient': LinearGradient(
            colors: [AppColors.blue, AppColors.blueLight],
          ),
          'label': 'notifications.types.study'.tr(),
        };
    }
  }
}
