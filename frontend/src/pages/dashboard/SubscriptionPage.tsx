import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Shield,
  ArrowRight,
  Star,
  Clock,
} from 'lucide-react';
import {
  type BillingCycle,
  type PlanId,
  PRICING,
  getPrice,
} from '@/config/pricing';
import { BillingToggle } from '@/components/pricing/BillingToggle';

interface PlanFeature {
  key: string;
  included: boolean;
}

interface PlanCardDef {
  id: PlanId;
  icon: typeof Clock;
  color: string;
  features: PlanFeature[];
}

const planDefs: PlanCardDef[] = [
  {
    id: 'free',
    icon: Clock,
    color: 'blue',
    features: [
      { key: 'studySets3', included: true },
      { key: 'flashcards50', included: true },
      { key: 'aiRequests10', included: true },
      { key: 'basicQuizzes', included: true },
      { key: 'spacedRepetition', included: true },
      { key: 'clozeImageOcclusion', included: true },
      { key: 'handwritingOcr', included: true },
      { key: 'problemSolverBatch', included: false },
      { key: 'examCloning', included: false },
      { key: 'teachBack', included: false },
      { key: 'learningPaths', included: false },
      { key: 'deepResearch', included: false },
      { key: 'advancedAnalytics', included: false },
      { key: 'knowledgeBase', included: false },
      { key: 'conceptMapsFormula', included: false },
    ],
  },
  {
    id: 'pro',
    icon: Crown,
    color: 'green',
    features: [
      { key: 'unlimitedStudySets', included: true },
      { key: 'unlimitedFlashcards', included: true },
      { key: 'unlimitedAiRequests', included: true },
      { key: 'allQuizPlusLive', included: true },
      { key: 'spacedRepetition', included: true },
      { key: 'clozeImageOcclusion', included: true },
      { key: 'handwritingOcr', included: true },
      { key: 'problemSolverBatch', included: true },
      { key: 'examCloning', included: true },
      { key: 'teachBack', included: true },
      { key: 'learningPaths', included: true },
      { key: 'deepResearch', included: true },
      { key: 'advancedAnalytics', included: true },
      { key: 'knowledgeBase', included: true },
      { key: 'conceptMapsFormula', included: true },
    ],
  },
];

function getColorClasses(color: string) {
  switch (color) {
    case 'green':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        border: 'border-green-500',
        gradient: 'from-green-500 to-emerald-600',
      };
    case 'blue':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500',
        gradient: 'from-blue-500 to-indigo-600',
      };
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
        gradient: 'from-gray-500 to-gray-600',
      };
  }
}

export function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const currentPlan = user?.plan || 'free';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 rounded-full text-sm font-medium text-green-600 mb-4">
            <Sparkles className="w-4 h-4" />
            {t('subscription.changePlan')}
          </div>
          <h1 className="text-3xl font-bold mb-3">
            {t('pricing.subscriptionPage.title')}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('pricing.subscriptionPage.description')}
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <BillingToggle value={billingCycle} onChange={setBillingCycle} />
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          {planDefs.map((def, i) => {
            const colors = getColorClasses(def.color);
            const plan = PRICING[def.id];
            const userCycle = user?.billingCycle;
            const isCurrent = (currentPlan === 'free' && def.id === 'free') ||
              (currentPlan === 'pro' && def.id === 'pro' && userCycle === billingCycle);
            const price = getPrice(def.id, billingCycle);
            const isMonthly = billingCycle === 'monthly';

            return (
              <motion.div
                key={def.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={cn(
                  'relative bg-card rounded-2xl border p-6 flex flex-col',
                  plan.popular ? `border-2 ${colors.border} shadow-lg` : 'border-border',
                  isCurrent && 'ring-2 ring-green-500/30'
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className={cn('absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r', colors.gradient)}>
                    {t('pricing.mostPopular')}
                  </div>
                )}

                {/* Current Badge */}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-green-500">
                    {t('pricing.subscriptionPage.currentPlan')}
                  </div>
                )}

                {/* Plan Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors.bg)}>
                    <def.icon className={cn('w-5 h-5', colors.text)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {t(`pricing.plans.${def.id}.name`)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t(`pricing.plans.${def.id}.description`)}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {isMonthly ? t('pricing.perMonth') : t('pricing.perYear')}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {def.features.map((feature) => (
                    <li key={feature.key} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check className={cn('w-4 h-4 mt-0.5 shrink-0', def.id === 'free' ? 'text-muted-foreground' : colors.text)} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={cn('text-sm', !feature.included && 'text-muted-foreground')}>{t(`pricing.features.${feature.key}`)}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/dashboard/subscription/manage')}
                  >
                    {t('subscription.manage')}
                  </Button>
                ) : def.id === 'free' ? (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                    {t('pricing.subscriptionPage.freeForever')}
                  </Button>
                ) : (
                  <Button
                    className={cn('w-full', plan.popular && 'bg-gradient-to-r text-white hover:opacity-90', plan.popular && colors.gradient)}
                    onClick={() => navigate('/dashboard/subscription/checkout', {
                      state: {
                        plan: def.id,
                        billingCycle,
                        price: billingCycle === 'monthly'
                          ? plan.pricing.monthly
                          : plan.pricing.yearly,
                      }
                    })}
                  >
                    {t('pricing.subscriptionPage.upgradeTo', { plan: t(`pricing.plans.${def.id}.name`) })}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-4 mt-6"
        >
          {[
            {
              icon: Shield,
              label: t('pricing.subscriptionPage.trustBadges.securePayment'),
              desc: t('pricing.subscriptionPage.trustBadges.securePaymentDesc'),
            },
            {
              icon: Star,
              label: t('pricing.subscriptionPage.trustBadges.cancelAnytime'),
              desc: t('pricing.subscriptionPage.trustBadges.cancelAnytimeDesc'),
            },
            {
              icon: Infinity,
              label: t('pricing.subscriptionPage.trustBadges.freeForever'),
              desc: t('pricing.subscriptionPage.trustBadges.freeForeverDesc'),
            },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <badge.icon className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default SubscriptionPage;
