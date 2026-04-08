import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'shared/providers/theme_provider.dart';

/// Main app widget with theme configuration

class StudyieldApp extends StatelessWidget {
  const StudyieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          title: 'Studyield',
          debugShowCheckedModeBanner: false,

          // Theme configuration
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeProvider.themeMode,

          // TODO: Add GoRouter configuration
          // router: appRouter,

          // Temporary home page
          home: const Scaffold(
            body: Center(
              child: Text('Studyield Mobile App'),
            ),
          ),
        );
      },
    );
  }
}
