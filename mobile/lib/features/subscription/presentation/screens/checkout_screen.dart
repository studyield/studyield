import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../providers/auth_provider.dart';
import 'payment_webview_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final String plan;
  final String billingCycle;
  final double price;
  final bool isSpecialOffer;

  const CheckoutScreen({
    super.key,
    required this.plan,
    required this.billingCycle,
    required this.price,
    this.isSpecialOffer = false,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _couponController = TextEditingController();
  bool _couponApplied = false;
  bool _isProcessing = false;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  void _applyCoupon() {
    if (_couponController.text.trim().isNotEmpty) {
      setState(() => _couponApplied = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('subscription.checkout.coupon_applied_message'.tr())),
      );
    }
  }

  Future<void> _proceedToPayment() async {
    setState(() => _isProcessing = true);

    try {
      final auth = context.read<AuthProvider>();
      final apiClient = ApiClient.instance;

      // Call backend to create checkout session
      final response = await apiClient.post('/subscription/checkout', data: {
        'plan': widget.billingCycle, // 'monthly' or 'yearly'
      });

      final checkoutUrl = response.data['url'] as String;

      // Open Stripe checkout in webview
      if (mounted) {
        final result = await Navigator.push<bool>(
          context,
          MaterialPageRoute(
            fullscreenDialog: true,
            builder: (_) => PaymentWebViewScreen(
              checkoutUrl: checkoutUrl,
              successUrl: '/subscription/success',
            ),
          ),
        );

        if (result == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 12),
                  Text('subscription.checkout.payment_success_message'.tr()),
                ],
              ),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isYearly = widget.billingCycle == 'yearly';
    final planName = widget.plan == 'pro' ? 'Pro' : 'Free';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('subscription.checkout.appbar_title'.tr(), style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.workspace_premium,
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
                          'subscription.checkout.header_title'.tr(namedArgs: {'plan': planName}),
                          style: TextStyle(
                            color: Theme.of(context).cardColor,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          isYearly
                            ? 'subscription.checkout.header_subtitle_yearly'.tr()
                            : 'subscription.checkout.header_subtitle_monthly'.tr(),
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Order Summary
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.grey200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'subscription.checkout.order_summary_label'.tr(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.grey600,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'subscription.checkout.plan_line_item'.tr(namedArgs: {
                          'plan': planName,
                          'cycle': widget.billingCycle,
                        }),
                        style: const TextStyle(fontSize: 14),
                      ),
                      Text(
                        '\$${widget.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  if (_couponApplied) ...[
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.local_offer, color: Color(0xFF10B981), size: 14),
                            const SizedBox(width: 6),
                            Text(
                              'subscription.checkout.coupon_applied_label'.tr(),
                              style: TextStyle(
                                fontSize: 13,
                                color: const Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'subscription.checkout.coupon_discount_amount'.tr(namedArgs: {'amount': '0.00'}),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF10B981),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const Divider(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'subscription.checkout.total_label'.tr(),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${widget.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                              widget.billingCycle == 'yearly'
                                ? 'subscription.checkout.billing_period_year'.tr()
                                : 'subscription.checkout.billing_period_month'.tr(),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.grey600,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Coupon Code
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.grey200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'subscription.checkout.coupon_code_label'.tr(),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _couponController,
                          enabled: !_couponApplied,
                          decoration: InputDecoration(
                            hintText: 'subscription.checkout.coupon_input_placeholder'.tr(),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: _couponApplied ? null : _applyCoupon,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _couponApplied
                              ? const Color(0xFF10B981)
                              : const Color(0xFF9333EA),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _couponApplied
                            ? const Icon(Icons.check_circle, size: 20)
                            : Text('subscription.checkout.coupon_apply_button'.tr()),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // What You Get
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'subscription.checkout.what_you_get_heading'.tr(),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...[
                    'subscription.checkout.features.unlimited_ai',
                    'subscription.checkout.features.premium_features',
                    'subscription.checkout.features.priority_support',
                    'subscription.checkout.features.advanced_analytics',
                    'subscription.checkout.features.exam_cloning',
                    'subscription.checkout.features.deep_research',
                  ].map((featureKey) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: Color(0xFF10B981),
                            size: 18,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              featureKey.tr(),
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Proceed Button
            ElevatedButton(
              onPressed: _isProcessing ? null : _proceedToPayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 4,
              ),
              child: _isProcessing
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        ),
                        SizedBox(width: 12),
                        Text('subscription.checkout.button_processing'.tr()),
                      ],
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.credit_card, size: 20),
                        SizedBox(width: 12),
                        Text(
                          'subscription.checkout.button_proceed'.tr(),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),

            const SizedBox(height: 20),

            // Trust Badges
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildTrustBadge(Icons.lock, 'subscription.checkout.trust_ssl'.tr()),
                const SizedBox(width: 16),
                _buildTrustBadge(Icons.security, 'subscription.checkout.trust_stripe'.tr()),
                const SizedBox(width: 16),
                _buildTrustBadge(Icons.check_circle, 'subscription.checkout.trust_cancel_anytime'.tr()),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.grey600),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.grey600,
          ),
        ),
      ],
    );
  }
}
