import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/network/api_client.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';
import 'solving_progress_screen.dart';

class CameraScanScreen extends StatefulWidget {
  const CameraScanScreen({super.key});

  @override
  State<CameraScanScreen> createState() => _CameraScanScreenState();
}

class _CameraScanScreenState extends State<CameraScanScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  bool _isProcessing = false;
  String? _capturedImagePath;
  String? _extractedText;
  double _confidence = 0.0;
  final TextEditingController _textController = TextEditingController();
  String? _selectedSubject;
  FlashMode _flashMode = FlashMode.off;

  List<String> get _subjects => [
    'problem_solver.camera_scan.subjects.mathematics'.tr(),
    'problem_solver.camera_scan.subjects.physics'.tr(),
    'problem_solver.camera_scan.subjects.chemistry'.tr(),
    'problem_solver.camera_scan.subjects.biology'.tr(),
    'problem_solver.camera_scan.subjects.computer_science'.tr(),
    'problem_solver.camera_scan.subjects.other'.tr(),
  ];

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();

      if (_cameras == null || _cameras!.isEmpty) {
        _showError('No cameras available');
        return;
      }

      _cameraController = CameraController(
        _cameras!.first,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      _showError('Failed to initialize camera: $e');
    }
  }

  Future<void> _toggleFlash() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      FlashMode newMode;
      switch (_flashMode) {
        case FlashMode.off:
          newMode = FlashMode.auto;
          break;
        case FlashMode.auto:
          newMode = FlashMode.always;
          break;
        case FlashMode.always:
          newMode = FlashMode.torch;
          break;
        case FlashMode.torch:
          newMode = FlashMode.off;
          break;
      }

      await _cameraController!.setFlashMode(newMode);
      setState(() {
        _flashMode = newMode;
      });
    } catch (e) {
      _showError('Failed to toggle flash: $e');
    }
  }

  Future<void> _captureImage() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      final XFile image = await _cameraController!.takePicture();
      setState(() {
        _capturedImagePath = image.path;
        _isProcessing = true;
      });

      // Process OCR
      await _processOCR(image.path);
    } catch (e) {
      _showError('Failed to capture image: $e');
    }
  }

  Future<void> _processOCR(String imagePath) async {
    try {
      // Try backend OCR first (better for math)
      final apiClient = ApiClient.instance;

      // Create form data with the image
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          imagePath,
          filename: 'problem.jpg',
        ),
      });

      try {
        // Send to backend for better math OCR
        final response = await apiClient.post(
          '/problem-solver/ocr',
          data: formData,
        );

        final extractedText = response.data['text'] as String? ?? '';
        final confidence = (response.data['confidence'] as num?)?.toDouble() ?? 0.9;

        setState(() {
          _extractedText = extractedText;
          _textController.text = extractedText;
          _confidence = confidence;
          _isProcessing = false;
        });
      } catch (apiError) {
        // Fallback to local ML Kit if backend fails
        print('Backend OCR failed, using local ML Kit: $apiError');
        await _processWithMLKit(imagePath);
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      _showError('OCR processing failed: $e');
    }
  }

  Future<void> _processWithMLKit(String imagePath) async {
    try {
      final inputImage = InputImage.fromFilePath(imagePath);
      // Use script: TextRecognitionScript.japanese for Japanese
      // Default recognizer supports Latin, but for better multilingual support we keep default
      final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

      final RecognizedText recognizedText =
          await textRecognizer.processImage(inputImage);

      String extractedText = recognizedText.text;

      // Basic math symbol correction
      extractedText = extractedText
          .replaceAll('×', '*')
          .replaceAll('÷', '/')
          .replaceAll('−', '-')
          .replaceAll('–', '-')
          .replaceAll('—', '-');

      setState(() {
        _extractedText = extractedText;
        _textController.text = extractedText;
        _confidence = 0.70; // Lower confidence for ML Kit
        _isProcessing = false;
      });

      await textRecognizer.close();
    } catch (e) {
      setState(() => _isProcessing = false);
      _showError('Local OCR processing failed: $e');
    }
  }

  void _retake() {
    setState(() {
      _capturedImagePath = null;
      _extractedText = null;
      _textController.clear();
      _confidence = 0.0;
    });
  }

  void _confirmAndSolve() {
    if (_textController.text.trim().isEmpty) {
      _showError('Please enter or edit the problem text');
      return;
    }

    context.read<ProblemSolverBloc>().add(
          ConfirmOCRText(
            text: _textController.text.trim(),
            subject: _selectedSubject,
          ),
        );
  }

  IconData _getFlashIcon() {
    switch (_flashMode) {
      case FlashMode.off:
        return Icons.flash_off;
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.always:
        return Icons.flash_on;
      case FlashMode.torch:
        return Icons.flashlight_on;
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: _capturedImagePath == null
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              title: Text(
                'problem_solver.camera_scan.title'.tr(),
                style: const TextStyle(color: Colors.white),
              ),
            )
          : null,
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is SessionCreated) {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => BlocProvider.value(
                  value: context.read<ProblemSolverBloc>(),
                  child: SolvingProgressScreen(sessionId: state.session.id),
                ),
              ),
            );
          } else if (state is ProblemSolverError) {
            _showError(state.message);
          }
        },
        child: _capturedImagePath == null
            ? _buildCameraView()
            : _buildReviewView(),
      ),
    );
  }

  Widget _buildCameraView() {
    if (!_isCameraInitialized || _cameraController == null) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    return Stack(
      children: [
        // Camera preview
        Positioned.fill(
          child: CameraPreview(_cameraController!),
        ),

        // Frame overlay
        Positioned.fill(
          child: CustomPaint(
            painter: _FramePainter(),
          ),
        ),

        // Instructions
        Positioned(
          top: 40,
          left: 20,
          right: 80,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'problem_solver.camera_scan.instructions'.tr(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),

        // Flash toggle button
        Positioned(
          top: 40,
          right: 20,
          child: GestureDetector(
            onTap: _toggleFlash,
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getFlashIcon(),
                color: _flashMode == FlashMode.off ? Colors.white : Colors.amber,
                size: 28,
              ),
            ),
          ),
        ),

        // Capture button
        Positioned(
          bottom: 40,
          left: 0,
          right: 0,
          child: Center(
            child: GestureDetector(
              onTap: _captureImage,
              child: Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                ),
                child: Container(
                  margin: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewView() {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: theme.colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'problem_solver.camera_scan.review_title'.tr(),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Captured image preview - larger and better styled
                  if (_capturedImagePath != null)
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          File(_capturedImagePath!),
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),

                  const SizedBox(height: 20),

                  // OCR processing or results
                  if (_isProcessing)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: AppColors.secondary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        children: [
                          const CircularProgressIndicator(),
                          const SizedBox(height: 16),
                          Text(
                            'problem_solver.camera_scan.analyzing'.tr(),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'problem_solver.camera_scan.analyzing_subtitle'.tr(),
                            style: const TextStyle(fontSize: 14, color: AppColors.grey600),
                          ),
                        ],
                      ),
                    )
                  else if (_extractedText != null) ...[
                    // Warning banner for poor OCR
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.orange.shade50, Colors.orange.shade100],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.shade300),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.orange.shade700),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'problem_solver.camera_scan.verify_text'.tr(),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange.shade900,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'problem_solver.camera_scan.verify_description'.tr(),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.orange.shade800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Subject selector
                    Text(
                      'problem_solver.camera_scan.subject_label'.tr(),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedSubject,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: theme.cardColor,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      items: _subjects.map((subject) {
                        return DropdownMenuItem(
                          value: subject,
                          child: Text(subject),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedSubject = value);
                      },
                    ),

                    const SizedBox(height: 20),

                    // Editable text field with better styling
                    Text(
                      'problem_solver.camera_scan.problem_text_label'.tr(),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _textController,
                      maxLines: 6,
                      style: const TextStyle(
                        fontSize: 16,
                        fontFamily: 'monospace',
                      ),
                      decoration: InputDecoration(
                        hintText: 'problem_solver.camera_scan.problem_text_hint'.tr(),
                        helperText: 'problem_solver.camera_scan.problem_text_tip'.tr(),
                        helperMaxLines: 2,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: AppColors.secondary,
                            width: 2,
                          ),
                        ),
                        filled: true,
                        fillColor: theme.cardColor,
                        contentPadding: const EdgeInsets.all(16),
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
          ),

          // Bottom action bar
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _retake,
                      icon: const Icon(Icons.refresh),
                      label: Text('problem_solver.camera_scan.actions.retake'.tr()),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: BorderSide(color: AppColors.grey400),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _confirmAndSolve,
                      icon: const Icon(Icons.psychology),
                      label: Text('problem_solver.camera_scan.actions.solve_problem'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    final rect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2),
      width: size.width * 0.8,
      height: size.height * 0.5,
    );

    // Draw corner brackets
    const cornerLength = 30.0;

    // Top-left
    canvas.drawLine(rect.topLeft, rect.topLeft + const Offset(cornerLength, 0), paint);
    canvas.drawLine(rect.topLeft, rect.topLeft + const Offset(0, cornerLength), paint);

    // Top-right
    canvas.drawLine(rect.topRight, rect.topRight + const Offset(-cornerLength, 0), paint);
    canvas.drawLine(rect.topRight, rect.topRight + const Offset(0, cornerLength), paint);

    // Bottom-left
    canvas.drawLine(rect.bottomLeft, rect.bottomLeft + const Offset(cornerLength, 0), paint);
    canvas.drawLine(rect.bottomLeft, rect.bottomLeft + const Offset(0, -cornerLength), paint);

    // Bottom-right
    canvas.drawLine(rect.bottomRight, rect.bottomRight + const Offset(-cornerLength, 0), paint);
    canvas.drawLine(rect.bottomRight, rect.bottomRight + const Offset(0, -cornerLength), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
