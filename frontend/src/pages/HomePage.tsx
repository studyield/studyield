import { PublicLayout } from '@/layouts/PublicLayout';
import {
  HeroSection,
  TrustedBySection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
} from '@/components/landing';

export function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
}
