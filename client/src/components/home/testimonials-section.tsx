import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Middlesman has transformed how we handle client projects. The milestone-based payments give both parties peace of mind, and the transparent process has improved our client relationships.",
    name: "Sarah Johnson",
    role: "Design Studio Owner",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=60&h=60"
  },
  {
    quote: "As a freelancer, getting paid can be a challenge. With Middlesman, I know my payment is secure, and I can focus on delivering quality work. The milestone system is brilliant for breaking down large projects.",
    name: "Mark Anderson",
    role: "Independent Developer",
    image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=60&h=60"
  },
  {
    quote: "We use Middlesman for all our international supplier payments. The platform's security features and escrow protection have eliminated payment disputes and greatly simplified our procurement process.",
    name: "Jessica Williams",
    role: "Procurement Manager",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=60&h=60"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-info/5 to-warning/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-darkBg mb-4">
            Trusted by Businesses Worldwide
          </h2>
          <p className="text-lg text-darkBg opacity-80 max-w-2xl mx-auto">
            See what our users have to say about their experience with Middlesman.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <GlassCard
              key={index}
              className="p-6"
              animate="slide-up"
              stagger={(index + 1) as 1 | 2 | 3}
            >
              <div className="flex items-center gap-2 mb-4 text-warning">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-darkBg opacity-90 mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-darkBg opacity-70">{testimonial.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
