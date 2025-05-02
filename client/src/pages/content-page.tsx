import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Helmet } from "react-helmet";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { Loader2 } from "lucide-react";

export function ContentPage() {
  // Get the page category, subcategory and slug from the URL
  // URL pattern: /content/:category/:subcategory/:slug
  const params = useParams();
  const category = params.category;
  const subcategory = params.subcategory;
  const slug = params.slug;

  // If we have a slug, fetch the specific page
  const { data: pageData, isLoading: pageLoading } = useQuery({
    queryKey: [`/api/content/pages/${slug}`],
    enabled: !!slug,
  });

  // If we don't have a slug but have category/subcategory, fetch by those
  const { data: categoryPageData, isLoading: categoryLoading } = useQuery({
    queryKey: [`/api/content/${category}/${subcategory}`],
    enabled: !slug && !!category && !!subcategory,
  });

  // Determine which data to use
  const contentData = pageData || (Array.isArray(categoryPageData) ? categoryPageData[0] : categoryPageData);
  const isLoading = slug ? pageLoading : categoryLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Content not found</h1>
        <p>We couldn't find the content you're looking for.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{contentData.metaTitle || contentData.title}</title>
        <meta name="description" content={contentData.metaDescription || "Middlesman Escrow Service"} />
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg dark:prose-invert mx-auto">
          <MarkdownRenderer content={contentData.content} />
        </div>
      </div>
    </>
  );
}

export default ContentPage;