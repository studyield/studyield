import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:flutter_sound/flutter_sound.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/flashcard_entity.dart';
import '../bloc/flashcards_bloc.dart';
import '../bloc/flashcards_event.dart';
import '../bloc/flashcards_state.dart';

class ImportTab extends StatefulWidget {
  final String studySetId;
  final Function(List<FlashcardEntity>) onFlashcardsImported;

  const ImportTab({
    super.key,
    required this.studySetId,
    required this.onFlashcardsImported,
  });

  @override
  State<ImportTab> createState() => _ImportTabState();
}

class _ImportTabState extends State<ImportTab> {
  String _selectedSource = 'text';
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _separatorController = TextEditingController(text: '\\n\\n');
  String? _selectedFilePath;
  String? _selectedFileName;
  List<FlashcardEntity> _importedCards = [];

  // Audio recording
  final FlutterSoundRecorder _audioRecorder = FlutterSoundRecorder();
  bool _isRecording = false;
  bool _recorderInitialized = false;
  String? _recordedAudioPath;

  @override
  void dispose() {
    _textController.dispose();
    _urlController.dispose();
    _separatorController.dispose();
    if (_recorderInitialized) {
      _audioRecorder.closeRecorder();
    }
    super.dispose();
  }

  Future<void> _initRecorder() async {
    if (!_recorderInitialized) {
      await _audioRecorder.openRecorder();
      _recorderInitialized = true;
    }
  }

