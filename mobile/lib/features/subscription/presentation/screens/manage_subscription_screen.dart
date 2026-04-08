import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../providers/auth_provider.dart';
import 'subscription_screen.dart';

class ManageSubscriptionScreen extends StatefulWidget {
  const ManageSubscriptionScreen({super.key});

  @override
  State<ManageSubscriptionScreen> createState() => _ManageSubscriptionScreenState();
}

class _ManageSubscriptionScreenState extends State<ManageSubscriptionScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _subscription;

  @override
  void initState() {
    super.initState();
    _loadSubscription();
  }

  Future<void> _loadSubscription() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/subscription');

      setState(() {
        _subscription = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _openStripePortal() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.post('/subscription/portal');
      final portalUrl = response.data['url'] as String;

      if (mounted) {
        await Navigator.push(
          context,
          MaterialPageRoute(
            fullscreenDialog: true,
            builder: (_) => _StripePortalWebView(url: portalUrl),
          ),
        );
        _loadSubscription(); // Refresh after portal
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('subscription.manage.error_open_portal'.tr() + ': $e'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _cancelSubscription() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('subscription.manage.cancel_dialog_title'.tr()),
        content: Text('subscription.manage.cancel_dialog_content'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('subscription.manage.cancel_dialog_keep_btn'.tr()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('subscription.manage.cancel_dialog_cancel_btn'.tr(), style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final apiClient = ApiClient.instance;
        await apiClient.post('/subscription/cancel');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('subscription.manage.cancel_success_message'.tr()),
            backgroundColor: AppColors.success,
          ),
        );
        _loadSubscription();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('subscription.manage.cancel_error_message'.tr() + ': $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'subscription.manage.appbar_title'.tr(),
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Current Plan Card
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.grey200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Color(0xFFFFF3CD),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                Icons.workspace_premium,
                                color: Color(0xFFFF9800),
                                size: 24,
                              ),
                            ),
                            SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        user?.planDisplayName ?? 'subscription.manage.default_plan_name'.tr(),
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      SizedBox(width: 8),
                                      Container(
                                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.success.withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'subscription.manage.status_active'.tr(),
                                          style: TextStyle(
                                            color: AppColors.success,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    _subscription?['plan'] == 'yearly'
                                        ? '\$99.99${'subscription.manage.price_yearly'.tr()}'
                                        : '\$9.99${'subscription.manage.price_monthly'.tr()}',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppColors.grey600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            OutlinedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => SubscriptionScreen(),
                                  ),
                                );
                              },
                              child: Text('subscription.manage.button_change_plan'.tr()),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.secondary,
                              ),
                            ),
                          ],
                        ),
                        if (_subscription?['plan'] != 'free') ...[
                          SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: _buildInfoItem(
                                  icon: Icons.calendar_today,
                                  label: 'subscription.manage.info_current_period_label'.tr(),
                                  value: _formatPeriod(_subscription?['currentPeriodStart'], _subscription?['currentPeriodEnd']),
                                ),
                              ),
                              SizedBox(width: 16),
                              Expanded(
                                child: _buildInfoItem(
                                  icon: Icons.event,
                                  label: 'subscription.manage.info_next_billing_label'.tr(),
                                  value: _formatDate(_subscription?['currentPeriodEnd']),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),

                  SizedBox(height: 20),

                  // Billing History
                  _buildActionCard(
                    icon: Icons.receipt_long,
                    iconColor: Color(0xFF3B82F6),
                    title: 'subscription.manage.card_billing_history_title'.tr(),
                    subtitle: 'subscription.manage.card_billing_history_subtitle'.tr(),
                    onTap: _openStripePortal,
                  ),

                  SizedBox(height: 12),

                  // Payment Methods
                  _buildActionCard(
                    icon: Icons.credit_card,
                    iconColor: Color(0xFF10B981),
                    title: 'subscription.manage.card_payment_methods_title'.tr(),
                    subtitle: 'subscription.manage.card_payment_methods_subtitle'.tr(),
                    onTap: _openStripePortal,
                  ),

                  if (_subscription?['plan'] != 'free') ...[
                    SizedBox(height: 12),

                    // Cancel Subscription
                    _buildActionCard(
                      icon: Icons.cancel,
                      iconColor: AppColors.error,
                      title: 'subscription.manage.card_cancel_subscription_title'.tr(),
                      subtitle: 'subscription.manage.card_cancel_subscription_subtitle'.tr(),
                      onTap: _cancelSubscription,
                      isDanger: true,
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: AppColors.grey600),
            SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDanger = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDanger ? AppColors.error.withOpacity(0.3) : AppColors.grey200,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isDanger ? AppColors.error : null,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.grey600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isDanger ? Icons.warning_amber : Icons.arrow_forward_ios,
              size: 18,
              color: AppColors.grey400,
            ),
          ],
        ),
      ),
    );
  }

  String _formatPeriod(String? start, String? end) {
    if (start == null || end == null) return 'N/A';
    try {
      final startDate = DateTime.parse(start);
      final endDate = DateTime.parse(end);
      return '${DateFormat('MMM d').format(startDate)} — ${DateFormat('MMM d, y').format(endDate)}';
    } catch (e) {
      return 'N/A';
    }
  }

  String _formatDate(String? date) {
    if (date == null) return 'N/A';
    try {
      return DateFormat('MMMM d, y').format(DateTime.parse(date));
    } catch (e) {
      return 'N/A';
    }
  }
}

class _StripePortalWebView extends StatefulWidget {
  final String url;

  const _StripePortalWebView({required this.url});

  @override
  State<_StripePortalWebView> createState() => _StripePortalWebViewState();
}

class _StripePortalWebViewState extends State<_StripePortalWebView> {
  late WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _isLoading = true),
          onPageFinished: (_) => setState(() => _isLoading = false),
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('subscription.manage.webview_title'.tr()),
        leading: IconButton(
          icon: Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : WebViewWidget(controller: _controller),
    );
  }
}
