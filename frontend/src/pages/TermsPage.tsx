import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ChevronRight,
  CheckCircle,
  Briefcase,
  UserCog,
  ShieldAlert,
  FileCheck,
  CreditCard,
  Brain,
  AlertTriangle,
  Server,
  XCircle,
  RefreshCw,
  Scale,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Button } from '@/components/ui/button';

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: React.ElementType;
}

export function TermsPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('acceptance');

  const tableOfContents: TableOfContentsItem[] = [
    { id: 'acceptance', title: t('termsPage.toc.acceptance'), icon: CheckCircle },
    { id: 'description', title: t('termsPage.toc.description'), icon: Briefcase },
    { id: 'user-accounts', title: t('termsPage.toc.userAccounts'), icon: UserCog },
    { id: 'acceptable-use', title: t('termsPage.toc.acceptableUse'), icon: ShieldAlert },
    { id: 'content-ownership', title: t('termsPage.toc.contentOwnership'), icon: FileCheck },
    { id: 'subscription', title: t('termsPage.toc.subscription'), icon: CreditCard },
    { id: 'ai-disclaimer', title: t('termsPage.toc.aiDisclaimer'), icon: Brain },
    { id: 'liability', title: t('termsPage.toc.liability'), icon: AlertTriangle },
    { id: 'availability', title: t('termsPage.toc.availability'), icon: Server },
    { id: 'termination', title: t('termsPage.toc.termination'), icon: XCircle },
    { id: 'changes', title: t('termsPage.toc.changes'), icon: RefreshCw },
    { id: 'governing-law', title: t('termsPage.toc.governingLaw'), icon: Scale },
    { id: 'contact', title: t('termsPage.toc.contact'), icon: Mail },
  ];

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
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-background dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-background min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
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
                {t('termsPage.breadcrumbHome')}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{t('termsPage.breadcrumbTerms')}</span>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full mb-6 border border-blue-200 dark:border-blue-800"
              >
                <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {t('termsPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                {t('termsPage.title')}{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {t('termsPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('termsPage.description')}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                {t('termsPage.lastUpdated')}
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
                    {t('termsPage.contents')}
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
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
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
                {/* Acceptance of Terms */}
                <section id="acceptance" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.acceptance.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('termsPage.acceptance.content')}
                    </p>
                  </div>
                </section>

                {/* Description of Service */}
                <section id="description" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.descriptionOfService.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {t('termsPage.descriptionOfService.intro')}
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {(t('termsPage.descriptionOfService.items', { returnObjects: true }) as string[]).map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* User Accounts */}
                <section id="user-accounts" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <UserCog className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.userAccounts.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {t('termsPage.userAccounts.intro')}
                    </p>
                    <div className="space-y-3">
                      {(t('termsPage.userAccounts.items', { returnObjects: true }) as string[]).map((item, index) => (
                        <div key={item} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Acceptable Use */}
                <section id="acceptable-use" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.acceptableUse.title')}</h2>
                    </div>
                    <p className="text-white/90 mb-4">{t('termsPage.acceptableUse.intro')}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {(t('termsPage.acceptableUse.items', { returnObjects: true }) as string[]).map((item) => (
                        <div key={item} className="flex items-start gap-3 p-3 bg-white/10 rounded-xl">
                          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Content Ownership */}
                <section id="content-ownership" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.contentOwnership.title')}</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h3 className="font-bold mb-2">{t('termsPage.contentOwnership.yourContent')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('termsPage.contentOwnership.yourContentDesc')}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl">
                        <h3 className="font-bold mb-2">{t('termsPage.contentOwnership.aiGenerated')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('termsPage.contentOwnership.aiGeneratedDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Subscription & Payments */}
                <section id="subscription" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.subscription.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {t('termsPage.subscription.intro')}
                    </p>
                    <div className="space-y-3">
                      {(t('termsPage.subscription.items', { returnObjects: true }) as string[]).map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-pink-500" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* AI Disclaimer */}
                <section id="ai-disclaimer" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.aiDisclaimer.title')}</h2>
                    </div>
                    <p className="text-white/90 leading-relaxed">
                      {t('termsPage.aiDisclaimer.content')}
                    </p>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section id="liability" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.liability.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('termsPage.liability.content')}
                    </p>
                  </div>
                </section>

                {/* Service Availability */}
                <section id="availability" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Server className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.availability.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('termsPage.availability.content')}
                    </p>
                  </div>
                </section>

                {/* Termination */}
                <section id="termination" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.termination.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('termsPage.termination.content')}
                    </p>
                  </div>
                </section>

                {/* Changes to Terms */}
                <section id="changes" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.changes.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('termsPage.changes.content')}
                    </p>
                  </div>
                </section>

                {/* Governing Law */}
                <section id="governing-law" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
                        <Scale className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.governingLaw.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('termsPage.governingLaw.content')}
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('termsPage.contact.title')}</h2>
                    </div>
                    <p className="text-white/90 mb-6">
                      {t('termsPage.contact.description')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        size="lg"
                        className="bg-white text-green-600 hover:bg-white/90 font-bold"
                        asChild
                      >
                        <Link to="/contact">
                          {t('termsPage.contact.contactSupport')}
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold"
                        asChild
                      >
                        <a href="mailto:legal@studyield.com">legal@studyield.com</a>
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
