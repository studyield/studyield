import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../../domain/entities/exam_clone_entity.dart';
import '../../domain/entities/exam_question_entity.dart';
import '../../../../core/theme/app_colors.dart';

/// Filter enum for question selection
enum QuestionFilter { all, original, generated }

/// Modal dialog for configuring and exporting exam clone as PDF.
class ExportPdfModal extends StatefulWidget {
  final ExamCloneEntity exam;
  final List<ExamQuestionEntity> questions;

  const ExportPdfModal({
    super.key,
    required this.exam,
    required this.questions,
  });

  @override
  State<ExportPdfModal> createState() => _ExportPdfModalState();
}

class _ExportPdfModalState extends State<ExportPdfModal> {
  bool _includeAnswers = false;
  bool _includeExplanations = false;
  QuestionFilter _questionFilter = QuestionFilter.all;
  bool _isGenerating = false;

  List<ExamQuestionEntity> get _filteredQuestions {
    switch (_questionFilter) {
      case QuestionFilter.all:
        return widget.questions;
      case QuestionFilter.original:
        return widget.questions.where((q) => q.isOriginal).toList();
      case QuestionFilter.generated:
        return widget.questions.where((q) => !q.isOriginal).toList();
    }
  }

  Map<String, int> get _difficultyDistribution {
    final map = <String, int>{};
    for (final q in _filteredQuestions) {
      final key = q.difficulty.isNotEmpty
          ? q.difficulty[0].toUpperCase() + q.difficulty.substring(1).toLowerCase()
          : 'Unknown';
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }

  Future<void> _handleExport() async {
    setState(() => _isGenerating = true);

    try {
      final questions = _filteredQuestions;
      if (questions.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('exam_clone.export.no_questions'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          setState(() => _isGenerating = false);
        }
        return;
      }

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) => _generatePdf(format, questions),
        name: '${widget.exam.title} - Studyield',
      );

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate PDF: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
        setState(() => _isGenerating = false);
      }
    }
  }

  Future<Uint8List> _generatePdf(
    PdfPageFormat format,
    List<ExamQuestionEntity> questions,
  ) async {
    final pdf = pw.Document(
      theme: pw.ThemeData.withFont(
        base: await PdfGoogleFonts.interRegular(),
        bold: await PdfGoogleFonts.interBold(),
        boldItalic: await PdfGoogleFonts.interBoldItalic(),
        italic: await PdfGoogleFonts.interItalic(),
      ),
    );

    final accentColor = PdfColor.fromInt(0xFF9333EA);
    final accentLight = PdfColor.fromInt(0xFFF3E8FF);
    final greenColor = PdfColor.fromInt(0xFF10B981);
    final greenLight = PdfColor.fromInt(0xFFECFDF5);
    final greyColor = PdfColor.fromInt(0xFF757575);
    final lightGrey = PdfColor.fromInt(0xFFF5F5F5);
    final borderGrey = PdfColor.fromInt(0xFFE0E0E0);
    final darkText = PdfColor.fromInt(0xFF212121);
    final easyColor = PdfColor.fromInt(0xFF10B981);
    final mediumColor = PdfColor.fromInt(0xFFF59E0B);
    final hardColor = PdfColor.fromInt(0xFFEF4444);

    final now = DateTime.now();
    final dateFormatted = DateFormat('MMMM d, yyyy').format(now);
    final timeFormatted = DateFormat('h:mm a').format(now);
    final diffDist = _difficultyDistribution;

    // ---------- HELPER WIDGETS ----------

    pw.Widget buildDifficultyBadge(String difficulty) {
      final lower = difficulty.toLowerCase();
      PdfColor bgColor;
      PdfColor textColor;
      switch (lower) {
        case 'easy':
          bgColor = PdfColor.fromInt(0xFFECFDF5);
          textColor = easyColor;
          break;
        case 'medium':
          bgColor = PdfColor.fromInt(0xFFFFFBEB);
          textColor = mediumColor;
          break;
        case 'hard':
          bgColor = PdfColor.fromInt(0xFFFEF2F2);
          textColor = hardColor;
          break;
        default:
          bgColor = lightGrey;
          textColor = greyColor;
      }

      return pw.Container(
        padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: pw.BoxDecoration(
          color: bgColor,
          borderRadius: pw.BorderRadius.circular(4),
        ),
        child: pw.Text(
          difficulty[0].toUpperCase() + difficulty.substring(1),
          style: pw.TextStyle(
            fontSize: 8,
            fontWeight: pw.FontWeight.bold,
            color: textColor,
          ),
        ),
      );
    }

    pw.Widget buildOptionRow(String option, bool isCorrect) {
      return pw.Container(
        margin: const pw.EdgeInsets.only(bottom: 4),
        padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: pw.BoxDecoration(
          color: (_includeAnswers && isCorrect) ? greenLight : PdfColors.white,
          border: pw.Border.all(
            color: (_includeAnswers && isCorrect) ? greenColor : borderGrey,
            width: (_includeAnswers && isCorrect) ? 1.5 : 0.5,
          ),
          borderRadius: pw.BorderRadius.circular(4),
        ),
        child: pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            if (_includeAnswers && isCorrect)
              pw.Padding(
                padding: const pw.EdgeInsets.only(right: 6),
                child: pw.Container(
                  width: 12,
                  height: 12,
                  decoration: pw.BoxDecoration(
                    color: greenColor,
                    shape: pw.BoxShape.circle,
                  ),
                  child: pw.Center(
                    child: pw.Text(
                      '✓',
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 7,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            pw.Expanded(
              child: pw.Text(
                option,
                style: pw.TextStyle(
                  fontSize: 10,
                  color: darkText,
                  fontWeight: (_includeAnswers && isCorrect)
                      ? pw.FontWeight.bold
                      : pw.FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Build the page footer
    pw.Widget buildFooter(pw.Context ctx) {
      return pw.Container(
        padding: const pw.EdgeInsets.only(top: 8),
        decoration: const pw.BoxDecoration(
          border: pw.Border(
            top: pw.BorderSide(color: PdfColor.fromInt(0xFFE0E0E0), width: 0.5),
          ),
        ),
        child: pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'Page ${ctx.pageNumber} of ${ctx.pagesCount}',
              style: pw.TextStyle(fontSize: 8, color: greyColor),
            ),
            pw.Text(
              'Generated by Studyield',
              style: pw.TextStyle(
                fontSize: 8,
                color: accentColor,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
          ],
        ),
      );
    }

    // ---------- TITLE / COVER PAGE ----------

    final titlePageWidgets = <pw.Widget>[
      // Purple header bar
      pw.Container(
        width: double.infinity,
        padding: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: pw.BoxDecoration(
          color: accentColor,
          borderRadius: pw.BorderRadius.circular(8),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              widget.exam.title,
              style: pw.TextStyle(
                fontSize: 22,
                fontWeight: pw.FontWeight.bold,
                color: PdfColors.white,
              ),
            ),
            if (widget.exam.subject != null &&
                widget.exam.subject!.isNotEmpty) ...[
              pw.SizedBox(height: 4),
              pw.Text(
                widget.exam.subject!,
                style: pw.TextStyle(
                  fontSize: 13,
                  color: PdfColor.fromInt(0xFFE9D5FF),
                ),
              ),
            ],
            pw.SizedBox(height: 10),
            pw.Row(
              children: [
                pw.Text(
                  'Generated: $dateFormatted at $timeFormatted',
                  style: pw.TextStyle(
                    fontSize: 9,
                    color: PdfColor.fromInt(0xFFD8B4FE),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),

      pw.SizedBox(height: 20),

      // Stats section
      pw.Container(
        width: double.infinity,
        padding: const pw.EdgeInsets.all(16),
        decoration: pw.BoxDecoration(
          color: lightGrey,
          borderRadius: pw.BorderRadius.circular(8),
          border: pw.Border.all(color: borderGrey, width: 0.5),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(
              'Exam Summary',
              style: pw.TextStyle(
                fontSize: 13,
                fontWeight: pw.FontWeight.bold,
                color: darkText,
              ),
            ),
            pw.SizedBox(height: 10),
            pw.Row(
              children: [
                _buildStatBox(
                  'Total Questions',
                  '${questions.length}',
                  accentColor,
                  accentLight,
                ),
                pw.SizedBox(width: 12),
                _buildStatBox(
                  'Original',
                  '${questions.where((q) => q.isOriginal).length}',
                  PdfColor.fromInt(0xFF3B82F6),
                  PdfColor.fromInt(0xFFEFF6FF),
                ),
                pw.SizedBox(width: 12),
                _buildStatBox(
                  'Generated',
                  '${questions.where((q) => !q.isOriginal).length}',
                  greenColor,
                  greenLight,
                ),
              ],
            ),
            if (diffDist.isNotEmpty) ...[
              pw.SizedBox(height: 12),
              pw.Text(
                'Difficulty Distribution',
                style: pw.TextStyle(
                  fontSize: 10,
                  fontWeight: pw.FontWeight.bold,
                  color: greyColor,
                ),
              ),
              pw.SizedBox(height: 6),
              pw.Row(
                children: diffDist.entries.map((entry) {
                  PdfColor chipColor;
                  switch (entry.key.toLowerCase()) {
                    case 'easy':
                      chipColor = easyColor;
                      break;
                    case 'medium':
                      chipColor = mediumColor;
                      break;
                    case 'hard':
                      chipColor = hardColor;
                      break;
                    default:
                      chipColor = greyColor;
                  }
                  return pw.Container(
                    margin: const pw.EdgeInsets.only(right: 10),
                    padding:
                        const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: pw.BoxDecoration(
                      borderRadius: pw.BorderRadius.circular(12),
                      border: pw.Border.all(color: chipColor, width: 0.8),
                    ),
                    child: pw.Text(
                      '${entry.key}: ${entry.value}',
                      style: pw.TextStyle(
                        fontSize: 9,
                        fontWeight: pw.FontWeight.bold,
                        color: chipColor,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),

      pw.SizedBox(height: 8),
      pw.Divider(color: borderGrey, thickness: 0.5),
      pw.SizedBox(height: 4),
    ];

    // ---------- QUESTION WIDGETS ----------

    final questionWidgets = <pw.Widget>[];

    for (int i = 0; i < questions.length; i++) {
      final q = questions[i];
      final topic = q.tags.isNotEmpty ? q.tags.first : null;

      final questionBlock = pw.Container(
        margin: const pw.EdgeInsets.only(bottom: 14),
        padding: const pw.EdgeInsets.all(14),
        decoration: pw.BoxDecoration(
          border: pw.Border.all(color: borderGrey, width: 0.5),
          borderRadius: pw.BorderRadius.circular(6),
        ),
        child: pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            // Question header row
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                // Question number badge
                pw.Container(
                  width: 24,
                  height: 24,
                  decoration: pw.BoxDecoration(
                    color: accentColor,
                    borderRadius: pw.BorderRadius.circular(12),
                  ),
                  child: pw.Center(
                    child: pw.Text(
                      '${i + 1}',
                      style: pw.TextStyle(
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.white,
                      ),
                    ),
                  ),
                ),
                pw.SizedBox(width: 8),
                buildDifficultyBadge(q.difficulty),
                if (topic != null) ...[
                  pw.SizedBox(width: 6),
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: pw.BoxDecoration(
                      color: accentLight,
                      borderRadius: pw.BorderRadius.circular(4),
                    ),
                    child: pw.Text(
                      topic,
                      style: pw.TextStyle(
                        fontSize: 8,
                        color: accentColor,
                      ),
                    ),
                  ),
                ],
                pw.Spacer(),
                pw.Text(
                  q.isOriginal ? 'Original' : 'AI Generated',
                  style: pw.TextStyle(
                    fontSize: 7,
                    color: greyColor,
                    fontStyle: pw.FontStyle.italic,
                  ),
                ),
              ],
            ),

            pw.SizedBox(height: 10),

            // Question text
            pw.Text(
              q.questionText,
              style: pw.TextStyle(
                fontSize: 11,
                color: darkText,
                lineSpacing: 3,
              ),
            ),

            pw.SizedBox(height: 8),

            // Options
            if (q.options.isNotEmpty)
              ...q.options.map((option) {
                final isCorrect =
                    option.trim().toLowerCase() ==
                        q.correctAnswer.trim().toLowerCase() ||
                    option.startsWith(q.correctAnswer);
                return buildOptionRow(option, isCorrect);
              }),

            // Explanation
            if (_includeExplanations &&
                q.explanation != null &&
                q.explanation!.isNotEmpty) ...[
              pw.SizedBox(height: 8),
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromInt(0xFFFFF7ED),
                  borderRadius: pw.BorderRadius.circular(4),
                  border: pw.Border.all(
                    color: PdfColor.fromInt(0xFFFDBA74),
                    width: 0.5,
                  ),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Explanation',
                      style: pw.TextStyle(
                        fontSize: 9,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColor.fromInt(0xFFEA580C),
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      q.explanation!,
                      style: pw.TextStyle(
                        fontSize: 9,
                        color: PdfColor.fromInt(0xFF78350F),
                        lineSpacing: 2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      );

      questionWidgets.add(questionBlock);
    }

    // ---------- ANSWER KEY (only when not including inline answers) ----------

    final answerKeyWidgets = <pw.Widget>[];

    if (!_includeAnswers) {
      answerKeyWidgets.add(
        pw.Container(
          width: double.infinity,
          padding: const pw.EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: pw.BoxDecoration(
            color: accentColor,
            borderRadius: pw.BorderRadius.circular(8),
          ),
          child: pw.Text(
            'Answer Key',
            style: pw.TextStyle(
              fontSize: 16,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white,
            ),
          ),
        ),
      );
      answerKeyWidgets.add(pw.SizedBox(height: 14));

      // Build rows of answers in a table-like layout
      final answerRows = <pw.TableRow>[];
      answerRows.add(
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColor.fromInt(0xFFF5F5F5)),
          children: [
            _tableHeaderCell('#'),
            _tableHeaderCell('Correct Answer'),
            _tableHeaderCell('Difficulty'),
          ],
        ),
      );

      for (int i = 0; i < questions.length; i++) {
        final q = questions[i];
        final isEven = i % 2 == 0;
        answerRows.add(
          pw.TableRow(
            decoration: isEven
                ? null
                : const pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFFAFAFA)),
            children: [
              _tableCell('${i + 1}', isBold: true),
              _tableCell(q.correctAnswer),
              pw.Padding(
                padding:
                    const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                child: buildDifficultyBadge(q.difficulty),
              ),
            ],
          ),
        );
      }

      answerKeyWidgets.add(
        pw.Table(
          border: pw.TableBorder.all(color: borderGrey, width: 0.5),
          columnWidths: {
            0: const pw.FlexColumnWidth(1),
            1: const pw.FlexColumnWidth(4),
            2: const pw.FlexColumnWidth(2),
          },
          children: answerRows,
        ),
      );
    }

    // ---------- ASSEMBLE PDF PAGES ----------

    pdf.addPage(
      pw.MultiPage(
        pageFormat: format,
        margin: const pw.EdgeInsets.all(40),
        footer: buildFooter,
        build: (pw.Context context) {
          return [
            ...titlePageWidgets,
            ...questionWidgets,
          ];
        },
      ),
    );

    // Answer key on a separate page section
    if (answerKeyWidgets.isNotEmpty) {
      pdf.addPage(
        pw.MultiPage(
          pageFormat: format,
          margin: const pw.EdgeInsets.all(40),
          footer: buildFooter,
          build: (pw.Context context) => answerKeyWidgets,
        ),
      );
    }

    return pdf.save();
  }

  // Helper for stat boxes on cover page
  static pw.Widget _buildStatBox(
    String label,
    String value,
    PdfColor color,
    PdfColor bgColor,
  ) {
    return pw.Expanded(
      child: pw.Container(
        padding: const pw.EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: pw.BoxDecoration(
          color: bgColor,
          borderRadius: pw.BorderRadius.circular(6),
        ),
        child: pw.Column(
          children: [
            pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: 18,
                fontWeight: pw.FontWeight.bold,
                color: color,
              ),
            ),
            pw.SizedBox(height: 2),
            pw.Text(
              label,
              style: pw.TextStyle(
                fontSize: 8,
                color: PdfColor.fromInt(0xFF757575),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static pw.Widget _tableHeaderCell(String text) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 9,
          fontWeight: pw.FontWeight.bold,
          color: PdfColor.fromInt(0xFF424242),
        ),
      ),
    );
  }

  static pw.Widget _tableCell(String text, {bool isBold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 9,
          fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: PdfColor.fromInt(0xFF212121),
        ),
      ),
    );
  }

  // ---------- FLUTTER UI ----------

  @override
  Widget build(BuildContext context) {
    final filteredCount = _filteredQuestions.length;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 620),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            _buildHeader(),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Include Answers toggle
                    _buildToggleTile(
                      icon: Icons.check_circle_outline,
                      iconColor: AppColors.success,
                      title: 'exam_clone.export.include_answers'.tr(
                        args: [],
                        namedArgs: {},
                      ),
                      subtitle: _includeAnswers
                          ? 'exam_clone.export.answers_inline'.tr(
                              args: [],
                              namedArgs: {},
                            )
                          : 'exam_clone.export.answers_key_page'.tr(
                              args: [],
                              namedArgs: {},
                            ),
                      value: _includeAnswers,
                      onChanged: (v) =>
                          setState(() => _includeAnswers = v),
                    ),

                    const SizedBox(height: 12),

                    // Include Explanations toggle
                    _buildToggleTile(
                      icon: Icons.lightbulb_outline,
                      iconColor: AppColors.accent,
                      title: 'exam_clone.export.include_explanations'.tr(
                        args: [],
                        namedArgs: {},
                      ),
                      subtitle:
                          'exam_clone.export.explanations_desc'.tr(
                        args: [],
                        namedArgs: {},
                      ),
                      value: _includeExplanations,
                      onChanged: (v) =>
                          setState(() => _includeExplanations = v),
                    ),

                    const SizedBox(height: 20),

                    // Question Filter section
                    Text(
                      'exam_clone.export.question_filter'.tr(
                        args: [],
                        namedArgs: {},
                      ),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),

                    Row(
                      children: [
                        _buildFilterChip(
                          label: 'exam_clone.export.filter_all'.tr(
                            args: [],
                            namedArgs: {},
                          ),
                          count: widget.questions.length,
                          filter: QuestionFilter.all,
                        ),
                        const SizedBox(width: 8),
                        _buildFilterChip(
                          label: 'exam_clone.export.filter_original'.tr(
                            args: [],
                            namedArgs: {},
                          ),
                          count: widget.questions
                              .where((q) => q.isOriginal)
                              .length,
                          filter: QuestionFilter.original,
                        ),
                        const SizedBox(width: 8),
                        _buildFilterChip(
                          label: 'exam_clone.export.filter_generated'.tr(
                            args: [],
                            namedArgs: {},
                          ),
                          count: widget.questions
                              .where((q) => !q.isOriginal)
                              .length,
                          filter: QuestionFilter.generated,
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Preview info card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.purple.withOpacity(0.15),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.picture_as_pdf_rounded,
                            color: AppColors.purple,
                            size: 28,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$filteredCount questions will be exported',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _includeAnswers
                                      ? 'With inline answers'
                                      : 'With answer key page',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.grey600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Footer buttons
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: AppColors.grey300, width: 1),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.picture_as_pdf_rounded,
              color: AppColors.purple,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'exam_clone.export.title'.tr(args: [], namedArgs: {}),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'exam_clone.export.subtitle'.tr(args: [], namedArgs: {}),
                  style: TextStyle(
                    color: AppColors.grey600,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close),
            iconSize: 20,
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppColors.grey300, width: 1),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _isGenerating ? null : () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text('common.cancel'.tr()),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: _isGenerating ? null : _handleExport,
              icon: _isGenerating
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.picture_as_pdf_rounded, size: 16),
              label: Text(
                _isGenerating
                    ? 'exam_clone.export.generating'.tr(
                        args: [],
                        namedArgs: {},
                      )
                    : 'exam_clone.export.export_pdf'.tr(
                        args: [],
                        namedArgs: {},
                      ),
                style: const TextStyle(fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.purple,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: value ? iconColor.withOpacity(0.05) : AppColors.grey100,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: value ? iconColor.withOpacity(0.25) : AppColors.grey300,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.grey600,
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeColor: iconColor,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required int count,
    required QuestionFilter filter,
  }) {
    final isSelected = _questionFilter == filter;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _questionFilter = filter),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.purple.withOpacity(0.1)
                : AppColors.grey100,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? AppColors.purple : AppColors.grey300,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? AppColors.purple : AppColors.grey700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? AppColors.purple : AppColors.grey600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
