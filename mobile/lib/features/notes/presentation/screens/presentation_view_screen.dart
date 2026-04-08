import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/note_entity.dart';

class PresentationSlide {
  final String title;
  final String content;
  final String notes;

  PresentationSlide({
    required this.title,
    required this.content,
    this.notes = '',
  });

  factory PresentationSlide.fromJson(Map<String, dynamic> json) {
    return PresentationSlide(
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
    );
  }
}

class PresentationViewScreen extends StatefulWidget {
  final NoteEntity note;

  const PresentationViewScreen({
    super.key,
    required this.note,
  });

  @override
  State<PresentationViewScreen> createState() => _PresentationViewScreenState();
}

class _PresentationViewScreenState extends State<PresentationViewScreen> {
  int _currentSlide = 0;
  List<PresentationSlide> _slides = [];
  bool _isLoading = true;
  String? _error;
  bool _showNotes = false;
  int _timer = 0;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _generateSlides();
    _startTimer();
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _pageController.dispose();
    super.dispose();
  }

  void _startTimer() {
    Future.doWhile(() async {
      if (!mounted) return false;
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() => _timer++);
      }
      return mounted;
    });
  }

  Future<void> _generateSlides() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.post(
        '/ai/generate-slides',
        data: {
          'content': widget.note.content,
          'title': widget.note.title,
          'slideCount': 8,
        },
      );

      final slidesData = response.data['slides'] as List<dynamic>;
      final slides = slidesData
          .map((json) => PresentationSlide.fromJson(json as Map<String, dynamic>))
          .toList();

      setState(() {
        _slides = slides;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to generate presentation: $e';
        _isLoading = false;
      });
    }
  }

  String _formatTimer() {
    final minutes = _timer ~/ 60;
    final seconds = _timer % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    // Loading State
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.grey[100],
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                  strokeWidth: 3,
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'notes.generatingPresentationTitle'.tr(),
                    style: AppTextStyles.titleLarge.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'notes.generatingPresentationSubtitle'.tr(),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.grey600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Error State
    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.grey[100],
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, color: Colors.red, size: 64),
                const SizedBox(height: 24),
                Text(
                  'notes.generationFailedTitle'.tr(),
                  style: AppTextStyles.titleLarge.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.grey600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _generateSlides,
                      icon: const Icon(Icons.refresh),
                      label: Text('common.tryAgain'.tr()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('common.close'.tr()),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Presentation View
    return Scaffold(
      backgroundColor: Colors.grey[100],
      body: Stack(
        children: [
          // Main Content
          Column(
            children: [
              const SizedBox(height: 56), // Space for top bar

              // Main Slide Area
              Expanded(
                child: Center(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      // 16:9 aspect ratio
                      final maxWidth = constraints.maxWidth * 0.9;
                      final maxHeight = constraints.maxHeight * 0.8;
                      final aspectWidth = maxHeight * (16 / 9);
                      final aspectHeight = maxWidth * (9 / 16);

                      final width = aspectWidth < maxWidth ? aspectWidth : maxWidth;
                      final height = aspectHeight < maxHeight ? aspectHeight : maxHeight;

                      return Stack(
                        alignment: Alignment.center,
                        children: [
                          // Slide Box
                          Container(
                            width: width,
                            height: height,
                            decoration: BoxDecoration(
                              color: Colors.black,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 30,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: PageView.builder(
                                controller: _pageController,
                                onPageChanged: (index) {
                                  setState(() => _currentSlide = index);
                                },
                                itemCount: _slides.length,
                                itemBuilder: (context, index) {
                                  final slide = _slides[index];
                                  return Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 50,
                                      vertical: 40,
                                    ),
                                    child: LayoutBuilder(
                                      builder: (context, constraints) {
                                        return SingleChildScrollView(
                                          child: ConstrainedBox(
                                            constraints: BoxConstraints(
                                              minHeight: constraints.maxHeight,
                                            ),
                                            child: Column(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              crossAxisAlignment: CrossAxisAlignment.center,
                                              children: [
                                                // Slide Content (with title inside)
                                                MarkdownBody(
                                                  data: slide.content,
                                                  styleSheet: MarkdownStyleSheet(
                                                    textAlign: WrapAlignment.center,
                                                    p: const TextStyle(
                                                      fontSize: 16,
                                                      color: Colors.white,
                                                      height: 1.4,
                                                    ),
                                                    h1: const TextStyle(
                                                      fontSize: 32,
                                                      fontWeight: FontWeight.bold,
                                                      color: AppColors.primary,
                                                      height: 1.2,
                                                    ),
                                                    h2: const TextStyle(
                                                      fontSize: 24,
                                                      fontWeight: FontWeight.bold,
                                                      color: AppColors.primary,
                                                      height: 1.3,
                                                    ),
                                                    h3: const TextStyle(
                                                      fontSize: 20,
                                                      fontWeight: FontWeight.w600,
                                                      color: Colors.white,
                                                      height: 1.3,
                                                    ),
                                                    listBullet: const TextStyle(
                                                      fontSize: 16,
                                                      color: Colors.white,
                                                      height: 1.4,
                                                    ),
                                                    strong: const TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),

                          // Navigation Arrows
                          if (_currentSlide > 0)
                            Positioned(
                              left: -70,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  shape: BoxShape.circle,
                                ),
                                child: IconButton(
                                  onPressed: () {
                                    _pageController.previousPage(
                                      duration: const Duration(milliseconds: 300),
                                      curve: Curves.easeInOut,
                                    );
                                  },
                                  icon: const Icon(
                                    Icons.chevron_left,
                                    size: 32,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),

                          if (_currentSlide < _slides.length - 1)
                            Positioned(
                              right: -70,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  shape: BoxShape.circle,
                                ),
                                child: IconButton(
                                  onPressed: () {
                                    _pageController.nextPage(
                                      duration: const Duration(milliseconds: 300),
                                      curve: Curves.easeInOut,
                                    );
                                  },
                                  icon: const Icon(
                                    Icons.chevron_right,
                                    size: 32,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ),
              ),

              // Bottom Slide Thumbnails
              Container(
                height: 80,
                color: Colors.grey[200],
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: _slides.length,
                  itemBuilder: (context, index) {
                    final isActive = index == _currentSlide;
                    return GestureDetector(
                      onTap: () {
                        _pageController.animateToPage(
                          index,
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: Container(
                        width: 100,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: Colors.black,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isActive ? AppColors.primary : Colors.grey[400]!,
                            width: isActive ? 3 : 1,
                          ),
                        ),
                        child: Stack(
                          children: [
                            Center(
                              child: Text(
                                '${index + 1}',
                                style: TextStyle(
                                  color: isActive ? AppColors.primary : Colors.white.withOpacity(0.5),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 24,
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 4,
                              left: 4,
                              right: 4,
                              child: Text(
                                _slides[index].title,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.7),
                                  fontSize: 8,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Progress Bar
              LinearProgressIndicator(
                value: (_currentSlide + 1) / _slides.length,
                backgroundColor: Colors.grey[300],
                valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                minHeight: 3,
              ),
            ],
          ),

          // Top Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color: Colors.grey[300]!,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Note Icon
                  Icon(Icons.description, size: 20, color: AppColors.primary),
                  const SizedBox(width: 8),
                  // Title
                  Expanded(
                    child: Text(
                      widget.note.title,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Slide Counter
                  Text(
                    '${_currentSlide + 1} / ${_slides.length}',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                  const SizedBox(width: 16),
                  // AI Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.auto_awesome,
                          size: 12,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'notes.aiGeneratedBadge'.tr(),
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Timer
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.timer,
                          size: 14,
                          color: AppColors.grey700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatTimer(),
                          style: TextStyle(
                            color: AppColors.grey700,
                            fontFamily: 'monospace',
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Refresh
                  IconButton(
                    onPressed: _generateSlides,
                    icon: Icon(
                      Icons.refresh,
                      color: AppColors.grey700,
                    ),
                    tooltip: 'notes.regenerateButton'.tr(),
                  ),
                  // Close
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: AppColors.grey700),
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
