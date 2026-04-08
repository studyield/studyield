import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../core/network/api_client.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final TextEditingController _oldPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final TextEditingController _deleteConfirmController = TextEditingController();

  bool _showOldPassword = false;
  bool _showNewPassword = false;
  bool _isChangingPassword = false;
  bool _passwordChanged = false;
  String? _passwordError;
  bool _showDeleteConfirm = false;
  bool _isDeleting = false;

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _deleteConfirmController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    setState(() {
      _passwordError = null;
      _isChangingPassword = true;
    });

    // Validation
    if (_oldPasswordController.text.isEmpty) {
      setState(() {
        _passwordError = 'profile.account.validation.current_password_required'.tr();
        _isChangingPassword = false;
      });
      return;
    }

    if (_newPasswordController.text.length < 8) {
      setState(() {
        _passwordError = 'profile.account.validation.password_min_length'.tr();
        _isChangingPassword = false;
      });
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() {
        _passwordError = 'profile.account.validation.passwords_mismatch'.tr();
        _isChangingPassword = false;
      });
      return;
    }

    try {
      // API call to change password
      final apiClient = ApiClient.instance;
      await apiClient.post(
        '/auth/change-password',
        data: {
          'oldPassword': _oldPasswordController.text,
          'newPassword': _newPasswordController.text,
        },
      );

      setState(() {
        _isChangingPassword = false;
        _passwordChanged = true;
        _oldPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
      });

      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _passwordChanged = false);
      });
    } catch (e) {
      setState(() {
        _passwordError = e.toString().replaceAll('Exception: ', '');
        _isChangingPassword = false;
      });
    }
  }

  Future<void> _deleteAccount() async {
    final confirmText = 'profile.account.delete.confirmation_hint'.tr();
    if (_deleteConfirmController.text != confirmText) return;

    setState(() => _isDeleting = true);
    // TODO: API call to delete account
    await Future.delayed(const Duration(seconds: 1));

    if (mounted) {
      context.read<AuthProvider>().logout();
      // Navigate to login
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('profile.account.title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Change Password
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
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.lock, color: Color(0xFF3B82F6), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'profile.account.change_password.title'.tr(),
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'profile.account.change_password.subtitle'.tr(),
                              style: const TextStyle(fontSize: 12, color: AppColors.grey600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildPasswordField(
                    controller: _oldPasswordController,
                    label: 'profile.account.change_password.current_password_label'.tr(),
                    obscure: !_showOldPassword,
                    onToggle: () => setState(() => _showOldPassword = !_showOldPassword),
                  ),
                  const SizedBox(height: 12),
                  _buildPasswordField(
                    controller: _newPasswordController,
                    label: 'profile.account.change_password.new_password_label'.tr(),
                    obscure: !_showNewPassword,
                    onToggle: () => setState(() => _showNewPassword = !_showNewPassword),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'profile.account.change_password.confirm_password_label'.tr(),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: AppColors.grey50,
                    ),
                  ),
                  if (_passwordError != null) ...[
                    const SizedBox(height: 8),
                    Text(_passwordError!, style: const TextStyle(fontSize: 12, color: Colors.red)),
                  ],
                  if (_passwordChanged) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'profile.account.messages.password_changed_success'.tr(),
                          style: const TextStyle(fontSize: 12, color: Color(0xFF10B981)),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isChangingPassword ? null : _changePassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: _isChangingPassword
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation(Colors.white),
                              ),
                            )
                          : Text('profile.account.change_password.button'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Account Info
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
                    'profile.account.information.title'.tr(),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow('profile.account.information.email_label'.tr(), user?.email ?? ''),
                  _buildInfoRow('profile.account.information.plan_label'.tr(), user?.planDisplayName ?? 'Free'),
                  _buildInfoRow('profile.account.information.email_verified_label'.tr(), 'profile.account.information.email_verified_yes'.tr()),
                  _buildInfoRow(
                    'profile.account.information.member_since_label'.tr(),
                    user?.createdAt != null
                        ? DateFormat.yMMMM().format(user!.createdAt)
                        : '-',
                    isLast: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Delete Account
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.red.withValues(alpha: 0.2), width: 2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.delete_forever, color: Colors.red, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'profile.account.delete.title'.tr(),
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                            Text(
                              'profile.account.delete.subtitle'.tr(),
                              style: const TextStyle(fontSize: 12, color: AppColors.grey600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (!_showDeleteConfirm) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => setState(() => _showDeleteConfirm = true),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: BorderSide(color: Colors.red.withValues(alpha: 0.3)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text('profile.account.delete.button'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.warning, color: Colors.red, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'profile.account.delete.warning_title'.tr(),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'profile.account.delete.warning_message'.tr(),
                            style: const TextStyle(fontSize: 12, color: AppColors.grey600),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'profile.account.delete.confirmation_instruction'.tr(),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _deleteConfirmController,
                            decoration: InputDecoration(
                              hintText: 'profile.account.delete.confirmation_hint'.tr(),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _deleteConfirmController.text == 'profile.account.delete.confirmation_hint'.tr() && !_isDeleting
                                      ? _deleteAccount
                                      : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                  ),
                                  child: _isDeleting
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation(Colors.white),
                                          ),
                                        )
                                      : Text('profile.account.delete.confirm_button'.tr()),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () {
                                    setState(() {
                                      _showDeleteConfirm = false;
                                      _deleteConfirmController.clear();
                                    });
                                  },
                                  child: Text('profile.account.delete.cancel_button'.tr()),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required VoidCallback onToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        filled: true,
        fillColor: AppColors.grey50,
        suffixIcon: IconButton(
          icon: Icon(obscure ? Icons.visibility : Icons.visibility_off),
          onPressed: onToggle,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isLast = false}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 13, color: AppColors.grey600),
              ),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1),
      ],
    );
  }
}
