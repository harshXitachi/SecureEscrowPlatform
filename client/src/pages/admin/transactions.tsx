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
import { Loader2, Search, Eye, ThumbsUp, ThumbsDown, AlertCircle, Banknote, ArrowLeft } from "lucide-react";
import AdminNavigation from "@/components/admin/admin-navigation";

export default function AdminTransactionsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transactions");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | "refund" | "details" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    isError,
    error
  } = useQuery({
    queryKey: ["/api/admin/transactions", page, limit, status, search],
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
      
      const res = await fetch(`/api/admin/transactions?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // Fetch transaction details
  const fetchTransactionDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch transaction details");
      const data = await res.json();
      setSelectedTransaction(data);
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

  // Approve transaction mutation
  const approveTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const res = await fetch(`/api/marketplace/transactions/${transactionId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to approve transaction");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction approved",
        description: "Funds have been released to the seller",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setIsDialogOpen(false);
      setSelectedTransaction(null);
      setModalAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject transaction mutation
  const rejectTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: number; reason: string }) => {
      const res = await fetch(`/api/marketplace/transactions/${transactionId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to reject transaction");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction rejected",
        description: "Funds have been returned to the buyer",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      setIsDialogOpen(false);
      setSelectedTransaction(null);
      setModalAction(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject transaction",
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

  // Handle transaction action
  const handleTransactionAction = (transaction: any, action: "approve" | "reject" | "refund") => {
    setSelectedTransaction(transaction);
    setModalAction(action);
    if (action === "reject" || action === "refund") {
      setRejectionReason("");
    }
    setIsDialogOpen(true);
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (!selectedTransaction) return;
    
    if (modalAction === "approve") {
      approveTransactionMutation.mutate(selectedTransaction.id);
    } else if (modalAction === "reject" || modalAction === "refund") {
      if (!rejectionReason) {
        toast({
          title: "Reason required",
          description: "Please provide a reason for rejecting this transaction",
          variant: "destructive",
        });
        return;
      }
      
      rejectTransactionMutation.mutate({
        transactionId: selectedTransaction.id,
        reason: rejectionReason,
      });
    }
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
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      disputed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      refunded: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
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
            <h2 className="text-3xl font-bold">Transaction Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage all transactions in the system
            </p>
          </div>
          <Button className="mt-4 sm:mt-0" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Transaction Type Selector */}
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
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="disputed">Disputed</TabsTrigger>
            <TabsTrigger value="refunded">Refunded</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by transaction ID, buyer or seller name..."
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

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              View and manage all transactions on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex w-full items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Error loading transactions: {error?.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] })}
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
                        <TableHead>Amount</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData?.transactions?.length > 0 ? (
                        transactionsData.transactions.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>#{transaction.id}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>{transaction.buyer?.username || "Unknown"}</TableCell>
                            <TableCell>{transaction.seller?.username || "Unknown"}</TableCell>
                            <TableCell>
                              {formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                getStatusColor(transaction.status)
                              }`}>
                                {transaction.status.replace("_", " ")}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => fetchTransactionDetails(transaction.id)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {transaction.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-green-500 hover:text-green-600"
                                      onClick={() => handleTransactionAction(transaction, "approve")}
                                      title="Approve Transaction"
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 hover:text-red-600"
                                      onClick={() => handleTransactionAction(transaction, "reject")}
                                      title="Reject Transaction"
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                
                                {transaction.status === "in_progress" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-orange-500 hover:text-orange-600"
                                    onClick={() => handleTransactionAction(transaction, "refund")}
                                    title="Refund Transaction"
                                  >
                                    <Banknote className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {transactionsData?.pagination && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing page {page} of{" "}
                      {Math.ceil(transactionsData.pagination.total / limit)}
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
                          page >= Math.ceil(transactionsData.pagination.total / limit)
                        }
                        onClick={() =>
                          setPage((p) =>
                            Math.min(
                              Math.ceil(transactionsData.pagination.total / limit),
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
              {modalAction === "approve"
                ? "Approve Transaction"
                : modalAction === "reject"
                ? "Reject Transaction"
                : modalAction === "refund"
                ? "Refund Transaction"
                : "Transaction Details"}
            </DialogTitle>
            <DialogDescription>
              {modalAction === "approve" ? (
                "Are you sure you want to approve this transaction? This will release funds to the seller."
              ) : modalAction === "reject" ? (
                "Are you sure you want to reject this transaction? This will return funds to the buyer."
              ) : modalAction === "refund" ? (
                "Are you sure you want to refund this transaction? This will return funds to the buyer."
              ) : (
                "View transaction details"
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="py-4">
              {modalAction === "details" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</h3>
                      <p>#{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                      <p className="font-semibold">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Buyer</h3>
                      <p>{selectedTransaction.buyer?.username || "Unknown"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Seller</h3>
                      <p>{selectedTransaction.seller?.username || "Unknown"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
                      <p>{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                        getStatusColor(selectedTransaction.status)
                      }`}>
                        {selectedTransaction.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                    <p className="text-sm">{selectedTransaction.description || "No description provided"}</p>
                  </div>
                  
                  {selectedTransaction.milestones && selectedTransaction.milestones.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Milestones</h3>
                      <div className="space-y-2">
                        {selectedTransaction.milestones.map((milestone: any) => (
                          <div key={milestone.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="flex justify-between">
                              <span className="font-medium">{milestone.title}</span>
                              <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                getStatusColor(milestone.status)
                              }`}>
                                {milestone.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{milestone.description}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Due: {formatDate(milestone.dueDate)}
                              </span>
                              <span className="font-medium">{formatCurrency(milestone.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTransaction.disputeId && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-red-700 dark:text-red-400">
                          This transaction has an active dispute (#{selectedTransaction.disputeId})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (modalAction === "reject" || modalAction === "refund") ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</h3>
                      <p>#{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                      <p className="font-semibold">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="rejectionReason" className="text-sm font-medium block">
                      Reason for {modalAction === "reject" ? "rejection" : "refund"}
                    </label>
                    <Textarea
                      id="rejectionReason"
                      placeholder={`Enter reason for ${modalAction === "reject" ? "rejecting" : "refunding"} this transaction`}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</h3>
                      <p>#{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</h3>
                      <p className="font-semibold">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
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
                setSelectedTransaction(null);
                setModalAction(null);
                setRejectionReason("");
              }}
            >
              {modalAction === "details" ? "Close" : "Cancel"}
            </Button>
            
            {modalAction !== "details" && (
              <Button
                variant={modalAction === "approve" ? "default" : "destructive"}
                onClick={handleConfirmAction}
                disabled={
                  approveTransactionMutation.isPending || 
                  rejectTransactionMutation.isPending ||
                  ((modalAction === "reject" || modalAction === "refund") && !rejectionReason)
                }
              >
                {approveTransactionMutation.isPending || rejectTransactionMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : modalAction === "approve" ? (
                  <ThumbsUp className="mr-2 h-4 w-4" />
                ) : (
                  <ThumbsDown className="mr-2 h-4 w-4" />
                )}
                {modalAction === "approve"
                  ? "Approve Transaction"
                  : modalAction === "reject"
                  ? "Reject Transaction"
                  : "Refund Transaction"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}