import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/content/markdown_latex_text.dart';
import '../../domain/entities/research_result_entity.dart';
import '../bloc/research_bloc.dart';
import '../bloc/research_event.dart';
import '../bloc/research_state.dart';

class ResearchReportScreen extends StatefulWidget {
  final String sessionId;

  const ResearchReportScreen({super.key, required this.sessionId});

  @override
  State<ResearchReportScreen> createState() => _ResearchReportScreenState();
}

class _ResearchReportScreenState extends State<ResearchReportScreen>
    with SingleTickerProviderStateMixin {
  ResearchResultEntity? _result;
  String _query = '';
  late TabController _tabController;
  String _citationStyle = 'apa';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final session =
          await context.read<ResearchBloc>().repo.getSession(widget.sessionId);
      setState(() => _query = session.query);
    } catch (e) {
      // Ignore
    }

    context
        .read<ResearchBloc>()
        .add(LoadResearchResult(sessionId: widget.sessionId));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: BlocListener<ResearchBloc, ResearchState>(
        listener: (context, state) {
          if (state is ResearchResultLoaded || state is ResearchCompleted) {
            setState(() {
              _result = state is ResearchResultLoaded
                  ? state.result
                  : (state as ResearchCompleted).result;
            });
          }
        },
        child: _result == null
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: AppColors.secondary),
                    const SizedBox(height: 16),
                    Text(
                      'research.messages.loading_report'.tr(),
                      style: TextStyle(
                          color:
                              theme.colorScheme.onSurface.withOpacity(0.6)),
                    ),
                  ],
                ),
              )
            : NestedScrollView(
                headerSliverBuilder: (context, innerBoxIsScrolled) {
                  return [
                    // Hero header with gradient
                    SliverAppBar(
                      expandedHeight: 180,
                      floating: false,
                      pinned: true,
                      backgroundColor: AppColors.secondary,
                      leading: IconButton(
                        icon: const Icon(Icons.arrow_back,
                            color: AppColors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                      actions: [
                        IconButton(
                          icon: const Icon(Icons.delete_outline,
                              color: AppColors.white),
                          onPressed: _confirmDelete,
                        ),
                      ],
                      flexibleSpace: FlexibleSpaceBar(
                        background: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppColors.secondary,
                                AppColors.secondaryDark,
                                AppColors.secondary,
                              ],
                            ),
                          ),
                          child: SafeArea(
                            child: Padding(
                              padding:
                                  const EdgeInsets.fromLTRB(16, 60, 16, 20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: AppColors.white
                                              .withOpacity(0.2),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: const Icon(
                                            Icons.science_rounded,
                                            color: AppColors.white,
                                            size: 20),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'research.report.deep_research'.tr(),
                                        style: TextStyle(
                                          color: AppColors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _query,
                                    style: const TextStyle(
                                      color: AppColors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      height: 1.3,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      bottom: TabBar(
                        controller: _tabController,
                        indicatorColor: AppColors.white,
                        indicatorWeight: 3,
                        labelColor: AppColors.white,
                        unselectedLabelColor:
                            AppColors.white.withOpacity(0.6),
                        labelStyle: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                        tabs: [
                          Tab(
                            icon: const Icon(Icons.description_rounded,
                                size: 20),
                            text: 'research.report.tab_report'.tr(),
                          ),
                          Tab(
                            icon: const Icon(Icons.source_rounded, size: 20),
                            text: 'research.report.tab_sources'.tr(
                                namedArgs: {
                                  'count':
                                      _result!.sources.length.toString()
                                }),
                          ),
                          Tab(
                            icon: const Icon(Icons.download_rounded,
                                size: 20),
                            text: 'research.report.tab_export'.tr(),
                          ),
                        ],
                      ),
                    ),
                  ];
                },
                body: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildReportTab(),
                    _buildSourcesTab(),
                    _buildExportTab(),
                  ],
                ),
              ),
      ),
    );
  }

  // ── Report Tab ──────────────────────────────────────
  Widget _buildReportTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Executive Summary
        if (_result!.executiveSummary != null) ...[
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.primary.withOpacity(0.08),
                  AppColors.primaryLight.withOpacity(0.04),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: AppColors.primary.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        gradient: AppColors.greenGradient,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.4),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.auto_awesome,
                          color: AppColors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'research.report.executive_summary'.tr(),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                MarkdownLatexText(
                  text: _result!.executiveSummary!,
                  style: const TextStyle(fontSize: 15, height: 1.7),
                  textColor: AppColors.textPrimary,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],

        // Sections
        ..._result!.sections
            .where(
                (s) => s.heading.toLowerCase() != 'executive summary')
            .map((section) {
          return Column(
            children: [
              _buildPremiumSection(section),
              const SizedBox(height: 20),
            ],
          );
        }),

        const SizedBox(height: 40),
      ],
    );
  }

  // ── Sources Tab ─────────────────────────────────────
  Widget _buildSourcesTab() {
    final theme = Theme.of(context);
    final kbSources =
        _result!.sources.where((s) => s.type == 'knowledge_base').toList();
    final webSources =
        _result!.sources.where((s) => s.type == 'web').toList();

    if (_result!.sources.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.public_off_rounded,
                size: 56, color: AppColors.grey400),
            const SizedBox(height: 16),
            Text(
              'research.report.no_sources'.tr(),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Knowledge Base Sources
        if (kbSources.isNotEmpty) ...[
          _buildSourceSectionHeader(
            icon: Icons.menu_book_rounded,
            color: Colors.purple,
            title: 'research.report.knowledge_base_sources'.tr(
                namedArgs: {'count': kbSources.length.toString()}),
          ),
          const SizedBox(height: 12),
          ...kbSources.map((source) => _buildSourceCard(source)),
          const SizedBox(height: 24),
        ],

        // Web Sources
        if (webSources.isNotEmpty) ...[
          _buildSourceSectionHeader(
            icon: Icons.public_rounded,
            color: Colors.blue,
            title: 'research.report.web_sources'.tr(
                namedArgs: {'count': webSources.length.toString()}),
          ),
          const SizedBox(height: 12),
          ...webSources.map((source) => _buildSourceCard(source)),
        ],

        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildSourceSectionHeader({
    required IconData icon,
    required Color color,
    required String title,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  // ── Export Tab ───────────────────────────────────────
  Widget _buildExportTab() {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Export Format section
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.cardLight,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withOpacity(0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'research.report.export_format'.tr(),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              _buildExportOption(
                icon: Icons.picture_as_pdf_rounded,
                title: 'research.report.export_pdf'.tr(),
                subtitle: 'research.report.export_pdf_desc'.tr(),
                color: AppColors.error,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text(
                            'research.messages.pdf_export_soon'.tr())),
                  );
                },
              ),
              const SizedBox(height: 10),
              _buildExportOption(
                icon: Icons.code_rounded,
                title: 'research.report.export_markdown'.tr(),
                subtitle: 'research.report.export_markdown_desc'.tr(),
                color: AppColors.secondary,
                onTap: _exportMarkdown,
              ),
              const SizedBox(height: 10),
              _buildExportOption(
                icon: Icons.text_fields_rounded,
                title: 'research.report.export_plain'.tr(),
                subtitle: 'research.report.export_plain_desc'.tr(),
                color: AppColors.primary,
                onTap: _copyAllText,
              ),
              const SizedBox(height: 10),
              _buildExportOption(
                icon: Icons.share_rounded,
                title: 'research.report.share'.tr(),
                subtitle: 'research.report.share_desc'.tr(),
                color: AppColors.info,
                onTap: _exportMarkdown,
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Citation Style section
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.cardLight,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withOpacity(0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'research.report.citation_style'.tr(),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: ['apa', 'mla', 'chicago'].map((style) {
                  final isSelected = _citationStyle == style;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _citationStyle = style),
                      child: Container(
                        margin: EdgeInsets.only(
                            right: style != 'chicago' ? 8 : 0),
                        padding: const EdgeInsets.symmetric(
                            vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withOpacity(0.1)
                              : AppColors.backgroundLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.borderLight,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            style.toUpperCase(),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (_result!.sources.isNotEmpty) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'research.report.citation_preview'.tr(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _formatCitation(
                            _result!.sources.first, 0),
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: theme.colorScheme.onSurface
                              .withOpacity(0.8),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildPremiumSection(ResearchSectionEntity section) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section heading with gradient accent
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 5,
                height: 28,
                decoration: BoxDecoration(
                  gradient: AppColors.secondaryGradient,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  section.heading,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onSurface,
                    height: 1.3,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Content
          MarkdownLatexText(
            text: section.content,
            style: TextStyle(
              fontSize: 15,
              height: 1.8,
              color: theme.colorScheme.onSurface.withOpacity(0.85),
            ),
          ),

          // Key Points (if any)
          if (section.keyPoints.isNotEmpty) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.primary.withOpacity(0.1),
                    AppColors.primaryLight.withOpacity(0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.3),
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          gradient: AppColors.greenGradient,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.stars_rounded,
                            size: 16, color: AppColors.white),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'research.report.key_insights'.tr(),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...section.keyPoints.asMap().entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              gradient: AppColors.greenGradient,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '${entry.key + 1}',
                              style: const TextStyle(
                                color: AppColors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(
                              entry.value,
                              style: TextStyle(
                                fontSize: 14,
                                height: 1.6,
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.9),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSourceCard(ResearchSourceEntity source) {
    final theme = Theme.of(context);
    final sourceIndex = _result!.sources.indexOf(source);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.cardLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title row with citation badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '[${sourceIndex + 1}]',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  source.title ?? 'research.report.study_material'.tr(),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
              // Copy citation button
              GestureDetector(
                onTap: () {
                  final citation =
                      _formatCitation(source, sourceIndex);
                  Clipboard.setData(ClipboardData(text: citation));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                          'research.report.citation_copied'.tr()),
                      backgroundColor: AppColors.success,
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.backgroundLight,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(Icons.copy_rounded,
                      size: 16,
                      color: theme.colorScheme.onSurface.withOpacity(0.5)),
                ),
              ),
            ],
          ),

          // URL
          if (source.url != null) ...[
            const SizedBox(height: 8),
            InkWell(
              onTap: () => _launchUrl(source.url!),
              child: Row(
                children: [
                  const Icon(Icons.link_rounded,
                      size: 14, color: AppColors.secondary),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      source.url!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.secondary,
                        decoration: TextDecoration.underline,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.open_in_new_rounded,
                      size: 12, color: AppColors.secondary),
                ],
              ),
            ),
          ],

          // Content preview
          const SizedBox(height: 10),
          Text(
            source.content,
            style: TextStyle(
              fontSize: 13,
              height: 1.6,
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),

          // Relevance score bar
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'research.report.relevance_label'.tr(),
                style: TextStyle(
                  fontSize: 11,
                  color: theme.colorScheme.onSurface.withOpacity(0.5),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: source.relevanceScore,
                    backgroundColor: AppColors.grey200,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      source.relevanceScore > 0.7
                          ? AppColors.success
                          : source.relevanceScore > 0.4
                              ? AppColors.warning
                              : AppColors.accent,
                    ),
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${(source.relevanceScore * 100).toInt()}%',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExportOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.white, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, size: 16, color: color),
          ],
        ),
      ),
    );
  }

  String _formatCitation(ResearchSourceEntity source, int index) {
    final now = DateTime.now();
    final year = now.year;
    final title = source.title ?? 'Study Material';
    final url = source.url;

    if (_citationStyle == 'apa') {
      return '[${index + 1}] $title. ($year).${url != null ? ' Retrieved from $url' : ''}';
    }
    if (_citationStyle == 'mla') {
      final dateStr =
          '${now.day} ${_monthName(now.month)} ${now.year}';
      return '[${index + 1}] "$title."${url != null ? ' $url.' : ''} Accessed $dateStr.';
    }
    // chicago
    final dateStr =
        '${_monthName(now.month)} ${now.day}, ${now.year}';
    return '[${index + 1}] "$title,"${url != null ? ' $url,' : ''} accessed $dateStr.';
  }

  String _monthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }

  void _confirmDelete() {
    final bloc = context.read<ResearchBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('research.report.delete_confirm_title'.tr()),
        content: Text('research.report.delete_confirm_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('research.report.delete_confirm_cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              bloc.add(
                  DeleteResearchSession(sessionId: widget.sessionId));
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: Text('research.report.delete_confirm_delete'.tr()),
          ),
        ],
      ),
    );
  }

  void _exportMarkdown() {
    final buffer = StringBuffer();
    buffer.writeln('# Research Report\n');
    buffer.writeln('**Query:** $_query\n');

    if (_result!.executiveSummary != null) {
      buffer.writeln('## Executive Summary\n');
      buffer.writeln('${_result!.executiveSummary}\n');
    }

    for (var section in _result!.sections) {
      if (section.heading.toLowerCase() != 'executive summary') {
        buffer.writeln('## ${section.heading}\n');
        buffer.writeln('${section.content}\n');
        if (section.keyPoints.isNotEmpty) {
          buffer.writeln('**Key Points:**\n');
          for (var point in section.keyPoints) {
            buffer.writeln('- $point');
          }
          buffer.writeln();
        }
      }
    }

    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.white),
            SizedBox(width: 8),
            Text('research.messages.markdown_copied'.tr()),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _copyAllText() {
    final buffer = StringBuffer();
    if (_result!.executiveSummary != null) {
      buffer.writeln('${_result!.executiveSummary}\n');
    }

    for (var section in _result!.sections) {
      if (section.heading.toLowerCase() != 'executive summary') {
        buffer.writeln('${section.heading}\n');
        buffer.writeln('${section.content}\n');
      }
    }

    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.white),
            SizedBox(width: 8),
            Text('research.messages.report_copied'.tr()),
          ],
        ),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text('research.messages.could_not_open_link'.tr())),
      );
    }
  }
}
