import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../providers/auth_provider.dart';
import '../../data/datasources/onboarding_local_datasource.dart';

class SetupWizardScreen extends StatefulWidget {
  final VoidCallback? onComplete;

  const SetupWizardScreen({super.key, this.onComplete});

  @override
  State<SetupWizardScreen> createState() => _SetupWizardScreenState();
}

class _SetupWizardScreenState extends State<SetupWizardScreen>
    with TickerProviderStateMixin {
  int _currentStep = 0; // 0=education, 1=subjects, 2=goal, 3=done
  String? _selectedEducation;
  final Set<String> _selectedSubjects = {};
  String? _selectedGoal;
  bool _isSaving = false;
  final TextEditingController _customSubjectController = TextEditingController();
  final List<String> _customSubjects = [];
  int _slideDirection = 1; // 1 = forward, -1 = backward

  // Animation controllers for done screen
  late AnimationController _checkController;
  late Animation<double> _checkScale;
  late Animation<double> _checkRotation;
  late AnimationController _pulseController;
  late Animation<double> _pulseScale;

  static const _steps = ['education', 'subjects', 'goal'];

  // Education options matching web exactly
  static const _educationOptions = [
    {'key': 'high_school', 'icon': 'school'},
    {'key': 'undergraduate', 'icon': 'graduation_cap'},
    {'key': 'graduate', 'icon': 'award'},
    {'key': 'post_graduate', 'icon': 'award'},
    {'key': 'self_learner', 'icon': 'lightbulb'},
    {'key': 'professional', 'icon': 'briefcase'},
  ];

  // Subject options matching web exactly
  static const _subjectOptions = [
    'mathematics', 'physics', 'chemistry', 'biology',
    'computer_science', 'history', 'english', 'economics',
    'psychology', 'engineering', 'medicine', 'law',
    'business', 'art_design', 'statistics', 'philosophy',
  ];

  // Goal options matching web exactly
  static const _goalOptions = [
    {'key': 'exam_prep', 'icon': 'target'},
    {'key': 'daily_study', 'icon': 'clock'},
    {'key': 'homework', 'icon': 'brain'},
    {'key': 'research', 'icon': 'search'},
    {'key': 'exploring', 'icon': 'rocket'},
  ];

  IconData _getEducationIcon(String iconKey) {
    switch (iconKey) {
      case 'school': return Icons.school;
      case 'graduation_cap': return Icons.school_outlined;
      case 'award': return Icons.emoji_events;
      case 'lightbulb': return Icons.lightbulb;
      case 'briefcase': return Icons.work;
      default: return Icons.school;
    }
  }

  IconData _getGoalIcon(String iconKey) {
    switch (iconKey) {
      case 'target': return Icons.gps_fixed;
      case 'clock': return Icons.schedule;
      case 'brain': return Icons.psychology;
      case 'search': return Icons.search;
      case 'rocket': return Icons.rocket_launch;
      default: return Icons.gps_fixed;
    }
  }

  @override
  void initState() {
    super.initState();
    // Check icon animation (spring-like with rotation)
    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _checkScale = CurvedAnimation(
      parent: _checkController,
      curve: Curves.elasticOut,
    );
    _checkRotation = Tween<double>(begin: -0.5, end: 0.0).animate(
      CurvedAnimation(parent: _checkController, curve: Curves.easeOut),
    );

    // Pulse animation for the background ring
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _pulseScale = Tween<double>(begin: 1.0, end: 1.4).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _customSubjectController.dispose();
    _checkController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  bool get _canContinue {
    switch (_currentStep) {
      case 0: return _selectedEducation != null;
      case 1: return _selectedSubjects.isNotEmpty || _customSubjects.isNotEmpty;
      case 2: return _selectedGoal != null;
      default: return false;
    }
  }

  void _nextStep() {
    if (_currentStep < 2) {
      setState(() {
        _slideDirection = 1;
        _currentStep++;
      });
    } else {
      _completeSetup();
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() {
        _slideDirection = -1;
        _currentStep--;
      });
    }
  }

  Future<void> _completeSetup() async {
    setState(() => _isSaving = true);

    try {
      // Combine selected subjects with custom subjects
      final allSubjects = [
        ..._selectedSubjects,
        ..._customSubjects,
      ];

      // Send PUT /users/me to update profile
      await ApiClient.instance.put('/users/me', data: {
        'educationLevel': _selectedEducation,
        'subjects': allSubjects.toList(),
        'profileCompleted': true,
        'preferences': {
          'studyGoal': _selectedGoal,
        },
      });

      // Refresh user data
      if (mounted) {
        await context.read<AuthProvider>().fetchUser();
      }

      // Mark post-login onboarding as completed locally
      final prefs = await SharedPreferences.getInstance();
      final dataSource = OnboardingLocalDataSourceImpl(sharedPreferences: prefs);
      await dataSource.markPostLoginOnboardingCompleted();

      if (mounted) {
        setState(() {
          _currentStep = 3; // done screen
          _isSaving = false;
        });
        // Trigger done screen animations
        _checkController.forward();
        _pulseController.repeat();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        // Still proceed even if API fails - mark locally as complete
        final prefs = await SharedPreferences.getInstance();
        final dataSource = OnboardingLocalDataSourceImpl(sharedPreferences: prefs);
        await dataSource.markPostLoginOnboardingCompleted();
        setState(() => _currentStep = 3);
        _checkController.forward();
        _pulseController.repeat();
      }
    }
  }

  Future<void> _skipSetup() async {
    final prefs = await SharedPreferences.getInstance();
    final dataSource = OnboardingLocalDataSourceImpl(sharedPreferences: prefs);
    await dataSource.markPostLoginOnboardingCompleted();

    // Try to mark profile as completed on backend
    try {
      await ApiClient.instance.put('/users/me', data: {
        'profileCompleted': true,
      });
    } catch (_) {}

    if (mounted) {
      if (widget.onComplete != null) {
        widget.onComplete!();
      } else {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    }
  }

  void _goToDashboard() {
    if (widget.onComplete != null) {
      widget.onComplete!();
    } else {
      Navigator.of(context).pushReplacementNamed('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_currentStep == 3) {
      return _buildDoneScreen(isDark);
    }

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    const Color(0xFF064E3B).withValues(alpha: 0.4),
                    const Color(0xFF065F46).withValues(alpha: 0.3),
                    const Color(0xFF134E4A).withValues(alpha: 0.4),
                  ]
                : [
                    const Color(0xFFF0FDF4).withValues(alpha: 0.5), // green-50
                    const Color(0xFFECFDF5).withValues(alpha: 0.3), // emerald-50
                    const Color(0xFFF0FDFA).withValues(alpha: 0.4), // teal-50
                  ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(isDark),
              _buildProgressBar(),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (child, animation) {
                    final offsetAnimation = Tween<Offset>(
                      begin: Offset(_slideDirection.toDouble(), 0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeInOut,
                    ));
                    return SlideTransition(
                      position: offsetAnimation,
                      child: FadeTransition(
                        opacity: animation,
                        child: child,
                      ),
                    );
                  },
                  child: SingleChildScrollView(
                    key: ValueKey<int>(_currentStep),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: _buildCurrentStep(),
                  ),
                ),
              ),
              _buildFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/logo/studyield-logo.png',
                  width: 28,
                  height: 28,
                  errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
              const SizedBox(width: 8),
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF059669)], // green-500 to green-600
                ).createShader(bounds),
                child: Text(
                  'Studyield',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          TextButton(
            onPressed: _skipSetup,
            child: Text(
              'onboarding.setup.skip_for_now'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    final progress = (_currentStep + 1) / _steps.length;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'onboarding.setup.step_of'.tr(namedArgs: {
                  'current': '${_currentStep + 1}',
                  'total': '${_steps.length}',
                }),
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Custom gradient progress bar matching frontend
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: AppColors.grey200,
              borderRadius: BorderRadius.circular(4),
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                return Stack(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: constraints.maxWidth * progress,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF22C55E), Color(0xFF10B981)], // green-500 to emerald-500
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0: return _buildEducationStep();
      case 1: return _buildSubjectsStep();
      case 2: return _buildGoalStep();
      default: return const SizedBox.shrink();
    }
  }

  Widget _buildEducationStep() {
    return Column(
      children: [
        const SizedBox(height: 24),
        // Icon - blue gradient (matching frontend)
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)], // blue-500 to cyan-500
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.school, color: AppColors.white, size: 32),
        ),
        const SizedBox(height: 20),
        Text(
          'onboarding.setup.education_title'.tr(),
          textAlign: TextAlign.center,
          style: AppTextStyles.headlineMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'onboarding.setup.education_desc'.tr(),
          textAlign: TextAlign.center,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 24),
        // 2-column grid of education options
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: _educationOptions.map((option) {
            final key = option['key']!;
            final isSelected = _selectedEducation == key;
            return _buildEducationCard(key, option['icon']!, isSelected);
          }).toList(),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildEducationCard(String key, String iconKey, bool isSelected) {
    return GestureDetector(
      onTap: () => setState(() => _selectedEducation = key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF22C55E).withValues(alpha: 0.05) // green-500/5
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF22C55E) : AppColors.grey300, // green-500
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: const Color(0xFF22C55E).withValues(alpha: 0.1), blurRadius: 8, spreadRadius: 1)]
              : null,
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(
                  _getEducationIcon(iconKey),
                  size: 20,
                  color: isSelected ? const Color(0xFF22C55E) : AppColors.textSecondary,
                ),
                const Spacer(),
                if (isSelected)
                  Container(
                    width: 20,
                    height: 20,
                    decoration: const BoxDecoration(
                      color: Color(0xFF22C55E), // green-500
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, size: 14, color: AppColors.white),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'onboarding.setup.education.$key'.tr(),
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'onboarding.setup.education.${key}_desc'.tr(),
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectsStep() {
    final totalSelected = _selectedSubjects.length + _customSubjects.length;
    return Column(
      children: [
        const SizedBox(height: 24),
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF9333EA), Color(0xFF8B5CF6)], // purple-500 to violet-500
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.menu_book, color: AppColors.white, size: 32),
        ),
        const SizedBox(height: 20),
        Text(
          'onboarding.setup.subjects_title'.tr(),
          textAlign: TextAlign.center,
          style: AppTextStyles.headlineMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'onboarding.setup.subjects_desc'.tr(),
          textAlign: TextAlign.center,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        if (totalSelected > 0)
          Text(
            'onboarding.setup.subjects_selected'.tr(namedArgs: {
              'count': '$totalSelected',
            }),
            style: AppTextStyles.bodySmall.copyWith(
              color: const Color(0xFF22C55E), // green-500
              fontWeight: FontWeight.w600,
            ),
          ),
        const SizedBox(height: 20),
        // Subject pills - GREEN FILL when selected (matching frontend)
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _subjectOptions.map((subject) {
            final isSelected = _selectedSubjects.contains(subject);
            return _buildSubjectChip(subject, isSelected);
          }).toList(),
        ),
        // Custom subjects
        if (_customSubjects.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _customSubjects.map((subject) {
              return Chip(
                label: Text(subject),
                deleteIcon: const Icon(Icons.close, size: 16, color: AppColors.white),
                onDeleted: () => setState(() => _customSubjects.remove(subject)),
                backgroundColor: const Color(0xFF22C55E), // green-500
                labelStyle: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              );
            }).toList(),
          ),
        ],
        const SizedBox(height: 16),
        // Add custom subject
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _customSubjectController,
                decoration: InputDecoration(
                  hintText: 'onboarding.setup.add_custom_subject'.tr(),
                  hintStyle: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppColors.grey300),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  isDense: true,
                ),
                style: AppTextStyles.bodySmall,
                onSubmitted: (_) => _addCustomSubject(),
              ),
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: _addCustomSubject,
              child: Text(
                'onboarding.setup.add'.tr(),
                style: AppTextStyles.bodySmall.copyWith(
                  color: const Color(0xFF22C55E), // green-500
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  void _addCustomSubject() {
    final text = _customSubjectController.text.trim();
    if (text.isNotEmpty && !_customSubjects.contains(text)) {
      setState(() {
        _customSubjects.add(text);
        _customSubjectController.clear();
      });
    }
  }

  Widget _buildSubjectChip(String subject, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          if (isSelected) {
            _selectedSubjects.remove(subject);
          } else {
            _selectedSubjects.add(subject);
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          // Filled green when selected (matching frontend)
          color: isSelected ? const Color(0xFF22C55E) : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF22C55E) : AppColors.grey300,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: const Color(0xFF22C55E).withValues(alpha: 0.2), blurRadius: 8, spreadRadius: 1)]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) ...[
              const Icon(Icons.check, size: 14, color: AppColors.white),
              const SizedBox(width: 4),
            ],
            Text(
              'onboarding.setup.subject.$subject'.tr(),
              style: AppTextStyles.bodySmall.copyWith(
                // White text when selected (matching frontend)
                color: isSelected ? AppColors.white : AppColors.textPrimary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGoalStep() {
    return Column(
      children: [
        const SizedBox(height: 24),
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFF59E0B), Color(0xFFF97316)], // amber-500 to orange-500
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.gps_fixed, color: AppColors.white, size: 32),
        ),
        const SizedBox(height: 20),
        Text(
          'onboarding.setup.goal_title'.tr(),
          textAlign: TextAlign.center,
          style: AppTextStyles.headlineMedium.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'onboarding.setup.goal_desc'.tr(),
          textAlign: TextAlign.center,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 24),
        // Goal options as vertical cards
        ..._goalOptions.map((option) {
          final key = option['key']!;
          final isSelected = _selectedGoal == key;
          return _buildGoalCard(key, option['icon']!, isSelected);
        }),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildGoalCard(String key, String iconKey, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: () => setState(() => _selectedGoal = key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF22C55E).withValues(alpha: 0.05)
                : Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFF22C55E) : AppColors.grey300,
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected
                ? [BoxShadow(color: const Color(0xFF22C55E).withValues(alpha: 0.1), blurRadius: 8, spreadRadius: 1)]
                : null,
          ),
          child: Row(
            children: [
              Icon(
                _getGoalIcon(iconKey),
                size: 24,
                color: isSelected ? const Color(0xFF22C55E) : AppColors.textSecondary,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'onboarding.setup.goal.$key'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      'onboarding.setup.goal.${key}_desc'.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Color(0xFF22C55E), // green-500
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, size: 16, color: AppColors.white),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    final isLastStep = _currentStep == 2;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          if (_currentStep > 0) ...[
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: AppColors.grey300),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.arrow_back, size: 18, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      'onboarding.setup.back'.tr(),
                      style: AppTextStyles.button.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 16),
          ],
          Expanded(
            flex: _currentStep > 0 ? 1 : 2,
            child: ElevatedButton(
              onPressed: _canContinue ? (_isSaving ? null : _nextStep) : null,
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.zero,
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                disabledBackgroundColor: AppColors.grey200,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: _canContinue ? AppColors.greenGradient : null,
                  color: _canContinue ? null : AppColors.grey200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Container(
                  alignment: Alignment.center,
                  constraints: const BoxConstraints(minHeight: 52),
                  child: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.white,
                          ),
                        )
                      : Text(
                          isLastStep
                              ? 'onboarding.setup.complete'.tr()
                              : 'onboarding.setup.continue'.tr(),
                          style: AppTextStyles.button.copyWith(
                            color: _canContinue ? AppColors.white : AppColors.textSecondary,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDoneScreen(bool isDark) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    const Color(0xFF064E3B).withValues(alpha: 0.4),
                    const Color(0xFF065F46).withValues(alpha: 0.3),
                    const Color(0xFF134E4A).withValues(alpha: 0.4),
                  ]
                : [
                    const Color(0xFFF0FDF4).withValues(alpha: 0.5),
                    const Color(0xFFECFDF5).withValues(alpha: 0.3),
                    const Color(0xFFF0FDFA).withValues(alpha: 0.4),
                  ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Pulsing green gradient circle with animated check (matching frontend)
                  SizedBox(
                    width: 140,
                    height: 140,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Pulsing ring animation
                        AnimatedBuilder(
                          animation: _pulseScale,
                          builder: (context, child) {
                            return Transform.scale(
                              scale: _pulseScale.value,
                              child: Opacity(
                                opacity: (1.4 - _pulseScale.value) * 2.5, // fade as it expands
                                child: Container(
                                  width: 112,
                                  height: 112,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: const Color(0xFF22C55E).withValues(alpha: 0.2),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        // Main green gradient circle
                        Container(
                          width: 112,
                          height: 112,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF22C55E), Color(0xFF059669)], // green-500 to emerald-600
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF22C55E).withValues(alpha: 0.3),
                                blurRadius: 20,
                                spreadRadius: 4,
                              ),
                            ],
                          ),
                          child: ScaleTransition(
                            scale: _checkScale,
                            child: RotationTransition(
                              turns: _checkRotation,
                              child: const Icon(
                                Icons.check,
                                size: 56,
                                color: AppColors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    'onboarding.setup.done_title'.tr(),
                    textAlign: TextAlign.center,
                    style: AppTextStyles.headlineLarge.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'onboarding.setup.done_desc'.tr(),
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // 3 suggestion cards with GRADIENT ICON TILES (matching frontend)
                  Row(
                    children: [
                      _buildSuggestionCard(
                        Icons.library_books,
                        'onboarding.setup.done_study_set'.tr(),
                        const [Color(0xFF3B82F6), Color(0xFF06B6D4)], // blue to cyan
                      ),
                      const SizedBox(width: 12),
                      _buildSuggestionCard(
                        Icons.chat_bubble_outline,
                        'onboarding.setup.done_ai_chat'.tr(),
                        const [Color(0xFF22C55E), Color(0xFF10B981)], // green to emerald
                      ),
                      const SizedBox(width: 12),
                      _buildSuggestionCard(
                        Icons.bar_chart,
                        'onboarding.setup.done_track'.tr(),
                        const [Color(0xFF9333EA), Color(0xFF8B5CF6)], // purple to violet
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  // Go to Dashboard button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _goToDashboard,
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Ink(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF059669), Color(0xFF10B981)], // green-600 to emerald-600
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF22C55E).withValues(alpha: 0.25),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Container(
                          alignment: Alignment.center,
                          constraints: const BoxConstraints(minHeight: 56),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.rocket_launch,
                                color: AppColors.white,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'onboarding.setup.go_to_dashboard'.tr(),
                                style: AppTextStyles.button.copyWith(
                                  color: AppColors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Suggestion card with gradient icon tile (matching frontend)
  Widget _buildSuggestionCard(IconData icon, String label, List<Color> gradientColors) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.grey300),
        ),
        child: Column(
          children: [
            // Gradient icon tile
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: gradientColors,
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: gradientColors[0].withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, color: AppColors.white, size: 22),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
