import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  ChevronRight,
  Lock,
  Eye,
  Database,
  Server,
  Brain,
  Clock,
  UserCheck,
  Globe,
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

export function PrivacyPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('introduction');

  const tableOfContents: TableOfContentsItem[] = [
    { id: 'introduction', title: t('privacyPage.toc.introduction'), icon: Shield },
    { id: 'information-collected', title: t('privacyPage.toc.informationCollected'), icon: Database },
    { id: 'how-we-use', title: t('privacyPage.toc.howWeUse'), icon: Eye },
    { id: 'data-security', title: t('privacyPage.toc.dataSecurity'), icon: Lock },
    { id: 'ai-and-data', title: t('privacyPage.toc.aiAndData'), icon: Brain },
    { id: 'data-retention', title: t('privacyPage.toc.dataRetention'), icon: Clock },
    { id: 'your-rights', title: t('privacyPage.toc.yourRights'), icon: UserCheck },
    { id: 'third-party', title: t('privacyPage.toc.thirdParty'), icon: Globe },
    { id: 'contact', title: t('privacyPage.toc.contact'), icon: Mail },
  ];

  const securityMeasures = [
    { icon: Lock, title: t('privacyPage.dataSecurity.encryptionTransit'), desc: t('privacyPage.dataSecurity.encryptionTransitDesc') },
    { icon: Server, title: t('privacyPage.dataSecurity.encryptionRest'), desc: t('privacyPage.dataSecurity.encryptionRestDesc') },
    { icon: Shield, title: t('privacyPage.dataSecurity.securityAudits'), desc: t('privacyPage.dataSecurity.securityAuditsDesc') },
    { icon: UserCheck, title: t('privacyPage.dataSecurity.accessControls'), desc: t('privacyPage.dataSecurity.accessControlsDesc') },
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
  }, [tableOfContents]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-green-50/50 via-emerald-50/30 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
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
                {t('privacyPage.breadcrumbHome')}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{t('privacyPage.breadcrumbPrivacy')}</span>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mb-6 border border-green-200 dark:border-green-800"
              >
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {t('privacyPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                {t('privacyPage.title')}{' '}
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {t('privacyPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('privacyPage.description')}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                {t('privacyPage.lastUpdated')}
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
                    {t('privacyPage.contents')}
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
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold'
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
                {/* Introduction */}
                <section id="introduction" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.introduction.title')}</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        {t('privacyPage.introduction.p1')}
                      </p>
                      <p>
                        {t('privacyPage.introduction.p2')}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Information We Collect */}
                <section id="information-collected" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.informationCollected.title')}</h2>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold mb-3">{t('privacyPage.informationCollected.personalInfo')}</h3>
                        <p className="text-muted-foreground mb-4">
                          {t('privacyPage.informationCollected.personalInfoDesc')}
                        </p>
                        <ul className="grid md:grid-cols-2 gap-3">
                          {(t('privacyPage.informationCollected.personalItems', { returnObjects: true }) as string[]).map((item) => (
                            <li key={item} className="flex items-center gap-2 text-muted-foreground">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-3">{t('privacyPage.informationCollected.studyContent')}</h3>
                        <p className="text-muted-foreground mb-4">{t('privacyPage.informationCollected.studyContentDesc')}</p>
                        <ul className="grid md:grid-cols-2 gap-3">
                          {(t('privacyPage.informationCollected.studyItems', { returnObjects: true }) as string[]).map((item) => (
                            <li key={item} className="flex items-center gap-2 text-muted-foreground">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-3">{t('privacyPage.informationCollected.automaticInfo')}</h3>
                        <p className="text-muted-foreground">
                          {t('privacyPage.informationCollected.automaticInfoDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* How We Use Your Information */}
                <section id="how-we-use" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.howWeUse.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">{t('privacyPage.howWeUse.description')}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(t('privacyPage.howWeUse.items', { returnObjects: true }) as string[]).map((item, index) => (
                        <div key={item} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Data Security */}
                <section id="data-security" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.dataSecurity.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                      {t('privacyPage.dataSecurity.description')}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {securityMeasures.map((item) => (
                        <div key={item.title} className="p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <item.icon className="w-5 h-5 text-red-500" />
                            <span className="font-semibold">{item.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* AI and Your Data */}
                <section id="ai-and-data" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.aiAndData.title')}</h2>
                    </div>
                    <p className="text-white/90 mb-6">
                      {t('privacyPage.aiAndData.description')}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(t('privacyPage.aiAndData.items', { returnObjects: true }) as string[]).map((item) => (
                        <div key={item} className="flex items-start gap-3 p-4 bg-white/10 rounded-xl">
                          <Shield className="w-5 h-5 shrink-0 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Data Retention */}
                <section id="data-retention" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.dataRetention.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('privacyPage.dataRetention.description')}
                    </p>
                  </div>
                </section>

                {/* Your Rights */}
                <section id="your-rights" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.yourRights.title')}</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {t('privacyPage.yourRights.description')}
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {(t('privacyPage.yourRights.items', { returnObjects: true }) as string[]).map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                            <ChevronRight className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Third-Party Services */}
                <section id="third-party" className="scroll-mt-24">
                  <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.thirdParty.title')}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('privacyPage.thirdParty.description')}
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-24">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black">{t('privacyPage.contact.title')}</h2>
                    </div>
                    <p className="text-white/90 mb-6">
                      {t('privacyPage.contact.description')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <Button
                        size="lg"
                        className="bg-white text-green-600 hover:bg-white/90 font-bold"
                        asChild
                      >
                        <Link to="/contact">
                          {t('privacyPage.contact.contactSupport')}
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
