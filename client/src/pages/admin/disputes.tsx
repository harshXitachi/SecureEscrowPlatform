import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Eye, ThumbsUp, ThumbsDown, ArrowLeft, BarChart2, FileText } from "lucide-react";
import AdminNavigation from "@/components/admin/admin-navigation";

export default function AdminDisputesPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("disputes");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"favor_buyer" | "favor_seller" | "details" | null>(null);
  const [resolution, setResolution] = useState({
    decision: "",
    amount: 0,
    notes: "",
  });

  // Fetch disputes
  const {
    data: disputesData,
    isLoading: isLoadingDisputes,
    isError,
    error
  } = useQuery({
    queryKey: ["/api/admin/disputes", page, limit, status, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status && status !== "all") {
        queryParams.append("status", status);
      }
      
      if (search) {
        queryParams.append("search", search);
      }
      
      const res = await fetch(`/api/admin/disputes?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch disputes");
      return res.json();
    },
  });

  // Fetch dispute details
  const fetchDisputeDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/disputes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch dispute details");
      const data = await res.json();
      setSelectedDispute(data);
      setModalAction("details");
      setIsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ 
      disputeId, 
      resolution 
    }: { 
      disputeId: number; 
      resolution: { decision: string; amount: number; notes: string } 
    }) => {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          resolution: resolution.decision,
          resolutionAmount: resolution.amount,
          resolutionNotes: resolution.notes
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to resolve dispute");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute resolved",
        description: "The dispute has been successfully resolved",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      setIsDialogOpen(false);
      setSelectedDispute(null);
      setModalAction(null);
      setResolution({
        decision: "",
        amount: 0,
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resolve dispute",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle dispute action
  const handleDisputeAction = (dispute: any, action: "favor_buyer" | "favor_seller") => {
    setSelectedDispute(dispute);
    setModalAction(action);
    setResolution({
      decision: action === "favor_buyer" ? "buyer" : "seller",
      amount: dispute.transaction?.amount || 0,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (!selectedDispute) return;
    
    if (!resolution.notes) {
      toast({
        title: "Notes required",
        description: "Please provide resolution notes",
        variant: "destructive",
      });
      return;
    }
    
    resolveDisputeMutation.mutate({
      disputeId: selectedDispute.id,
      resolution,
    });
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
    return <Redirect to="/admin/login" />;
  }

  // Check if admin access
  if (user.role !== "admin") {
    return <Redirect to="/admin/login" />;
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      escalated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    
    return statusColors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

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
      <div className="flex-1 p-8 pt-6 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Dispute Resolution</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Review and resolve user disputes
            </p>
          </div>
          <Button className="mt-4 sm:mt-0" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Dispute Status Selector */}
        <Tabs 
          defaultValue="all" 
          value={status} 
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">All Disputes</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="under_review">Under Review</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by dispute ID, buyer or seller name..."
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
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Disputes</CardTitle>
            <CardDescription>
              Review and resolve disputes between buyers and sellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDisputes ? (
              <div className="flex w-full items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Error loading disputes: {error?.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] })}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Raised By</TableHead>
                        <TableHead>Against</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disputesData?.disputes?.length > 0 ? (
                        disputesData.disputes.map((dispute: any) => (
                          <TableRow key={dispute.id}>
                            <TableCell>#{dispute.id}</TableCell>
                            <TableCell>#{dispute.transactionId}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(dispute.transaction?.amount || 0)}
                            </TableCell>
                            <TableCell>{dispute.raisedBy?.username || "Unknown"}</TableCell>
                            <TableCell>{dispute.againstUser?.username || "Unknown"}</TableCell>
                            <TableCell>
                              {formatDate(dispute.createdAt)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                getStatusColor(dispute.status)
                              }`}>
                                {dispute.status.replace("_", " ")}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => fetchDisputeDetails(dispute.id)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {(dispute.status === "open" || dispute.status === "under_review") && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-green-500 hover:text-green-600"
                                      onClick={() => handleDisputeAction(dispute, "favor_buyer")}
                                      title="Favor Buyer"
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 hover:text-red-600"
                                      onClick={() => handleDisputeAction(dispute, "favor_seller")}
                                      title="Favor Seller"
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            No disputes found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {disputesData?.pagination && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing page {page} of{" "}
                      {Math.ceil(disputesData.pagination.total / limit)}
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
                          page >= Math.ceil(disputesData.pagination.total / limit)
                        }
                        onClick={() =>
                          setPage((p) =>
                            Math.min(
                              Math.ceil(disputesData.pagination.total / limit),
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

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalAction === "favor_buyer"
                ? "Resolve in Favor of Buyer"
                : modalAction === "favor_seller"
                ? "Resolve in Favor of Seller"
                : "Dispute Details"}
            </DialogTitle>
            <DialogDescription>
              {modalAction === "favor_buyer" ? (
                "Resolve this dispute in favor of the buyer"
              ) : modalAction === "favor_seller" ? (
                "Resolve this dispute in favor of the seller"
              ) : (
                "View dispute details"
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="py-4">
              {modalAction === "details" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dispute ID</h3>
                      <p>#{selectedDispute.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</h3>
                      <p>#{selectedDispute.transactionId}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Raised By</h3>
                      <p>{selectedDispute.raisedBy?.username || "Unknown"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Against</h3>
                      <p>{selectedDispute.againstUser?.username || "Unknown"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                      <p className="font-semibold">{formatCurrency(selectedDispute.transaction?.amount || 0)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                        getStatusColor(selectedDispute.status)
                      }`}>
                        {selectedDispute.status.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                      <p>{formatDate(selectedDispute.createdAt)}</p>
                    </div>
                    {selectedDispute.resolvedAt && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</h3>
                        <p>{formatDate(selectedDispute.resolvedAt)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Reason</h3>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-sm">{selectedDispute.reason || "No reason provided"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <p className="text-sm">{selectedDispute.description || "No description provided"}</p>
                    </div>
                  </div>
                  
                  {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Evidence</h3>
                      <div className="space-y-2">
                        {selectedDispute.evidence.map((item: any) => (
                          <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center">
                            <FileText className="h-5 w-5 text-blue-500 mr-2" />
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium">{item.title}</p>
                                <span className="text-xs text-gray-500">
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{item.description}</p>
                              {item.fileUrl && (
                                <a 
                                  href={item.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline text-sm mt-1 inline-block"
                                >
                                  View attachment
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedDispute.resolution && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Resolution</h3>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between">
                          <p className="font-medium">
                            Resolved in favor of: {selectedDispute.resolution === "buyer" ? "Buyer" : "Seller"}
                          </p>
                          <span className="font-semibold">
                            {formatCurrency(selectedDispute.resolutionAmount || 0)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{selectedDispute.resolutionNotes || "No notes provided"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dispute ID</h3>
                      <p>#{selectedDispute.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</h3>
                      <p>#{selectedDispute.transactionId}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Raised By</h3>
                      <p>{selectedDispute.raisedBy?.username || "Unknown"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Against</h3>
                      <p>{selectedDispute.againstUser?.username || "Unknown"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium block">
                      Resolution Amount
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      value={resolution.amount}
                      onChange={(e) => setResolution({ 
                        ...resolution, 
                        amount: parseFloat(e.target.value) || 0
                      })}
                      placeholder="Enter amount to refund/release"
                    />
                    <p className="text-xs text-gray-500">
                      {modalAction === "favor_buyer" 
                        ? "Amount to refund to the buyer" 
                        : "Amount to release to the seller"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="resolutionNotes" className="text-sm font-medium block">
                      Resolution Notes
                    </label>
                    <Textarea
                      id="resolutionNotes"
                      placeholder="Enter detailed resolution notes"
                      value={resolution.notes}
                      onChange={(e) => setResolution({
                        ...resolution,
                        notes: e.target.value
                      })}
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedDispute(null);
                setModalAction(null);
                setResolution({
                  decision: "",
                  amount: 0,
                  notes: "",
                });
              }}
            >
              {modalAction === "details" ? "Close" : "Cancel"}
            </Button>
            
            {modalAction !== "details" && (
              <Button
                variant={modalAction === "favor_buyer" ? "default" : "destructive"}
                onClick={handleConfirmAction}
                disabled={
                  resolveDisputeMutation.isPending || 
                  !resolution.notes ||
                  resolution.amount <= 0
                }
              >
                {resolveDisputeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : modalAction === "favor_buyer" ? (
                  <ThumbsUp className="mr-2 h-4 w-4" />
                ) : (
                  <ThumbsDown className="mr-2 h-4 w-4" />
                )}
                {modalAction === "favor_buyer"
                  ? "Resolve for Buyer"
                  : "Resolve for Seller"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}