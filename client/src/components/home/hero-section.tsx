import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { FloatingElement, MorphingCircle } from "@/components/ui/morphing-shapes";
import { TextReveal, MaskTextReveal, GlassmorphicText } from "@/components/ui/advanced-text-reveal";
import { AnimatedSecureIcon } from "@/components/ui/animated-icons";

export default function HeroSection() {
  const controlsMain = useAnimation();
  const glassPanelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Start the animation sequence after component mount
    const sequence = async () => {
      await controlsMain.start("visible");
    };
    
    sequence();
    
    // Add mouse move effect for the glass panel
    const handleMouseMove = (e: MouseEvent) => {
      if (!glassPanelRef.current) return;
      
      const rect = glassPanelRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const moveX = (x - centerX) / 20;
      const moveY = (y - centerY) / 20;
      
      glassPanelRef.current.style.transform = `perspective(1000px) rotateX(${-moveY}deg) rotateY(${moveX}deg)`;
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [controlsMain]);
  
  return (
    <section className="relative py-20 md:py-32 px-4 min-h-[90vh] flex items-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2">
          <MorphingCircle 
            color="bg-blue-500" 
            size="w-96 h-96" 
            duration={15} 
            opacity="opacity-10"
          />
        </div>
        <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2">
          <MorphingCircle 
            color="bg-indigo-600" 
            size="w-80 h-80" 
            duration={12}
            delay={4}
            opacity="opacity-10"
          />
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-deepBlack/80 to-deepBlack/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left column - Main content */}
          <div className="lg:col-span-7">
            <div className="mb-6">
              <GlassmorphicText
                text="Secure Transactions"
                className="text-5xl md:text-7xl font-bold mb-4"
                delay={0.2}
                highlightColor="rgba(59, 130, 246, 0.3)"
              />
              
              <TextReveal
                text="with transparent escrow"
                className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent"
                delay={0.8}
                staggerChildren={0.04}
                revealDirection="up"
                duration={1}
              />
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 mb-10 max-w-xl">
              <MaskTextReveal
                text="Middlesman provides protection with transparent milestone payments and secure escrow services. Get paid safely."
                className="text-xl md:text-2xl text-white/80"
                delay={1.2}
                highlightColor="rgba(59, 130, 246, 0.4)"
              />
            </div>
            
            <motion.div 
              className="flex flex-wrap gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            >
              <Link href="/register">
                <div className="cursor-pointer">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GlassButton>Get Started</GlassButton>
                  </motion.div>
                </div>
              </Link>
              <Link href="#features">
                <div className="cursor-pointer">
                  <motion.button 
                    className="px-6 py-3 text-white/80 font-medium relative overflow-hidden group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">Learn More</span>
                    <motion.span 
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500"
                      initial={{ scaleX: 0, originX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </div>
              </Link>
            </motion.div>
            
            <motion.div
              className="mt-12 flex items-center gap-3 text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.7 }}
            >
              <AnimatedSecureIcon className="h-6 w-6 text-blue-400" />
              <span className="text-sm backdrop-blur-sm bg-white/5 px-3 py-1 rounded-full border border-white/10">
                98% of transactions completed successfully
              </span>
            </motion.div>
          </div>
          
          {/* Right column - 3D Visual */}
          <div className="lg:col-span-5 h-[450px] md:h-[550px] relative">
            <motion.div
              ref={glassPanelRef}
              className="absolute inset-0 rounded-2xl backdrop-blur-lg p-10 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 shadow-2xl transition-transform duration-300 ease-out overflow-hidden"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Floating glow effects */}
              <motion.div 
                className="absolute left-1/4 top-1/4 w-32 h-32 bg-blue-500 rounded-full filter blur-[80px] opacity-30"
                animate={{ 
                  scale: [1, 1.2, 1],
                  x: [0, -10, 0],
                  y: [0, 10, 0]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "loop" as const
                }}
              />
              
              <motion.div 
                className="absolute right-1/4 bottom-1/4 w-40 h-40 bg-indigo-600 rounded-full filter blur-[80px] opacity-20"
                animate={{ 
                  scale: [1, 1.3, 1],
                  x: [0, 15, 0],
                  y: [0, -15, 0]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "loop" as const,
                  delay: 2
                }}
              />
              
              {/* Transaction cards */}
              <FloatingElement 
                amplitude={15} 
                duration={7} 
                direction="y"
                className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-64 z-20"
              >
                <motion.div 
                  className="blue-card p-6 rounded-xl shadow-xl w-full backdrop-blur-md bg-gradient-to-br from-blue-500/40 to-indigo-800/30 border border-white/10"
                  style={{ transform: "translateZ(20px)" }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-white font-medium">Escrow Payment</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">$5,500.00</div>
                  <div className="text-sm text-white/60">Transaction #38291</div>
                  <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-400 rounded-full" 
                      initial={{ width: "0%" }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-white/60">75% completed</div>
                </motion.div>
              </FloatingElement>
              
              <FloatingElement
                amplitude={12}
                duration={6}
                direction="both"
                delay={1}
                className="absolute bottom-1/4 right-1/4 w-56 z-10"
              >
                <motion.div
                  className="plink-card p-5 rounded-xl shadow-xl w-full backdrop-blur-md bg-gradient-to-br from-indigo-600/30 to-purple-800/30 border border-white/10"
                  style={{ transform: "translateZ(40px)" }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center backdrop-blur-sm">
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
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                      <motion.div
                        animate={{ 
                          rotate: [0, 0, 180, 180, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          repeatType: "loop" as const,
                          times: [0, 0.4, 0.5, 0.9, 1]
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm1-6a1 1 0 10-2 0v2.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V10z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </FloatingElement>
              
              {/* Small floating elements */}
              <FloatingElement
                amplitude={8}
                duration={5}
                direction="x"
                delay={2}
                className="absolute top-2/3 left-1/3 transform -translate-x-1/2 z-30"
              >
                <motion.div 
                  className="p-3 rounded-lg bg-gradient-to-r from-green-500/30 to-emerald-600/30 border border-white/10 backdrop-blur-sm"
                  style={{ transform: "translateZ(60px)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-white">Milestone completed</span>
                  </div>
                </motion.div>
              </FloatingElement>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
