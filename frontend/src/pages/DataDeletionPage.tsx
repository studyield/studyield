import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Trash2,
  AlertCircle,
  Database,
  Clock,
  Shield,
  CheckCircle,
  FileText,
  MessageSquare,
  BookOpen,
  Brain,
  Image,
  Users,
  Settings,
  BarChart3,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';

const dataTypeIcons = [Users, BookOpen, FileText, MessageSquare, Brain, BarChart3, Image, Settings];

export function DataDeletionPage() {
  const { t } = useTranslation();

  const deletedDataTypes = (
    t('dataDeletionPage.whatGetsDeleted.items', { returnObjects: true }) as Array<{ title: string; description: string }>
  ).map((item, index) => ({
    ...item,
    icon: dataTypeIcons[index],
  }));

  const deletionSteps = t('dataDeletionPage.deletionProcess.steps', { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-red-50/30 via-orange-50/20 to-background min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-red-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400 rounded-full blur-3xl" />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full mb-6 border border-red-200 dark:border-red-800"
              >
                <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {t('dataDeletionPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                {t('dataDeletionPage.title')}{' '}
                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                  {t('dataDeletionPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('dataDeletionPage.description')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 text-white"
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-black mb-3">
                    {t('dataDeletionPage.importantNotice.title')}
                  </h2>
                  <p className="text-white/90 leading-relaxed mb-4">
                    {t('dataDeletionPage.importantNotice.description')}
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t('dataDeletionPage.importantNotice.bullet1')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {t('dataDeletionPage.importantNotice.bullet2')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('dataDeletionPage.importantNotice.bullet3')}
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What Gets Deleted */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                  {t('dataDeletionPage.whatGetsDeleted.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('dataDeletionPage.whatGetsDeleted.subtitle')}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {deletedDataTypes.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-card rounded-xl p-6 border-2 border-border hover:border-red-300 dark:hover:border-red-700 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Deletion Process */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                  {t('dataDeletionPage.deletionProcess.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('dataDeletionPage.deletionProcess.subtitle')}
                </p>
              </motion.div>

              <div className="space-y-8">
                {deletionSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-6 items-start"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-xl">
                      {index + 1}
                    </div>
                    <div className="flex-1 bg-card rounded-xl p-6 border-2 border-border">
                      <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl p-8 border-2 border-border"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground mb-2">
                      {t('dataDeletionPage.timeline.title')}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('dataDeletionPage.timeline.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pl-16">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{t('dataDeletionPage.timeline.immediately')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('dataDeletionPage.timeline.immediatelyDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{t('dataDeletionPage.timeline.within30Days')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('dataDeletionPage.timeline.within30DaysDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{t('dataDeletionPage.timeline.within90Days')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('dataDeletionPage.timeline.within90DaysDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <CTASection />

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-black text-foreground mb-4">
                  {t('dataDeletionPage.contactTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t('dataDeletionPage.contactDescription')}
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="mailto:privacy@studyield.com"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300"
                  >
                    {t('dataDeletionPage.emailPrivacyTeam')}
                  </a>
                  <Link
                    to="/support"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-card hover:bg-muted text-foreground font-semibold rounded-lg border-2 border-border hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
                  >
                    {t('dataDeletionPage.visitHelpCenter')}
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
