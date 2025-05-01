import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedLogo = ({ className }: { className?: string }) => {
  const [hovered, setHovered] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  
  useEffect(() => {
    // Start the animation sequence on component mount
    const timer = setTimeout(() => {
      setSequenceComplete(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const linksPath = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        pathLength: { type: "spring", duration: 1.5, bounce: 0 },
        opacity: { duration: 0.2 }
      }
    }
  };
  
  const containerVariants = {
    initial: { rotate: 0, scale: 1 },
    animate: { rotate: 0, scale: 1 },
    hover: { 
      scale: 1.05,
      rotate: [0, -5, 5, -3, 3, 0],
      transition: { 
        rotate: {
          duration: 0.5,
          ease: "easeInOut",
          times: [0, 0.2, 0.4, 0.6, 0.8, 1]
        },
        scale: {
          duration: 0.2,
          ease: "easeInOut"
        }
      }
    }
  };

  const coreVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5, 
        delay: 0.8,
        ease: "easeOut"
      }
    },
    hover: { 
      scale: 1.1,
      filter: "brightness(1.2)",
      transition: { duration: 0.2 }
    }
  };
  
  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: [0, 0.7, 0.5],
      scale: [0.8, 1.3, 1],
      transition: { 
        duration: 1.8, 
        delay: 1,
        times: [0, 0.4, 1],
        ease: "easeOut"
      }
    },
    hover: {
      opacity: 0.8,
      scale: 1.2,
      transition: { duration: 0.2 }
    }
  };

  const morphingCircleVariants = {
    initial: { 
      scale: 0,
      opacity: 0,
      borderRadius: "50%"
    },
    animate: { 
      scale: [0, 1, 0.9],
      opacity: [0, 0.8, 0.6],
      borderRadius: ["50%", "48%", "50%"],
      transition: { 
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className={`relative ${className || ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      variants={containerVariants}
      initial="initial"
      animate={sequenceComplete ? (hovered ? "hover" : "animate") : "animate"}
    >
      {/* Background morphing glow element */}
      <motion.div 
        className="absolute -inset-2 bg-primary/20 rounded-full blur-xl"
        variants={morphingCircleVariants}
        initial="initial"
        animate="animate"
      />
      
      {/* Core glow effect */}
      <motion.div 
        className="absolute inset-0 bg-primary/30 rounded-full blur-md"
        variants={glowVariants}
        initial="initial"
        animate={hovered ? "hover" : "animate"}
      />

      {/* Logo core */}
      <motion.div 
        className="relative z-10 flex items-center justify-center w-full h-full bg-primary rounded-full overflow-hidden"
        variants={coreVariants}
        initial="initial"
        animate={hovered ? "hover" : "animate"}
      >
        {/* SVG logo */}
        <svg 
          width="70%" 
          height="70%" 
          viewBox="0 0 24 24" 
          fill="none" 
          className="text-white"
        >
          <motion.path
            d="M10 6h4c2.5 0 5 2 5 5s-2.5 5-5 5h-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            variants={linksPath}
            initial="initial"
            animate="animate"
          />
          <motion.path
            d="M14 6h-4C7.5 6 5 8 5 11s2.5 5 5 5h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            variants={linksPath}
            initial="initial"
            animate="animate"
          />
          
          {/* M for Middlesman */}
          <motion.path
            d="M9 12l2-3 2 3 2-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={linksPath}
            initial="initial"
            animate="animate"
            transition={{ delay: 1 }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedLogo;