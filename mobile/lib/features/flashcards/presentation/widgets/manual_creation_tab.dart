import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../bloc/flashcards_event.dart';

class ManualCreationTab extends StatefulWidget {
  final Function(List<FlashcardData>) onFlashcardsChanged;

  const ManualCreationTab({
    super.key,
    required this.onFlashcardsChanged,
  });

  @override
  State<ManualCreationTab> createState() => _ManualCreationTabState();
}

class _ManualCreationTabState extends State<ManualCreationTab> {
  final List<_FlashcardFormData> _flashcards = [];

  @override
  void initState() {
    super.initState();
    // Start with empty list - user can add cards manually
  }

  void _addNewCard() {
    setState(() {
      final newCard = _FlashcardFormData();
      newCard.isExpanded = true; // Auto-expand new cards
      _flashcards.add(newCard);
    });
    _notifyChanges();
  }

  void _removeCard(int index) {
    setState(() {
      _flashcards[index].dispose();
      _flashcards.removeAt(index);
    });
    _notifyChanges();
  }

  void _notifyChanges() {
    final validCards = _flashcards
        .where((f) => f.frontController.text.isNotEmpty && f.backController.text.isNotEmpty)
        .map((f) => FlashcardData(
              front: f.frontController.text,
              back: f.backController.text,
              notes: f.notesController.text.isEmpty ? null : f.notesController.text,
              tags: f.tagsController.text.isEmpty
                  ? null
                  : f.tagsController.text
                      .split(',')
                      .map((e) => e.trim())
                      .where((e) => e.isNotEmpty)
                      .toList(),
              type: f.selectedType,
            ))
        .toList();

    widget.onFlashcardsChanged(validCards);
  }

