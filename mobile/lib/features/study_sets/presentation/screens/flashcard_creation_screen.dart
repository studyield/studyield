import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../flashcards/domain/entities/flashcard_entity.dart';
import '../../../flashcards/presentation/widgets/manual_creation_tab.dart';
import '../../../flashcards/presentation/widgets/ai_generation_tab.dart';
import '../../../flashcards/presentation/widgets/import_tab.dart';
import '../../../flashcards/presentation/bloc/flashcards_bloc.dart';
import '../../../flashcards/presentation/bloc/flashcards_event.dart';

class FlashcardCreationScreen extends StatefulWidget {
  final String studySetId;

  const FlashcardCreationScreen({
    super.key,
    required this.studySetId,
  });

  @override
  State<FlashcardCreationScreen> createState() => _FlashcardCreationScreenState();
}

class _FlashcardCreationScreenState extends State<FlashcardCreationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<FlashcardEntity> _flashcardsToAdd = [];
  List<FlashcardData> _manualCards = [];

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

  void _handleFlashcardsImported(List<FlashcardEntity> flashcards) {
    setState(() {
      _flashcardsToAdd = flashcards;
    });
  }

  void _handleManualCardsChanged(List<FlashcardData> cards) {
    setState(() {
      _manualCards = cards;
    });
  }

  void _addFlashcards() {
    if (_tabController.index == 0) {
      // Manual creation
      if (_manualCards.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('study_sets.flashcard_creation.create_at_least_one'.tr()),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      context.read<FlashcardsBloc>().add(
            BulkCreateFlashcards(
              studySetId: widget.studySetId,
              flashcards: _manualCards,
            ),
          );
    } else {
      // AI or Import
      if (_flashcardsToAdd.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('study_sets.flashcard_creation.no_flashcards_to_add'.tr()),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      // For now, we'll convert and bulk create
      final flashcardsData = _flashcardsToAdd
          .map((f) => FlashcardData(
                front: f.front,
                back: f.back,
                notes: f.notes,
                tags: f.tags,
                type: 'standard',
              ))
          .toList();

      context.read<FlashcardsBloc>().add(
            BulkCreateFlashcards(
              studySetId: widget.studySetId,
              flashcards: flashcardsData,
            ),
          );
    }

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'study_sets.flashcard_creation.create_flashcards'.tr(),
          style: AppTextStyles.titleLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.secondary,
          unselectedLabelColor: AppColors.grey600,
          indicatorColor: AppColors.secondary,
          indicatorWeight: 3,
          tabs: [
            Tab(
              icon: Icon(Icons.edit),
              text: 'study_sets.flashcard_creation.manual'.tr(),
            ),
            Tab(
              icon: Icon(Icons.auto_awesome),
              text: 'study_sets.flashcard_creation.ai_generate'.tr(),
            ),
            Tab(
              icon: Icon(Icons.file_upload),
              text: 'study_sets.flashcard_creation.import'.tr(),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Manual Creation
                ManualCreationTab(
                  onFlashcardsChanged: _handleManualCardsChanged,
                ),

                // AI Generation
                AiGenerationTab(
                  onFlashcardsGenerated: _handleFlashcardsImported,
                ),

                // Import
                ImportTab(
                  studySetId: widget.studySetId,
                  onFlashcardsImported: _handleFlashcardsImported,
                ),
              ],
            ),
          ),

          // Bottom action bar
          Container(
            padding: EdgeInsets.all(AppDimensions.space16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: PrimaryButton(
                text: _tabController.index == 0
                    ? 'study_sets.flashcard_creation.create_cards'.tr(namedArgs: {'count': _manualCards.length.toString()})
                    : 'study_sets.flashcard_creation.add_cards'.tr(namedArgs: {'count': _flashcardsToAdd.length.toString()}),
                onPressed: (_tabController.index == 0 && _manualCards.isEmpty) ||
                        (_tabController.index != 0 && _flashcardsToAdd.isEmpty)
                    ? null
                    : _addFlashcards,
                width: double.infinity,
                gradient: AppColors.greenGradient,
                icon: Icons.add,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
