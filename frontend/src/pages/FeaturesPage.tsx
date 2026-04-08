import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  Brain,
  FileText,
  MessageSquare,
  Target,
  GraduationCap,
  Sparkles,
  PenTool,
  Route,
  BarChart3,
  Zap,
  Network,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { CTASection } from '@/components/landing';
import { cn } from '@/lib/utils';

const featureCategories = [
  { id: 'all', labelKey: 'featuresFullPage.categories.all' },
  { id: 'study', labelKey: 'featuresFullPage.categories.study' },
  { id: 'ai', labelKey: 'featuresFullPage.categories.ai' },
  { id: 'assessment', labelKey: 'featuresFullPage.categories.assessment' },
  { id: 'tracking', labelKey: 'featuresFullPage.categories.tracking' },
];

const features = [
  {
    id: 'study-sets',
    icon: BookOpen,
    titleKey: 'featuresFullPage.studySets.title',
    subtitleKey: 'featuresFullPage.studySets.subtitle',
    descriptionKey: 'featuresFullPage.studySets.description',
    benefitsKey: 'featuresFullPage.studySets.benefits',
    color: 'from-blue-500 to-blue-600',
    lightColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderColor: 'hover:border-blue-500/30',
    href: '/dashboard/study-sets',
    category: 'study',
    featured: true,
  },
  {
    id: 'flashcards',
    icon: Brain,
    titleKey: 'featuresFullPage.flashcards.title',
    subtitleKey: 'featuresFullPage.flashcards.subtitle',
    descriptionKey: 'featuresFullPage.flashcards.description',
    benefitsKey: 'featuresFullPage.flashcards.benefits',
    color: 'from-purple-500 to-purple-600',
    lightColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    borderColor: 'hover:border-purple-500/30',
    href: '/dashboard/study-sets',
    category: 'study',
    featured: true,
  },
  {
    id: 'chat',
    icon: MessageSquare,
    titleKey: 'featuresFullPage.chat.title',
    subtitleKey: 'featuresFullPage.chat.subtitle',
    descriptionKey: 'featuresFullPage.chat.description',
    benefitsKey: 'featuresFullPage.chat.benefits',
    color: 'from-green-500 to-emerald-600',
    lightColor: 'bg-green-500/10 text-green-600 dark:text-green-400',
    borderColor: 'hover:border-green-500/30',
    href: '/dashboard/chat',
    category: 'ai',
    featured: true,
  },
  {
    id: 'documents',
    icon: FileText,
    titleKey: 'featuresFullPage.documents.title',
    subtitleKey: 'featuresFullPage.documents.subtitle',
    descriptionKey: 'featuresFullPage.documents.description',
    benefitsKey: 'featuresFullPage.documents.benefits',
    color: 'from-orange-500 to-orange-600',
    lightColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    borderColor: 'hover:border-orange-500/30',
    href: '/dashboard/study-sets',
    category: 'ai',
  },
  {
    id: 'quizzes',
    icon: Target,
    titleKey: 'featuresFullPage.quizzes.title',
    subtitleKey: 'featuresFullPage.quizzes.subtitle',
    descriptionKey: 'featuresFullPage.quizzes.description',
    benefitsKey: 'featuresFullPage.quizzes.benefits',
    color: 'from-red-500 to-red-600',
    lightColor: 'bg-red-500/10 text-red-600 dark:text-red-400',
    borderColor: 'hover:border-red-500/30',
    href: '/dashboard/live-quiz',
    category: 'assessment',
  },
  {
    id: 'exam-clone',
    icon: GraduationCap,
    titleKey: 'featuresFullPage.examClone.title',
    subtitleKey: 'featuresFullPage.examClone.subtitle',
    descriptionKey: 'featuresFullPage.examClone.description',
    benefitsKey: 'featuresFullPage.examClone.benefits',
    color: 'from-indigo-500 to-indigo-600',
    lightColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    borderColor: 'hover:border-indigo-500/30',
    href: '/dashboard/exam-clone',
    category: 'assessment',
  },
  {
    id: 'problem-solver',
    icon: Sparkles,
    titleKey: 'featuresFullPage.problemSolver.title',
    subtitleKey: 'featuresFullPage.problemSolver.subtitle',
    descriptionKey: 'featuresFullPage.problemSolver.description',
    benefitsKey: 'featuresFullPage.problemSolver.benefits',
    color: 'from-pink-500 to-pink-600',
    lightColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    borderColor: 'hover:border-pink-500/30',
    href: '/dashboard/problem-solver',
    category: 'ai',
  },
  {
    id: 'handwriting-ocr',
    icon: PenTool,
    titleKey: 'featuresFullPage.handwritingOcr.title',
    subtitleKey: 'featuresFullPage.handwritingOcr.subtitle',
    descriptionKey: 'featuresFullPage.handwritingOcr.description',
    benefitsKey: 'featuresFullPage.handwritingOcr.benefits',
    color: 'from-violet-500 to-violet-600',
    lightColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    borderColor: 'hover:border-violet-500/30',
    href: '/dashboard/study-sets',
    category: 'ai',
  },
  {
    id: 'learning-paths',
    icon: Route,
    titleKey: 'featuresFullPage.learningPaths.title',
    subtitleKey: 'featuresFullPage.learningPaths.subtitle',
    descriptionKey: 'featuresFullPage.learningPaths.description',
    benefitsKey: 'featuresFullPage.learningPaths.benefits',
    color: 'from-teal-500 to-teal-600',
    lightColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    borderColor: 'hover:border-teal-500/30',
    href: '/dashboard/learning-paths',
    category: 'tracking',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    titleKey: 'featuresFullPage.analytics.title',
    subtitleKey: 'featuresFullPage.analytics.subtitle',
    descriptionKey: 'featuresFullPage.analytics.description',
    benefitsKey: 'featuresFullPage.analytics.benefits',
    color: 'from-emerald-500 to-emerald-600',
    lightColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderColor: 'hover:border-emerald-500/30',
    href: '/dashboard/analytics',
    category: 'tracking',
  },
  {
    id: 'teach-back',
    icon: Zap,
    titleKey: 'featuresFullPage.teachBack.title',
    subtitleKey: 'featuresFullPage.teachBack.subtitle',
    descriptionKey: 'featuresFullPage.teachBack.description',
    benefitsKey: 'featuresFullPage.teachBack.benefits',
    color: 'from-yellow-500 to-amber-600',
    lightColor: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    borderColor: 'hover:border-yellow-500/30',
    href: '/dashboard/teach-back',
    category: 'study',
  },
  {
    id: 'concept-maps',
    icon: Network,
    titleKey: 'featuresFullPage.conceptMaps.title',
    subtitleKey: 'featuresFullPage.conceptMaps.subtitle',
    descriptionKey: 'featuresFullPage.conceptMaps.description',
    benefitsKey: 'featuresFullPage.conceptMaps.benefits',
    color: 'from-rose-500 to-rose-600',
    lightColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    borderColor: 'hover:border-rose-500/30',
    href: '/dashboard/study-sets',
    category: 'study',
  },
];

