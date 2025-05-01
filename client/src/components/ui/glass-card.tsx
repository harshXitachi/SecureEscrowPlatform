import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  animate?: "fade-in" | "slide-up" | "scale";
  stagger?: 1 | 2 | 3 | 4 | 5;
  opacity?: "low" | "medium" | "high";
}

export function GlassCard({
  children,
  className,
  animate,
  stagger,
  opacity = "medium",
  ...props
}: GlassCardProps) {
  const opacityClass = {
    low: "bg-white/40",
    medium: "bg-white/60",
    high: "bg-white/80",
  }[opacity];

  const animationClass = animate
    ? `animate-${animate} ${stagger ? `stagger-${stagger}` : ""}`
    : "";

  return (
    <div
      className={cn(
        "glass-card p-6",
        opacityClass,
        animationClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
