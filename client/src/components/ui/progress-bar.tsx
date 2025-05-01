import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  showText?: boolean;
  width?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  showText = true,
  width = "w-24",
  className,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className={cn("progress-bar h-2 rounded overflow-hidden", width, className)}>
        <div
          className="progress-fill h-full bg-gradient-to-r from-primary to-secondary rounded"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && (
        <span className="text-sm">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
