import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../bloc/flashcards_bloc.dart';
import '../bloc/flashcards_event.dart';
import '../bloc/flashcards_state.dart';

class AiAssistMenu {
  static void show({
    required BuildContext context,
    required String flashcardId,
    required String front,
    String? back,
    required Function(String) onResultAccepted,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AiAssistMenuContent(
        flashcardId: flashcardId,
        front: front,
        back: back,
        onResultAccepted: onResultAccepted,
      ),
    );
  }
}

class _AiAssistMenuContent extends StatefulWidget {
  final String flashcardId;
  final String front;
  final String? back;
  final Function(String) onResultAccepted;

  const _AiAssistMenuContent({
    required this.flashcardId,
    required this.front,
    this.back,
    required this.onResultAccepted,
  });

  @override
  State<_AiAssistMenuContent> createState() => _AiAssistMenuContentState();
}

class _AiAssistMenuContentState extends State<_AiAssistMenuContent> {
  String? _selectedAction;
  String? _aiResult;
  bool _isLoading = false;

  void _handleActionTap(String action) {
    setState(() {
      _selectedAction = action;
      _isLoading = true;
    });

    context.read<FlashcardsBloc>().add(
          AiAssistCard(
            flashcardId: widget.flashcardId,
            action: action,
            front: widget.front,
            back: widget.back,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return BlocListener<FlashcardsBloc, FlashcardsState>(
      listener: (context, state) {
        if (state is FlashcardAiAssisted) {
          setState(() {
            _aiResult = state.result;
            _isLoading = false;
          });
        } else if (state is FlashcardsError) {
          setState(() {
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppDimensions.radiusLarge),
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                margin: EdgeInsets.symmetric(vertical: AppDimensions.space12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey400,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: EdgeInsets.symmetric(horizontal: AppDimensions.space20),
                child: Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(AppDimensions.space8),
                      decoration: BoxDecoration(
                        gradient: AppColors.purpleGradient,
                        borderRadius: BorderRadius.circular(AppDimensions.radiusSmall),
                      ),
                      child: Icon(
                        Icons.auto_awesome,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    SizedBox(width: AppDimensions.space12),
                    Text(
                      'flashcards.widgets.ai_assist.title'.tr(),
                      style: AppTextStyles.titleLarge.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    Spacer(),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              SizedBox(height: AppDimensions.space16),

              // Content
              if (_aiResult == null) ...[
                // Action options
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppDimensions.space20),
                  child: Column(
                    children: [
                      _ActionTile(
                        icon: Icons.lightbulb_outline,
                        title: 'flashcards.widgets.ai_assist.suggest_answer_title'.tr(),
                        description: 'flashcards.widgets.ai_assist.suggest_answer_desc'.tr(),
                        color: AppColors.secondary,
                        isLoading: _isLoading && _selectedAction == 'suggest_answer',
                        onTap: () => _handleActionTap('suggest_answer'),
                      ),
                      SizedBox(height: AppDimensions.space12),
                      _ActionTile(
                        icon: Icons.description_outlined,
                        title: 'flashcards.widgets.ai_assist.elaborate_title'.tr(),
                        description: 'flashcards.widgets.ai_assist.elaborate_desc'.tr(),
                        color: AppColors.primary,
                        isLoading: _isLoading && _selectedAction == 'elaborate',
                        onTap: () => _handleActionTap('elaborate'),
                      ),
                      SizedBox(height: AppDimensions.space12),
                      _ActionTile(
                        icon: Icons.psychology_outlined,
                        title: 'flashcards.widgets.ai_assist.add_mnemonic_title'.tr(),
                        description: 'flashcards.widgets.ai_assist.add_mnemonic_desc'.tr(),
                        color: Colors.purple,
                        isLoading: _isLoading && _selectedAction == 'add_mnemonic',
                        onTap: () => _handleActionTap('add_mnemonic'),
                      ),
                      SizedBox(height: AppDimensions.space12),
                      _ActionTile(
                        icon: Icons.psychology,
                        title: 'flashcards.widgets.ai_assist.simplify_title'.tr(),
                        description: 'flashcards.widgets.ai_assist.simplify_desc'.tr(),
                        color: Colors.green,
                        isLoading: _isLoading && _selectedAction == 'simplify',
                        onTap: () => _handleActionTap('simplify'),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Result display
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppDimensions.space20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: EdgeInsets.all(AppDimensions.space16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                          border: Border.all(
                            color: AppColors.secondary.withOpacity(0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.auto_awesome,
                                  color: AppColors.secondary,
                                  size: 16,
                                ),
                                SizedBox(width: AppDimensions.space8),
                                Text(
                                  'flashcards.widgets.ai_assist.ai_suggestion'.tr(),
                                  style: AppTextStyles.labelMedium.copyWith(
                                    color: AppColors.secondary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: AppDimensions.space12),
                            Text(
                              _aiResult!,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: AppDimensions.space16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _aiResult = null;
                                  _selectedAction = null;
                                });
                              },
                              child: Text('flashcards.widgets.ai_assist.try_again'.tr()),
                              style: OutlinedButton.styleFrom(
                                padding: EdgeInsets.symmetric(vertical: AppDimensions.space16),
                              ),
                            ),
                          ),
                          SizedBox(width: AppDimensions.space12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                widget.onResultAccepted(_aiResult!);
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('flashcards.widgets.ai_assist.applied_success'.tr()),
                                    backgroundColor: AppColors.success,
                                  ),
                                );
                              },
                              child: Text('flashcards.widgets.ai_assist.accept'.tr()),
                              style: ElevatedButton.styleFrom(
                                padding: EdgeInsets.symmetric(vertical: AppDimensions.space16),
                                backgroundColor: AppColors.secondary,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              SizedBox(height: AppDimensions.space24),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;
  final bool isLoading;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.isLoading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        padding: EdgeInsets.all(AppDimensions.space16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          border: Border.all(
            color: theme.colorScheme.onSurface.withOpacity(0.1),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(AppDimensions.space8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppDimensions.radiusSmall),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            SizedBox(width: AppDimensions.space16),
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
            if (isLoading)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(color),
                ),
              )
            else
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: AppColors.grey500,
              ),
          ],
        ),
      ),
    );
  }
}
