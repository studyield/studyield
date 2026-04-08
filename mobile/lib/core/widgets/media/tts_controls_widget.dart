import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../../../features/problem_solver/domain/entities/narration_entity.dart';
import '../../theme/app_colors.dart';

enum TtsState { stopped, playing, paused }

class TtsControlsWidget extends StatefulWidget {
  final NarrationEntity narration;
  final VoidCallback? onComplete;

  const TtsControlsWidget({
    super.key,
    required this.narration,
    this.onComplete,
  });

  @override
  State<TtsControlsWidget> createState() => _TtsControlsWidgetState();
}

class _TtsControlsWidgetState extends State<TtsControlsWidget>
    with SingleTickerProviderStateMixin {
  final FlutterTts _flutterTts = FlutterTts();
  TtsState _ttsState = TtsState.stopped;
  double _currentSpeed = 0.6; // Start slower
  int _currentSegment = 0;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _initTts();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    // Auto-play when widget is created
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _speak();
      }
    });
  }

  @override
  void dispose() {
    _flutterTts.stop();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _initTts() async {
    try {
      await _flutterTts.setLanguage('en-US');
      await _flutterTts.setSpeechRate(0.6); // Start with slower speed for better comprehension
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);

      setState(() {
        _currentSpeed = 0.6; // Update state to match
      });

      _flutterTts.setStartHandler(() {
        if (mounted) {
          setState(() {
            _ttsState = TtsState.playing;
          });
        }
      });

      _flutterTts.setCompletionHandler(() {
        if (mounted) {
          setState(() {
            _ttsState = TtsState.stopped;
            _currentSegment = 0;
          });
          widget.onComplete?.call();
        }
      });

      _flutterTts.setErrorHandler((message) {
        if (mounted) {
          setState(() {
            _ttsState = TtsState.stopped;
          });
        }
      });
    } catch (e) {
      debugPrint('TTS initialization error: $e');
      // TTS not available on this platform
    }
  }

  Future<void> _speak() async {
    try {
      final text = _getCurrentText();
      if (text.isEmpty) {
        debugPrint('No text to speak');
        return;
      }

      if (_ttsState == TtsState.paused) {
        // Resume from pause (not all platforms support this)
        await _flutterTts.speak(text);
      } else {
        // Start from beginning or current segment
        await _flutterTts.speak(text);
      }
    } catch (e) {
      debugPrint('TTS speak error: $e');
      if (mounted) {
        setState(() {
          _ttsState = TtsState.stopped;
        });
      }
    }
  }

  Future<void> _pause() async {
    try {
      await _flutterTts.pause();
      if (mounted) {
        setState(() {
          _ttsState = TtsState.paused;
        });
      }
    } catch (e) {
      debugPrint('TTS pause error: $e');
    }
  }

  Future<void> _stop() async {
    try {
      await _flutterTts.stop();
      if (mounted) {
        setState(() {
          _ttsState = TtsState.stopped;
          _currentSegment = 0;
        });
      }
    } catch (e) {
      debugPrint('TTS stop error: $e');
    }
  }

  Future<void> _setSpeed(double speed) async {
    try {
      await _flutterTts.setSpeechRate(speed);
      if (mounted) {
        setState(() {
          _currentSpeed = speed;
        });
      }
    } catch (e) {
      debugPrint('TTS speed error: $e');
    }
  }

  String _getCurrentText() {
    if (widget.narration.segments.isEmpty) {
      return '';
    }

    // Combine all segments for full narration
    return widget.narration.segments.map((s) => s.text).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: _ttsState == TtsState.playing
            ? AppColors.purpleGradient
            : null,
        color: _ttsState == TtsState.playing ? null : AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _ttsState == TtsState.playing
                ? AppColors.purple.withOpacity(0.3)
                : Colors.black.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildMainControls(),
          const SizedBox(height: 16),
          _buildSpeedSelector(),
          if (_ttsState == TtsState.playing) ...[
            const SizedBox(height: 20),
            _buildProgressIndicator(),
          ],
        ],
      ),
    );
  }

  Widget _buildMainControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Stop button
        if (_ttsState != TtsState.stopped)
          _buildControlButton(
            icon: Icons.stop,
            onPressed: _stop,
            color: Colors.red,
          ),
        if (_ttsState != TtsState.stopped) const SizedBox(width: 16),

        // Play/Pause button
        AnimatedBuilder(
          animation: _pulseController,
          builder: (context, child) {
            final scale = _ttsState == TtsState.playing
                ? 1.0 + (_pulseController.value * 0.1)
                : 1.0;

            return Transform.scale(
              scale: scale,
              child: _buildControlButton(
                icon: _ttsState == TtsState.playing
                    ? Icons.pause
                    : Icons.play_arrow,
                onPressed: _ttsState == TtsState.playing ? _pause : _speak,
                color: _ttsState == TtsState.playing
                    ? Colors.white
                    : AppColors.purple,
                isLarge: true,
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required VoidCallback onPressed,
    required Color color,
    bool isLarge = false,
  }) {
    final size = isLarge ? 64.0 : 48.0;
    final iconSize = isLarge ? 36.0 : 24.0;

    return Material(
      color: _ttsState == TtsState.playing && isLarge
          ? Colors.white.withOpacity(0.2)
          : color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(size / 2),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(size / 2),
        child: SizedBox(
          width: size,
          height: size,
          child: Icon(
            icon,
            size: iconSize,
            color: _ttsState == TtsState.playing && isLarge
                ? Colors.white
                : color,
          ),
        ),
      ),
    );
  }

  Widget _buildSpeedSelector() {
    final speeds = [
      {'value': 0.5, 'label': 'Slow'},
      {'value': 0.75, 'label': 'Normal'},
      {'value': 1.0, 'label': 'Fast'},
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.speed,
          size: 18,
          color: _ttsState == TtsState.playing
              ? Colors.white
              : AppColors.textPrimary,
        ),
        const SizedBox(width: 8),
        Text(
          'Speed:',
          style: TextStyle(
            color: _ttsState == TtsState.playing
                ? Colors.white
                : AppColors.textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 12),
        ...speeds.map((speedOption) {
          final speed = speedOption['value'] as double;
          final label = speedOption['label'] as String;
          final isSelected = (_currentSpeed - speed).abs() < 0.01;

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: InkWell(
              onTap: () => _setSpeed(speed),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: isSelected
                      ? (_ttsState == TtsState.playing
                          ? Colors.white
                          : AppColors.purple)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _ttsState == TtsState.playing
                        ? Colors.white.withOpacity(0.5)
                        : AppColors.border,
                    width: 1,
                  ),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    color: isSelected
                        ? (_ttsState == TtsState.playing
                            ? AppColors.purple
                            : Colors.white)
                        : (_ttsState == TtsState.playing
                            ? Colors.white
                            : AppColors.textPrimary),
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildProgressIndicator() {
    return Column(
      children: [
        LinearProgressIndicator(
          backgroundColor: Colors.white.withOpacity(0.3),
          valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.volume_up, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text(
              'Playing solution narration...',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
