import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscription';
import type { UsageData } from '@/services/subscription';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Layers,
  HardDrive,
  Infinity as InfinityIcon,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';

const featureConfig: Record<string, { labelKey: string; icon: typeof Sparkles; color: string; unitKey: string }> = {
  ai_requests: { labelKey: 'usagePage.aiRequests', icon: Sparkles, color: 'purple', unitKey: 'usagePage.requests' },
  study_sets: { labelKey: 'usagePage.studySets', icon: BookOpen, color: 'green', unitKey: 'usagePage.sets' },
  flashcards: { labelKey: 'usagePage.flashcards', icon: Layers, color: 'blue', unitKey: 'usagePage.cards' },
  storage_bytes: { labelKey: 'usagePage.storage', icon: HardDrive, color: 'amber', unitKey: 'MB' },
};

const planLimits: Record<string, Record<string, number>> = {
  free: { ai_requests: 10, study_sets: 3, flashcards: 50, storage_bytes: 50 },
  pro: { ai_requests: -1, study_sets: -1, flashcards: -1, storage_bytes: 10240 },
};

export function UsagePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPlan = user?.plan || 'free';
  const isPro = currentPlan === 'pro';

  useEffect(() => {
    (async () => {
      try {
        setUsage(await subscriptionService.getUsage());
      } catch {
        // Silently ignore errors
      }
      setLoading(false);
    })();
  }, []);

  // Calculate next reset date (1st of next month)
  const daysUntilReset = React.useMemo(() => {
    const nextReset = new Date();
    nextReset.setDate(1);
    nextReset.setMonth(nextReset.getMonth() + 1);
    return Math.ceil((nextReset.getTime() - Date.now()) / 86400000);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/subscription/manage')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('usagePage.backToSubscription')}
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t('usagePage.title')}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {t('usagePage.plan', { plan: isPro ? 'Pro' : 'Free' })}
              </p>
            </div>
            {!isPro && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4" />
                {t('usagePage.resetsIn', { days: daysUntilReset })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Usage Cards */}
        <div className="space-y-4 mb-6">
          {Object.entries(featureConfig).map(([key, config], i) => {
            const limit = planLimits[currentPlan]?.[key] ?? 0;
            const usageData = usage?.[key];
            const isUnlimited = limit === -1 || (usageData?.remaining === -1);

            // For storage, convert bytes to MB for display
            const isStorage = key === 'storage_bytes';
            const used = isUnlimited ? 0 : (limit - (usageData?.remaining ?? limit));
            const percentage = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
            const isHigh = percentage >= 80;
            const isFull = percentage >= 100;

            const displayUsed = isStorage ? used : used;
            const displayLimit = isStorage ? (isPro ? '10 GB' : '50 MB') : limit;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className="bg-card rounded-xl border border-border p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(`w-10 h-10 rounded-lg bg-${config.color}-500/10 flex items-center justify-center`)}>
                      <config.icon className={cn(`w-5 h-5 text-${config.color}-500`)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t(config.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isUnlimited ? (
                          <span className="flex items-center gap-1">
                            <InfinityIcon className="w-3 h-3" /> {t('usagePage.unlimited')}
                          </span>
                        ) : isStorage ? (
                          t('usagePage.usedOfStorage', { used: displayUsed, limit: displayLimit })
                        ) : (
                          t('usagePage.usedOf', { used: displayUsed, limit: displayLimit, unit: t(config.unitKey) })
                        )}
                      </p>
                    </div>
                  </div>
                  {!isUnlimited && (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      isFull ? 'bg-red-500/10 text-red-500' :
                      isHigh ? 'bg-amber-500/10 text-amber-500' :
                      'bg-green-500/10 text-green-500'
                    )}>
                      {Math.round(percentage)}%
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {!isUnlimited && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                      className={cn(
                        'h-full rounded-full',
                        isFull ? 'bg-red-500' :
                        isHigh ? 'bg-amber-500' :
                        `bg-${config.color}-500`
                      )}
                    />
                  </div>
                )}

                {isUnlimited && (
                  <div className="h-2 bg-gradient-to-r from-green-500/20 via-green-500/40 to-green-500/20 rounded-full" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade CTA for free users */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl border border-green-500/20 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">{t('usagePage.needMore')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('usagePage.upgradeDescription')}
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard/subscription')}>
                {t('usagePage.upgrade')}
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UsagePage;
