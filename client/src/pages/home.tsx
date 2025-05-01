import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import DashboardPreview from "@/components/home/dashboard-preview";
import TestimonialsSection from "@/components/home/testimonials-section";
import CTASection from "@/components/home/cta-section";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Middlesman - Secure Escrow Services</title>
        <meta
          name="description"
          content="Middlesman provides a trusted escrow platform to secure your business transactions with transparent milestone management and payment protection."
        />
      </Helmet>
      <div>
        <HeroSection />
        <FeaturesSection />
        <DashboardPreview />
        <TestimonialsSection />
        <CTASection />
      </div>
    </>
  );
}
