import 'package:flutter_bloc/flutter_bloc.dart';
import '../../constants/onboarding_constants.dart';
import '../../data/datasources/onboarding_local_datasource.dart';
import 'post_login_onboarding_state.dart';

class PostLoginOnboardingCubit extends Cubit<PostLoginOnboardingState> {
  final OnboardingLocalDataSource _dataSource;

  PostLoginOnboardingCubit({
    required OnboardingLocalDataSource dataSource,
  })  : _dataSource = dataSource,
        super(const PostLoginOnboardingState());

  /// Initialize and load saved progress
  Future<void> initialize() async {
    final taskOne = await _dataSource.isTaskCompleted(OnboardingConstants.postLoginTaskOneKey);
    final taskTwo = await _dataSource.isTaskCompleted(OnboardingConstants.postLoginTaskTwoKey);
    final taskThree = await _dataSource.isTaskCompleted(OnboardingConstants.postLoginTaskThreeKey);
    final taskFour = await _dataSource.isTaskCompleted(OnboardingConstants.postLoginTaskFourKey);
    final offerSeen = await _dataSource.hasSeenSpecialOffer();

    emit(state.copyWith(
      taskOneComplete: taskOne,
      taskTwoComplete: taskTwo,
      taskThreeComplete: taskThree,
      taskFourComplete: taskFour,
      offerShown: offerSeen,
    ));
  }

  /// Start the guided tour
  void startTour() {
    emit(state.copyWith(currentStep: OnboardingStep.guidedTour));
  }

  /// Mark task 1 (Deep Research) as complete
  Future<void> completeTaskOne() async {
    await _dataSource.markTaskCompleted(OnboardingConstants.postLoginTaskOneKey);
    emit(state.copyWith(taskOneComplete: true));
    _checkTourCompletion();
  }

  /// Mark task 2 (AI Flashcards) as complete
  Future<void> completeTaskTwo() async {
    await _dataSource.markTaskCompleted(OnboardingConstants.postLoginTaskTwoKey);
    emit(state.copyWith(taskTwoComplete: true));
    _checkTourCompletion();
  }

  /// Mark task 3 (Problem Solver) as complete
  Future<void> completeTaskThree() async {
    await _dataSource.markTaskCompleted(OnboardingConstants.postLoginTaskThreeKey);
    emit(state.copyWith(taskThreeComplete: true));
    _checkTourCompletion();
  }

  /// Mark task 4 (Quiz) as complete
  Future<void> completeTaskFour() async {
    await _dataSource.markTaskCompleted(OnboardingConstants.postLoginTaskFourKey);
    emit(state.copyWith(taskFourComplete: true));
    _checkTourCompletion();
  }

  /// Check if tour is complete and enable proceed button
  void _checkTourCompletion() {
    if (state.allTasksComplete && !state.tourCompleted) {
      emit(state.copyWith(
        tourCompleted: true,
        canProceedToOffer: true,
      ));
    }
  }

  /// Mark special offer as seen (deprecated - no longer used)
  Future<void> markOfferSeen() async {
    await _dataSource.markSpecialOfferSeen();
    emit(state.copyWith(offerShown: true));
  }

  /// Complete the entire onboarding flow
  Future<void> completeOnboarding() async {
    await _dataSource.markPostLoginOnboardingCompleted();
    emit(state.copyWith(currentStep: OnboardingStep.completed));
  }

  /// Skip the entire onboarding
  Future<void> skipOnboarding() async {
    await _dataSource.markPostLoginOnboardingCompleted();
    await _dataSource.markSpecialOfferSeen();
    emit(state.copyWith(currentStep: OnboardingStep.completed));
  }

  /// Reset onboarding (for testing)
  Future<void> reset() async {
    await _dataSource.resetPostLoginOnboarding();
    emit(const PostLoginOnboardingState());
  }
}
