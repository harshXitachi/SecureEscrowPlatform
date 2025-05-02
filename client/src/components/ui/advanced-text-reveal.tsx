import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";

type TextRevealProps = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  color?: string;
  highlightColor?: string;
  revealDirection?: "up" | "down" | "left" | "right";
  type?: "word" | "character";
  staggerChildren?: number;
  fontSize?: string;
  fontWeight?: string;
};

export const TextReveal = ({
  text,
  className = "",
  delay = 0,
  duration = 0.8,
  once = false,
  color = "white",
  highlightColor,
  revealDirection = "up",
  type = "word",
  staggerChildren = 0.03,
  fontSize = "inherit",
  fontWeight = "inherit",
}: TextRevealProps) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  
  const getDirectionAnimProps = () => {
    switch (revealDirection) {
      case "up":
        return { y: ["100%", "0%"] };
      case "down":
        return { y: ["-100%", "0%"] };
      case "left":
        return { x: ["100%", "0%"] };
      case "right":
        return { x: ["-100%", "0%"] };
    }
  };

  const slideVariants = {
    hidden: {
      opacity: 0,
      ...(revealDirection === "up" && { y: "100%" }),
      ...(revealDirection === "down" && { y: "-100%" }),
      ...(revealDirection === "left" && { x: "100%" }),
      ...(revealDirection === "right" && { x: "-100%" }),
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        opacity: { duration: duration * 0.5, ease: "easeOut" },
        x: { duration, ease: [0.16, 1, 0.3, 1] },
        y: { duration, ease: [0.16, 1, 0.3, 1] },
        delay: delay + (i * staggerChildren),
      },
    }),
  };
  
  const words = type === "word" ? text.split(" ") : text.split("");
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          controls.start("hidden");
        }
      },
      { threshold: 0.2 }
    );
    
    observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [controls, once]);
  
  return (
    <div ref={ref} className={className} aria-label={text}>
      <div className="flex flex-wrap">
        {words.map((word, i) => (
          <div key={i} className="overflow-hidden relative mr-1 md:mr-2">
            <motion.div
              custom={i}
              variants={slideVariants}
              initial="hidden"
              animate={controls}
              style={{ 
                fontSize, 
                fontWeight, 
                color: i % 3 === 0 && highlightColor ? highlightColor : color,
                display: type === "word" ? "block" : "inline-block"
              }}
            >
              {word}{type === "word" && " "}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MaskTextReveal = ({
  text,
  className = "",
  delay = 0,
  highlightColor,
  fontSize = "inherit",
  fontWeight = "inherit",
  color = "white"
}: Omit<TextRevealProps, "type" | "revealDirection" | "staggerChildren" | "duration" | "once">) => {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [controls]);
  
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay }}
        style={{
          fontSize,
          fontWeight,
          color,
          position: "relative",
          zIndex: 10,
        }}
      >
        {text}
      </motion.div>
      
      <motion.div
        initial={{ scale: 1.5, x: "-10%" }}
        animate={controls}
        variants={{
          visible: {
            scale: 1,
            x: "0%",
            transition: {
              duration: 1.5,
              ease: [0.33, 1, 0.68, 1],
              delay: delay + 0.3
            }
          }
        }}
        style={{
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: `linear-gradient(90deg, transparent, ${highlightColor || 'rgba(255,255,255,0.8)'} 50%, transparent)`,
          zIndex: 5,
          mixBlendMode: "overlay",
          filter: "blur(8px)"
        }}
      />
      
      <motion.div
        initial={{ left: "-100%" }}
        animate={controls}
        variants={{
          visible: {
            left: "100%",
            transition: {
              duration: 1.2,
              ease: [0.65, 0, 0.35, 1],
              delay: delay + 0.1
            }
          }
        }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "100%",
          background: `linear-gradient(90deg, transparent, ${highlightColor || 'rgba(255,255,255,0.9)'}, transparent)`,
          zIndex: 20,
          mixBlendMode: "overlay"
        }}
      />
    </div>
  );
};

export const GlassmorphicText = ({
  text,
  className = "",
  delay = 0,
  color = "white",
  highlightColor = "rgba(255,255,255,0.15)",
  fontSize = "inherit",
  fontWeight = "inherit"
}: Omit<TextRevealProps, "type" | "revealDirection" | "staggerChildren" | "duration" | "once">) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [controls]);
  
  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
      style={{
        fontSize,
        fontWeight,
        color
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay }}
        className="relative z-10"
      >
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                  ease: [0.33, 1, 0.68, 1],
                  delay: delay + index * 0.025
                }
              }
            }}
            className="inline-block"
            style={{
              textShadow: "0 0 10px rgba(255,255,255,0.3)"
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.div>
      
      <motion.div
        initial={{ scale: 1.2, opacity: 0 }}
        animate={controls}
        variants={{
          visible: {
            scale: 1,
            opacity: 0.2,
            transition: {
              duration: 1.2,
              ease: [0.33, 1, 0.68, 1],
              delay: delay + 0.3
            }
          }
        }}
        style={{
          position: "absolute",
          inset: -5,
          background: `linear-gradient(135deg, ${highlightColor}, transparent 60%)`,
          filter: "blur(15px)",
          zIndex: 0,
          borderRadius: "8px"
        }}
      />
      
      <motion.div
        initial={{ left: "-100%" }}
        animate={controls}
        variants={{
          visible: {
            left: "100%",
            transition: {
              duration: 1,
              ease: [0.25, 1, 0.5, 1],
              delay: delay + 0.4
            }
          }
        }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          zIndex: 15,
          mixBlendMode: "overlay"
        }}
      />
    </div>
  );
};

export default {
  TextReveal,
  MaskTextReveal,
  GlassmorphicText
};