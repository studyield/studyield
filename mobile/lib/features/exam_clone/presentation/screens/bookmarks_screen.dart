import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../config/api_config.dart';

class BookmarkedQuestion {
  final String id;
  final String question;
  final String correctAnswer;
  final List<String>? options;
  final String difficulty;
  final String? topic;
  final String examCloneId;
  final String examTitle;
  final String? bookmarkNote;
  final String bookmarkedAt;

  BookmarkedQuestion({
    required this.id,
    required this.question,
    required this.correctAnswer,
    this.options,
    required this.difficulty,
    this.topic,
    required this.examCloneId,
    required this.examTitle,
    this.bookmarkNote,
    required this.bookmarkedAt,
  });

  factory BookmarkedQuestion.fromJson(Map<String, dynamic> json) {
    return BookmarkedQuestion(
      id: json['id'],
      question: json['question'],
      correctAnswer: json['correctAnswer'],
      options: json['options'] != null ? List<String>.from(json['options']) : null,
      difficulty: json['difficulty'] ?? 'Unknown',
      topic: json['topic'],
      examCloneId: json['examCloneId'],
      examTitle: json['examTitle'],
      bookmarkNote: json['bookmarkNote'],
      bookmarkedAt: json['bookmarkedAt'],
    );
  }
}

class BookmarksScreen extends StatefulWidget {
  const BookmarksScreen({super.key});

  @override
  State<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends State<BookmarksScreen> {
  final ApiClient _apiClient = ApiClient.instance;
  List<BookmarkedQuestion> questions = [];
  bool isLoading = true;
  String? removingId;
  String? expandedId;

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    setState(() => isLoading = true);

    try {
      final response = await _apiClient.get(Endpoints.bookmarks);
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        setState(() {
          questions = data.map((q) => BookmarkedQuestion.fromJson(q)).toList();
          isLoading = false;
        });
      } else {
        throw Exception('Failed to load bookmarks');
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load bookmarks: $e')),
        );
      }
    }
  }

  Future<void> _removeBookmark(String questionId) async {
    setState(() => removingId = questionId);

    try {
      await _apiClient.delete(Endpoints.bookmark(questionId));
      setState(() {
        questions.removeWhere((q) => q.id == questionId);
        removingId = null;
      });
    } catch (e) {
      setState(() => removingId = null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to remove bookmark: $e')),
        );
      }
    }
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

  Map<String, List<BookmarkedQuestion>> _groupByExam() {
    final Map<String, List<BookmarkedQuestion>> grouped = {};
    for (var q in questions) {
      if (!grouped.containsKey(q.examCloneId)) {
        grouped[q.examCloneId] = [];
      }
      grouped[q.examCloneId]!.add(q);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final groupedByExam = _groupByExam();

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                gradient: const LinearGradient(
                  colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Icon(
                Icons.bookmark,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'exam_clone.bookmarks.title'.tr(),
                  style: AppTextStyles.titleMedium.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'exam_clone.bookmarks.subtitle'.tr(),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchBookmarks,
              child: questions.isEmpty
                  ? _buildEmptyState()
                  : SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Stats Card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.grey300),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${questions.length}',
                                      style: AppTextStyles.headlineLarge.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      'exam_clone.bookmarks.stats_label'.tr(),
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.grey600,
                                      ),
                                    ),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${groupedByExam.length}',
                                      style: AppTextStyles.titleLarge.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      'exam_clone.bookmarks.from_exams_label'.tr(),
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.grey600,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Questions by Exam
                          ...groupedByExam.entries.map((entry) {
                            final examId = entry.key;
                            final examQuestions = entry.value;
                            final examTitle = examQuestions.first.examTitle;

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Exam Header
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.description,
                                      size: 20,
                                      color: Color(0xFF9333EA),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        examTitle,
                                        style: AppTextStyles.titleMedium.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '(${examQuestions.length})',
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.grey600,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Questions
                                ...examQuestions.map((q) => _buildQuestionCard(q)),

                                const SizedBox(height: 24),
                              ],
                            );
                          }),
                        ],
                      ),
                    ),
            ),
    );
  }

  Widget _buildQuestionCard(BookmarkedQuestion q) {
    final isExpanded = expandedId == q.id;
    final difficultyColor = _getDifficultyColor(q.difficulty);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey300),
      ),
      child: Column(
        children: [
          // Question Header
          InkWell(
            onTap: () => setState(() => expandedId = isExpanded ? null : q.id),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.bookmark,
                        color: Color(0xFF3B82F6),
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          q.question,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: isExpanded ? null : 2,
                          overflow: isExpanded ? null : TextOverflow.ellipsis,
                        ),
                      ),
                      if (removingId == q.id)
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      else
                        IconButton(
                          icon: const Icon(Icons.delete, size: 20),
                          color: Colors.red,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => _removeBookmark(q.id),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: difficultyColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          q.difficulty,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: difficultyColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (q.topic != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.grey200,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            q.topic!,
                            style: AppTextStyles.bodySmall.copyWith(
                              fontSize: 11,
                            ),
                          ),
                        ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.access_time, size: 12, color: AppColors.grey600),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(q.bookmarkedAt),
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.grey600,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Expanded Content
          if (isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Options or Answer
                  if (q.options != null && q.options!.isNotEmpty) ...[
                    Text(
                      'exam_clone.bookmarks.options'.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...q.options!.asMap().entries.map((entry) {
                      final index = entry.key;
                      final option = entry.value;
                      final isCorrect = option == q.correctAnswer;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isCorrect
                              ? Colors.green.withOpacity(0.1)
                              : AppColors.grey100,
                          border: Border.all(
                            color: isCorrect
                                ? Colors.green.withOpacity(0.3)
                                : AppColors.grey300,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Text(
                              '${String.fromCharCode(65 + index)}.',
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isCorrect ? Colors.green : null,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                option,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: isCorrect ? Colors.green : null,
                                ),
                              ),
                            ),
                            if (isCorrect)
                              Text(
                                'exam_clone.bookmarks.correct'.tr(),
                                style: const TextStyle(
                                  color: Colors.green,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                          ],
                        ),
                      );
                    }),
                  ] else ...[
                    Text(
                      'exam_clone.bookmarks.correct_answer'.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey600,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        border: Border.all(
                          color: Colors.green.withOpacity(0.3),
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        q.correctAnswer,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.green,
                        ),
                      ),
                    ),
                  ],

                  // Note
                  if (q.bookmarkNote != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.note, size: 16, color: Colors.amber),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              q.bookmarkNote!,
                              style: AppTextStyles.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
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
                color: const Color(0xFF3B82F6).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.bookmark_border,
                size: 40,
                color: Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'exam_clone.bookmarks.empty_title'.tr(),
              style: AppTextStyles.titleLarge.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'exam_clone.bookmarks.empty_message'.tr(),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.grey600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
              ),
              child: Text('exam_clone.bookmarks.start_practicing'.tr()),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    final date = DateTime.parse(dateString);
    return '${date.day}/${date.month}/${date.year}';
  }
}
