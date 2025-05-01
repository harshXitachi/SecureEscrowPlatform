import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link } from "wouter";
import { Transaction } from "@/types";
import TransactionDetailModal from "@/components/transactions/transaction-detail-modal";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Recent transactions (last 5)
  const recentTransactions = transactions?.slice(0, 5);

  // Group transactions by status
  const activeTransactions = transactions?.filter(t => t.status === "active").length || 0;
  const completedTransactions = transactions?.filter(t => t.status === "completed").length || 0;
  const pendingTransactions = transactions?.filter(t => t.status === "pending").length || 0;

  // Calculate total transaction value
  const totalTransactionValue = transactions?.reduce((acc, t) => acc + parseFloat(t.amount), 0) || 0;

  const openTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Middlesman</title>
      </Helmet>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-outfit font-bold text-darkBg mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Dashboard
          </motion.h1>
          <motion.p 
            className="text-lg text-darkBg opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Welcome back, {user?.username}
          </motion.p>
        </div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="p-6 flex flex-col">
            <h3 className="text-sm uppercase tracking-wider text-darkBg opacity-70 mb-1">Active Transactions</h3>
            <p className="text-3xl font-outfit font-bold text-primary">{activeTransactions}</p>
            <div className="mt-auto pt-4">
              <Link href="/transactions?status=active">
                <a className="text-sm text-primary font-medium">View all active</a>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col">
            <h3 className="text-sm uppercase tracking-wider text-darkBg opacity-70 mb-1">Completed</h3>
            <p className="text-3xl font-outfit font-bold text-success">{completedTransactions}</p>
            <div className="mt-auto pt-4">
              <Link href="/transactions?status=completed">
                <a className="text-sm text-primary font-medium">View history</a>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col">
            <h3 className="text-sm uppercase tracking-wider text-darkBg opacity-70 mb-1">Pending</h3>
            <p className="text-3xl font-outfit font-bold text-warning">{pendingTransactions}</p>
            <div className="mt-auto pt-4">
              <Link href="/transactions?status=pending">
                <a className="text-sm text-primary font-medium">View pending</a>
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col">
            <h3 className="text-sm uppercase tracking-wider text-darkBg opacity-70 mb-1">Total Value</h3>
            <p className="text-3xl font-outfit font-bold text-secondary">
              ${totalTransactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-auto pt-4">
              <Link href="/transactions">
                <a className="text-sm text-primary font-medium">View all transactions</a>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-outfit font-semibold">Recent Transactions</h2>
                <p className="text-darkBg opacity-80">Your most recent escrow transactions</p>
              </div>
              <div className="flex gap-2">
                <Link href="/create-transaction">
                  <a>
                    <GlassButton size="sm">+ New Transaction</GlassButton>
                  </a>
                </Link>
                <Link href="/transactions">
                  <a>
                    <GlassButton variant="secondary" size="sm">View All</GlassButton>
                  </a>
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-outfit">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-outfit">Description</th>
                      <th className="text-left py-3 px-4 font-outfit">Amount</th>
                      <th className="text-left py-3 px-4 font-outfit">Status</th>
                      <th className="text-left py-3 px-4 font-outfit">Milestones</th>
                      <th className="text-left py-3 px-4 font-outfit">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 hover:bg-white/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">#{transaction.id}</td>
                        <td className="py-3 px-4">{transaction.title}</td>
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
                <p className="text-darkBg opacity-70 mb-4">You don't have any transactions yet.</p>
                <Link href="/create-transaction">
                  <a>
                    <GlassButton>Create Your First Transaction</GlassButton>
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
