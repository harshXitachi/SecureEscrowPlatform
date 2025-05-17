import { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Milestone, BrokerRequest } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Bell, MessageCircle, ClipboardList, UserPlus, AlertCircle } from "lucide-react";
import BrokerRequestModal from "@/components/ui/broker-request-modal";
import CreateTransactionModal from "@/components/ui/create-transaction-modal";
import { useToast } from "@/hooks/use-toast";

export default function BrokerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRequest, setSelectedRequest] = useState<BrokerRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | undefined>(undefined);
  
  // Fetch user transactions from the API
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });
  
  // Fetch broker requests
  const { data: brokerRequests, isLoading: isLoadingRequests } = useQuery<BrokerRequest[]>({
    queryKey: ["/api/broker-requests"],
    enabled: !!user,
  });
  
  // Handle accepting a broker request
  const handleAcceptRequest = (requestId: number) => {
    // In a real implementation, we would update the request status in the API
    toast({
      title: "Request Accepted",
      description: "You can now create a transaction for this buyer.",
      variant: "default",
    });
    
    // Find the request to get the buyer ID
    const request = brokerRequests?.find(r => r.id === requestId);
    if (request) {
      setSelectedBuyerId(request.buyerId);
      // Show transaction creation modal after a brief delay
      setTimeout(() => {
        setIsTransactionModalOpen(true);
      }, 500);
    }
  };
  
  // Handle rejecting a broker request
  const handleRejectRequest = (requestId: number) => {
    // In a real implementation, we would update the request status in the API
    toast({
      title: "Request Rejected",
      description: "The buyer will be notified that you've declined their request.",
      variant: "default",
    });
  };
  
  // Handle transaction creation
  const handleTransactionCreated = (transactionId: number) => {
    toast({
      title: "Transaction Created",
      description: "A new escrow transaction has been created successfully.",
      variant: "default",
    });
    setActiveTab("overview");
  };
  
  // Calculate pending broker requests count
  const pendingRequestsCount = brokerRequests?.filter(req => req.status === "pending").length || 0;
  
  // Mock broker requests for UI demonstration
  const mockBrokerRequests: BrokerRequest[] = [
    {
      id: 1,
      buyerId: 101,
      buyer: { id: 101, username: "john_buyer", rating: 4.7 },
      brokerId: user?.id || 0,
      broker: { id: user?.id || 0, username: user?.username || "broker" },
      status: "pending",
      message: "Hi, I need an escrow agent for a website development project with a new seller.",
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      buyerId: 102,
      buyer: { id: 102, username: "alice_shopping", rating: 4.9 },
      brokerId: user?.id || 0,
      broker: { id: user?.id || 0, username: user?.username || "broker" },
      status: "pending",
      message: "Looking for a trusted broker for a product photography service. Budget $500.",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      buyerId: 103,
      buyer: { id: 103, username: "tech_buyer", rating: 4.5 },
      brokerId: user?.id || 0,
      broker: { id: user?.id || 0, username: user?.username || "broker" },
      status: "accepted",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];
  
  // Use mock data until API is ready
  const requestsToDisplay = brokerRequests?.length ? brokerRequests : mockBrokerRequests;
  
  // Calculate earnings based on real transaction data
  const calculateEarnings = () => {
    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        pending: 0,
        thisMonth: 0,
        lastMonth: 0
      };
    }
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Assuming 5% commission on each transaction
    const commissionRate = 0.05;
    
    // Calculate total earnings (all transactions)
    const total = transactions.reduce((sum, tx) => {
      return sum + (parseFloat(tx.amount) * commissionRate);
    }, 0);
    
    // Calculate pending earnings (active transactions)
    const pending = transactions
      .filter(tx => tx.status === "active" || tx.status === "pending")
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) * commissionRate), 0);
    
    // Calculate this month's earnings
    const thisMonthEarnings = transactions
      .filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) * commissionRate), 0);
    
    // Calculate last month's earnings
    const lastMonthEarnings = transactions
      .filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, tx) => sum + (parseFloat(tx.amount) * commissionRate), 0);
    
    return {
      total,
      pending,
      thisMonth: thisMonthEarnings,
      lastMonth: lastMonthEarnings
    };
  };
  
  // Extract unique clients from transactions
  const extractClients = () => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    const buyerMap = new Map();
    const sellerMap = new Map();
    
    // Process each transaction to collect unique clients and their info
    transactions.forEach(tx => {
      // Process buyer
      if (!buyerMap.has(tx.buyer.id)) {
        buyerMap.set(tx.buyer.id, {
          id: tx.buyer.id,
          name: tx.buyer.username,
          role: "buyer",
          transactions: 1,
          totalValue: parseFloat(tx.amount)
        });
      } else {
        const existingBuyer = buyerMap.get(tx.buyer.id);
        existingBuyer.transactions += 1;
        existingBuyer.totalValue += parseFloat(tx.amount);
      }
      
      // Process seller
      if (!sellerMap.has(tx.seller.id)) {
        sellerMap.set(tx.seller.id, {
          id: tx.seller.id,
          name: tx.seller.username,
          role: "seller",
          transactions: 1,
          totalValue: parseFloat(tx.amount)
        });
      } else {
        const existingSeller = sellerMap.get(tx.seller.id);
        existingSeller.transactions += 1;
        existingSeller.totalValue += parseFloat(tx.amount);
      }
    });
    
    // Combine and return all clients
    return [...Array.from(buyerMap.values()), ...Array.from(sellerMap.values())];
  };
  
  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    const statusMap: {[key: string]: {color: string; text: string}} = {
      "active": { color: "bg-blue-500/20 text-blue-400", text: "Active" },
      "pending": { color: "bg-gray-500/20 text-gray-400", text: "Pending" },
      "completed": { color: "bg-green-500/20 text-green-400", text: "Completed" },
      "warning": { color: "bg-yellow-500/20 text-yellow-400", text: "Warning" },
      "buyer": { color: "bg-cyan-500/20 text-cyan-400", text: "Buyer" },
      "seller": { color: "bg-pink-500/20 text-pink-400", text: "Seller" },
    };
    
    const { color, text } = statusMap[status] || { color: "bg-gray-500/20 text-gray-400", text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };
  
  // Get calculated data
  const earningsData = calculateEarnings();
  const clients = extractClients();
  
  return (
    <>
      <DashboardLayout title="Broker Dashboard" subtitle="Manage transactions and resolve disputes">
        <Helmet>
          <title>Broker Dashboard | Middlesman</title>
        </Helmet>
        
        <div className="mb-6">
          <div className="inline-flex bg-white/5 p-1 rounded-lg">
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "overview" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors relative ${
                activeTab === "requests" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("requests")}
            >
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "disputes" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("disputes")}
            >
              Disputes
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "earnings" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("earnings")}
            >
              Earnings
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "clients" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("clients")}
            >
              Clients
            </button>
          </div>
        </div>
        
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "requests" ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Broker Requests</h2>
                <GlassButton 
                  onClick={() => setIsTransactionModalOpen(true)}
                >
                  Create Transaction
                </GlassButton>
              </div>
              
              {isLoadingRequests ? (
                <GlassCard className="p-6">
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </GlassCard>
              ) : !requestsToDisplay || requestsToDisplay.length === 0 ? (
                <GlassCard className="p-6">
                  <div className="text-center py-10">
                    <h3 className="text-xl font-semibold text-white mb-2">No Broker Requests</h3>
                    <p className="text-white/70 mb-6">You haven't received any broker requests yet.</p>
                  </div>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {/* Pending Requests Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white/90 mb-3">Pending Requests</h3>
                    <div className="space-y-3">
                      {requestsToDisplay
                        .filter(req => req.status === "pending")
                        .map(request => (
                          <GlassCard 
                            key={request.id} 
                            className="p-4 border-l-4 border-yellow-500 hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsRequestModalOpen(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-white font-medium">
                                    {request.buyer.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">{request.buyer.username}</h4>
                                  <p className="text-white/60 text-xs">Requested: {formatTimeAgo(new Date(request.createdAt))}</p>
                                </div>
                              </div>
                              <div className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">
                                Pending
                              </div>
                            </div>
                            {request.message && (
                              <div className="mt-2 pl-13">
                                <p className="text-white/80 text-sm">
                                  {request.message.length > 100 
                                    ? `${request.message.substring(0, 100)}...` 
                                    : request.message}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex justify-end space-x-2">
                              <GlassButton 
                                variant="outline" 
                                size="sm" 
                                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                  handleRejectRequest(request.id);
                                }}
                              >
                                Reject
                              </GlassButton>
                              <GlassButton 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                  handleAcceptRequest(request.id);
                                }}
                              >
                                Accept
                              </GlassButton>
                            </div>
                          </GlassCard>
                        ))}
                      
                      {requestsToDisplay.filter(req => req.status === "pending").length === 0 && (
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <p className="text-white/70">No pending requests</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Accepted Requests Section */}
                  <div>
                    <h3 className="text-lg font-medium text-white/90 mb-3">Accepted Requests</h3>
                    <div className="space-y-3">
                      {requestsToDisplay
                        .filter(req => req.status === "accepted")
                        .map(request => (
                          <GlassCard 
                            key={request.id} 
                            className="p-4 border-l-4 border-green-500"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="bg-primary/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-white font-medium">
                                    {request.buyer.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">{request.buyer.username}</h4>
                                  <p className="text-white/60 text-xs">Accepted: {formatTimeAgo(new Date(request.updatedAt))}</p>
                                </div>
                              </div>
                              <div className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">
                                Accepted
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end space-x-2">
                              <GlassButton 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </GlassButton>
                              <GlassButton 
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  setSelectedBuyerId(request.buyerId);
                                  setIsTransactionModalOpen(true);
                                }}
                              >
                                <ClipboardList className="w-4 h-4" />
                                Create Transaction
                              </GlassButton>
                            </div>
                          </GlassCard>
                        ))}
                      
                      {requestsToDisplay.filter(req => req.status === "accepted").length === 0 && (
                        <div className="bg-white/5 rounded-lg p-4 text-center">
                          <p className="text-white/70">No accepted requests</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "overview" ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Active Transactions</h2>
                  {pendingRequestsCount > 0 && (
                    <GlassButton 
                      onClick={() => setActiveTab("requests")}
                      className="flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      {pendingRequestsCount} New Request{pendingRequestsCount > 1 ? 's' : ''}
                    </GlassButton>
                  )}
                </div>
                
                {isLoadingTransactions ? (
                  <GlassCard className="p-6">
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </GlassCard>
                ) : !transactions || transactions.length === 0 ? (
                  <GlassCard className="p-6">
                    <div className="text-center py-10">
                      <h3 className="text-xl font-semibold text-white mb-2">No Active Transactions</h3>
                      <p className="text-white/70 mb-6">There are no active transactions to manage.</p>
                      <Link href="/create-transaction">
                        <GlassButton>Create New Transaction</GlassButton>
                      </Link>
                    </div>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    {transactions
                      .filter(transaction => transaction.status === "active" || transaction.status === "pending" || transaction.status === "warning")
                      .map((transaction) => (
                        <GlassCard key={transaction.id} className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">{transaction.title}</h3>
                              <p className="text-white/70 text-sm">ID: {transaction.id} • Created: {formatDate(transaction.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-white">${parseFloat(transaction.amount).toFixed(2)}</p>
                              <div className="mt-1">{renderStatusBadge(transaction.status)}</div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-y-2 justify-between mb-4">
                            <div className="w-full sm:w-auto">
                              <p className="text-white/70 text-sm">Buyer: <span className="text-white">{transaction.buyer.username}</span></p>
                            </div>
                            <div className="w-full sm:w-auto">
                              <p className="text-white/70 text-sm">Seller: <span className="text-white">{transaction.seller.username}</span></p>
                            </div>
                            <div className="w-full sm:w-auto">
                              <p className="text-white/70 text-sm">Your Commission: <span className="text-white">${(parseFloat(transaction.amount) * 0.05).toFixed(2)}</span></p>
                            </div>
                          </div>
                          
                          {transaction.status === "warning" && (
                            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-yellow-400 text-sm font-medium mb-1">Potential Issue:</p>
                              <p className="text-white/90 text-sm">This transaction may require your attention.</p>
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-end gap-3">
                            <Link href={`/transactions/${transaction.id}`}>
                              <GlassButton variant="outline" size="sm">View Details</GlassButton>
                            </Link>
                            {transaction.status === "warning" ? (
                              <GlassButton size="sm">Resolve Issue</GlassButton>
                            ) : (
                              <GlassButton size="sm">Verify Transaction</GlassButton>
                            )}
                          </div>
                        </GlassCard>
                      ))}
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Earnings Overview</h2>
                <GlassCard className="p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/70 text-sm">Total Earnings</p>
                      <p className="text-2xl font-bold text-white">${earningsData.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Pending Commissions</p>
                      <p className="text-xl font-medium text-white">${earningsData.pending.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">This Month</p>
                      <p className="text-lg text-white">${earningsData.thisMonth.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Last Month</p>
                      <p className="text-lg text-white">${earningsData.lastMonth.toFixed(2)}</p>
                    </div>
                  </div>
                </GlassCard>
                
                <h2 className="text-xl font-bold text-white mb-4">Quick Stats</h2>
                <GlassCard className="p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {transactions ? transactions.filter(t => t.status === "active" || t.status === "pending").length : 0}
                      </p>
                      <p className="text-white/70 text-sm">Active Deals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">
                        {transactions ? transactions.filter(t => t.status === "warning").length : 0}
                      </p>
                      <p className="text-white/70 text-sm">Issues</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{clients.length}</p>
                      <p className="text-white/70 text-sm">Clients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {transactions && transactions.length > 0 ? Math.round((transactions.filter(t => t.status === "completed").length / transactions.length) * 100) : 0}%
                      </p>
                      <p className="text-white/70 text-sm">Resolution Rate</p>
                    </div>
                  </div>
                </GlassCard>
                
                <Link href="/create-transaction">
                  <GlassButton fullWidth className="mb-4">Create New Transaction</GlassButton>
                </Link>
              </div>
            </div>
          ) : activeTab === "disputes" ? (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Active Issues</h2>
              {isLoadingTransactions ? (
                <GlassCard className="p-6">
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </GlassCard>
              ) : !transactions || transactions.filter(t => t.status === "warning").length === 0 ? (
                <GlassCard className="p-6">
                  <div className="text-center py-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white mb-2">No Active Issues</h3>
                    <p className="text-white/70 mb-2">All transactions are running smoothly!</p>
                  </div>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {transactions
                    .filter(t => t.status === "warning")
                    .map(transaction => (
                      <GlassCard key={transaction.id} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{transaction.title}</h3>
                            <p className="text-white/70 text-sm">ID: {transaction.id} • Created: {formatDate(transaction.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">${parseFloat(transaction.amount).toFixed(2)}</p>
                            <div className="mt-1">{renderStatusBadge("warning")}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-white/70 text-sm mb-1">Buyer</p>
                            <p className="text-white font-medium">{transaction.buyer.username}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-white/70 text-sm mb-1">Seller</p>
                            <p className="text-white font-medium">{transaction.seller.username}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-yellow-400 font-medium mb-2">Issue Details</p>
                          <p className="text-white/90">This transaction has been flagged due to potential issues with milestone completion or delivery times.</p>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                          <Link href={`/transactions/${transaction.id}`}>
                            <GlassButton variant="outline" size="sm">View Transaction</GlassButton>
                          </Link>
                          <GlassButton size="sm">Contact Parties</GlassButton>
                          <GlassButton size="sm">Resolve Issue</GlassButton>
                        </div>
                      </GlassCard>
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === "earnings" ? (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Earnings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <GlassCard className="p-6 text-center">
                  <p className="text-white/70 text-sm mb-2">Total Earnings</p>
                  <p className="text-3xl font-bold text-white">${earningsData.total.toFixed(2)}</p>
                  <p className="text-white/60 text-xs mt-2">Lifetime earnings</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                  <p className="text-white/70 text-sm mb-2">This Month</p>
                  <p className="text-3xl font-bold text-white">${earningsData.thisMonth.toFixed(2)}</p>
                  <p className="text-white/60 text-xs mt-2">Current month earnings</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                  <p className="text-white/70 text-sm mb-2">Pending</p>
                  <p className="text-3xl font-bold text-white">${earningsData.pending.toFixed(2)}</p>
                  <p className="text-white/60 text-xs mt-2">From active transactions</p>
                </GlassCard>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-4">Earnings Breakdown</h2>
              <GlassCard className="p-6">
                {isLoadingTransactions ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">No earnings data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-3 px-4 text-left text-white/70 font-medium">Transaction</th>
                          <th className="py-3 px-4 text-left text-white/70 font-medium">Date</th>
                          <th className="py-3 px-4 text-left text-white/70 font-medium">Amount</th>
                          <th className="py-3 px-4 text-right text-white/70 font-medium">Commission (5%)</th>
                          <th className="py-3 px-4 text-right text-white/70 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {transactions
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map(tx => (
                            <tr key={tx.id}>
                              <td className="py-3 px-4 text-white">{tx.title}</td>
                              <td className="py-3 px-4 text-white">{formatDate(tx.createdAt)}</td>
                              <td className="py-3 px-4 text-white">${parseFloat(tx.amount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-white text-right">${(parseFloat(tx.amount) * 0.05).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right">{renderStatusBadge(tx.status)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            </div>
          ) : activeTab === "clients" ? (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Client Management</h2>
              {isLoadingTransactions ? (
                <GlassCard className="p-6">
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </GlassCard>
              ) : clients.length === 0 ? (
                <GlassCard className="p-6">
                  <div className="text-center py-8">
                    <p className="text-white/70">No clients found</p>
                  </div>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Buyers</h3>
                    <div className="space-y-4">
                      {clients
                        .filter(client => client.role === "buyer")
                        .map(client => (
                          <GlassCard key={client.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-white">{client.name}</h4>
                                <p className="text-white/60 text-xs mt-1">
                                  {client.transactions} transactions • ${client.totalValue.toFixed(2)} total
                                </p>
                              </div>
                              <div className="flex items-center">
                                {renderStatusBadge("buyer")}
                                <Link href={`/admin/users/${client.id}`}>
                                  <button className="ml-3 text-primary text-sm hover:underline">
                                    View
                                  </button>
                                </Link>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Sellers</h3>
                    <div className="space-y-4">
                      {clients
                        .filter(client => client.role === "seller")
                        .map(client => (
                          <GlassCard key={client.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-white">{client.name}</h4>
                                <p className="text-white/60 text-xs mt-1">
                                  {client.transactions} transactions • ${client.totalValue.toFixed(2)} total
                                </p>
                              </div>
                              <div className="flex items-center">
                                {renderStatusBadge("seller")}
                                <Link href={`/admin/users/${client.id}`}>
                                  <button className="ml-3 text-primary text-sm hover:underline">
                                    View
                                  </button>
                                </Link>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <GlassButton>Add New Client</GlassButton>
              </div>
            </div>
          ) : null}
        </motion.div>
      </DashboardLayout>
      
      {/* Broker Request Modal */}
      <BrokerRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        request={selectedRequest}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
      />
      
      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onTransactionCreated={handleTransactionCreated}
        initialBuyerId={selectedBuyerId}
      />
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
} 