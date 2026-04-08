import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/auth_token_service.dart';
import '../../domain/entities/exam_question_entity.dart';

/// Phases of the live exam session flow.
enum _SessionPhase { idle, lobby, playing, result, finished }

class LiveExamSessionScreen extends StatefulWidget {
  final String examId;
  final List<ExamQuestionEntity> questions;

  const LiveExamSessionScreen({
    super.key,
    required this.examId,
    required this.questions,
  });

  @override
  State<LiveExamSessionScreen> createState() => _LiveExamSessionScreenState();
}

class _LiveExamSessionScreenState extends State<LiveExamSessionScreen>
    with TickerProviderStateMixin {
  // --- Socket & session state ---
  IO.Socket? _socket;
  _SessionPhase _phase = _SessionPhase.idle;
  bool _isConnecting = false;
  bool _isHost = false;
  String _sessionCode = '';
  String? _hostId;

  // --- Controllers ---
  final TextEditingController _codeController = TextEditingController();
  final TextEditingController _nicknameController = TextEditingController();
  final TextEditingController _answerController = TextEditingController();
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  // --- Participants ---
  List<Map<String, dynamic>> _participants = [];

  // --- Playing state ---
  List<String> _questionIds = [];
  int _currentQuestionIndex = 0;
  int? _selectedOptionIndex;
  Timer? _timer;
  int _timeRemaining = 30;
  bool _answerSubmitted = false;
  late AnimationController _timerAnimController;

  // --- Result state ---
  bool _lastAnswerCorrect = false;
  int _lastScoreGained = 0;
  int _totalScore = 0;

  // --- Leaderboard ---
  List<Map<String, dynamic>> _leaderboard = [];

  // --- Chat ---
  List<Map<String, dynamic>> _chatMessages = [];
  bool _showChat = false;

  // --- Settings ---
  int _timePerQuestion = 30;

  @override
  void initState() {
    super.initState();
    _timerAnimController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 30),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _timerAnimController.dispose();
    _codeController.dispose();
    _nicknameController.dispose();
    _answerController.dispose();
    _chatController.dispose();
    _chatScrollController.dispose();
    _socket?.disconnect();
    _socket?.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Socket connection
  // ---------------------------------------------------------------------------

  Future<IO.Socket> _connectSocket() async {
    final token = AuthTokenService.instance.accessToken;
    if (token == null) throw Exception('Not authenticated');

    debugPrint('[ExamSession] Connecting to ${ApiConstants.baseUrl}/exam-clone');
    final socket = IO.io(
      '${ApiConstants.baseUrl}/exam-clone',
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': 'Bearer $token'})
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(3)
          .setReconnectionDelay(1000)
          .build(),
    );

    // Global error / disconnect handlers
    socket.onConnectError((err) {
      debugPrint('[ExamSession] Connection error: $err');
      if (mounted) {
        _showError('Connection failed. Please try again.');
        setState(() => _isConnecting = false);
      }
    });

    socket.onDisconnect((_) {
      debugPrint('[ExamSession] Disconnected');
    });

    socket.on('error', (data) {
      debugPrint('[ExamSession] Error: $data');
      if (mounted) {
        final msg = data is Map ? data['message'] : '$data';
        _showError(msg ?? 'An error occurred');
      }
    });

    // --- Session lifecycle events ---

    socket.on('session-created', (data) {
      debugPrint('[ExamSession] Session created: $data');
      if (!mounted) return;
      setState(() {
        _sessionCode = data['code'] ?? data['sessionId'] ?? '';
        _isHost = true;
        _phase = _SessionPhase.lobby;
        _isConnecting = false;
      });
    });

    socket.on('joined-session', (data) {
      debugPrint('[ExamSession] Joined session: $data');
      if (!mounted) return;
      setState(() {
        _sessionCode = data['code'] ?? _codeController.text.trim().toUpperCase();
        _hostId = data['hostId'];
        _isHost = false;
        _phase = _SessionPhase.lobby;
        _isConnecting = false;
        if (data['settings'] != null && data['settings']['timePerQuestion'] != null) {
          _timePerQuestion = data['settings']['timePerQuestion'];
        }
      });
    });

    socket.on('participant-joined', (data) {
      debugPrint('[ExamSession] Participant joined: $data');
      if (!mounted) return;
      setState(() {
        final existing = _participants.indexWhere(
          (p) => p['userId'] == data['userId'],
        );
        if (existing == -1) {
          _participants.add(Map<String, dynamic>.from(data));
        }
      });
    });

    socket.on('participant-left', (data) {
      debugPrint('[ExamSession] Participant left: $data');
      if (!mounted) return;
      setState(() {
        _participants.removeWhere((p) => p['userId'] == data['userId']);
      });
    });

    socket.on('session-started', (data) {
      debugPrint('[ExamSession] Session started');
      if (!mounted) return;
      final ids = (data['questionIds'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          widget.questions.map((q) => q.id).toList();
      setState(() {
        _questionIds = ids;
        _currentQuestionIndex = 0;
        _totalScore = 0;
        _phase = _SessionPhase.playing;
        _answerSubmitted = false;
        _selectedOptionIndex = null;
      });
      _startTimer();
    });

    socket.on('answer-submitted', (data) {
      debugPrint('[ExamSession] Answer submitted response: $data');
      if (!mounted) return;
      setState(() {
        _totalScore = data['score'] ?? _totalScore;
      });
    });

    socket.on('leaderboard-update', (data) {
      debugPrint('[ExamSession] Leaderboard update');
      if (!mounted) return;
      final list = data is List ? data : (data['leaderboard'] ?? []);
      setState(() {
        _leaderboard = List<Map<String, dynamic>>.from(
          (list as List).map((e) => Map<String, dynamic>.from(e)),
        );
      });
    });

    socket.on('participant-finished', (data) {
      debugPrint('[ExamSession] Participant finished: $data');
    });

    socket.on('session-ended', (data) {
      debugPrint('[ExamSession] Session ended');
      if (!mounted) return;
      _timer?.cancel();
      final lb = data['finalLeaderboard'] ?? data['leaderboard'] ?? [];
      setState(() {
        _leaderboard = List<Map<String, dynamic>>.from(
          (lb as List).map((e) => Map<String, dynamic>.from(e)),
        );
        _phase = _SessionPhase.finished;
      });
    });

    socket.on('finished', (data) {
      debugPrint('[ExamSession] Finished: $data');
      if (!mounted) return;
      setState(() {
        _totalScore = data['score'] ?? _totalScore;
      });
    });

    socket.on('chat-message', (data) {
      if (!mounted) return;
      setState(() {
        _chatMessages.add(Map<String, dynamic>.from(data));
      });
      _scrollChatToBottom();
    });

    return socket;
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _createSession() async {
    final nickname = _nicknameController.text.trim();
    if (nickname.isEmpty) {
      _showError('Please enter your nickname');
      return;
    }

    setState(() => _isConnecting = true);
    try {
      _socket = await _connectSocket();
      _socket!.onConnect((_) {
        debugPrint('[ExamSession] Connected - creating session');
        _socket!.emit('create-session', {
          'examCloneId': widget.examId,
          'name': 'Exam Session',
          'nickname': nickname,
          'settings': {
            'timePerQuestion': _timePerQuestion,
            'questionCount': widget.questions.length,
          },
        });
      });
      _socket!.connect();
    } catch (e) {
      if (mounted) {
        _showError('Failed to create session: $e');
        setState(() => _isConnecting = false);
      }
    }
  }

  Future<void> _joinSession() async {
    final code = _codeController.text.trim().toUpperCase();
    final nickname = _nicknameController.text.trim();

    if (code.isEmpty) {
      _showError('Please enter a session code');
      return;
    }
    if (nickname.isEmpty) {
      _showError('Please enter your nickname');
      return;
    }

    setState(() => _isConnecting = true);
    try {
      _socket = await _connectSocket();
      _socket!.onConnect((_) {
        debugPrint('[ExamSession] Connected - joining session');
        _socket!.emit('join-session', {
          'code': code,
          'nickname': nickname,
        });
      });
      _socket!.connect();
    } catch (e) {
      if (mounted) {
        _showError('Failed to join session: $e');
        setState(() => _isConnecting = false);
      }
    }
  }

  void _startSession() {
    if (_socket == null) return;
    final ids = widget.questions.map((q) => q.id).toList();
    _socket!.emit('start-session', {
      'code': _sessionCode,
      'questionIds': ids,
    });
  }

  void _submitAnswer() {
    if (_answerSubmitted || _socket == null) return;

    final question = _currentQuestion;
    if (question == null) return;

    String answer;
    bool isCorrect;
    final hasOptions = question.options.isNotEmpty;

    if (hasOptions && _selectedOptionIndex != null) {
      answer = question.options[_selectedOptionIndex!];
      isCorrect = answer == question.correctAnswer;
    } else if (!hasOptions) {
      answer = _answerController.text.trim();
      isCorrect = answer.toLowerCase() == question.correctAnswer.toLowerCase();
    } else {
      return; // No answer selected
    }

    final timeSpent = _timePerQuestion - _timeRemaining;

    setState(() {
      _answerSubmitted = true;
      _lastAnswerCorrect = isCorrect;
      // Score: base 100 for correct, bonus up to 50 for speed
      _lastScoreGained = isCorrect ? 100 + ((50 * _timeRemaining) ~/ _timePerQuestion) : 0;
    });

    _timer?.cancel();

    _socket!.emit('submit-answer', {
      'code': _sessionCode,
      'questionId': question.id,
      'answer': answer,
      'isCorrect': isCorrect,
      'timeSpent': timeSpent,
    });

    // Show result briefly then move to next or finish
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      _moveToNext();
    });
  }

  void _moveToNext() {
    if (_currentQuestionIndex < _questionIds.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _answerSubmitted = false;
        _selectedOptionIndex = null;
        _answerController.clear();
      });
      _startTimer();
    } else {
      // All questions answered - finish
      _socket?.emit('finish-session', {'code': _sessionCode});
      setState(() {
        _phase = _SessionPhase.finished;
      });
    }
  }

  void _endSession() {
    _socket?.emit('end-session', {'code': _sessionCode});
  }

  void _sendChatMessage() {
    final msg = _chatController.text.trim();
    if (msg.isEmpty || _socket == null) return;
    _socket!.emit('chat-message', {
      'code': _sessionCode,
      'message': msg,
    });
    _chatController.clear();
  }

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  void _startTimer() {
    _timer?.cancel();
    _timeRemaining = _timePerQuestion;
    _timerAnimController.duration = Duration(seconds: _timePerQuestion);
    _timerAnimController.forward(from: 0.0);

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _timeRemaining--;
      });
      if (_timeRemaining <= 0) {
        timer.cancel();
        if (!_answerSubmitted) {
          _submitTimeoutAnswer();
        }
      }
    });
  }

  void _submitTimeoutAnswer() {
    final question = _currentQuestion;
    if (question == null || _socket == null) return;

    setState(() {
      _answerSubmitted = true;
      _lastAnswerCorrect = false;
      _lastScoreGained = 0;
    });

    _socket!.emit('submit-answer', {
      'code': _sessionCode,
      'questionId': question.id,
      'answer': '',
      'isCorrect': false,
      'timeSpent': _timePerQuestion,
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      _moveToNext();
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  ExamQuestionEntity? get _currentQuestion {
    if (_questionIds.isEmpty || _currentQuestionIndex >= _questionIds.length) {
      return null;
    }
    final id = _questionIds[_currentQuestionIndex];
    try {
      return widget.questions.firstWhere((q) => q.id == id);
    } catch (_) {
      if (_currentQuestionIndex < widget.questions.length) {
        return widget.questions[_currentQuestionIndex];
      }
      return null;
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
      ),
    );
  }

  void _copySessionCode() {
    Clipboard.setData(ClipboardData(text: _sessionCode));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('exam_clone.live_session.code_copied'.tr()),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
      ),
    );
  }

  void _scrollChatToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _leaveSession() {
    _timer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

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

    return PopScope(
      canPop: _phase == _SessionPhase.idle || _phase == _SessionPhase.finished,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          _showLeaveConfirmation();
        }
      },
      child: Scaffold(
        appBar: _buildAppBar(theme),
        body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _buildBody(theme),
        ),
        floatingActionButton: _phase == _SessionPhase.lobby ||
                _phase == _SessionPhase.playing
            ? FloatingActionButton.small(
                onPressed: () => setState(() => _showChat = !_showChat),
                backgroundColor: AppColors.purple,
                child: Icon(
                  _showChat ? Icons.close : Icons.chat_bubble_outline,
                  color: Colors.white,
                ),
              )
            : null,
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ThemeData theme) {
    String title;
    switch (_phase) {
      case _SessionPhase.idle:
        title = 'exam_clone.live_session.title_idle'.tr();
      case _SessionPhase.lobby:
        title = 'exam_clone.live_session.title_lobby'.tr();
      case _SessionPhase.playing:
        title = 'exam_clone.live_session.title_question'.tr(namedArgs: {'current': '${_currentQuestionIndex + 1}', 'total': '${_questionIds.length}'});
      case _SessionPhase.result:
        title = 'exam_clone.live_session.title_results'.tr();
      case _SessionPhase.finished:
        title = 'exam_clone.live_session.title_final'.tr();
    }

    return AppBar(
      backgroundColor: theme.scaffoldBackgroundColor,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () {
          if (_phase == _SessionPhase.idle || _phase == _SessionPhase.finished) {
            Navigator.pop(context);
          } else {
            _showLeaveConfirmation();
          }
        },
      ),
      title: Text(
        title,
        style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
      ),
      actions: [
        if (_phase == _SessionPhase.playing)
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                'Score: $_totalScore',
                style: AppTextStyles.titleSmall.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        if (_phase == _SessionPhase.lobby && _isHost)
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: _showSettingsSheet,
          ),
      ],
    );
  }

  Widget _buildBody(ThemeData theme) {
    if (_showChat &&
        (_phase == _SessionPhase.lobby || _phase == _SessionPhase.playing)) {
      return _buildChatPanel(theme);
    }

    switch (_phase) {
      case _SessionPhase.idle:
        return _buildIdlePhase(theme);
      case _SessionPhase.lobby:
        return _buildLobbyPhase(theme);
      case _SessionPhase.playing:
        return _buildPlayingPhase(theme);
      case _SessionPhase.result:
        return _buildResultPhase(theme);
      case _SessionPhase.finished:
        return _buildFinishedPhase(theme);
    }
  }

  // ---------------------------------------------------------------------------
  // Phase: Idle
  // ---------------------------------------------------------------------------

  Widget _buildIdlePhase(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppDimensions.space20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Hero banner
          Container(
            padding: const EdgeInsets.all(AppDimensions.space24),
            decoration: BoxDecoration(
              gradient: AppColors.purpleGradient,
              borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
            ),
            child: Column(
              children: [
                const Icon(Icons.groups, size: 64, color: Colors.white),
                const SizedBox(height: AppDimensions.space16),
                Text(
                  'Collaborative Exam',
                  style: AppTextStyles.titleLarge.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppDimensions.space8),
                Text(
                  'Challenge your friends and study together in real-time',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: Colors.white70,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          const SizedBox(height: AppDimensions.space24),

          // Nickname input (shared)
          TextFormField(
            controller: _nicknameController,
            decoration: InputDecoration(
              labelText: 'exam_clone.live_session.your_nickname'.tr(),
              hintText: 'exam_clone.live_session.enter_display_name'.tr(),
              prefixIcon: const Icon(Icons.person),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              ),
            ),
          ),

          const SizedBox(height: AppDimensions.space24),

          // Create Session card
          _buildActionCard(
            theme: theme,
            icon: Icons.add_circle,
            iconColor: AppColors.primary,
            title: 'exam_clone.live_session.create_session'.tr(),
            description:
                'exam_clone.live_session.host_description'.tr(),
            buttonText: _isConnecting ? 'exam_clone.live_session.creating'.tr() : 'exam_clone.live_session.create_session'.tr(),
            buttonGradient: AppColors.greenGradient,
            buttonIcon: Icons.add,
            isLoading: _isConnecting,
            onPressed: _isConnecting ? null : _createSession,
          ),

          const SizedBox(height: AppDimensions.space20),

          // Divider
          Row(
            children: [
              const Expanded(child: Divider()),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'exam_clone.live_session.or_divider'.tr(),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Expanded(child: Divider()),
            ],
          ),

          const SizedBox(height: AppDimensions.space20),

          // Join Session card
          Container(
            padding: const EdgeInsets.all(AppDimensions.space20),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
              border: Border.all(
                color: theme.colorScheme.onSurface.withOpacity(0.1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(Icons.login, color: AppColors.purple, size: 24),
                    const SizedBox(width: 12),
                    Text(
                      'exam_clone.live_session.join_session'.tr(),
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'exam_clone.live_session.join_description'.tr(),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                  ),
                ),
                const SizedBox(height: AppDimensions.space16),
                TextFormField(
                  controller: _codeController,
                  decoration: InputDecoration(
                    labelText: 'exam_clone.live_session.session_code'.tr(),
                    hintText: 'exam_clone.live_session.enter_code_hint'.tr(),
                    prefixIcon: const Icon(Icons.vpn_key),
                    border: OutlineInputBorder(
                      borderRadius:
                          BorderRadius.circular(AppDimensions.radiusMedium),
                    ),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  maxLength: 8,
                ),
                const SizedBox(height: AppDimensions.space16),
                PrimaryButton(
                  text: _isConnecting ? 'exam_clone.live_session.joining'.tr() : 'exam_clone.live_session.join_session'.tr(),
                  icon: Icons.login,
                  onPressed: _isConnecting ? null : _joinSession,
                  gradient: AppColors.purpleGradient,
                  isLoading: _isConnecting,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required ThemeData theme,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String description,
    required String buttonText,
    required Gradient buttonGradient,
    required IconData buttonIcon,
    required bool isLoading,
    required VoidCallback? onPressed,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.space20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: theme.colorScheme.onSurface.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 24),
              const SizedBox(width: 12),
              Text(
                title,
                style: AppTextStyles.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: AppDimensions.space20),
          PrimaryButton(
            text: buttonText,
            icon: buttonIcon,
            onPressed: onPressed,
            gradient: buttonGradient,
            isLoading: isLoading,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Phase: Lobby
  // ---------------------------------------------------------------------------

  Widget _buildLobbyPhase(ThemeData theme) {
    return Column(
      children: [
        // Session code banner
        Container(
          margin: const EdgeInsets.all(AppDimensions.space20),
          padding: const EdgeInsets.all(AppDimensions.space24),
          decoration: BoxDecoration(
            gradient: AppColors.purpleGradient,
            borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
          ),
          child: Column(
            children: [
              Text(
                'Session Code',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _sessionCode,
                    style: AppTextStyles.headlineLarge.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 42,
                      letterSpacing: 6,
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton(
                    onPressed: _copySessionCode,
                    icon: const Icon(Icons.copy, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Share this code with your friends to join',
                style: AppTextStyles.bodySmall.copyWith(
                  color: Colors.white70,
                ),
              ),
            ],
          ),
        ),

        // Participants header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppDimensions.space20),
          child: Row(
            children: [
              const Icon(Icons.people, color: AppColors.purple),
              const SizedBox(width: 8),
              Text(
                'Participants (${_participants.length})',
                style: AppTextStyles.titleMedium.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${widget.questions.length} questions',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppDimensions.space16),

        // Participant list
        Expanded(
          child: _participants.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.hourglass_empty,
                          size: 48, color: AppColors.grey400),
                      const SizedBox(height: 12),
                      Text(
                        'Waiting for participants...',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.grey600,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppDimensions.space20),
                  itemCount: _participants.length,
                  itemBuilder: (context, index) {
                    final participant = _participants[index];
                    final isParticipantHost =
                        participant['userId'] == _hostId;
                    final nickname =
                        participant['nickname'] ?? participant['name'] ?? 'Player';
                    final initial = nickname.toString().isNotEmpty
                        ? nickname.toString()[0].toUpperCase()
                        : '?';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
                        padding: const EdgeInsets.all(AppDimensions.space16),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(
                              AppDimensions.radiusMedium),
                          border: Border.all(
                            color: theme.colorScheme.onSurface.withOpacity(0.1),
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor:
                                  AppColors.purple.withOpacity(0.15),
                              child: Text(
                                initial,
                                style: AppTextStyles.titleSmall.copyWith(
                                  color: AppColors.purple,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                nickname.toString(),
                                style: AppTextStyles.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (isParticipantHost)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  gradient: AppColors.greenGradient,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Host',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),

        // Bottom actions
        Container(
          padding: const EdgeInsets.all(AppDimensions.space20),
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: _isHost
                ? PrimaryButton(
                    text: 'exam_clone.live_session.start_exam'.tr(),
                    icon: Icons.play_arrow,
                    onPressed:
                        _participants.isEmpty ? null : _startSession,
                    gradient: AppColors.greenGradient,
                    height: 56,
                  )
                : Text(
                    'Waiting for host to start the exam...',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.grey600,
                    ),
                    textAlign: TextAlign.center,
                  ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Phase: Playing
  // ---------------------------------------------------------------------------

  Widget _buildPlayingPhase(ThemeData theme) {
    final question = _currentQuestion;
    if (question == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final hasOptions = question.options.isNotEmpty;

    return Column(
      children: [
        // Timer bar
        _buildTimerBar(theme),

        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppDimensions.space20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Question metadata row
                Row(
                  children: [
                    _buildDifficultyBadge(question.difficulty),
                    const Spacer(),
                    Text(
                      '${_currentQuestionIndex + 1} of ${_questionIds.length}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey600,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppDimensions.space16),

                // Question text
                Container(
                  padding: const EdgeInsets.all(AppDimensions.space20),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius:
                        BorderRadius.circular(AppDimensions.radiusLarge),
                    border: Border.all(
                      color: theme.colorScheme.onSurface.withOpacity(0.1),
                    ),
                  ),
                  child: Text(
                    question.questionText,
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.w600,
                      height: 1.6,
                    ),
                  ),
                ),

                const SizedBox(height: AppDimensions.space20),

                // Options or text input
                if (hasOptions)
                  ...question.options.asMap().entries.map(
                        (entry) => _buildOptionTile(
                          theme: theme,
                          index: entry.key,
                          text: entry.value,
                          correctAnswer: question.correctAnswer,
                        ),
                      )
                else
                  _buildTextInput(theme),

                const SizedBox(height: AppDimensions.space24),

                // Submit button
                if (!_answerSubmitted)
                  PrimaryButton(
                    text: 'exam_clone.live_session.submit_answer'.tr(),
                    icon: Icons.send,
                    onPressed: _canSubmit ? _submitAnswer : null,
                    gradient: AppColors.purpleGradient,
                    height: 52,
                  ),

                // Answer feedback
                if (_answerSubmitted) _buildAnswerFeedback(theme, question),
              ],
            ),
          ),
        ),
      ],
    );
  }

  bool get _canSubmit {
    if (_answerSubmitted) return false;
    final question = _currentQuestion;
    if (question == null) return false;
    if (question.options.isNotEmpty) {
      return _selectedOptionIndex != null;
    }
    return _answerController.text.trim().isNotEmpty;
  }

  Widget _buildTimerBar(ThemeData theme) {
    final progress = _timeRemaining / _timePerQuestion;
    final isUrgent = _timeRemaining <= 10;
    final timerColor = isUrgent ? AppColors.error : AppColors.purple;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.space20,
        vertical: AppDimensions.space12,
      ),
      decoration: BoxDecoration(
        color: theme.cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(
            Icons.timer,
            color: timerColor,
            size: 22,
          ),
          const SizedBox(width: 10),
          Text(
            '${_timeRemaining}s',
            style: AppTextStyles.titleMedium.copyWith(
              color: timerColor,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: timerColor.withOpacity(0.15),
                valueColor: AlwaysStoppedAnimation(timerColor),
                minHeight: 8,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDifficultyBadge(String difficulty) {
    Color color;
    switch (difficulty.toLowerCase()) {
      case 'easy':
        color = Colors.green;
      case 'medium':
        color = Colors.orange;
      case 'hard':
        color = AppColors.error;
      default:
        color = AppColors.grey600;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        difficulty.toUpperCase(),
        style: AppTextStyles.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required ThemeData theme,
    required int index,
    required String text,
    required String correctAnswer,
  }) {
    final isSelected = _selectedOptionIndex == index;
    final isCorrect = text == correctAnswer;
    final showResult = _answerSubmitted;

    Color borderColor;
    Color bgColor;
    IconData? trailingIcon;

    if (showResult) {
      if (isCorrect) {
        borderColor = Colors.green;
        bgColor = Colors.green.withOpacity(0.08);
        trailingIcon = Icons.check_circle;
      } else if (isSelected && !isCorrect) {
        borderColor = AppColors.error;
        bgColor = AppColors.error.withOpacity(0.08);
        trailingIcon = Icons.cancel;
      } else {
        borderColor = theme.colorScheme.onSurface.withOpacity(0.1);
        bgColor = theme.cardColor;
      }
    } else {
      borderColor = isSelected
          ? AppColors.purple
          : theme.colorScheme.onSurface.withOpacity(0.1);
      bgColor =
          isSelected ? AppColors.purple.withOpacity(0.08) : theme.cardColor;
    }

    final labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    final label = index < labels.length ? labels[index] : '${index + 1}';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: _answerSubmitted
            ? null
            : () => setState(() => _selectedOptionIndex = index),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(AppDimensions.space16),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
            border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.purple
                      : AppColors.grey200,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  label,
                  style: AppTextStyles.labelMedium.copyWith(
                    color: isSelected ? Colors.white : AppColors.grey700,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  text,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ),
              if (showResult && trailingIcon != null)
                Icon(
                  trailingIcon,
                  color: isCorrect ? Colors.green : AppColors.error,
                  size: 22,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextInput(ThemeData theme) {
    return TextFormField(
      controller: _answerController,
      enabled: !_answerSubmitted,
      decoration: InputDecoration(
        labelText: 'exam_clone.live_session.your_answer'.tr(),
        hintText: 'exam_clone.live_session.type_answer_hint'.tr(),
        prefixIcon: const Icon(Icons.edit),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        ),
      ),
      onChanged: (_) => setState(() {}),
      onFieldSubmitted: (_) {
        if (_canSubmit) _submitAnswer();
      },
    );
  }

  Widget _buildAnswerFeedback(ThemeData theme, ExamQuestionEntity question) {
    return Container(
      margin: const EdgeInsets.only(top: AppDimensions.space16),
      padding: const EdgeInsets.all(AppDimensions.space16),
      decoration: BoxDecoration(
        color: _lastAnswerCorrect
            ? Colors.green.withOpacity(0.08)
            : AppColors.error.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
        border: Border.all(
          color: _lastAnswerCorrect
              ? Colors.green.withOpacity(0.3)
              : AppColors.error.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                _lastAnswerCorrect ? Icons.check_circle : Icons.cancel,
                color: _lastAnswerCorrect ? Colors.green : AppColors.error,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _lastAnswerCorrect ? 'exam_clone.live_session.correct_feedback'.tr() : 'exam_clone.live_session.incorrect_feedback'.tr(),
                  style: AppTextStyles.titleMedium.copyWith(
                    color:
                        _lastAnswerCorrect ? Colors.green : AppColors.error,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (_lastScoreGained > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '+$_lastScoreGained pts',
                    style: AppTextStyles.labelSmall.copyWith(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          if (!_lastAnswerCorrect) ...[
            const SizedBox(height: 10),
            Text(
              'exam_clone.live_session.correct_answer_label'.tr(namedArgs: {'answer': question.correctAnswer ?? ''}),
              style: AppTextStyles.bodySmall.copyWith(
                color: Colors.green.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          if (question.explanation != null &&
              question.explanation!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              question.explanation!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.grey600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Phase: Result (brief per-question result, used if needed)
  // ---------------------------------------------------------------------------

  Widget _buildResultPhase(ThemeData theme) {
    // This phase can be shown between questions if needed.
    // Currently the playing phase handles inline feedback,
    // but this is kept for flexibility.
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppDimensions.space20),
      child: Column(
        children: [
          Icon(
            _lastAnswerCorrect ? Icons.celebration : Icons.sentiment_dissatisfied,
            size: 80,
            color: _lastAnswerCorrect ? Colors.amber : AppColors.grey400,
          ),
          const SizedBox(height: AppDimensions.space16),
          Text(
            _lastAnswerCorrect ? 'exam_clone.live_session.great_job'.tr() : 'exam_clone.live_session.keep_going'.tr(),
            style: AppTextStyles.headlineSmall.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'exam_clone.live_session.points'.tr(namedArgs: {'score': '$_lastScoreGained'}),
            style: AppTextStyles.titleLarge.copyWith(
              color: AppColors.purple,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: AppDimensions.space32),
          _buildLeaderboardList(theme, compact: true),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Phase: Finished
  // ---------------------------------------------------------------------------

  Widget _buildFinishedPhase(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppDimensions.space20),
      child: Column(
        children: [
          // Trophy header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppDimensions.space24),
            decoration: BoxDecoration(
              gradient: AppColors.purpleGradient,
              borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
            ),
            child: Column(
              children: [
                const Icon(Icons.emoji_events, size: 64, color: Colors.amber),
                const SizedBox(height: AppDimensions.space12),
                Text(
                  'exam_clone.live_session.exam_complete'.tr(),
                  style: AppTextStyles.headlineSmall.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'exam_clone.live_session.your_score'.tr(namedArgs: {'score': '$_totalScore'}),
                  style: AppTextStyles.titleLarge.copyWith(
                    color: Colors.amber,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppDimensions.space24),

          // Podium
          if (_leaderboard.length >= 3) _buildPodium(theme),

          if (_leaderboard.length >= 3)
            const SizedBox(height: AppDimensions.space24),

          // Full leaderboard
          _buildLeaderboardList(theme, compact: false),

          const SizedBox(height: AppDimensions.space24),

          // Actions
          Row(
            children: [
              Expanded(
                child: PrimaryButton(
                  text: 'exam_clone.live_session.leave'.tr(),
                  icon: Icons.exit_to_app,
                  onPressed: _leaveSession,
                  backgroundColor: AppColors.grey600,
                  height: 52,
                ),
              ),
              if (_isHost) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: PrimaryButton(
                    text: 'exam_clone.live_session.end_session'.tr(),
                    icon: Icons.stop_circle,
                    onPressed: _endSession,
                    gradient: const LinearGradient(
                      colors: [AppColors.error, Color(0xFFF87171)],
                    ),
                    height: 52,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPodium(ThemeData theme) {
    // Reorder for podium: [2nd, 1st, 3rd]
    final first = _leaderboard.isNotEmpty ? _leaderboard[0] : null;
    final second = _leaderboard.length > 1 ? _leaderboard[1] : null;
    final third = _leaderboard.length > 2 ? _leaderboard[2] : null;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (second != null)
          _buildPodiumPlace(
            theme: theme,
            place: 2,
            nickname: _getLeaderboardNickname(second),
            score: _getLeaderboardScore(second),
            height: 90,
            color: const Color(0xFFC0C0C0),
          ),
        const SizedBox(width: 8),
        if (first != null)
          _buildPodiumPlace(
            theme: theme,
            place: 1,
            nickname: _getLeaderboardNickname(first),
            score: _getLeaderboardScore(first),
            height: 120,
            color: Colors.amber,
          ),
        const SizedBox(width: 8),
        if (third != null)
          _buildPodiumPlace(
            theme: theme,
            place: 3,
            nickname: _getLeaderboardNickname(third),
            score: _getLeaderboardScore(third),
            height: 70,
            color: const Color(0xFFCD7F32),
          ),
      ],
    );
  }

  Widget _buildPodiumPlace({
    required ThemeData theme,
    required int place,
    required String nickname,
    required int score,
    required double height,
    required Color color,
  }) {
    final initial =
        nickname.isNotEmpty ? nickname[0].toUpperCase() : '?';

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar
        CircleAvatar(
          radius: place == 1 ? 28 : 22,
          backgroundColor: color.withOpacity(0.2),
          child: Text(
            initial,
            style: AppTextStyles.titleMedium.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: place == 1 ? 20 : 16,
            ),
          ),
        ),
        const SizedBox(height: 6),
        // Name
        SizedBox(
          width: 80,
          child: Text(
            nickname,
            style: AppTextStyles.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(height: 4),
        // Score
        Text(
          '$score pts',
          style: AppTextStyles.labelSmall.copyWith(
            color: AppColors.grey600,
          ),
        ),
        const SizedBox(height: 6),
        // Podium block
        Container(
          width: place == 1 ? 90 : 75,
          height: height,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(8),
            ),
            border: Border.all(color: color.withOpacity(0.4)),
          ),
          alignment: Alignment.center,
          child: Text(
            '#$place',
            style: AppTextStyles.headlineSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaderboardList(ThemeData theme, {required bool compact}) {
    final items = compact ? _leaderboard.take(5).toList() : _leaderboard;

    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(AppDimensions.space20),
        child: Text(
          'Leaderboard will appear here',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
          textAlign: TextAlign.center,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Leaderboard',
          style: AppTextStyles.titleMedium.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppDimensions.space12),
        ...items.asMap().entries.map((entry) {
          final rank = entry.key + 1;
          final item = entry.value;
          final nickname = _getLeaderboardNickname(item);
          final score = _getLeaderboardScore(item);
          final initial =
              nickname.isNotEmpty ? nickname[0].toUpperCase() : '?';

          Color rankColor;
          switch (rank) {
            case 1:
              rankColor = Colors.amber;
            case 2:
              rankColor = const Color(0xFFC0C0C0);
            case 3:
              rankColor = const Color(0xFFCD7F32);
            default:
              rankColor = AppColors.grey500;
          }

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(AppDimensions.space12),
              decoration: BoxDecoration(
                color: theme.cardColor,
                borderRadius:
                    BorderRadius.circular(AppDimensions.radiusMedium),
                border: Border.all(
                  color: rank <= 3
                      ? rankColor.withOpacity(0.3)
                      : theme.colorScheme.onSurface.withOpacity(0.1),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: rankColor.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$rank',
                      style: AppTextStyles.labelMedium.copyWith(
                        color: rankColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: AppColors.purple.withOpacity(0.15),
                    child: Text(
                      initial,
                      style: AppTextStyles.labelSmall.copyWith(
                        color: AppColors.purple,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      nickname,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    '$score pts',
                    style: AppTextStyles.titleSmall.copyWith(
                      color: AppColors.purple,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  String _getLeaderboardNickname(Map<String, dynamic> item) {
    return item['nickname']?.toString() ??
        item['name']?.toString() ??
        'Player';
  }

  int _getLeaderboardScore(Map<String, dynamic> item) {
    return item['score'] as int? ?? item['totalScore'] as int? ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Chat panel
  // ---------------------------------------------------------------------------

  Widget _buildChatPanel(ThemeData theme) {
    return Column(
      children: [
        // Chat header
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppDimensions.space20,
            vertical: AppDimensions.space12,
          ),
          decoration: BoxDecoration(
            color: theme.cardColor,
            border: Border(
              bottom: BorderSide(
                color: theme.colorScheme.onSurface.withOpacity(0.1),
              ),
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.chat_bubble, color: AppColors.purple, size: 20),
              const SizedBox(width: 10),
              Text(
                'Session Chat',
                style: AppTextStyles.titleSmall.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () => setState(() => _showChat = false),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),

        // Messages
        Expanded(
          child: _chatMessages.isEmpty
              ? Center(
                  child: Text(
                    'No messages yet. Say hi!',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey500,
                    ),
                  ),
                )
              : ListView.builder(
                  controller: _chatScrollController,
                  padding: const EdgeInsets.all(AppDimensions.space16),
                  itemCount: _chatMessages.length,
                  itemBuilder: (context, index) {
                    final msg = _chatMessages[index];
                    final nick =
                        msg['nickname']?.toString() ?? 'Unknown';
                    final text = msg['message']?.toString() ?? '';
                    final initial =
                        nick.isNotEmpty ? nick[0].toUpperCase() : '?';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor:
                                AppColors.purple.withOpacity(0.15),
                            child: Text(
                              initial,
                              style: AppTextStyles.labelSmall.copyWith(
                                color: AppColors.purple,
                                fontWeight: FontWeight.bold,
                                fontSize: 10,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text(
                                  nick,
                                  style:
                                      AppTextStyles.labelSmall.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  text,
                                  style: AppTextStyles.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),

        // Input
        Container(
          padding: const EdgeInsets.all(AppDimensions.space12),
          decoration: BoxDecoration(
            color: theme.cardColor,
            border: Border(
              top: BorderSide(
                color: theme.colorScheme.onSurface.withOpacity(0.1),
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _chatController,
                    decoration: InputDecoration(
                      hintText: 'exam_clone.live_session.type_message_hint'.tr(),
                      hintStyle: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.grey500,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                            AppDimensions.radiusRound),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor:
                          theme.colorScheme.onSurface.withOpacity(0.05),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      isDense: true,
                    ),
                    style: AppTextStyles.bodySmall,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendChatMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: _sendChatMessage,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      gradient: AppColors.purpleGradient,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.send, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Dialogs
  // ---------------------------------------------------------------------------

  void _showLeaveConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('exam_clone.live_session.leave_title'.tr()),
        content: const Text(
          'You will lose your progress if you leave the session now.',
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('exam_clone.live_session.stay'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _leaveSession();
            },
            child: Text(
              'Leave',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  void _showSettingsSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppDimensions.bottomSheetBorderRadius),
        ),
      ),
      builder: (ctx) {
        int tempTime = _timePerQuestion;
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(AppDimensions.space24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Session Settings',
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppDimensions.space20),
                  Text(
                    'Time per Question: ${tempTime}s',
                    style: AppTextStyles.bodyMedium,
                  ),
                  Slider(
                    value: tempTime.toDouble(),
                    min: 10,
                    max: 120,
                    divisions: 22,
                    activeColor: AppColors.purple,
                    label: '${tempTime}s',
                    onChanged: (val) {
                      setSheetState(() => tempTime = val.round());
                    },
                  ),
                  const SizedBox(height: AppDimensions.space16),
                  Text(
                    'Questions: ${widget.questions.length}',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                  const SizedBox(height: AppDimensions.space24),
                  SizedBox(
                    width: double.infinity,
                    child: PrimaryButton(
                      text: 'exam_clone.live_session.apply'.tr(),
                      icon: Icons.check,
                      onPressed: () {
                        setState(() => _timePerQuestion = tempTime);
                        Navigator.pop(ctx);
                      },
                      gradient: AppColors.purpleGradient,
                    ),
                  ),
                  const SizedBox(height: AppDimensions.space16),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
