import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  Search,
  Sparkles,
  MessageSquare,
  BookOpen,
  CreditCard,
  Shield,
  Brain,
  Settings,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { CTASection } from '@/components/landing';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  faqs: {
    question: string;
    answer: string;
  }[];
}

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-semibold pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqCategories: FAQCategory[] = [
    {
      id: 'general',
      title: t('faqPage.categories.general'),
      icon: HelpCircle,
      color: 'from-blue-500 to-cyan-500',
      faqs: [
        {
          question: t('faqPage.general.q1'),
          answer: t('faqPage.general.a1'),
        },
        {
          question: t('faqPage.general.q2'),
          answer: t('faqPage.general.a2'),
        },
        {
          question: t('faqPage.general.q3'),
          answer: t('faqPage.general.a3'),
        },
        {
          question: t('faqPage.general.q4'),
          answer: t('faqPage.general.a4'),
        },
      ],
    },
    {
      id: 'features',
      title: t('faqPage.categories.features'),
      icon: Brain,
      color: 'from-violet-500 to-purple-500',
      faqs: [
        {
          question: t('faqPage.features.q1'),
          answer: t('faqPage.features.a1'),
        },
        {
          question: t('faqPage.features.q2'),
          answer: t('faqPage.features.a2'),
        },
        {
          question: t('faqPage.features.q3'),
          answer: t('faqPage.features.a3'),
        },
        {
          question: t('faqPage.features.q4'),
          answer: t('faqPage.features.a4'),
        },
        {
          question: t('faqPage.features.q5'),
          answer: t('faqPage.features.a5'),
        },
      ],
    },
    {
      id: 'flashcards',
      title: t('faqPage.categories.flashcards'),
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      faqs: [
        {
          question: t('faqPage.flashcards.q1'),
          answer: t('faqPage.flashcards.a1'),
        },
        {
          question: t('faqPage.flashcards.q2'),
          answer: t('faqPage.flashcards.a2'),
        },
        {
          question: t('faqPage.flashcards.q3'),
          answer: t('faqPage.flashcards.a3'),
        },
        {
          question: t('faqPage.flashcards.q4'),
          answer: t('faqPage.flashcards.a4'),
        },
      ],
    },
    {
      id: 'billing',
      title: t('faqPage.categories.billing'),
      icon: CreditCard,
      color: 'from-pink-500 to-rose-500',
      faqs: [
        {
          question: t('faqPage.billing.q1'),
          answer: t('faqPage.billing.a1'),
        },
        {
          question: t('faqPage.billing.q2'),
          answer: t('faqPage.billing.a2'),
        },
        {
          question: t('faqPage.billing.q3'),
          answer: t('faqPage.billing.a3'),
        },
        {
          question: t('faqPage.billing.q4'),
          answer: t('faqPage.billing.a4'),
        },
        {
          question: t('faqPage.billing.q5'),
          answer: t('faqPage.billing.a5'),
        },
        {
          question: t('faqPage.billing.q6'),
          answer: t('faqPage.billing.a6'),
        },
      ],
    },
    {
      id: 'privacy',
      title: t('faqPage.categories.privacy'),
      icon: Shield,
      color: 'from-red-500 to-orange-500',
      faqs: [
        {
          question: t('faqPage.privacy.q1'),
          answer: t('faqPage.privacy.a1'),
        },
        {
          question: t('faqPage.privacy.q2'),
          answer: t('faqPage.privacy.a2'),
        },
        {
          question: t('faqPage.privacy.q3'),
          answer: t('faqPage.privacy.a3'),
        },
        {
          question: t('faqPage.privacy.q4'),
          answer: t('faqPage.privacy.a4'),
        },
      ],
    },
    {
      id: 'technical',
      title: t('faqPage.categories.technical'),
      icon: Settings,
      color: 'from-gray-500 to-slate-600',
      faqs: [
        {
          question: t('faqPage.technical.q1'),
          answer: t('faqPage.technical.a1'),
        },
        {
          question: t('faqPage.technical.q2'),
          answer: t('faqPage.technical.a2'),
        },
        {
          question: t('faqPage.technical.q3'),
          answer: t('faqPage.technical.a3'),
        },
        {
          question: t('faqPage.technical.q4'),
          answer: t('faqPage.technical.a4'),
        },
      ],
    },
  ];

  const selectedCategoryData = faqCategories.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-background dark:from-amber-950/20 dark:via-orange-950/10 dark:to-background">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-amber-400 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400 rounded-full blur-3xl" />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full mb-6 border border-amber-200 dark:border-amber-800"
              >
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {t('faqPage.badge')}
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
                {t('faqPage.title')}{' '}
                <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {t('faqPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
                {t('faqPage.description')}
              </p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-xl mx-auto"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('faqPage.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 h-14 text-lg rounded-xl border-2 border-border focus:border-amber-500"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {faqCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setOpenFaqIndex(0);
                      }}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all',
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                          : 'bg-card border-2 border-border hover:border-amber-300 dark:hover:border-amber-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {category.title}
                    </button>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              {selectedCategoryData && (
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center',
                        selectedCategoryData.color
                      )}
                    >
                      <selectedCategoryData.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">
                        {selectedCategoryData.title}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {t('faqPage.questionsCount', { count: selectedCategoryData.faqs.length })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border-2 border-border rounded-2xl p-6 lg:p-8">
                    {selectedCategoryData.faqs.map((faq, index) => (
                      <FAQItem
                        key={faq.question}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openFaqIndex === index}
                        onClick={() =>
                          setOpenFaqIndex(openFaqIndex === index ? null : index)
                        }
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {t('faqPage.quickLinks.badge')}
                  </span>
                </div>
                <h2 className="text-3xl font-black">{t('faqPage.quickLinks.title')}</h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to="/support"
                    className="block bg-card border-2 border-border rounded-2xl p-6 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all text-center group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold mb-2">{t('faqPage.quickLinks.helpCenter')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('faqPage.quickLinks.helpCenterDesc')}
                    </p>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to="/contact"
                    className="block bg-card border-2 border-border rounded-2xl p-6 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all text-center group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold mb-2">{t('faqPage.quickLinks.contactUs')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('faqPage.quickLinks.contactUsDesc')}
                    </p>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to="/pricing"
                    className="block bg-card border-2 border-border rounded-2xl p-6 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all text-center group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold mb-2">{t('faqPage.quickLinks.pricing')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('faqPage.quickLinks.pricingDesc')}
                    </p>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <CTASection />
      </div>
    </PublicLayout>
  );
}
