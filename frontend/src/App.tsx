import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageSpinner } from '@/components/ui/spinner';
import {
  HomePage,
  AboutPage,
  PricingPage,
  FeaturesPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  SupportPage,
  FAQPage,
  CookiesPage,
  DataDeletionPage,
  SitemapPage,
  TutorialPage,
  BlogPage,
  BlogPostPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '@/pages';
import { OnboardingPage, PreOnboardingPage } from '@/pages';
import {
  DashboardHomePage,
  StudySetsPage,
  StudySetDetailPage,
  CreateStudySetPage,
  EditStudySetPage,
  AddFlashcardPage,
  EditFlashcardPage,
  StudySessionPage,
  QuizPage,
  MatchGamePage,
  AnalyticsPage,
  LiveQuizPage,
  NotificationsPage,
  CreateNotePage,
  NoteDetailPage,
  EditNotePage,
  GenerateNotePage,
  ExamClonePage,
  ExamDetailPage,
  PracticeExamPage,
  ReviewQueuePage,
  CollaborativeExamPage,
  BadgesPage,
  LeaderboardPage,
  BookmarksPage,
  ProblemInputPage,
  CameraScanPage,
  SolvingProgressPage,
  SolutionPage,
  ProblemHistoryPage,
  SimilarProblemsPage,
  StudyBuddyChatPage,
  HintModePage,
  PracticeQuizPage,
  ConceptMapPage,
  FormulaCardsPage,
  BatchSolverPage,
  SolverBookmarksPage,
  TeachBackPage,
  TeachBackSessionPage,

  LearningPathsPage,
  LearningPathDetailPage,
  DeepResearchPage,
  ResearchProgressPage,
  ResearchReportPage,
  ResearchHistoryPage,
  SettingsPage,
  ProfileEditPage,
  AccountSettingsPage,
  NotificationSettingsPage,
  AppearanceSettingsPage,
  SubscriptionPage,
  CheckoutPage,
  PaymentSuccessPage,
  ManageSubscriptionPage,
  BillingHistoryPage,
  ChatPage,
  ChatHistoryPage,
} from '@/pages/dashboard';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}


