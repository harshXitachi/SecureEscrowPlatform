import { motion } from "framer-motion";
import { useState } from "react";

export const AnimatedSecureIcon = ({ className = "" }: { className?: string }) => {
  const [hovered, setHovered] = useState(false);
  
  const pathVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 2,
        ease: "easeInOut",
        opacity: { duration: 0.3 }
      }
    },
    hover: {
      scale: 1.1,
      filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))",
      transition: { duration: 0.3 }
    }
  };

  const lockVariants = {
    initial: { y: -10, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        delay: 0.5,
        duration: 0.5,
        y: { type: "spring", stiffness: 200 }
      }
    },
    hover: {
      y: [0, -5, 0],
      transition: {
        y: { repeat: Infinity, duration: 1, repeatType: "loop" }
      }
    }
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield */}
        <motion.path
          d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={pathVariants}
        />
        
        {/* Lock body */}
        <motion.path
          d="M8 11H16V16C16 17.1046 15.1046 18 14 18H10C8.89543 18 8 17.1046 8 16V11Z"
          fill="currentColor"
          variants={lockVariants}
        />
        
        {/* Lock bar */}
        <motion.path
          d="M9 11V8C9 6.34315 10.3431 5 12 5V5C13.6569 5 15 6.34315 15 8V11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={pathVariants}
        />
      </svg>
    </motion.div>
  );
};

export const AnimatedPaymentIcon = ({ className = "" }: { className?: string }) => {
  const coinColors = ["#FFD700", "#F79E1B", "#ffffff", "#4CC9F0"];
  
  const coinVariants = (index: number) => ({
    initial: { opacity: 0, x: -20, y: 20, rotate: -45 },
    animate: { 
      opacity: 1, 
      x: 0, 
      y: 0, 
      rotate: 0,
      transition: { 
        delay: 0.15 * index,
        duration: 0.5,
        type: "spring", 
        stiffness: 120
      }
    },
    hover: {
      y: [-5, 5, -5],
      rotate: [-10, 10, -10],
      transition: { 
        repeat: Infinity, 
        duration: 2.5,
        repeatType: "loop" as const,
        ease: "easeInOut",
        delay: index * 0.15
      }
    }
  });
  
  return (
    <motion.div 
      className={`relative ${className}`} 
      initial="initial" 
      animate="animate"
      whileHover="hover"
    >
      <svg 
        viewBox="0 0 24 24" 
        width="100%" 
        height="100%" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {coinColors.map((color, index) => (
          <motion.circle 
            key={index} 
            cx={12 - index * 1.5} 
            cy={12 + index * 1.5} 
            r={6 - index * 0.5}
            fill={color}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.5"
            variants={coinVariants(index)}
          />
        ))}
        
        {/* Dollar sign */}
        <motion.path 
          d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9"
          stroke="#000"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: 1,
            transition: { 
              delay: 0.8,
              duration: 1 
            }
          }}
        />
      </svg>
    </motion.div>
  );
};

export const AnimatedTransactionIcon = ({ className = "" }: { className?: string }) => {
  const transferVariants = {
    initial: { 
      pathLength: 0, 
      opacity: 0 
    },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };
  
  const arrowVariants = {
    initial: { 
      x: -10,
      opacity: 0 
    },
    animate: { 
      x: [0, 20, 0],
      opacity: 1,
      transition: { 
        x: {
          repeat: Infinity,
          duration: 2,
          repeatType: "loop",
          ease: "easeInOut",
          times: [0, 0.5, 1]
        },
        opacity: {
          duration: 0.3
        }
      }
    }
  };
  
  const reverseArrowVariants = {
    initial: { 
      x: 10,
      opacity: 0 
    },
    animate: { 
      x: [0, -20, 0],
      opacity: 1,
      transition: { 
        x: {
          repeat: Infinity,
          duration: 2,
          repeatType: "loop",
          ease: "easeInOut",
          times: [0, 0.5, 1],
          delay: 0.5
        },
        opacity: {
          duration: 0.3,
          delay: 0.2
        }
      }
    }
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      initial="initial"
      animate="animate"
    >
      <svg 
        viewBox="0 0 24 24" 
        width="100%" 
        height="100%" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top device */}
        <motion.rect 
          x="4" 
          y="4" 
          width="16" 
          height="6" 
          rx="1" 
          fill="currentColor"
          initial={{ y: -10, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { 
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15
            }
          }}
        />
        
        {/* Bottom device */}
        <motion.rect 
          x="4" 
          y="14" 
          width="16" 
          height="6" 
          rx="1" 
          fill="currentColor"
          initial={{ y: 10, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            transition: { 
              delay: 0.4,
              type: "spring",
              stiffness: 200,
              damping: 15
            }
          }}
        />
        
        {/* Transfer line */}
        <motion.path 
          d="M12 10v4" 
          stroke="currentColor" 
          strokeWidth="1.5"
          strokeDasharray="1 1"
          variants={transferVariants}
        />
        
        {/* Down arrow */}
        <motion.path 
          d="M10 12l2 2 2-2" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          variants={arrowVariants}
        />
        
        {/* Up arrow */}
        <motion.path 
          d="M14 12l-2-2-2 2" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          variants={reverseArrowVariants}
        />
      </svg>
    </motion.div>
  );
};

export default {
  AnimatedSecureIcon,
  AnimatedPaymentIcon,
  AnimatedTransactionIcon
};