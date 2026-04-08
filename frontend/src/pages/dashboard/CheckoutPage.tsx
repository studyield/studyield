import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { subscriptionService } from '@/services/subscription';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  CheckCircle,
  Tag,
  Crown,
} from 'lucide-react';
import type { BillingCycle } from '@/config/pricing';

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const state = location.state as {
    plan?: string;
    billingCycle?: BillingCycle;
    price?: number;
  } | null;

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const planId = state?.plan || 'pro';
  const billingCycle: BillingCycle = state?.billingCycle || 'monthly';
  const price = state?.price || 7.99;
  const isMonthly = billingCycle === 'monthly';

  const planName = t('pricing.plans.pro.name');

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      setCouponApplied(true);
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = await subscriptionService.createCheckout(planId, billingCycle);
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('checkoutPage.paymentError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const cycleLabel = isMonthly ? t('checkoutPage.monthly') : t('checkoutPage.annual');

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/subscription')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('checkoutPage.backToPlans')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className={cn(
            'p-6 text-white bg-gradient-to-r from-green-500 to-emerald-600'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('checkoutPage.upgradeTo', { plan: planName })}</h1>
                <p className="text-white/80 text-sm">
                  {cycleLabel} {t('checkoutPage.subscription')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {t('checkoutPage.orderSummary')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('checkoutPage.plan', { plan: planName, cycle: cycleLabel })}</span>
                  <span className="font-medium">${price.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between items-center text-green-500">
                    <span className="text-sm flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {t('checkoutPage.couponApplied')}
                    </span>
                    <span className="font-medium">-$0.00</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-semibold">{t('checkoutPage.total')}</span>
                  <div className="text-right">
                    <span className="text-xl font-bold">${price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                      /{isMonthly ? t('checkoutPage.month') : t('checkoutPage.year')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div>
              <label className="text-sm font-medium mb-2 block">{t('checkoutPage.couponCode')}</label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t('checkoutPage.enterCoupon')}
                  className="flex-1 px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  disabled={couponApplied}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || couponApplied}
                >
                  {couponApplied ? <CheckCircle className="w-4 h-4 text-green-500" /> : t('checkoutPage.apply')}
                </Button>
              </div>
            </div>

            {/* What You Get */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-3">{t('checkoutPage.whatYouGet')}</h4>
              <ul className="space-y-2">
                {(t('pricing.checkoutPage.proFeatures', { returnObjects: true }) as string[]).map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Checkout Button */}
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t('checkoutPage.processing')}
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  {t('checkoutPage.proceedToPayment')}
                </>
              )}
            </Button>

            {/* Trust */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {t('checkoutPage.sslEncrypted')}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {t('checkoutPage.poweredByStripe')}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('checkoutPage.cancelAnytime')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default CheckoutPage;
