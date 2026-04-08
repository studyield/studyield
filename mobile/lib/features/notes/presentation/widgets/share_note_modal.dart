import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../domain/entities/note_entity.dart';

class ShareNoteModal extends StatelessWidget {
  final NoteEntity note;
  final String shareUrl;

  const ShareNoteModal({
    super.key,
    required this.note,
    required this.shareUrl,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.grey400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Row(
                children: [
                  Text(
                    'notes.shareNoteTitle'.tr(),
                    style: AppTextStyles.titleLarge.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Share Link Section
              Text(
                'notes.shareLinkLabel'.tr(),
                style: AppTextStyles.titleMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.grey100.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: theme.colorScheme.onSurface.withOpacity(0.1),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.link,
                      size: 20,
                      color: AppColors.grey600,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        shareUrl,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.grey700,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      onPressed: () => _copyLink(context, shareUrl),
                      icon: const Icon(Icons.copy, size: 20),
                      style: IconButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.all(8),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Share to Social Section
              Text(
                'notes.shareToSocialLabel'.tr(),
                style: AppTextStyles.titleMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 12),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _SocialButton(
                    icon: Icons.chat,
                    label: 'notes.shareWhatsApp'.tr(),
                    color: const Color(0xFF25D366),
                    onTap: () => _shareToWhatsApp(shareUrl, note.title),
                  ),
                  _SocialButton(
                    icon: Icons.tag,
                    label: 'notes.shareTwitter'.tr(),
                    color: const Color(0xFF1DA1F2),
                    onTap: () => _shareToTwitter(shareUrl, note.title),
                  ),
                  _SocialButton(
                    icon: Icons.facebook,
                    label: 'notes.shareFacebook'.tr(),
                    color: const Color(0xFF1877F2),
                    onTap: () => _shareToFacebook(shareUrl),
                  ),
                  _SocialButton(
                    icon: Icons.business_center,
                    label: 'notes.shareLinkedIn'.tr(),
                    color: const Color(0xFF0A66C2),
                    onTap: () => _shareToLinkedIn(shareUrl, note.title),
                  ),
                  _SocialButton(
                    icon: Icons.email,
                    label: 'notes.shareEmail'.tr(),
                    color: AppColors.grey600,
                    onTap: () => _shareToEmail(shareUrl, note.title, note.content),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Download Section
              Text(
                'notes.downloadLabel'.tr(),
                style: AppTextStyles.titleMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: _DownloadButton(
                      icon: Icons.download,
                      label: 'notes.downloadText'.tr(),
                      onTap: () => _downloadAsText(context),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DownloadButton(
                      icon: Icons.download,
                      label: 'notes.downloadMarkdown'.tr(),
                      onTap: () => _downloadAsMarkdown(context),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Preview Section
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.grey100.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'notes.sharingPreviewLabel'.tr(),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey600,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      note.title,
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      note.content.replaceAll(RegExp(r'<[^>]*>'), '').replaceAll(RegExp(r'[#*_=]'), ''),
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey700,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _copyLink(BuildContext context, String link) {
    Clipboard.setData(ClipboardData(text: link));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('notes.linkCopiedSuccess'.tr()),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _shareToWhatsApp(String url, String title) {
    Share.share('$title\n\n$url');
  }

  void _shareToTwitter(String url, String title) {
    Share.share('$title\n\n$url');
  }

  void _shareToFacebook(String url) {
    Share.share(url);
  }

  void _shareToLinkedIn(String url, String title) {
    Share.share('$title\n\n$url');
  }

  void _shareToEmail(String url, String title, String content) {
    Share.share(
      '$title\n\n${content.substring(0, content.length > 200 ? 200 : content.length)}...\n\nView full note: $url',
    );
  }

  Future<void> _downloadAsText(BuildContext context) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/${note.title}.txt');
      await file.writeAsString(
        '${note.title}\n\n${note.content.replaceAll(RegExp(r'<[^>]*>'), '')}',
      );

      await Share.shareXFiles([XFile(file.path)]);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('notes.downloadTextSuccess'.tr(namedArgs: {'title': note.title}))),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('notes.downloadFailed'.tr())),
        );
      }
    }
  }

  Future<void> _downloadAsMarkdown(BuildContext context) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/${note.title}.md');
      await file.writeAsString('# ${note.title}\n\n${note.content}');

      await Share.shareXFiles([XFile(file.path)]);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('notes.downloadMarkdownSuccess'.tr(namedArgs: {'title': note.title}))),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('notes.downloadFailed'.tr())),
        );
      }
    }
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 60,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _DownloadButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DownloadButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        side: BorderSide(
          color: theme.colorScheme.onSurface.withOpacity(0.2),
        ),
      ),
    );
  }
}
