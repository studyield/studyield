import 'dart:async';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/exam_question_entity.dart';

enum PracticePhase { setup, inProgress, results, review }

class UserAnswer {
  final String questionId;
  final String answer;
  final bool flagged;
  final int timeSpent;

  UserAnswer({
    required this.questionId,
    required this.answer,
    this.flagged = false,
    this.timeSpent = 0,
  });

  UserAnswer copyWith({
    String? answer,
    bool? flagged,
    int? timeSpent,
  }) {
    return UserAnswer(
      questionId: questionId,
      answer: answer ?? this.answer,
      flagged: flagged ?? this.flagged,
      timeSpent: timeSpent ?? this.timeSpent,
    );
  }
}

class PracticeScreen extends StatefulWidget {
  final String examId;

  const PracticeScreen({super.key, required this.examId});

  @override
  State<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends State<PracticeScreen> {
  final ApiClient _apiClient = ApiClient.instance;

  PracticePhase _phase = PracticePhase.setup;
  List<ExamQuestionEntity> _allQuestions = [];
  List<ExamQuestionEntity> _selectedQuestions = [];
  int _currentIndex = 0;
  Map<String, UserAnswer> _answers = {};
  int _timeRemaining = 0;
  int _totalTime = 0;
  bool _isLoading = true;
  Timer? _timer;
  DateTime _questionStartTime = DateTime.now();

  // Setup options
  int _questionCount = 10;
  int _timeLimit = 30;
  bool _includeOriginal = true;
  bool _includeGenerated = true;
  Set<String> _bookmarkedIds = {};

  @override
  void initState() {
    super.initState();
    _fetchQuestions();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchQuestions() async {
    try {
      final response = await _apiClient.get('/exam-clones/${widget.examId}/questions');
      final List<dynamic> data = response.data;
      setState(() {
        _allQuestions = data.map((q) {
          return ExamQuestionEntity(
            id: q['id'],
            examCloneId: q['examCloneId'],
            isOriginal: q['isOriginal'] ?? true,
            questionText: q['question'],
            options: q['options'] != null ? List<String>.from(q['options']) : [],
            correctAnswer: q['correctAnswer'],
            explanation: q['explanation'],
            difficulty: q['difficulty'] ?? 'medium',
            tags: q['topic'] != null ? [q['topic']] : [],
            createdAt: DateTime.parse(q['createdAt'] ?? DateTime.now().toIso8601String()),
          );
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _startExam() {
    var available = [..._allQuestions];
    if (!_includeOriginal) available = available.where((q) => !q.isOriginal).toList();
    if (!_includeGenerated) available = available.where((q) => q.isOriginal).toList();

    if (available.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('exam_clone.practice.no_questions_available'.tr())),
      );
      return;
    }

    available.shuffle();
    final selected = available.take(_questionCount).toList();

    setState(() {
      _selectedQuestions = selected;
      _timeRemaining = _timeLimit * 60;
      _totalTime = _timeLimit * 60;
      _currentIndex = 0;
      _answers = {};
      _questionStartTime = DateTime.now();
      _phase = PracticePhase.inProgress;
    });

    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeRemaining > 0) {
        setState(() => _timeRemaining--);
      } else {
        _handleSubmit();
      }
    });
  }

  void _handleAnswer(String answer) {
    final q = _selectedQuestions[_currentIndex];
    final timeSpent = DateTime.now().difference(_questionStartTime).inSeconds;

    setState(() {
      _answers[q.id] = UserAnswer(
        questionId: q.id,
        answer: answer,
        flagged: _answers[q.id]?.flagged ?? false,
        timeSpent: (_answers[q.id]?.timeSpent ?? 0) + timeSpent,
      );
      _questionStartTime = DateTime.now();
    });
  }

  void _toggleFlag() {
    final q = _selectedQuestions[_currentIndex];
    setState(() {
      final existing = _answers[q.id];
      _answers[q.id] = UserAnswer(
        questionId: q.id,
        answer: existing?.answer ?? '',
        flagged: !(existing?.flagged ?? false),
        timeSpent: existing?.timeSpent ?? 0,
      );
    });
  }

  Future<void> _toggleBookmark(String questionId) async {
    final isBookmarked = _bookmarkedIds.contains(questionId);
    try {
      if (isBookmarked) {
        await _apiClient.delete('/exam-clones/bookmarks/$questionId');
        setState(() => _bookmarkedIds.remove(questionId));
      } else {
        await _apiClient.post('/exam-clones/bookmarks/$questionId');
        setState(() => _bookmarkedIds.add(questionId));
      }
    } catch (e) {
      debugPrint('Failed to toggle bookmark: $e');
    }
  }

  void _goToQuestion(int index) {
    final timeSpent = DateTime.now().difference(_questionStartTime).inSeconds;
    final current = _selectedQuestions[_currentIndex];

    if (_answers.containsKey(current.id)) {
      setState(() {
        _answers[current.id] = _answers[current.id]!.copyWith(
          timeSpent: _answers[current.id]!.timeSpent + timeSpent,
        );
      });
    }

    setState(() {
      _currentIndex = index;
      _questionStartTime = DateTime.now();
    });
  }

  Future<void> _handleSubmit() async {
    _timer?.cancel();

    try {
      final answersArray = _selectedQuestions.map((q) {
        final userAnswer = _answers[q.id];
        return {
          'questionId': q.id,
          'answer': userAnswer?.answer ?? '',
          'timeSpent': userAnswer?.timeSpent ?? 0,
        };
      }).toList();

      await _apiClient.post(
        '/exam-clones/${widget.examId}/attempt',
        data: {
          'answers': answersArray,
          'totalTime': _totalTime - _timeRemaining,
        },
      );
    } catch (e) {
      debugPrint('Submit failed: $e');
    }

    setState(() => _phase = PracticePhase.results);
  }

  Map<String, int> _calculateResults() {
    int correct = 0, incorrect = 0, unanswered = 0;

    for (var q in _selectedQuestions) {
      final userAnswer = _answers[q.id];
      if (userAnswer == null || userAnswer.answer.isEmpty) {
        unanswered++;
      } else if (userAnswer.answer == q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    }

    final score = ((correct / _selectedQuestions.length) * 100).round();
    final timeTaken = _totalTime - _timeRemaining;

    return {
      'correct': correct,
      'incorrect': incorrect,
      'unanswered': unanswered,
      'score': score,
      'timeTaken': timeTaken,
    };
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('exam_clone.practice.title'.tr())),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    switch (_phase) {
      case PracticePhase.setup:
        return _buildSetupScreen();
      case PracticePhase.inProgress:
        return _buildInProgressScreen();
      case PracticePhase.results:
        return _buildResultsScreen();
      case PracticePhase.review:
        return _buildReviewScreen();
    }
  }

  Widget _buildSetupScreen() {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('exam_clone.practice.practice_exam'.tr()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF9333EA).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, color: Color(0xFF9333EA), size: 40),
            ),
            const SizedBox(height: 24),
            Text(
              'exam_clone.practice.practice_exam'.tr(),
              style: AppTextStyles.headlineMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            Text(
              'exam_clone.practice.questions_available'.tr(namedArgs: {'count': '${_allQuestions.length}'}),
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
            ),
            const SizedBox(height: 32),

            _buildSetupSection(
              'exam_clone.practice.setup.number_of_questions'.tr(),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [5, 10, 15, 20].map((n) {
                  return _buildOptionButton('$n', _questionCount == n, () {
                    setState(() => _questionCount = n);
                  });
                }).toList()
                  ..add(_buildOptionButton(
                    'exam_clone.practice.setup.all'.tr(),
                    _questionCount == _allQuestions.length && _questionCount > 20,
                    () => setState(() => _questionCount = _allQuestions.length),
                  )),
              ),
            ),

            const SizedBox(height: 20),

            _buildSetupSection(
              'exam_clone.practice.setup.time_limit_minutes'.tr(),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [15, 30, 45, 60, 90].map((t) {
                  return _buildOptionButton('exam_clone.practice.setup.minutes'.tr(namedArgs: {'time': '$t'}), _timeLimit == t, () {
                    setState(() => _timeLimit = t);
                  });
                }).toList(),
              ),
            ),

            const SizedBox(height: 20),

            _buildSetupSection(
              'exam_clone.practice.setup.include_questions'.tr(),
              Column(
                children: [
                  CheckboxListTile(
                    title: Text('exam_clone.practice.setup.original_questions'.tr()),
                    value: _includeOriginal,
                    onChanged: (v) => setState(() => _includeOriginal = v!),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                  CheckboxListTile(
                    title: Text('exam_clone.practice.setup.ai_questions'.tr()),
                    value: _includeGenerated,
                    onChanged: (v) => setState(() => _includeGenerated = v!),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: (!_includeOriginal && !_includeGenerated) ? null : _startExam,
                icon: const Icon(Icons.play_arrow),
                label: Text('exam_clone.practice.setup.start_practice'.tr()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF9333EA),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInProgressScreen() {
    final q = _selectedQuestions[_currentIndex];
    final userAnswer = _answers[q.id];
    final answeredCount = _answers.values.where((a) => a.answer.isNotEmpty).length;
    final flaggedCount = _answers.values.where((a) => a.flagged).length;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: _showExitConfirmation,
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'exam_clone.practice.progress.question_of'.tr(namedArgs: {'current': '${_currentIndex + 1}', 'total': '${_selectedQuestions.length}'}),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            Text(
              flaggedCount > 0
                ? 'exam_clone.practice.progress.answered'.tr(namedArgs: {'count': '$answeredCount'}) + ' • ' + 'exam_clone.practice.progress.flagged'.tr(namedArgs: {'count': '$flaggedCount'})
                : 'exam_clone.practice.progress.answered'.tr(namedArgs: {'count': '$answeredCount'}),
              style: const TextStyle(fontSize: 11, color: AppColors.grey600),
            ),
          ],
        ),
        actions: [
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: _timeRemaining < 300 ? Colors.red.withOpacity(0.1) : AppColors.grey200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.access_time, size: 14,
                      color: _timeRemaining < 300 ? Colors.red : AppColors.grey700),
                  const SizedBox(width: 4),
                  Text(
                    _formatTime(_timeRemaining),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: _timeRemaining < 300 ? Colors.red : AppColors.grey700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ElevatedButton(
              onPressed: _showSubmitConfirmation,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF9333EA),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text('exam_clone.practice.actions.submit'.tr(), style: const TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: answeredCount / _selectedQuestions.length,
            backgroundColor: AppColors.grey200,
            valueColor: const AlwaysStoppedAnimation(Color(0xFF9333EA)),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getDifficultyColor(q.difficulty).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          q.difficulty,
                          style: TextStyle(
                            color: _getDifficultyColor(q.difficulty),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (q.tags.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.grey200,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(q.tags.first, style: const TextStyle(fontSize: 11)),
                        ),
                      ],
                      const Spacer(),
                      IconButton(
                        icon: Icon(
                          _bookmarkedIds.contains(q.id)
                              ? Icons.bookmark
                              : Icons.bookmark_border,
                          color: _bookmarkedIds.contains(q.id)
                              ? const Color(0xFF3B82F6)
                              : AppColors.grey600,
                        ),
                        onPressed: () => _toggleBookmark(q.id),
                        tooltip: 'exam_clone.practice.bookmark_tooltip'.tr(),
                      ),
                      IconButton(
                        icon: Icon(
                          userAnswer?.flagged ?? false ? Icons.flag : Icons.flag_outlined,
                          color: userAnswer?.flagged ?? false ? Colors.amber : AppColors.grey600,
                        ),
                        onPressed: _toggleFlag,
                        tooltip: 'exam_clone.practice.flag_tooltip'.tr(),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.grey300),
                    ),
                    child: Text(q.questionText,
                        style: AppTextStyles.titleMedium.copyWith(height: 1.5)),
                  ),

                  const SizedBox(height: 20),

                  if (q.options.isNotEmpty)
                    ...q.options.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final option = entry.value;
                      final isSelected = userAnswer?.answer == option;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => _handleAnswer(option),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF9333EA).withOpacity(0.1)
                                  : Colors.white,
                              border: Border.all(
                                color: isSelected
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
                                    color: isSelected
                                        ? const Color(0xFF9333EA)
                                        : AppColors.grey300,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Center(
                                    child: Text(
                                      String.fromCharCode(65 + idx),
                                      style: TextStyle(
                                        color: isSelected ? Colors.white : AppColors.grey700,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(child: Text(option)),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList()
                  else
                    TextFormField(
                      key: ValueKey('question_${q.id}'),
                      initialValue: userAnswer?.answer ?? '',
                      onChanged: _handleAnswer,
                      decoration: InputDecoration(
                        hintText: 'exam_clone.practice.actions.type_answer'.tr(),
                        filled: true,
                        fillColor: Colors.white,
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
                      ),
                      maxLines: 4,
                    ),
                ],
              ),
            ),
          ),

          // Navigation
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.grey300)),
            ),
            child: Column(
              children: [
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _selectedQuestions.length,
                    itemBuilder: (context, index) {
                      final answer = _answers[_selectedQuestions[index].id];
                      final isAnswered = answer != null && answer.answer.isNotEmpty;
                      final isFlagged = answer?.flagged ?? false;
                      final isCurrent = index == _currentIndex;

                      return GestureDetector(
                        onTap: () => _goToQuestion(index),
                        child: Container(
                          width: 32,
                          height: 32,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: isFlagged
                                ? Colors.amber
                                : isAnswered
                                    ? Colors.green
                                    : AppColors.grey300,
                            shape: BoxShape.circle,
                            border: isCurrent
                                ? Border.all(color: const Color(0xFF9333EA), width: 2)
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              '${index + 1}',
                              style: TextStyle(
                                color: isAnswered || isFlagged
                                    ? Colors.white
                                    : AppColors.grey700,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed:
                            _currentIndex > 0 ? () => _goToQuestion(_currentIndex - 1) : null,
                        icon: const Icon(Icons.chevron_left, size: 18),
                        label: Text('exam_clone.practice.actions.previous'.tr()),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _currentIndex < _selectedQuestions.length - 1
                            ? () => _goToQuestion(_currentIndex + 1)
                            : null,
                        icon: const Icon(Icons.chevron_right, size: 18),
                        label: Text('exam_clone.practice.actions.next'.tr()),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsScreen() {
    final results = _calculateResults();
    final score = results['score']!;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('exam_clone.practice.results.title'.tr()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: (score >= 80 ? Colors.green : score >= 60 ? Colors.amber : Colors.red)
                    .withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$score%',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: score >= 80 ? Colors.green : score >= 60 ? Colors.amber : Colors.red,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              score >= 80
                ? 'exam_clone.practice.results.excellent'.tr()
                : score >= 60
                  ? 'exam_clone.practice.results.good_job'.tr()
                  : 'exam_clone.practice.results.keep_practicing'.tr(),
              style: AppTextStyles.headlineMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),

            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2,
              children: [
                _buildStatCard('exam_clone.practice.results.correct'.tr(), '${results['correct']}', Colors.green),
                _buildStatCard('exam_clone.practice.results.incorrect'.tr(), '${results['incorrect']}', Colors.red),
                _buildStatCard('exam_clone.practice.results.unanswered'.tr(), '${results['unanswered']}', AppColors.grey600),
                _buildStatCard('exam_clone.practice.results.time'.tr(), _formatTime(results['timeTaken']!),
                    const Color(0xFF3B82F6)),
              ],
            ),

            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => setState(() => _phase = PracticePhase.review),
                icon: const Icon(Icons.book_outlined),
                label: Text('exam_clone.practice.results.review_answers'.tr()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF9333EA),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _phase = PracticePhase.setup;
                    _currentIndex = 0;
                    _answers = {};
                  });
                },
                icon: const Icon(Icons.refresh),
                label: Text('exam_clone.practice.results.try_again'.tr()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewScreen() {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _phase = PracticePhase.results),
        ),
        title: Text('exam_clone.practice.review.title'.tr()),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _selectedQuestions.length,
        itemBuilder: (context, index) {
          final q = _selectedQuestions[index];
          final userAnswer = _answers[q.id];
          final isCorrect = userAnswer?.answer == q.correctAnswer;
          final wasAnswered = userAnswer != null && userAnswer.answer.isNotEmpty;

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.grey300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: wasAnswered
                            ? (isCorrect ? Colors.green : Colors.red).withOpacity(0.1)
                            : AppColors.grey200,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        wasAnswered ? (isCorrect ? Icons.check : Icons.close) : Icons.remove,
                        color: wasAnswered
                            ? (isCorrect ? Colors.green : Colors.red)
                            : AppColors.grey600,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'exam_clone.practice.review.question_number'.tr(namedArgs: {'number': '${index + 1}'}),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(q.questionText, style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 12),

                if (q.options.isNotEmpty)
                  ...q.options.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final option = entry.value;
                    final isCorrectAnswer = option == q.correctAnswer;
                    final isUserAnswer = option == userAnswer?.answer;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isCorrectAnswer
                            ? Colors.green.withOpacity(0.1)
                            : isUserAnswer
                                ? Colors.red.withOpacity(0.1)
                                : AppColors.grey100,
                        border: Border.all(
                          color: isCorrectAnswer
                              ? Colors.green
                              : isUserAnswer
                                  ? Colors.red
                                  : AppColors.grey300,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Text(
                            '${String.fromCharCode(65 + idx)}.',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isCorrectAnswer
                                  ? Colors.green
                                  : isUserAnswer
                                      ? Colors.red
                                      : null,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(option)),
                          if (isCorrectAnswer)
                            const Icon(Icons.check_circle, color: Colors.green, size: 18),
                          if (isUserAnswer && !isCorrectAnswer)
                            const Icon(Icons.cancel, color: Colors.red, size: 18),
                        ],
                      ),
                    );
                  }).toList(),

                if (q.explanation != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.lightbulb_outline, color: Color(0xFF3B82F6), size: 14),
                            const SizedBox(width: 4),
                            Text(
                              'exam_clone.practice.review.explanation'.tr(),
                              style: const TextStyle(
                                color: Color(0xFF3B82F6),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(q.explanation!, style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSetupSection(String title, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        content,
      ],
    );
  }

  Widget _buildOptionButton(String label, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? const Color(0xFF9333EA) : AppColors.grey300,
            width: isSelected ? 2 : 1,
          ),
          color: isSelected ? const Color(0xFF9333EA).withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? const Color(0xFF9333EA) : AppColors.grey700,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
          ),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.grey600)),
        ],
      ),
    );
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

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }

  void _showSubmitConfirmation() {
    final answeredCount = _answers.values.where((a) => a.answer.isNotEmpty).length;
    final unansweredCount = _selectedQuestions.length - answeredCount;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('exam_clone.practice.dialogs.submit_title'.tr()),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
                'exam_clone.practice.dialogs.submit_message'.tr(namedArgs: {'answered': '$answeredCount', 'total': '${_selectedQuestions.length}'})),
            if (unansweredCount > 0) ...[
              const SizedBox(height: 8),
              Text(
                'exam_clone.practice.dialogs.unanswered_warning'.tr(namedArgs: {'count': '$unansweredCount'}),
                style: const TextStyle(color: Colors.amber),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('exam_clone.practice.dialogs.continue_exam'.tr()),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handleSubmit();
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF9333EA)),
            child: Text('exam_clone.practice.dialogs.submit'.tr()),
          ),
        ],
      ),
    );
  }

  void _showExitConfirmation() {
    final answeredCount = _answers.values.where((a) => a.answer.isNotEmpty).length;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('exam_clone.practice.dialogs.exit_title'.tr()),
        content: Text(
          'exam_clone.practice.dialogs.exit_message'.tr(namedArgs: {'answered': '$answeredCount', 'total': '${_selectedQuestions.length}'}),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('exam_clone.practice.dialogs.continue_exam'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('exam_clone.practice.dialogs.exit'.tr()),
          ),
        ],
      ),
    );
  }
}
