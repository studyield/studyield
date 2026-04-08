import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/constants/level_constants.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/api_config.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _customSubjectController = TextEditingController();
  String? _selectedEducation;
  final List<String> _selectedSubjects = [];
  File? _avatarImage;
  String? _avatarUrl;
  String? _email;
  bool _isSaving = false;
  bool _saved = false;
  bool _isLoading = true;
  int _userLevel = 0;

  final Map<String, String> _educationLevels = {
    'high_school': 'profile.edit.education_level.options.high_school',
    'undergraduate': 'profile.edit.education_level.options.undergraduate',
    'graduate': 'profile.edit.education_level.options.graduate',
    'post_graduate': 'profile.edit.education_level.options.post_graduate',
    'self_learner': 'profile.edit.education_level.options.self_learner',
    'professional': 'profile.edit.education_level.options.professional',
  };

  List<String> get _commonSubjects => [
    'profile.edit.subjects.options.mathematics'.tr(),
    'profile.edit.subjects.options.physics'.tr(),
    'profile.edit.subjects.options.chemistry'.tr(),
    'profile.edit.subjects.options.biology'.tr(),
    'profile.edit.subjects.options.computer_science'.tr(),
    'profile.edit.subjects.options.english'.tr(),
    'profile.edit.subjects.options.history'.tr(),
    'profile.edit.subjects.options.geography'.tr(),
    'profile.edit.subjects.options.economics'.tr(),
    'profile.edit.subjects.options.psychology'.tr(),
  ];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get(Endpoints.profile);
      final data = response.data as Map<String, dynamic>;

      // Fetch gamification separately (non-blocking)
      try {
        final gamResponse = await apiClient.get(Endpoints.gamification);
        final gamData = gamResponse.data as Map<String, dynamic>;
        _userLevel = (gamData['level'] ?? 0) as int;
      } catch (_) {}

      setState(() {
        _nameController.text = data['name'] ?? '';
        _email = data['email'] ?? '';
        _avatarUrl = data['avatarUrl'];
        _selectedEducation = data['educationLevel'];
        _selectedSubjects.clear();
        if (data['subjects'] != null) {
          _selectedSubjects.addAll(List<String>.from(data['subjects']));
        }
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      // Fallback to auth provider data
      final auth = context.read<AuthProvider>();
      setState(() {
        _nameController.text = auth.user?.name ?? '';
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _customSubjectController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _avatarImage = File(pickedFile.path));
    }
  }

  void _toggleSubject(String subject) {
    setState(() {
      if (_selectedSubjects.contains(subject)) {
        _selectedSubjects.remove(subject);
      } else {
        _selectedSubjects.add(subject);
      }
    });
  }

  void _addCustomSubject() {
    final text = _customSubjectController.text.trim();
    if (text.isNotEmpty && !_selectedSubjects.contains(text)) {
      setState(() {
        _selectedSubjects.add(text);
        _customSubjectController.clear();
      });
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);

    try {
      final apiClient = ApiClient.instance;
      await apiClient.put(
        Endpoints.updateProfile,
        data: {
          'name': _nameController.text.trim(),
          if (_selectedEducation != null) 'educationLevel': _selectedEducation,
          'subjects': _selectedSubjects,
          if (_avatarUrl != null) 'avatarUrl': _avatarUrl,
        },
      );

      // Refresh auth user data
      if (!mounted) return;
      await context.read<AuthProvider>().fetchUser();

      setState(() {
        _isSaving = false;
        _saved = true;
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('profile.edit.message.success'.tr()),
          backgroundColor: const Color(0xFF10B981),
        ),
      );

      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _saved = false);
      });
    } catch (e) {
      setState(() => _isSaving = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${'profile.edit.message.error'.tr()}: $e'),
          backgroundColor: Colors.red,
        ),
      );
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
        title: Text('profile.edit.title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Avatar + Level Badge
            Center(
              child: Column(
                children: [
                  Stack(
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF10B981), Color(0xFF059669)],
                          ),
                          border: Border.all(color: Colors.white, width: 4),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF10B981).withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: _avatarImage != null
                            ? ClipOval(child: Image.file(_avatarImage!, fit: BoxFit.cover))
                            : _avatarUrl != null
                                ? ClipOval(child: Image.network(_avatarUrl!, fit: BoxFit.cover))
                                : Center(
                                    child: Text(
                                      _nameController.text.isNotEmpty
                                          ? _nameController.text[0].toUpperCase()
                                          : 'profile.edit.avatar.default_initial'.tr(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 40,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 8,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 18),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Level Badge
                  Builder(builder: (_) {
                    final levelInfo = LevelConstants.getLevelInfo(_userLevel);
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: levelInfo.gradient,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: levelInfo.gradientColors.first.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, color: Colors.white, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            '${levelInfo.name} — Level $_userLevel',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Name
            _buildSection(
              title: 'profile.edit.display_name.label'.tr(),
              child: TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  hintText: 'profile.edit.display_name.hint'.tr(),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Email (read-only)
            _buildSection(
              title: 'profile.edit.email.label'.tr(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppColors.grey100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.grey300),
                      ),
                      child: Text(
                        _email ?? user?.email ?? 'profile.edit.email.placeholder'.tr(),
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.grey600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'profile.edit.email.readonly_note'.tr(),
                    style: const TextStyle(fontSize: 12, color: AppColors.grey600),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Education Level
            _buildSection(
              title: 'profile.edit.education_level.label'.tr(),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _educationLevels.entries.map((entry) {
                  final key = entry.key;
                  final label = entry.value;
                  final isSelected = _selectedEducation == key;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedEducation = isSelected ? null : key),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.05) : Colors.white,
                        border: Border.all(
                          color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.5) : AppColors.grey300,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        label.tr(),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                          color: isSelected ? const Color(0xFF10B981) : Colors.black87,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 20),

            // Subjects
            _buildSection(
              title: 'profile.edit.subjects.label'.tr(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Common subjects
                  if (_commonSubjects.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _commonSubjects.map((subject) {
                        final isSelected = _selectedSubjects.contains(subject);
                        return GestureDetector(
                          onTap: () => _toggleSubject(subject),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.1) : Colors.white,
                              border: Border.all(
                                color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.5) : AppColors.grey300,
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  subject,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                    color: isSelected ? const Color(0xFF10B981) : Colors.black87,
                                  ),
                                ),
                                if (isSelected) ...[
                                  const SizedBox(width: 6),
                                  const Icon(Icons.close, size: 14, color: Color(0xFF10B981)),
                                ],
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  // Custom subjects (selected but not in common list)
                  if (_selectedSubjects.any((s) => !_commonSubjects.contains(s))) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _selectedSubjects
                          .where((s) => !_commonSubjects.contains(s))
                          .map((subject) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.1),
                            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.5)),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                subject,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                              const SizedBox(width: 6),
                              GestureDetector(
                                onTap: () => _toggleSubject(subject),
                                child: const Icon(Icons.close, size: 14, color: Color(0xFF10B981)),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  // Add custom subject input
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _customSubjectController,
                          decoration: InputDecoration(
                            hintText: 'profile.edit.subjects.add_custom.hint'.tr(),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                            isDense: true,
                          ),
                          onSubmitted: (_) => _addCustomSubject(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: _customSubjectController.text.trim().isEmpty ? null : _addCustomSubject,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.all(14),
                          side: const BorderSide(color: AppColors.grey300),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text('profile.edit.add'.tr()),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Save Button
            ElevatedButton(
              onPressed: _isSaving || _nameController.text.trim().isEmpty ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSaving
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text('profile.edit.button.saving'.tr()),
                      ],
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(_saved ? Icons.check : Icons.save, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          _saved ? 'profile.edit.button.saved'.tr() : 'profile.edit.button.save'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child}) {
    return Container(
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
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}
