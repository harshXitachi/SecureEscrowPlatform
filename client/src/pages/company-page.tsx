import React, { useEffect } from 'react';
import { companyContent, CompanyPageContent } from '@/lib/company-content';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface CompanyPageProps {
  section: 'about' | 'careers' | 'partners';
}

const CompanyPage: React.FC<CompanyPageProps> = ({ section }) => {
  // Get the content for the selected section
  const content = companyContent[section];
  
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
          <p className="text-xl text-blue-300 mb-6">{content.subtitle}</p>
          <p className="text-gray-300 max-w-2xl mx-auto">{content.description}</p>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="glass-card p-8 rounded-xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {content.imageSrc && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <img 
                src={content.imageSrc} 
                alt={content.title} 
                className="w-full h-auto object-cover" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="prose prose-invert prose-lg max-w-none">
            <MarkdownRenderer content={content.content} />
          </div>
          
          {section === 'careers' && (
            <div className="mt-8 flex justify-center">
              <a 
                href="#job-listings" 
                className="px-6 py-3 bg-primary rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                View Open Positions
              </a>
            </div>
          )}
          
          {section === 'partners' && (
            <div className="mt-8 flex justify-center">
              <a 
                href="#partner-form" 
                className="px-6 py-3 bg-primary rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Become a Partner
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CompanyPage; 