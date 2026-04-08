import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, Crown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type BillingCycle,
  type PlanId,
  PRICING,
  getPrice,
} from '@/config/pricing';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingCardProps {
  planId: PlanId;
  cycle: BillingCycle;
  features: PlanFeature[];
  cta: string;
  ctaLink: string;
  index: number;
}

export function PricingCard({
  planId,
  cycle,
  features,
  cta,
  ctaLink,
  index,
}: PricingCardProps) {
  const { t } = useTranslation();
  const plan = PRICING[planId];
  const price = getPrice(planId, cycle);
  const isMonthly = cycle === 'monthly';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        'relative bg-card rounded-2xl p-6 lg:p-8 h-full flex flex-col',
        plan.popular
          ? 'border-2 border-green-500 shadow-lg'
          : planId === 'free'
            ? 'border-2 border-blue-500/50 shadow-md'
            : 'border border-border'
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <motion.span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium shadow-lg shadow-green-500/25"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-3 h-3" />
            {t('pricing.mostPopular')}
            <Sparkles className="w-3 h-3" />
          </motion.span>
        </div>
      )}

      {/* Trial badge */}
      {planId === 'free' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium shadow-lg shadow-blue-500/25">
            <Clock className="w-3 h-3" />
            {t('pricing.trialBadge', { defaultValue: '7 Days Free' })}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">
          {t(`pricing.plans.${planId}.name`)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(`pricing.plans.${planId}.description`)}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${price}-${cycle}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-4xl lg:text-5xl font-bold"
            >
              ${price}
            </motion.span>
          </AnimatePresence>
          <span className="text-muted-foreground">
            {isMonthly ? t('pricing.perMonth') : t('pricing.perYear')}
          </span>
        </div>

        {/* Trial note */}
        {price === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('pricing.freeForever')}
          </p>
        )}

        {/* Trial expiry note */}
        {planId === 'free' && (
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 font-medium">
            {t('pricing.trialNote', { defaultValue: 'No credit card required' })}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        className={cn(
          'w-full mb-6 h-11',
          plan.popular
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : ''
        )}
        variant={plan.popular ? 'default' : 'outline'}
        asChild
      >
        <Link to={ctaLink}>{cta}</Link>
      </Button>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {features.map((feature) => (
          <li key={feature.name} className="flex items-center gap-3">
            {feature.included ? (
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-500" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
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
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
