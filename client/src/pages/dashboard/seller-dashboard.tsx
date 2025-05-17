import { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Transaction, Milestone } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import TransactionChat from "@/components/ui/transaction-chat";
import { MessageCircle, ChevronRight, FileText, CheckCircle, ExternalLink } from "lucide-react";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedChatId, setExpandedChatId] = useState<number | null>(null);

  // Fetch user transactions from the API
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });
  
  // Calculate performance metrics based on real transaction data
  const calculatePerformanceMetrics = () => {
    if (!transactions || transactions.length === 0) {
      return {
        completionRate: 0,
        avgTransactionValue: 0,
        totalEarned: 0,
        activeTransactions: 0,
        totalTransactions: 0,
        disputes: 0
      };
    }
    
    // Count completed transactions
    const completedTransactions = transactions.filter(tx => tx.status === "completed");
    
    // Calculate completion rate
    const completionRate = completedTransactions.length > 0 
      ? Math.round((completedTransactions.length / transactions.length) * 100) 
      : 0;
    
    // Calculate average transaction value
    const totalValue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const avgValue = transactions.length > 0 ? Math.round(totalValue / transactions.length) : 0;
    
    // Calculate total earned from completed transactions
    const totalEarned = completedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    
    // Count active transactions
    const activeTransactionsCount = transactions.filter(tx => 
      tx.status === "active" || tx.status === "pending"
    ).length;
    
    // Count disputed transactions (assuming 'warning' status could be disputes)
    const disputesCount = transactions.filter(tx => tx.status === "warning").length;
    
    return {
      completionRate,
      avgTransactionValue: avgValue,
      totalEarned,
      activeTransactions: activeTransactionsCount,
      totalTransactions: transactions.length,
      disputes: disputesCount
    };
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
    };
    
    const { color, text } = statusMap[status] || { color: "bg-gray-500/20 text-gray-400", text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  // Get performance metrics based on real data
  const performanceMetrics = calculatePerformanceMetrics();
  
  return (
    <DashboardLayout title="Seller Dashboard" subtitle="Manage your sales and track payments">
      <Helmet>
        <title>Seller Dashboard | Middlesman</title>
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
              activeTab === "schedule" ? "bg-primary text-white" : "text-white/70 hover:text-white"
            }`}
            onClick={() => setActiveTab("schedule")}
          >
            Payment Schedule
          </button>
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === "performance" ? "bg-primary text-white" : "text-white/70 hover:text-white"
            }`}
            onClick={() => setActiveTab("performance")}
          >
            Performance
          </button>
          <button
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === "messages" ? "bg-primary text-white" : "text-white/70 hover:text-white"
            }`}
            onClick={() => setActiveTab("messages")}
          >
            Messages
          </button>
        </div>
      </div>
      
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-4">Active Escrow Transactions</h2>
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
                    <Link href="/create-transaction">
                      <GlassButton>Create New Transaction</GlassButton>
                    </Link>
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
                        
                        <div className="mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <p className="text-white/70 text-sm">Buyer: <span className="text-white">{transaction.buyer.username}</span></p>
                            {transaction.broker && (
                              <p className="text-white/70 text-sm">Broker: <span className="text-white">{transaction.broker.username}</span></p>
                            )}
                            <p className="text-white/70 text-sm">Due date: <span className="text-white">{formatDate(transaction.dueDate)}</span></p>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          {transaction.milestones.slice(0, 2).map((milestone) => (
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
                          
                          {transaction.milestones.length > 2 && (
                            <Link href={`/transactions/${transaction.id}`}>
                              <div className="text-center text-primary text-sm hover:underline cursor-pointer">
                                View all {transaction.milestones.length} milestones
                              </div>
                            </Link>
                          )}
                        </div>
                        
                        {/* Transaction Chat Expandable Section */}
                        <div className="mt-4 border-t border-white/10 pt-4">
                          {expandedChatId === transaction.id ? (
                            <div className="mb-4">
                              <TransactionChat 
                                transaction={transaction} 
                                isCollapsible={true} 
                              />
                            </div>
                          ) : (
                            <div
                              className="flex justify-between items-center hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-colors"
                              onClick={() => setExpandedChatId(transaction.id)}
                            >
                              <div className="flex items-center">
                                <MessageCircle className="w-5 h-5 text-primary mr-2" />
                                <span className="text-white/90">View conversation with buyer{transaction.broker ? " and broker" : ""}</span>
                              </div>
                              <ChevronRight className="w-5 h-5 text-white/50" />
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex justify-end gap-3">
                          <Link href={`/transactions/${transaction.id}`}>
                            <GlassButton variant="outline" size="sm">View Details</GlassButton>
                          </Link>
                          <GlassButton size="sm">Submit Milestone</GlassButton>
                        </div>
                      </GlassCard>
                    ))}
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Performance Overview</h2>
              <GlassCard className="p-6 mb-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-white/70">Completion Rate</p>
                    <p className="text-white font-bold">{performanceMetrics.completionRate}%</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white/70">Avg. Transaction Value</p>
                    <p className="text-white font-bold">${performanceMetrics.avgTransactionValue}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white/70">Total Earned</p>
                    <p className="text-white font-bold">${performanceMetrics.totalEarned.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white/70">Active Transactions</p>
                    <p className="text-white font-bold">{performanceMetrics.activeTransactions}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white/70">Total Transactions</p>
                    <p className="text-white font-bold">{performanceMetrics.totalTransactions}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-white/70">Disputes</p>
                    <p className="text-white font-bold">{performanceMetrics.disputes}</p>
                  </div>
                </div>
              </GlassCard>
              
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <GlassCard className="p-6">
                <div className="space-y-3">
                  <GlassButton 
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Create Invoice
                  </GlassButton>
                  <GlassButton 
                    variant="outline" 
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Submit Deliverable
                  </GlassButton>
                  <GlassButton 
                    variant="outline" 
                    fullWidth
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Account Settings
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          </div>
        )}
        
        {activeTab === "messages" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Transaction Messages</h2>
            
            {isLoadingTransactions ? (
              <GlassCard className="p-6">
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              </GlassCard>
            ) : !transactions || transactions.length === 0 ? (
              <GlassCard className="p-6">
                <div className="text-center py-10">
                  <h3 className="text-xl font-semibold text-white mb-2">No Conversations</h3>
                  <p className="text-white/70">You don't have any active transactions with messages.</p>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {transactions.map(transaction => (
                  <div key={transaction.id}>
                    <h3 className="text-lg font-medium text-white mb-3">
                      {transaction.title}
                      <span className="ml-2 text-sm text-white/60">
                        with {transaction.buyer.username}
                        {transaction.broker && ` and ${transaction.broker.username}`}
                      </span>
                    </h3>
                    <TransactionChat transaction={transaction} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "schedule" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Payment Schedule</h2>
            <GlassCard className="p-6">
              {isLoadingTransactions ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">No payment schedule available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 px-4 text-left text-white/70 font-medium">Transaction</th>
                        <th className="py-3 px-4 text-left text-white/70 font-medium">Milestone</th>
                        <th className="py-3 px-4 text-left text-white/70 font-medium">Due Date</th>
                        <th className="py-3 px-4 text-right text-white/70 font-medium">Amount</th>
                        <th className="py-3 px-4 text-right text-white/70 font-medium">Status</th>
                        <th className="py-3 px-4 text-right text-white/70 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions.flatMap(tx => 
                        tx.milestones.map(ms => (
                          <tr key={`${tx.id}-${ms.id}`}>
                            <td className="py-3 px-4 text-white">{tx.title}</td>
                            <td className="py-3 px-4 text-white">{ms.title}</td>
                            <td className="py-3 px-4 text-white">{formatDate(ms.dueDate)}</td>
                            <td className="py-3 px-4 text-white text-right">${parseFloat(ms.amount).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right">{renderStatusBadge(ms.status)}</td>
                            <td className="py-3 px-4 text-right">
                              {ms.status === 'pending' && (
                                <button className="text-primary text-sm hover:underline">
                                  Submit
                                </button>
                              )}
                              {ms.status === 'active' && (
                                <button className="text-yellow-400 text-sm hover:underline">
                                  Awaiting Review
                                </button>
                              )}
                              {ms.status === 'completed' && (
                                <span className="text-green-400 text-sm">
                                  Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
        )}
        
        {activeTab === "performance" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm">Completion Rate</span>
                      <span className="text-white text-sm">{performanceMetrics.completionRate}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${performanceMetrics.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm">Active vs. Total Transactions</span>
                      <span className="text-white text-sm">{performanceMetrics.activeTransactions} / {performanceMetrics.totalTransactions}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full" 
                        style={{ width: performanceMetrics.totalTransactions > 0 ? `${(performanceMetrics.activeTransactions / performanceMetrics.totalTransactions) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg text-center">
                      <p className="text-white/70 text-sm mb-1">Total Earned</p>
                      <p className="text-2xl font-bold text-white">${performanceMetrics.totalEarned.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg text-center">
                      <p className="text-white/70 text-sm mb-1">Avg. Transaction</p>
                      <p className="text-2xl font-bold text-white">${performanceMetrics.avgTransactionValue}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
                {isLoadingTransactions ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">No transaction history available</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {transactions
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(tx => (
                        <div key={tx.id} className="flex justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white">{tx.title}</p>
                            <p className="text-white/60 text-xs">{formatDate(tx.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white">${parseFloat(tx.amount).toFixed(2)}</p>
                            <div>{renderStatusBadge(tx.status)}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
} 