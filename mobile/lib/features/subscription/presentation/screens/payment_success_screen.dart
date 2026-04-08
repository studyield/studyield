import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:confetti/confetti.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../providers/auth_provider.dart';

class PaymentSuccessScreen extends StatefulWidget {
  final String sessionId;

  const PaymentSuccessScreen({
    super.key,
    required this.sessionId,
  });

  @override
  State<PaymentSuccessScreen> createState() => _PaymentSuccessScreenState();
}

class _PaymentSuccessScreenState extends State<PaymentSuccessScreen> {
  late ConfettiController _confettiController;
  bool _isLoading = true;
  Map<String, dynamic>? _sessionData;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _verifySession();
    _confettiController.play();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  Future<void> _verifySession() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/subscription/verify-session?session_id=${widget.sessionId}');

      setState(() {
        _sessionData = response.data as Map<String, dynamic>;
        _isLoading = false;
      });

      // Refresh user data to get updated subscription status
      if (mounted) {
        await context.read<AuthProvider>().fetchUser();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Stack(
        children: [
          SafeArea(
            child: _isLoading
                ? Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(height: 40),

                        // Success Icon
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.secondaryGradient,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.secondary.withOpacity(0.3),
                                blurRadius: 30,
                                spreadRadius: 5,
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.check_circle,
                            color: Colors.white,
                            size: 70,
                          ),
                        ),

                        SizedBox(height: 32),

                        // Success Message
                        Text(
                          'subscription.success.welcome_heading'.tr(),
                          style: AppTextStyles.headlineLarge.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                          textAlign: TextAlign.center,
                        ),

                        SizedBox(height: 12),

                        Text(
                          'subscription.success.payment_successful_message'.tr(),
                          style: AppTextStyles.bodyLarge.copyWith(
                            color: AppColors.grey600,
                          ),
                          textAlign: TextAlign.center,
                        ),

                        SizedBox(height: 40),

                        // Plan Info Card
                        Container(
                          padding: EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFFF3F4F6), Color(0xFFE5E7EB)],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.grey300),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'subscription.success.info_plan_label'.tr(),
                                    style: TextStyle(
                                      color: AppColors.grey600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  Container(
                                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      gradient: AppColors.secondaryGradient,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      (_sessionData?['plan'] ?? 'Pro').toUpperCase(),
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'subscription.success.info_status_label'.tr(),
                                    style: TextStyle(
                                      color: AppColors.grey600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      Icon(Icons.check_circle, color: AppColors.success, size: 18),
                                      SizedBox(width: 6),
                                      Text(
                                        'subscription.success.info_status_active'.tr(),
                                        style: TextStyle(
                                          color: AppColors.success,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        SizedBox(height: 32),

                        // Features unlocked
                        Text(
                          'subscription.success.features_heading'.tr(),
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),

                        SizedBox(height: 16),

                        ...[
                          'Unlimited AI requests',
                          'Advanced problem solver',
                          'Exam clone generator',
                          'Deep research tools',
                          'Priority support',
                          'Advanced analytics',
                        ].map((feature) => Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, color: AppColors.secondary, size: 22),
                              SizedBox(width: 12),
                              Text(
                                feature,
                                style: TextStyle(fontSize: 15),
                              ),
                            ],
                          ),
                        )).toList(),

                        SizedBox(height: 40),

                        // Continue Button
                        ElevatedButton(
                          onPressed: () {
                            // Go back to home
                            Navigator.of(context).popUntil((route) => route.isFirst);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.secondary,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'subscription.success.button_continue'.tr(),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
          ),

          // Confetti
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              particleDrag: 0.05,
              emissionFrequency: 0.05,
              numberOfParticles: 30,
              gravity: 0.1,
              colors: [
                AppColors.secondary,
                AppColors.secondaryLight,
                AppColors.primary,
                AppColors.purple,
                Colors.amber,
              ],
            ),
          ),
        ],
      ),
    );
  }
}
