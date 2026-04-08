import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/content/markdown_latex_text.dart';
import '../../domain/entities/chat_message_entity.dart';
import '../bloc/problem_solver_bloc.dart';
import '../bloc/problem_solver_event.dart';
import '../bloc/problem_solver_state.dart';

class StudyBuddyChatScreen extends StatefulWidget {
  final String sessionId;

  const StudyBuddyChatScreen({super.key, required this.sessionId});

  @override
  State<StudyBuddyChatScreen> createState() => _StudyBuddyChatScreenState();
}

class _StudyBuddyChatScreenState extends State<StudyBuddyChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<ChatMessageEntity> _messages = [];
  bool _isSending = false;
  String? _problemText;

  List<String> get _suggestedQuestions => [
    'problem_solver.study_buddy.suggested.explain_step'.tr(),
    'problem_solver.study_buddy.suggested.why_approach'.tr(),
    'problem_solver.study_buddy.suggested.other_methods'.tr(),
    'problem_solver.study_buddy.suggested.simpler_example'.tr(),
    'problem_solver.study_buddy.suggested.concepts_needed'.tr(),
  ];

  @override
  void initState() {
    super.initState();
    context.read<ProblemSolverBloc>().add(LoadChatMessages(sessionId: widget.sessionId));
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    final message = _messageController.text.trim();
    _messageController.clear();

    // Add user message optimistically
    setState(() {
      _messages.add(ChatMessageEntity(
        id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
        role: MessageRole.user,
        message: message,
        createdAt: DateTime.now(),
      ));
      _isSending = true;
    });

    context.read<ProblemSolverBloc>().add(
          SendChatMessage(sessionId: widget.sessionId, message: message),
        );

    // Scroll to bottom
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

  void _sendSuggestedQuestion(String question) {
    _messageController.text = question;
    _sendMessage();
  }

  Widget _buildBotMessage(String message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.smart_toy,
              color: AppColors.primary,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.grey200),
              ),
              child: MarkdownLatexText(
                text: message,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.5,
                ),
                textColor: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserMessage(String message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, left: 48),
      child: Align(
        alignment: Alignment.centerRight,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: AppColors.greenGradient,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            message,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white,
              height: 1.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuggestedQuestions() {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [



          Row(
            children: [
              Text(
                '💡',
                style: TextStyle(fontSize: 16),
              ),
              SizedBox(width: 6),
              Text(
                'problem_solver.study_buddy.suggested_questions_title'.tr(),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black54,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _suggestedQuestions.map((question) {
              return GestureDetector(
                onTap: () => _sendSuggestedQuestion(question),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.grey300),
                  ),
                  child: Text(
                    question,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.black87,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.smart_toy,
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'problem_solver.study_buddy.title'.tr(),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  Text(
                    'problem_solver.study_buddy.subtitle'.tr(),
                    style: const TextStyle(
                      fontSize: 11,
                      color: Colors.black54,
                      fontWeight: FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              // TODO: Export chat functionality
            },
            icon: const Icon(Icons.download, size: 18),
            label: Text('problem_solver.study_buddy.export'.tr()),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
            ),
          ),
        ],
      ),
      body: BlocListener<ProblemSolverBloc, ProblemSolverState>(
        listener: (context, state) {
          if (state is ChatMessagesLoaded) {
            setState(() => _messages = state.messages);
          } else if (state is ChatMessageSent) {
            setState(() {
              _messages.add(state.message);
              _isSending = false;
            });
            Future.delayed(const Duration(milliseconds: 100), () {
              if (_scrollController.hasClients) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
          } else if (state is SessionLoaded) {
            // Get problem text from the session
            setState(() {
              _problemText = state.session.problem;
            });
          }
        },
        child: Column(
          children: [
            // Problem display (if available)
            if (_problemText != null)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.grey300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.description, size: 16, color: AppColors.grey600),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Problem: $_problemText',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

            // Messages
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _messages.length + (_messages.isEmpty ? 1 : 0) + 1,
                itemBuilder: (context, index) {
                  // Welcome message
                  if (index == 0 && _messages.isEmpty) {
                    return _buildBotMessage(
                      'problem_solver.study_buddy.welcome_message'.tr(),
                    );
                  }

                  // Suggested questions at the end
                  if (index == _messages.length + (_messages.isEmpty ? 1 : 0)) {
                    return _buildSuggestedQuestions();
                  }

                  // Regular messages
                  final messageIndex = _messages.isEmpty ? index - 1 : index;
                  final message = _messages[messageIndex];
                  final isUser = message.role == MessageRole.user;

                  if (isUser) {
                    return _buildUserMessage(message.message);
                  } else {
                    return _buildBotMessage(message.message);
                  }
                },
              ),
            ),

            // Input area
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 4,
                    offset: Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'problem_solver.study_buddy.hint_message'.tr(),
                          hintStyle: const TextStyle(
                            fontSize: 14,
                            color: Colors.black38,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: AppColors.grey300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: AppColors.grey300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                          filled: true,
                          fillColor: const Color(0xFFFAFAFA),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        maxLines: null,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      width: 48,
                      height: 48,
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
                      child: IconButton(
                        onPressed: _isSending ? null : _sendMessage,
                        icon: _isSending
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation(Colors.white),
                                ),
                              )
                            : const Icon(Icons.send, color: Colors.white, size: 20),
                        padding: EdgeInsets.zero,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
