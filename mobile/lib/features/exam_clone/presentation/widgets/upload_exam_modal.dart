import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class UploadExamModal extends StatefulWidget {
  final Function(String title, String? subject, String? examText, String? filePath)
      onUpload;

  const UploadExamModal({
    super.key,
    required this.onUpload,
  });

  @override
  State<UploadExamModal> createState() => _UploadExamModalState();
}

class _UploadExamModalState extends State<UploadExamModal> {
  final _titleController = TextEditingController();
  final _subjectController = TextEditingController();
  final _examTextController = TextEditingController();
  String _uploadMode = 'file'; // 'file' or 'text'
  File? _selectedFile;
  String? _errorMessage;

  @override
  void dispose() {
    _titleController.dispose();
    _subjectController.dispose();
    _examTextController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'txt', 'md'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _selectedFile = File(result.files.single.path!);
          _errorMessage = null;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to pick file: $e';
      });
    }
  }

  void _handleSubmit() {
    if (_titleController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'exam_clone.upload.error_title_required'.tr();
      });
      return;
    }

    if (_uploadMode == 'file' && _selectedFile == null) {
      setState(() {
        _errorMessage = 'exam_clone.upload.error_file_required'.tr();
      });
      return;
    }

    if (_uploadMode == 'text' && _examTextController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'exam_clone.upload.error_content_required'.tr();
      });
      return;
    }

    widget.onUpload(
      _titleController.text.trim(),
      _subjectController.text.trim().isEmpty
          ? null
          : _subjectController.text.trim(),
      _uploadMode == 'text' ? _examTextController.text.trim() : null,
      _uploadMode == 'file' ? _selectedFile?.path : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: AppColors.grey300.withOpacity(0.5),
                    width: 1,
                  ),
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
                      Icons.upload_file,
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
                          'exam_clone.upload.title'.tr(),
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'exam_clone.upload.subtitle'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(
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
            ),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      'exam_clone.upload.title_label'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        hintText: 'exam_clone.upload.title_hint'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppColors.grey300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.purple),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Subject
                    Text(
                      'exam_clone.upload.subject_label'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _subjectController,
                      decoration: InputDecoration(
                        hintText: 'exam_clone.upload.subject_hint'.tr(),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppColors.grey300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.purple),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Upload Method Toggle
                    Text(
                      'exam_clone.upload.method_label'.tr(),
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildModeButton(
                            'file',
                            Icons.description,
                            'exam_clone.upload.upload_pdf'.tr(),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildModeButton(
                            'text',
                            Icons.text_fields,
                            'exam_clone.upload.paste_text'.tr(),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // File Upload
                    if (_uploadMode == 'file') _buildFileUpload(),

                    // Text Input
                    if (_uploadMode == 'text') _buildTextInput(),

                    // Error Message
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          border: Border.all(
                            color: AppColors.error.withOpacity(0.2),
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: AppColors.error,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppColors.grey300.withOpacity(0.5),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('common.cancel'.tr()),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: _handleSubmit,
                    icon: const Icon(Icons.auto_awesome, size: 16),
                    label: Text('exam_clone.upload.upload_analyze'.tr()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.purple,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeButton(String mode, IconData icon, String label) {
    final isSelected = _uploadMode == mode;
    return InkWell(
      onTap: () => setState(() => _uploadMode = mode),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected
                ? AppColors.purple
                : AppColors.grey300.withOpacity(0.5),
            width: isSelected ? 2 : 1,
          ),
          color: isSelected
              ? AppColors.purple.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? AppColors.purple : AppColors.grey600,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.purple : AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFileUpload() {
    return InkWell(
      onTap: _pickFile,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          border: Border.all(
            color: _selectedFile != null
                ? AppColors.purple
                : AppColors.grey300.withOpacity(0.5),
            width: 2,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
          color: _selectedFile != null
              ? AppColors.purple.withOpacity(0.05)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: _selectedFile != null
            ? Row(
                children: [
                  const Icon(
                    Icons.description,
                    color: AppColors.purple,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selectedFile!.path.split('/').last,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${(_selectedFile!.lengthSync() / 1024).toStringAsFixed(1)} KB',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : Column(
                children: [
                  Icon(
                    Icons.upload_file,
                    color: AppColors.grey400,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'exam_clone.upload.click_upload'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'exam_clone.upload.file_formats'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'exam_clone.upload.tip_pdf_fail'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.purple,
                      fontSize: 10,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildTextInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _examTextController,
          maxLines: 10,
          decoration: InputDecoration(
            hintText: 'exam_clone.upload.text_hint'.tr(),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppColors.grey300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.purple),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'exam_clone.upload.character_count'.tr(namedArgs: {'count': '${_examTextController.text.length}'}),
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.grey600,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
