import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimensions.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/buttons/primary_button.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/services/auth_token_service.dart';
import '../../../study_sets/domain/entities/study_set_entity.dart';
import 'live_quiz_lobby_screen.dart';

class LiveQuizScreen extends StatefulWidget {
  final StudySetEntity studySet;

  const LiveQuizScreen({
    super.key,
    required this.studySet,
  });

  @override
  State<LiveQuizScreen> createState() => _LiveQuizScreenState();
}

class _LiveQuizScreenState extends State<LiveQuizScreen> {
  final TextEditingController _roomCodeController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  bool _isCreating = false;
  bool _isJoining = false;

  @override
  void dispose() {
    _roomCodeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _createRoom() async {
    setState(() => _isCreating = true);

    try {
      final token = AuthTokenService.instance.accessToken;
      if (token == null) {
        throw Exception('Not authenticated');
      }

      // Connect to Socket.IO
      final socket = IO.io(
        '${ApiConstants.baseUrl}/live-quiz',
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': 'Bearer $token'})
            .build(),
      );

      socket.onConnect((_) {
        print('[LiveQuiz] Connected');
        socket.emit('create-room', {
          'studySetId': widget.studySet.id,
          'questionCount': 10,
          'timePerQuestion': 20,
        });
      });

      socket.on('room:created', (data) {
        print('[LiveQuiz] Room created: $data');
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => LiveQuizLobbyScreen(
                socket: socket,
                roomCode: data['code'] as String,
                isHost: true,
                studySetTitle: widget.studySet.title,
                initialPlayers: data['players'] as List<dynamic>?,
              ),
            ),
          );
        }
      });

      socket.on('error', (data) {
        print('[LiveQuiz] Error: $data');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'quiz.live_quiz.failed_to_create_room'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          setState(() => _isCreating = false);
          socket.disconnect();
        }
      });

      socket.connect();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('quiz.live_quiz.error'.tr(namedArgs: {'error': '$e'})),
            backgroundColor: AppColors.error,
          ),
        );
        setState(() => _isCreating = false);
      }
    }
  }

  Future<void> _joinRoom() async {
    final code = _roomCodeController.text.trim().toUpperCase();
    final name = _nameController.text.trim();

    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('quiz.live_quiz.please_enter_room_code'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('quiz.live_quiz.please_enter_name'.tr()),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isJoining = true);

    try {
      final token = AuthTokenService.instance.accessToken;
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final socket = IO.io(
        '${ApiConstants.baseUrl}/live-quiz',
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': 'Bearer $token'})
            .build(),
      );

      socket.onConnect((_) {
        print('[LiveQuiz] Connected as player');
        socket.emit('join-room', {
          'code': code,
          'name': name,
        });
      });

      socket.on('room:joined', (data) {
        print('[LiveQuiz] Joined room: $data');
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => LiveQuizLobbyScreen(
                socket: socket,
                roomCode: code,
                isHost: false,
                studySetTitle: widget.studySet.title,
                initialPlayers: data['players'] as List<dynamic>?,
              ),
            ),
          );
        }
      });

      socket.on('error', (data) {
        print('[LiveQuiz] Error: $data');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'quiz.live_quiz.failed_to_join_room'.tr()),
              backgroundColor: AppColors.error,
            ),
          );
          setState(() => _isJoining = false);
          socket.disconnect();
        }
      });

      socket.connect();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('quiz.live_quiz.error'.tr(namedArgs: {'error': '$e'})),
            backgroundColor: AppColors.error,
          ),
        );
        setState(() => _isJoining = false);
      }
    }
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
              'quiz.live_quiz.title'.tr(),
              style: AppTextStyles.titleMedium.copyWith(fontWeight: FontWeight.bold),
            ),
            Text(
              widget.studySet.title,
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(AppDimensions.space20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Section
            Container(
              padding: EdgeInsets.all(AppDimensions.space24),
              decoration: BoxDecoration(
                gradient: AppColors.purpleGradient,
                borderRadius: BorderRadius.circular(AppDimensions.radiusLarge),
              ),
              child: Column(
                children: [
                  Icon(Icons.people, size: 64, color: Colors.white),
                  SizedBox(height: AppDimensions.space16),
                  Text(
                    'quiz.live_quiz.hero_title'.tr(),
                    style: AppTextStyles.titleLarge.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space8),
                  Text(
                    'quiz.live_quiz.hero_subtitle'.tr(),
                    style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space32),

            // Create Room
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
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
                      Icon(Icons.add_circle, color: AppColors.secondary, size: 24),
                      SizedBox(width: 12),
                      Text(
                        'quiz.live_quiz.host_game'.tr(),
                        style: AppTextStyles.titleMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text(
                    'quiz.live_quiz.host_description'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                  SizedBox(height: AppDimensions.space20),
                  PrimaryButton(
                    text: _isCreating ? 'quiz.live_quiz.creating_room'.tr() : 'quiz.live_quiz.create_room'.tr(),
                    icon: Icons.add,
                    onPressed: _isCreating ? null : _createRoom,
                    gradient: AppColors.greenGradient,
                    isLoading: _isCreating,
                  ),
                ],
              ),
            ),

            SizedBox(height: AppDimensions.space24),

            // Or divider
            Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'quiz.live_quiz.or'.tr(),
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Expanded(child: Divider()),
              ],
            ),

            SizedBox(height: AppDimensions.space24),

            // Join Room
            Container(
              padding: EdgeInsets.all(AppDimensions.space20),
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
                      Icon(Icons.login, color: AppColors.purple, size: 24),
                      SizedBox(width: 12),
                      Text(
                        'quiz.live_quiz.join_game'.tr(),
                        style: AppTextStyles.titleMedium.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: AppDimensions.space20),
                  TextFormField(
                    controller: _roomCodeController,
                    decoration: InputDecoration(
                      labelText: 'quiz.live_quiz.room_code_label'.tr(),
                      hintText: 'quiz.live_quiz.room_code_hint'.tr(),
                      prefixIcon: Icon(Icons.vpn_key),
                    ),
                    textCapitalization: TextCapitalization.characters,
                    maxLength: 6,
                  ),
                  SizedBox(height: AppDimensions.space16),
                  TextFormField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: 'quiz.live_quiz.your_name_label'.tr(),
                      hintText: 'quiz.live_quiz.your_name_hint'.tr(),
                      prefixIcon: Icon(Icons.person),
                    ),
                  ),
                  SizedBox(height: AppDimensions.space20),
                  PrimaryButton(
                    text: _isJoining ? 'quiz.live_quiz.joining'.tr() : 'quiz.live_quiz.join_room'.tr(),
                    icon: Icons.login,
                    onPressed: _isJoining ? null : _joinRoom,
                    gradient: LinearGradient(
                      colors: [AppColors.purple, Color(0xFFC084FC)],
                    ),
                    isLoading: _isJoining,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
