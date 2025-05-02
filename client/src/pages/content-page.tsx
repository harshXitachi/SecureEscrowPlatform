import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ContentPage as ContentPageType } from '@shared/schema';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { Loader2 } from 'lucide-react';

interface ContentPageProps {
  category: string;
  subcategory: string;
  slug?: string;
}

const ContentPage: React.FC<ContentPageProps> = ({ category, subcategory, slug }) => {
  // Derived path for the API call
  const contentPath = slug 
    ? `/api/pages/${slug}`
    : `/api/${category}/${subcategory}`;

  // Fetch content from API
  const { data, isLoading, error } = useQuery<ContentPageType>({
    queryKey: [contentPath],
    enabled: !!category && !!subcategory
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Content Not Found</h1>
        <p className="text-lg text-gray-600 mb-8">
          We couldn't find the content you're looking for. Please try another page or contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">{data.title}</h1>
        {data.metaDescription && (
          <p className="text-xl text-gray-600">{data.metaDescription}</p>
        )}
      </div>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer content={data.content} />
      </div>
      
      {data.updatedAt && (
        <div className="mt-12 pt-4 border-t border-gray-200 text-sm text-gray-500">
          Last updated: {new Date(data.updatedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ContentPage;