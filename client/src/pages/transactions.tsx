import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link, useLocation } from "wouter";
import { Transaction } from "@/types";
import TransactionDetailModal from "@/components/transactions/transaction-detail-modal";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";

export default function Transactions() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const initialStatus = queryParams.get("status") || "all";
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Filter transactions based on status
  const filteredTransactions = transactions?.filter(transaction => {
    if (statusFilter === "all") return true;
    return transaction.status === statusFilter;
  });

  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Transactions | Middlesman</title>
      </Helmet>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-outfit font-bold text-darkBg mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Transactions
          </motion.h1>
          <motion.p 
            className="text-lg text-darkBg opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Manage and track all your escrow transactions
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold">All Transactions</h2>
                <p className="text-darkBg opacity-80">Track your escrow transaction history</p>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-40">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="glass-input focus:outline-none">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Link href="/create-transaction">
                  <a>
                    <GlassButton size="sm">+ New Transaction</GlassButton>
                  </a>
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions && filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-outfit">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-outfit">Description</th>
                      <th className="text-left py-3 px-4 font-outfit">Participants</th>
                      <th className="text-left py-3 px-4 font-outfit">Amount</th>
                      <th className="text-left py-3 px-4 font-outfit">Status</th>
                      <th className="text-left py-3 px-4 font-outfit">Milestones</th>
                      <th className="text-left py-3 px-4 font-outfit">Created</th>
                      <th className="text-left py-3 px-4 font-outfit">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 hover:bg-white/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">#{transaction.id}</td>
                        <td className="py-3 px-4">{transaction.title}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                              {transaction.buyer.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-xs">
                              {transaction.seller.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {transaction.currency} {transaction.amount}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={transaction.status}>
                            {transaction.status === "active"
                              ? "In Progress"
                              : transaction.status === "completed"
                              ? "Completed"
                              : "Funded"}
                          </StatusBadge>
                        </td>
                        <td className="py-3 px-4">
                          <ProgressBar
                            value={transaction.milestones.filter(m => m.status === "completed").length}
                            max={transaction.milestones.length}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-darkBg opacity-70">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            className="text-primary hover:text-secondary transition-colors font-medium"
                            onClick={() => openTransactionDetails(transaction)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-darkBg opacity-70 mb-4">
                  {statusFilter !== "all" 
                    ? `You don't have any ${statusFilter} transactions.`
                    : "You don't have any transactions yet."}
                </p>
                <Link href="/create-transaction">
                  <a>
                    <GlassButton>Create New Transaction</GlassButton>
                  </a>
                </Link>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transaction={selectedTransaction}
        />
      </div>
    </>
  );
}
