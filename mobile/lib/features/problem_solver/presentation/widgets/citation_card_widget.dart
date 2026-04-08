import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/citation_entity.dart';

class CitationCard extends StatelessWidget {
  final CitationEntity citation;

  const CitationCard({
    super.key,
    required this.citation,
  });

  Color _getAgentColor(AgentType agent) {
    switch (agent) {
      case AgentType.analysis:
        return Colors.blue;
      case AgentType.solver:
        return Colors.amber;
      case AgentType.verifier:
        return Colors.green;
    }
  }

  String _getAgentLabel(AgentType agent) {
    switch (agent) {
      case AgentType.analysis:
        return 'Analysis Agent';
      case AgentType.solver:
        return 'Solver Agent';
      case AgentType.verifier:
        return 'Verifier Agent';
    }
  }

  IconData _getAgentIcon(AgentType agent) {
    switch (agent) {
      case AgentType.analysis:
        return Icons.analytics;
      case AgentType.solver:
        return Icons.calculate;
      case AgentType.verifier:
        return Icons.verified;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                const Icon(
                  Icons.fact_check,
                  color: AppColors.purple,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'Solution Confidence',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Agent confidences
            ...citation.agentConfidences.map((agentConfidence) {
              return _buildConfidenceBar(context, agentConfidence);
            }),

            // Sources section
            if (citation.sources.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(
                    Icons.link,
                    color: AppColors.purple,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Sources',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...citation.sources.map((source) {
                return _buildSourceLink(context, source);
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildConfidenceBar(BuildContext context, AgentConfidence agentConfidence) {
    final color = _getAgentColor(agentConfidence.agent);
    final percentage = (agentConfidence.confidence * 100).toInt();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getAgentIcon(agentConfidence.agent),
                  size: 20,
                  color: color,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _getAgentLabel(agentConfidence.agent),
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        Text(
                          '$percentage%',
                          style: TextStyle(
                            color: color,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      agentConfidence.status,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: agentConfidence.confidence,
              minHeight: 8,
              backgroundColor: color.withOpacity(0.2),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSourceLink(BuildContext context, String source) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _launchUrl(source),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: AppColors.border.withOpacity(0.5),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.open_in_new,
                size: 16,
                color: AppColors.purple,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  source,
                  style: TextStyle(
                    color: AppColors.purple,
                    decoration: TextDecoration.underline,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _launchUrl(String urlString) async {
    try {
      final uri = Uri.parse(urlString);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      // Handle error silently or show a snackbar
      debugPrint('Error launching URL: $e');
    }
  }
}
