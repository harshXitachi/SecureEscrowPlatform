import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        // Style headings
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold mb-4 mt-6" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-bold mb-3 mt-4" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-lg font-bold mb-2 mt-4" {...props} />
        ),
        
        // Style paragraphs and lists
        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-4" {...props} />,
        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        
        // Style links and blockquotes
        a: ({ node, ...props }) => (
          <a className="text-primary hover:underline" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />
        ),
        
        // Style code blocks with syntax highlighting
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <SyntaxHighlighter
              style={dracula}
              language={match[1]}
              PreTag="div"
              className="rounded-md my-4"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5" {...props}>
              {children}
            </code>
          );
        },
        
        // Style tables
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
        th: ({ node, ...props }) => (
          <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" 
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td className="px-6 py-4 whitespace-nowrap text-sm" {...props} />
        ),
        
        // Style horizontal rules
        hr: ({ node, ...props }) => <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;