// 404 Page
function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">{t('notFound.title')}</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            {t('notFound.description')}
          </p>
          <Button asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              {t('notFound.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}

// Protected route wrapper
function ProtectedRoute({ children, skipOnboarding }: { children: React.ReactNode; skipOnboarding?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if profile not completed (skip for the onboarding page itself)
  if (!skipOnboarding && user && user.profileCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Guest route wrapper (redirect if already logged in)
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes location={location} key={location.pathname}>
        {/* Public marketing routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/data-deletion" element={<DataDeletionPage />} />
      <Route path="/sitemap" element={<SitemapPage />} />
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />

      {/* Pre-login onboarding (feature slideshow, no auth needed) */}
      <Route path="/welcome" element={<PreOnboardingPage />} />

      {/* Auth routes (guest only) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute skipOnboarding>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets"
        element={
          <ProtectedRoute>
            <StudySetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/create"
        element={
          <ProtectedRoute>
            <CreateStudySetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id"
        element={
          <ProtectedRoute>
            <StudySetDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/edit"
        element={
          <ProtectedRoute>
            <EditStudySetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/study"
        element={
          <ProtectedRoute>
            <StudySessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/match"
        element={
          <ProtectedRoute>
            <MatchGamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      {/* AI Chat Routes */}
      <Route
        path="/dashboard/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/chat/history"
        element={
          <ProtectedRoute>
            <ChatHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/live-quiz"
        element={
          <ProtectedRoute>
            <LiveQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/live-quiz/:code"
        element={
          <ProtectedRoute>
            <LiveQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/live-quiz"
        element={
          <ProtectedRoute>
            <LiveQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/flashcards/add"
        element={
          <ProtectedRoute>
            <AddFlashcardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/flashcards/:flashcardId/edit"
        element={
          <ProtectedRoute>
            <EditFlashcardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/notes/create"
        element={
          <ProtectedRoute>
            <CreateNotePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/notes/generate"
        element={
          <ProtectedRoute>
            <GenerateNotePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/notes/:noteId"
        element={
          <ProtectedRoute>
            <NoteDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/study-sets/:id/notes/:noteId/edit"
        element={
          <ProtectedRoute>
            <EditNotePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      {/* Exam Clone Routes */}
      <Route
        path="/dashboard/exam-clone"
        element={
          <ProtectedRoute>
            <ExamClonePage />
          </ProtectedRoute>
        }
      />
      {/* Static routes BEFORE dynamic :id routes */}
      <Route
        path="/dashboard/exam-clone/review-queue"
        element={
          <ProtectedRoute>
            <ReviewQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exam-clone/badges"
        element={
          <ProtectedRoute>
            <BadgesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exam-clone/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exam-clone/bookmarks"
        element={
          <ProtectedRoute>
            <BookmarksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exam-clone/:id"
        element={
          <ProtectedRoute>
            <ExamDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exam-clone/:id/practice"
        element={
          <ProtectedRoute>
            <PracticeExamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exam-clone/:id/live"
        element={
          <ProtectedRoute>
            <CollaborativeExamPage />
          </ProtectedRoute>
        }
      />
      {/* Problem Solver Routes */}
      <Route
        path="/dashboard/problem-solver"
        element={
          <ProtectedRoute>
            <ProblemInputPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/camera"
        element={
          <ProtectedRoute>
            <CameraScanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/history"
        element={
          <ProtectedRoute>
            <ProblemHistoryPage />
          </ProtectedRoute>
        }
      />
      {/* Static problem-solver routes BEFORE dynamic :id routes */}
      <Route
        path="/dashboard/problem-solver/batch"
        element={
          <ProtectedRoute>
            <BatchSolverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/bookmarks"
        element={
          <ProtectedRoute>
            <SolverBookmarksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/solve/:id"
        element={
          <ProtectedRoute>
            <SolvingProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/solution/:id"
        element={
          <ProtectedRoute>
            <SolutionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/similar/:id"
        element={
          <ProtectedRoute>
            <SimilarProblemsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/chat/:id"
        element={
          <ProtectedRoute>
            <StudyBuddyChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/hint/:id"
        element={
          <ProtectedRoute>
            <HintModePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/quiz/:id"
        element={
          <ProtectedRoute>
            <PracticeQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/concept-map/:id"
        element={
          <ProtectedRoute>
            <ConceptMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/problem-solver/formula-cards/:id"
        element={
          <ProtectedRoute>
            <FormulaCardsPage />
          </ProtectedRoute>
        }
      />
      {/* Teach Back Routes */}
      <Route
        path="/dashboard/teach-back"
        element={
          <ProtectedRoute>
            <TeachBackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/teach-back/:id"
        element={
          <ProtectedRoute>
            <TeachBackSessionPage />
          </ProtectedRoute>
        }
      />
      {/* Learning Paths */}
      <Route
        path="/dashboard/learning-paths"
        element={
          <ProtectedRoute>
            <LearningPathsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/learning-paths/:id"
        element={
          <ProtectedRoute>
            <LearningPathDetailPage />
          </ProtectedRoute>
        }
      />
      {/* Deep Research Routes */}
      <Route
        path="/dashboard/research"
        element={
          <ProtectedRoute>
            <DeepResearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/research/history"
        element={
          <ProtectedRoute>
            <ResearchHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/research/progress/:id"
        element={
          <ProtectedRoute>
            <ResearchProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/research/report/:id"
        element={
          <ProtectedRoute>
            <ResearchReportPage />
          </ProtectedRoute>
        }
      />
      {/* Settings Routes */}
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings/profile"
        element={
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings/account"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings/notifications"
        element={
          <ProtectedRoute>
            <NotificationSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings/appearance"
        element={
          <ProtectedRoute>
            <AppearanceSettingsPage />
          </ProtectedRoute>
        }
      />
      {/* Subscription Routes */}
      <Route
        path="/dashboard/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subscription/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subscription/success"
        element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subscription/manage"
        element={
          <ProtectedRoute>
            <ManageSubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subscription/billing"
        element={
          <ProtectedRoute>
            <BillingHistoryPage />
          </ProtectedRoute>
        }
      />
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
