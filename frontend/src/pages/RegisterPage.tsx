import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// Google Sign-In Client ID from environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: object) => void;
        signIn: () => Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }>;
      };
    };
  }
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, googleLogin, appleLogin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [appleReady, setAppleReady] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
        });
        setGoogleReady(true);
      }
    };

    // Load Google Sign-In script
    if (!document.getElementById('google-signin-script')) {
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, []);

  // Initialize Apple Sign-In
  useEffect(() => {
    if (!APPLE_CLIENT_ID) return;

    const initApple = () => {
      if (window.AppleID?.auth) {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: APPLE_REDIRECT_URI,
          usePopup: true,
        });
        setAppleReady(true);
      }
    };

    // Load Apple Sign-In script
    if (!document.getElementById('apple-signin-script')) {
      const script = document.createElement('script');
      script.id = 'apple-signin-script';
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      script.onload = initApple;
      document.body.appendChild(script);
    } else {
      initApple();
    }
  }, []);

  const handleGoogleCallback = async (response: { credential: string }) => {
    setSocialLoading('google');
    setError(null);

    try {
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.register.googleFailed'));
    } finally {
      setSocialLoading('');
    }
  };

  const handleGoogleSignIn = () => {
    if (!googleReady || !window.google?.accounts?.id) {
      setError(t('auth.login.googleNotAvailable'));
      return;
    }
    window.google.accounts.id.prompt();
  };

  const handleAppleSignIn = async () => {
    if (!appleReady || !window.AppleID?.auth) {
      setError(t('auth.login.appleNotAvailable'));
      return;
    }

    setSocialLoading('apple');
    setError(null);

    try {
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization.id_token;
      const userData = response.user?.name
        ? { name: `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim() }
        : undefined;

      await appleLogin(idToken, userData);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.error !== 'popup_closed_by_user') {
        setError(err.message || t('auth.register.appleFailed'));
      }
    } finally {
      setSocialLoading('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setError(t('auth.register.agreeError'));
      return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (password.length < 8) {
      setError(t('auth.register.passwordMinLength'));
      return;
    }
    if (!passwordRegex.test(password)) {
      setError(t('auth.register.passwordStrength'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register(name, email, password);
      // Redirect to login page after successful registration
      navigate('/login', {
        state: { message: t('auth.register.accountCreated') },
      });
    } catch (err: any) {
      setError(err.message || t('auth.register.registrationFailed'));
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

              <div className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {t('auth.register.title')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('auth.register.description')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="flex justify-center gap-4">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-14 h-14 p-0 rounded-xl transition-all duration-200 hover:scale-105 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700"
                onClick={handleGoogleSignIn}
                disabled={isLoading || socialLoading !== ''}
                title={t('auth.login.continueWithGoogle')}
              >
                {socialLoading === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FaGoogle className="h-5 w-5 text-red-500" />
                )}
              </Button>

              {/* Apple */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-14 h-14 p-0 rounded-xl transition-all duration-200 hover:scale-105 bg-black hover:bg-gray-900 text-white"
                onClick={handleAppleSignIn}
                disabled={isLoading || socialLoading !== ''}
                title={t('auth.login.continueWithApple')}
              >
                {socialLoading === 'apple' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FaApple className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 font-medium">
                  {t('auth.register.orSignUpWithEmail')}
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.register.fullName')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.register.namePlaceholder')}
                  required
                  disabled={isLoading}
                  className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.register.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.register.emailPlaceholder')}
                  required
                  disabled={isLoading}
                  className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.register.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.register.passwordPlaceholder')}
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="h-11 pr-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 w-11 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('auth.register.passwordHint')}
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-snug cursor-pointer">
                  {t('auth.register.agreeToTerms')}{' '}
                  <Link to="/terms" className="text-primary hover:text-primary/80 font-medium">
                    {t('auth.register.termsOfService')}
                  </Link>{' '}
                  {t('common.and')}{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary/80 font-medium">
                    {t('auth.register.privacyPolicy')}
                  </Link>
                </Label>
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
                disabled={isLoading || socialLoading !== ''}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.register.creatingAccount')}
                  </>
                ) : (
                  t('auth.register.createAccount')
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('auth.register.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {t('auth.register.signIn')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
