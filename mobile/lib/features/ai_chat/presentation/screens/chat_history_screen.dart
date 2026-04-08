import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/conversation_entity.dart';
import '../bloc/chat_bloc.dart';
import '../bloc/chat_event.dart';
import '../bloc/chat_state.dart';
import 'chat_screen.dart';

class ChatHistoryScreen extends StatefulWidget {
  const ChatHistoryScreen({super.key});

  @override
  State<ChatHistoryScreen> createState() => _ChatHistoryScreenState();
}

class _ChatHistoryScreenState extends State<ChatHistoryScreen> {
  List<ConversationEntity> _conversations = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    print('📜 ChatHistoryScreen initState');
    context.read<ChatBloc>().add(const LoadConversations());
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateDay = DateTime(date.year, date.month, date.day);
    final time = DateFormat('h:mm a').format(date);

    if (dateDay == today) {
      return '${'ai_chat.date.today'.tr()}, $time';
    } else if (dateDay == today.subtract(const Duration(days: 1))) {
      return '${'ai_chat.date.yesterday'.tr()}, $time';
    } else {
      return '${DateFormat('MMM dd, yyyy').format(date)}, $time';
    }
  }

  List<ConversationEntity> get _filteredConversations {
    if (_searchQuery.isEmpty) return _conversations;

    return _conversations.where((c) {
      return c.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (c.lastMessage?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
    }).toList();
  }

  void _deleteConversation(String id) {
    final bloc = context.read<ChatBloc>();
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('ai_chat.messages.delete_confirm_title'.tr()),
        content: Text('ai_chat.messages.delete_confirm_message'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text('ai_chat.messages.delete_confirm_cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              bloc.add(DeleteConversation(conversationId: id));
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text('ai_chat.messages.delete_confirm_delete'.tr()),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ai_chat.history_title'.tr(),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            Text(
              'ai_chat.history_subtitle'.tr(),
              style: const TextStyle(
                fontSize: 12,
                color: Colors.black54,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        toolbarHeight: 70,
      ),
      body: BlocListener<ChatBloc, ChatState>(
        listener: (context, state) {
          if (state is ConversationsLoaded) {
            setState(() => _conversations = state.conversations);
          } else if (state is ConversationDeleted) {
            context.read<ChatBloc>().add(const LoadConversations());
          }
        },
        child: Column(
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  style: const TextStyle(fontSize: 15),
                  decoration: InputDecoration(
                    hintText: 'ai_chat.messages.search_conversations'.tr(),
                    hintStyle: const TextStyle(color: Colors.black38),
                    prefixIcon: Icon(Icons.search_rounded, color: AppColors.primary, size: 22),
                    filled: false,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),

            // Conversations list
            Expanded(
              child: _filteredConversations.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.chat_bubble_outline_rounded,
                              size: 40,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'ai_chat.messages.no_conversations'.tr(),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'ai_chat.messages.start_new'.tr(),
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _filteredConversations.length,
                      itemBuilder: (context, index) {
                        final conversation = _filteredConversations[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            leading: Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: AppColors.greenGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.chat_bubble_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            title: Text(
                              conversation.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: Colors.black87,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (conversation.lastMessage != null)
                                    Text(
                                      conversation.lastMessage!,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: Colors.black54,
                                        height: 1.4,
                                      ),
                                    ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.schedule,
                                        size: 14,
                                        color: AppColors.primary.withOpacity(0.6),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _formatDate(conversation.updatedAt),
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.primary.withOpacity(0.8),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete_outline, size: 22),
                              color: Colors.redAccent,
                              onPressed: () => _deleteConversation(conversation.id),
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => BlocProvider.value(
                                    value: context.read<ChatBloc>(),
                                    child: ChatScreen(
                                      key: ValueKey('chat_${conversation.id}'),
                                      conversationId: conversation.id,
                                    ),
                                  ),
                                ),
                              ).then((_) {
                                // Refresh conversations when coming back
                                context.read<ChatBloc>().add(const LoadConversations());
                              });
                            },
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Pop history screen and open fresh blank chat
          Navigator.pop(context);
          // No need to push - we're going back to the blank chat that's already there
        },
        backgroundColor: AppColors.primary,
        elevation: 6,
        icon: const Icon(Icons.add_rounded, size: 24),
        label: Text(
          'ai_chat.history.new_chat'.tr(),
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
