import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Receipt,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { subscriptionService } from '@/services/subscription';

export function BillingHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);

  const isFree = (user?.plan || 'free') === 'free';

  const handleViewInStripe = async () => {
    setPortalLoading(true);
    try {
      const url = await subscriptionService.createPortal();
      window.location.href = url;
    } catch {
      // Portal not available
    }
    setPortalLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/subscription/manage')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('billingHistoryPage.backToSubscription')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6 text-green-500" />
              {t('billingHistoryPage.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isFree ? t('billingHistoryPage.noBillingHistory') : t('billingHistoryPage.viewInStripeDesc')}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>

          {isFree ? (
            <>
              <h3 className="text-lg font-semibold mb-2">{t('billingHistoryPage.noInvoicesYet')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t('billingHistoryPage.freePlanMessage')}
              </p>
              <Button onClick={() => navigate('/dashboard/subscription')}>
                {t('billingHistoryPage.viewPlans')}
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">{t('billingHistoryPage.viewInStripe')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t('billingHistoryPage.paidPlanMessage')}
              </p>
              <Button onClick={handleViewInStripe} disabled={portalLoading}>
                {portalLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                {t('billingHistoryPage.stripePortal')}
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default BillingHistoryPage;
