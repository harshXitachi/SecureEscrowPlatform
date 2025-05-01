import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Text animation component
const SplitTextAnimation = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <span className="inline-block">
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ 
            duration: 0.3,
            delay: delay + index * 0.03,
            ease: [0.33, 1, 0.68, 1]
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export default function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 px-4 min-h-[90vh] flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left column - Main content */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white mb-6">
              <div className="overflow-hidden mb-2">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.33, 1, 0.68, 1],
                    delay: 0.2
                  }}
                >
                  Secure escrow
                </motion.div>
              </div>
              <div className="overflow-hidden">
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.33, 1, 0.68, 1],
                    delay: 0.4
                  }}
                  className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
                >
                  transactions
                </motion.div>
              </div>
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-white/80 mb-10 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              Middlesman provides protection with transparent milestone payments and secure escrow services. Get paid safely.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Link href="/register">
                <div className="cursor-pointer">
                  <GlassButton>Get Started</GlassButton>
                </div>
              </Link>
              <Link href="#features">
                <div className="cursor-pointer">
                  <button className="px-6 py-3 text-white/80 font-medium hover:text-white transition-colors">
                    Learn More
                  </button>
                </div>
              </Link>
            </motion.div>
            
            <motion.div
              className="mt-12 flex items-center gap-2 text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">
                98% of transactions completed successfully
              </span>
            </motion.div>
          </motion.div>
          
          {/* Right column - 3D Visual */}
          <motion.div
            className="relative lg:col-span-5 h-[400px] md:h-[500px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="w-48 h-48 bg-primary rounded-full blur-[80px] opacity-30"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </div>
            
            <motion.div
              className="absolute top-1/4 left-1/4 blue-card p-6 rounded-xl shadow-xl w-64"
              initial={{ y: 20 }}
              animate={{ y: [0, -20, 0] }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                repeatType: "loop" 
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white font-medium">Escrow Payment</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">$5,500.00</div>
              <div className="text-sm text-white/60">Transaction #38291</div>
              <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-blue-400 rounded-full"></div>
              </div>
              <div className="mt-2 text-xs text-white/60">75% completed</div>
            </motion.div>
            
            <motion.div
              className="absolute bottom-1/4 right-1/4 plink-card p-5 rounded-xl shadow-xl w-52"
              initial={{ y: -20 }}
              animate={{ y: [0, 20, 0] }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                repeatType: "loop",
                delay: 1
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Protected</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-white/60">Release date</div>
                  <div className="text-white">July 28, 2025</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm1-6a1 1 0 10-2 0v2.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V10z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
