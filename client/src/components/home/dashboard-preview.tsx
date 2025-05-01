import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion } from "framer-motion";
import { Link } from "wouter";

// Preview transaction data
const transactions = [
  {
    id: "TRX-78901",
    description: "Website Development Project",
    amount: "$4,500.00",
    status: "active" as const,
    completedMilestones: 3,
    totalMilestones: 5,
  },
  {
    id: "TRX-78902",
    description: "Product Manufacturing",
    amount: "$12,750.00",
    status: "pending" as const,
    completedMilestones: 1,
    totalMilestones: 4,
  },
  {
    id: "TRX-78903",
    description: "Marketing Consultation",
    amount: "$2,300.00",
    status: "completed" as const,
    completedMilestones: 2,
    totalMilestones: 2,
  },
];

export default function DashboardPreview() {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-darkBg mb-4">
            Your Transactions Dashboard
          </h2>
          <p className="text-lg text-darkBg opacity-80 max-w-2xl mx-auto">
            Monitor all your escrow transactions in one place with our intuitive dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-outfit font-semibold">Active Transactions</h3>
                <p className="text-darkBg opacity-80">
                  Track the progress of your ongoing transactions
                </p>
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
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 hover:bg-white/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">#{transaction.id}</td>
                      <td className="py-3 px-4">{transaction.description}</td>
                      <td className="py-3 px-4 font-medium">{transaction.amount}</td>
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
                          value={transaction.completedMilestones}
                          max={transaction.totalMilestones}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-primary hover:text-secondary transition-colors font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
