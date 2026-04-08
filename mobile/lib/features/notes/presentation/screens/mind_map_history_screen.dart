import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/network/api_client.dart';
import 'study_set_mind_map_screen.dart';

class MindMapHistoryScreen extends StatefulWidget {
  const MindMapHistoryScreen({super.key});

  @override
  State<MindMapHistoryScreen> createState() => _MindMapHistoryScreenState();
}

class _MindMapHistoryScreenState extends State<MindMapHistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _mindMaps = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/ai/mind-maps');

      setState(() {
        _mindMaps = response.data as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteMindMap(String id) async {
    try {
      final apiClient = ApiClient.instance;
      await apiClient.delete('/ai/mind-maps/$id');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('notes.mindMapDeletedSuccess'.tr()),
          backgroundColor: AppColors.success,
        ),
      );

      _loadHistory();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('notes.mindMapDeleteFailed'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _viewMindMap(String id, String title) async {
    try {
      final apiClient = ApiClient.instance;
      final response = await apiClient.get('/ai/mind-maps/$id');
      final mindMapData = response.data['mindMapData'] as Map<String, dynamic>;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => _MindMapViewScreen(
            title: title,
            mindMapData: mindMapData,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('notes.mindMapLoadFailed'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
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
          'notes.mindMapHistoryTitle'.tr(),
          style: AppTextStyles.titleLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: AppColors.error),
                      SizedBox(height: 16),
                      Text('notes.failedToLoadHistory'.tr()),
                      SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _loadHistory,
                        child: Text('common.retry'.tr()),
                      ),
                    ],
                  ),
                )
              : _mindMaps.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.account_tree_outlined,
                            size: 64,
                            color: AppColors.grey400,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'notes.noMindMapsEmptyTitle'.tr(),
                            style: AppTextStyles.bodyLarge.copyWith(
                              color: AppColors.grey600,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'notes.noMindMapsEmptySubtitle'.tr(),
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.grey500,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: EdgeInsets.all(16),
                      itemCount: _mindMaps.length,
                      itemBuilder: (context, index) {
                        final mindMap = _mindMaps[index];
                        return _MindMapHistoryCard(
                          id: mindMap['id'] as String,
                          title: mindMap['title'] as String,
                          createdAt: DateTime.parse(mindMap['createdAt'] as String),
                          onView: () => _viewMindMap(
                            mindMap['id'] as String,
                            mindMap['title'] as String,
                          ),
                          onDelete: () => _showDeleteDialog(mindMap['id'] as String),
                        );
                      },
                    ),
    );
  }

  void _showDeleteDialog(String id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('notes.deleteMindMapTitle'.tr()),
        content: Text('notes.deleteMindMapConfirmation'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('common.cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteMindMap(id);
            },
            child: Text('common.delete'.tr(), style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

class _MindMapHistoryCard extends StatelessWidget {
  final String id;
  final String title;
  final DateTime createdAt;
  final VoidCallback onView;
  final VoidCallback onDelete;

  const _MindMapHistoryCard({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.onView,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.onSurface.withOpacity(0.1),
        ),
      ),
      child: InkWell(
        onTap: onView,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: AppColors.secondaryGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.account_tree,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 4),
                    Text(
                      intl.DateFormat('MMM d, y • h:mm a').format(createdAt),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey600,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.delete_outline, color: AppColors.error),
                onPressed: onDelete,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MindMapViewScreen extends StatelessWidget {
  final String title;
  final Map<String, dynamic> mindMapData;

  const _MindMapViewScreen({
    required this.title,
    required this.mindMapData,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
      ),
      body: InteractiveViewer(
        minScale: 0.5,
        maxScale: 4.0,
        boundaryMargin: EdgeInsets.all(200),
        child: Center(
          child: MindMapCanvas(data: mindMapData),
        ),
      ),
    );
  }
}
