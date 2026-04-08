import '../../../../core/network/api_client.dart';
import '../../domain/entities/research_session_entity.dart';
import '../../domain/entities/research_result_entity.dart';
import '../../domain/repositories/research_repository.dart';
import '../models/research_session_model.dart';
import '../models/research_result_model.dart';

class ResearchRepositoryImpl implements ResearchRepository {
  final ApiClient apiClient;

  ResearchRepositoryImpl({required this.apiClient});

  @override
  Future<ResearchSessionEntity> createSession({
    required String query,
    String depth = 'standard',
    List<String> sourceTypes = const ['documents'],
    String outputFormat = 'detailed',
  }) async {
    final response = await apiClient.post(
      '/research',
      data: {
        'query': query,
        'depth': depth,
        'sourceTypes': sourceTypes,
        'outputFormat': outputFormat,
      },
    );
    return ResearchSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<List<ResearchSessionEntity>> getSessions() async {
    final response = await apiClient.get('/research');
    final List<dynamic> data = response.data;
    return data
        .map((json) => ResearchSessionModel.fromJson(json).toEntity())
        .toList();
  }

  @override
  Future<ResearchSessionEntity> getSession(String id) async {
    final response = await apiClient.get('/research/$id');
    return ResearchSessionModel.fromJson(response.data).toEntity();
  }

  @override
  Future<void> startResearch(String id) async {
    // Fire-and-forget with short timeout
    // Research runs in background, we poll for status
    try {
      await apiClient.post(
        '/research/$id/start',
        data: {'includeWebSearch': true},
      ).timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          // Timeout is OK - research continues in background
          return Future.value();
        },
      );
    } catch (e) {
      // Start call timing out is expected for long research
      // Don't throw error, let polling handle status
    }
  }

  @override
  Future<ResearchResultEntity?> getResult(String id) async {
    try {
      final response = await apiClient.get('/research/$id');
      final sessionData = response.data;

      // Backend returns synthesis as markdown string, not structured object
      final synthesis = sessionData['synthesis'] as String?;
      final sources = sessionData['sources'] as List<dynamic>? ?? [];

      if (synthesis == null || synthesis.isEmpty) {
        return null;
      }

      // Parse markdown synthesis into sections
      final sections = _parseMarkdownSections(synthesis);
      final parsedSources = sources
          .map((s) => ResearchSourceModel.fromJson(s).toEntity())
          .toList();

      // Extract executive summary (first section after title)
      String? executiveSummary;
      if (sections.isNotEmpty && sections[0].heading == 'Executive Summary') {
        executiveSummary = sections[0].content;
      }

      return ResearchResultEntity(
        sessionId: id,
        executiveSummary: executiveSummary,
        sections: sections,
        sources: parsedSources,
      );
    } catch (e) {
      print('Error parsing research result: $e');
      return null;
    }
  }

  List<ResearchSectionEntity> _parseMarkdownSections(String markdown) {
    final sections = <ResearchSectionEntity>[];
    final lines = markdown.split('\n');

    String? currentHeading;
    StringBuffer currentContent = StringBuffer();
    List<String> currentKeyPoints = [];

    for (var line in lines) {
      final trimmed = line.trim();

      // Check for heading (## Heading)
      if (trimmed.startsWith('## ')) {
        // Save previous section
        if (currentHeading != null) {
          sections.add(ResearchSectionEntity(
            heading: currentHeading,
            content: currentContent.toString().trim(),
            keyPoints: currentKeyPoints,
            sourceIds: const [],
          ));
        }

        // Start new section
        currentHeading = trimmed.substring(3).trim();
        currentContent = StringBuffer();
        currentKeyPoints = [];
      } else if (trimmed.startsWith('# ')) {
        // Main title - skip or use as first heading
        continue;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet point - add to key points
        currentKeyPoints.add(trimmed.substring(2).trim());
      } else if (trimmed.isNotEmpty) {
        // Regular content
        if (currentContent.isNotEmpty) {
          currentContent.write('\n');
        }
        currentContent.write(trimmed);
      }
    }

    // Save last section
    if (currentHeading != null) {
      sections.add(ResearchSectionEntity(
        heading: currentHeading,
        content: currentContent.toString().trim(),
        keyPoints: currentKeyPoints,
        sourceIds: const [],
      ));
    }

    return sections;
  }

  @override
  Future<void> deleteSession(String id) async {
    await apiClient.delete('/research/$id');
  }
}
