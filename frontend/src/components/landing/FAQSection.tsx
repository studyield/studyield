import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, HelpCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = ['all', 'general', 'features', 'pricing', 'technical'] as const;
type Category = typeof categories[number];

interface FAQ {
  question: string;
  answer: string;
  category: Category;
}

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-border last:border-0"
    >
      <motion.button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between py-6 text-left group",
          isOpen && "pb-4"
        )}
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <span className={cn(
          "font-medium pr-4 transition-colors text-lg",
          isOpen ? "text-primary" : "group-hover:text-primary"
        )}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
            isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <motion.p
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              className="pb-6 text-muted-foreground leading-relaxed pl-0"
            >
              {answer}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQ[] = useMemo(() => [
    // General
    { question: t('faq.q1'), answer: t('faq.a1'), category: 'general' },
    { question: t('faq.q3'), answer: t('faq.a3'), category: 'general' },
    { question: t('faq.q5'), answer: t('faq.a5'), category: 'general' },
    // Features
    { question: t('faq.q2'), answer: t('faq.a2'), category: 'features' },
    { question: t('faq.q4'), answer: t('faq.a4'), category: 'features' },
    { question: t('faq.q7'), answer: t('faq.a7'), category: 'features' },
    // Pricing
    { question: t('faq.q8'), answer: t('faq.a8'), category: 'pricing' },
    { question: t('faq.q9'), answer: t('faq.a9'), category: 'pricing' },
    { question: t('faq.q10'), answer: t('faq.a10'), category: 'pricing' },
    // Technical
    { question: t('faq.q6'), answer: t('faq.a6'), category: 'technical' },
    { question: t('faq.q11'), answer: t('faq.a11'), category: 'technical' },
    { question: t('faq.q12'), answer: t('faq.a12'), category: 'technical' },
  ], [t]);

  const filteredFaqs = useMemo(() => {
    let result = faqs;
    if (activeCategory !== 'all') {
      result = result.filter((faq) => faq.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }
    return result;
  }, [activeCategory, searchQuery, faqs]);

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-50/30 to-background dark:via-cyan-950/10" />
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/10 to-teal-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 -left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-8 sm:px-12 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <HelpCircle className="w-4 h-4" />
              {t('faq.badge')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {t('faq.title')}{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {t('faq.titleHighlight')}
                </span>
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('faq.description')}
            </p>
          </motion.div>
        </div>

        {/* Search bar */}
        <motion.div
          className="max-w-xl mx-auto mb-8"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIndex(null);
              }}
              placeholder={t('faq.searchPlaceholder')}
              className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(null);
              }}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              {t(`faq.categories.${cat}`)}
            </button>
          ))}
        </motion.div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('faq.noResults')}</p>
                </div>
              ) : (
                filteredFaqs.map((faq, index) => (
                  <FAQItem
                    key={faq.question}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    index={index}
                  />
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Contact CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-muted-foreground mb-4">
            {t('faq.stillHaveQuestions')}
          </p>
          <motion.a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            {t('faq.contactSupport')}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
