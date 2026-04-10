import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Cookie,
  ChevronRight,
  Info,
  Layers,
  Eye,
  Globe,
  Settings,
  SlidersHorizontal,
  RefreshCw,
  Mail,
  ArrowRight,
  Shield,
  BarChart3,
  Target,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: React.ElementType;
}

interface CookieCategory {
  name: string;
  description: string;
  essential: boolean;
  examples: string[];
  retention: string;
  icon: React.ElementType;
  color: string;
}

export function CookiesPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('what-are-cookies');

  const tableOfContents: TableOfContentsItem[] = [
    { id: 'what-are-cookies', title: t('cookiesPage.toc.whatAreCookies'), icon: Info },
    { id: 'types-of-cookies', title: t('cookiesPage.toc.typesOfCookies'), icon: Layers },
    { id: 'how-we-use', title: t('cookiesPage.toc.howWeUse'), icon: Eye },
    { id: 'third-party', title: t('cookiesPage.toc.thirdParty'), icon: Globe },
    { id: 'managing-cookies', title: t('cookiesPage.toc.managingCookies'), icon: Settings },
    { id: 'cookie-settings', title: t('cookiesPage.toc.cookieSettings'), icon: SlidersHorizontal },
    { id: 'updates', title: t('cookiesPage.toc.policyUpdates'), icon: RefreshCw },
    { id: 'contact', title: t('cookiesPage.toc.contactUs'), icon: Mail },
  ];

  const cookieCategories: CookieCategory[] = [
    {
      name: t('cookiesPage.typesOfCookies.categories.essential.name'),
      description: t('cookiesPage.typesOfCookies.categories.essential.description'),
      essential: true,
      examples: t('cookiesPage.typesOfCookies.categories.essential.examples', { returnObjects: true }) as string[],
      retention: t('cookiesPage.typesOfCookies.categories.essential.retention'),
      icon: Shield,
      color: 'from-red-500 to-orange-500',
    },
    {
      name: t('cookiesPage.typesOfCookies.categories.functional.name'),
      description: t('cookiesPage.typesOfCookies.categories.functional.description'),
      essential: false,
      examples: t('cookiesPage.typesOfCookies.categories.functional.examples', { returnObjects: true }) as string[],
      retention: t('cookiesPage.typesOfCookies.categories.functional.retention'),
      icon: Settings,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: t('cookiesPage.typesOfCookies.categories.analytics.name'),
      description: t('cookiesPage.typesOfCookies.categories.analytics.description'),
      essential: false,
      examples: t('cookiesPage.typesOfCookies.categories.analytics.examples', { returnObjects: true }) as string[],
      retention: t('cookiesPage.typesOfCookies.categories.analytics.retention'),
      icon: BarChart3,
      color: 'from-violet-500 to-purple-500',
    },
    {
      name: t('cookiesPage.typesOfCookies.categories.marketing.name'),
      description: t('cookiesPage.typesOfCookies.categories.marketing.description'),
      essential: false,
      examples: t('cookiesPage.typesOfCookies.categories.marketing.examples', { returnObjects: true }) as string[],
      retention: t('cookiesPage.typesOfCookies.categories.marketing.retention'),
      icon: Target,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const thirdPartyCookies = (t('cookiesPage.thirdParty.cookies', { returnObjects: true }) as Array<{ provider: string; purpose: string }>).map(
    (cookie, index) => ({
      ...cookie,
      privacy: [
        'https://policies.google.com/privacy',
        'https://stripe.com/privacy',
        'https://openai.com/privacy',
      ][index],
    })
  );

  useEffect(() => {
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    tableOfContents.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-amber-50/50 via-yellow-50/30 to-background dark:from-amber-950/20 dark:via-yellow-950/10 dark:to-background min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
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
                {t('cookiesPage.breadcrumbHome')}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{t('cookiesPage.breadcrumbCookies')}</span>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full mb-6 border border-amber-200 dark:border-amber-800"
              >
                <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {t('cookiesPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                {t('cookiesPage.title')}{' '}
                <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  {t('cookiesPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('cookiesPage.description')}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                {t('cookiesPage.lastUpdated')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {/* Sidebar - Table of Contents */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-24 bg-card border-2 border-border rounded-2xl p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                    {t('cookiesPage.contents')}
                  </h3>
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                            activeSection === item.id
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.title}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-3 space-y-8"
              >
                {/* What Are Cookies */}
                <section id="what-are-cookies" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                        <Info className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.whatAreCookies.title')}</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        {t('cookiesPage.whatAreCookies.content')}
                      </p>
                      <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm">
                          <strong className="text-foreground">{t('cookiesPage.whatAreCookies.noteLabel')}</strong> {t('cookiesPage.whatAreCookies.note')}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Types of Cookies */}
                <section id="types-of-cookies" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.typesOfCookies.title')}</h2>
                    </div>
                    <div className="space-y-6">
                      {cookieCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <div
                            key={category.name}
                            className="p-6 bg-muted/30 border border-border rounded-xl"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold">{category.name}</h3>
                              </div>
                              <Badge variant={category.essential ? 'destructive' : 'secondary'}>
                                {category.essential ? t('cookiesPage.typesOfCookies.required') : t('cookiesPage.typesOfCookies.optional')}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="font-semibold text-sm mb-2">{t('cookiesPage.typesOfCookies.examples')}</p>
                                <ul className="space-y-1">
                                  {category.examples.map((example) => (
                                    <li key={example} className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      {example}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-semibold text-sm mb-2">{t('cookiesPage.typesOfCookies.retentionPeriod')}</p>
                                <p className="text-sm text-muted-foreground">{category.retention}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* How We Use Cookies */}
                <section id="how-we-use" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.howWeUse.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      {t('cookiesPage.howWeUse.description')}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(t('cookiesPage.howWeUse.items', { returnObjects: true }) as Array<{ title: string; desc: string }>).map((item) => (
                        <div key={item.title} className="p-4 bg-muted/50 rounded-xl">
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Third-Party Cookies */}
                <section id="third-party" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.thirdParty.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      {t('cookiesPage.thirdParty.description')}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-bold">{t('cookiesPage.thirdParty.provider')}</th>
                            <th className="text-left py-3 px-4 font-bold">{t('cookiesPage.thirdParty.purpose')}</th>
                            <th className="text-left py-3 px-4 font-bold">{t('cookiesPage.thirdParty.privacyPolicy')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {thirdPartyCookies.map((cookie) => (
                            <tr key={cookie.provider} className="border-b border-border">
                              <td className="py-3 px-4 font-medium">{cookie.provider}</td>
                              <td className="py-3 px-4 text-muted-foreground">{cookie.purpose}</td>
                              <td className="py-3 px-4">
                                <a
                                  href={cookie.privacy}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-600 hover:underline font-medium"
                                >
                                  {t('cookiesPage.thirdParty.viewPolicy')}
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Managing Cookies */}
                <section id="managing-cookies" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.managingCookies.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      {t('cookiesPage.managingCookies.description')}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {(t('cookiesPage.managingCookies.browsers', { returnObjects: true }) as Array<{ browser: string; path: string }>).map((item) => (
                        <div key={item.browser} className="p-4 bg-muted/50 rounded-xl">
                          <h4 className="font-bold mb-1">{item.browser}</h4>
                          <p className="text-sm text-muted-foreground">{item.path}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl">
                      <p className="text-sm">
                        <strong className="text-yellow-700 dark:text-yellow-400">{t('cookiesPage.managingCookies.warningLabel')}</strong> {t('cookiesPage.managingCookies.warning')}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Cookie Settings */}
                <section id="cookie-settings" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <SlidersHorizontal className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.cookieSettings.title')}</h2>
                    </div>
                    <p className="text-white/90 mb-6">
                      {t('cookiesPage.cookieSettings.description')}
                    </p>
                    <Button size="lg" className="bg-white text-amber-600 hover:bg-white/90 font-bold">
                      {t('cookiesPage.cookieSettings.managePreferences')}
                    </Button>
                  </div>
                </section>

                {/* Policy Updates */}
                <section id="updates" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.policyUpdates.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('cookiesPage.policyUpdates.content')}
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('cookiesPage.contact.title')}</h2>
                    </div>
                    <p className="text-white/90 mb-6">
                      {t('cookiesPage.contact.description')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        size="lg"
                        className="bg-white text-amber-600 hover:bg-white/90 font-bold"
                        asChild
                      >
                        <Link to="/contact">
                          {t('cookiesPage.contact.contactSupport')}
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold"
                        asChild
                      >
                        <a href="mailto:privacy@studyield.com">privacy@studyield.com</a>
                      </Button>
                    </div>
                  </div>
                </section>
              </motion.div>
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
