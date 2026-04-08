import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  MessageSquare,
  FileText,
  ChevronRight,
  HelpCircle,
  Zap,
  CreditCard,
  Shield,
  Users,
  Settings,
  ChevronDown,
  Sparkles,
  Clock,
  CheckCircle2,
  Lightbulb,
  Brain,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-semibold pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SupportPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const categories = [
    {
      icon: Zap,
      title: t('supportPage.categories.gettingStarted'),
      description: t('supportPage.categories.gettingStartedDesc'),
      href: '/faq',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: BookOpen,
      title: t('supportPage.categories.studySets'),
      description: t('supportPage.categories.studySetsDesc'),
      href: '/faq',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: FileText,
      title: t('supportPage.categories.documents'),
      description: t('supportPage.categories.documentsDesc'),
      href: '/faq',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Brain,
      title: t('supportPage.categories.aiFeatures'),
      description: t('supportPage.categories.aiFeaturesDesc'),
      href: '/faq',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: CreditCard,
      title: t('supportPage.categories.billing'),
      description: t('supportPage.categories.billingDesc'),
      href: '/faq',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Shield,
      title: t('supportPage.categories.security'),
      description: t('supportPage.categories.securityDesc'),
      href: '/faq',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: Users,
      title: t('supportPage.categories.collaboration'),
      description: t('supportPage.categories.collaborationDesc'),
      href: '/faq',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: Settings,
      title: t('supportPage.categories.account'),
      description: t('supportPage.categories.accountDesc'),
      href: '/faq',
      color: 'from-gray-500 to-slate-600',
    },
  ];

  const popularArticles = [
    {
      title: t('supportPage.popularArticles.createStudySet'),
      category: t('supportPage.popularArticles.createStudySetCategory'),
      href: '/faq',
      icon: Zap,
    },
    {
      title: t('supportPage.popularArticles.spacedRepetition'),
      category: t('supportPage.popularArticles.spacedRepetitionCategory'),
      href: '/faq',
      icon: BookOpen,
    },
    {
      title: t('supportPage.popularArticles.uploadDocuments'),
      category: t('supportPage.popularArticles.uploadDocumentsCategory'),
      href: '/faq',
      icon: FileText,
    },
    {
      title: t('supportPage.popularArticles.generateQuizzes'),
      category: t('supportPage.popularArticles.generateQuizzesCategory'),
      href: '/faq',
      icon: Brain,
    },
    {
      title: t('supportPage.popularArticles.upgradePlan'),
      category: t('supportPage.popularArticles.upgradePlanCategory'),
      href: '/faq',
      icon: CreditCard,
    },
    {
      title: t('supportPage.popularArticles.shareStudySets'),
      category: t('supportPage.popularArticles.shareStudySetsCategory'),
      href: '/faq',
      icon: Users,
    },
  ];

  const faqs = [
    {
      question: t('supportPage.faqs.q1'),
      answer: t('supportPage.faqs.a1'),
    },
    {
      question: t('supportPage.faqs.q2'),
      answer: t('supportPage.faqs.a2'),
    },
    {
      question: t('supportPage.faqs.q3'),
      answer: t('supportPage.faqs.a3'),
    },
    {
      question: t('supportPage.faqs.q4'),
      answer: t('supportPage.faqs.a4'),
    },
    {
      question: t('supportPage.faqs.q5'),
      answer: t('supportPage.faqs.a5'),
    },
    {
      question: t('supportPage.faqs.q6'),
      answer: t('supportPage.faqs.a6'),
    },
    {
      question: t('supportPage.faqs.q7'),
      answer: t('supportPage.faqs.a7'),
    },
    {
      question: t('supportPage.faqs.q8'),
      answer: t('supportPage.faqs.a8'),
    },
  ];

  const quickStats = [
    { icon: Clock, value: t('supportPage.stats.responseTime'), label: t('supportPage.stats.responseTimeLabel') },
    { icon: CheckCircle2, value: t('supportPage.stats.resolutionRate'), label: t('supportPage.stats.resolutionRateLabel') },
    { icon: Lightbulb, value: t('supportPage.stats.helpArticles'), label: t('supportPage.stats.helpArticlesLabel') },
  ];

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-emerald-50/50 via-teal-50/30 to-background dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-background">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full mb-6 border border-emerald-200 dark:border-emerald-800"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {t('supportPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                {t('supportPage.title')}{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {t('supportPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
                {t('supportPage.description')}
              </p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-2xl mx-auto"
              >
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t('supportPage.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-16 text-lg rounded-2xl border-2 border-border focus:border-emerald-500 shadow-lg"
                  />
                  <Button
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold"
                  >
                    {t('supportPage.search')}
                  </Button>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-8 mt-10"
              >
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                {t('supportPage.browseBy')}{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('supportPage.category')}
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('supportPage.categorySubtitle')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.href}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      to={category.href}
                      className="block bg-card border-2 border-border rounded-2xl p-6 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all h-full group"
                    >
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{category.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-end">
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {t('supportPage.popularBadge')}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                {t('supportPage.popularTitle')}{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('supportPage.popularTitleHighlight')}
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('supportPage.popularSubtitle')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {popularArticles.map((article, index) => {
                const Icon = article.icon;
                return (
                  <motion.div
                    key={article.href}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      to={article.href}
                      className="flex items-center gap-4 bg-card border-2 border-border rounded-xl p-5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {article.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {article.category}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                  <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {t('supportPage.faqBadge')}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                  {t('supportPage.faqTitle')}{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('supportPage.faqTitleHighlight')}
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('supportPage.faqSubtitle')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-card border-2 border-border rounded-2xl p-6 lg:p-8"
              >
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaqIndex === index}
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
