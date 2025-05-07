import React, { useEffect } from 'react';
import { productContent } from '@/lib/product-content';
import { ProductPopupContent } from '@/components/ui/product-popup';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

interface ProductPageProps {
  section: 'features' | 'pricing' | 'integrations' | 'enterprise' | 'security';
}

const ProductPage: React.FC<ProductPageProps> = ({ section }) => {
  // Get the content for the selected section
  const content = productContent[section];
  
  useEffect(() => {
    // Scroll to top when the page loads
    window.scrollTo(0, 0);
    
    // Set page title
    document.title = `${content.title} | Middlesman`;
  }, [content.title]);

  if (!content) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-deepBlack to-darkBlue min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">{content.title}</h1>
          <p className="text-xl text-blue-300 mb-6">{content.description}</p>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="glass-card p-8 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Features List */}
          {content.features && content.features.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-blue-400 font-bold mb-3 text-lg">Key Features</h3>
              <ul className="space-y-2">
                {content.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mr-2" />
                    <span className="text-gray-200">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Benefits List */}
          {content.benefits && content.benefits.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-purple-400 font-bold mb-3 text-lg">Benefits</h3>
              <ul className="space-y-2">
                {content.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                  >
                    <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mr-2" />
                    <span className="text-gray-200">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
          
          {/* Markdown content */}
          {content.content && (
            <motion.div
              className="prose prose-invert max-w-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MarkdownRenderer content={content.content} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProductPage; 