  Future<void> _toggleRecording() async {
    try {
      await _initRecorder();

      if (_isRecording) {
        // Stop recording
        final path = await _audioRecorder.stopRecorder();
        if (path != null) {
          setState(() {
            _recordedAudioPath = path;
            _selectedFilePath = path;
            _selectedFileName = 'Recorded audio';
            _isRecording = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.recording_saved'.tr()),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } else {
        // Check permission
        final status = await Permission.microphone.request();
        if (status != PermissionStatus.granted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.mic_permission_denied'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }

        // Start recording
        final directory = await getTemporaryDirectory();
        final filePath = '${directory.path}/recording_${DateTime.now().millisecondsSinceEpoch}.aac';

        await _audioRecorder.startRecorder(
          toFile: filePath,
          codec: Codec.aacADTS,
        );

        setState(() {
          _isRecording = true;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('flashcards.widgets.import.recording_started'.tr()),
            backgroundColor: AppColors.info,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('flashcards.widgets.import.recording_failed'.tr(namedArgs: {'error': e.toString()})),
          backgroundColor: AppColors.error,
        ),
      );
      setState(() {
        _isRecording = false;
      });
    }
  }

  Future<void> _pickFile() async {
    try {
      List<String>? extensions;
      switch (_selectedSource) {
        case 'pdf':
          extensions = ['pdf'];
          break;
        case 'audio_file':
          extensions = ['mp3', 'wav', 'm4a'];
          break;
        default:
          extensions = ['pdf', 'txt', 'csv', 'md', 'jpg', 'jpeg', 'png'];
      }

      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: extensions,
      );

      if (result != null) {
        setState(() {
          _selectedFilePath = result.files.single.path;
          _selectedFileName = result.files.single.name;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('flashcards.widgets.import.file_pick_failed'.tr(namedArgs: {'error': e.toString()})),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _openCamera() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );

      if (image != null) {
        await _processImageForText(image.path);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('flashcards.widgets.import.camera_failed'.tr(namedArgs: {'error': e.toString()})),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _pickImageFromGallery() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );

      if (image != null) {
        await _processImageForText(image.path);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('flashcards.widgets.import.image_pick_failed'.tr(namedArgs: {'error': e.toString()})),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _processImageForText(String imagePath) async {
    try {
      final inputImage = InputImage.fromFilePath(imagePath);
      final textRecognizer = TextRecognizer();
      final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);

      String extractedText = recognizedText.text;

      if (extractedText.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('flashcards.widgets.import.no_text_found'.tr()),
            backgroundColor: AppColors.warning,
          ),
        );
      } else {
        setState(() {
          _textController.text = extractedText;
          _selectedFilePath = imagePath;
          _selectedFileName = 'Scanned image';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('flashcards.widgets.import.text_extracted'.tr()),
            backgroundColor: AppColors.success,
          ),
        );
      }

      await textRecognizer.close();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('flashcards.widgets.import.image_process_failed'.tr(namedArgs: {'error': e.toString()})),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _import() {
    String? content;
    String source = _selectedSource;

    switch (_selectedSource) {
      case 'text':
        content = _textController.text.trim();
        if (content.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.enter_text_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        break;

      case 'pdf':
      case 'audio_file':
      case 'handwritten':
        if (_selectedFilePath == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.select_file_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        break;

      case 'record_audio':
      case 'audio_file':
        if (_selectedFilePath == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.select_audio_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        break;

      case 'camera':
      case 'handwritten':
        if (_selectedFilePath == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.select_image_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        // Text will be in _textController after OCR processing
        content = _textController.text.trim();
        break;

      case 'google_docs':
        final url = _urlController.text.trim();
        if (url.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.enter_gdocs_url_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        content = url;
        break;

      case 'youtube':
        final url = _urlController.text.trim();
        if (url.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.enter_youtube_url_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        content = url;
        break;

      case 'website':
        final url = _urlController.text.trim();
        if (url.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('flashcards.widgets.import.enter_website_url_error'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          return;
        }
        content = url;
        break;
    }

    context.read<FlashcardsBloc>().add(
          ImportFlashcards(
            studySetId: widget.studySetId,
            source: source,
            content: content,
            filePath: _selectedFilePath,
            separator: _selectedSource == 'text' ? _separatorController.text : null,
          ),
        );
  }

  void _addToStudySet() {
    widget.onFlashcardsImported(_importedCards);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('flashcards.widgets.import.cards_ready'.tr(namedArgs: {'count': _importedCards.length.toString()})),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return BlocListener<FlashcardsBloc, FlashcardsState>(
      listener: (context, state) {
        if (state is FlashcardsImported) {
          setState(() {
            _importedCards = state.flashcards;
          });
        } else if (state is FlashcardsError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      child: BlocBuilder<FlashcardsBloc, FlashcardsState>(
        builder: (context, state) {
          final isImporting = state is FlashcardsImporting;

          return SingleChildScrollView(
            padding: EdgeInsets.all(AppDimensions.space16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info banner
                Container(
                  padding: EdgeInsets.all(AppDimensions.space16),
                  decoration: BoxDecoration(
                    gradient: AppColors.blueGradient,
                    borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.file_upload, color: Colors.white),
                      SizedBox(width: AppDimensions.space12),
                      Expanded(
                        child: Text(
                          'flashcards.widgets.import.banner_text'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: AppDimensions.space24),

                // Source selector
                Text(
                  'flashcards.widgets.import.source_label'.tr(),
                  style: AppTextStyles.labelLarge.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: AppDimensions.space12),
                Wrap(
                  spacing: AppDimensions.space12,
                  runSpacing: AppDimensions.space12,
                  children: [
                    _SourceCard(
                      icon: Icons.picture_as_pdf,
                      title: 'flashcards.widgets.import.source_pdf'.tr(),
                      selected: _selectedSource == 'pdf',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'pdf'),
                    ),
                    _SourceCard(
                      icon: Icons.play_circle_outline,
                      title: 'flashcards.widgets.import.source_youtube'.tr(),
                      selected: _selectedSource == 'youtube',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'youtube'),
                    ),
                    _SourceCard(
                      icon: Icons.mic,
                      title: 'flashcards.widgets.import.source_record_audio'.tr(),
                      selected: _selectedSource == 'record_audio',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'record_audio'),
                    ),
                    _SourceCard(
                      icon: Icons.audio_file,
                      title: 'flashcards.widgets.import.source_audio_file'.tr(),
                      selected: _selectedSource == 'audio_file',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'audio_file'),
                    ),
                    _SourceCard(
                      icon: Icons.language,
                      title: 'flashcards.widgets.import.source_website'.tr(),
                      selected: _selectedSource == 'website',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'website'),
                    ),
                    _SourceCard(
                      icon: Icons.camera_alt,
                      title: 'flashcards.widgets.import.source_camera'.tr(),
                      selected: _selectedSource == 'camera',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'camera'),
                    ),
                    _SourceCard(
                      icon: Icons.description,
                      title: 'flashcards.widgets.import.source_google_docs'.tr(),
                      selected: _selectedSource == 'google_docs',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'google_docs'),
                    ),
                    _SourceCard(
                      icon: Icons.text_fields,
                      title: 'flashcards.widgets.import.source_text'.tr(),
                      selected: _selectedSource == 'text',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'text'),
                    ),
                    _SourceCard(
                      icon: Icons.edit,
                      title: 'flashcards.widgets.import.source_handwritten'.tr(),
                      selected: _selectedSource == 'handwritten',
                      enabled: !isImporting,
                      onTap: () => setState(() => _selectedSource = 'handwritten'),
                    ),
                  ],
                ),

                SizedBox(height: AppDimensions.space24),

                // Source-specific input
                if (_selectedSource == 'pdf') ...[
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.picture_as_pdf, size: 48, color: Colors.red),
                        SizedBox(height: AppDimensions.space12),
                        if (_selectedFileName != null) ...[
                          Text(
                            _selectedFileName!,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w500,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          SizedBox(height: AppDimensions.space8),
                        ],
                        OutlinedButton.icon(
                          onPressed: isImporting ? null : _pickFile,
                          icon: Icon(Icons.attach_file),
                          label: Text(_selectedFileName == null ? 'flashcards.widgets.import.choose_pdf'.tr() : 'flashcards.widgets.import.change_pdf'.tr()),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'flashcards.widgets.import.pdf_hint'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                        ),
                      ],
                    ),
                  ),
                ] else if (_selectedSource == 'record_audio') ...[
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space24),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.mic,
                          size: 64,
                          color: _isRecording ? Colors.red : Colors.green,
                        ),
                        SizedBox(height: AppDimensions.space16),
                        Text(
                          _isRecording ? 'flashcards.widgets.import.recording'.tr() : (_recordedAudioPath != null ? 'flashcards.widgets.import.recording_saved'.tr() : 'flashcards.widgets.import.tap_to_record'.tr()),
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'flashcards.widgets.import.record_hint'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                          textAlign: TextAlign.center,
                        ),
                        if (_recordedAudioPath != null) ...[
                          SizedBox(height: AppDimensions.space12),
                          Text(
                            _selectedFileName ?? '',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        SizedBox(height: AppDimensions.space24),
                        ElevatedButton.icon(
                          onPressed: isImporting ? null : _toggleRecording,
                          icon: Icon(_isRecording ? Icons.stop : Icons.fiber_manual_record),
                          label: Text(_isRecording ? 'flashcards.widgets.import.stop_recording'.tr() : (_recordedAudioPath != null ? 'flashcards.widgets.import.record_again'.tr() : 'flashcards.widgets.import.start_recording'.tr())),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isRecording ? Colors.orange : Colors.red,
                            padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (_selectedSource == 'audio_file') ...[
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.audio_file, size: 48, color: Colors.purple),
                        SizedBox(height: AppDimensions.space12),
                        if (_selectedFileName != null) ...[
                          Text(
                            _selectedFileName!,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w500,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          SizedBox(height: AppDimensions.space8),
                        ],
                        OutlinedButton.icon(
                          onPressed: isImporting ? null : _pickFile,
                          icon: Icon(Icons.attach_file),
                          label: Text(_selectedFileName == null ? 'flashcards.widgets.import.choose_audio'.tr() : 'flashcards.widgets.import.change_file'.tr()),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'flashcards.widgets.import.audio_formats'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                        ),
                      ],
                    ),
                  ),
                ] else if (_selectedSource == 'camera') ...[
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space24),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.camera_alt, size: 64, color: Colors.orange),
                        SizedBox(height: AppDimensions.space16),
                        Text(
                          'flashcards.widgets.import.camera_title'.tr(),
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'flashcards.widgets.import.camera_hint'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: AppDimensions.space24),
                        ElevatedButton.icon(
                          onPressed: isImporting ? null : _openCamera,
                          icon: Icon(Icons.camera_alt),
                          label: Text('flashcards.widgets.import.open_camera'.tr()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (_selectedSource == 'google_docs') ...[
                  TextFormField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.import.gdocs_label'.tr(),
                      hintText: 'flashcards.widgets.import.gdocs_hint'.tr(),
                      prefixIcon: Icon(Icons.description),
                      helperText: 'flashcards.widgets.import.gdocs_helper'.tr(),
                    ),
                    enabled: !isImporting,
                  ),
                ] else if (_selectedSource == 'handwritten') ...[
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space24),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.edit, size: 64, color: Colors.blue),
                        SizedBox(height: AppDimensions.space16),
                        Text(
                          'flashcards.widgets.import.handwritten_title'.tr(),
                          style: AppTextStyles.titleMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'flashcards.widgets.import.handwritten_hint'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: AppDimensions.space24),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: isImporting ? null : _openCamera,
                                icon: Icon(Icons.camera_alt),
                                label: Text('flashcards.widgets.import.take_photo'.tr()),
                              ),
                            ),
                            SizedBox(width: AppDimensions.space12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: isImporting ? null : _pickImageFromGallery,
                                icon: Icon(Icons.photo_library),
                                label: Text('flashcards.widgets.import.from_gallery'.tr()),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ] else if (_selectedSource == 'text') ...[
                  TextFormField(
                    controller: _textController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.import.text_label'.tr(),
                      hintText: 'flashcards.widgets.import.text_hint'.tr(),
                      prefixIcon: Icon(Icons.text_snippet),
                    ),
                    maxLines: 8,
                    enabled: !isImporting,
                  ),
                  SizedBox(height: AppDimensions.space16),
                  TextFormField(
                    controller: _separatorController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.import.separator_label'.tr(),
                      hintText: 'flashcards.widgets.import.separator_hint'.tr(),
                      prefixIcon: Icon(Icons.more_horiz),
                      helperText: 'flashcards.widgets.import.separator_helper'.tr(),
                    ),
                    enabled: !isImporting,
                  ),
                ] else if (_selectedSource == 'file') ...[
                  Container(
                    padding: EdgeInsets.all(AppDimensions.space16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                      border: Border.all(
                        color: theme.colorScheme.onSurface.withOpacity(0.1),
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.cloud_upload,
                          size: 48,
                          color: AppColors.grey500,
                        ),
                        SizedBox(height: AppDimensions.space12),
                        if (_selectedFileName != null) ...[
                          Text(
                            _selectedFileName!,
                            style: AppTextStyles.bodyMedium.copyWith(
                              fontWeight: FontWeight.w500,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          SizedBox(height: AppDimensions.space8),
                        ],
                        OutlinedButton.icon(
                          onPressed: isImporting ? null : _pickFile,
                          icon: Icon(Icons.attach_file),
                          label: Text(_selectedFileName == null ? 'flashcards.widgets.import.choose_file'.tr() : 'flashcards.widgets.import.change_file'.tr()),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'flashcards.widgets.import.file_formats'.tr(),
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else if (_selectedSource == 'youtube') ...[
                  TextFormField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.import.youtube_label'.tr(),
                      hintText: 'flashcards.widgets.import.youtube_hint'.tr(),
                      prefixIcon: Icon(Icons.play_circle_outline),
                      helperText: 'flashcards.widgets.import.youtube_helper'.tr(),
                    ),
                    enabled: !isImporting,
                  ),
                ] else if (_selectedSource == 'website') ...[
                  TextFormField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      labelText: 'flashcards.widgets.import.website_label'.tr(),
                      hintText: 'flashcards.widgets.import.website_hint'.tr(),
                      prefixIcon: Icon(Icons.language),
                      helperText: 'flashcards.widgets.import.website_helper'.tr(),
                    ),
                    enabled: !isImporting,
                  ),
                ],

                SizedBox(height: AppDimensions.space32),

                // Import button
                PrimaryButton(
                  text: isImporting ? 'flashcards.widgets.import.importing'.tr() : 'flashcards.widgets.import.import_button'.tr(),
                  onPressed: isImporting ? null : _import,
                  width: double.infinity,
                  gradient: AppColors.blueGradient,
                  isLoading: isImporting,
                  icon: Icons.file_upload,
                ),

                // Imported cards preview
                if (_importedCards.isNotEmpty) ...[
                  SizedBox(height: AppDimensions.space32),
                  Text(
                    'flashcards.widgets.import.imported_cards'.tr(namedArgs: {'count': _importedCards.length.toString()}),
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space16),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: _importedCards.length,
                    itemBuilder: (context, index) {
                      final card = _importedCards[index];
                      return Container(
                        margin: EdgeInsets.only(bottom: AppDimensions.space12),
                        padding: EdgeInsets.all(AppDimensions.space16),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                          border: Border.all(
                            color: theme.colorScheme.onSurface.withOpacity(0.1),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'flashcards.widgets.import.card_number'.tr(namedArgs: {'number': (index + 1).toString()}),
                              style: AppTextStyles.labelSmall.copyWith(
                                color: AppColors.grey600,
                              ),
                            ),
                            SizedBox(height: AppDimensions.space8),
                            Text(
                              card.front,
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontWeight: FontWeight.w500,
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                            SizedBox(height: AppDimensions.space8),
                            Text(
                              card.back,
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.grey600,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  SizedBox(height: AppDimensions.space24),
                  PrimaryButton(
                    text: 'flashcards.widgets.import.add_to_set'.tr(namedArgs: {'count': _importedCards.length.toString()}),
                    onPressed: _addToStudySet,
                    width: double.infinity,
                    gradient: AppColors.greenGradient,
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SourceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  const _SourceCard({
    required this.icon,
    required this.title,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
      child: Container(
        width: (MediaQuery.of(context).size.width - 56) / 2,
        padding: EdgeInsets.all(AppDimensions.space16),
        decoration: BoxDecoration(
          color: selected ? AppColors.secondary.withOpacity(0.1) : theme.cardColor,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
          border: Border.all(
            color: selected ? AppColors.secondary : theme.colorScheme.onSurface.withOpacity(0.1),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 32,
              color: selected ? AppColors.secondary : AppColors.grey600,
            ),
            SizedBox(height: AppDimensions.space8),
            Text(
              title,
              style: AppTextStyles.bodySmall.copyWith(
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                color: selected ? AppColors.secondary : theme.colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
