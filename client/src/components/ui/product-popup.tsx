import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './dialog';
import { Link } from 'wouter';
import { X, Check } from 'lucide-react';
import MarkdownRenderer from './markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';

export interface ProductPopupContent {
  title: string;
  description: string;
  content: string;
  features?: string[];
  benefits?: string[];
  linkText: string;
  linkUrl: string;
}

interface ProductPopupProps {
  isOpen: boolean;
  onClose: () => void;
  content: ProductPopupContent;
}

const ProductPopup: React.FC<ProductPopupProps> = ({ isOpen, onClose, content }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
      setAnimationComplete(false);
    }
  }, [isOpen]);

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden bg-[#14213D] border-none p-0 rounded-lg shadow-xl">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="h-full w-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }
              }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
              onAnimationComplete={() => setAnimationComplete(true)}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 flex items-center justify-center rounded-md">
                    <span className="text-blue-400 text-xl font-bold">$</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{content.title}</h2>
                </div>
                <motion.button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Scrollable content area */}
              <div className="flex-1 overflow-y-auto px-6 scrollbar-thin">
                {/* Description */}
                <motion.p
                  className="text-gray-300 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {content.description}
                </motion.p>

                {/* Features section */}
                {content.features && content.features.length > 0 && (
                  <motion.div
                    className="mb-6"
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

                {/* Benefits section */}
                {content.benefits && content.benefits.length > 0 && (
                  <motion.div
                    className="mb-6"
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
                {content.content && !content.features && !content.benefits && (
                  <motion.div
                    className="prose prose-invert max-w-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <MarkdownRenderer content={content.content} />
                  </motion.div>
                )}
              </div>
              
              {/* Button area */}
              <motion.div 
                className="p-6 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link href={content.linkUrl}>
                  <motion.button 
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md font-medium shadow-md"
                    onClick={onClose}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: "0 0 15px 2px rgba(59, 130, 246, 0.5)"
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {content.linkText}
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPopup; 