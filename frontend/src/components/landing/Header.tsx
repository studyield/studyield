import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  MessageSquare,
  Sparkles,
  GraduationCap,
  Route,
  BarChart3,
  ArrowRight,
  Zap,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const features = [
  { nameKey: 'header.features.studySets', descKey: 'header.features.studySetsDesc', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/dashboard/study-sets' },
  { nameKey: 'header.features.aiChat', descKey: 'header.features.aiChatDesc', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-500/10', href: '/dashboard/chat' },
  { nameKey: 'header.features.problemSolver', descKey: 'header.features.problemSolverDesc', icon: Sparkles, color: 'text-orange-500', bg: 'bg-orange-500/10', href: '/dashboard/problem-solver' },
  { nameKey: 'header.features.examCloning', descKey: 'header.features.examCloningDesc', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-500/10', href: '/dashboard/exam-clone' },
  { nameKey: 'header.features.teachBack', descKey: 'header.features.teachBackDesc', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', href: '/dashboard/teach-back' },
  { nameKey: 'header.features.learningPaths', descKey: 'header.features.learningPathsDesc', icon: Route, color: 'text-teal-500', bg: 'bg-teal-500/10', href: '/dashboard/learning-paths' },
  { nameKey: 'header.features.deepResearch', descKey: 'header.features.deepResearchDesc', icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-500/10', href: '/dashboard/research' },
  { nameKey: 'header.features.analytics', descKey: 'header.features.analyticsDesc', icon: BarChart3, color: 'text-pink-500', bg: 'bg-pink-500/10', href: '/dashboard/analytics' },
];

const navLinks = [
  { nameKey: 'nav.features', href: '/features', hasDropdown: true },
  { nameKey: 'nav.pricing', href: '/pricing' },
  { nameKey: 'nav.blog', href: '/blog' },
  { nameKey: 'nav.tutorial', href: '/tutorial' },
  { nameKey: 'nav.about', href: '/about' },
  { nameKey: 'nav.contact', href: '/contact' },
];

export function Header() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm'
          : 'bg-background/80 backdrop-blur-sm border-b border-border/30 shadow-sm'
      )}
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logos/studyield-logo.png" alt="Studyield" className="w-12 h-12 object-contain transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Studyield
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.nameKey} className="relative">
                {link.hasDropdown ? (
                  <div
                    onMouseEnter={() => setIsFeatureDropdownOpen(true)}
                    onMouseLeave={() => setIsFeatureDropdownOpen(false)}
                  >
                    <button
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                        'hover:bg-muted',
                        location.pathname === link.href
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t(link.nameKey)}
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isFeatureDropdownOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {isFeatureDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[640px]"
                        >
                          <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl shadow-black/5 p-5">
                            <div className="grid grid-cols-2 gap-2">
                              {features.map((feature) => (
                                <Link
                                  key={feature.nameKey}
                                  to={feature.href}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/80 transition-colors group/item"
                                >
                                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', feature.bg)}>
                                    <feature.icon className={cn('w-5 h-5', feature.color)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors">
                                      {t(feature.nameKey)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {t(feature.descKey)}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <Link
                                to="/features"
                                className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                              >
                                {t('nav.viewAllFeatures')}
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    to={link.href}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                      'hover:bg-muted',
                      location.pathname === link.href
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(link.nameKey)}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted border border-border/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-green-600">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium pr-1">{t('nav.dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{t('common.signIn')}</Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
                  asChild
                >
                  <Link to="/welcome">
                    <Zap className="w-4 h-4 mr-1.5" />
                    {t('common.getStarted')}
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-16 right-0 bottom-0 w-full sm:w-80 bg-background border-l border-border lg:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Navigation Links */}
                <div className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.nameKey}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={link.href}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-colors',
                          'hover:bg-muted',
                          location.pathname === link.href
                            ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                            : 'text-foreground'
                        )}
                      >
                        {t(link.nameKey)}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Features Grid */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">
                    {t('common.features')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {features.slice(0, 6).map((feature, index) => (
                      <motion.div
                        key={feature.nameKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                      >
                        <Link
                          to={feature.href}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors text-center"
                        >
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', feature.bg)}>
                            <feature.icon className={cn('w-5 h-5', feature.color)} />
                          </div>
                          <span className="text-xs font-medium">{t(feature.nameKey)}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Auth Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 border-t border-border space-y-3"
                >
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-base font-semibold text-green-600">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{t('nav.dashboard')}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full h-12" asChild>
                        <Link to="/login">{t('common.signIn')}</Link>
                      </Button>
                      <Button
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25"
                        asChild
                      >
                        <Link to="/welcome">
                          <Zap className="w-4 h-4 mr-2" />
                          {t('common.getStarted')}
                        </Link>
                      </Button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