export function FeaturesPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ctaLink = isAuthenticated ? '/dashboard' : '/login';
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const filteredFeatures =
    activeCategory === 'all'
      ? features
      : features.filter((f) => f.category === activeCategory);

  const featuredItems = features.filter((f) => f.featured);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>{t('featuresFullPage.badge')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('featuresFullPage.title')}{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  {t('featuresFullPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                {t('featuresFullPage.description')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25"
                  asChild
                >
                  <Link to={ctaLink}>
                    {t('featuresFullPage.startLearningFree')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                  <Link to="/pricing">
                    {t('featuresFullPage.viewPricing')}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Highlights — Top 3 large cards */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('featuresFullPage.highlightsTitle')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t('featuresFullPage.highlightsDescription')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuredItems.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={feature.href}
                  className={cn(
                    'group block h-full rounded-2xl border border-border/50 bg-card p-6 lg:p-8 transition-all duration-300',
                    'hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1',
                    feature.borderColor,
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5',
                      feature.color,
                    )}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2.5">
                    {(
                      t(feature.benefitsKey, { returnObjects: true }) as string[]
                    ).map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Arrow */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1">
                    {t('featuresFullPage.learnMore')}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Features Grid with Category Filter */}
      <section className="py-12 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('featuresFullPage.allFeaturesTitle')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              {t('featuresFullPage.allFeaturesDescription')}
            </p>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {featureCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    activeCategory === cat.id
                      ? 'bg-green-600 text-white shadow-md shadow-green-500/25'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                  )}
                >
                  {t(cat.labelKey)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            <AnimatePresence mode="popLayout">
              {filteredFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div
                    className={cn(
                      'group rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300',
                      'hover:shadow-lg hover:shadow-black/5',
                      feature.borderColor,
                      expandedFeature === feature.id && 'ring-2 ring-green-500/30',
                    )}
                  >
                    {/* Card Header */}
                    <div className="p-5 pb-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-lg flex items-center justify-center shrink-0',
                            feature.lightColor,
                          )}
                        >
                          <feature.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            {t(feature.titleKey)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t(feature.subtitleKey)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {t(feature.descriptionKey)}
                      </p>
                    </div>

                    {/* Expand/Collapse Benefits */}
                    <div className="border-t border-border/50">
                      <button
                        onClick={() =>
                          setExpandedFeature(
                            expandedFeature === feature.id ? null : feature.id,
                          )
                        }
                        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>{t('featuresFullPage.viewBenefits')}</span>
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform',
                            expandedFeature === feature.id && 'rotate-90',
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {expandedFeature === feature.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <ul className="px-5 pb-4 space-y-2">
                              {(
                                t(feature.benefitsKey, {
                                  returnObjects: true,
                                }) as string[]
                              ).map((benefit) => (
                                <li
                                  key={benefit}
                                  className="flex items-start gap-2.5 text-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground">
                                    {benefit}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="px-5 pb-4">
                              <Link
                                to={feature.href}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
                              >
                                {t('featuresFullPage.tryItNow')}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center"
          >
            {[
              { value: '12+', labelKey: 'featuresFullPage.stats.features' },
              { value: '3', labelKey: 'featuresFullPage.stats.cardTypes' },
              { value: '24/7', labelKey: 'featuresFullPage.stats.aiAvailable' },
              { value: '6+', labelKey: 'featuresFullPage.stats.fileFormats' },
            ].map((stat, index) => (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(stat.labelKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <CTASection />
    </PublicLayout>
  );
}
