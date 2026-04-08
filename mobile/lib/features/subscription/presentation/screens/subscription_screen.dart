import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/auth_provider.dart';
import 'checkout_screen.dart';

enum BillingCycle { monthly, yearly }

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  BillingCycle _billingCycle = BillingCycle.monthly;

  @override
  void initState() {
    super.initState();
    // Refresh user data when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().fetchUser();
    });
  }

  double _getPrice() {
    switch (_billingCycle) {
      case BillingCycle.monthly:
        return 9.99;
      case BillingCycle.yearly:
        return 99.99;
    }
  }

  void _navigateToCheckout() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CheckoutScreen(
          plan: 'pro',
          billingCycle: _billingCycle.name,
          price: _getPrice(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final currentPlan = auth.user?.plan ?? 'free';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('subscription.main.appbar_title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.auto_awesome, color: Color(0xFF10B981), size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'subscription.main.header_label'.tr(),
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'subscription.main.heading'.tr(),
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'subscription.main.subheading'.tr(),
              style: const TextStyle(fontSize: 14, color: AppColors.grey600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // Billing Toggle
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.grey100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  _buildBillingTab('subscription.main.billing_monthly'.tr(), BillingCycle.monthly),
                  _buildBillingTab('subscription.main.billing_yearly'.tr(), BillingCycle.yearly, badge: 'subscription.main.billing_yearly_save'.tr()),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // 7-Day Trial
            _buildPlanCard(
              title: 'subscription.main.plan_trial_title'.tr(),
              subtitle: 'subscription.main.plan_trial_subtitle'.tr(),
              icon: Icons.access_time,
              iconColor: const Color(0xFF3B82F6),
              price: 0,
              isCurrent: currentPlan == 'free',
              isPopular: false,
              features: [
                'subscription.main.features.free_study_sets'.tr(),
                'subscription.main.features.free_flashcards'.tr(),
                'subscription.main.features.free_ai_requests'.tr(),
                'subscription.main.features.basic_quizzes'.tr(),
                'subscription.main.features.spaced_repetition'.tr(),
                'subscription.main.features.cloze_image_occlusion'.tr(),
                'subscription.main.features.handwriting_ocr'.tr(),
              ],
              excludedFeatures: [
                'subscription.main.features.problem_solver'.tr(),
                'subscription.main.features.exam_cloning'.tr(),
                'subscription.main.features.teach_back_mode'.tr(),
                'subscription.main.features.learning_paths'.tr(),
                'subscription.main.features.deep_research'.tr(),
                'subscription.main.features.advanced_analytics'.tr(),
                'subscription.main.features.knowledge_base'.tr(),
                'subscription.main.features.concept_maps'.tr(),
              ],
            ),

            const SizedBox(height: 16),

            // Pro Plan
            _buildPlanCard(
              title: 'subscription.main.plan_pro_title'.tr(),
              subtitle: _billingCycle == BillingCycle.yearly
                  ? 'subscription.main.plan_pro_yearly_subtitle'.tr()
                  : 'subscription.main.plan_pro_monthly_subtitle'.tr(),
              icon: Icons.workspace_premium,
              iconColor: const Color(0xFF10B981),
              price: _getPrice(),
              isCurrent: currentPlan != 'free' && currentPlan != '',
              isPopular: true,
              features: [
                'subscription.main.features.unlimited_study_sets'.tr(),
                'subscription.main.features.unlimited_flashcards'.tr(),
                'subscription.main.features.unlimited_ai_requests'.tr(),
                'subscription.main.features.all_quizzes'.tr(),
                'subscription.main.features.spaced_repetition'.tr(),
                'subscription.main.features.cloze_image_occlusion'.tr(),
                'subscription.main.features.handwriting_ocr'.tr(),
                'subscription.main.features.problem_solver'.tr(),
                'subscription.main.features.exam_cloning'.tr(),
                'subscription.main.features.teach_back_mode'.tr(),
                'subscription.main.features.learning_paths'.tr(),
                'subscription.main.features.deep_research'.tr(),
                'subscription.main.features.advanced_analytics'.tr(),
                'subscription.main.features.knowledge_base'.tr(),
                'subscription.main.features.concept_maps'.tr(),
              ],
              excludedFeatures: const [],
              onUpgrade: _navigateToCheckout,
            ),

            const SizedBox(height: 32),

            // Trust Badges
            Row(
              children: [
                Expanded(child: _buildTrust(Icons.security, 'subscription.main.trust_secure_title'.tr(), 'subscription.main.trust_secure_subtitle'.tr())),
                const SizedBox(width: 12),
                Expanded(child: _buildTrust(Icons.replay, 'subscription.main.trust_flexible_title'.tr(), 'subscription.main.trust_flexible_subtitle'.tr())),
              ],
            ),
            const SizedBox(height: 12),
            _buildTrust(Icons.all_inclusive, 'subscription.main.trust_free_title'.tr(), 'subscription.main.trust_free_subtitle'.tr()),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingTab(String label, BillingCycle cycle, {String? badge}) {
    final isSelected = _billingCycle == cycle;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _billingCycle = cycle),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isSelected
                ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)]
                : null,
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.black87 : AppColors.grey600,
                ),
              ),
              if (badge != null) ...[
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required double price,
    required bool isCurrent,
    required bool isPopular,
    required List<String> features,
    required List<String> excludedFeatures,
    VoidCallback? onUpgrade,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isPopular ? iconColor : AppColors.grey200,
          width: isPopular ? 2 : 1,
        ),
        boxShadow: isPopular
            ? [
                BoxShadow(
                  color: iconColor.withOpacity(0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ]
            : null,
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          if (isPopular)
            Positioned(
              top: -12,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [iconColor, iconColor.withOpacity(0.8)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'subscription.main.popular_badge'.tr(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          Padding(
            padding: EdgeInsets.all(isPopular ? 28 : 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: iconColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: iconColor, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                          Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.grey600)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '\$${price.toStringAsFixed(price == 0 ? 0 : 2)}',
                      style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 6),
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(
                        price == 0
                            ? ''
                            : _billingCycle == BillingCycle.yearly
                                ? 'subscription.main.yearly_period'.tr()
                                : 'subscription.main.monthly_period'.tr(),
                        style: const TextStyle(fontSize: 13, color: AppColors.grey600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                ...features.map((f) => _buildFeature(f, true, iconColor)),
                ...excludedFeatures.map((f) => _buildFeature(f, false, iconColor)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isCurrent ? null : (price == 0 ? () {} : onUpgrade),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCurrent
                          ? AppColors.grey300
                          : (price == 0 ? AppColors.grey600 : iconColor),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: isPopular ? 4 : 0,
                    ),
                    child: Text(
                      isCurrent
                          ? 'subscription.main.button_current_plan'.tr()
                          : price == 0
                              ? 'subscription.main.button_free_forever'.tr()
                              : 'subscription.main.button_upgrade_pro'.tr(),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
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

  Widget _buildFeature(String text, bool included, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            included ? Icons.check_circle : Icons.cancel,
            color: included ? color : AppColors.grey300,
            size: 18,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                color: included ? Colors.black87 : AppColors.grey400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrust(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF10B981), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.grey600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
