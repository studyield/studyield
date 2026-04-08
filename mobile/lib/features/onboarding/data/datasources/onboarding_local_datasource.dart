import 'package:shared_preferences/shared_preferences.dart';
import '../../constants/onboarding_constants.dart';

abstract class OnboardingLocalDataSource {
  // Pre-login onboarding
  Future<bool> hasSeenPreLoginOnboarding();
  Future<void> markPreLoginOnboardingSeen();
  Future<int> getSkipCount();
  Future<void> incrementSkipCount();
  Future<bool> shouldShowOnboarding();

  // Post-login onboarding
  Future<bool> hasCompletedPostLoginOnboarding();
  Future<void> markPostLoginOnboardingCompleted();
  Future<bool> hasSeenSpecialOffer();
  Future<void> markSpecialOfferSeen();
  Future<bool> isTaskCompleted(String taskKey);
  Future<void> markTaskCompleted(String taskKey);
  Future<void> resetPostLoginOnboarding(); // For testing
}

class OnboardingLocalDataSourceImpl implements OnboardingLocalDataSource {
  final SharedPreferences sharedPreferences;

  OnboardingLocalDataSourceImpl({required this.sharedPreferences});

  @override
  Future<bool> hasSeenPreLoginOnboarding() async {
    return sharedPreferences.getBool(OnboardingConstants.hasSeenPreLoginKey) ?? false;
  }

  @override
  Future<void> markPreLoginOnboardingSeen() async {
    await sharedPreferences.setBool(OnboardingConstants.hasSeenPreLoginKey, true);
  }

  @override
  Future<int> getSkipCount() async {
    return sharedPreferences.getInt(OnboardingConstants.skipCountKey) ?? 0;
  }

  @override
  Future<void> incrementSkipCount() async {
    final currentCount = await getSkipCount();
    await sharedPreferences.setInt(
      OnboardingConstants.skipCountKey,
      currentCount + 1,
    );
  }

  @override
  Future<bool> shouldShowOnboarding() async {
    final hasSeen = await hasSeenPreLoginOnboarding();
    final skipCount = await getSkipCount();

    // Don't show if user has completed it or skipped too many times
    return !hasSeen && skipCount < OnboardingConstants.maxSkipCount;
  }

  // Post-login onboarding methods
  @override
  Future<bool> hasCompletedPostLoginOnboarding() async {
    return sharedPreferences.getBool(OnboardingConstants.hasCompletedPostLoginKey) ?? false;
  }

  @override
  Future<void> markPostLoginOnboardingCompleted() async {
    await sharedPreferences.setBool(OnboardingConstants.hasCompletedPostLoginKey, true);
  }

  @override
  Future<bool> hasSeenSpecialOffer() async {
    return sharedPreferences.getBool(OnboardingConstants.hasSeenSpecialOfferKey) ?? false;
  }

  @override
  Future<void> markSpecialOfferSeen() async {
    await sharedPreferences.setBool(OnboardingConstants.hasSeenSpecialOfferKey, true);
  }

  @override
  Future<bool> isTaskCompleted(String taskKey) async {
    return sharedPreferences.getBool(taskKey) ?? false;
  }

  @override
  Future<void> markTaskCompleted(String taskKey) async {
    await sharedPreferences.setBool(taskKey, true);
  }

  @override
  Future<void> resetPostLoginOnboarding() async {
    await sharedPreferences.remove(OnboardingConstants.hasCompletedPostLoginKey);
    await sharedPreferences.remove(OnboardingConstants.hasSeenSpecialOfferKey);
    await sharedPreferences.remove(OnboardingConstants.postLoginTaskOneKey);
    await sharedPreferences.remove(OnboardingConstants.postLoginTaskTwoKey);
    await sharedPreferences.remove(OnboardingConstants.postLoginTaskThreeKey);
    await sharedPreferences.remove(OnboardingConstants.postLoginTaskFourKey);
  }
}
