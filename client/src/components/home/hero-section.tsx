import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative py-12 md:py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold leading-tight text-darkBg mb-6">
            Secure Transactions <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-lg md:text-xl text-darkBg opacity-80 mb-8 max-w-lg">
            Middlesman provides a trusted escrow platform to secure your business
            transactions with transparent milestone management and payment
            protection.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register">
              <a>
                <GlassButton size="md">Get Started</GlassButton>
              </a>
            </Link>
            <Link href="#features">
              <a>
                <GlassButton variant="secondary" size="md">
                  Learn More
                </GlassButton>
              </a>
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          className="relative mx-auto max-w-md lg:max-w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img
            src="https://images.unsplash.com/photo-1617146870230-275d8b7a3352?auto=format&fit=crop&q=80&w=600&h=400"
            alt="Secure business transaction"
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <motion.div
            className="absolute -bottom-5 -right-5 glass-card p-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-success"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">100% Secure Payments</span>
            </div>
          </motion.div>
          
          <motion.div
            className="absolute -top-5 -left-5 glass-card p-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">
                Trusted by 5000+ Businesses
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
