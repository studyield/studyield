import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    inquiryType: '',
    subject: '',
    message: '',
  });

  const contactMethods = [
    {
      icon: Mail,
      title: t('contact.methods.emailSupport'),
      description: t('contact.methods.emailSupportDesc'),
      contact: 'support@studyield.com',
      action: 'mailto:support@studyield.com',
      color: 'from-blue-500 to-cyan-500',
      responseTime: t('contact.methods.responseWithin24'),
    },
    {
      icon: MessageSquare,
      title: t('contact.methods.contactForm'),
      description: t('contact.methods.contactFormDesc'),
      contact: t('contact.methods.fillOutForm'),
      action: '#contact-form',
      color: 'from-green-500 to-emerald-500',
      responseTime: t('contact.methods.responseWithin48'),
    },
    {
      icon: HelpCircle,
      title: t('contact.methods.helpCenter'),
      description: t('contact.methods.helpCenterDesc'),
      contact: t('contact.methods.browseArticles'),
      action: '/support',
      color: 'from-violet-500 to-purple-500',
      responseTime: t('contact.methods.available247'),
    },
  ];

  const inquiryTypes = [
    { value: 'general', label: t('contact.inquiryTypes.general') },
    { value: 'technical', label: t('contact.inquiryTypes.technical') },
    { value: 'billing', label: t('contact.inquiryTypes.billing') },
    { value: 'feature', label: t('contact.inquiryTypes.feature') },
    { value: 'partnership', label: t('contact.inquiryTypes.partnership') },
    { value: 'enterprise', label: t('contact.inquiryTypes.enterprise') },
    { value: 'bug', label: t('contact.inquiryTypes.bug') },
    { value: 'other', label: t('contact.inquiryTypes.other') },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-green-50/50 via-emerald-50/30 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mb-6 border border-green-200 dark:border-green-800"
              >
                <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {t('contact.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                {t('contact.title')}{' '}
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('contact.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('contact.description')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <motion.a
                    key={index}
                    href={method.action}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-card border-2 border-border rounded-2xl p-6 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg transition-all text-center group"
                  >
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {method.description}
                    </p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                      {method.contact}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {method.responseTime}
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div id="contact-form" className="bg-card border-2 border-border rounded-2xl p-8 lg:p-10">
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-black mb-3">{t('contact.form.sent')}</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {t('contact.form.sentDescription')}
                      </p>
                      <Button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            inquiryType: '',
                            subject: '',
                            message: '',
                          });
                        }}
                        variant="outline"
                      >
                        {t('contact.form.sendAnother')}
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <h2 className="text-3xl font-black mb-2">{t('contact.form.title')}</h2>
                        <p className="text-muted-foreground">
                          {t('contact.form.description')}
                        </p>
                      </div>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="font-semibold">
                              {t('contact.form.firstName')}
                            </Label>
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName: e.target.value })
                              }
                              required
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="font-semibold">
                              {t('contact.form.lastName')}
                            </Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                              }
                              required
                              className="h-12"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-semibold">
                            {t('contact.form.email')}
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inquiryType" className="font-semibold">
                            {t('contact.form.inquiryType')}
                          </Label>
                          <select
                            id="inquiryType"
                            value={formData.inquiryType}
                            onChange={(e) =>
                              setFormData({ ...formData, inquiryType: e.target.value })
                            }
                            required
                            className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">{t('contact.form.selectInquiry')}</option>
                            {inquiryTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="font-semibold">
                            {t('contact.form.subject')}
                          </Label>
                          <Input
                            id="subject"
                            placeholder={t('contact.form.subjectPlaceholder')}
                            value={formData.subject}
                            onChange={(e) =>
                              setFormData({ ...formData, subject: e.target.value })
                            }
                            required
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message" className="font-semibold">
                            {t('contact.form.message')}
                          </Label>
                          <textarea
                            id="message"
                            rows={5}
                            placeholder={t('contact.form.messagePlaceholder')}
                            value={formData.message}
                            onChange={(e) =>
                              setFormData({ ...formData, message: e.target.value })
                            }
                            required
                            className="flex w-full rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {t('contact.form.sending')}
                            </span>
                          ) : (
                            <>
                              {t('contact.form.sendMessage')}
                              <Send className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
