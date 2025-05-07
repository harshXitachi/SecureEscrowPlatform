import { ProductPopupContent } from '@/components/ui/product-popup';

export const productContent: Record<string, ProductPopupContent> = {
  features: {
    title: "Powerful Escrow Features",
    description: "Our Escrow Features are strategically designed to ensure secure transactions between buyers and sellers. We combine robust security measures, transparent processes, and user-friendly interfaces to provide a trustworthy platform for all your transactions.",
    content: "",
    features: [
      "Milestone-based payment releases for large projects",
      "Multi-currency support with real-time conversion rates",
      "Secure document sharing and verification system",
      "Automated notifications for all transaction events",
      "Detailed transaction history and audit trails"
    ],
    benefits: [
      "Reduced risk for both buyers and sellers",
      "Greater confidence in high-value transactions",
      "Complete transparency throughout the transaction process",
      "Protection against fraud and non-delivery",
      "Fast dispute resolution with expert mediation"
    ],
    linkText: "Explore All Features",
    linkUrl: "/product/features"
  },
  
  pricing: {
    title: "Transparent Pricing",
    description: "Our pricing structure is designed to be transparent, fair, and competitive. We offer tiered rates based on transaction volumes with no hidden fees or complicated structures, ensuring you always know exactly what you're paying for.",
    content: "",
    features: [
      "Volume-based tiered pricing structure",
      "No monthly subscription fees - pay only for what you use",
      "Discounted rates for business and enterprise clients",
      "Clear fee structure with no hidden charges",
      "Flexible payment options for all users"
    ],
    benefits: [
      "Lower costs for higher volume transactions",
      "Budget predictability with transparent pricing",
      "Significant savings compared to traditional escrow services",
      "Only pay when transactions are successful",
      "Cost-effective protection for large transactions"
    ],
    linkText: "View Pricing Details",
    linkUrl: "/product/pricing"
  },
  
  integrations: {
    title: "Seamless Integrations",
    description: "Our platform is designed to work seamlessly with the tools and services your business already relies on. We've built powerful integrations that enhance your escrow experience and streamline your workflow.",
    content: "",
    features: [
      "Direct connections with major payment gateways",
      "API access for custom integration development",
      "Webhooks for real-time transaction events",
      "Integration with popular accounting software",
      "E-commerce platform plugins for major platforms"
    ],
    benefits: [
      "Streamlined workflow with existing business tools",
      "Reduced manual data entry and record keeping",
      "Enhanced reporting capabilities with your existing systems",
      "Faster transaction processing through integrated services",
      "Customized escrow experiences on your own platforms"
    ],
    linkText: "View All Integrations",
    linkUrl: "/product/integrations"
  },
  
  enterprise: {
    title: "Enterprise Solutions",
    description: "Our Enterprise Solutions provide customized escrow services designed to meet the specific needs of large organizations. We offer tailored workflows, enhanced security measures, and dedicated support to ensure your enterprise operations run smoothly.",
    content: "",
    features: [
      "Custom escrow workflows tailored to your business processes",
      "White-label solution with your branding",
      "Advanced security with role-based access controls",
      "Dedicated account management and support team",
      "Customized reporting and analytics"
    ],
    benefits: [
      "Seamless integration with your existing enterprise systems",
      "Enhanced protection for high-value B2B transactions",
      "Reduced operational risk and improved compliance",
      "Scalable solution that grows with your business",
      "Improved customer trust with enterprise-grade security"
    ],
    linkText: "Contact Enterprise Sales",
    linkUrl: "/product/enterprise"
  },
  
  security: {
    title: "Bank-level Security",
    description: "Security is at the core of everything we do. Our platform employs bank-level security measures to protect your transactions, data, and funds. We use industry-leading encryption, secure authentication, and robust monitoring to provide peace of mind.",
    content: "",
    features: [
      "AES-256 encryption for all data at rest",
      "Multi-factor authentication for all accounts",
      "Regular security audits and penetration testing",
      "Secure, segregated escrow accounts",
      "Advanced fraud detection systems"
    ],
    benefits: [
      "Complete protection of sensitive transaction data",
      "Confidence in the integrity of the escrow process",
      "Regulatory compliance with financial security standards",
      "Prevention of unauthorized access and transactions",
      "Early detection and prevention of fraudulent activity"
    ],
    linkText: "Learn More About Security",
    linkUrl: "/product/security"
  }
}; 