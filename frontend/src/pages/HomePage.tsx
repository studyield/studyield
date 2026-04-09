import { PublicLayout } from '@/layouts/PublicLayout';
import {
  HeroSection,
  TrustedBySection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
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
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
}
