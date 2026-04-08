import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:flutter_highlight/themes/vs2015.dart';
import '../../../features/problem_solver/domain/entities/code_block_entity.dart';
import '../../theme/app_colors.dart';

class CodeBlockWidget extends StatelessWidget {
  final CodeBlockEntity codeBlock;
  final bool showLineNumbers;
  final VoidCallback? onCopy;

  const CodeBlockWidget({
    super.key,
    required this.codeBlock,
    this.showLineNumbers = true,
    this.onCopy,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final theme = isDark ? vs2015Theme : githubTheme;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.border.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeader(context),
          if (codeBlock.description != null) _buildDescription(context),
          _buildCodeContent(context, theme),
          if (codeBlock.output != null) _buildOutput(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.purple.withOpacity(0.1),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(12),
          topRight: Radius.circular(12),
        ),
      ),
      child: Row(
        children: [
          // Language badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              gradient: AppColors.purpleGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              codeBlock.language.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Spacer(),
          // Copy button
          IconButton(
            icon: const Icon(Icons.copy, size: 20),
            onPressed: () => _copyCode(context),
            tooltip: 'Copy code',
            color: AppColors.purple,
          ),
        ],
      ),
    );
  }

  Widget _buildDescription(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: AppColors.border.withOpacity(0.5),
            width: 1,
          ),
        ),
      ),
      child: Text(
        codeBlock.description!,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontStyle: FontStyle.italic,
              color: AppColors.textSecondary,
            ),
      ),
    );
  }

  Widget _buildCodeContent(BuildContext context, Map<String, TextStyle> theme) {
    if (showLineNumbers) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLineNumbers(context),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: HighlightView(
                  codeBlock.code,
                  language: _mapLanguage(codeBlock.language),
                  theme: theme,
                  padding: EdgeInsets.zero,
                  textStyle: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: HighlightView(
          codeBlock.code,
          language: _mapLanguage(codeBlock.language),
          theme: theme,
          padding: EdgeInsets.zero,
          textStyle: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildLineNumbers(BuildContext context) {
    final lines = codeBlock.code.split('\n').length;
    final startLine = codeBlock.lineStart ?? 1;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(
          right: BorderSide(
            color: AppColors.border.withOpacity(0.5),
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(
          lines,
          (index) => Text(
            '${startLine + index}',
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 14,
              color: AppColors.textSecondary.withOpacity(0.5),
              height: 1.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOutput(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
        border: Border(
          top: BorderSide(
            color: AppColors.border.withOpacity(0.5),
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.terminal,
                size: 16,
                color: Colors.green[400],
              ),
              const SizedBox(width: 8),
              Text(
                'Output:',
                style: TextStyle(
                  color: Colors.green[400],
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            codeBlock.output!,
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 14,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _copyCode(BuildContext context) {
    Clipboard.setData(ClipboardData(text: codeBlock.code));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Text('common.code_copied'.tr()),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );

    onCopy?.call();
  }

  String _mapLanguage(String language) {
    // Map common language names to highlight.js language identifiers
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
      'csharp': 'csharp',
      'c#': 'csharp',
      'ruby': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'dart': 'dart',
      'html': 'xml',
      'xml': 'xml',
      'css': 'css',
      'sql': 'sql',
      'json': 'json',
      'yaml': 'yaml',
      'markdown': 'markdown',
      'bash': 'bash',
      'shell': 'bash',
      'latex': 'latex',
      'matlab': 'matlab',
      'r': 'r',
    };

    return languageMap[language.toLowerCase()] ?? 'plaintext';
  }
}
