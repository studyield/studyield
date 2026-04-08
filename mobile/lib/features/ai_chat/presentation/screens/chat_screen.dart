import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart' as http_parser;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/content/latex_text_widget.dart';
import '../../../../core/widgets/content/markdown_latex_text.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/chat_socket_service.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../bloc/chat_bloc.dart';
import '../bloc/chat_event.dart';
import '../bloc/chat_state.dart';
import 'chat_history_screen.dart';

class ChatScreen extends StatefulWidget {
  final String? conversationId;

  const ChatScreen({super.key, this.conversationId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<ChatMessageEntity> _messages = [];
  String? _currentConversationId;
  bool _isSending = false;
  String _streamingContent = '';
  List<File> _selectedFiles = [];
  final ImagePicker _imagePicker = ImagePicker();
  final Map<String, List<File>> _messageFiles = {}; // Store files for temp messages
  final ChatSocketService _socketService = ChatSocketService.instance;
  ChatMessageEntity? _streamingMessage;

  @override
  void initState() {
    super.initState();
    _currentConversationId = widget.conversationId;

    print('🎬 ChatScreen initState - conversationId: ${_currentConversationId ?? "BLANK"}');

    // Connect to Socket.IO
    _socketService.connect();
    _setupSocketListeners();

    if (_currentConversationId != null) {
      print('📥 Loading messages for conversation: $_currentConversationId');
      context.read<ChatBloc>().add(LoadMessages(conversationId: _currentConversationId!));
      _socketService.joinConversation(_currentConversationId!);
    } else {
      print('📝 Blank chat screen - no conversation loaded');
    }
  }

  void _setupSocketListeners() {
    // Listen for message chunks (streaming response)
    _socketService.onMessageChunk((data) {
      print('📨 Chunk received: ${data['type']}');

      if (data['type'] == 'content') {
        setState(() {
          _streamingContent += data['data'] as String;

          // Update or create streaming message
          if (_streamingMessage == null) {
            _streamingMessage = ChatMessageEntity(
              id: 'streaming_${DateTime.now().millisecondsSinceEpoch}',
              conversationId: _currentConversationId!,
              role: MessageRole.assistant,
              content: _streamingContent,
              createdAt: DateTime.now(),
              citations: [],
            );
            _messages.add(_streamingMessage!);
          } else {
            // Update existing streaming message
            final index = _messages.indexWhere((m) => m.id == _streamingMessage!.id);
            if (index != -1) {
              _messages[index] = ChatMessageEntity(
                id: _streamingMessage!.id,
                conversationId: _currentConversationId!,
                role: MessageRole.assistant,
                content: _streamingContent,
                createdAt: _streamingMessage!.createdAt,
                citations: [],
              );
            }
          }
        });
        _scrollToBottom();
      } else if (data['type'] == 'citation') {
        // Handle citations if needed
        print('📚 Citation received');
      }
    });

    // Listen for message complete
    _socketService.onMessageComplete((data) {
      print('✅ Message streaming complete');
      setState(() {
        _isSending = false;
        _streamingContent = '';
        _streamingMessage = null;
      });

      // Reload messages to get the final saved version
      if (_currentConversationId != null) {
        context.read<ChatBloc>().add(LoadMessages(conversationId: _currentConversationId!));
      }
    });

    // Listen for errors
    _socketService.onError((data) {
      print('❌ Socket error: ${data['message']}');
      setState(() {
        _isSending = false;
        _streamingContent = '';
        _streamingMessage = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(data['message'] as String? ?? 'common.errorGeneric'.tr()),
          backgroundColor: Colors.red,
        ),
      );
    });
  }

  @override
  void dispose() {
    if (_currentConversationId != null) {
      _socketService.leaveConversation(_currentConversationId!);
    }
    _socketService.removeAllListeners();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    final hasFiles = _selectedFiles.isNotEmpty;

    // Allow sending if either content or files exist
    if (content.isEmpty && !hasFiles) return;

    if (_currentConversationId == null) {
      // Create new conversation with first message as title (like web)
      final title = content.isNotEmpty
          ? (content.length > 100 ? content.substring(0, 100) : content)
          : 'ai_chat.new_conversation'.tr();
      context.read<ChatBloc>().add(CreateConversation(title: title));
      return;
    }

    // If files are attached, use REST API upload endpoint
    if (hasFiles) {
      print('📎 Sending message with ${_selectedFiles.length} files via REST');
      await _sendMessageWithFiles(content);
    } else {
      // Regular text message via Socket.IO for real-time streaming
      print('💬 Sending text message via Socket.IO');

      // Add user message to UI immediately
      setState(() {
        _messages.add(ChatMessageEntity(
          id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
          conversationId: _currentConversationId!,
          role: MessageRole.user,
          content: content,
          createdAt: DateTime.now(),
          citations: [],
        ));
        _isSending = true;
        _streamingContent = '';
        _streamingMessage = null;
      });

      _messageController.clear();
      _scrollToBottom();

      // Send via Socket.IO
      _socketService.sendMessage(_currentConversationId!, content);
    }
  }

  Future<void> _sendMessageWithFiles(String content) async {
    try {
      print('🚀 Starting file upload...');
      print('📎 Files to upload: ${_selectedFiles.length}');
      print('📂 Files: ${_selectedFiles.map((f) => f.path.split('/').last).join(', ')}');
      print('💬 Content: "${content}"');

      setState(() => _isSending = true);

      final apiClient = ApiClient.instance;
      final formData = FormData();

      // Add files - IMPORTANT: backend expects 'files' as the field name
      for (final file in _selectedFiles) {
        // Verify file exists
        if (!await file.exists()) {
          print('❌ File does not exist: ${file.path}');
          throw Exception('File not found: ${file.path}');
        }

        final fileName = file.path.split('/').last;
        final fileSize = await file.length();

        print('📄 File details:');
        print('   - Name: $fileName');
        print('   - Path: ${file.path}');
        print('   - Size: $fileSize bytes');
        print('   - Exists: ${await file.exists()}');

        // Detect mime type
        String? mimeType;
        if (fileName.toLowerCase().endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (fileName.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (fileName.toLowerCase().endsWith('.webp')) {
          mimeType = 'image/webp';
        }

        print('   - Detected MIME type: $mimeType');

        try {
          final multipartFile = await MultipartFile.fromFile(
            file.path,
            filename: fileName,
            contentType: mimeType != null ? http_parser.MediaType.parse(mimeType) : null,
          );

          formData.files.add(MapEntry('files', multipartFile));
          print('✅ File added to FormData');
        } catch (fileError) {
          print('❌ Failed to add file to FormData: $fileError');
          throw Exception('Failed to process file: $fileName');
        }
      }

      // Add content field
      final messageContent = content.isEmpty ? 'Please analyze these files' : content;
      formData.fields.add(MapEntry('content', messageContent));

      print('📤 Sending to: /chat/conversations/$_currentConversationId/messages/upload');
      print('📋 FormData files count: ${formData.files.length}');
      print('📋 FormData fields: ${formData.fields.map((e) => '${e.key}=${e.value}').join(', ')}');

      // Add user message to UI immediately (optimistic update)
      final tempMessage = ChatMessageEntity(
        id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
        conversationId: _currentConversationId!,
        role: MessageRole.user,
        content: content.isEmpty ? 'Sent ${_selectedFiles.length} file(s)' : content,
        createdAt: DateTime.now(),
        citations: [],
      );

      // Store file paths temporarily in a map for preview
      final tempFiles = List<File>.from(_selectedFiles);

      setState(() {
        _messages.add(tempMessage);
        // Store files for this message temporarily
        _messageFiles[tempMessage.id] = tempFiles;
      });

      // Send request
      final response = await apiClient.post(
        '/chat/conversations/$_currentConversationId/messages/upload',
        data: formData,
      );

      print('✅ Upload successful! Response status: ${response.statusCode}');
      print('✅ Response data: ${response.data}');

      // Clear inputs
      _messageController.clear();
      setState(() {
        _selectedFiles.clear();
        _isSending = false;
      });

      // Don't reload - keep the optimistic update with local files visible
      // Just add the AI response when it comes via socket
      _scrollToBottom();
    } catch (e, stackTrace) {
      print('❌ Upload failed: $e');
      print('❌ Stack trace: $stackTrace');

      setState(() => _isSending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send files: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // If we came from history (have conversationId), go back to history
            // Otherwise just pop
            if (widget.conversationId != null) {
              Navigator.pop(context);
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: Text('ai_chat.title'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BlocProvider.value(
                    value: context.read<ChatBloc>(),
                    child: const ChatHistoryScreen(),
                  ),
                ),
              ).then((_) {
                // When returning from history, ensure we're still on blank chat
                print('📱 Returned from history to blank chat');
              });
            },
            tooltip: 'ai_chat.history_title'.tr(),
          ),
        ],
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withOpacity(0.02),
              Colors.white,
              Colors.white,
            ],
          ),
        ),
        child: BlocListener<ChatBloc, ChatState>(
          listener: (context, state) {
            if (state is ConversationCreated) {
            setState(() {
              _currentConversationId = state.conversation.id;
            });

            // Join the conversation room via Socket.IO
            _socketService.joinConversation(_currentConversationId!);

            // Send the pending message
            if (_messageController.text.trim().isNotEmpty) {
              final content = _messageController.text.trim();
              _messageController.clear();

              // Add user message to UI
              setState(() {
                _messages.add(ChatMessageEntity(
                  id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
                  conversationId: _currentConversationId!,
                  role: MessageRole.user,
                  content: content,
                  createdAt: DateTime.now(),
                  citations: [],
                ));
                _isSending = true;
              });

              // Send via Socket.IO
              _socketService.sendMessage(_currentConversationId!, content);

              _scrollToBottom();
            }
          } else if (state is MessagesLoaded) {
            // Merge loaded messages with local file data
            final loadedMessages = state.messages;

            // Preserve file attachments from temp messages
            for (var loadedMsg in loadedMessages) {
              // Find matching temp message by content and time proximity
              final matchingTemp = _messages.firstWhere(
                (m) => m.content == loadedMsg.content &&
                       m.createdAt.difference(loadedMsg.createdAt).inSeconds.abs() < 10,
                orElse: () => loadedMsg,
              );

              // If temp message had files, preserve them
              if (_messageFiles.containsKey(matchingTemp.id)) {
                _messageFiles[loadedMsg.id] = _messageFiles[matchingTemp.id]!;
              }
            }

            setState(() {
              _messages = loadedMessages;
              _isSending = false;
            });
            _scrollToBottom();
          } else if (state is MessageSending) {
            setState(() => _isSending = true);
          } else if (state is MessageSent) {
            setState(() => _isSending = false);
            // Reload messages
            if (_currentConversationId != null) {
              context.read<ChatBloc>().add(LoadMessages(conversationId: _currentConversationId!));
            }
          } else if (state is ChatError) {
            setState(() => _isSending = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        child: Column(
          children: [
            // Messages list
            Expanded(
              child: _messages.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 20),
                      itemCount: _messages.length + (_isSending && _streamingMessage == null ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _messages.length && _isSending) {
                          // Typing indicator
                          return _buildTypingIndicator();
                        }

                        final message = _messages[index];
                        return _buildMessageBubble(message);
                      },
                    ),
            ),

            // Input area
            _buildInputArea(),
          ],
        ),
      ),
      ),
    );
  }

  void _sendPrompt(String prompt) {
    _messageController.text = prompt;
    _sendMessage();
  }

  Future<void> _pickFiles() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      );

      if (result != null) {
        setState(() {
          _selectedFiles = result.paths
              .where((path) => path != null)
              .map((path) => File(path!))
              .toList();
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick files: $e')),
      );
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _imagePicker.pickImage(source: source);
      if (image != null) {
        setState(() {
          _selectedFiles.add(File(image.path));
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  void _removeFile(int index) {
    setState(() {
      _selectedFiles.removeAt(index);
    });
  }

  void _showFilePickerOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library, color: AppColors.primary),
              title: Text('ai_chat.file_picker.gallery'.tr()),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: AppColors.primary),
              title: Text('ai_chat.file_picker.camera'.tr()),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: AppColors.primary),
              title: Text('ai_chat.file_picker.pdf'.tr()),
              onTap: () {
                Navigator.pop(context);
                _pickFiles();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 60),
          // Icon
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.smart_toy,
              size: 40,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          // Title
          Text(
            'ai_chat.empty_state.title'.tr(),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          // Description
          Text(
            'ai_chat.empty_state.description'.tr(),
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black54,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 40),
          // Prompt cards in 2x2 grid
          _buildPromptGrid(),
        ],
      ),
    );
  }

  Widget _buildPromptGrid() {
    final prompts = [
      {
        'icon': Icons.menu_book,
        'text': 'ai_chat.empty_state.prompts.explain'.tr(),
      },
      {
        'icon': Icons.summarize,
        'text': 'ai_chat.empty_state.prompts.summary'.tr(),
      },
      {
        'icon': Icons.lightbulb_outline,
        'text': 'ai_chat.empty_state.prompts.important'.tr(),
      },
      {
        'icon': Icons.school,
        'text': 'ai_chat.empty_state.prompts.examples'.tr(),
      },
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 2.8,
      children: prompts.map((prompt) {
        return GestureDetector(
          onTap: () => _sendPrompt(prompt['text'] as String),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.grey300),
            ),
            child: Row(
              children: [
                Icon(
                  prompt['icon'] as IconData,
                  color: AppColors.primary,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    prompt['text'] as String,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.black54,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMessageBubble(ChatMessageEntity message) {
    final isUser = message.role == MessageRole.user;
    final attachedFiles = _messageFiles[message.id];

    // Also check metadata for file URLs from server
    final metadata = message.metadata;
    final metadataFiles = metadata != null && metadata.containsKey('files')
        ? metadata['files'] as List<dynamic>?
        : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          // Bot avatar (only for bot messages)
          if (!isUser) ...[
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: AppColors.greenGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.smart_toy,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
          ],
          // Message bubble
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(14),
              constraints: BoxConstraints(
                maxWidth: isUser
                    ? MediaQuery.of(context).size.width * 0.75
                    : MediaQuery.of(context).size.width * 0.85,
              ),
              decoration: BoxDecoration(
                gradient: isUser ? AppColors.greenGradient : null,
                color: isUser ? null : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isUser ? 20 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isUser
                        ? AppColors.primary.withOpacity(0.3)
                        : Colors.black.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Show file previews from local files (temp messages)
            if (attachedFiles != null && attachedFiles.isNotEmpty) ...[
              ...attachedFiles.map((file) {
                final fileName = file.path.split('/').last;
                final isImage = fileName.toLowerCase().endsWith('.jpg') ||
                    fileName.toLowerCase().endsWith('.jpeg') ||
                    fileName.toLowerCase().endsWith('.png') ||
                    fileName.toLowerCase().endsWith('.webp');

                if (isImage) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        file,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  );
                } else {
                  // PDF or other file
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.picture_as_pdf, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            fileName,
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                }
              }).toList(),
            ],
            // Show file previews from server metadata (persisted messages)
            if (metadataFiles != null && metadataFiles.isNotEmpty) ...[
              ...metadataFiles.map((fileData) {
                final file = fileData as Map<String, dynamic>;
                final fileName = file['filename'] as String? ?? 'file';
                final mimeType = file['mimeType'] as String? ?? '';
                final fileUrl = file['url'] as String?;

                final isImage = mimeType.startsWith('image/');

                if (isImage && fileUrl != null && fileUrl.isNotEmpty) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: fileUrl,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          height: 150,
                          color: Colors.grey[200],
                          child: const Center(
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          padding: const EdgeInsets.all(8),
                          color: Colors.grey[200],
                          child: Row(
                            children: [
                              const Icon(Icons.broken_image, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  fileName,
                                  style: const TextStyle(fontSize: 12),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                } else {
                  // PDF or other file
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.picture_as_pdf,
                          color: isUser ? Colors.white : AppColors.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            fileName,
                            style: TextStyle(
                              color: isUser ? Colors.white : Colors.black87,
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                }
              }).toList(),
            ],
            // Message content with markdown and LaTeX support
            MarkdownLatexText(
              text: message.content,
              style: const TextStyle(
                fontSize: 15,
                height: 1.5,
              ),
              textColor: isUser ? Colors.white : Colors.black87,
            ),
            if (message.citations.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: message.citations.asMap().entries.map((entry) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.green,
                        width: 1,
                      ),
                    ),
                    child: Text(
                      '[${entry.key + 1}]',
                      style: const TextStyle(
                        color: Colors.green,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
            ),
          ],
        ),
      );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: AppColors.greenGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.smart_toy,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(0),
                const SizedBox(width: 4),
                _buildDot(1),
                const SizedBox(width: 4),
                _buildDot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        final offset = (value * 2 - 1).abs();
        final delay = index * 0.15;
        final animValue = ((value + delay) % 1.0);

        return Transform.translate(
          offset: Offset(0, -4 * (1 - (animValue * 2 - 1).abs())),
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.4 + animValue * 0.6),
              shape: BoxShape.circle,
            ),
          ),
        );
      },
      onEnd: () {
        if (mounted && _isSending) {
          setState(() {}); // Restart animation
        }
      },
    );
  }

  Widget _buildLoadingMessage() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
              ),
            ),
            const SizedBox(width: 12),
            Text('ai_chat.messages.thinking'.tr()),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Selected files preview
            if (_selectedFiles.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.only(bottom: 12),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _selectedFiles.asMap().entries.map((entry) {
                    final index = entry.key;
                    final file = entry.value;
                    final fileName = file.path.split('/').last;
                    final isPdf = fileName.toLowerCase().endsWith('.pdf');

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isPdf ? Icons.picture_as_pdf : Icons.image,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 6),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 150),
                            child: Text(
                              fileName,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          GestureDetector(
                            onTap: () => _removeFile(index),
                            child: const Icon(
                              Icons.close,
                              size: 16,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
            // Input row
            Row(
              children: [
                // Attachment button
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: _showFilePickerOptions,
                    icon: const Icon(Icons.add_rounded),
                    color: AppColors.primary,
                    iconSize: 24,
                  ),
                ),
                const SizedBox(width: 12),
                // Text field
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(
                        color: Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: TextField(
                      controller: _messageController,
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      style: const TextStyle(
                        fontSize: 15,
                        color: Colors.black87,
                      ),
                      decoration: InputDecoration(
                        hintText: 'ai_chat.messages.ask_anything'.tr(),
                        hintStyle: const TextStyle(
                          fontSize: 15,
                          color: Colors.black38,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 14,
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Send button - Always enabled, no loading state
                Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.greenGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: IconButton(
                    onPressed: _sendMessage,
                    icon: const Icon(Icons.send_rounded),
                    color: Colors.white,
                    iconSize: 22,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