  @override
  void dispose() {
    for (var card in _flashcards) {
      card.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      children: [
        // Header with card count
        Container(
          padding: EdgeInsets.all(AppDimensions.space16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.auto_awesome, color: AppColors.secondary, size: 20),
                  SizedBox(width: AppDimensions.space8),
                  Text(
                    'flashcards.widgets.manual_creation.card_count'.plural(_flashcards.length),
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
              TextButton.icon(
                onPressed: _addNewCard,
                icon: Icon(Icons.add, size: 18),
                label: Text('flashcards.widgets.manual_creation.add_card'.tr()),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.secondary,
                ),
              ),
            ],
          ),
        ),

        SizedBox(height: AppDimensions.space16),

        // Flashcards list
        Expanded(
          child: _flashcards.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.style_outlined,
                        size: 64,
                        color: AppColors.grey400,
                      ),
                      SizedBox(height: AppDimensions.space16),
                      Text(
                        'flashcards.widgets.manual_creation.no_cards'.tr(),
                        style: AppTextStyles.titleMedium.copyWith(
                          color: AppColors.grey600,
                        ),
                      ),
                      SizedBox(height: AppDimensions.space8),
                      TextButton.icon(
                        onPressed: _addNewCard,
                        icon: Icon(Icons.add),
                        label: Text('flashcards.widgets.manual_creation.create_first'.tr()),
                      ),
                    ],
                  ),
                )
              : ReorderableListView.builder(
                  itemCount: _flashcards.length,
                  onReorder: (oldIndex, newIndex) {
                    setState(() {
                      if (newIndex > oldIndex) {
                        newIndex -= 1;
                      }
                      final item = _flashcards.removeAt(oldIndex);
                      _flashcards.insert(newIndex, item);
                    });
                    _notifyChanges();
                  },
                  itemBuilder: (context, index) {
                    final card = _flashcards[index];
                    return _FlashcardFormCard(
                      key: ValueKey(card.id),
                      card: card,
                      index: index,
                      onDelete: () => _removeCard(index),
                      onChanged: _notifyChanges,
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _FlashcardFormData {
  final String id = DateTime.now().millisecondsSinceEpoch.toString();
  final TextEditingController frontController = TextEditingController();
  final TextEditingController backController = TextEditingController();
  final TextEditingController notesController = TextEditingController();
  final TextEditingController tagsController = TextEditingController();
  String selectedType = 'standard';
  bool isExpanded = false;

  void dispose() {
    frontController.dispose();
    backController.dispose();
    notesController.dispose();
    tagsController.dispose();
  }
}

class _FlashcardFormCard extends StatefulWidget {
  final _FlashcardFormData card;
  final int index;
  final VoidCallback onDelete;
  final VoidCallback onChanged;

  const _FlashcardFormCard({
    super.key,
    required this.card,
    required this.index,
    required this.onDelete,
    required this.onChanged,
  });

  @override
  State<_FlashcardFormCard> createState() => _FlashcardFormCardState();
}

class _FlashcardFormCardState extends State<_FlashcardFormCard> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final hasContent = widget.card.frontController.text.isNotEmpty;

    return Container(
      margin: EdgeInsets.only(bottom: AppDimensions.space16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasContent
              ? AppColors.secondary.withOpacity(0.3)
              : theme.colorScheme.onSurface.withOpacity(0.1),
          width: hasContent ? 2 : 1,
        ),
        boxShadow: hasContent
            ? [
                BoxShadow(
                  color: AppColors.secondary.withOpacity(0.1),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: AppDimensions.space16,
              vertical: AppDimensions.space12,
            ),
            decoration: BoxDecoration(
              color: isDark ? AppColors.grey900 : AppColors.grey50,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(15),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.style,
                    color: AppColors.secondary,
                    size: 16,
                  ),
                ),
                SizedBox(width: AppDimensions.space12),
                Expanded(
                  child: Text(
                    'flashcards.widgets.manual_creation.card_number'.tr(namedArgs: {'number': (widget.index + 1).toString()}),
                    style: AppTextStyles.titleSmall.copyWith(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ),
                if (hasContent)
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppColors.greenGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'flashcards.widgets.manual_creation.ready'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                SizedBox(width: AppDimensions.space8),
                IconButton(
                  icon: Icon(Icons.delete_outline, color: AppColors.error),
                  onPressed: widget.onDelete,
                  tooltip: 'flashcards.widgets.manual_creation.delete_tooltip'.tr(),
                ),
              ],
            ),
          ),

          // Form fields (always visible)
          Padding(
            padding: EdgeInsets.all(AppDimensions.space16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  // Card Type Selector
                  Text(
                    'flashcards.widgets.manual_creation.card_type'.tr(),
                    style: AppTextStyles.labelMedium.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space8),
                  Wrap(
                    spacing: AppDimensions.space8,
                    children: [
                      ChoiceChip(
                        label: Text('flashcards.widgets.manual_creation.type_qa'.tr()),
                        selected: widget.card.selectedType == 'standard',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              widget.card.selectedType = 'standard';
                            });
                            widget.onChanged();
                          }
                        },
                      ),
                      ChoiceChip(
                        label: Text('flashcards.widgets.manual_creation.type_cloze'.tr()),
                        selected: widget.card.selectedType == 'cloze',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              widget.card.selectedType = 'cloze';
                            });
                            widget.onChanged();
                          }
                        },
                      ),
                      ChoiceChip(
                        label: Text('flashcards.widgets.manual_creation.type_image_occlusion'.tr()),
                        selected: widget.card.selectedType == 'image_occlusion',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              widget.card.selectedType = 'image_occlusion';
                            });
                            widget.onChanged();
                          }
                        },
                      ),
                    ],
                  ),

                  SizedBox(height: AppDimensions.space16),

                  // Front
                  TextFormField(
                    controller: widget.card.frontController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.manual_creation.front_label'.tr(),
                      hintText: 'flashcards.widgets.manual_creation.front_hint'.tr(),
                      prefixIcon: Icon(Icons.question_answer),
                    ),
                    maxLines: 3,
                    onChanged: (_) => widget.onChanged(),
                  ),

                  SizedBox(height: AppDimensions.space16),

                  // Back
                  TextFormField(
                    controller: widget.card.backController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.manual_creation.back_label'.tr(),
                      hintText: 'flashcards.widgets.manual_creation.back_hint'.tr(),
                      prefixIcon: Icon(Icons.lightbulb_outline),
                    ),
                    maxLines: 3,
                    onChanged: (_) => widget.onChanged(),
                  ),

                  SizedBox(height: AppDimensions.space16),

                  // Notes
                  TextFormField(
                    controller: widget.card.notesController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.manual_creation.notes_label'.tr(),
                      hintText: 'flashcards.widgets.manual_creation.notes_hint'.tr(),
                      prefixIcon: Icon(Icons.note_outlined),
                    ),
                    maxLines: 2,
                    onChanged: (_) => widget.onChanged(),
                  ),

                  SizedBox(height: AppDimensions.space16),

                  // Tags
                  TextFormField(
                    controller: widget.card.tagsController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.manual_creation.tags_label'.tr(),
                      hintText: 'flashcards.widgets.manual_creation.tags_hint'.tr(),
                      prefixIcon: Icon(Icons.label_outline),
                      helperText: 'flashcards.widgets.manual_creation.tags_helper'.tr(),
                    ),
                    onChanged: (_) => widget.onChanged(),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
