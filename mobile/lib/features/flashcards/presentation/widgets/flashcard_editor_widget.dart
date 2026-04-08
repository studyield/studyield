import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../bloc/flashcards_event.dart';
import 'manual_creation_tab.dart';
import 'ai_generation_tab.dart';
import 'import_tab.dart';

class FlashcardEditorWidget extends StatefulWidget {
  final String? studySetId;
  final Function(List<FlashcardData>)? onFlashcardsAdded;

  const FlashcardEditorWidget({
    super.key,
    this.studySetId,
    this.onFlashcardsAdded,
  });

  @override
  State<FlashcardEditorWidget> createState() => _FlashcardEditorWidgetState();
}

class _FlashcardEditorWidgetState extends State<FlashcardEditorWidget>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<FlashcardData> _manualCards = [];
  List<FlashcardEntity> _generatedCards = [];
  List<FlashcardEntity> _importedCards = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  int get totalCardsCount =>
      _manualCards.length + _generatedCards.length + _importedCards.length;

  List<FlashcardData> get allCards {
    final List<FlashcardData> all = [];

    // Add manual cards
    all.addAll(_manualCards);

    // Convert generated cards to FlashcardData
    all.addAll(_generatedCards.map((card) => FlashcardData(
          front: card.front,
          back: card.back,
          notes: card.notes,
          tags: card.tags,
          type: card.type,
        )));

    // Convert imported cards to FlashcardData
    all.addAll(_importedCards.map((card) => FlashcardData(
          front: card.front,
          back: card.back,
          notes: card.notes,
          tags: card.tags,
          type: card.type,
        )));

    return all;
  }

  void _handleManualCardsChanged(List<FlashcardData> cards) {
    setState(() {
      _manualCards = cards;
    });
    _notifyParent();
  }

  void _handleGeneratedCards(List<FlashcardEntity> cards) {
    setState(() {
      _generatedCards = cards;
    });
    _notifyParent();
  }

  void _handleImportedCards(List<FlashcardEntity> cards) {
    setState(() {
      _importedCards = cards;
    });
    _notifyParent();
  }

  void _notifyParent() {
    if (widget.onFlashcardsAdded != null) {
      widget.onFlashcardsAdded!(allCards);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Cleaner tab bar
        Container(
          margin: EdgeInsets.symmetric(
            horizontal: AppDimensions.space20,
            vertical: AppDimensions.space12,
          ),
          padding: EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: isDark ? AppColors.grey900 : AppColors.grey100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(
              color: theme.scaffoldBackgroundColor,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            labelColor: theme.colorScheme.onSurface,
            unselectedLabelColor: AppColors.grey600,
            dividerColor: Colors.transparent,
            indicatorSize: TabBarIndicatorSize.tab,
            labelStyle: AppTextStyles.labelLarge.copyWith(
              fontWeight: FontWeight.w600,
            ),
            unselectedLabelStyle: AppTextStyles.labelLarge.copyWith(
              fontWeight: FontWeight.normal,
            ),
            tabs: [
              _buildTab(
                icon: Icons.edit,
                label: 'flashcards.widgets.editor.tab_manual'.tr(),
                count: _manualCards.length,
                isSelected: _tabController.index == 0,
              ),
              _buildTab(
                icon: Icons.auto_awesome,
                label: 'flashcards.widgets.editor.tab_ai'.tr(),
                count: _generatedCards.length,
                isSelected: _tabController.index == 1,
              ),
              _buildTab(
                icon: Icons.file_upload,
                label: 'flashcards.widgets.editor.tab_import'.tr(),
                count: _importedCards.length,
                isSelected: _tabController.index == 2,
              ),
            ],
          ),
        ),

        // Tab views
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              // Manual creation
              ManualCreationTab(
                onFlashcardsChanged: _handleManualCardsChanged,
              ),

              // AI generation
              AiGenerationTab(
                onFlashcardsGenerated: _handleGeneratedCards,
              ),

              // Import
              ImportTab(
                studySetId: widget.studySetId ?? '',
                onFlashcardsImported: _handleImportedCards,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTab({
    required IconData icon,
    required String label,
    required int count,
    required bool isSelected,
  }) {
    return Container(
      height: 44,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          SizedBox(width: 6),
          Text(label),
          if (count > 0) ...[
            SizedBox(width: 6),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.secondary
                    : AppColors.grey400,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: AppTextStyles.bodySmall.copyWith(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
