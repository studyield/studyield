import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import 'payment_success_screen.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String checkoutUrl;
  final String successUrl;

  const PaymentWebViewScreen({
    super.key,
    required this.checkoutUrl,
    required this.successUrl,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  int _loadingProgress = 0;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() => _isLoading = true);
            _checkForSuccessUrl(url);
          },
          onPageFinished: (url) {
            setState(() => _isLoading = false);
            _checkForSuccessUrl(url);
          },
          onProgress: (progress) {
            setState(() => _loadingProgress = progress);
          },
          onWebResourceError: (error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${'subscription.webview.error_loading_page'.tr()}: ${error.description}'),
                backgroundColor: AppColors.error,
              ),
            );
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  void _checkForSuccessUrl(String url) {
    // Check if redirected to success URL
    if (url.contains('/subscription/success') && url.contains('session_id=')) {
      // Extract session ID
      final uri = Uri.parse(url);
      final sessionId = uri.queryParameters['session_id'];

      if (sessionId != null) {
        // Pop webview first, then show success
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PaymentSuccessScreen(sessionId: sessionId),
          ),
        );
      }
    } else if (url.contains('/subscription') && !url.contains('checkout') && !url.contains('success')) {
      // Canceled - user went back
      Navigator.pop(context, false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: AppColors.textPrimary),
          onPressed: () => _showCancelDialog(),
        ),
        title: Text(
          'subscription.webview.appbar_title'.tr(),
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        bottom: _isLoading
            ? PreferredSize(
                preferredSize: Size.fromHeight(3),
                child: LinearProgressIndicator(
                  value: _loadingProgress / 100,
                  backgroundColor: AppColors.grey200,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.secondary),
                ),
              )
            : null,
      ),
      body: WebViewWidget(controller: _controller),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('subscription.webview.cancel_dialog_title'.tr()),
        content: Text('subscription.webview.cancel_dialog_content'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('subscription.webview.cancel_dialog_continue_btn'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, false); // Close webview
            },
            child: Text('subscription.webview.cancel_dialog_cancel_btn'.tr(), style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
