import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../theme/app_colors.dart';

class FileUploadWidget extends StatefulWidget {
  final List<String> allowedExtensions;
  final int maxSizeInMB;
  final String? label;
  final String? hint;
  final Function(String filePath)? onFileSelected;
  final Function(double progress)? onUploadProgress;
  final bool showPreview;

  const FileUploadWidget({
    super.key,
    this.allowedExtensions = const ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
    this.maxSizeInMB = 10,
    this.label,
    this.hint,
    this.onFileSelected,
    this.onUploadProgress,
    this.showPreview = true,
  });

  @override
  State<FileUploadWidget> createState() => _FileUploadWidgetState();
}

class _FileUploadWidgetState extends State<FileUploadWidget> {
  File? _selectedFile;
  String? _fileName;
  int? _fileSize;
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _error;

  Future<void> _pickFile() async {
    try {
      setState(() {
        _error = null;
      });

      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: widget.allowedExtensions,
        allowMultiple: false,
      );

      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final fileName = result.files.single.name;
        final fileSize = await file.length();

        // Validate file size
        if (fileSize > widget.maxSizeInMB * 1024 * 1024) {
          setState(() {
            _error = 'File size exceeds ${widget.maxSizeInMB}MB limit';
          });
          return;
        }

        setState(() {
          _selectedFile = file;
          _fileName = fileName;
          _fileSize = fileSize;
        });

        // Notify parent
        widget.onFileSelected?.call(file.path);

        // Simulate upload progress (in real app, this would be actual upload)
        if (widget.onUploadProgress != null) {
          _simulateUpload();
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick file: ${e.toString()}';
      });
    }
  }

  Future<void> _simulateUpload() async {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });

    // Simulate upload progress
    for (int i = 0; i <= 100; i += 10) {
      await Future.delayed(const Duration(milliseconds: 100));
      setState(() {
        _uploadProgress = i / 100;
      });
      widget.onUploadProgress?.call(_uploadProgress);
    }

    setState(() {
      _isUploading = false;
    });
  }

  void _clearFile() {
    setState(() {
      _selectedFile = null;
      _fileName = null;
      _fileSize = null;
      _uploadProgress = 0.0;
      _error = null;
    });
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  IconData _getFileIcon(String? fileName) {
    if (fileName == null) return Icons.insert_drive_file;

    final extension = fileName.split('.').last.toLowerCase();
    switch (extension) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'txt':
        return Icons.text_snippet;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return Icons.image;
      default:
        return Icons.insert_drive_file;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
        ],
        if (_selectedFile == null) _buildUploadArea() else _buildFilePreview(),
        if (_error != null) ...[
          const SizedBox(height: 8),
          _buildError(),
        ],
      ],
    );
  }

  Widget _buildUploadArea() {
    return InkWell(
      onTap: _pickFile,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.border,
            width: 2,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppColors.purpleGradient,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_upload,
                size: 48,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Tap to select file',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.hint ?? 'Select a file to upload',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: widget.allowedExtensions.map((ext) {
                return Chip(
                  label: Text(
                    ext.toUpperCase(),
                    style: const TextStyle(fontSize: 12),
                  ),
                  backgroundColor: AppColors.purple.withOpacity(0.1),
                  side: BorderSide.none,
                );
              }).toList(),
            ),
            const SizedBox(height: 8),
            Text(
              'Max size: ${widget.maxSizeInMB}MB',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilePreview() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.purple.withOpacity(0.5),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: AppColors.purpleGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  _getFileIcon(_fileName),
                  size: 32,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _fileName ?? 'Unknown file',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatFileSize(_fileSize ?? 0),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
              if (!_isUploading)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: _pickFile,
                      tooltip: 'Change file',
                      color: AppColors.purple,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: _clearFile,
                      tooltip: 'Remove file',
                      color: Colors.red,
                    ),
                  ],
                ),
            ],
          ),
          if (_isUploading) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: _uploadProgress,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
            ),
            const SizedBox(height: 8),
            Text(
              '${(_uploadProgress * 100).toInt()}% uploaded',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildError() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Colors.red.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
