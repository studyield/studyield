import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { MouseEvent } from 'react';

const benefits = [
  { icon: Zap, textKey: 'cta.benefits.startIn30Seconds' },
  { icon: Shield, textKey: 'cta.benefits.noCreditCard' },
  { icon: Clock, textKey: 'cta.benefits.cancelAnytime' },
];

export function CTASection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ctaLink = isAuthenticated ? '/dashboard' : '/welcome';
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const rotateX = useTransform(y, [-0.5, 0.5], ["2deg", "-2deg"]);
  const rotateY = useTransform(x, [-0.5, 0.5], ["-2deg", "2deg"]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-8 sm:px-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600">
            {/* Animated patterns */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"
            />

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-16 text-center">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>{t('cta.badge')}</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6"
              style={{ transform: "translateZ(30px)" }}
            >
              {t('cta.title')}{' '}
              <span className="relative">
                {t('cta.titleHighlight')}
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <motion.path
                    d="M2 6 Q 50 2, 100 6 Q 150 10, 198 6"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </motion.svg>
              </span>
            </motion.h2>

            {/* Description */}
            <motion.p
              className="text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              style={{ transform: "translateZ(20px)" }}
            >
              {t('cta.description')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
              style={{ transform: "translateZ(40px)" }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-green-600 hover:bg-white/90 shadow-xl shadow-black/20 h-14 px-8 text-base font-semibold"
                  asChild
                >
                  <Link to={ctaLink}>
                    {t('cta.getStartedFree')}
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </motion.div>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 backdrop-blur-sm h-14 px-8 text-base font-semibold"
                  asChild
                >
                  <Link to="/contact">{t('cta.talkToSales')}</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-6"
              style={{ transform: "translateZ(15px)" }}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.textKey}
                  className="flex items-center gap-2 text-white/70"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <benefit.icon className="w-4 h-4" />
                  <span className="text-sm">{t(benefit.textKey)}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Floating decorative elements */}
          <motion.div
            animate={{
              y: [-10, 10, -10],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 w-20 h-20 border border-white/20 rounded-2xl hidden lg:block"
          />
          <motion.div
            animate={{
              y: [10, -10, 10],
              rotate: [0, -5, 5, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 left-10 w-16 h-16 border border-white/20 rounded-full hidden lg:block"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 right-20 w-4 h-4 bg-white/30 rounded-full hidden lg:block"
          />
        </motion.div>
      </div>
    </section>
  );
}
