import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { Parallax3DCard, FloatingElement, MorphingCircle } from "@/components/ui/morphing-shapes";
import { 
  AnimatedSecureIcon, 
  AnimatedPaymentIcon, 
  AnimatedTransactionIcon 
} from "@/components/ui/animated-icons";

export default function FeaturesSection() {
  const features = [
    {
      title: "Create Transaction",
      description: "Define transaction details, milestones, and payment terms between all parties involved.",
      icon: <AnimatedTransactionIcon className="h-10 w-10 text-primary" />,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Secure Funds",
      description: "Buyer securely deposits funds that remain in escrow until agreed conditions are met.",
      icon: <AnimatedPaymentIcon className="h-10 w-10 text-primary" />,
      color: "from-purple-500 to-indigo-600"
    },
    {
      title: "Release Payment",
      description: "Funds are released to the seller as milestones are completed and approved.",
      icon: <AnimatedSecureIcon className="h-10 w-10 text-primary" />,
      color: "from-green-500 to-emerald-600"
    },
  ];

  return (
    <section className="py-20 md:py-32 px-4 relative overflow-hidden" id="features">
      {/* Background elements */}
      <div className="absolute -top-24 -right-24 opacity-20 z-0">
        <MorphingCircle 
          color="bg-indigo-500" 
          size="w-64 h-64" 
          duration={15} 
        />
      </div>
      <div className="absolute bottom-12 -left-20 opacity-20 z-0">
        <MorphingCircle 
          color="bg-purple-500" 
          size="w-48 h-48" 
          duration={12}
          delay={2}
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="overflow-hidden mb-4">
            <motion.div
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                ease: [0.33, 1, 0.68, 1],
              }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                How Middlesman Works
              </h2>
            </motion.div>
          </div>
          
          <motion.p 
            className="text-xl text-white/70 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Our platform provides a secure environment for business transactions
            with complete transparency and milestone-based payments.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <FloatingElement 
              key={index}
              amplitude={10}
              duration={6 + index}
              delay={index * 0.5}
              direction={index % 2 === 0 ? "y" : "both"}
            >
              <Parallax3DCard>
                <motion.div
                  className={`p-8 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-10 backdrop-blur-sm border border-white/10 shadow-xl h-full`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-lg">
                    {feature.description}
                  </p>
                </motion.div>
              </Parallax3DCard>
            </FloatingElement>
          ))}
        </div>
      </div>
    </section>
  );
}
