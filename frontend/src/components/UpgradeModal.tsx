import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BillingCycle,
  PRICING,
  getPrice,
} from '@/config/pricing';

interface UpgradeModalProps {
  open?: boolean;
  onClose?: () => void;
  feature?: string;
  message?: string;
}

const FEATURE_LABELS: Record<string, string> = {
  problem_solver: 'Problem Solver',
  exam_clone: 'Exam Clone',
  knowledge_base: 'Knowledge Base',
  teach_back: 'Teach-Back',
  learning_paths: 'Learning Paths',
  deep_research: 'Deep Research',
  live_quiz: 'Live Quiz',
  advanced_analytics: 'Advanced Analytics',
  concept_maps: 'Concept Maps',
};

const cycles: BillingCycle[] = ['monthly', 'yearly'];

export function UpgradeModal({ open: controlledOpen, onClose: controlledOnClose, feature: controlledFeature, message: controlledMessage }: UpgradeModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('yearly');
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoFeature, setAutoFeature] = useState<string | undefined>();
  const [autoMessage, setAutoMessage] = useState<string | undefined>();

  const handleUpgradeEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    setAutoFeature(detail?.feature);
    setAutoMessage(detail?.message);
    setAutoOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener('plan:upgrade-required', handleUpgradeEvent);
    return () => window.removeEventListener('plan:upgrade-required', handleUpgradeEvent);
  }, [handleUpgradeEvent]);

  const open = controlledOpen ?? autoOpen;
  const feature = controlledFeature ?? autoFeature;
  const message = controlledMessage ?? autoMessage;
  const onClose = controlledOnClose ?? (() => setAutoOpen(false));
  const featureLabel = feature ? (FEATURE_LABELS[feature] || feature.replace(/_/g, ' ')) : undefined;

  const price = getPrice('pro', selectedCycle);
  const isMonthly = selectedCycle === 'monthly';
  const isYearly = selectedCycle === 'yearly';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/5 to-transparent rounded-bl-full" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-green-500" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold mb-2">
              {featureLabel ? t('upgradeModal.unlockFeature', { feature: featureLabel }) : t('upgradeModal.upgradePlan')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {message || t('upgradeModal.reachedLimit')}
            </p>

            {/* Pro Card with billing options */}
            <div className="border-2 border-green-500/30 bg-green-500/5 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('pricing.plans.pro.name')}</p>
                  <p className="text-xs text-muted-foreground">{t('pricing.plans.pro.description')}</p>
                </div>
              </div>

              {/* Billing cycle selector */}
              <div className="flex gap-2 mb-3">
                {cycles.map((cycle) => {
                  const cyclePrice = getPrice('pro', cycle);
                  return (
                    <button
                      key={cycle}
                      onClick={() => setSelectedCycle(cycle)}
                      className={cn(
                        'flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors border',
                        selectedCycle === cycle
                          ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'border-border hover:border-green-500/30'
                      )}
                    >
                      <div>{t(`pricing.billingToggle.${cycle}`)}</div>
                      <div className="font-bold">${cyclePrice}{cycle === 'monthly' ? t('pricing.perMonth') : t('pricing.perYear')}</div>
                    </button>
                  );
                })}
              </div>

              {/* Price display */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold">${price}</span>
                <span className="text-sm text-muted-foreground">
                  {isMonthly ? t('pricing.perMonth') : t('pricing.perYear')}
                </span>
              </div>
            </div>

            {/* Upgrade button */}
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white mb-3"
              onClick={() => {
                onClose();
                navigate('/dashboard/subscription/checkout', {
                  state: {
                    plan: 'pro',
                    billingCycle: selectedCycle,
                    price: selectedCycle === 'monthly'
                      ? PRICING.pro.pricing.monthly
                      : PRICING.pro.pricing.yearly,
                  }
                });
              }}
            >
              {t('pricing.subscriptionPage.upgradeTo', { plan: t('pricing.plans.pro.name') })}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {/* Compare link */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                onClose();
                navigate('/dashboard/subscription');
              }}
            >
              {t('upgradeModal.comparePlans')}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
