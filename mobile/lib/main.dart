import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'providers/auth_provider.dart';
import 'providers/notification_provider.dart';
import 'core/theme/app_theme.dart';
import 'core/network/api_client.dart';
import 'core/services/auth_token_service.dart';
import 'core/services/websocket_service.dart';
import 'shared/providers/theme_provider.dart';
import 'features/home/presentation/screens/home_screen.dart';
import 'features/main_navigation/main_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/forgot_password_screen.dart';
import 'features/splash/splash_screen.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/usecases/login_usecase.dart';
import 'features/auth/domain/usecases/register_usecase.dart';
import 'features/study_sets/presentation/bloc/study_sets_bloc.dart';
import 'features/study_sets/data/datasources/study_sets_remote_datasource.dart';
import 'features/study_sets/data/repositories/study_sets_repository_impl.dart';
import 'features/study_sets/domain/usecases/get_study_sets_usecase.dart';
import 'features/study_sets/domain/usecases/create_study_set_usecase.dart';
import 'features/study_sets/domain/usecases/delete_study_set_usecase.dart';
import 'features/flashcards/presentation/bloc/flashcards_bloc.dart';
import 'features/flashcards/data/datasources/flashcards_remote_datasource.dart';
import 'features/flashcards/data/repositories/flashcards_repository_impl.dart';
import 'features/flashcards/domain/usecases/get_flashcards_by_study_set_usecase.dart';
import 'features/flashcards/domain/usecases/create_flashcard_usecase.dart';
import 'features/flashcards/domain/usecases/update_flashcard_usecase.dart';
import 'features/flashcards/domain/usecases/delete_flashcard_usecase.dart';
import 'features/flashcards/domain/usecases/bulk_create_flashcards_usecase.dart';
import 'features/flashcards/domain/usecases/generate_flashcards_usecase.dart';
import 'features/flashcards/domain/usecases/import_flashcards_usecase.dart';
import 'features/flashcards/domain/usecases/ai_assist_card_usecase.dart';
import 'features/notes/presentation/bloc/notes_bloc.dart';
import 'features/notes/data/repositories/notes_repository_impl.dart';
import 'features/exam_clone/presentation/bloc/exam_clone_bloc.dart';
import 'features/exam_clone/data/repositories/exam_clone_repository_impl.dart';
import 'features/onboarding/presentation/screens/pre_login_onboarding_screen.dart';
import 'features/onboarding/presentation/screens/post_login_onboarding_wrapper.dart';
import 'features/onboarding/presentation/screens/setup_wizard_screen.dart';
import 'features/onboarding/constants/onboarding_constants.dart';
import 'features/onboarding/data/datasources/onboarding_local_datasource.dart';
import 'core/services/firebase_messaging_service.dart';
import 'core/utils/notification_ui_helper.dart';

// Global navigator key for showing notifications from anywhere
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Background message handler - MUST be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('📬 Background message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize easy_localization
  await EasyLocalization.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: '.env');

  // Initialize Firebase (skip on web — no firebase_options.dart yet)
  if (!kIsWeb) {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    await FirebaseMessagingService.initialize();
  }

  // Initialize auth token service (CRITICAL - must be before any API calls)
  await AuthTokenService.instance.initialize();

  // Set system UI style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    EasyLocalization(
      supportedLocales: const [
        Locale('en', 'US'),
        Locale('es', 'ES'),
        Locale('ja', 'JP'),
        Locale('ko', 'KR'),
        Locale('zh', 'CN'),
        Locale('de', 'DE'),
        Locale('fr', 'FR'),
        Locale('it', 'IT'),
        Locale('nl', 'NL'),
        Locale('pt', 'BR'),
        Locale('uk', 'UA'),
        Locale('ru', 'RU'),
      ],
      path: 'assets/translations',
      fallbackLocale: const Locale('en', 'US'),
      child: const StudyieldApp(),
    ),
  );
}

