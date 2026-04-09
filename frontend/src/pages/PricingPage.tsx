import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Sparkles,
  Clock,
  Crown,
  ArrowRight,
  Shield,
  CreditCard,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Users,
  Zap,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type BillingCycle,
  type PlanId,
  PRICING,
  SOCIAL_PROOF_COUNT,
  getPrice,
} from '@/config/pricing';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { CTASection } from '@/components/landing';

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-border last:border-0"
    >
      <motion.button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between py-6 text-left group",
          isOpen && "pb-4"
        )}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <span className={cn(
          "font-semibold pr-4 transition-colors text-lg",
          isOpen ? "text-primary" : "group-hover:text-primary"
        )}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
            isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface PlanCardConfig {
  planId: PlanId;
  icon: typeof Zap;
  color: string;
  ctaVariant: 'default' | 'outline';
  ctaLink: string;
}

const planCards: PlanCardConfig[] = [
  { planId: 'free', icon: Clock, color: 'from-blue-500 to-indigo-500', ctaVariant: 'outline', ctaLink: '/register' },
  { planId: 'pro', icon: Crown, color: 'from-green-500 to-emerald-500', ctaVariant: 'default', ctaLink: '/register' },
];

const featureKeys: Record<PlanId, string[]> = {
  free: [
    'studySets3', 'flashcards50', 'aiRequests10', 'basicQuizzes',
    'spacedRepetition', 'clozeImageOcclusion', 'handwritingOcr',
    'problemSolverBatch', 'examCloning', 'teachBack',
    'learningPaths', 'deepResearch', 'advancedAnalytics',
    'knowledgeBase', 'conceptMapsFormula',
  ],
  pro: [
    'unlimitedStudySets', 'unlimitedFlashcards', 'unlimitedAiRequests',
    'allQuizPlusLive', 'spacedRepetition', 'clozeImageOcclusion',
    'handwritingOcr', 'problemSolverBatch', 'examCloning', 'teachBack',
    'learningPaths', 'deepResearch', 'advancedAnalytics',
    'knowledgeBase', 'conceptMapsFormula',
  ],
};

const includedCounts: Record<PlanId, number> = { free: 7, pro: 15 };

export function PricingPage() {
  const { isAuthenticated } = useAuth();
  const ctaLink = isAuthenticated ? '/dashboard' : '/login';
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { t } = useTranslation();

  const guarantees = [
    {
      icon: Shield,
      title: t('pricing.guarantees.freePlanForever'),
      description: t('pricing.guarantees.freePlanForeverDesc'),
    },
    {
      icon: CreditCard,
      title: t('pricing.guarantees.securePayments'),
      description: t('pricing.guarantees.securePaymentsDesc'),
    },
    {
      icon: RefreshCw,
      title: t('pricing.guarantees.cancelAnytimeTitle'),
      description: t('pricing.guarantees.cancelAnytimeDesc'),
    },
  ];

  const faqs = [
    { question: t('pricingFullPage.faqs.q1'), answer: t('pricingFullPage.faqs.a1') },
    { question: t('pricingFullPage.faqs.q2'), answer: t('pricingFullPage.faqs.a2') },
    { question: t('pricingFullPage.faqs.q3'), answer: t('pricingFullPage.faqs.a3') },
    { question: t('pricingFullPage.faqs.q4'), answer: t('pricingFullPage.faqs.a4') },
    { question: t('pricingFullPage.faqs.q5'), answer: t('pricingFullPage.faqs.a5') },
    { question: t('pricingFullPage.faqs.q6'), answer: t('pricingFullPage.faqs.a6') },
    { question: t('pricingFullPage.faqs.q7'), answer: t('pricingFullPage.faqs.a7') },
    { question: t('pricingFullPage.faqs.q8'), answer: t('pricingFullPage.faqs.a8') },
  ];

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-green-50/50 via-emerald-50/30 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-20 w-72 h-72 bg-green-400/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl"
            />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mb-6 border border-green-200 dark:border-green-800"
              >
                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {t('pricingFullPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                {t('pricingFullPage.title')}{' '}
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('pricingFullPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6">
                {t('pricingFullPage.description')}
              </p>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Users className="w-4 h-4 text-green-500" />
                <span>{t('pricing.socialProof', { count: SOCIAL_PROOF_COUNT })}</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <BillingToggle value={cycle} onChange={setCycle} />
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {planCards.map((card, index) => {
                const Icon = card.icon;
                const plan = PRICING[card.planId];
                const price = getPrice(card.planId, cycle);
                const isMonthly = cycle === 'monthly';
                const features = featureKeys[card.planId].map((key, i) => ({
                  name: t(`pricing.features.${key}`),
                  included: i < includedCounts[card.planId],
                }));

                return (
                  <motion.div
                    key={card.planId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: plan.popular ? -8 : -4 }}
                    className={cn(
                      'relative bg-card border-2 rounded-2xl p-8',
                      plan.popular
                        ? 'border-primary shadow-2xl shadow-primary/20 scale-105 z-10'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    {plan.popular && (
                      <motion.div
                        className="absolute -top-4 left-1/2 -translate-x-1/2"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
                      >
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
                          <Sparkles className="w-4 h-4" />
                          {t('pricing.mostPopular')}
                        </span>
                      </motion.div>
                    )}

                    {plan.popular && (
                      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-20 blur-sm -z-10" />
                    )}

                    <div className="mb-6">
                      <motion.div
                        className={cn(
                          'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4',
                          card.color
                        )}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-1">{t(`pricing.plans.${card.planId}.name`)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(`pricing.plans.${card.planId}.description`)}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`${price}-${cycle}`}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="text-5xl font-black"
                          >
                            ${price}
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-muted-foreground font-medium">
                          {isMonthly ? t('pricing.perMonth') : t('pricing.perYear')}
                        </span>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className={cn(
                          'w-full mb-6 h-12 font-bold',
                          plan.popular &&
                            'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        )}
                        variant={card.ctaVariant}
                        asChild
                      >
                        <Link to={ctaLink}>
                          {t(`pricing.plans.${card.planId}.cta`)}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </motion.div>

                    <ul className="space-y-3">
                      {features.map((feature, i) => (
                        <motion.li
                          key={feature.name}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.03 }}
                        >
                          {feature.included ? (
                            <motion.div
                              className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                              whileHover={{ scale: 1.2 }}
                            >
                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </motion.div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                              <X className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <span
                            className={cn(
                              'text-sm',
                              !feature.included && 'text-muted-foreground'
                            )}
                          >
                            {feature.name}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Guarantees */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {guarantees.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -4 }}
                      className="bg-card rounded-xl p-6 border-2 border-border text-center hover:border-primary/30 transition-colors"
                    >
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <HelpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    {t('pricingFullPage.faqBadge')}
                  </span>
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                  {t('pricingFullPage.faqTitle')}{' '}
                  <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('pricingFullPage.faqTitleHighlight')}
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t('pricingFullPage.faqDescription')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-card/80 backdrop-blur-sm border-2 border-border rounded-2xl p-6 lg:p-8 shadow-lg"
              >
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={faq.question}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaqIndex === index}
                    onClick={() =>
                      setOpenFaqIndex(openFaqIndex === index ? null : index)
                    }
                    index={index}
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
