import 'package:equatable/equatable.dart';

class NarrationSegment {
  final String text;
  final double startTime;
  final double endTime;
  final String? emphasis;

  const NarrationSegment({
    required this.text,
    required this.startTime,
    required this.endTime,
    this.emphasis,
  });
}

class NarrationEntity extends Equatable {
  final String id;
  final String sessionId;
  final String audioUrl;
  final List<NarrationSegment> segments;
  final double duration;
  final String? voice;
  final double speed;
  final String status; // 'generating', 'ready', 'failed'
  final DateTime createdAt;

  const NarrationEntity({
    required this.id,
    required this.sessionId,
    required this.audioUrl,
    required this.segments,
    required this.duration,
    this.voice,
    this.speed = 1.0,
    required this.status,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        sessionId,
        audioUrl,
        segments,
        duration,
        voice,
        speed,
        status,
        createdAt,
      ];
}
