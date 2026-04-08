import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star, Quote, BadgeCheck } from 'lucide-react';

const testimonialKeys = ['t1', 't2', 't3', 't4', 't5', 't6'] as const;

const avatarGradients = [
  'from-blue-500 to-indigo-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-green-500 to-emerald-500',
  'from-cyan-500 to-teal-500',
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ tKey }: { tKey: string }) {
  const { t } = useTranslation();
  const globalIndex = testimonialKeys.indexOf(tKey as typeof testimonialKeys[number]);
  const initials = t(`testimonials.${tKey}.name`)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="relative bg-card/80 backdrop-blur-sm border border-border hover:border-green-500/20 rounded-2xl p-6 lg:p-8 flex flex-col overflow-hidden group transition-colors duration-300 hover:shadow-md h-full">
      <Quote className="w-8 h-8 text-green-500/20 mb-4 shrink-0" />

      <p className="text-muted-foreground leading-relaxed flex-1 mb-6">
        "{t(`testimonials.${tKey}.text`)}"
      </p>

      <div className="mb-4">
        <StarRating rating={5} />
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradients[globalIndex]} flex items-center justify-center text-white text-sm font-bold ring-2 ring-background shadow-sm`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">
              {t(`testimonials.${tKey}.name`)}
            </p>
            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {t(`testimonials.${tKey}.role`)} · {t(`testimonials.${tKey}.university`)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isWrapping = useRef(false);
  const x = useMotionValue(0);
  const total = testimonialKeys.length;
  const gap = 24;

  // Build an infinite strip: [...all, ...all, ...all] so we can scroll seamlessly
  const repeatedKeys = [...testimonialKeys, ...testimonialKeys, ...testimonialKeys];
  // Start from the middle set so we can scroll both directions
  const offsetBase = total;

  const measureCardWidth = useCallback(() => {
    if (!containerRef.current) return 400;
    const containerWidth = containerRef.current.offsetWidth;
    const w = (containerWidth - gap * 2) / 3;
    setCardWidth(w);
    return w;
  }, []);

  const scrollToIndex = useCallback((index: number, instant = false) => {
    const w = measureCardWidth();
    const targetX = -(index * (w + gap));
    if (instant) {
      x.set(targetX);
    } else {
      animate(x, targetX, {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      });
    }
  }, [x, measureCardWidth]);

  const advance = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= total) {
        // Wrap around: animate to position past the middle set, then silently reset
        isWrapping.current = true;
        const w = measureCardWidth();
        const targetX = -((offsetBase + next) * (w + gap));
        animate(x, targetX, {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1],
          onComplete: () => {
            const resetX = -(offsetBase * (w + gap));
            x.set(resetX);
            isWrapping.current = false;
          },
        });
        return 0;
      }
      return next;
    });
  }, [x, measureCardWidth, offsetBase, total]);

  // Set initial position + handle resize
  useEffect(() => {
    const w = measureCardWidth();
    x.set(-(offsetBase * (w + gap)));

    const handleResize = () => {
      const w = measureCardWidth();
      x.set(-((offsetBase + currentIndex) * (w + gap)));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animate when currentIndex changes (skip during wrapping)
  useEffect(() => {
    if (isWrapping.current) return;
    scrollToIndex(offsetBase + currentIndex);
  }, [currentIndex, scrollToIndex, offsetBase]);

  // Auto-play
  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, 4000);
  }, [advance]);

  useEffect(() => {
    startAutoPlay();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startAutoPlay]);

  const goTo = (i: number) => {
    isWrapping.current = false;
    setCurrentIndex(i);
    startAutoPlay();
  };

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-amber-50/30 to-background dark:via-amber-950/10" />
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ opacity: [0.15, 0.25, 0.15], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-yellow-400/10 to-amber-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-8 sm:px-12 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <BadgeCheck className="w-4 h-4" />
              {t('testimonials.badge')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t('testimonials.title')}{' '}
              <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {t('testimonials.titleHighlight')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('testimonials.description')}
            </p>
          </motion.div>
        </div>

        {/* Testimonials carousel */}
        <div
          ref={containerRef}
          className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]"
        >
          <motion.div
            className="flex"
            style={{ x, gap }}
          >
            {repeatedKeys.map((tKey, i) => (
              <div
                key={`${tKey}-${i}`}
                className="shrink-0"
                style={{ width: cardWidth || 'calc((100% - 48px) / 3)' }}
              >
                <TestimonialCard tKey={tKey} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {testimonialKeys.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-8 h-2 bg-green-500'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
