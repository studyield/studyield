import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/services/chat_socket_service.dart';
import '../../../../providers/auth_provider.dart';
import '../../../onboarding/constants/onboarding_constants.dart';
import '../../../onboarding/presentation/screens/setup_wizard_screen.dart';
import '../../../onboarding/presentation/screens/post_login_onboarding_wrapper.dart';
import '../../../onboarding/presentation/screens/special_offer_screen.dart';
import '../../../main_navigation/main_screen.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/social_login_button.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'auth.errors.email_required'.tr();
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'auth.errors.email_invalid'.tr();
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'auth.errors.password_required'.tr();
    }
    if (value.length < 6) {
      return 'auth.errors.password_min_length'.tr();
    }
    return null;
  }

  void _handleLogin() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
            LoginRequested(
              email: _emailController.text.trim(),
              password: _passwordController.text,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) async {
          if (state is AuthSuccess) {
            // Store references before async gap (widget may unmount during fetchUser)
            final navigator = Navigator.of(context);
            final authProvider = context.read<AuthProvider>();

            await authProvider.fetchUser();
            ChatSocketService.instance.reconnect();

            // Navigate based on profileCompleted from backend
            final user = authProvider.user;
            if (user != null && user.profileCompleted != true) {
              // New user — setup wizard → post-login tour → home
              navigator.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => SetupWizardScreen(
                  onComplete: () {
                    navigator.pushReplacement(
                      MaterialPageRoute(builder: (_) => const PostLoginOnboardingWrapper()),
                    );
                  },
                )),
                (route) => false,
              );
            } else {
              // Existing user — check if they've seen the special offer
              final prefs = await SharedPreferences.getInstance();
              final hasSeenOffer = prefs.getBool(OnboardingConstants.hasSeenWelcomeOfferKey) ?? false;

              if (!hasSeenOffer) {
                navigator.pushAndRemoveUntil(
                  MaterialPageRoute(
                    builder: (_) => SpecialOfferScreen(
                      onComplete: () {
                        navigator.pushAndRemoveUntil(
                          MaterialPageRoute(builder: (_) => const MainScreen(initialPage: 0)),
                          (route) => false,
                        );
                      },
                      onSkip: () {
                        navigator.pushAndRemoveUntil(
                          MaterialPageRoute(builder: (_) => const MainScreen(initialPage: 0)),
                          (route) => false,
                        );
                      },
                    ),
                  ),
                  (route) => false,
                );
              } else {
                navigator.pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const MainScreen(initialPage: 0)),
                  (route) => false,
                );
              }
            }
          }
        },
        builder: (context, state) {
          final isLoading = state is AuthLoading;
          final errorMessage = state is AuthError ? state.message : null;

          return SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(AppDimensions.space24),
              child: Form(
                key: _formKey,
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

                    // Title (gradient text matching web)
                    ShaderMask(
                      shaderCallback: (bounds) => LinearGradient(
                        colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.7)],
                      ).createShader(bounds),
                      child: Text(
                        'auth.login.title'.tr(),
                        style: AppTextStyles.headlineLarge.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    SizedBox(height: AppDimensions.space8),

                    Text(
                      'auth.login.subtitle'.tr(),
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: isDark ? AppColors.grey400 : AppColors.grey600,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    SizedBox(height: AppDimensions.space32),

                    // Social Login Buttons (square icon-only)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SocialLoginButton(
                          text: 'auth.social.google'.tr(),
                          icon: Icons.g_mobiledata,
                          backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
                          textColor: const Color(0xFFDB4437),
                          isSquare: true,
                          customChild: Text(
                            'G',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFFDB4437),
                            ),
                          ),
                          onPressed: isLoading ? () {} : () {
                            // TODO: Implement Google login
                          },
                        ),
                        SizedBox(width: AppDimensions.space16),
                        SocialLoginButton(
                          text: 'auth.social.apple'.tr(),
                          icon: Icons.apple,
                          backgroundColor: isDark ? AppColors.surfaceDark : Colors.black,
                          textColor: Colors.white,
                          isSquare: true,
                          onPressed: isLoading ? () {} : () {
                            // TODO: Implement Apple login
                          },
                        ),
                      ],
                    ),

                    SizedBox(height: AppDimensions.space24),

                    // Divider
                    Row(
                      children: [
                        Expanded(
                          child: Divider(color: AppColors.grey300, thickness: 1),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: AppDimensions.space16),
                          child: Text(
                            'OR SIGN IN WITH EMAIL',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: AppColors.grey500,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(color: AppColors.grey300, thickness: 1),
                        ),
                      ],
                    ),

                    SizedBox(height: AppDimensions.space24),

                    // Error message (inline)
                    if (errorMessage != null) ...[
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
                                errorMessage,
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
                    AuthTextField(
                      controller: _emailController,
                      label: 'auth.login.email_label'.tr(),
                      hint: 'auth.login.email_hint'.tr(),
                      prefixIcon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: _validateEmail,
                      enabled: !isLoading,
                    ),

                    SizedBox(height: AppDimensions.space20),

                    // Password Field
                    AuthTextField(
                      controller: _passwordController,
                      label: 'auth.login.password_label'.tr(),
                      hint: 'auth.login.password_hint'.tr(),
                      prefixIcon: Icons.lock_outline,
                      isPassword: true,
                      validator: _validatePassword,
                      enabled: !isLoading,
                    ),

                    SizedBox(height: AppDimensions.space8),

                    // Forgot Password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: isLoading
                            ? null
                            : () {
                                Navigator.of(context).pushNamed('/forgot-password');
                              },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          'auth.login.forgot_password'.tr(),
                          style: AppTextStyles.labelLarge.copyWith(
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ),
                    ),

                    SizedBox(height: AppDimensions.space24),

                    // Sign In Button
                    PrimaryButton(
                      text: 'auth.login.login_button'.tr(),
                      onPressed: isLoading ? null : _handleLogin,
                      isLoading: isLoading,
                      width: double.infinity,
                      gradient: AppColors.greenGradient,
                    ),

                    SizedBox(height: AppDimensions.space32),

                    // Register Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'auth.login.no_account'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.grey600,
                          ),
                        ),
                        TextButton(
                          onPressed: isLoading
                              ? null
                              : () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => const RegisterScreen(),
                                    ),
                                  );
                                },
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'auth.login.sign_up'.tr(),
                            style: AppTextStyles.labelLarge.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

}
