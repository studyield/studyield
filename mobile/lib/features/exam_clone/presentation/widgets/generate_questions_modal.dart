import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';

class GenerateQuestionsModal extends StatefulWidget {
  final String examId;
  final List<String>? availableTopics;
  final VoidCallback onSuccess;

  const GenerateQuestionsModal({
    super.key,
    required this.examId,
    this.availableTopics,
    required this.onSuccess,
  });

  @override
  State<GenerateQuestionsModal> createState() => _GenerateQuestionsModalState();
}

class _GenerateQuestionsModalState extends State<GenerateQuestionsModal> {
  final ApiClient _apiClient = ApiClient.instance;

  String _mode = 'standard'; // 'standard' or 'template'
  int _count = 10;
  String _difficulty = 'match_original';
  List<String> _selectedTopics = [];
  bool _isGenerating = false;
  String? _error;

  Future<void> _handleGenerate() async {
    setState(() {
      _isGenerating = true;
      _error = null;
    });

    try {
      final response = await _apiClient.post(
        '/exam-clones/${widget.examId}/generate',
        data: {
          'count': _count,
          'difficulty': _difficulty,
          if (_selectedTopics.isNotEmpty) 'topics': _selectedTopics,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        Navigator.of(context).pop();
        widget.onSuccess();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('exam_clone.detail.questions_generated'.tr(namedArgs: {'count': '$_count'})),
              backgroundColor: AppColors.success,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to generate questions. Please try again.';
        _isGenerating = false;
      });
    }
  }

  void _toggleTopic(String topic) {
    setState(() {
      if (_selectedTopics.contains(topic)) {
        _selectedTopics.remove(topic);
      } else {
        _selectedTopics.add(topic);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: AppColors.grey300, width: 1),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      color: AppColors.secondary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'exam_clone.detail.generate_questions_title'.tr(),
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'exam_clone.detail.generate_questions_subtitle'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    iconSize: 20,
                  ),
                ],
              ),
            ),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Number of Questions
                    Text(
                      'exam_clone.detail.number_of_questions'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [5, 10, 15, 20, 30].map((n) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: _buildOptionButton(
                              '$n',
                              _count == n,
                              () => setState(() => _count = n),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 16),

                    // Difficulty
                    Text(
                      'exam_clone.detail.difficulty'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 3,
                      children: [
                        _buildOptionButton(
                          'exam_clone.detail.match_original'.tr(),
                          _difficulty == 'match_original',
                          () => setState(() => _difficulty = 'match_original'),
                        ),
                        _buildOptionButton(
                          'exam_clone.detail.easy'.tr(),
                          _difficulty == 'easy',
                          () => setState(() => _difficulty = 'easy'),
                        ),
                        _buildOptionButton(
                          'exam_clone.detail.medium'.tr(),
                          _difficulty == 'medium',
                          () => setState(() => _difficulty = 'medium'),
                        ),
                        _buildOptionButton(
                          'exam_clone.detail.hard'.tr(),
                          _difficulty == 'hard',
                          () => setState(() => _difficulty = 'hard'),
                        ),
                      ],
                    ),

                    // Topics (if available)
                    if (widget.availableTopics != null &&
                        widget.availableTopics!.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'exam_clone.detail.topics_optional'.tr(),
                        style: AppTextStyles.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: widget.availableTopics!.map((topic) {
                          final isSelected = _selectedTopics.contains(topic);
                          return InkWell(
                            onTap: () => _toggleTopic(topic),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.purple
                                    : AppColors.grey200,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                topic,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : AppColors.grey700,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],

                    // Error
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          border: Border.all(
                            color: AppColors.error.withOpacity(0.2),
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline,
                                color: AppColors.error, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppColors.grey300, width: 1),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isGenerating ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text('common.cancel'.tr()),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _isGenerating ? null : _handleGenerate,
                      icon: _isGenerating
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.auto_awesome, size: 14),
                      label: Text(
                        _isGenerating
                          ? 'exam_clone.detail.generating'.tr()
                          : 'exam_clone.detail.generate_count'.tr(namedArgs: {'count': '$_count'}),
                        style: const TextStyle(fontSize: 13),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
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

  Widget _buildOptionButton(String label, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected
                ? AppColors.secondary
                : AppColors.grey300,
            width: isSelected ? 2 : 1,
          ),
          color: isSelected
              ? AppColors.secondary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? AppColors.secondary : AppColors.grey700,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