class StudyieldApp extends StatelessWidget {
  const StudyieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize dependencies
    final apiClient = ApiClient.instance;

    // Create data source
    final authRemoteDataSource = AuthRemoteDataSourceImpl(
      apiClient: apiClient,
    );

    // Create repository
    final authRepository = AuthRepositoryImpl(
      remoteDataSource: authRemoteDataSource,
    );

    // Create use cases
    final loginUseCase = LoginUseCase(repository: authRepository);
    final registerUseCase = RegisterUseCase(repository: authRepository);

    // Study Sets dependencies
    final studySetsDataSource = StudySetsRemoteDataSourceImpl(
      apiClient: apiClient,
    );
    final studySetsRepository = StudySetsRepositoryImpl(
      remoteDataSource: studySetsDataSource,
    );
    final getStudySetsUseCase = GetStudySetsUseCase(
      repository: studySetsRepository,
    );
    final createStudySetUseCase = CreateStudySetUseCase(
      repository: studySetsRepository,
    );
    final deleteStudySetUseCase = DeleteStudySetUseCase(
      repository: studySetsRepository,
    );

    // Flashcards dependencies
    final flashcardsDataSource = FlashcardsRemoteDataSourceImpl(
      apiClient: apiClient,
    );
    final flashcardsRepository = FlashcardsRepositoryImpl(
      remoteDataSource: flashcardsDataSource,
    );
    final getFlashcardsByStudySetUseCase = GetFlashcardsByStudySetUseCase(
      repository: flashcardsRepository,
    );
    final createFlashcardUseCase = CreateFlashcardUseCase(
      repository: flashcardsRepository,
    );
    final updateFlashcardUseCase = UpdateFlashcardUseCase(
      repository: flashcardsRepository,
    );
    final deleteFlashcardUseCase = DeleteFlashcardUseCase(
      repository: flashcardsRepository,
    );
    final bulkCreateFlashcardsUseCase = BulkCreateFlashcardsUseCase(
      repository: flashcardsRepository,
    );
    final generateFlashcardsUseCase = GenerateFlashcardsUseCase(
      repository: flashcardsRepository,
    );
    final importFlashcardsUseCase = ImportFlashcardsUseCase(
      repository: flashcardsRepository,
    );
    final aiAssistCardUseCase = AiAssistCardUseCase(
      repository: flashcardsRepository,
    );

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        BlocProvider(
          create: (_) => AuthBloc(
            loginUseCase: loginUseCase,
            registerUseCase: registerUseCase,
          ),
        ),
        BlocProvider(
          create: (_) => StudySetsBloc(
            getStudySetsUseCase: getStudySetsUseCase,
            createStudySetUseCase: createStudySetUseCase,
            deleteStudySetUseCase: deleteStudySetUseCase,
            repository: studySetsRepository,
          ),
        ),
        BlocProvider(
          create: (_) => FlashcardsBloc(
            getFlashcardsByStudySetUseCase: getFlashcardsByStudySetUseCase,
            createFlashcardUseCase: createFlashcardUseCase,
            updateFlashcardUseCase: updateFlashcardUseCase,
            deleteFlashcardUseCase: deleteFlashcardUseCase,
            bulkCreateFlashcardsUseCase: bulkCreateFlashcardsUseCase,
            generateFlashcardsUseCase: generateFlashcardsUseCase,
            importFlashcardsUseCase: importFlashcardsUseCase,
            aiAssistCardUseCase: aiAssistCardUseCase,
          ),
        ),
        BlocProvider(
          create: (_) => NotesBloc(
            repository: NotesRepositoryImpl(
              apiClient: apiClient,
            ),
          ),
        ),
        BlocProvider(
          create: (_) => ExamCloneBloc(
            repository: ExamCloneRepositoryImpl(
              apiClient: apiClient,
            ),
          ),
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            title: 'Studyield',
            debugShowCheckedModeBanner: false,
            navigatorKey: navigatorKey, // Global key for notifications
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,

            // Localization
            localizationsDelegates: context.localizationDelegates,
            supportedLocales: context.supportedLocales,
            locale: context.locale,

            home: const AppWrapper(),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/home': (context) => const MainScreen(initialPage: 0),
              '/forgot-password': (context) => const ForgotPasswordScreen(),
              '/post-login-onboarding': (context) => const PostLoginOnboardingWrapper(),
            },
          );
        },
      ),
    );
  }
}

