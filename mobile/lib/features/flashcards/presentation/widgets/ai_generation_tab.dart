import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../bloc/flashcards_bloc.dart';
import '../bloc/flashcards_event.dart';
import '../bloc/flashcards_state.dart';

class AiGenerationTab extends StatefulWidget {
  final Function(List<FlashcardEntity>) onFlashcardsGenerated;

  const AiGenerationTab({
    super.key,
    required this.onFlashcardsGenerated,
  });

  @override
  State<AiGenerationTab> createState() => _AiGenerationTabState();
}

class _AiGenerationTabState extends State<AiGenerationTab> {
  final TextEditingController _contentController = TextEditingController();
  int _selectedCount = 10;
  String _selectedCardType = 'qa';
  String _selectedDifficulty = 'medium';
  List<FlashcardEntity> _generatedCards = [];
  Set<int> _selectedIndices = {};

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  void _generateFlashcards() {
    final content = _contentController.text.trim();
    if (content.length < 50) {
      final translated = 'flashcards.widgets.ai_generation.min_characters_error'.tr();
      final message = translated.contains('min_characters_error')
          ? 'Please enter at least 50 characters (${content.length}/50)'
          : translated;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    context.read<FlashcardsBloc>().add(
          GenerateFlashcards(
            content: content,
            count: _selectedCount,
            cardType: _selectedCardType,
            difficulty: _selectedDifficulty,
          ),
        );
  }

  void _addSelectedToStudySet() {
    final selectedCards = _selectedIndices.map((i) => _generatedCards[i]).toList();
    widget.onFlashcardsGenerated(selectedCards);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${selectedCards.length} cards ready to add'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _selectAll() {
    setState(() {
      _selectedIndices = Set.from(List.generate(_generatedCards.length, (i) => i));
    });
  }

  void _deselectAll() {
    setState(() {
      _selectedIndices.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return BlocListener<FlashcardsBloc, FlashcardsState>(
      listener: (context, state) {
        if (state is FlashcardsGenerated) {
          setState(() {
            _generatedCards = state.flashcards;
            _selectedIndices = Set.from(List.generate(state.flashcards.length, (i) => i));
          });
        } else if (state is FlashcardsError) {
          // Only show error if we were generating (not from other operations)
          if (_generatedCards.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to generate: ${state.message}'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        }
      },
      child: BlocBuilder<FlashcardsBloc, FlashcardsState>(
        builder: (context, state) {
          final isGenerating = state is FlashcardsGenerating;

          return SingleChildScrollView(
            padding: EdgeInsets.all(AppDimensions.space16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info banner
                Container(
                  padding: EdgeInsets.all(AppDimensions.space16),
                  decoration: BoxDecoration(
                    gradient: AppColors.purpleGradient,
                    borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.auto_awesome, color: Colors.white),
                      SizedBox(width: AppDimensions.space12),
                      Expanded(
                        child: Text(
                          'flashcards.widgets.ai_generation.banner_text'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: AppDimensions.space24),

                // Content input
                Text(
                  'flashcards.widgets.ai_generation.content_label'.tr(),
                  style: AppTextStyles.labelLarge.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: AppDimensions.space8),
                TextFormField(
                  controller: _contentController,
                  decoration: InputDecoration(
                    hintText: 'flashcards.widgets.ai_generation.content_hint'.tr(),
                    helperText: 'flashcards.widgets.ai_generation.char_count'.tr(namedArgs: {'count': _contentController.text.length.toString()}),
                    prefixIcon: Icon(Icons.description),
                  ),
                  maxLines: 8,
                  enabled: !isGenerating,
                  onChanged: (_) => setState(() {}),
                ),

                SizedBox(height: AppDimensions.space24),

                // Card count
                Text(
                  'flashcards.widgets.ai_generation.number_of_cards'.tr(),
                  style: AppTextStyles.labelLarge.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: AppDimensions.space8),
                Wrap(
                  spacing: AppDimensions.space8,
                  children: [5, 10, 20, 30, 50].map((count) {
                    return ChoiceChip(
                      label: Text('$count'),
                      selected: _selectedCount == count,
                      onSelected: isGenerating
                          ? null
                          : (selected) {
                              if (selected) {
                                setState(() => _selectedCount = count);
                              }
                            },
                    );
                  }).toList(),
                ),

                SizedBox(height: AppDimensions.space24),

                // Card type
                Text(
                  'flashcards.widgets.ai_generation.card_type'.tr(),
                  style: AppTextStyles.labelLarge.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: AppDimensions.space8),
                Wrap(
                  spacing: AppDimensions.space8,
                  children: [
                    _CardTypeChip(
                      label: 'flashcards.widgets.ai_generation.type_qa'.tr(),
                      value: 'qa',
                      selected: _selectedCardType == 'qa',
                      enabled: !isGenerating,
                      onSelected: (value) => setState(() => _selectedCardType = value),
                    ),
                    _CardTypeChip(
                      label: 'flashcards.widgets.ai_generation.type_fill_blank'.tr(),
                      value: 'fill_blank',
                      selected: _selectedCardType == 'fill_blank',
                      enabled: !isGenerating,
                      onSelected: (value) => setState(() => _selectedCardType = value),
                    ),
                    _CardTypeChip(
                      label: 'flashcards.widgets.ai_generation.type_true_false'.tr(),
                      value: 'true_false',
                      selected: _selectedCardType == 'true_false',
                      enabled: !isGenerating,
                      onSelected: (value) => setState(() => _selectedCardType = value),
                    ),
                  ],
                ),

                SizedBox(height: AppDimensions.space24),

                // Difficulty
                Text(
                  'flashcards.widgets.ai_generation.difficulty'.tr(),
                  style: AppTextStyles.labelLarge.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: AppDimensions.space8),
                Wrap(
                  spacing: AppDimensions.space8,
                  children: [
                    _DifficultyChip(
                      label: 'flashcards.widgets.ai_generation.difficulty_easy'.tr(),
                      value: 'easy',
                      color: AppColors.success,
                      selected: _selectedDifficulty == 'easy',
                      enabled: !isGenerating,
                      onSelected: (value) => setState(() => _selectedDifficulty = value),
                    ),
                    _DifficultyChip(
                      label: 'flashcards.widgets.ai_generation.difficulty_medium'.tr(),
                      value: 'medium',
                      color: AppColors.warning,
                      selected: _selectedDifficulty == 'medium',
                      enabled: !isGenerating,
                      onSelected: (value) => setState(() => _selectedDifficulty = value),
                    ),
                    _DifficultyChip(
                      label: 'flashcards.widgets.ai_generation.difficulty_hard'.tr(),
                      value: 'hard',
                      color: AppColors.error,
                      selected: _selectedDifficulty == 'hard',
                      enabled: !isGenerating,
                      onSelected: (value) => setState(() => _selectedDifficulty = value),
                    ),
                  ],
                ),

                SizedBox(height: AppDimensions.space32),

                // Generate button
                PrimaryButton(
                  text: isGenerating ? 'flashcards.widgets.ai_generation.generating'.tr() : 'flashcards.widgets.ai_generation.generate_button'.tr(),
                  onPressed: isGenerating ? null : _generateFlashcards,
                  width: double.infinity,
                  gradient: AppColors.purpleGradient,
                  isLoading: isGenerating,
                  icon: Icons.auto_awesome,
                ),

                // Generated cards list
                if (_generatedCards.isNotEmpty) ...[
                  SizedBox(height: AppDimensions.space32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'flashcards.widgets.ai_generation.generated_cards'.tr(namedArgs: {'count': _generatedCards.length.toString()}),
                        style: AppTextStyles.titleMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      Row(
                        children: [
                          TextButton(
                            onPressed: _selectedIndices.length == _generatedCards.length
                                ? _deselectAll
                                : _selectAll,
                            child: Text(
                              _selectedIndices.length == _generatedCards.length
                                  ? 'flashcards.widgets.ai_generation.deselect_all'.tr()
                                  : 'flashcards.widgets.ai_generation.select_all'.tr(),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  SizedBox(height: AppDimensions.space16),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: _generatedCards.length,
                    itemBuilder: (context, index) {
                      final card = _generatedCards[index];
                      final isSelected = _selectedIndices.contains(index);

                      return _GeneratedCardItem(
                        card: card,
                        index: index,
                        isSelected: isSelected,
                        onToggle: () {
                          setState(() {
                            if (isSelected) {
                              _selectedIndices.remove(index);
                            } else {
                              _selectedIndices.add(index);
                            }
                          });
                        },
                      );
                    },
                  ),
                  SizedBox(height: AppDimensions.space24),
                  PrimaryButton(
                    text: 'flashcards.widgets.ai_generation.add_selected'.tr(namedArgs: {'count': _selectedIndices.length.toString()}),
                    onPressed: _selectedIndices.isEmpty ? null : _addSelectedToStudySet,
                    width: double.infinity,
                    gradient: AppColors.greenGradient,
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _CardTypeChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final bool enabled;
  final Function(String) onSelected;

  const _CardTypeChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.enabled,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: enabled
          ? (sel) {
              if (sel) onSelected(value);
            }
          : null,
    );
  }
}

class _DifficultyChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool selected;
  final bool enabled;
  final Function(String) onSelected;

  const _DifficultyChip({
    required this.label,
    required this.value,
    required this.color,
    required this.selected,
    required this.enabled,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      selectedColor: color.withOpacity(0.2),
      onSelected: enabled
          ? (sel) {
              if (sel) onSelected(value);
            }
          : null,
    );
  }
}

class _GeneratedCardItem extends StatefulWidget {
  final FlashcardEntity card;
  final int index;
  final bool isSelected;
  final VoidCallback onToggle;

  const _GeneratedCardItem({
    required this.card,
    required this.index,
    required this.isSelected,
    required this.onToggle,
  });

  @override
  State<_GeneratedCardItem> createState() => _GeneratedCardItemState();
}

class _GeneratedCardItemState extends State<_GeneratedCardItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: EdgeInsets.only(bottom: AppDimensions.space12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: widget.isSelected
              ? AppColors.secondary
              : theme.colorScheme.onSurface.withOpacity(0.1),
          width: widget.isSelected ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            child: Padding(
              padding: EdgeInsets.all(AppDimensions.space16),
              child: Row(
                children: [
                  Checkbox(
                    value: widget.isSelected,
                    onChanged: (_) => widget.onToggle(),
                    activeColor: AppColors.secondary,
                  ),
                  SizedBox(width: AppDimensions.space12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'flashcards.widgets.ai_generation.card_number'.tr(namedArgs: {'number': (widget.index + 1).toString()}),
                          style: AppTextStyles.labelSmall.copyWith(
                            color: AppColors.grey600,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          widget.card.front,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.onSurface,
                          ),
                          maxLines: _isExpanded ? null : 2,
                          overflow: _isExpanded ? null : TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      _isExpanded ? Icons.expand_less : Icons.expand_more,
                      color: AppColors.grey600,
                    ),
                    onPressed: () {
                      setState(() {
                        _isExpanded = !_isExpanded;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),
          if (_isExpanded) ...[
            Divider(height: 1),
            Padding(
              padding: EdgeInsets.all(AppDimensions.space16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'flashcards.widgets.ai_generation.answer_label'.tr(),
                    style: AppTextStyles.labelMedium.copyWith(
                      color: AppColors.grey600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space8),
                  Text(
                    widget.card.back,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
