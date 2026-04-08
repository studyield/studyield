import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/api_config.dart';

class ReviewQuestion {
  final String id;
  final String question;
  final String correctAnswer;
  final List<String>? options;
  final String difficulty;
  final String topic;
  final String examCloneId;
  final String examCloneName;
  final String nextReviewAt;
  final int repetitions;
  final double easeFactor;

  ReviewQuestion({
    required this.id,
    required this.question,
    required this.correctAnswer,
    this.options,
    required this.difficulty,
    required this.topic,
    required this.examCloneId,
    required this.examCloneName,
    required this.nextReviewAt,
    required this.repetitions,
    required this.easeFactor,
  });

  factory ReviewQuestion.fromJson(Map<String, dynamic> json) {
    return ReviewQuestion(
      id: json['id'],
      question: json['question'],
      correctAnswer: json['correctAnswer'],
      options: json['options'] != null ? List<String>.from(json['options']) : null,
      difficulty: json['difficulty'] ?? 'Unknown',
      topic: json['topic'] ?? 'General',
      examCloneId: json['examCloneId'],
      examCloneName: json['examCloneName'],
      nextReviewAt: json['nextReviewAt'],
      repetitions: json['repetitions'] ?? 0,
      easeFactor: (json['easeFactor'] ?? 2.5).toDouble(),
    );
  }
}

enum ReviewPhase { loading, empty, question, complete }

class ReviewQueueScreen extends StatefulWidget {
  const ReviewQueueScreen({super.key});

  @override
  State<ReviewQueueScreen> createState() => _ReviewQueueScreenState();
}

class _ReviewQueueScreenState extends State<ReviewQueueScreen> {
  final ApiClient _apiClient = ApiClient.instance;
  ReviewPhase phase = ReviewPhase.loading;
  List<ReviewQuestion> queue = [];
  int currentIndex = 0;
  int? selectedAnswer;
  bool showAnswer = false;
  Map<String, int> stats = {'correct': 0, 'incorrect': 0, 'total': 0};
  bool isSubmitting = false;
  String? explanation;
  bool loadingExplanation = false;
  String? error;
  bool isCheckingAnswer = false;
  String? aiFeedback;
  bool _lastAnswerCorrect = false;
  final TextEditingController _answerController = TextEditingController();

  ReviewQuestion? get currentQuestion =>
      currentIndex < queue.length ? queue[currentIndex] : null;

  @override
  void initState() {
    super.initState();
    _fetchReviewQueue();
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  Future<void> _fetchReviewQueue() async {
    setState(() {
      phase = ReviewPhase.loading;
      error = null;
    });

    try {
      final response = await _apiClient.get(Endpoints.reviewQueue);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        if (data.isEmpty) {
          setState(() => phase = ReviewPhase.empty);
        } else {
          setState(() {
            queue = data.map((q) => ReviewQuestion.fromJson(q)).toList();
            stats = {'correct': 0, 'incorrect': 0, 'total': data.length};
            phase = ReviewPhase.question;
          });
        }
      } else {
        throw Exception('Failed to load review queue');
      }
    } catch (e) {
      setState(() {
        error = e.toString();
        phase = ReviewPhase.empty;
      });
    }
  }

  void _handleSelectAnswer(int index) {
    if (showAnswer) return;
    setState(() => selectedAnswer = index);
  }

  Future<void> _handleCheckAnswer() async {
    if (currentQuestion == null) return;
    if (currentQuestion!.options != null &&
        currentQuestion!.options!.isNotEmpty &&
        selectedAnswer == null) return;

    bool isCorrect = false;

    // For multiple choice - instant check
    if (currentQuestion!.options != null &&
        currentQuestion!.options!.isNotEmpty &&
        selectedAnswer != null) {
      isCorrect = currentQuestion!.options![selectedAnswer!] ==
          currentQuestion!.correctAnswer;
      setState(() {
        showAnswer = true;
        aiFeedback = null;
        _lastAnswerCorrect = isCorrect;
      });
    }
    // For written answers - use AI evaluation
    else if (_answerController.text.trim().isNotEmpty) {
      setState(() {
        isCheckingAnswer = true;
        aiFeedback = null;
      });

      try {
        final response = await _apiClient.post(
          '/exam-clones/questions/${currentQuestion!.id}/evaluate',
          data: {'userAnswer': _answerController.text.trim()},
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          isCorrect = response.data['isCorrect'] ?? false;
          final feedback = response.data['feedback'] ?? '';
          final score = response.data['score'] ?? 0;

          setState(() {
            showAnswer = true;
            isCheckingAnswer = false;
            _lastAnswerCorrect = isCorrect;
            aiFeedback = '$feedback\n\nScore: $score/100';
          });
        }
      } catch (e) {
        // Fallback to string comparison
        isCorrect = _answerController.text.toLowerCase().trim() ==
            currentQuestion!.correctAnswer.toLowerCase().trim();
        setState(() {
          showAnswer = true;
          isCheckingAnswer = false;
          _lastAnswerCorrect = isCorrect;
          aiFeedback = null;
        });
      }
    }

    if (!isCheckingAnswer) {
      setState(() {
        stats = {
          'correct': (stats['correct'] ?? 0) + (isCorrect ? 1 : 0),
          'incorrect': (stats['incorrect'] ?? 0) + (isCorrect ? 0 : 1),
          'total': stats['total'] ?? 0,
        };
      });
    }
  }

