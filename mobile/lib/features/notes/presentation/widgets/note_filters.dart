import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class NoteFilters extends StatelessWidget {
  final List<String> allTags;
  final String? selectedTag;
  final String sortOption;
  final Function(String?) onTagSelected;
  final Function(String) onSortChanged;

  const NoteFilters({
    super.key,
    required this.allTags,
    this.selectedTag,
    required this.sortOption,
    required this.onTagSelected,
    required this.onSortChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tags Row
        if (allTags.isNotEmpty) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // "All" filter
                _buildFilterChip(
                  label: 'notes.filterAll'.tr(),
                  isSelected: selectedTag == null,
                  onTap: () => onTagSelected(null),
                ),
                const SizedBox(width: 8),

                // Tag filters
                ...allTags.take(5).map((tag) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _buildFilterChip(
                      label: tag,
                      isSelected: selectedTag == tag,
                      onTap: () => onTagSelected(
                        selectedTag == tag ? null : tag,
                      ),
                      showIcon: true,
                    ),
                  );
                }),

                if (allTags.length > 5)
                  Text(
                    'notes.filterMoreTags'.tr(namedArgs: {'count': '${allTags.length - 5}'}),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Sort Dropdown
        _buildSortDropdown(context),
      ],
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    bool showIcon = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : AppColors.grey100.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showIcon) ...[
              Icon(
                Icons.tag,
                size: 12,
                color: isSelected ? Colors.white : AppColors.grey600,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.grey700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSortDropdown(BuildContext context) {
    final sortOptions = {
      'newest': 'notes.sortNewest'.tr(),
      'oldest': 'notes.sortOldest'.tr(),
      'title': 'notes.sortTitle'.tr(),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2),
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: sortOption,
          items: sortOptions.entries.map((entry) {
            return DropdownMenuItem(
              value: entry.key,
              child: Row(
                children: [
                  const Icon(Icons.sort, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    entry.value,
                    style: AppTextStyles.bodySmall.copyWith(
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              onSortChanged(value);
            }
          },
          icon: const Icon(Icons.arrow_drop_down, size: 20),
          isExpanded: true,
          isDense: true,
        ),
      ),
    );
  }
}
