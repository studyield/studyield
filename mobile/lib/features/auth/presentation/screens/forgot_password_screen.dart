import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../widgets/auth_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _isSubmitted = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Enter a valid email';
    }
    return null;
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await ApiClient.instance.post(
        '/auth/forgot-password',
        data: {'email': _emailController.text.trim()},
      );
      setState(() {
        _isSubmitted = true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Something went wrong. Please try again.';
        _isLoading = false;
      });
    }
  }

  void _handleTryAgain() {
    setState(() {
      _isSubmitted = false;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(AppDimensions.space24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: AppDimensions.space32),

              // Logo
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
                  child: Image.asset(
                    'assets/logo/studyield-logo.png',
                    width: 72,
                    height: 72,
                  ),
                ),
              ),

              SizedBox(height: AppDimensions.space16),

              if (_isSubmitted) _buildSubmittedState(theme) else _buildFormState(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormState(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Title (gradient text matching web)
        ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)],
          ).createShader(bounds),
          child: Text(
            'Forgot Password?',
            style: AppTextStyles.headlineLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
        ),

        SizedBox(height: AppDimensions.space12),

        Text(
          'No worries! Enter your email address and we\'ll send you a link to reset your password.',
          style: AppTextStyles.bodyLarge.copyWith(
            color: theme.brightness == Brightness.dark ? AppColors.grey400 : AppColors.grey600,
          ),
          textAlign: TextAlign.center,
        ),

        SizedBox(height: AppDimensions.space32),

        // Error message (inline)
        if (_errorMessage != null) ...[
          Container(
            padding: EdgeInsets.all(AppDimensions.space12),
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            ),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: AppColors.error, size: 20),
                SizedBox(width: AppDimensions.space8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: AppDimensions.space16),
        ],

        // Email Field
        Form(
          key: _formKey,
          child: Column(
            children: [
              AuthTextField(
                controller: _emailController,
                label: 'auth.forgot_password.email_label'.tr(),
                hint: 'Enter your email address',
                prefixIcon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                validator: _validateEmail,
                enabled: !_isLoading,
              ),

              SizedBox(height: AppDimensions.space24),

              // Submit Button
              PrimaryButton(
                text: 'auth.forgot_password.send_reset_link'.tr(),
                onPressed: _isLoading ? null : _handleSubmit,
                isLoading: _isLoading,
                width: double.infinity,
                gradient: AppColors.greenGradient,
              ),
            ],
          ),
        ),

        SizedBox(height: AppDimensions.space24),

        // Back to Sign In
        Center(
          child: TextButton.icon(
            onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
            icon: Icon(
              Icons.arrow_back,
              size: 18,
              color: theme.colorScheme.primary,
            ),
            label: Text(
              'Back to Sign In',
              style: AppTextStyles.labelLarge.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmittedState(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Success Icon
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_circle_outline,
              color: AppColors.success,
              size: 40,
            ),
          ),
        ),

        SizedBox(height: AppDimensions.space24),

        // Title (gradient text matching web)
        ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)],
          ).createShader(bounds),
          child: Text(
            'Check Your Email',
            style: AppTextStyles.headlineLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
        ),

        SizedBox(height: AppDimensions.space12),

        Text(
          'We\'ve sent a password reset link to',
          style: AppTextStyles.bodyLarge.copyWith(
            color: theme.brightness == Brightness.dark ? AppColors.grey400 : AppColors.grey600,
          ),
          textAlign: TextAlign.center,
        ),

        SizedBox(height: AppDimensions.space4),

        Text(
          _emailController.text.trim(),
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
          textAlign: TextAlign.center,
        ),

        SizedBox(height: AppDimensions.space32),

        // Try Again Button
        OutlinedButton(
          onPressed: _handleTryAgain,
          style: OutlinedButton.styleFrom(
            padding: EdgeInsets.symmetric(vertical: AppDimensions.space16),
            side: BorderSide(color: AppColors.grey300),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            ),
          ),
          child: Text(
            'Didn\'t receive it? Try Again',
            style: AppTextStyles.labelLarge.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
        ),

        SizedBox(height: AppDimensions.space16),

        // Back to Sign In
        PrimaryButton(
          text: 'auth.forgot_password.back_to_sign_in'.tr(),
          onPressed: () => Navigator.of(context).pop(),
          width: double.infinity,
          gradient: AppColors.greenGradient,
        ),
      ],
    );
  }
}
