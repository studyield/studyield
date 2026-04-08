import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscription';
import type { Subscription } from '@/services/subscription';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Crown,
  Gift,
  CreditCard,
  Calendar,
  Shield,
  ExternalLink,
  AlertTriangle,
  Receipt,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PlanInfo {
  name: string;
  icon: typeof Crown;
  iconBg: string;
  iconColor: string;
  price: string;
}

function getPlanInfo(plan: string): PlanInfo {
  switch (plan) {
    case 'yearly':
      return {
        name: 'Pro',
        icon: Crown,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        price: '$47.88/yr',
      };
    case 'monthly':
      return {
        name: 'Pro (Monthly)',
        icon: Crown,
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        price: '$7.99/mo',
      };
    default:
      return {
        name: 'Trial',
        icon: Gift,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        price: '7-day free trial',
      };
  }
}

export function ManageSubscriptionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const sub = await subscriptionService.getCurrent();
      setSubscription(sub);
    } catch {
      // Free user, no subscription record yet
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    setError('');
    try {
      await subscriptionService.cancel();
    } catch {
      // Stripe not configured — simulate cancel
    }
    await refreshUser();
    await loadSubscription();
    setShowCancelConfirm(false);
    setCanceling(false);
  };

  const handleManageBilling = async () => {
    try {
      const url = await subscriptionService.createPortal();
      window.location.href = url;
    } catch {
      // Stripe not configured — navigate to billing history instead
      navigate('/dashboard/subscription/billing');
    }
  };

  const planInfo = getPlanInfo(subscription?.plan || user?.plan || 'free');
  const PlanIcon = planInfo.icon;
  const isFree = (subscription?.plan || user?.plan) === 'free';
  const isActive = subscription?.status === 'active' && !subscription.cancelAtPeriodEnd;
  const isCanceling = subscription?.cancelAtPeriodEnd;

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
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('manageSubscriptionPage.backToPlans')}
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-6">{t('manageSubscriptionPage.title')}</h1>
        </motion.div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', planInfo.iconBg)}>
                  <PlanIcon className={cn('w-7 h-7', planInfo.iconColor)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{t('manageSubscriptionPage.plan', { name: planInfo.name })}</h2>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                        {t('manageSubscriptionPage.active')}
                      </span>
                    )}
                    {isCanceling && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-medium rounded-full">
                        {t('manageSubscriptionPage.canceling')}
                      </span>
                    )}
                    {subscription?.status === 'past_due' && (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-medium rounded-full">
                        {t('manageSubscriptionPage.pastDue')}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">{planInfo.price}</p>
                </div>
              </div>
              {!isFree && (
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/subscription')}>
                  {t('manageSubscriptionPage.changePlan')}
                </Button>
              )}
            </div>

            {/* Billing Period */}
            {subscription?.currentPeriodEnd && !isFree && (
              <div className="mt-6 pt-6 border-t border-border grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('manageSubscriptionPage.currentPeriod')}</p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.currentPeriodStart!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' — '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('manageSubscriptionPage.nextBilling')}</p>
                    <p className="text-sm font-medium">
                      {isCanceling
                        ? t('manageSubscriptionPage.noRenewal')
                        : new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isCanceling && (
            <div className="mx-6 mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t('manageSubscriptionPage.subscriptionEnding')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('manageSubscriptionPage.subscriptionEndingDesc', { date: new Date(subscription!.currentPeriodEnd!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        {!isFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden mb-6"
          >
            <button
              onClick={() => navigate('/dashboard/subscription/billing')}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{t('manageSubscriptionPage.billingHistory')}</p>
                  <p className="text-xs text-muted-foreground">{t('manageSubscriptionPage.viewPastInvoices')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={handleManageBilling}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{t('manageSubscriptionPage.paymentMethods')}</p>
                  <p className="text-xs text-muted-foreground">{t('manageSubscriptionPage.updatePaymentMethod')}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </button>

            {!isCanceling && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-500">{t('manageSubscriptionPage.cancelSubscription')}</p>
                    <p className="text-xs text-muted-foreground">{t('manageSubscriptionPage.keepAccessUntilEnd')}</p>
                  </div>
                </div>
              </button>
            )}
          </motion.div>
        )}

        {isFree && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Billing History for free users too */}
            <button
              onClick={() => navigate('/dashboard/subscription/billing')}
              className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{t('manageSubscriptionPage.billingHistory')}</p>
                  <p className="text-xs text-muted-foreground">{t('manageSubscriptionPage.viewPastInvoices')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-1">{t('manageSubscriptionPage.readyToUpgrade')}</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                {t('manageSubscriptionPage.upgradeDescription')}
              </p>
              <Button
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                onClick={() => navigate('/dashboard/subscription')}
              >
                {t('manageSubscriptionPage.viewPlans')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-center mb-2">{t('manageSubscriptionPage.cancelConfirmTitle')}</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {t('manageSubscriptionPage.cancelConfirmDesc')}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  {t('manageSubscriptionPage.keepPlan')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={handleCancel}
                  disabled={canceling}
                >
                  {canceling ? <Spinner size="sm" /> : t('manageSubscriptionPage.cancel')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ManageSubscriptionPage;