class AppWrapper extends StatefulWidget {
  const AppWrapper({super.key});

  @override
  State<AppWrapper> createState() => _AppWrapperState();
}

class _AppWrapperState extends State<AppWrapper> {
  bool _checkingOnboarding = true;
  bool _shouldShowOnboarding = false;
  bool _minSplashTimeElapsed = false;
  bool _setupWizardCompleted = false; // local override after wizard finishes
  bool _hasSeenSpecialOffer = true; // default true to avoid flash
  bool _offerDismissed = false; // local override after offer is shown

  @override
  void initState() {
    super.initState();
    _checkOnboardingStatus();
    _ensureMinimumSplashTime();
    _setupNotificationCallbacks();
  }

  void _setupNotificationCallbacks() {
    // Setup callbacks after first frame to ensure providers are available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notificationProvider = context.read<NotificationProvider>();

      // Set WebSocket notification callback
      WebSocketService.setNotificationCallback((notification) {
        notificationProvider.handleNewNotification(notification);
        _showInAppNotification(notification);
      });

      // Set Firebase messaging notification callback
      FirebaseMessagingService.setNotificationCallback((notification) {
        notificationProvider.handleNewNotification(notification);
        _showInAppNotification(notification);
      });
    });
  }

  void _showInAppNotification(Map<String, dynamic> notification) {
    final context = navigatorKey.currentContext;
    if (context != null) {
      NotificationUIHelper.showNotification(
        context,
        title: notification['title'] ?? 'Notification',
        message: notification['message'] ?? '',
        type: notification['type'] ?? 'info',
        onTap: () {
          // Navigate to notifications screen
          Navigator.of(context).pushNamed('/notifications');
        },
      );
    }
  }

  Future<void> _ensureMinimumSplashTime() async {
    // Show splash for at least 2 seconds so users can see the logo
    await Future.delayed(const Duration(seconds: 2));
    setState(() {
      _minSplashTimeElapsed = true;
    });
  }

  Future<void> _checkOnboardingStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final dataSource = OnboardingLocalDataSourceImpl(sharedPreferences: prefs);
    final shouldShow = await dataSource.shouldShowOnboarding();
    final hasSeenOffer = prefs.getBool(OnboardingConstants.hasSeenWelcomeOfferKey) ?? false;

    setState(() {
      _shouldShowOnboarding = shouldShow;
      _hasSeenSpecialOffer = hasSeenOffer;
      _checkingOnboarding = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Show splash while checking onboarding status or auth OR minimum time not elapsed
        if (_checkingOnboarding ||
            !_minSplashTimeElapsed ||
            auth.status == AuthStatus.initial ||
            auth.status == AuthStatus.loading) {
          return const SplashScreen();
        }

        // If user is not authenticated
        if (!auth.isAuthenticated) {
          // Show onboarding if they haven't seen it
          if (_shouldShowOnboarding) {
            return const PreLoginOnboardingScreen();
          }
          // Otherwise show login
          return const LoginScreen();
        }

        // User is authenticated — check if setup wizard is needed
        // Uses backend profileCompleted field (per-user, not per-device)
        if (!_setupWizardCompleted && auth.user?.profileCompleted != true) {
          return SetupWizardScreen(
            onComplete: () {
              setState(() {
                _setupWizardCompleted = true;
              });
            },
          );
        }

        // Go to main screen
        return const MainScreen(initialPage: 0);
      },
    );
  }
}

// All screens are now imported from their feature modules
