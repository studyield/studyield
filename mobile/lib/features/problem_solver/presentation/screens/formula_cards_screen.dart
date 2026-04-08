import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/formula_card_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';

class FormulaCardsScreen extends StatefulWidget {
  final String sessionId;

  const FormulaCardsScreen({super.key, required this.sessionId});

  @override
  State<FormulaCardsScreen> createState() => _FormulaCardsScreenState();
}

class _FormulaCardsScreenState extends State<FormulaCardsScreen>
    with SingleTickerProviderStateMixin {
  List<FormulaCardEntity> _cards = [];
  int _currentIndex = 0;
  bool _showBack = false;
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOut),
    );
    context.read<ProblemSolverBloc>().add(LoadFormulaCards(sessionId: widget.sessionId));
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flipCard() {
    if (_showBack) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    setState(() => _showBack = !_showBack);
  }

  void _nextCard() {
    if (_currentIndex < _cards.length - 1) {
      setState(() {
        _currentIndex++;
        if (_showBack) {
          _showBack = false;
          _flipController.reverse();
        }
      });
    }
  }

  void _previousCard() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
        if (_showBack) {
          _showBack = false;
          _flipController.reverse();
        }
      });
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'rule':
        return const Color(0xFF9333EA);
      case 'concept':
        return const Color(0xFF3B82F6);
      case 'formula':
        return const Color(0xFFF59E0B);
      case 'theorem':
        return const Color(0xFFEF4444);
      default:
        return AppColors.grey600;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final card = _cards.isNotEmpty ? _cards[_currentIndex] : null;
    final categoryColor = card != null ? _getCategoryColor(card.category) : Colors.purple;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.style, color: Color(0xFF9333EA), size: 20),
                const SizedBox(width: 8),
                Text('problem_solver.formula_cards.title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            if (_cards.isNotEmpty)
              Text(
                'problem_solver.formula_cards.progress'.tr(namedArgs: {'current': (_currentIndex + 1).toString(), 'total': _cards.length.toString()}),
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.grey600,
                  fontSize: 11,
                ),
              ),
          ],
        ),
        toolbarHeight: 70,
        actions: [
          if (card != null)
            IconButton(
              icon: const Icon(Icons.copy, size: 20),
              onPressed: () {
                Clipboard.setData(
                  ClipboardData(
                    text: '${card.front}\n\n${card.back}',
                  ),
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('problem_solver.formula_cards.messages.copied'.tr()),
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
            ),
        ],
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is FormulaCardsLoaded) {
            setState(() => _cards = state.cards);
          }
        },
        child: _cards.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Progress Dots
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_cards.length, (index) {
                        final isActive = index == _currentIndex;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: isActive ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: isActive ? categoryColor : AppColors.grey300,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        );
                      }),
                    ),
                  ),

                  // Card
                  Expanded(
                    child: GestureDetector(
                      onTap: _flipCard,
                      onHorizontalDragEnd: (details) {
                        if (details.primaryVelocity! < 0) {
                          _nextCard();
                        } else if (details.primaryVelocity! > 0) {
                          _previousCard();
                        }
                      },
                      child: Center(
                        child: AnimatedBuilder(
                          animation: _flipAnimation,
                          builder: (context, child) {
                            final angle = _flipAnimation.value * pi;
                            final isBack = _flipAnimation.value > 0.5;

                            return Transform(
                              alignment: Alignment.center,
                              transform: Matrix4.identity()
                                ..setEntry(3, 2, 0.001)
                                ..rotateY(angle),
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 20),
                                padding: const EdgeInsets.all(32),
                                constraints: const BoxConstraints(
                                  minHeight: 400,
                                  maxWidth: 500,
                                ),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: isBack
                                        ? [const Color(0xFF10B981), const Color(0xFF059669)]
                                        : [categoryColor, categoryColor.withOpacity(0.8)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(24),
                                  boxShadow: [
                                    BoxShadow(
                                      color: categoryColor.withOpacity(0.4),
                                      blurRadius: 30,
                                      offset: const Offset(0, 15),
                                    ),
                                  ],
                                ),
                                child: Transform(
                                  alignment: Alignment.center,
                                  transform: Matrix4.identity()
                                    ..rotateY(isBack ? pi : 0),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      // Side Indicator
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 16,
                                          vertical: 8,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.25),
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              isBack ? Icons.description : Icons.title,
                                              color: Colors.white,
                                              size: 16,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              isBack ? 'Explanation' : card!.category.toUpperCase(),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 1,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 32),

                                      // Content
                                      Expanded(
                                        child: Center(
                                          child: SingleChildScrollView(
                                            child: Text(
                                              isBack ? card!.back : card!.front,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 22,
                                                fontWeight: FontWeight.w600,
                                                height: 1.6,
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                          ),
                                        ),
                                      ),

                                      const SizedBox(height: 32),

                                      // Tap Hint
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.touch_app,
                                            color: Colors.white.withOpacity(0.7),
                                            size: 18,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            isBack ? 'problem_solver.formula_cards.hints.tap_formula'.tr() : 'problem_solver.formula_cards.hints.tap_explanation'.tr(),
                                            style: TextStyle(
                                              color: Colors.white.withOpacity(0.8),
                                              fontSize: 13,
                                              fontStyle: FontStyle.italic,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),

                  // Navigation Controls
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Swipe Hint
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.swipe, color: AppColors.grey400, size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'problem_solver.formula_cards.hints.swipe_navigate'.tr(),
                              style: TextStyle(
                                color: AppColors.grey600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Buttons
                        Row(
                          children: [
                            // Previous
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _currentIndex > 0 ? _previousCard : null,
                                icon: const Icon(Icons.chevron_left),
                                label: Text('problem_solver.formula_cards.actions.previous'.tr()),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Theme.of(context).cardColor,
                                  foregroundColor: categoryColor,
                                  side: BorderSide(color: categoryColor.withOpacity(0.3)),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 0,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Flip
                            ElevatedButton(
                              onPressed: _flipCard,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: categoryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.all(14),
                                shape: const CircleBorder(),
                                elevation: 4,
                              ),
                              child: const Icon(Icons.flip, size: 24),
                            ),
                            const SizedBox(width: 12),

                            // Next
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _currentIndex < _cards.length - 1 ? _nextCard : null,
                                icon: const Icon(Icons.chevron_right),
                                label: Text('problem_solver.formula_cards.actions.next'.tr()),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: categoryColor,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
