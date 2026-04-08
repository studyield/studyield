import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../../../study_sets/domain/entities/study_set_entity.dart';
import 'quiz_taking_screen.dart';

class QuizModeScreen extends StatefulWidget {
  final StudySetEntity studySet;

  const QuizModeScreen({
    super.key,
    required this.studySet,
  });

  @override
  State<QuizModeScreen> createState() => _QuizModeScreenState();
}

class _QuizModeScreenState extends State<QuizModeScreen> {
  int _questionCount = 10;
  Set<String> _questionTypes = {'multiple_choice', 'true_false'};
  bool _hasTimer = false;
  bool _isGenerating = false;

  Future<void> _generateAndStartQuiz() async {
    if (_questionTypes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('quiz.mode.please_select_question_type'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isGenerating = true);

    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.post(
        '/quizzes/generate',
        data: {
          'studySetId': widget.studySet.id,
          'title': '${widget.studySet.title} Quiz',
          'questionCount': _questionCount,
          'questionTypes': _questionTypes.toList(),
        },
      );

      final quizId = response.data['id'] as String;

      // Get questions
      final questionsResponse = await apiClient.get('/quizzes/$quizId/questions');
      final questions = questionsResponse.data as List<dynamic>;

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => QuizTakingScreen(
            quizId: quizId,
            quizTitle: response.data['title'] as String,
            questions: questions,
            timeLimit: response.data['timeLimit'] as int?,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('quiz.mode.failed_to_generate'.tr(namedArgs: {'error': '$e'})),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isGenerating = false);
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
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'quiz.mode.title'.tr(),
              style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            Text(
              widget.studySet.title,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppDimensions.space20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Section
            Container(
              padding: EdgeInsets.all(AppDimensions.space24),
              decoration: BoxDecoration(
                gradient: AppColors.greenGradient,
                borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
              ),
              child: Column(
                children: [
                  Icon(Icons.quiz, size: 64, color: Colors.white),
                  SizedBox(height: AppDimensions.space16),
                  Text(
                    'quiz.mode.hero_title'.tr(),
                    style: AppTextStyles.titleLarge.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space8),
                  Text(
                    'quiz.mode.hero_subtitle'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space32),

            // Number of Questions
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                border: Border.all(
                  color: theme.colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.numbers, color: AppColors.secondary, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'quiz.mode.number_of_questions'.tr(),
                        style: AppTextStyles.titleSmall.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  SizedBox(height: AppDimensions.space16),
                  Row(
                    children: [5, 10, 15, 20].map((count) {
                      final isSelected = _questionCount == count;
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(right: count == 20 ? 0 : 8),
                          child: InkWell(
                            onTap: () => setState(() => _questionCount = count),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: EdgeInsets.symmetric(vertical: 16),
                              decoration: BoxDecoration(
                                gradient: isSelected ? AppColors.greenGradient : null,
                                color: isSelected ? null : theme.scaffoldBackgroundColor,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '$count',
                                style: AppTextStyles.titleMedium.copyWith(
                                  color: isSelected ? Colors.white : theme.colorScheme.onSurface,
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space16),

            // Question Types
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                border: Border.all(
                  color: theme.colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.checklist, color: AppColors.secondary, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'quiz.mode.question_types'.tr(),
                        style: AppTextStyles.titleSmall.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  SizedBox(height: AppDimensions.space16),
                  _QuestionTypeCard(
                    title: 'quiz.mode.multiple_choice'.tr(),
                    description: 'quiz.mode.multiple_choice_description'.tr(),
                    isSelected: _questionTypes.contains('multiple_choice'),
                    onTap: () {
                      setState(() {
                        if (_questionTypes.contains('multiple_choice')) {
                          _questionTypes.remove('multiple_choice');
                        } else {
                          _questionTypes.add('multiple_choice');
                        }
                      });
                    },
                  ),
                  SizedBox(height: 12),
                  _QuestionTypeCard(
                    title: 'quiz.mode.true_false'.tr(),
                    description: 'quiz.mode.true_false_description'.tr(),
                    isSelected: _questionTypes.contains('true_false'),
                    onTap: () {
                      setState(() {
                        if (_questionTypes.contains('true_false')) {
                          _questionTypes.remove('true_false');
                        } else {
                          _questionTypes.add('true_false');
                        }
                      });
                    },
                  ),
                  SizedBox(height: 12),
                  _QuestionTypeCard(
                    title: 'quiz.mode.fill_blank'.tr(),
                    description: 'quiz.mode.fill_blank_description'.tr(),
                    isSelected: _questionTypes.contains('fill_blank'),
                    onTap: () {
                      setState(() {
                        if (_questionTypes.contains('fill_blank')) {
                          _questionTypes.remove('fill_blank');
                        } else {
                          _questionTypes.add('fill_blank');
                        }
                      });
                    },
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space16),

            // Timer
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                border: Border.all(
                  color: theme.colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.timer, color: AppColors.secondary, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'quiz.mode.timer'.tr(),
                          style: AppTextStyles.titleSmall.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'quiz.mode.timer_description'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _hasTimer,
                    onChanged: (value) => setState(() => _hasTimer = value),
                    activeColor: AppColors.secondary,
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space32),

            // Generate Button
            PrimaryButton(
              text: _isGenerating ? 'quiz.mode.generating_quiz'.tr() : 'quiz.mode.generate_start_quiz'.tr(),
              icon: Icons.auto_awesome,
              onPressed: _isGenerating ? null : _generateAndStartQuiz,
              width: double.infinity,
              gradient: AppColors.greenGradient,
              isLoading: _isGenerating,
              height: 56,
            ),
          ],
        ),
      ),
    );
  }
}

class _QuestionTypeCard extends StatelessWidget {
  final String title;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;

  const _QuestionTypeCard({
    required this.title,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        padding: EdgeInsets.all(AppDimensions.space16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.secondary.withOpacity(0.05) : theme.scaffoldBackgroundColor,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          border: Border.all(
            color: isSelected ? AppColors.secondary : theme.colorScheme.onSurface.withOpacity(0.1),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.titleSmall.copyWith(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    description,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.secondary : Colors.transparent,
                border: Border.all(
                  color: isSelected ? AppColors.secondary : AppColors.grey400,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Icon(Icons.check, size: 16, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
