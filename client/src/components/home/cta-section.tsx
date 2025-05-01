import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-20 px-4">
      <motion.div
        className="max-w-5xl mx-auto glass-card p-8 md:p-12 overflow-hidden relative bg-gradient-to-r from-primary/10 to-secondary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold text-darkBg mb-4">
              Ready to Secure Your Transactions?
            </h2>
            <p className="text-lg text-darkBg opacity-80 max-w-2xl mx-auto">
              Join thousands of businesses using Middlesman to protect their
              payments and streamline their transactions.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <a>
                <GlassButton size="lg">Get Started Free</GlassButton>
              </a>
            </Link>
            <Link href="/contact">
              <a>
                <GlassButton variant="secondary" size="lg">
                  Schedule a Demo
                </GlassButton>
              </a>
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-success bg-opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary bg-opacity-20 rounded-full blur-3xl"></div>
      </motion.div>
    </section>
  );
}
