import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../widgets/flashcard_list_item.dart';
import '../widgets/flashcard_editor_widget.dart';

class FlashcardsListScreen extends StatefulWidget {
  final String studySetId;
  final String studySetTitle;

  const FlashcardsListScreen({
    super.key,
    required this.studySetId,
    required this.studySetTitle,
  });

  @override
  State<FlashcardsListScreen> createState() => _FlashcardsListScreenState();
}

class _FlashcardsListScreenState extends State<FlashcardsListScreen> {
  String _selectedFilter = 'all';
  String _selectedSort = 'newest';

  @override
  void initState() {
    super.initState();
    context.read<FlashcardsBloc>().add(
          LoadFlashcards(studySetId: widget.studySetId),
        );
  }

  List<FlashcardEntity> _getFilteredFlashcards(List<FlashcardEntity> flashcards) {
    List<FlashcardEntity> filtered;

    switch (_selectedFilter) {
      case 'new':
        filtered = flashcards.where((f) => f.repetitions == 0).toList();
        break;
      case 'learning':
        filtered = flashcards.where((f) => f.interval > 0 && f.interval < 7).toList();
        break;
      case 'review':
        filtered = flashcards.where((f) => f.interval >= 7 && f.interval < 30).toList();
        break;
      case 'mastered':
        filtered = flashcards.where((f) => f.interval >= 30).toList();
        break;
      case 'due':
        filtered = flashcards.where((f) => f.isDue).toList();
        break;
      default:
        filtered = flashcards;
    }

    // Apply sorting
    switch (_selectedSort) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        break;
      case 'difficulty':
        filtered.sort((a, b) => b.difficulty.compareTo(a.difficulty));
        break;
    }

