import 'package:equatable/equatable.dart';

enum OnboardingStep {
  welcome,           // Welcome modal
  guidedTour,        // Interactive demo with tooltips
  completed,         // Finished
}

class PostLoginOnboardingState extends Equatable {
  final OnboardingStep currentStep;
  final bool taskOneComplete;    // Deep Research
  final bool taskTwoComplete;    // AI Flashcards
  final bool taskThreeComplete;  // Problem Solver
  final bool taskFourComplete;   // Quiz
  final bool tourCompleted;
  final bool offerShown;
  final bool canProceedToOffer;

  const PostLoginOnboardingState({
    this.currentStep = OnboardingStep.welcome,
    this.taskOneComplete = false,
    this.taskTwoComplete = false,
    this.taskThreeComplete = false,
    this.taskFourComplete = false,
    this.tourCompleted = false,
    this.offerShown = false,
    this.canProceedToOffer = false,
  });

  bool get allTasksComplete => taskOneComplete && taskTwoComplete && taskThreeComplete && taskFourComplete;

  int get completedTaskCount {
    int count = 0;
    if (taskOneComplete) count++;
    if (taskTwoComplete) count++;
    if (taskThreeComplete) count++;
    if (taskFourComplete) count++;
    return count;
  }

  PostLoginOnboardingState copyWith({
    OnboardingStep? currentStep,
    bool? taskOneComplete,
    bool? taskTwoComplete,
    bool? taskThreeComplete,
    bool? taskFourComplete,
    bool? tourCompleted,
    bool? offerShown,
    bool? canProceedToOffer,
  }) {
    return PostLoginOnboardingState(
      currentStep: currentStep ?? this.currentStep,
      taskOneComplete: taskOneComplete ?? this.taskOneComplete,
      taskTwoComplete: taskTwoComplete ?? this.taskTwoComplete,
      taskThreeComplete: taskThreeComplete ?? this.taskThreeComplete,
      taskFourComplete: taskFourComplete ?? this.taskFourComplete,
      tourCompleted: tourCompleted ?? this.tourCompleted,
      offerShown: offerShown ?? this.offerShown,
      canProceedToOffer: canProceedToOffer ?? this.canProceedToOffer,
    );
  }

  @override
  List<Object?> get props => [
        currentStep,
        taskOneComplete,
        taskTwoComplete,
        taskThreeComplete,
        taskFourComplete,
        tourCompleted,
        offerShown,
        canProceedToOffer,
      ];
}
