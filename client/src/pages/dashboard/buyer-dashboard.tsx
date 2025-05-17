import { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Milestone, BrokerRequest, User } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import BrokerSelectionModal from "@/components/ui/broker-selection-modal";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, MessageCircle, Clock, CheckCircle, XCircle, UserCircle } from "lucide-react";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);

  // Fetch user transactions from the API
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });
  
  // Fetch broker requests from the API
  const { data: brokerRequests, isLoading: isLoadingRequests } = useQuery<BrokerRequest[]>({
    queryKey: ["/api/broker-requests"],
    enabled: !!user,
  });
  
  // Handle broker selection
  const handleSelectBroker = (brokerId: number) => {
    setBrokerModalOpen(false);
    toast({
      title: "Broker Request Sent",
      description: "Your request has been sent to the broker. They will contact you soon.",
      variant: "default",
    });
    // In a real implementation, we would call the API to send a request to the broker here
  };
  
  // Calculate stats based on real transactions
  const calculateStats = () => {
    if (!transactions || transactions.length === 0) {
      return [
        { label: "Total In Escrow", value: "$0.00" },
        { label: "Protected Amount", value: "$0.00" },
        { label: "Completed Payments", value: "$0.00" },
        { label: "Active Transactions", value: "0" },
      ];
    }

    // Calculate total amount in escrow (transactions with status "active" or "pending")
    const inEscrow = transactions
      .filter(tx => tx.status === "active" || tx.status === "pending")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    // Protected amount is the same as in escrow for this implementation
    const protectedAmount = inEscrow;
    
    // Calculate completed payments (transactions or milestones with status "completed")
    const completedPayments = transactions
      .filter(tx => tx.status === "completed")
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    // Count active transactions
    const activeTransactionsCount = transactions.filter(tx => 
      tx.status === "active" || tx.status === "pending"
    ).length;

    return [
      { label: "Total In Escrow", value: `$${inEscrow.toFixed(2)}` },
      { label: "Protected Amount", value: `$${protectedAmount.toFixed(2)}` },
      { label: "Completed Payments", value: `$${completedPayments.toFixed(2)}` },
      { label: "Active Transactions", value: activeTransactionsCount.toString() },
    ];
  };

  // Get recent notifications based on transactions
  const getRecentNotifications = () => {
    if (!transactions || transactions.length === 0) return [];
    
    const notifications: Array<{id: string; text: string; time: string}> = [];
    
    // Add notifications for completed milestones
    transactions.forEach(tx => {
      tx.milestones.forEach(milestone => {
        if (milestone.completedAt) {
          notifications.push({
            id: `milestone-${milestone.id}`,
            text: `Milestone '${milestone.title}' has been completed`,
            time: formatTimeAgo(new Date(milestone.completedAt))
          });
        }
      });
    });
    
    // Add notifications for recent transactions
    transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach(tx => {
        notifications.push({
          id: `tx-${tx.id}`,
          text: `New transaction '${tx.title}' created with ${tx.seller.username}`,
          time: formatTimeAgo(new Date(tx.createdAt))
        });
      });
    
    // Add broker request notifications if available
    if (brokerRequests?.length) {
      brokerRequests.slice(0, 3).forEach(request => {
        let text = '';
        if (request.status === 'pending') {
          text = `Broker request to ${request.broker.username} is pending`;
        } else if (request.status === 'accepted') {
          text = `${request.broker.username} accepted your broker request`;
        } else if (request.status === 'rejected') {
          text = `${request.broker.username} declined your broker request`;
        }
        
        notifications.push({
          id: `broker-${request.id}`,
          text,
          time: formatTimeAgo(new Date(request.updatedAt || request.createdAt))
        });
      });
    }
    
    // Return most recent 5 notifications
    return notifications
      .sort((a, b) => {
        // Extract time values like "2 hours ago" and compare
        const timeA = a.time.split(" ")[0];
        const timeB = b.time.split(" ")[0];
        return parseInt(timeA) - parseInt(timeB);
      })
      .slice(0, 5);
  };
  
  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Format time difference as "X hours/days ago"
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
  };
  
  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    const statusMap: {[key: string]: {color: string; text: string}} = {
      "active": { color: "bg-blue-500/20 text-blue-400", text: "Active" },
      "pending": { color: "bg-gray-500/20 text-gray-400", text: "Pending" },
      "completed": { color: "bg-green-500/20 text-green-400", text: "Completed" },
      "warning": { color: "bg-yellow-500/20 text-yellow-400", text: "Warning" },
      "accepted": { color: "bg-green-500/20 text-green-400", text: "Accepted" },
      "rejected": { color: "bg-red-500/20 text-red-400", text: "Rejected" },
    };
    
    const { color, text } = statusMap[status] || { color: "bg-gray-500/20 text-gray-400", text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };
  
  // Stats based on real transaction data
  const stats = calculateStats();
  
  // Notifications based on real transaction data
  const notifications = getRecentNotifications();
  
  // Mock broker requests data for UI demonstration
  const mockBrokerRequests: BrokerRequest[] = [
    {
      id: 1,
      buyerId: user?.id || 1,
      buyer: { id: user?.id || 1, username: user?.username || "buyer" },
      brokerId: 101,
      broker: { id: 101, username: "premium_escrow", rating: 4.9 },
      status: "pending",
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      buyerId: user?.id || 1,
      buyer: { id: user?.id || 1, username: user?.username || "buyer" },
      brokerId: 102,
      broker: { id: 102, username: "secure_deals", rating: 4.7 },
      status: "accepted",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    },
    {
      id: 3,
      buyerId: user?.id || 1,
      buyer: { id: user?.id || 1, username: user?.username || "buyer" },
      brokerId: 103,
      broker: { id: 103, username: "trust_broker", rating: 4.8 },
      status: "rejected",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 129600000).toISOString(), // 1.5 days ago
    },
  ];
  
  // Use mock data until API is ready
  const requestsToDisplay = brokerRequests?.length ? brokerRequests : mockBrokerRequests;
  
  // Render different tab content based on activeTab
  const renderTabContent = () => {
    switch(activeTab) {
      case "overview":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <GlassCard key={index} className="p-6">
                  <h3 className="text-white/70 text-sm mb-1">{stat.label}</h3>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </GlassCard>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-white mb-4">Active Transactions</h2>
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
                      <p className="text-white/70 mb-6">You don't have any active transactions yet.</p>
                      <GlassButton onClick={() => setBrokerModalOpen(true)}>Find Escrow</GlassButton>
                    </div>
                  </GlassCard>
                ) : (
                  <div className="space-y-4">
                    {transactions
                      .filter(transaction => transaction.status === "active" || transaction.status === "pending")
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
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                            <p className="text-white/70 text-sm mb-2 sm:mb-0">
                              Seller: <span className="text-white">{transaction.seller.username}</span>
                            </p>
                            {transaction.broker && (
                              <p className="text-white/70 text-sm">
                                Broker: <span className="text-white">{transaction.broker.username}</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-4">
                            <h4 className="text-white/90 font-medium mb-3">Milestones</h4>
                            <div className="space-y-3">
                              {transaction.milestones.map((milestone) => (
                                <div key={milestone.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                  <div>
                                    <p className="text-white">{milestone.title}</p>
                                    <p className="text-white/60 text-xs">Due: {formatDate(milestone.dueDate)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-white font-medium">${parseFloat(milestone.amount).toFixed(2)}</p>
                                    <div className="mt-1">{renderStatusBadge(milestone.status)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-6 flex justify-end gap-3">
                            <Link href={`/transactions/${transaction.id}`}>
                              <GlassButton variant="outline" size="sm">View Details</GlassButton>
                            </Link>
                            {transaction.status === "active" && (
                              <GlassButton size="sm">Release Funds</GlassButton>
                            )}
                          </div>
                        </GlassCard>
                      ))}
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Recent Notifications</h2>
                <GlassCard className="p-6">
                  {notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-3 rounded-lg bg-white/5">
                          <p className="text-white mb-1">{notification.text}</p>
                          <p className="text-white/50 text-xs">{notification.time}</p>
                        </div>
                      ))}
                      <div className="pt-4 text-center">
                        <button className="text-primary text-sm hover:underline">
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/70">No notifications yet</p>
                    </div>
                  )}
                </GlassCard>
                
                <h2 className="text-xl font-bold text-white mt-6 mb-4">Quick Actions</h2>
                <GlassCard className="p-6">
                  <div className="space-y-3">
                    <GlassButton 
                      fullWidth 
                      onClick={() => setBrokerModalOpen(true)}
                      className="flex items-center justify-center gap-2"
                    >
                      <SearchIcon className="w-4 h-4" />
                      Find Escrow
                    </GlassButton>
                    <GlassButton 
                      variant="outline" 
                      fullWidth
                      className="flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message Broker
                    </GlassButton>
                    <GlassButton 
                      variant="outline" 
                      fullWidth
                      className="flex items-center justify-center gap-2"
                    >
                      <UserCircle className="w-4 h-4" />
                      View Profile
                    </GlassButton>
                  </div>
                </GlassCard>
              </div>
            </div>
          </>
        );
      
      case "brokers":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Broker Requests</h2>
              <GlassButton 
                onClick={() => setBrokerModalOpen(true)}
                className="flex items-center gap-2"
              >
                <SearchIcon className="w-4 h-4" />
                Find Escrow
              </GlassButton>
            </div>
            
            {isLoadingRequests ? (
              <GlassCard className="p-6">
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              </GlassCard>
            ) : requestsToDisplay.length === 0 ? (
              <GlassCard className="p-6">
                <div className="text-center py-10">
                  <h3 className="text-xl font-semibold text-white mb-2">No Broker Requests</h3>
                  <p className="text-white/70 mb-6">You haven't sent any requests to brokers yet.</p>
                  <GlassButton onClick={() => setBrokerModalOpen(true)}>Find Escrow</GlassButton>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {requestsToDisplay.map((request) => (
                  <GlassCard key={request.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{request.broker.username}</h3>
                        <p className="text-white/70 text-sm">Request ID: {request.id} • Sent: {formatTimeAgo(new Date(request.createdAt))}</p>
                      </div>
                      <div>{renderStatusBadge(request.status)}</div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      {request.status === 'pending' && (
                        <div className="flex items-center text-yellow-400">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm">Awaiting broker response</span>
                        </div>
                      )}
                      {request.status === 'accepted' && (
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">Broker accepted your request</span>
                        </div>
                      )}
                      {request.status === 'rejected' && (
                        <div className="flex items-center text-red-400">
                          <XCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">Broker declined your request</span>
                        </div>
                      )}
                    </div>
                    
                    {request.message && (
                      <div className="p-3 bg-white/5 rounded-lg mb-4">
                        <p className="text-white/90 italic">"{request.message}"</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-3">
                      {request.status === 'accepted' && (
                        <GlassButton size="sm" className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Message Broker
                        </GlassButton>
                      )}
                      {request.status === 'rejected' && (
                        <GlassButton variant="outline" size="sm">
                          Find Another Broker
                        </GlassButton>
                      )}
                      {request.status === 'pending' && (
                        <GlassButton variant="outline" size="sm" className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                          Cancel Request
                        </GlassButton>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        );
        
      case "payment-history":
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Payment History</h2>
            <GlassCard className="p-6">
              {isLoadingTransactions ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No payment history available</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-3 px-4 text-left text-white/70 font-medium">Transaction ID</th>
                          <th className="py-3 px-4 text-left text-white/70 font-medium">Date</th>
                          <th className="py-3 px-4 text-left text-white/70 font-medium">Description</th>
                          <th className="py-3 px-4 text-right text-white/70 font-medium">Amount</th>
                          <th className="py-3 px-4 text-right text-white/70 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {transactions.flatMap(transaction =>
                          transaction.milestones.map(milestone => (
                            <tr key={`${transaction.id}-${milestone.id}`}>
                              <td className="py-3 px-4 text-white">#{transaction.id}-M{milestone.id}</td>
                              <td className="py-3 px-4 text-white">{formatDate(milestone.completedAt || milestone.dueDate)}</td>
                              <td className="py-3 px-4 text-white">{milestone.title} ({transaction.title})</td>
                              <td className="py-3 px-4 text-white text-right">${parseFloat(milestone.amount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right">{renderStatusBadge(milestone.status)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <GlassButton variant="outline" size="sm">Export Payment History</GlassButton>
                  </div>
                </>
              )}
            </GlassCard>
          </div>
        );
        
      case "milestones":
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Milestone Tracking</h2>
            {isLoadingTransactions ? (
              <GlassCard className="p-6">
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              </GlassCard>
            ) : !transactions || transactions.length === 0 ? (
              <GlassCard className="p-6">
                <div className="text-center py-8">
                  <p className="text-white/70">No milestone data available</p>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6">
                <div className="space-y-6">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{transaction.title}</h3>
                          <p className="text-white/70 text-sm">Transaction ID: {transaction.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">Total: ${parseFloat(transaction.amount).toFixed(2)}</p>
                          <p className="text-white/70 text-xs">Seller: {transaction.seller.username}</p>
                        </div>
                      </div>
                      
                      <div className="relative pt-8">
                        {/* Timeline track */}
                        <div className="absolute top-0 left-4 h-full w-0.5 bg-white/10"></div>
                        
                        {/* Milestones */}
                        <div className="space-y-8">
                          {transaction.milestones.map((milestone, index) => (
                            <div key={milestone.id} className="relative pl-10">
                              {/* Timeline dot */}
                              <div className={`absolute left-1.5 top-1.5 h-5 w-5 rounded-full border-2 ${
                                milestone.status === 'completed' 
                                  ? 'bg-green-500 border-green-600' 
                                  : milestone.status === 'active' 
                                  ? 'bg-blue-500 border-blue-600' 
                                  : 'bg-transparent border-white/30'
                              }`}></div>
                              
                              <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-white font-medium">{index + 1}. {milestone.title}</h4>
                                  <div>{renderStatusBadge(milestone.status)}</div>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm">
                                  <p className="text-white/70">Due Date: {formatDate(milestone.dueDate)}</p>
                                  <p className="text-white font-medium">${parseFloat(milestone.amount).toFixed(2)}</p>
                                </div>
                                
                                {milestone.status === 'active' && (
                                  <div className="mt-4 flex justify-end">
                                    <GlassButton size="sm">Release Funds</GlassButton>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <DashboardLayout title="Buyer Dashboard" subtitle="Monitor your purchases and escrow transactions">
        <Helmet>
          <title>Buyer Dashboard | Middlesman</title>
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
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "brokers" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("brokers")}
            >
              Broker Requests
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "payment-history" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("payment-history")}
            >
              Payment History
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "milestones" ? "bg-primary text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setActiveTab("milestones")}
            >
              Milestone Tracking
            </button>
          </div>
        </div>
        
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </DashboardLayout>
      
      {/* Broker Selection Modal */}
      <BrokerSelectionModal 
        isOpen={brokerModalOpen}
        onClose={() => setBrokerModalOpen(false)}
        onSelectBroker={handleSelectBroker}
      />
    </>
  );
} 