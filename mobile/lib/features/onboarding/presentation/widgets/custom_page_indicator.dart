import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class CustomPageIndicator extends StatelessWidget {
  final int currentPage;
  final int pageCount;

  const CustomPageIndicator({
    super.key,
    required this.currentPage,
    required this.pageCount,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        pageCount,
        (index) => AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          height: 8,
          width: currentPage == index ? 24 : 8,
          decoration: BoxDecoration(
            color: currentPage == index
                ? AppColors.primary
                : AppColors.grey300,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }
}