  Future<void> _handleGetExplanation() async {
    if (currentQuestion == null || loadingExplanation) return;

    setState(() => loadingExplanation = true);

    try {
      String userAnswer = '';
      if (currentQuestion!.options != null &&
          currentQuestion!.options!.isNotEmpty &&
          selectedAnswer != null) {
        userAnswer = currentQuestion!.options![selectedAnswer!];
      } else {
        userAnswer = _answerController.text;
      }

      print('📚 Fetching AI explanation...');
      final response = await _apiClient.post(
        '/exam-clones/questions/${currentQuestion!.id}/explanation',
        data: {'userAnswer': userAnswer},
      );

      print('✅ Explanation received: ${response.data}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        setState(() {
          explanation = response.data['explanation'];
          loadingExplanation = false;
        });
        print('✅ Explanation set in state: ${explanation?.substring(0, 50)}...');
      }
    } catch (e) {
      print('❌ Failed to get explanation: $e');
      setState(() => loadingExplanation = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to get explanation: $e')),
        );
      }
    }
  }

  Future<void> _handleNext() async {
    if (currentQuestion == null) return;

    setState(() => isSubmitting = true);

    bool isCorrect = false;
    if (currentQuestion!.options != null &&
        currentQuestion!.options!.isNotEmpty &&
        selectedAnswer != null) {
      isCorrect = currentQuestion!.options![selectedAnswer!] ==
          currentQuestion!.correctAnswer;
    }

    try {
      await _apiClient.post(
        '/exam-clones/review/${currentQuestion!.id}',
        data: {'correct': isCorrect},
      );
    } catch (e) {
      debugPrint('Failed to complete review: $e');
    }

    setState(() {
      isSubmitting = false;
      selectedAnswer = null;
      showAnswer = false;
      explanation = null;
      aiFeedback = null;
      _lastAnswerCorrect = false;
      _answerController.clear();
    });

    if (currentIndex + 1 >= queue.length) {
      setState(() => phase = ReviewPhase.complete);
    } else {
      setState(() => currentIndex++);
    }
  }

  void _handleRestart() {
    setState(() {
      currentIndex = 0;
      selectedAnswer = null;
      showAnswer = false;
      explanation = null;
      aiFeedback = null;
      _lastAnswerCorrect = false;
      stats = {'correct': 0, 'incorrect': 0, 'total': queue.length};
      phase = ReviewPhase.question;
    });
    _fetchReviewQueue();
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.green;
      case 'medium':
        return Colors.amber;
      case 'hard':
        return Colors.red;
      default:
        return AppColors.grey600;
    }
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
        title: Text(
          'exam_clone.review_queue.title'.tr(),
          style: AppTextStyles.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: phase == ReviewPhase.question
            ? [
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Center(
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 16),
                        const SizedBox(width: 4),
                        Text('exam_clone.review_queue.stats.correct'.tr(namedArgs: {'count': '${stats['correct']}'}), style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 12),
                        const Icon(Icons.cancel, color: Colors.red, size: 16),
                        const SizedBox(width: 4),
                        Text('exam_clone.review_queue.stats.incorrect'.tr(namedArgs: {'count': '${stats['incorrect']}'}), style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 12),
                        Text(
                          'exam_clone.review_queue.stats.progress'.tr(namedArgs: {'current': '${currentIndex + 1}', 'total': '${queue.length}'}),
                          style: const TextStyle(fontSize: 14, color: AppColors.grey600),
                        ),
                      ],
                    ),
                  ),
                ),
              ]
            : null,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (phase) {
      case ReviewPhase.loading:
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text('exam_clone.review_queue.loading'.tr()),
            ],
          ),
        );

      case ReviewPhase.empty:
        return _buildEmptyState();

      case ReviewPhase.question:
        return _buildQuestionView();

      case ReviewPhase.complete:
        return _buildCompleteView();
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.psychology,
                size: 40,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'exam_clone.review_queue.empty.title'.tr(),
              style: AppTextStyles.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              error ?? 'exam_clone.review_queue.empty.message'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: Text('exam_clone.review_queue.empty.back_button'.tr()),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _fetchReviewQueue,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: Text('exam_clone.review_queue.empty.refresh_button'.tr()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9333EA),
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionView() {
    if (currentQuestion == null) return const SizedBox();

    final difficultyColor = _getDifficultyColor(currentQuestion!.difficulty);
    final progress = (currentIndex + 1) / queue.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: AppColors.grey200,
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF9333EA)),
            ),
          ),

          const SizedBox(height: 16),

          // Metadata
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: difficultyColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  currentQuestion!.difficulty,
                  style: TextStyle(
                    color: difficultyColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.grey200,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  currentQuestion!.topic,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'exam_clone.review_queue.review_number'.tr(namedArgs: {'count': '${currentQuestion!.repetitions + 1}'}),
                  style: const TextStyle(
                    color: Color(0xFF3B82F6),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (currentQuestion!.examCloneName.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.grey200,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.access_time, size: 12, color: AppColors.grey600),
                      const SizedBox(width: 4),
                      Text(
                        currentQuestion!.examCloneName,
                        style: const TextStyle(fontSize: 12, color: AppColors.grey600),
                      ),
                    ],
                  ),
                ),
            ],
          ),

          const SizedBox(height: 16),

          // Question
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.grey300),
            ),
            child: Text(
              currentQuestion!.question,
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.w600,
                height: 1.5,
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Options or Text Input
          if (currentQuestion!.options != null &&
              currentQuestion!.options!.isNotEmpty)
            ..._buildOptions()
          else
            _buildTextInput(),

          const SizedBox(height: 20),

          // AI Feedback (for written answers)
          if (showAnswer && aiFeedback != null) ...[
            _buildAIFeedback(),
            const SizedBox(height: 12),
          ],

          // Get AI Explanation button (show after checking answer)
          if (showAnswer && explanation == null) ...[
            _buildExplanationButton(),
            const SizedBox(height: 12),
          ],

          // Detailed Explanation (after clicking button)
          if (showAnswer && explanation != null) ...[
            _buildExplanation(),
            const SizedBox(height: 12),
          ],

          // Action Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isCheckingAnswer
                  ? null
                  : (showAnswer
                      ? (isSubmitting ? null : _handleNext)
                      : _handleCheckAnswer),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF9333EA),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: isCheckingAnswer
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'exam_clone.review_queue.ai_evaluating'.tr(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    )
                  : Text(
                      showAnswer
                          ? (currentIndex + 1 >= queue.length
                              ? 'exam_clone.review_queue.finish_review'.tr()
                              : 'exam_clone.review_queue.next_question'.tr())
                          : 'exam_clone.review_queue.check_answer'.tr(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildOptions() {
    return currentQuestion!.options!.asMap().entries.map((entry) {
      final index = entry.key;
      final option = entry.value;
      final isSelected = selectedAnswer == index;
      final isCorrect = option == currentQuestion!.correctAnswer;
      final showCorrect = showAnswer && isCorrect;
      final showIncorrect = showAnswer && isSelected && !isCorrect;

      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: showAnswer ? null : () => _handleSelectAnswer(index),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: showCorrect
                  ? Colors.green.withOpacity(0.1)
                  : showIncorrect
                      ? Colors.red.withOpacity(0.1)
                      : isSelected
                          ? const Color(0xFF9333EA).withOpacity(0.1)
                          : Colors.white,
              border: Border.all(
                color: showCorrect
                    ? Colors.green
                    : showIncorrect
                        ? Colors.red
                        : isSelected
                            ? const Color(0xFF9333EA)
                            : AppColors.grey300,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: showCorrect
                        ? Colors.green
                        : showIncorrect
                            ? Colors.red
                            : isSelected
                                ? const Color(0xFF9333EA)
                                : AppColors.grey300,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      String.fromCharCode(65 + index),
                      style: TextStyle(
                        color: showCorrect || showIncorrect || isSelected
                            ? Colors.white
                            : AppColors.grey700,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    option,
                    style: AppTextStyles.bodyMedium,
                  ),
                ),
                if (showCorrect)
                  const Icon(Icons.check_circle, color: Colors.green, size: 20),
                if (showIncorrect)
                  const Icon(Icons.cancel, color: Colors.red, size: 20),
              ],
            ),
          ),
        ),
      );
    }).toList();
  }

  Widget _buildTextInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'exam_clone.review_queue.type_answer'.tr(),
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.grey600,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _answerController,
          enabled: !showAnswer,
          minLines: 3,
          maxLines: 8,
          keyboardType: TextInputType.multiline,
          textInputAction: TextInputAction.newline,
          decoration: InputDecoration(
            hintText: 'exam_clone.review_queue.type_answer_hint'.tr(),
            filled: true,
            fillColor: showAnswer ? AppColors.grey100 : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.grey300, width: 2),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.grey300, width: 2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF9333EA), width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.grey300, width: 2),
            ),
          ),
        ),
        if (showAnswer) ...[
          const SizedBox(height: 12),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: '${'exam_clone.review_queue.correct_answer'.tr(namedArgs: {'answer': ''})} ',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                  ),
                ),
                TextSpan(
                  text: currentQuestion!.correctAnswer,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildExplanationButton() {
    return OutlinedButton.icon(
      onPressed: loadingExplanation ? null : _handleGetExplanation,
      icon: loadingExplanation
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.lightbulb_outline, size: 18),
      label: Text(
        loadingExplanation ? 'exam_clone.review_queue.getting_explanation'.tr() : 'exam_clone.review_queue.get_ai_explanation'.tr(),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      ),
    );
  }

  Widget _buildAIFeedback() {
    final isCorrect = _lastAnswerCorrect;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: (isCorrect ? Colors.green : Colors.orange).withOpacity(0.1),
        border: Border.all(
            color: (isCorrect ? Colors.green : Colors.orange).withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isCorrect ? Icons.check_circle : Icons.info,
                color: isCorrect ? Colors.green : Colors.orange,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                'exam_clone.review_queue.ai_evaluation'.tr(),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: isCorrect ? Colors.green[700] : Colors.orange[700],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            aiFeedback!,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.grey700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExplanation() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.1),
        border: Border.all(color: Colors.amber.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb, color: Colors.amber, size: 18),
              const SizedBox(width: 8),
              Text(
                'exam_clone.review_queue.ai_explanation'.tr(),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: Colors.amber[700],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            explanation!,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.grey700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompleteView() {
    final total = stats['total'] ?? 0;
    final correct = stats['correct'] ?? 0;
    final incorrect = stats['incorrect'] ?? 0;
    final accuracy = total > 0 ? (correct / total * 100).round() : 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 32),
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle,
              size: 48,
              color: Colors.green,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'exam_clone.review_queue.complete.title'.tr(),
            style: AppTextStyles.headlineMedium.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'exam_clone.review_queue.complete.message'.tr(),
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: 32),

          // Stats
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  icon: Icons.check_circle,
                  color: Colors.green,
                  value: '$correct',
                  label: 'exam_clone.review_queue.complete.correct'.tr(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  icon: Icons.cancel,
                  color: Colors.red,
                  value: '$incorrect',
                  label: 'exam_clone.review_queue.complete.incorrect'.tr(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  icon: Icons.quiz,
                  color: const Color(0xFF9333EA),
                  value: '$total',
                  label: 'exam_clone.review_queue.complete.total'.tr(),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Accuracy
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.grey300),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'exam_clone.review_queue.complete.accuracy'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '$accuracy%',
                      style: AppTextStyles.titleLarge.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: accuracy / 100,
                    minHeight: 12,
                    backgroundColor: AppColors.grey200,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Tip
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.1),
              border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.trending_up, color: Color(0xFF3B82F6), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'exam_clone.review_queue.complete.tip_title'.tr(),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: const Color(0xFF3B82F6),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'exam_clone.review_queue.complete.tip_message'.tr(),
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.grey600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: Text('exam_clone.review_queue.complete.back_button'.tr()),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _handleRestart,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: Text('exam_clone.review_queue.complete.review_more'.tr()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF9333EA),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color color,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.headlineSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}
