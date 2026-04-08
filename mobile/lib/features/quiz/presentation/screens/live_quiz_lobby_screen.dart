import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';

class LiveQuizLobbyScreen extends StatefulWidget {
  final IO.Socket socket;
  final String roomCode;
  final bool isHost;
  final String studySetTitle;
  final List<dynamic>? initialPlayers;

  const LiveQuizLobbyScreen({
    super.key,
    required this.socket,
    required this.roomCode,
    required this.isHost,
    required this.studySetTitle,
    this.initialPlayers,
  });

  @override
  State<LiveQuizLobbyScreen> createState() => _LiveQuizLobbyScreenState();
}

class _LiveQuizLobbyScreenState extends State<LiveQuizLobbyScreen> {
  List<Map<String, dynamic>> _players = [];
  bool _isStarting = false;

  @override
  void initState() {
    super.initState();
    // Set initial players if provided
    if (widget.initialPlayers != null) {
      _players = widget.initialPlayers!
          .map((p) => p as Map<String, dynamic>)
          .toList();
    }
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    widget.socket.on('room:updated', (data) {
      print('[LiveQuiz] Room updated: $data');
      if (mounted) {
        setState(() {
          _players = (data['players'] as List<dynamic>)
              .map((p) => p as Map<String, dynamic>)
              .toList();
        });
      }
    });

    widget.socket.on('game:starting', (_) {
      print('[LiveQuiz] Game starting...');
      // TODO: Navigate to game screen when ready
    });

    widget.socket.on('error', (data) {
      print('[LiveQuiz] Error: $data');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'quiz.live_lobby.error_occurred'.tr()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });
  }

  void _startGame() {
    setState(() => _isStarting = true);
    widget.socket.emit('start-game', {'code': widget.roomCode});
  }

  void _copyRoomCode() {
    Clipboard.setData(ClipboardData(text: widget.roomCode));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('quiz.live_lobby.room_code_copied'.tr()),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  void dispose() {
    widget.socket.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return WillPopScope(
      onWillPop: () async {
        widget.socket.emit('leave-room', {'code': widget.roomCode});
        widget.socket.disconnect();
        return true;
      },
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: theme.scaffoldBackgroundColor,
          elevation: 0,
          title: Text(
            widget.studySetTitle,
            style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
          ),
        ),
        body: Column(
          children: [
            // Room code display
            Container(
              margin: EdgeInsets.all(AppDimensions.space20),
              padding: EdgeInsets.all(AppDimensions.space24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF9333EA), Color(0xFFC084FC)],
                ),
                borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
              ),
              child: Column(
                children: [
                  Text(
                    'quiz.live_lobby.room_code'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.white70,
                    ),
                  ),
                  SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        widget.roomCode,
                        style: AppTextStyles.headlineLarge.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 48,
                          letterSpacing: 8,
                        ),
                      ),
                      SizedBox(width: 16),
                      IconButton(
                        onPressed: _copyRoomCode,
                        icon: Icon(Icons.copy, color: Colors.white),
                        tooltip: 'quiz.live_lobby.copy_code'.tr(),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    'quiz.live_lobby.share_code'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),

            // Players list
            Padding(
              padding: EdgeInsets.symmetric(horizontal: AppDimensions.space20),
              child: Row(
                children: [
                  Icon(Icons.people, color: AppColors.secondary),
                  SizedBox(width: 8),
                  Text(
                    'quiz.live_lobby.players'.tr(namedArgs: {'count': '${_players.length}'}),
                    style: AppTextStyles.titleMedium.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space16),

            Expanded(
              child: ListView.builder(
                padding: EdgeInsets.symmetric(horizontal: AppDimensions.space20),
                itemCount: _players.length,
                itemBuilder: (context, index) {
                  final player = _players[index];
                  final isHost = player['id'] == widget.socket.auth?['userId'];

                  return Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: EdgeInsets.all(AppDimensions.space16),
                      decoration: BoxDecoration(
                        color: theme.cardColor,
                        borderRadius: BorderRadius.circular(AppDimensions.radiusMedium),
                        border: Border.all(
                          color: theme.colorScheme.onSurface.withOpacity(0.1),
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppColors.secondary.withOpacity(0.2),
                            child: Text(
                              (player['name'] as String)[0].toUpperCase(),
                              style: AppTextStyles.titleSmall.copyWith(
                                color: AppColors.secondary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              player['name'] as String,
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (isHost)
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                gradient: AppColors.greenGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'quiz.live_lobby.host_badge'.tr(),
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

            // Start button (host only)
            if (widget.isHost)
              Container(
                padding: EdgeInsets.all(AppDimensions.space20),
                decoration: BoxDecoration(
                  color: theme.scaffoldBackgroundColor,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: Offset(0, -5),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: PrimaryButton(
                    text: _isStarting ? 'quiz.live_lobby.starting'.tr() : 'quiz.live_lobby.start_game'.tr(),
                    icon: Icons.play_arrow,
                    onPressed: _players.length < 2 || _isStarting ? null : _startGame,
                    gradient: AppColors.greenGradient,
                    isLoading: _isStarting,
                    height: 56,
                  ),
                ),
              )
            else
              Padding(
                padding: EdgeInsets.all(AppDimensions.space20),
                child: Text(
                  'quiz.live_lobby.waiting_for_host'.tr(),
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.grey600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
