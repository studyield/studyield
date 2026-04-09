import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError((err as Error).message || t('auth.forgotPassword.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-100/20 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-lg mx-auto">
        <Card className="shadow-2xl border border-white/50 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex flex-col items-center space-y-3">
              {/* Logo */}
              <Link to="/" className="group cursor-pointer mb-4">
                <img src="/logos/studyield-logo.png" alt="Studyield" className="w-20 h-20 object-contain transition-all duration-300 group-hover:scale-110" />
              </Link>

              {isSubmitted ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {t('auth.forgotPassword.checkEmail')}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {t('auth.forgotPassword.emailSent')}{' '}
                      <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                    </CardDescription>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {t('auth.forgotPassword.title')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {t('auth.forgotPassword.description')}
                  </CardDescription>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isSubmitted ? (
              <div className="space-y-5">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {t('auth.forgotPassword.didntReceive')}{' '}
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setError(null);
                    }}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {t('auth.forgotPassword.tryAgain')}
                  </button>
                </p>

                <Button
                  variant="outline"
                  className="w-full h-11"
                  asChild
                >
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('auth.forgotPassword.backToSignIn')}
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('auth.forgotPassword.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.forgotPassword.emailPlaceholder')}
                      required
                      disabled={isLoading}
                      className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-700 dark:text-red-400">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.forgotPassword.sending')}
                      </>
                    ) : (
                      t('auth.forgotPassword.sendResetLink')
                    )}
                  </Button>
                </form>

                <div className="text-center pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('auth.forgotPassword.backToSignIn')}
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
