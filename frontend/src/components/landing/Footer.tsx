import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Twitter,
  Github,
  Linkedin,
  Mail,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Heart,
  Send,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const footerLinks = {
  product: [
    { nameKey: 'footer.links.features', href: '/features' },
    { nameKey: 'footer.links.blog', href: '/blog' },
    { nameKey: 'footer.links.tutorial', href: '/tutorial' },
    { nameKey: 'footer.links.aboutUs', href: '/about' },
    { nameKey: 'footer.links.contact', href: '/contact' },
  ],
  support: [
    { nameKey: 'footer.links.helpCenter', href: '/support' },
    { nameKey: 'footer.links.faq', href: '/faq' },
  ],
  legal: [
    { nameKey: 'footer.links.privacyPolicy', href: '/privacy' },
    { nameKey: 'footer.links.termsOfService', href: '/terms' },
    { nameKey: 'footer.links.cookiePolicy', href: '/cookies' },
    { nameKey: 'footer.links.dataDeletion', href: '/data-deletion' },
  ],
};

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/studyield', color: 'hover:text-sky-500' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/studyield', color: 'hover:text-foreground' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/studyield', color: 'hover:text-blue-600' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@studyield.com', color: 'hover:text-green-500' },
];

export function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 border-t border-border/50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                {t('footer.newsletter.badge')}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                {t('footer.newsletter.title')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                {t('footer.newsletter.description')}
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer.newsletter.placeholder')}
                    className="w-full h-11 px-4 pr-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25"
                  disabled={isSubscribed}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('footer.newsletter.subscribed')}
                    </>
                  ) : (
                    <>
                      {t('footer.newsletter.subscribe')}
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3">
                {t('footer.newsletter.privacyNote')}{' '}
                <Link to="/privacy" className="underline hover:text-foreground transition-colors">
                  {t('footer.newsletter.privacyPolicy')}
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
                <img src="/logos/studyield-logo.png" alt="Studyield" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">Studyield</span>
              </Link>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm leading-relaxed">
                {t('footer.brand.description')}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground transition-all hover:border-transparent hover:shadow-md ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">{t('footer.sections.product')}</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      {t(link.nameKey)}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">{t('footer.sections.support')}</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      {t(link.nameKey)}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">{t('footer.sections.legal')}</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      {t(link.nameKey)}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; {t('footer.copyright', { year: new Date().getFullYear() })}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{t('footer.madeWith')}</span>
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>{t('footer.andAI')}</span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/sitemap"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('footer.sitemap')}
                </Link>
                <Link
                  to="/accessibility"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('footer.accessibility')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/25 flex items-center justify-center hover:bg-green-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={t('footer.backToTop')}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
