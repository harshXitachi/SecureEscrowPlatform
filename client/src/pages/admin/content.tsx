import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Redirect, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Edit, Trash, Save, Plus, File, CircleSlash } from "lucide-react";
import AdminNavigation from "@/components/admin/admin-navigation";

export default function AdminContentPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("content");
  const [contentType, setContentType] = useState("pages");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [contentAction, setContentAction] = useState<"edit" | "delete" | "create" | null>(null);
  const [formData, setFormData] = useState<any>({
    title: "",
    slug: "",
    content: "",
    category: "",
    subcategory: "",
    isPublished: true,
    metaTitle: "",
    metaDescription: "",
  });

  // Content Type Options
  const contentTypes = [
    { value: "pages", label: "Content Pages" },
    { value: "blog", label: "Blog Posts" },
    { value: "api_docs", label: "API Documentation" },
  ];

  // Fetch content
  const {
    data: contentData,
    isLoading: isLoadingContent,
    isError,
    error
  } = useQuery({
    queryKey: [`/api/content/${contentType}`, page, limit, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        queryParams.append("search", search);
      }
      
      const res = await fetch(`/api/content/${contentType}?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch ${contentType}`);
      return res.json();
    },
  });

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/content/${contentType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to create ${contentType.slice(0, -1)}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `${contentType.slice(0, -1)} created successfully`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to create ${contentType.slice(0, -1)}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/content/${contentType}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update ${contentType.slice(0, -1)}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `${contentType.slice(0, -1)} updated successfully`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to update ${contentType.slice(0, -1)}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/content/${contentType}/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to delete ${contentType.slice(0, -1)}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `${contentType.slice(0, -1)} deleted successfully`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to delete ${contentType.slice(0, -1)}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setSelectedContent(null);
    setContentAction(null);
    setFormData({
      title: "",
      slug: "",
      content: "",
      category: "",
      subcategory: "",
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
    });
  };

  // Handle content action
  const handleContentAction = (content: any, action: "edit" | "delete") => {
    setSelectedContent(content);
    setContentAction(action);
    
    if (action === "edit") {
      setFormData({
        title: content.title || "",
        slug: content.slug || "",
        content: content.content || "",
        category: content.category || "",
        subcategory: content.subcategory || "",
        isPublished: content.isPublished ?? true,
        metaTitle: content.metaTitle || "",
        metaDescription: content.metaDescription || "",
      });
    }
    
    setIsDialogOpen(true);
  };

  // Handle create content
  const handleCreateContent = () => {
    setContentAction("create");
    resetForm();
    setIsDialogOpen(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkbox/switch change
  const handleToggleChange = (name: string, value: boolean) => {
    setFormData({ ...formData, [name]: value });
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (contentAction === "delete" && selectedContent) {
      deleteContentMutation.mutate(selectedContent.id);
    } else if (contentAction === "create") {
      createContentMutation.mutate(formData);
    } else if (contentAction === "edit" && selectedContent) {
      updateContentMutation.mutate({
        id: selectedContent.id,
        data: formData,
      });
    }
  };

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  };

  // Redirect if not logged in
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check if admin access
  if (user.role !== "admin") {
    return <Redirect to="/admin" />;
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset page when searching
    setPage(1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Navigation */}
      <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 p-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Content Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage website content, blog posts, and documentation
            </p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Content Type Selector */}
        <Tabs 
          defaultValue="pages" 
          value={contentType} 
          onValueChange={(value) => {
            setContentType(value);
            setPage(1);
          }}
          className="mb-6"
        >
          <TabsList>
            {contentTypes.map(type => (
              <TabsTrigger key={type.value} value={type.value}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Search and Add */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder={`Search ${contentType}...`}
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-row gap-4">
                  <div className="w-28">
                    <Select
                      value={limit.toString()}
                      onValueChange={(value) => {
                        setLimit(parseInt(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit">Search</Button>
                </div>
              </form>
              <Button onClick={handleCreateContent} className="sm:ml-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Table */}
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{contentType}</CardTitle>
            <CardDescription>
              Manage {contentType === "pages" 
                ? "website pages and content" 
                : contentType === "blog" 
                  ? "blog posts and articles" 
                  : "API documentation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
              <div className="flex w-full items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Error loading content: {error?.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] })}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        {contentType === "pages" && <TableHead>Category</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentData?.items?.length > 0 ? (
                        contentData.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>{item.slug}</TableCell>
                            {contentType === "pages" && (
                              <TableCell>
                                {item.category}
                                {item.subcategory && `/${item.subcategory}`}
                              </TableCell>
                            )}
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.isPublished ? 
                                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              }`}>
                                {item.isPublished ? "Published" : "Draft"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleContentAction(item, "edit")}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleContentAction(item, "delete")}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={contentType === "pages" ? 7 : 6} className="text-center py-8">
                            No {contentType} found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {contentData?.pagination && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing page {page} of{" "}
                      {Math.ceil(contentData.pagination.total / limit)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          page >= Math.ceil(contentData.pagination.total / limit)
                        }
                        onClick={() =>
                          setPage((p) =>
                            Math.min(
                              Math.ceil(contentData.pagination.total / limit),
                              p + 1
                            )
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {contentAction === "create"
                ? `Create New ${contentType === "pages" ? "Page" : contentType === "blog" ? "Blog Post" : "API Documentation"}`
                : contentAction === "edit"
                ? `Edit ${contentType === "pages" ? "Page" : contentType === "blog" ? "Blog Post" : "API Documentation"}`
                : `Delete ${contentType === "pages" ? "Page" : contentType === "blog" ? "Blog Post" : "API Documentation"}`}
            </DialogTitle>
            <DialogDescription>
              {contentAction === "delete" ? (
                <>
                  Are you sure you want to delete <strong>{selectedContent?.title}</strong>?
                  This action cannot be undone.
                </>
              ) : (
                <>
                  {contentAction === "create" ? "Create a" : "Edit the"} {contentType === "pages" ? "page" : contentType === "blog" ? "blog post" : "API documentation"}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {contentAction !== "delete" && (
            <div className="py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (contentAction === "create") {
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: generateSlug(e.target.value),
                          metaTitle: e.target.value ? `${e.target.value} | Middlesman` : ""
                        });
                      }
                    }}
                    placeholder="Enter title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="enter-slug"
                  />
                </div>
              </div>

              {contentType === "pages" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      name="category"
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="resources">Resources</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      placeholder="Enter subcategory"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Enter content in Markdown format"
                  className="min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => handleToggleChange("isPublished", checked)}
                  />
                  <Label htmlFor="isPublished">
                    {formData.isPublished ? "Published" : "Draft"}
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="Enter meta title for SEO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Input
                    id="metaDescription"
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder="Enter meta description for SEO"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant={contentAction === "delete" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={
                deleteContentMutation.isPending || 
                createContentMutation.isPending || 
                updateContentMutation.isPending ||
                (contentAction !== "delete" && !formData.title)
              }
            >
              {deleteContentMutation.isPending || createContentMutation.isPending || updateContentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : contentAction === "delete" ? (
                <Trash className="mr-2 h-4 w-4" />
              ) : contentAction === "create" ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {contentAction === "delete"
                ? "Delete"
                : contentAction === "create"
                ? "Create"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}