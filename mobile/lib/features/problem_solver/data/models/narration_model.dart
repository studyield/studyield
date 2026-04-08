import '../../domain/entities/narration_entity.dart';

class NarrationSegmentModel extends NarrationSegment {
  const NarrationSegmentModel({
    required super.text,
    required super.startTime,
    required super.endTime,
    super.emphasis,
  });

  factory NarrationSegmentModel.fromJson(Map<String, dynamic> json) {
    return NarrationSegmentModel(
      text: json['text'] ?? '',
      startTime: (json['startTime'] ?? 0.0).toDouble(),
      endTime: (json['endTime'] ?? 0.0).toDouble(),
      emphasis: json['emphasis'],
    );
  }
}

class NarrationModel extends NarrationEntity {
  const NarrationModel({
    required super.id,
    required super.sessionId,
    required super.audioUrl,
    required super.segments,
    required super.duration,
    super.voice,
    super.speed,
    required super.status,
    required super.createdAt,
  });

  factory NarrationModel.fromJson(Map<String, dynamic> json) {
    return NarrationModel(
      id: json['id'] ?? '',
      sessionId: json['sessionId'] ?? '',
      audioUrl: json['audioUrl'] ?? '',
      segments: (json['segments'] as List<dynamic>?)
              ?.map((e) => NarrationSegmentModel.fromJson(e))
              .toList() ??
          [],
      duration: (json['duration'] ?? 0.0).toDouble(),
      voice: json['voice'],
      speed: (json['speed'] ?? 1.0).toDouble(),
      status: json['status'] ?? 'generating',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  NarrationEntity toEntity() => this;
}
