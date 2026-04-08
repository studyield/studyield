import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../../../flashcards/domain/entities/flashcard_entity.dart';

class MatchGameScreen extends StatefulWidget {
  final String studySetId;
  final String studySetTitle;

  const MatchGameScreen({
    super.key,
    required this.studySetId,
    required this.studySetTitle,
  });

  @override
  State<MatchGameScreen> createState() => _MatchGameScreenState();
}

class _MatchGameScreenState extends State<MatchGameScreen> {
  List<MatchCard> _questions = [];
  List<MatchCard> _answers = [];
  int? _selectedQuestionIndex;
  int? _selectedAnswerIndex;
  Set<int> _matchedQuestionIndices = {};
  Set<int> _matchedAnswerIndices = {};
  int _moves = 0;
  int _matches = 0;
  Timer? _timer;
  int _seconds = 0;
  bool _isLoading = true;
  bool _isGameComplete = false;

  @override
  void initState() {
    super.initState();
    _loadFlashcardsAndStartGame();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadFlashcardsAndStartGame() async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get(
        '/flashcards/study-set/${widget.studySetId}',
      );

      final flashcardsData = response.data as List<dynamic>;
      final flashcards = flashcardsData
          .map((json) => FlashcardEntity.fromJson(json))
          .toList();

      if (flashcards.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('quiz.match_game.no_flashcards_available'.tr()),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.pop(context);
        return;
      }

      // Take up to 6 flashcards for better UX
      final selectedFlashcards = flashcards.take(6).toList();

      // Create questions list (keep in order)
      List<MatchCard> questions = [];
      for (int i = 0; i < selectedFlashcards.length; i++) {
        questions.add(MatchCard(
          id: i,
          pairId: i,
          text: selectedFlashcards[i].front,
          type: MatchCardType.question,
        ));
      }

      // Create answers list (shuffled)
      List<MatchCard> answers = [];
      for (int i = 0; i < selectedFlashcards.length; i++) {
        answers.add(MatchCard(
          id: i,
          pairId: i,
          text: selectedFlashcards[i].back,
          type: MatchCardType.answer,
        ));
      }
      answers.shuffle();

      setState(() {
        _questions = questions;
        _answers = answers;
        _isLoading = false;
      });

      _startTimer();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('quiz.match_game.failed_to_load'.tr(namedArgs: {'error': '$e'})),
          backgroundColor: AppColors.error,
        ),
      );
      Navigator.pop(context);
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (_) {
      if (mounted) setState(() => _seconds++);
    });
  }

  void _onQuestionTap(int index) {
    if (_matchedQuestionIndices.contains(index)) return;
    setState(() {
      _selectedQuestionIndex = index;
      _checkMatch();
    });
  }

  void _onAnswerTap(int index) {
    if (_matchedAnswerIndices.contains(index)) return;
    setState(() {
      _selectedAnswerIndex = index;
      _checkMatch();
    });
  }

  void _checkMatch() {
    if (_selectedQuestionIndex == null || _selectedAnswerIndex == null) return;

    final question = _questions[_selectedQuestionIndex!];
    final answer = _answers[_selectedAnswerIndex!];

    _moves++;

    if (question.pairId == answer.pairId) {
      // Match!
      setState(() {
        _matchedQuestionIndices.add(_selectedQuestionIndex!);
        _matchedAnswerIndices.add(_selectedAnswerIndex!);
        _matches++;
        _selectedQuestionIndex = null;
        _selectedAnswerIndex = null;

        if (_matches == _questions.length) {
          _isGameComplete = true;
          _timer?.cancel();
        }
      });
    } else {
      // No match - deselect after delay
      Future.delayed(Duration(milliseconds: 600), () {
        if (mounted) {
          setState(() {
            _selectedQuestionIndex = null;
            _selectedAnswerIndex = null;
          });
        }
      });
    }
  }

  void _resetGame() {
    setState(() {
      _answers.shuffle();
      _selectedQuestionIndex = null;
      _selectedAnswerIndex = null;
      _matchedQuestionIndices.clear();
      _matchedAnswerIndices.clear();
      _moves = 0;
      _matches = 0;
      _seconds = 0;
      _isGameComplete = false;
    });
    _timer?.cancel();
    _startTimer();
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

    if (_isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'quiz.match_game.title'.tr(),
              style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            Text(
              widget.studySetTitle,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: _resetGame,
            tooltip: 'quiz.match_game.reset_game'.tr(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats bar
          Container(
            padding: EdgeInsets.all(AppDimensions.space16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              border: Border(
                bottom: BorderSide(
                  color: theme.colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  icon: Icons.timer,
                  label: 'quiz.match_game.time'.tr(),
                  value: 'quiz.match_game.time_seconds'.tr(namedArgs: {'seconds': '$_seconds'}),
                  color: AppColors.primary,
                ),
                _StatItem(
                  icon: Icons.touch_app,
                  label: 'quiz.match_game.moves'.tr(),
                  value: '$_moves',
                  color: AppColors.warning,
                ),
                _StatItem(
                  icon: Icons.check_circle,
                  label: 'quiz.match_game.matches'.tr(),
                  value: '$_matches/${_questions.length}',
                  color: AppColors.success,
                ),
              ],
            ),
          ),

          // Game area - Two columns
          Expanded(
            child: Row(
              children: [
                // Questions column (left)
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.blue, AppColors.blueLight],
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.quiz, color: Colors.white, size: 16),
                            SizedBox(width: 8),
                            Text(
                              'quiz.match_game.questions'.tr(),
                              style: AppTextStyles.labelMedium.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          padding: EdgeInsets.all(12),
                          itemCount: _questions.length,
                          itemBuilder: (context, index) {
                            final isMatched = _matchedQuestionIndices.contains(index);
                            final isSelected = _selectedQuestionIndex == index;

                            return Padding(
                              padding: EdgeInsets.only(bottom: 12),
                              child: _MatchCard(
                                card: _questions[index],
                                isSelected: isSelected,
                                isMatched: isMatched,
                                onTap: () => _onQuestionTap(index),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Divider
                Container(
                  width: 2,
                  color: theme.colorScheme.onSurface.withOpacity(0.1),
                ),

                // Answers column (right)
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.purple, AppColors.purpleLight],
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.emoji_objects, color: Colors.white, size: 16),
                            SizedBox(width: 8),
                            Text(
                              'quiz.match_game.answers'.tr(),
                              style: AppTextStyles.labelMedium.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          padding: EdgeInsets.all(12),
                          itemCount: _answers.length,
                          itemBuilder: (context, index) {
                            final isMatched = _matchedAnswerIndices.contains(index);
                            final isSelected = _selectedAnswerIndex == index;

                            return Padding(
                              padding: EdgeInsets.only(bottom: 12),
                              child: _MatchCard(
                                card: _answers[index],
                                isSelected: isSelected,
                                isMatched: isMatched,
                                onTap: () => _onAnswerTap(index),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Game complete message
          if (_isGameComplete)
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
              margin: EdgeInsets.all(AppDimensions.space16),
              decoration: BoxDecoration(
                gradient: AppColors.greenGradient,
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              ),
              child: Column(
                children: [
                  Icon(Icons.emoji_events, size: 48, color: Colors.white),
                  SizedBox(height: 12),
                  Text(
                    'quiz.match_game.congratulations'.tr(),
                    style: AppTextStyles.titleLarge.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'quiz.match_game.completed_message'.tr(namedArgs: {'seconds': '$_seconds', 'moves': '$_moves'}),
                    style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
                  ),
                  SizedBox(height: 16),
                  PrimaryButton(
                    text: 'quiz.match_game.play_again'.tr(),
                    icon: Icons.refresh,
                    onPressed: _resetGame,
                    backgroundColor: Theme.of(context).cardColor,
                    textColor: AppColors.secondary,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 20, color: color),
        SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MatchCard extends StatelessWidget {
  final MatchCard card;
  final bool isSelected;
  final bool isMatched;
  final VoidCallback onTap;

  const _MatchCard({
    required this.card,
    required this.isSelected,
    required this.isMatched,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: isMatched ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: isMatched
              ? AppColors.greenGradient
              : isSelected
                  ? (card.type == MatchCardType.question
                      ? LinearGradient(colors: [AppColors.blue, AppColors.blueLight])
                      : LinearGradient(colors: [AppColors.purple, AppColors.purpleLight]))
                  : null,
          color: !isMatched && !isSelected ? theme.cardColor : null,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isMatched
                ? AppColors.success
                : isSelected
                    ? (card.type == MatchCardType.question ? AppColors.blue : AppColors.purple)
                    : theme.colorScheme.onSurface.withOpacity(0.2),
            width: isSelected || isMatched ? 2.5 : 1.5,
          ),
          boxShadow: isSelected || isMatched
              ? [
                  BoxShadow(
                    color: (isMatched
                            ? AppColors.success
                            : card.type == MatchCardType.question
                                ? AppColors.blue
                                : AppColors.purple)
                        .withOpacity(0.3),
                    blurRadius: 8,
                    offset: Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          card.text,
          style: AppTextStyles.bodyMedium.copyWith(
            color: isMatched || isSelected ? Colors.white : theme.colorScheme.onSurface,
            fontWeight: isSelected || isMatched ? FontWeight.w600 : FontWeight.normal,
            height: 1.4,
          ),
          maxLines: 4,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}

enum MatchCardType { question, answer }

class MatchCard {
  final int id;
  final int pairId;
  final String text;
  final MatchCardType type;

  MatchCard({
    required this.id,
    required this.pairId,
    required this.text,
    required this.type,
  });
}
