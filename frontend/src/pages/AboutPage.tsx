import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Heart,
  Lightbulb,
  GraduationCap,
  Handshake,
  BookOpen,
  Brain,
  Sparkles,
  Zap,
  Users,
  Globe,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';

export function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Target,
      title: t('about.values.missionDriven'),
      description: t('about.values.missionDrivenDesc'),
      color: 'from-red-500 to-orange-500',
      bg: 'bg-red-500/10',
      textColor: 'text-red-500',
    },
    {
      icon: Heart,
      title: t('about.values.userCentric'),
      description: t('about.values.userCentricDesc'),
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-500/10',
      textColor: 'text-pink-500',
    },
    {
      icon: Lightbulb,
      title: t('about.values.innovationFirst'),
      description: t('about.values.innovationFirstDesc'),
      color: 'from-yellow-500 to-amber-500',
      bg: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
    },
    {
      icon: Handshake,
      title: t('about.values.communityFocused'),
      description: t('about.values.communityFocusedDesc'),
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      textColor: 'text-blue-500',
    },
  ];

  const features = [
    { icon: BookOpen, label: t('about.features.studySets'), color: 'text-blue-500' },
    { icon: Brain, label: t('about.features.aiChat'), color: 'text-green-500' },
    { icon: Sparkles, label: t('about.features.problemSolver'), color: 'text-orange-500' },
    { icon: Zap, label: t('about.features.spacedRepetition'), color: 'text-purple-500' },
    { icon: Users, label: t('about.features.liveQuiz'), color: 'text-pink-500' },
    { icon: Globe, label: t('about.features.examClone'), color: 'text-indigo-500' },
  ];

  const stats = [
    { value: t('about.stats.featuresCount'), label: t('about.stats.featuresLabel') },
    { value: t('about.stats.aiModels'), label: t('about.stats.aiModelsLabel') },
    { value: t('about.stats.languages'), label: t('about.stats.languagesLabel') },
    { value: t('about.stats.uptime'), label: t('about.stats.uptimeLabel') },
  ];

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-green-50/50 via-emerald-50/30 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background">
        {/* Hero */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mb-6 border border-green-200 dark:border-green-800"
                >
                  <GraduationCap className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {t('about.badge')}
                  </span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                  {t('about.title')}{' '}
                  <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('about.titleHighlight')}
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t('about.description')}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card border-2 border-border rounded-2xl p-6 text-center hover:border-green-300 dark:hover:border-green-700 transition-colors"
                >
                  <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-black mb-6">{t('about.ourStory')}</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{t('about.storyP1')}</p>
                  <p>{t('about.storyP2')}</p>
                  <p>{t('about.storyP3')}</p>
                </div>
              </motion.div>

              {/* What We Offer */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card border-2 border-border rounded-2xl p-8"
              >
                <h3 className="text-xl font-black mb-6">{t('about.whatWeOffer')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <feature.icon className={`w-5 h-5 ${feature.color} shrink-0`} />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  {t('about.ourValues')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('about.valuesDescription')}
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card border-2 border-border rounded-2xl p-6 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
