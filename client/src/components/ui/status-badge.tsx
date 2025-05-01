import { cn } from "@/lib/utils";

export type StatusType = "pending" | "active" | "completed" | "warning";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusClasses: Record<StatusType, string> = {
  pending: "status-pending",
  active: "status-active",
  completed: "status-completed",
  warning: "status-warning",
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", statusClasses[status], className)}>
      {children}
    </span>
  );
}
