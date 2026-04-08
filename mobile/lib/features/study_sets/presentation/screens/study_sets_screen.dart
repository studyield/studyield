import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/widgets/navigation/app_bottom_nav.dart';
import '../bloc/study_sets_bloc.dart';
import '../bloc/study_sets_event.dart';
import '../bloc/study_sets_state.dart';
import '../widgets/study_set_card.dart';
import 'study_set_detail_screen.dart';
import 'create_edit_study_set_screen.dart';

class StudySetsScreen extends StatefulWidget {
  final bool hideBottomNav;

  const StudySetsScreen({super.key, this.hideBottomNav = false});

  @override
  State<StudySetsScreen> createState() => _StudySetsScreenState();
}

class _StudySetsScreenState extends State<StudySetsScreen> {
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<StudySetsBloc>().add(LoadStudySets());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _navigateToCreate() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const CreateEditStudySetScreen(),
      ),
    );
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
      extendBody: false,
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // ─── Header ──────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.fromLTRB(
                AppDimensions.space20,
                AppDimensions.space16,
                AppDimensions.space20,
                AppDimensions.space12,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'study_sets.header_title'.tr(),
                          style: AppTextStyles.headlineSmall.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'study_sets.header_subtitle'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: AppDimensions.space12),
                  PrimaryButton(
                    text: 'study_sets.create_button'.tr(),
                    onPressed: _navigateToCreate,
                    icon: Icons.add,
                    gradient: AppColors.greenGradient,
                    height: 40,
                  ),
                ],
              ),
            ),

            // ─── Search bar ──────────────────────────────────────────
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: AppDimensions.space20,
              ),
              child: TextField(
                controller: _searchController,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'study_sets.search_hint'.tr(),
                  hintStyle: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.grey500,
                  ),
                  prefixIcon: Icon(Icons.search, size: 20, color: AppColors.grey500),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: AppDimensions.space16,
                    vertical: AppDimensions.space8,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                    borderSide: BorderSide(
                      color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                    borderSide: BorderSide(
                      color: isDark ? AppColors.borderDark : AppColors.borderLight,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                    borderSide: BorderSide(color: AppColors.primary),
                  ),
                  isDense: true,
                  filled: true,
                  fillColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),

            SizedBox(height: AppDimensions.space12),

            // ─── Body ────────────────────────────────────────────────
            Expanded(
              child: BlocConsumer<StudySetsBloc, StudySetsState>(
                listener: (context, state) {
                  if (state is StudySetCreated) {
                    context.read<StudySetsBloc>().add(RefreshStudySets());
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('study_sets.messages.created'.tr()),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  } else if (state is StudySetUpdated) {
                    context.read<StudySetsBloc>().add(RefreshStudySets());
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('study_sets.messages.updated'.tr()),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  } else if (state is StudySetDeleted) {
                    context.read<StudySetsBloc>().add(RefreshStudySets());
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('study_sets.messages.deleted'.tr()),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                },
                builder: (context, state) {
                  if (state is StudySetsLoading || state is StudySetCreating) {
                    return Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    );
                  }

                  if (state is StudySetsError) {
                    return _buildErrorState(state.message, theme);
                  }

                  if (state is StudySetsLoaded) {
                    final filteredStudySets = _searchQuery.isEmpty
                        ? state.studySets
                        : state.studySets.where((studySet) {
                            final q = _searchQuery.toLowerCase();
                            return studySet.title.toLowerCase().contains(q) ||
                                (studySet.description?.toLowerCase().contains(q) ?? false) ||
                                studySet.tags.any((t) => t.toLowerCase().contains(q));
                          }).toList();

                    if (state.studySets.isEmpty) {
                      return _buildEmptyState(context);
                    }

                    if (filteredStudySets.isEmpty) {
                      return _buildNoResultsState(theme);
                    }

                    return RefreshIndicator(
                      onRefresh: () async {
                        context.read<StudySetsBloc>().add(RefreshStudySets());
                      },
                      color: AppColors.primary,
                      child: ListView.separated(
                        padding: EdgeInsets.symmetric(
                          horizontal: AppDimensions.space20,
                          vertical: AppDimensions.space4,
                        ),
                        itemCount: filteredStudySets.length,
                        separatorBuilder: (_, __) => SizedBox(
                          height: AppDimensions.space12,
                        ),
                        itemBuilder: (context, index) {
                          final studySet = filteredStudySets[index];
                          return StudySetCard(
                            studySet: studySet,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => StudySetDetailScreen(
                                    studySet: studySet,
                                  ),
                                ),
                              );
                            },
                            onEdit: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => CreateEditStudySetScreen(
                                    studySet: studySet,
                                  ),
                                ),
                              );
                            },
                            onDelete: () {
                              _showDeleteConfirmation(context, studySet);
                            },
                          );
                        },
                      ),
                    );
                  }

                  return SizedBox();
                },
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar:
          widget.hideBottomNav ? null : const AppBottomNav(activeTab: 'library'),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppDimensions.space24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(AppDimensions.space24),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.collections_bookmark_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            SizedBox(height: AppDimensions.space24),
            Text(
              'study_sets.empty_state.title'.tr(),
              style: AppTextStyles.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            SizedBox(height: AppDimensions.space8),
            Text(
              'study_sets.empty_state.subtitle'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: AppDimensions.space32),
            PrimaryButton(
              text: 'study_sets.empty_state.button'.tr(),
              icon: Icons.add,
              onPressed: _navigateToCreate,
              gradient: AppColors.greenGradient,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResultsState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: AppColors.grey400),
          SizedBox(height: AppDimensions.space16),
          Text(
            'study_sets.no_results_title'.tr(),
            style: AppTextStyles.titleMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          SizedBox(height: AppDimensions.space8),
          Text(
            'study_sets.no_results_subtitle'.tr(namedArgs: {'query': _searchQuery}),
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.grey600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String message, ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: AppColors.error),
          SizedBox(height: AppDimensions.space16),
          Text(
            'study_sets.messages.error'.tr(),
            style: AppTextStyles.titleMedium.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          SizedBox(height: AppDimensions.space8),
          Text(
            message,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.grey600,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: AppDimensions.space24),
          PrimaryButton(
            text: 'study_sets.messages.retry'.tr(),
            onPressed: () {
              context.read<StudySetsBloc>().add(LoadStudySets());
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, dynamic studySet) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('study_sets.detail.delete_confirm_title'.tr()),
        content: Text(
          'study_sets.detail.delete_confirm_message'.tr(
            namedArgs: {'title': studySet.title},
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('study_sets.detail.delete_confirm_cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<StudySetsBloc>().add(
                    DeleteStudySet(id: studySet.id),
                  );
            },
            child: Text(
              'study_sets.detail.delete_confirm_delete'.tr(),
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
