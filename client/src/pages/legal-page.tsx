import React, { useEffect } from 'react';
import { legalContent, LegalPageContent } from '@/lib/legal-content';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';

interface LegalPageProps {
  section: 'terms' | 'privacy';
}

const LegalPage: React.FC<LegalPageProps> = ({ section }) => {
  // Get the content for the selected section
  const content = legalContent[section];
  
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
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Clock className="h-4 w-4 mr-2" />
            <span>Last updated: {content.lastUpdated}</span>
          </div>
          
          <div className="prose prose-invert prose-lg max-w-none">
            <MarkdownRenderer content={content.content} />
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              If you have any questions about our {section === 'terms' ? 'Terms of Service' : 'Privacy Policy'}, 
              please contact us at{' '}
              <a 
                href={`mailto:${section === 'terms' ? 'legal' : 'privacy'}@middlesman.com`} 
                className="text-blue-400 hover:underline"
              >
                {section === 'terms' ? 'legal' : 'privacy'}@middlesman.com
              </a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LegalPage; 