import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction, Milestone } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import MilestoneItem from "./milestone-item";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: number) => {
      const response = await apiRequest(
        "PATCH",
        `/api/transactions/${transaction?.id}/milestones/${milestoneId}/approve`,
        {}
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Milestone approved and payment released.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve milestone. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!transaction) return null;

  // Find the next pending milestone
  const nextPendingMilestone = transaction.milestones.find(
    (milestone) => milestone.status === "pending"
  );

  const handleApproveMilestone = (milestoneId: number) => {
    if (confirm("Are you sure you want to approve this milestone and release the payment?")) {
      approveMilestoneMutation.mutate(milestoneId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl p-0 overflow-auto max-h-[90vh]">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-outfit font-semibold">Transaction Details</h3>
              <p className="text-darkBg opacity-80">{transaction.title}</p>
            </div>
            <button
              className="p-2 hover:bg-gray-200 rounded-full"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-darkBg opacity-70 mb-1">Transaction ID</p>
              <p className="font-medium">#{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm text-darkBg opacity-70 mb-1">Created Date</p>
              <p className="font-medium">
                {new Date(transaction.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-darkBg opacity-70 mb-1">Amount</p>
              <p className="font-medium">
                {transaction.currency} {transaction.amount}
              </p>
            </div>
            <div>
              <p className="text-sm text-darkBg opacity-70 mb-1">Status</p>
              <StatusBadge status={transaction.status}>
                {transaction.status === "active"
                  ? "In Progress"
                  : transaction.status === "completed"
                  ? "Completed"
                  : "Funded"}
              </StatusBadge>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="font-outfit font-semibold mb-4">Transaction Participants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4 bg-opacity-40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {transaction.buyer.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">Buyer</p>
                    <p className="text-sm text-darkBg opacity-70">
                      {transaction.buyer.username}
                    </p>
                  </div>
                </div>
              </div>
              <div className="glass-card p-4 bg-opacity-40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-medium">
                    {transaction.seller.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">Seller</p>
                    <p className="text-sm text-darkBg opacity-70">
                      {transaction.seller.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="font-outfit font-semibold mb-4">Milestones</h4>
            <div className="space-y-4">
              {transaction.milestones.map((milestone, index) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  currency={transaction.currency}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <GlassButton variant="outline" onClick={onClose}>
              Close
            </GlassButton>
            {nextPendingMilestone && transaction.status === "active" && (
              <GlassButton
                onClick={() => handleApproveMilestone(nextPendingMilestone.id)}
                disabled={approveMilestoneMutation.isPending}
              >
                {approveMilestoneMutation.isPending
                  ? "Processing..."
                  : "Approve Milestone"}
              </GlassButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
