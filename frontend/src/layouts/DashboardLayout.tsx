import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Library,
  MessageSquare,
  Sparkles,
  Bell,
  BarChart3,
  FileText,
  Lightbulb,
  GraduationCap,
  Route,
  Search,
  Crown,
  CreditCard,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { labelKey: 'nav.studySets', icon: Library, href: '/dashboard/study-sets' },
  { labelKey: 'nav.aiChat', icon: MessageSquare, href: '/dashboard/chat' },
  { labelKey: 'nav.problemSolver', icon: Lightbulb, href: '/dashboard/problem-solver' },
  { labelKey: 'nav.examClone', icon: FileText, href: '/dashboard/exam-clone' },
  { labelKey: 'nav.teachBack', icon: GraduationCap, href: '/dashboard/teach-back' },
  { labelKey: 'nav.learningPaths', icon: Route, href: '/dashboard/learning-paths' },
  { labelKey: 'nav.deepResearch', icon: Search, href: '/dashboard/research' },
  { labelKey: 'nav.analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { labelKey: 'nav.notifications', icon: Bell, href: '/dashboard/notifications' },
  { labelKey: 'nav.subscription', icon: Crown, href: '/dashboard/subscription' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transform transition-transform duration-200 lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logos/studyield-logo.png" alt="Studyield" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">Studyield</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable area: nav + bottom items */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="flex-shrink-0 p-4 pt-0 space-y-3">
            {/* Pro upgrade banner */}
            {user?.plan === 'free' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{t('common.upgradeToPro')}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('dashboard.upgradeBanner.unlockDescription')}
                </p>
                <Button size="sm" className="w-full bg-green-500 hover:bg-green-600" asChild>
                  <Link to="/dashboard/subscription">{t('common.upgrade')}</Link>
                </Button>
              </div>
            )}

            {/* Settings link */}
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
              {t('common.settings')}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Notification bell */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-green-600">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.name || t('dashboard.userMenu.user')}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.plan} {t('common.plan')}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        to="/dashboard/subscription"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        {t('common.subscription')}
                        <span className="ml-auto px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-medium capitalize">
                          {user?.plan}
                        </span>
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t('common.settings')}
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
