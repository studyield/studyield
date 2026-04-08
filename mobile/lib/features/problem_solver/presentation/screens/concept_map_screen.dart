import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/concept_map_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';

class ConceptMapScreen extends StatefulWidget {
  final String sessionId;

  const ConceptMapScreen({super.key, required this.sessionId});

  @override
  State<ConceptMapScreen> createState() => _ConceptMapScreenState();
}

class _ConceptMapScreenState extends State<ConceptMapScreen> with TickerProviderStateMixin {
  ConceptMapEntity? _conceptMap;
  late AnimationController _fadeController;
  late AnimationController _scaleController;
  final Set<String> _expandedConcepts = {};

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    context.read<ProblemSolverBloc>().add(LoadConceptMap(sessionId: widget.sessionId));
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  void _toggleExpand(String conceptName) {
    setState(() {
      if (_expandedConcepts.contains(conceptName)) {
        _expandedConcepts.remove(conceptName);
      } else {
        _expandedConcepts.add(conceptName);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: theme.cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.account_tree, color: Color(0xFF9333EA), size: 20),
                const SizedBox(width: 8),
                Text('problem_solver.concept_map.title'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            Text(
              'problem_solver.concept_map.subtitle'.tr(),
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
                fontSize: 11,
              ),
            ),
          ],
        ),
        toolbarHeight: 70,
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is ConceptMapLoaded) {
            setState(() => _conceptMap = state.conceptMap);
            _fadeController.forward();
            _scaleController.forward();
          }
        },
        child: _conceptMap == null
            ? const Center(child: CircularProgressIndicator())
            : FadeTransition(
                opacity: _fadeController,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Central Topic (Hero)
                      ScaleTransition(
                        scale: Tween<double>(begin: 0.8, end: 1.0).animate(
                          CurvedAnimation(parent: _scaleController, curve: Curves.elasticOut),
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF9333EA), Color(0xFF7C3AED)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF9333EA).withOpacity(0.4),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.emoji_objects,
                                  color: Colors.white,
                                  size: 32,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _conceptMap!.centralTopic,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'problem_solver.concept_map.central_topic'.tr(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Prerequisites (Red)
                      if (_conceptMap!.prerequisites.isNotEmpty) ...[
                        _buildSection(
                          title: 'problem_solver.concept_map.prerequisites'.tr(),
                          subtitle: 'problem_solver.concept_map.sections.prerequisites_subtitle'.tr(),
                          icon: Icons.school,
                          color: const Color(0xFFEF4444),
                          concepts: _conceptMap!.prerequisites,
                          index: 0,
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Current Concepts (Purple)
                      if (_conceptMap!.currentConcepts.isNotEmpty) ...[
                        _buildSection(
                          title: 'problem_solver.concept_map.current_concepts'.tr(),
                          subtitle: 'problem_solver.concept_map.sections.current_concepts_subtitle'.tr(),
                          icon: Icons.stars,
                          color: const Color(0xFF9333EA),
                          concepts: _conceptMap!.currentConcepts,
                          index: 1,
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Next Concepts (Blue)
                      if (_conceptMap!.nextConcepts.isNotEmpty) ...[
                        _buildSection(
                          title: 'problem_solver.concept_map.next_steps'.tr(),
                          subtitle: 'problem_solver.concept_map.sections.next_steps_subtitle'.tr(),
                          icon: Icons.trending_up,
                          color: const Color(0xFF3B82F6),
                          concepts: _conceptMap!.nextConcepts,
                          index: 2,
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Related Concepts (Amber)
                      if (_conceptMap!.relatedConcepts.isNotEmpty) ...[
                        _buildSection(
                          title: 'problem_solver.concept_map.related_topics'.tr(),
                          subtitle: 'problem_solver.concept_map.sections.related_topics_subtitle'.tr(),
                          icon: Icons.hub,
                          color: const Color(0xFFF59E0B),
                          concepts: _conceptMap!.relatedConcepts,
                          index: 3,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required List<ConceptNode> concepts,
    required int index,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                color.withOpacity(0.1),
                color.withOpacity(0.05),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: color.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.grey600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${concepts.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Concept Cards
        ...concepts.asMap().entries.map((entry) {
          final idx = entry.key;
          final concept = entry.value;
          final isExpanded = _expandedConcepts.contains(concept.name);

          return TweenAnimationBuilder<double>(
            duration: Duration(milliseconds: 400 + (idx * 100)),
            tween: Tween(begin: 0.0, end: 1.0),
            builder: (context, value, child) {
              return Opacity(
                opacity: value,
                child: Transform.translate(
                  offset: Offset(0, 20 * (1 - value)),
                  child: child,
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: color.withOpacity(0.3),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _toggleExpand(concept.name),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // Number Badge
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: color.withOpacity(0.15),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: color,
                                  width: 2,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  '${idx + 1}',
                                  style: TextStyle(
                                    color: color,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Concept Name
                            Expanded(
                              child: Text(
                                concept.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ),

                            // Difficulty Badge
                            if (concept.difficulty != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _getDifficultyColor(concept.difficulty!).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: _getDifficultyColor(concept.difficulty!),
                                    width: 1.5,
                                  ),
                                ),
                                child: Text(
                                  concept.difficulty!.toUpperCase(),
                                  style: TextStyle(
                                    color: _getDifficultyColor(concept.difficulty!),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),

                            const SizedBox(width: 8),

                            // Expand Icon
                            Icon(
                              isExpanded ? Icons.expand_less : Icons.expand_more,
                              color: color,
                            ),
                          ],
                        ),

                        // Description (Always visible, brief)
                        const SizedBox(height: 12),
                        Text(
                          concept.description,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey600,
                            height: 1.5,
                          ),
                          maxLines: isExpanded ? null : 2,
                          overflow: isExpanded ? null : TextOverflow.ellipsis,
                        ),

                        // Expanded Content
                        if (isExpanded) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: color.withOpacity(0.2),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (concept.importance != null) ...[
                                  Row(
                                    children: [
                                      Icon(Icons.priority_high, color: color, size: 16),
                                      const SizedBox(width: 8),
                                      Text(
                                        'problem_solver.concept_map.importance'.tr(),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    concept.importance!,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  const SizedBox(height: 12),
                                ],
                                if (concept.relationship != null) ...[
                                  Row(
                                    children: [
                                      Icon(Icons.link, color: color, size: 16),
                                      const SizedBox(width: 8),
                                      Text(
                                        'problem_solver.concept_map.connection'.tr(),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    concept.relationship!,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'hard':
        return Colors.red;
      default:
        return AppColors.grey600;
    }
  }
}
