import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Shield, RefreshCcw, Lock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { type BillingCycle, SOCIAL_PROOF_COUNT } from '@/config/pricing';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';

const guarantees = [
  { icon: Shield, key: 'moneyBack' },
  { icon: RefreshCcw, key: 'cancelAnytime' },
  { icon: Lock, key: 'securePayment' },
];

export function PricingSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ctaLink = isAuthenticated ? '/dashboard' : '/welcome';
  const [cycle, setCycle] = useState<BillingCycle>('yearly');

  const freeFeatures = [
    { name: t('pricing.features.studySets3'), included: true },
    { name: t('pricing.features.flashcards50'), included: true },
    { name: t('pricing.features.aiRequests10'), included: true },
    { name: t('pricing.features.basicQuizzes'), included: true },
    { name: t('pricing.features.spacedRepetition'), included: true },
    { name: t('pricing.features.clozeImageOcclusion'), included: true },
    { name: t('pricing.features.handwritingOcr'), included: true },
    { name: t('pricing.features.problemSolverBatch'), included: false },
    { name: t('pricing.features.examCloning'), included: false },
    { name: t('pricing.features.teachBack'), included: false },
    { name: t('pricing.features.learningPaths'), included: false },
    { name: t('pricing.features.deepResearch'), included: false },
    { name: t('pricing.features.advancedAnalytics'), included: false },
    { name: t('pricing.features.knowledgeBase'), included: false },
    { name: t('pricing.features.conceptMapsFormula'), included: false },
  ];

  const proFeatures = [
    { name: t('pricing.features.unlimitedStudySets'), included: true },
    { name: t('pricing.features.unlimitedFlashcards'), included: true },
    { name: t('pricing.features.unlimitedAiRequests'), included: true },
    { name: t('pricing.features.allQuizPlusLive'), included: true },
    { name: t('pricing.features.spacedRepetition'), included: true },
    { name: t('pricing.features.clozeImageOcclusion'), included: true },
    { name: t('pricing.features.handwritingOcr'), included: true },
    { name: t('pricing.features.problemSolverBatch'), included: true },
    { name: t('pricing.features.examCloning'), included: true },
    { name: t('pricing.features.teachBack'), included: true },
    { name: t('pricing.features.learningPaths'), included: true },
    { name: t('pricing.features.deepResearch'), included: true },
    { name: t('pricing.features.advancedAnalytics'), included: true },
    { name: t('pricing.features.knowledgeBase'), included: true },
    { name: t('pricing.features.conceptMapsFormula'), included: true },
  ];

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background with gradient orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-50/30 to-background dark:via-purple-950/10" />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/10 to-violet-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.15, 0.25, 0.15], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-fuchsia-400/10 to-purple-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-8 sm:px-12 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              {t('pricingPage.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t('pricingPage.title')}{' '}
              <span className="text-green-500">{t('pricingPage.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('pricingPage.description')}
            </p>
          </motion.div>
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground"
        >
          <Users className="w-4 h-4 text-green-500" />
          <span>{t('pricing.socialProof', { count: SOCIAL_PROOF_COUNT.toLocaleString() })}</span>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex items-center justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <BillingToggle value={cycle} onChange={setCycle} />
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          <PricingCard
            planId="free"
            cycle={cycle}
            features={freeFeatures}
            cta={t('pricing.plans.free.cta')}
            ctaLink={ctaLink}
            index={0}
          />
          <PricingCard
            planId="pro"
            cycle={cycle}
            features={proFeatures}
            cta={t('pricing.plans.pro.cta')}
            ctaLink={ctaLink}
            index={1}
          />
        </div>

        {/* Guarantee badges */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {guarantees.map((g, i) => (
            <motion.div
              key={g.key}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-card border border-border text-sm"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <g.icon className="w-4 h-4 text-green-500 shrink-0" />
              <span className="text-muted-foreground">
                {t(`pricing.guarantees.${g.key}`)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
