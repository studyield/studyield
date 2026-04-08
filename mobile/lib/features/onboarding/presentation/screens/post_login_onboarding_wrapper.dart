import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/network/api_client.dart';
import '../../data/datasources/onboarding_local_datasource.dart';
import '../bloc/post_login_onboarding_cubit.dart';
import '../bloc/post_login_onboarding_state.dart';
import 'welcome_onboarding_modal.dart';
import 'guided_tour_screen.dart';
import 'special_offer_screen.dart';
import '../../../main_navigation/main_screen.dart';
import '../../../study_sets/presentation/bloc/study_sets_bloc.dart';
import '../../../study_sets/data/datasources/study_sets_remote_datasource.dart';
import '../../../study_sets/data/repositories/study_sets_repository_impl.dart';
import '../../../study_sets/domain/usecases/get_study_sets_usecase.dart';
import '../../../study_sets/domain/usecases/create_study_set_usecase.dart';
import '../../../study_sets/domain/usecases/delete_study_set_usecase.dart';
import '../../../problem_solver/presentation/bloc/problem_solver_bloc.dart';
import '../../../problem_solver/data/repositories/problem_solver_repository_impl.dart';

/// Main wrapper that coordinates the post-login onboarding flow
class PostLoginOnboardingWrapper extends StatelessWidget {
  const PostLoginOnboardingWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<SharedPreferences>(
      future: SharedPreferences.getInstance(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final prefs = snapshot.data!;
        final dataSource = OnboardingLocalDataSourceImpl(sharedPreferences: prefs);
        final apiClient = ApiClient.instance;

        // Create Study Sets dependencies
        final studySetsDataSource = StudySetsRemoteDataSourceImpl(apiClient: apiClient);
        final studySetsRepository = StudySetsRepositoryImpl(remoteDataSource: studySetsDataSource);
        final getStudySetsUseCase = GetStudySetsUseCase(repository: studySetsRepository);
        final createStudySetUseCase = CreateStudySetUseCase(repository: studySetsRepository);
        final deleteStudySetUseCase = DeleteStudySetUseCase(repository: studySetsRepository);

        // Create Problem Solver dependencies
        final problemSolverRepository = ProblemSolverRepositoryImpl(apiClient: apiClient);

        return MultiBlocProvider(
          providers: [
            BlocProvider(
              create: (_) => PostLoginOnboardingCubit(dataSource: dataSource)..initialize(),
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
              create: (_) => ProblemSolverBloc(repository: problemSolverRepository),
            ),
          ],
          child: const _OnboardingNavigator(),
        );
      },
    );
  }
}

class _OnboardingNavigator extends StatelessWidget {
  const _OnboardingNavigator();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<PostLoginOnboardingCubit, PostLoginOnboardingState>(
      listener: (context, state) {
        // Handle navigation based on state changes
        if (state.currentStep == OnboardingStep.completed) {
          // Navigate to main app
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => const MainScreen(initialPage: 0),
            ),
          );
        }
      },
      builder: (context, state) {
        switch (state.currentStep) {
          case OnboardingStep.welcome:
            return WelcomeOnboardingModal(
              onStart: () {
                context.read<PostLoginOnboardingCubit>().startTour();
              },
              onSkip: () {
                context.read<PostLoginOnboardingCubit>().skipOnboarding();
              },
            );

          case OnboardingStep.guidedTour:
            return GuidedTourScreen(
              onComplete: () {
                context.read<PostLoginOnboardingCubit>().showSpecialOffer();
              },
              onSkip: () {
                context.read<PostLoginOnboardingCubit>().skipOnboarding();
              },
            );

          case OnboardingStep.specialOffer:
            return SpecialOfferScreen(
              onComplete: () {
                context.read<PostLoginOnboardingCubit>().completeOnboarding();
              },
              onSkip: () {
                context.read<PostLoginOnboardingCubit>().completeOnboarding();
              },
            );

          case OnboardingStep.completed:
            // This should trigger navigation in listener
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
        }
      },
    );
  }
}
