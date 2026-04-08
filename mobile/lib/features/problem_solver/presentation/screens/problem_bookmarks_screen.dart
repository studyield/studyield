import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/bookmark_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import '../widgets/enhanced_bookmark_card_widget.dart';
import '../widgets/bookmark_search_bar_widget.dart';
import '../widgets/bookmark_filter_chip_widget.dart';

class ProblemBookmarksScreen extends StatefulWidget {
  const ProblemBookmarksScreen({super.key});

  @override
  State<ProblemBookmarksScreen> createState() => _ProblemBookmarksScreenState();
}

class _ProblemBookmarksScreenState extends State<ProblemBookmarksScreen> {
  List<BookmarkEntity> _bookmarks = [];
  Set<String> _selectedTags = {};
  String? _searchQuery;
  final TextEditingController _noteController = TextEditingController();
  final TextEditingController _tagController = TextEditingController();
  Set<String> _allTags = {};

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  @override
  void dispose() {
    _noteController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  void _loadBookmarks() {
    context.read<ProblemSolverBloc>().add(
          LoadBookmarksWithFilters(
            tags: _selectedTags.isEmpty ? null : _selectedTags.toList(),
            searchQuery: _searchQuery,
          ),
        );
  }

  void _onSearchChanged(String query) {
    setState(() => _searchQuery = query.isEmpty ? null : query);
    _loadBookmarks();
  }

  void _toggleTag(String tag) {
    setState(() {
      if (_selectedTags.contains(tag)) {
        _selectedTags.remove(tag);
      } else {
        _selectedTags.add(tag);
      }
    });
    _loadBookmarks();
  }

  void _showEditBookmarkSheet(BookmarkEntity bookmark) {
    _noteController.text = bookmark.notes ?? '';
    final tempTags = Set<String>.from(bookmark.tags);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.7,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.grey300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'problem_solver.bookmarks.edit_sheet.title'.tr(),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),

                const Divider(),

                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Tags section
                         Text(
                          'problem_solver.bookmarks.edit_sheet.tags_label'.tr(),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _tagController,
                                decoration: InputDecoration(
                                  hintText: 'problem_solver.bookmarks.hint_tag'.tr(),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 12,
                                  ),
                                ),
                                onSubmitted: (value) {
                                  if (value.trim().isNotEmpty) {
                                    setModalState(() {
                                      tempTags.add(value.trim());
                                    });
                                    _tagController.clear();
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton.filled(
                              onPressed: () {
                                if (_tagController.text.trim().isNotEmpty) {
                                  setModalState(() {
                                    tempTags.add(_tagController.text.trim());
                                  });
                                  _tagController.clear();
                                }
                              },
                              icon: const Icon(Icons.add),
                              style: IconButton.styleFrom(
                                backgroundColor: AppColors.purple,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (tempTags.isNotEmpty)
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: tempTags.map((tag) {
                              return Chip(
                                label: Text(tag),
                                backgroundColor:
                                    AppColors.purple.withOpacity(0.1),
                                deleteIcon: const Icon(Icons.close, size: 16),
                                onDeleted: () {
                                  setModalState(() {
                                    tempTags.remove(tag);
                                  });
                                },
                                side: BorderSide.none,
                              );
                            }).toList(),
                          ),

                        const SizedBox(height: 24),

                        // Notes section
                        Text(
                          'problem_solver.bookmarks.edit_sheet.notes_label'.tr(),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _noteController,
                          maxLines: 5,
                          decoration: InputDecoration(
                            hintText: 'problem_solver.bookmarks.hint_notes'.tr(),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: AppColors.grey50,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Save button
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: ElevatedButton(
                    onPressed: () {
                      context.read<ProblemSolverBloc>().add(
                            UpdateBookmark(
                              bookmarkId: bookmark.id,
                              tags: tempTags.toList(),
                              notes: _noteController.text.trim().isEmpty
                                  ? null
                                  : _noteController.text.trim(),
                            ),
                          );
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('problem_solver.bookmarks.updated'.tr()),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.purple,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'problem_solver.bookmarks.edit_sheet.save_button'.tr(),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _deleteBookmark(BookmarkEntity bookmark) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('problem_solver.bookmarks.delete_dialog.title'.tr()),
        content: Text('problem_solver.bookmarks.delete_confirm'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              context
                  .read<ProblemSolverBloc>()
                  .add(DeleteBookmark(bookmarkId: bookmark.id));
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('problem_solver.bookmarks.deleted'.tr()),
                  backgroundColor: Colors.red,
                ),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('common.delete'.tr()),
          ),
        ],
      ),
    );
  }

  Map<String, List<BookmarkEntity>> _groupBySubject() {
    final grouped = <String, List<BookmarkEntity>>{};

    for (final bookmark in _bookmarks) {
      final subject = bookmark.session?.subject ?? 'Other';
      grouped.putIfAbsent(subject, () => []);
      grouped[subject]!.add(bookmark);
    }

    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('problem_solver.bookmarks.title'.tr()),
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is BookmarksLoadedWithDetails) {
            setState(() {
              _bookmarks = state.bookmarks;
              _allTags = {};
              for (final bookmark in state.bookmarks) {
                _allTags.addAll(bookmark.tags);
              }
            });
          } else if (state is BookmarkDeleted) {
            _loadBookmarks();
          } else if (state is BookmarkUpdated) {
            _loadBookmarks();
          }
        },
        child: Column(
          children: [
            // Search and filters
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  BookmarkSearchBar(
                    onSearch: _onSearchChanged,
                    initialValue: _searchQuery,
                  ),

                  // Tag filters
                  if (_allTags.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 40,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _allTags.length,
                        itemBuilder: (context, index) {
                          final tag = _allTags.elementAt(index);
                          final count = _bookmarks
                              .where((b) => b.tags.contains(tag))
                              .length;

                          return BookmarkFilterChip(
                            label: tag,
                            count: count,
                            isSelected: _selectedTags.contains(tag),
                            onTap: () => _toggleTag(tag),
                            onRemove: () => _toggleTag(tag),
                          );
                        },
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Stats card
            if (_bookmarks.isNotEmpty)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppColors.purpleGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.purple.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem('problem_solver.bookmarks.stats.total'.tr(), _bookmarks.length.toString()),
                    _buildStatItem('problem_solver.bookmarks.stats.subjects'.tr(), _groupBySubject().length.toString()),
                    _buildStatItem('problem_solver.bookmarks.stats.tags'.tr(), _allTags.length.toString()),
                  ],
                ),
              ),

            // Bookmarks list
            Expanded(
              child: _bookmarks.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.bookmark_border,
                            size: 64,
                            color: AppColors.grey400,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'problem_solver.bookmarks.empty_state.title'.tr(),
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: AppColors.grey600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Save problems to access them later',
                            style: TextStyle(color: AppColors.grey500),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _groupBySubject().length,
                      itemBuilder: (context, index) {
                        final subject = _groupBySubject().keys.elementAt(index);
                        final bookmarks = _groupBySubject()[subject]!;

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                subject,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            ...bookmarks.map((bookmark) {
                              return EnhancedBookmarkCard(
                                bookmark: bookmark,
                                onEdit: () => _showEditBookmarkSheet(bookmark),
                                onDelete: () => _deleteBookmark(bookmark),
                                onTagTap: _toggleTag,
                              );
                            }),
                            const SizedBox(height: 16),
                          ],
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
