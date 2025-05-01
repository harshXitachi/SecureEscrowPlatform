import { GlassCard } from "@/components/ui/glass-card";
import { Milestone } from "@/types";

interface MilestoneItemProps {
  milestone: Milestone;
  currency: string;
}

export default function MilestoneItem({ milestone, currency }: MilestoneItemProps) {
  // Determine the appropriate icon based on milestone status
  const renderStatusIcon = () => {
    switch (milestone.status) {
      case "completed":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-success"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "active":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-darkBg opacity-60"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 100 12 6 6 0 000-12z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getStatusBadge = () => {
    switch (milestone.status) {
      case "completed":
        return <span className="text-xs bg-success bg-opacity-10 text-success px-2 py-1 rounded-full">Completed</span>;
      case "active":
        return <span className="text-xs bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full">In Progress</span>;
      default:
        return <span className="text-xs bg-darkBg bg-opacity-10 text-darkBg opacity-70 px-2 py-1 rounded-full">Pending</span>;
    }
  };

  const getPaymentStatus = () => {
    switch (milestone.status) {
      case "completed":
        return <p className="text-xs text-success">Released</p>;
      default:
        return <p className="text-xs text-darkBg opacity-70">Pending</p>;
    }
  };

  return (
    <GlassCard
      className={`p-4 bg-opacity-40 ${
        milestone.status === "pending" ? "opacity-70" : ""
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {renderStatusIcon()}
            <h5 className="font-medium">{milestone.title}</h5>
          </div>
          <p className="text-sm text-darkBg opacity-70">{milestone.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge()}
            <span className="text-xs text-darkBg opacity-70">
              {milestone.status === "completed"
                ? `Completed: ${new Date(milestone.completedAt || "").toLocaleDateString()}`
                : milestone.status === "active"
                ? "In Progress"
                : `Due: ${new Date(milestone.dueDate).toLocaleDateString()}`}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium">
            {currency} {milestone.amount}
          </p>
          {getPaymentStatus()}
        </div>
      </div>
    </GlassCard>
  );
}
