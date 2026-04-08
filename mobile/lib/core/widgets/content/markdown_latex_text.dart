import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:flutter_highlight/themes/vs2015.dart';
import '../../theme/app_colors.dart';

/// Widget that renders text with Markdown, LaTeX, and Code Block support
/// Handles: **bold**, *italic*, $latex$ inline math, and ```code blocks```
class MarkdownLatexText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final Color? textColor;

  const MarkdownLatexText({
    super.key,
    required this.text,
    this.style,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final defaultStyle = style ?? const TextStyle(fontSize: 14, height: 1.5);
    final color = textColor ?? Colors.black87;

    // Check for code blocks first
    if (text.contains('```')) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _parseWithCodeBlocks(text, defaultStyle, color, context),
      );
    }

    return SelectableText.rich(
      TextSpan(
        children: _parseContent(text, defaultStyle, color),
      ),
    );
  }

  List<Widget> _parseWithCodeBlocks(String text, TextStyle baseStyle, Color color, BuildContext context) {
    final widgets = <Widget>[];
    final codeBlockPattern = RegExp(r'```(\w+)?\n([\s\S]*?)```', multiLine: true);
    int lastIndex = 0;

    for (final match in codeBlockPattern.allMatches(text)) {
      // Add text before code block
      if (match.start > lastIndex) {
        final beforeText = text.substring(lastIndex, match.start).trim();
        if (beforeText.isNotEmpty) {
          widgets.add(
            SelectableText.rich(
              TextSpan(children: _parseContent(beforeText, baseStyle, color)),
            ),
          );
          widgets.add(const SizedBox(height: 8));
        }
      }

      // Add code block
      final language = match.group(1) ?? 'plaintext';
      final code = match.group(2)?.trim() ?? '';

      widgets.add(_buildCodeBlock(code, language, context));
      widgets.add(const SizedBox(height: 8));

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      final remainingText = text.substring(lastIndex).trim();
      if (remainingText.isNotEmpty) {
        widgets.add(
          SelectableText.rich(
            TextSpan(children: _parseContent(remainingText, baseStyle, color)),
          ),
        );
      }
    }

    return widgets;
  }

  Widget _buildCodeBlock(String code, String language, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final theme = isDark ? vs2015Theme : githubTheme;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF6F8FA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.grey300,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    language.toUpperCase(),
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.copy_rounded, size: 18),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: code));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.white, size: 18),
                            const SizedBox(width: 8),
                            Text('widgets.code_copied'.tr()),
                          ],
                        ),
                        backgroundColor: AppColors.success,
                        behavior: SnackBarBehavior.floating,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  tooltip: 'Copy code',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  color: AppColors.primary,
                ),
              ],
            ),
          ),
          // Code content
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: HighlightView(
                code,
                language: _mapLanguage(language),
                theme: theme,
                padding: EdgeInsets.zero,
                textStyle: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 13,
                  height: 1.5,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _mapLanguage(String language) {
    final languageMap = {
      'python': 'python',
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'c': 'c',
      'dart': 'dart',
      'html': 'xml',
      'css': 'css',
      'json': 'json',
      'sql': 'sql',
      'bash': 'bash',
      'shell': 'bash',
    };

    return languageMap[language.toLowerCase()] ?? 'plaintext';
  }

  List<InlineSpan> _parseContent(String text, TextStyle baseStyle, Color color) {
    final spans = <InlineSpan>[];

    // Split by newlines to handle paragraphs and lists
    final lines = text.split('\n');

    for (var i = 0; i < lines.length; i++) {
      final line = lines[i];

      if (line.trim().isEmpty) {
        spans.add(const TextSpan(text: '\n'));
        continue;
      }

      // Parse the line for inline formatting
      spans.addAll(_parseLine(line, baseStyle, color));

      // Add newline if not last line
      if (i < lines.length - 1) {
        spans.add(const TextSpan(text: '\n'));
      }
    }

    return spans;
  }

  List<InlineSpan> _parseLine(String line, TextStyle baseStyle, Color color) {
    final spans = <InlineSpan>[];

    // Combined pattern for: $latex$, **bold**, *italic*
    final pattern = RegExp(r'\$([^\$]+)\$|\*\*([^\*]+)\*\*|\*([^\*]+)\*');
    int lastIndex = 0;

    for (final match in pattern.allMatches(line)) {
      // Add text before the match
      if (match.start > lastIndex) {
        final plainText = line.substring(lastIndex, match.start);
        spans.add(TextSpan(
          text: plainText,
          style: baseStyle.copyWith(color: color),
        ));
      }

      // Handle the match
      if (match.group(1) != null) {
        // LaTeX math: $...$
        final latex = match.group(1)!;
        try {
          spans.add(
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Math.tex(
                  latex,
                  textStyle: baseStyle.copyWith(color: color),
                  mathStyle: MathStyle.text,
                  options: MathOptions(
                    fontSize: (baseStyle.fontSize ?? 14) * 0.95,
                    color: color,
                  ),
                ),
              ),
            ),
          );
        } catch (e) {
          // If LaTeX fails, show as plain text
          spans.add(TextSpan(
            text: latex,
            style: baseStyle.copyWith(color: color),
          ));
        }
      } else if (match.group(2) != null) {
        // Bold: **...**
        final boldText = match.group(2)!;
        // Recursively parse for nested LaTeX in bold text
        final boldSpans = _parseLine(boldText, baseStyle, color);
        for (var span in boldSpans) {
          if (span is TextSpan) {
            spans.add(TextSpan(
              text: span.text,
              style: (span.style ?? baseStyle).copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ));
          } else {
            spans.add(span);
          }
        }
      } else if (match.group(3) != null) {
        // Italic: *...*
        final italicText = match.group(3)!;
        spans.add(TextSpan(
          text: italicText,
          style: baseStyle.copyWith(
            fontStyle: FontStyle.italic,
            color: color,
          ),
        ));
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      final plainText = line.substring(lastIndex);
      spans.add(TextSpan(
        text: plainText,
        style: baseStyle.copyWith(color: color),
      ));
    }

    return spans;
  }
}
