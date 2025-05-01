import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, icon, iconPosition = "left", fullWidth = true, ...props }, ref) => {
    return (
      <div className={cn("relative", fullWidth ? "w-full" : "")}>
        <input
          ref={ref}
          className={cn(
            "glass-input focus:outline-none px-4 py-3",
            fullWidth ? "w-full" : "",
            icon && iconPosition === "left" ? "pl-10" : "",
            icon && iconPosition === "right" ? "pr-10" : "",
            className
          )}
          {...props}
        />
        {icon && (
          <div
            className={cn(
              "absolute inset-y-0 flex items-center pointer-events-none",
              iconPosition === "left" ? "left-0 pl-3" : "right-0 pr-3"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export { GlassInput };