    return filtered;
  }

  int _getFilterCount(List<FlashcardEntity> flashcards, String filter) {
    switch (filter) {
      case 'all':
        return flashcards.length;
      case 'new':
        return flashcards.where((f) => f.repetitions == 0).length;
      case 'learning':
        return flashcards.where((f) => f.interval > 0 && f.interval < 7).length;
      case 'review':
        return flashcards.where((f) => f.interval >= 7 && f.interval < 30).length;
      case 'mastered':
        return flashcards.where((f) => f.interval >= 30).length;
      case 'due':
        return flashcards.where((f) => f.isDue).length;
      default:
        return 0;
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
          icon: Icon(
            Icons.arrow_back,
            color: theme.colorScheme.onSurface,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.studySetTitle,
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            Text(
              'flashcards.list.label_flashcards'.tr(),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.sort, size: 20),
                SizedBox(width: 4),
                Text(
                  _selectedSort == 'newest'
                      ? 'flashcards.list.sort_newest'.tr()
                      : _selectedSort == 'oldest'
                          ? 'flashcards.list.sort_oldest'.tr()
                          : 'flashcards.list.sort_difficulty'.tr(),
                  style: AppTextStyles.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Icon(Icons.arrow_drop_down, size: 20),
              ],
            ),
            onSelected: (value) {
              setState(() {
                _selectedSort = value;
              });
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'newest',
                child: Text('flashcards.list.menu_newest'.tr()),
              ),
              PopupMenuItem(
                value: 'oldest',
                child: Text('flashcards.list.menu_oldest'.tr()),
              ),
              PopupMenuItem(
                value: 'difficulty',
                child: Text('flashcards.list.menu_difficulty'.tr()),
              ),
            ],
          ),
        ],
      ),
      body: BlocConsumer<FlashcardsBloc, FlashcardsState>(
        listener: (context, state) {
          if (state is FlashcardCreated) {
            context.read<FlashcardsBloc>().add(
                  RefreshFlashcards(studySetId: widget.studySetId),
                );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('flashcards.list.toast_created'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is FlashcardUpdated) {
            context.read<FlashcardsBloc>().add(
                  RefreshFlashcards(studySetId: widget.studySetId),
                );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('flashcards.list.toast_updated'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is FlashcardsBulkCreated) {
            context.read<FlashcardsBloc>().add(
                  RefreshFlashcards(studySetId: widget.studySetId),
                );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('flashcards.list.toast_bulk_created'.tr(namedArgs: {'count': '${state.flashcards.length}'})),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is FlashcardDeleted) {
            context.read<FlashcardsBloc>().add(
                  RefreshFlashcards(studySetId: widget.studySetId),
                );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('flashcards.list.toast_deleted'.tr()),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is FlashcardsLoading || state is FlashcardCreating) {
            return Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(
                  theme.colorScheme.primary,
                ),
              ),
            );
          }

          if (state is FlashcardsError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppColors.error,
                  ),
                  SizedBox(height: AppDimensions.space16),
                  Text(
                    'flashcards.list.error_title'.tr(),
                    style: AppTextStyles.titleMedium,
                  ),
                  SizedBox(height: AppDimensions.space8),
                  Text(
                    state.message,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space24),
                  PrimaryButton(
                    text: 'flashcards.list.button_retry'.tr(),
                    onPressed: () {
                      context.read<FlashcardsBloc>().add(
                            LoadFlashcards(studySetId: widget.studySetId),
                          );
                    },
                  ),
                ],
              ),
            );
          }

          if (state is FlashcardsLoaded) {
            if (state.flashcards.isEmpty) {
              return _buildEmptyState();
            }

            final filteredFlashcards = _getFilteredFlashcards(state.flashcards);

            return Column(
              children: [
                // Filter tabs
                Container(
                  color: theme.scaffoldBackgroundColor,
                  padding: EdgeInsets.symmetric(
                    horizontal: AppDimensions.space16,
                    vertical: AppDimensions.space12,
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _FilterChip(
                          label: 'flashcards.list.filter_all'.tr(),
                          count: _getFilterCount(state.flashcards, 'all'),
                          isSelected: _selectedFilter == 'all',
                          onTap: () => setState(() => _selectedFilter = 'all'),
                        ),
                        SizedBox(width: AppDimensions.space8),
                        _FilterChip(
                          label: 'flashcards.list.filter_new'.tr(),
                          count: _getFilterCount(state.flashcards, 'new'),
                          isSelected: _selectedFilter == 'new',
                          onTap: () => setState(() => _selectedFilter = 'new'),
                        ),
                        SizedBox(width: AppDimensions.space8),
                        _FilterChip(
                          label: 'flashcards.list.filter_learning'.tr(),
                          count: _getFilterCount(state.flashcards, 'learning'),
                          isSelected: _selectedFilter == 'learning',
                          onTap: () => setState(() => _selectedFilter = 'learning'),
                        ),
                        SizedBox(width: AppDimensions.space8),
                        _FilterChip(
                          label: 'flashcards.list.filter_review'.tr(),
                          count: _getFilterCount(state.flashcards, 'review'),
                          isSelected: _selectedFilter == 'review',
                          onTap: () => setState(() => _selectedFilter = 'review'),
                        ),
                        SizedBox(width: AppDimensions.space8),
                        _FilterChip(
                          label: 'flashcards.list.filter_mastered'.tr(),
                          count: _getFilterCount(state.flashcards, 'mastered'),
                          isSelected: _selectedFilter == 'mastered',
                          onTap: () => setState(() => _selectedFilter = 'mastered'),
                        ),
                        SizedBox(width: AppDimensions.space8),
                        _FilterChip(
                          label: 'flashcards.list.filter_due'.tr(),
                          count: _getFilterCount(state.flashcards, 'due'),
                          isSelected: _selectedFilter == 'due',
                          onTap: () => setState(() => _selectedFilter = 'due'),
                        ),
                      ],
                    ),
                  ),
                ),

                // Flashcards list
                Expanded(
                  child: filteredFlashcards.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.filter_alt_off,
                                size: 64,
                                color: AppColors.grey400,
                              ),
                              SizedBox(height: AppDimensions.space16),
                              Text(
                                'flashcards.list.empty_filter_message'.tr(),
                                style: AppTextStyles.titleMedium.copyWith(
                                  color: AppColors.grey600,
                                ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () async {
                            context.read<FlashcardsBloc>().add(
                                  RefreshFlashcards(studySetId: widget.studySetId),
                                );
                          },
                          child: ListView.separated(
                            padding: EdgeInsets.all(AppDimensions.space16),
                            itemCount: filteredFlashcards.length,
                            separatorBuilder: (_, __) => SizedBox(
                              height: AppDimensions.space12,
                            ),
                            itemBuilder: (context, index) {
                              final flashcard = filteredFlashcards[index];
                              return FlashcardListItem(
                                flashcard: flashcard,
                                onTap: () {
                                  // TODO: Navigate to flashcard detail/flip view
                                },
                                onDelete: () {
                                  context.read<FlashcardsBloc>().add(
                                        DeleteFlashcard(id: flashcard.id),
                                      );
                                },
                              );
                            },
                          ),
                        ),
                ),
              ],
            );
          }

          return SizedBox();
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddCardsSheet(context),
        backgroundColor: AppColors.secondary,
        icon: Icon(Icons.add, color: Colors.white),
        label: Text(
          'flashcards.list.button_add_cards'.tr(),
          style: AppTextStyles.button.copyWith(color: Colors.white),
        ),
      ),
    );
  }

  void _showAddCardsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      builder: (BuildContext sheetContext) {
        List<FlashcardData> cardsToAdd = [];

        return BlocProvider.value(
          value: context.read<FlashcardsBloc>(),
          child: BlocListener<FlashcardsBloc, FlashcardsState>(
            listener: (context, state) {
              if (state is FlashcardsBulkCreated) {
                Navigator.pop(sheetContext);
                // Refresh handled by existing listener
              } else if (state is FlashcardsError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${state.message}'),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            },
            child: StatefulBuilder(
              builder: (context, setState) {
                final theme = Theme.of(context);
                final isDark = theme.brightness == Brightness.dark;

                return Container(
                  height: MediaQuery.of(context).size.height * 0.95,
                  decoration: BoxDecoration(
                    color: theme.scaffoldBackgroundColor,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        offset: Offset(0, -5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Handle bar
                      Container(
                        margin: EdgeInsets.only(top: 12, bottom: 8),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.grey400,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),

                      // Header
                      Container(
                        padding: EdgeInsets.fromLTRB(20, 8, 12, 16),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: theme.colorScheme.onSurface.withOpacity(0.08),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                gradient: AppColors.greenGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.secondary.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Icon(
                                Icons.auto_awesome,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'flashcards.list.modal_add_cards_title'.tr(),
                                    style: AppTextStyles.titleLarge.copyWith(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 20,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    widget.studySetTitle,
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.grey600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: Icon(Icons.close, size: 24),
                              onPressed: () => Navigator.pop(sheetContext),
                              style: IconButton.styleFrom(
                                backgroundColor: isDark
                                    ? AppColors.grey800
                                    : AppColors.grey100,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // FlashcardEditorWidget
                      Expanded(
                        child: FlashcardEditorWidget(
                          studySetId: widget.studySetId,
                          onFlashcardsAdded: (cards) {
                            setState(() {
                              cardsToAdd = cards;
                            });
                          },
                        ),
                      ),

                      // Save button at bottom
                      if (cardsToAdd.isNotEmpty)
                        Container(
                          padding: EdgeInsets.fromLTRB(20, 16, 20, 20),
                          decoration: BoxDecoration(
                            color: theme.scaffoldBackgroundColor,
                            border: Border(
                              top: BorderSide(
                                color: theme.colorScheme.onSurface.withOpacity(0.08),
                                width: 1,
                              ),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 20,
                                offset: Offset(0, -5),
                              ),
                            ],
                          ),
                          child: SafeArea(
                            top: false,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        AppColors.secondary.withOpacity(0.1),
                                        AppColors.primary.withOpacity(0.1),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppColors.secondary.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.check_circle_outline,
                                        color: AppColors.secondary,
                                        size: 20,
                                      ),
                                      SizedBox(width: 8),
                                      Text(
                                        '${cardsToAdd.length} ${cardsToAdd.length == 1 ? 'flashcards.list.ready_card_singular'.tr() : 'flashcards.list.ready_cards_plural'.tr()} ${'flashcards.list.ready_text'.tr()}',
                                        style: AppTextStyles.titleSmall.copyWith(
                                          color: AppColors.secondary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                SizedBox(height: 12),
                                PrimaryButton(
                                  text: 'flashcards.list.button_add_to_set'.tr(),
                                  icon: Icons.add,
                                  onPressed: () {
                                    context.read<FlashcardsBloc>().add(
                                          BulkCreateFlashcards(
                                            studySetId: widget.studySetId,
                                            flashcards: cardsToAdd,
                                          ),
                                        );
                                  },
                                  width: double.infinity,
                                  gradient: AppColors.greenGradient,
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppDimensions.space24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(AppDimensions.space24),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.style_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            SizedBox(height: AppDimensions.space24),
            Text(
              'flashcards.list.empty_title'.tr(),
              style: AppTextStyles.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: AppDimensions.space8),
            Text(
              'flashcards.list.empty_message'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppDimensions.space32),
            PrimaryButton(
              text: 'flashcards.list.empty_button'.tr(),
              icon: Icons.add,
              onPressed: () => _showAddCardsSheet(context),
              gradient: AppColors.greenGradient,
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final int count;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.count,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppDimensions.radiusRound),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: AppDimensions.space16,
          vertical: AppDimensions.space8,
        ),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.greenGradient : null,
          color: isSelected ? null : theme.cardColor,
          borderRadius: BorderRadius.circular(AppDimensions.radiusRound),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : theme.colorScheme.onSurface.withOpacity(0.1),
          ),
        ),
        child: Text(
          '$label ($count)',
          style: AppTextStyles.labelMedium.copyWith(
            color: isSelected ? Colors.white : theme.colorScheme.onSurface,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
