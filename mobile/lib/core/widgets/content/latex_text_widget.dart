import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// Widget that renders text with embedded LaTeX equations
/// Supports both inline ($...$) and display ($$...$$) math
class LatexText extends StatelessWidget {
  final String text;
  final TextStyle? textStyle;
  final TextAlign? textAlign;

  const LatexText({
    super.key,
    required this.text,
    this.textStyle,
    this.textAlign,
  });

  @override
  Widget build(BuildContext context) {
    final defaultStyle = textStyle ?? DefaultTextStyle.of(context).style;

    // Ensure text color is black if not specified
    final visibleStyle = defaultStyle.copyWith(
      color: defaultStyle.color ?? Colors.black,
    );

    // Parse text and build widgets
    final spans = _parseLatex(text, visibleStyle);

    if (spans.isEmpty) {
      return Text(text, style: visibleStyle, textAlign: textAlign);
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: double.infinity),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 3,
        runSpacing: 4,
        children: spans,
      ),
    );
  }

  List<Widget> _parseLatex(String text, TextStyle defaultStyle) {
    final widgets = <Widget>[];

    // Handle multiple LaTeX delimiter formats:
    // $$...$$ or \[...\] for display math
    // $...$ or \(...\) for inline math
    final pattern = RegExp(r'\$\$([^\$]+)\$\$|\\\[(.+?)\\\]|\$([^\$]+)\$|\\\((.+?)\\\)');
    int lastIndex = 0;

    for (final match in pattern.allMatches(text)) {
      // Add text before the LaTeX
      if (match.start > lastIndex) {
        final plainText = text.substring(lastIndex, match.start);
        if (plainText.isNotEmpty) {
          widgets.add(Text(plainText, style: defaultStyle));
        }
      }

      // Determine which group matched and if it's display mode
      final latex = match.group(1) ?? match.group(2) ?? match.group(3) ?? match.group(4) ?? '';
      final isDisplay = match.group(1) != null || match.group(2) != null; // $$...$$ or \[...\]

      try {
        widgets.add(
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: 1,
              vertical: isDisplay ? 8 : 0,
            ),
            child: Math.tex(
              latex,
              textStyle: defaultStyle,
              mathStyle: isDisplay ? MathStyle.display : MathStyle.text,
              options: MathOptions(
                fontSize: (defaultStyle.fontSize ?? 14) * 0.82,
                color: Colors.black,
              ),
            ),
          ),
        );
      } catch (e) {
        // If LaTeX fails to render, show the raw text
        widgets.add(Text(latex, style: defaultStyle));
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      final plainText = text.substring(lastIndex);
      if (plainText.isNotEmpty) {
        widgets.add(Text(plainText, style: defaultStyle));
      }
    }

    return widgets;
  }
}

/// Rich text version that properly formats LaTeX inline with text
class LatexRichText extends StatelessWidget {
  final String text;
  final TextStyle? textStyle;
  final TextAlign? textAlign;

  const LatexRichText({
    super.key,
    required this.text,
    this.textStyle,
    this.textAlign,
  });

  @override
  Widget build(BuildContext context) {
    final defaultStyle = textStyle ?? DefaultTextStyle.of(context).style;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _buildParagraphs(text, defaultStyle),
    );
  }

  List<Widget> _buildParagraphs(String text, TextStyle defaultStyle) {
    // Split into paragraphs
    final paragraphs = text.split('\n\n');
    final widgets = <Widget>[];

    for (final para in paragraphs) {
      if (para.trim().isEmpty) continue;

      // Check if this is a display math block ($$...$$)
      if (para.trim().startsWith(r'$$') && para.trim().endsWith(r'$$')) {
        final latex = para.trim().substring(2, para.trim().length - 2);
        widgets.add(
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Math.tex(
                latex,
                textStyle: defaultStyle,
                mathStyle: MathStyle.display,
                options: MathOptions(
                  fontSize: (defaultStyle.fontSize ?? 14) * 1.2,
                  color: defaultStyle.color ?? Colors.black,
                ),
              ),
            ),
          ),
        );
      } else {
        // Regular paragraph with possible inline math
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildInlineLatexParagraph(para, defaultStyle),
          ),
        );
      }
    }

    return widgets;
  }

  Widget _buildInlineLatexParagraph(String text, TextStyle defaultStyle) {
    // Support multiple LaTeX delimiter formats: $...$ and \(...\)
    final pattern = RegExp(r'\$([^\$]+)\$|\\\((.+?)\\\)');
    final spans = <InlineSpan>[];
    int lastIndex = 0;

    // Ensure text color is black if not specified
    final visibleStyle = defaultStyle.copyWith(
      color: defaultStyle.color ?? Colors.black,
    );

    for (final match in pattern.allMatches(text)) {
      // Add text before LaTeX
      if (match.start > lastIndex) {
        spans.add(TextSpan(
          text: text.substring(lastIndex, match.start),
          style: visibleStyle,
        ));
      }

      // Add LaTeX as widget span - check which group matched
      final latex = match.group(1) ?? match.group(2) ?? '';
      try {
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Math.tex(
                latex,
                textStyle: visibleStyle,
                mathStyle: MathStyle.text,
                options: MathOptions(
                  fontSize: (visibleStyle.fontSize ?? 14) * 0.9,
                  color: Colors.black,
                ),
              ),
            ),
          ),
        );
      } catch (e) {
        // If LaTeX fails to render, add as plain text
        spans.add(TextSpan(text: latex, style: visibleStyle));
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastIndex),
        style: visibleStyle,
      ));
    }

    // If no LaTeX found, just return plain text
    if (spans.isEmpty) {
      return Text(text, style: visibleStyle);
    }

    return RichText(
      text: TextSpan(children: spans),
      textAlign: textAlign ?? TextAlign.start,
    );
  }
}
