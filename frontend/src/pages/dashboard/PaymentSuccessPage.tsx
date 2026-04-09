import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscription';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  PartyPopper,
  BookOpen,
  Brain,
  Zap,
  Crown,
  AlertTriangle,
} from 'lucide-react';

const confettiColors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const randomValues = React.useMemo(() => ({
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    size: 6 + Math.random() * 6,
    xOffset: (Math.random() - 0.5) * 100,
    rotation: 360 + Math.random() * 360,
    duration: 2 + Math.random(),
    shape: Math.random() > 0.5 ? '50%' : '2px',
  }), []);

  return (
    <motion.div
      initial={{ opacity: 1, y: -20, x, rotate: 0 }}
      animate={{ opacity: 0, y: 300, x: x + randomValues.xOffset, rotate: randomValues.rotation }}
      transition={{ duration: randomValues.duration, delay, ease: 'easeOut' }}
      className="absolute top-0 pointer-events-none"
      style={{
        width: randomValues.size,
        height: randomValues.size,
        borderRadius: randomValues.shape,
        backgroundColor: randomValues.color,
      }}
    />
  );
}

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      subscriptionService.verifySession(sessionId)
        .then(async (result) => {
          if (result.status === 'success') {
            setVerified(true);
            await refreshUser();
          } else {
            setVerifyError(t('paymentSuccess.verificationPending'));
          }
        })
        .catch(() => {
          setVerifyError(t('paymentSuccess.verificationFailed'));
        })
        .finally(() => setVerifying(false));
    } else {
      setVerifying(false);
      setVerified(true);
      refreshUser();
    }
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [refreshUser, searchParams, t]);

  const confettiParticles = React.useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    x: Math.random() * 500 - 250,
  })), []);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="relative bg-card rounded-2xl border border-border p-8 text-center overflow-hidden"
        >
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-x-0 top-0 flex justify-center overflow-hidden h-80 pointer-events-none">
              {confettiParticles.map((p) => (
                <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
              ))}
            </div>
          )}

          {/* Loading/Error State */}
          {verifying && (
            <div className="relative z-10 py-8 flex flex-col items-center">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-4">{t('paymentSuccess.verifying')}</p>
            </div>
          )}

          {verifyError && !verifying && (
            <div className="relative z-10 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-sm text-amber-600 mb-4">{verifyError}</p>
            </div>
          )}

          {/* Success Icon */}
          {!verifying && (verified || verifyError) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, damping: 10 }}
            className="relative z-10"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.4, damping: 8 }}
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
            </div>
          </motion.div>
          )}

          {!verifying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <PartyPopper className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">{t('paymentSuccess.welcomeAboard')}</span>
            </div>

            <h1 className="text-2xl font-bold mb-2">{t('paymentSuccess.title')}</h1>
            <p className="text-muted-foreground mb-8">
              {t('paymentSuccess.description')}
            </p>

            {/* Unlocked Features */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: Brain, label: t('paymentSuccess.unlimitedAi'), desc: t('paymentSuccess.unlimitedAiDesc'), color: 'purple' },
                { icon: BookOpen, label: t('paymentSuccess.moreStudySets'), desc: t('paymentSuccess.moreStudySetsDesc'), color: 'blue' },
                { icon: Zap, label: t('paymentSuccess.problemSolver'), desc: t('paymentSuccess.problemSolverDesc'), color: 'amber' },
                { icon: Crown, label: t('paymentSuccess.premiumSupport'), desc: t('paymentSuccess.premiumSupportDesc'), color: 'green' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="bg-muted/30 rounded-xl p-4 text-left"
                >
                  <div className={`w-9 h-9 rounded-lg bg-${item.color}-500/10 flex items-center justify-center mb-2`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => navigate('/dashboard')}>
                <Sparkles className="w-4 h-4 mr-2" />
                {t('paymentSuccess.startLearning')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard/subscription/manage')}
              >
                {t('paymentSuccess.manageSubscription')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default PaymentSuccessPage;
