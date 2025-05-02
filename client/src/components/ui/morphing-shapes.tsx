import { motion } from "framer-motion";

export const MorphingCircle = ({ 
  className, 
  color = "bg-primary",
  duration = 6,
  delay = 0,
  size = "w-32 h-32",
  opacity = "opacity-30"
}: { 
  className?: string,
  color?: string,
  duration?: number,
  delay?: number,
  size?: string,
  opacity?: string
}) => {
  return (
    <motion.div
      className={`${size} ${color} rounded-full blur-lg ${opacity} ${className || ""}`}
      animate={{
        borderRadius: ["50%", "40%", "30%", "50%", "25%", "40%", "50%"],
        scale: [1, 1.2, 0.9, 1.1, 0.85, 1.05, 1],
      }}
      transition={{
        duration: duration,
        times: [0, 0.2, 0.4, 0.6, 0.7, 0.9, 1],
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut",
        delay: delay
      }}
    />
  );
};

export const FloatingElement = ({
  children,
  className,
  amplitude = 15,
  duration = 5,
  delay = 0,
  direction = "y"
}: {
  children: React.ReactNode,
  className?: string,
  amplitude?: number,
  duration?: number,
  delay?: number,
  direction?: "x" | "y" | "both"
}) => {
  const animateProps = 
    direction === "x" 
      ? { x: [-amplitude, amplitude, -amplitude] } 
      : direction === "y" 
        ? { y: [-amplitude, amplitude, -amplitude] }
        : { 
            y: [-amplitude, amplitude, -amplitude],
            x: [amplitude, -amplitude/2, amplitude]
          };

  return (
    <motion.div
      className={className}
      animate={animateProps}
      transition={{
        duration: duration,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut",
        delay: delay
      }}
    >
      {children}
    </motion.div>
  );
};

export const Parallax3DCard = ({
  children,
  className,
  depth = 20,
  perspective = 800
}: {
  children: React.ReactNode,
  className?: string,
  depth?: number,
  perspective?: number
}) => {
  return (
    <motion.div 
      className={`relative ${className || ""}`}
      style={{ perspective: `${perspective}px` }}
      whileHover="hover"
      initial="initial"
    >
      <motion.div
        className="w-full h-full relative"
        variants={{
          initial: { rotateX: 0, rotateY: 0 },
          hover: { rotateX: 0, rotateY: 0 }
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{
          rotateY: [-5, 5, 0],
          rotateX: [5, -5, 0],
          transition: {
            rotateY: { duration: 1, ease: "easeOut" },
            rotateX: { duration: 1, ease: "easeOut" }
          }
        }}
      >
        <div style={{ transform: `translateZ(0px)` }}>
          {children}
        </div>
        
        {/* Shadow element that moves opposite to create 3D effect */}
        <motion.div
          className="absolute inset-0 bg-black/20 rounded-lg blur-md"
          style={{ transform: `translateZ(-${depth}px)` }}
          variants={{
            initial: { x: 0, y: 0 },
            hover: { x: 10, y: 10 }
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
};

export const MorphingIcon = ({
  icon1,
  icon2,
  className,
  duration = 5
}: {
  icon1: React.ReactNode,
  icon2: React.ReactNode,
  className?: string,
  duration?: number
}) => {
  return (
    <div className={`relative ${className || ""}`}>
      <motion.div
        animate={{
          opacity: [1, 0, 1],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: duration,
          times: [0, 0.5, 1],
          repeat: Infinity,
          repeatType: "loop" as const
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {icon1}
      </motion.div>
      
      <motion.div
        animate={{
          opacity: [0, 1, 0],
          scale: [0.9, 1, 0.9],
        }}
        transition={{
          duration: duration,
          times: [0, 0.5, 1],
          repeat: Infinity,
          repeatType: "loop" as const
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {icon2}
      </motion.div>
    </div>
  );
};