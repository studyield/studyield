import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../models/subscription.dart';
import '../../../../core/theme/app_colors.dart';

class SubscriptionStatusCard extends StatelessWidget {
  final Subscription subscription;
  final VoidCallback? onUpgrade;
  final VoidCallback? onManage;

  const SubscriptionStatusCard({
    super.key,
    required this.subscription,
    this.onUpgrade,
    this.onManage,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: _getGradient(),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    _getPlanIcon(),
                    color: Colors.white,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subscription.planDisplayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      _buildStatusBadge(),
                    ],
                  ),
                ],
              ),
              if (!subscription.isPro)
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () {
                    // Dismiss card
                  },
                ),
            ],
          ),

          const SizedBox(height: 16),

          // Subscription details
          if (subscription.isPro) ...[
            _buildDetailRow(
              icon: Icons.calendar_today,
              label: 'subscription.status_card.status'.tr(),
              value: subscription.statusDisplayName,
            ),
            if (subscription.currentPeriodEnd != null) ...[
              const SizedBox(height: 8),
              _buildDetailRow(
                icon: Icons.access_time,
                label: 'subscription.status_card.renews_on'.tr(),
                value: _formatDate(subscription.currentPeriodEnd!),
              ),
              if (subscription.daysRemaining != null) ...[
                const SizedBox(height: 8),
                _buildDetailRow(
                  icon: Icons.schedule,
                  label: 'subscription.status_card.days_remaining'.tr(),
                  value: '${subscription.daysRemaining} days',
                ),
              ],
            ],
            if (subscription.cancelAtPeriodEnd) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withOpacity(0.5)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Subscription will cancel at period end',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],

          // Free plan message
          if (!subscription.isPro) ...[
            const Text(
              'Upgrade to Pro to unlock all features',
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                _FeatureChip(label: 'subscription.status_card.unlimited_ai'.tr()),
                _FeatureChip(label: 'subscription.status_card.unlimited_sets'.tr()),
                _FeatureChip(label: 'subscription.status_card.storage'.tr()),
                _FeatureChip(label: 'subscription.status_card.priority_support'.tr()),
              ],
            ),
          ],

          const SizedBox(height: 16),

          // Action button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: subscription.isPro ? onManage : onUpgrade,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: subscription.isPro
                    ? AppColors.primary
                    : const Color(0xFF8B5CF6),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                subscription.isPro ? 'Manage Subscription' : 'Upgrade to Pro',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color badgeColor;
    String badgeText = subscription.statusDisplayName;

    if (subscription.isActive) {
      badgeColor = Colors.green;
    } else if (subscription.isTrialing) {
      badgeColor = Colors.blue;
    } else if (subscription.isPastDue) {
      badgeColor = Colors.red;
    } else {
      badgeColor = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badgeColor.withOpacity(0.5)),
      ),
      child: Text(
        badgeText,
        style: TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, color: Colors.white70, size: 18),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  LinearGradient _getGradient() {
    if (subscription.isPro) {
      // Green gradient for pro
      return const LinearGradient(
        colors: [Color(0xFF10B981), Color(0xFF059669)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    // Gray gradient for free
    return const LinearGradient(
      colors: [Color(0xFF6B7280), Color(0xFF4B5563)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }

  IconData _getPlanIcon() {
    if (subscription.isPro) {
      return Icons.workspace_premium; // Premium icon
    }
    return Icons.card_membership; // Basic membership icon
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

class _FeatureChip extends StatelessWidget {
  final String label;

  const _FeatureChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 14),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
