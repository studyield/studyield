import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../domain/entities/study_set_entity.dart';

class DocumentsScreen extends StatefulWidget {
  final StudySetEntity studySet;

  const DocumentsScreen({
    super.key,
    required this.studySet,
  });

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  List<Map<String, dynamic>> _notes = [];
  bool _isLoading = true;
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _contentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadNotes();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _loadNotes() async {
    setState(() => _isLoading = true);
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/study-sets/${widget.studySet.id}/notes');
      setState(() {
        _notes = (response.data as List<dynamic>)
            .map((n) => n as Map<String, dynamic>)
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      print('Failed to load notes: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _createNote() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    if (title.isEmpty || content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('study_sets.documents.fill_title_and_content'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      final apiClient = ApiClient.instance;
      await apiClient.post(
        '/study-sets/${widget.studySet.id}/notes',
        data: {
          'studySetId': widget.studySet.id,
          'title': title,
          'content': content,
          'sourceType': 'manual',
        },
      );

      _titleController.clear();
      _contentController.clear();
      Navigator.pop(context);
      _loadNotes();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('study_sets.documents.note_created_successfully'.tr()),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('study_sets.documents.failed_to_create_note'.tr(namedArgs: {'error': e.toString()})),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showCreateNoteDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.9,
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(
                margin: EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey400,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: EdgeInsets.all(20),
                child: Row(
                  children: [
                    Icon(Icons.note_add, color: AppColors.secondary),
                    SizedBox(width: 12),
                    Text(
                      'study_sets.documents.create_note'.tr(),
                      style: AppTextStyles.titleLarge.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Spacer(),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Divider(height: 1),
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: _titleController,
                        decoration: InputDecoration(
                          labelText: 'study_sets.documents.title'.tr(),
                          hintText: 'study_sets.documents.enter_note_title'.tr(),
                          prefixIcon: Icon(Icons.title),
                        ),
                      ),
                      SizedBox(height: 20),
                      TextFormField(
                        controller: _contentController,
                        decoration: InputDecoration(
                          labelText: 'study_sets.documents.content'.tr(),
                          hintText: 'study_sets.documents.write_your_note_here'.tr(),
                          prefixIcon: Icon(Icons.notes),
                          alignLabelWithHint: true,
                        ),
                        maxLines: 15,
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1),
                    ),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: PrimaryButton(
                    text: 'study_sets.documents.create_note'.tr(),
                    icon: Icons.check,
                    onPressed: _createNote,
                    gradient: AppColors.greenGradient,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'study_sets.documents.notes'.tr(),
              style: AppTextStyles.titleMedium.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              widget.studySet.title,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: _showCreateNoteDialog,
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _notes.isEmpty
              ? Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppDimensions.space24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.note_outlined,
                          size: 64,
                          color: AppColors.grey400,
                        ),
                        SizedBox(height: AppDimensions.space16),
                        Text(
                          'study_sets.documents.no_notes_yet'.tr(),
                          style: AppTextStyles.titleLarge.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        SizedBox(height: AppDimensions.space8),
                        Text(
                          'study_sets.documents.create_notes_description'.tr(),
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.grey600,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: 24),
                        PrimaryButton(
                          text: 'study_sets.documents.create_note'.tr(),
                          icon: Icons.add,
                          onPressed: _showCreateNoteDialog,
                          gradient: AppColors.greenGradient,
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  padding: EdgeInsets.all(AppDimensions.space16),
                  itemCount: _notes.length,
                  itemBuilder: (context, index) {
                    final note = _notes[index];
                    final createdAt = DateTime.parse(note['createdAt'] as String);

                    return Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: () {
                          // TODO: View note detail
                        },
                        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                        child: Container(
                          padding: EdgeInsets.all(16),
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
                                note['title'] as String,
                                style: AppTextStyles.titleSmall.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(height: 8),
                              Text(
                                (note['content'] as String).substring(
                                  0,
                                  (note['content'] as String).length > 100
                                      ? 100
                                      : (note['content'] as String).length,
                                ) + ((note['content'] as String).length > 100 ? '...' : ''),
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.grey600,
                                ),
                                maxLines: 3,
                              ),
                              SizedBox(height: 8),
                              Text(
                                '${createdAt.month}/${createdAt.day}/${createdAt.year}',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.grey500,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: _notes.isEmpty
          ? null
          : FloatingActionButton(
              onPressed: _showCreateNoteDialog,
              backgroundColor: AppColors.secondary,
              child: Icon(Icons.add, color: Colors.white),
            ),
    );
  }
}
