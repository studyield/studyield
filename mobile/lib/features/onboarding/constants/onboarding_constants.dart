import 'package:flutter/material.dart';

/// Constants for pre-login onboarding
class OnboardingConstants {
  OnboardingConstants._();

  // Storage Keys - Pre-login
  static const String hasSeenPreLoginKey = 'has_seen_pre_login_onboarding';
  static const String skipCountKey = 'pre_login_onboarding_skip_count';
  static const int maxSkipCount = 3;

  // Storage Keys - Post-login
  static const String hasCompletedPostLoginKey = 'has_completed_post_login_onboarding';
  static const String hasSeenSpecialOfferKey = 'has_seen_special_offer';
  static const String hasSeenWelcomeOfferKey = 'has_seen_welcome_offer';
  static const String postLoginTaskOneKey = 'post_login_task_one_completed'; // Deep Research
  static const String postLoginTaskTwoKey = 'post_login_task_two_completed'; // AI Flashcards
  static const String postLoginTaskThreeKey = 'post_login_task_three_completed'; // Problem Solver
  static const String postLoginTaskFourKey = 'post_login_task_four_completed'; // Quiz

  // Lottie Animation Paths
  static const String welcomeAnimation = 'assets/animations/welcome.json';
  static const String flashcardsAnimation = 'assets/animations/flashcards.json';
  static const String aiSolverAnimation = 'assets/animations/ai_solver.json';
  static const String gamificationAnimation = 'assets/animations/gamification.json';
  static const String learningPathAnimation = 'assets/animations/learning_path.json';

  // Animation Durations
  static const Duration fastDuration = Duration(milliseconds: 300);
  static const Duration standardDuration = Duration(milliseconds: 400);
  static const Duration slowDuration = Duration(milliseconds: 800);
  static const Duration slideTransition = Duration(milliseconds: 600);

  // Animation Curves
  static const Curve defaultCurve = Curves.easeInOut;
  static const Curve bounceCurve = Curves.elasticOut;
  static const Curve smoothCurve = Curves.easeInOutCubic;

  // Number of slides
  static const int slideCount = 5;
}
