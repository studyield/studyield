import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Map,
  Home,
  Zap,
  Mail,
  Shield,
  HelpCircle,
  LogIn,
  UserPlus,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  FileText,
  BookOpen,
  CreditCard,
  MessageSquare,
  Brain,
  Layers,
  Settings,
  User,
  Lock,
  Cookie,
  Trash2,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Button } from '@/components/ui/button';

interface SitemapSection {
  title: string;
  icon: React.ElementType;
  color: string;
  links: {
    name: string;
    href: string;
    icon: React.ElementType;
    description?: string;
  }[];
}

export function SitemapPage() {
  const { t } = useTranslation();

  const sitemapData: SitemapSection[] = [
    {
      title: t('sitemapPage.sections.mainPages'),
      icon: Home,
      color: 'from-blue-500 to-cyan-500',
      links: [
        { name: t('sitemapPage.links.home'), href: '/', icon: Home, description: t('sitemapPage.links.homeDesc') },
        { name: t('sitemapPage.links.aboutUs'), href: '/about', icon: BookOpen, description: t('sitemapPage.links.aboutUsDesc') },
        { name: t('sitemapPage.links.features'), href: '/features', icon: Zap, description: t('sitemapPage.links.featuresDesc') },
        { name: t('sitemapPage.links.contact'), href: '/contact', icon: Mail, description: t('sitemapPage.links.contactDesc') },
      ],
    },
    {
      title: t('sitemapPage.sections.account'),
      icon: User,
      color: 'from-violet-500 to-purple-500',
      links: [
        { name: t('sitemapPage.links.signIn'), href: '/login', icon: LogIn, description: t('sitemapPage.links.signInDesc') },
        { name: t('sitemapPage.links.createAccount'), href: '/register', icon: UserPlus, description: t('sitemapPage.links.createAccountDesc') },
        { name: t('sitemapPage.links.forgotPassword'), href: '/forgot-password', icon: Lock, description: t('sitemapPage.links.forgotPasswordDesc') },
        { name: t('sitemapPage.links.dashboard'), href: '/dashboard', icon: Layers, description: t('sitemapPage.links.dashboardDesc') },
        { name: t('sitemapPage.links.settings'), href: '/settings', icon: Settings, description: t('sitemapPage.links.settingsDesc') },
      ],
    },
    {
      title: t('sitemapPage.sections.learningFeatures'),
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-500',
      links: [
        { name: t('sitemapPage.links.studySets'), href: '/features#study-sets', icon: Layers, description: t('sitemapPage.links.studySetsDesc') },
        { name: t('sitemapPage.links.flashcards'), href: '/features#flashcards', icon: CreditCard, description: t('sitemapPage.links.flashcardsDesc') },
        { name: t('sitemapPage.links.aiQuizzes'), href: '/features#quizzes', icon: Brain, description: t('sitemapPage.links.aiQuizzesDesc') },
        { name: t('sitemapPage.links.documentChat'), href: '/features#chat', icon: MessageSquare, description: t('sitemapPage.links.documentChatDesc') },
        { name: t('sitemapPage.links.problemSolver'), href: '/features#solver', icon: Zap, description: t('sitemapPage.links.problemSolverDesc') },
      ],
    },
    {
      title: t('sitemapPage.sections.support'),
      icon: HelpCircle,
      color: 'from-amber-500 to-orange-500',
      links: [
        { name: t('sitemapPage.links.helpCenter'), href: '/support', icon: HelpCircle, description: t('sitemapPage.links.helpCenterDesc') },
        { name: t('sitemapPage.links.faq'), href: '/faq', icon: MessageSquare, description: t('sitemapPage.links.faqDesc') },
        { name: t('sitemapPage.links.gettingStarted'), href: '/support/getting-started', icon: BookOpen, description: t('sitemapPage.links.gettingStartedDesc') },
        { name: t('sitemapPage.links.contactSupport'), href: '/contact', icon: Mail, description: t('sitemapPage.links.contactSupportDesc') },
      ],
    },
    {
      title: t('sitemapPage.sections.legalPrivacy'),
      icon: Shield,
      color: 'from-rose-500 to-pink-500',
      links: [
        { name: t('sitemapPage.links.privacyPolicy'), href: '/privacy', icon: Shield, description: t('sitemapPage.links.privacyPolicyDesc') },
        { name: t('sitemapPage.links.termsOfService'), href: '/terms', icon: FileText, description: t('sitemapPage.links.termsOfServiceDesc') },
        { name: t('sitemapPage.links.cookiePolicy'), href: '/cookies', icon: Cookie, description: t('sitemapPage.links.cookiePolicyDesc') },
        { name: t('sitemapPage.links.dataDeletion'), href: '/data-deletion', icon: Trash2, description: t('sitemapPage.links.dataDeletionDesc') },
      ],
    },
  ];

  const quickLinks = [
    { name: t('sitemapPage.links.home'), href: '/', icon: Home, color: 'bg-blue-500' },
    { name: t('sitemapPage.links.features'), href: '/features', icon: Zap, color: 'bg-violet-500' },
    { name: t('sitemapPage.links.support'), href: '/support', icon: HelpCircle, color: 'bg-amber-500' },
    { name: t('sitemapPage.links.signIn'), href: '/login', icon: LogIn, color: 'bg-rose-500' },
    { name: t('sitemapPage.links.getStarted'), href: '/register', icon: UserPlus, color: 'bg-cyan-500' },
  ];

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50/50 via-gray-50/30 to-background dark:from-slate-950/20 dark:via-gray-950/10 dark:to-background min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-400 rounded-full blur-3xl" />
            <div className="absolute top-40 right-40 w-64 h-64 bg-emerald-400 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-8"
            >
              <Link to="/" className="hover:text-foreground transition-colors">
                {t('sitemapPage.breadcrumbHome')}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{t('sitemapPage.breadcrumbSitemap')}</span>
            </motion.nav>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30 rounded-full mb-6 border border-slate-200 dark:border-slate-800"
              >
                <Map className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t('sitemapPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                {t('sitemapPage.title')}{' '}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {t('sitemapPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('sitemapPage.description')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              <h2 className="text-lg font-bold text-center mb-6">{t('sitemapPage.quickAccess')}</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {quickLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  >
                    <Link
                      to={link.href}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-muted border-2 border-border hover:border-primary/30 rounded-full text-sm font-semibold transition-all duration-200 group"
                    >
                      <div className={`w-6 h-6 rounded-full ${link.color} flex items-center justify-center`}>
                        <link.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      {link.name}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sitemap Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {sitemapData.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="group"
                >
                  <div className="bg-card border-2 border-border hover:border-primary/30 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{section.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group/link"
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted group-hover/link:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                              <link.icon className="w-4 h-4 text-muted-foreground group-hover/link:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold group-hover/link:text-primary transition-colors block">
                                {link.name}
                              </span>
                              {link.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {link.description}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/link:opacity-100 group-hover/link:text-primary transition-all shrink-0 mt-1" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* XML Sitemap Card */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t('sitemapPage.xmlSitemap')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('sitemapPage.xmlSitemapDesc')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-gray-900 border-2 font-semibold"
                    asChild
                  >
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('sitemapPage.viewSitemapXml')}
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
