import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilityIndicatorProps {
  isOnline?: boolean;
  isAvailable?: boolean;
  responseTime?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dot" | "badge" | "detailed";
  className?: string;
}

const dotSizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function AvailabilityIndicator({
  isOnline = false,
  isAvailable = true,
  responseTime,
  size = "md",
  variant = "dot",
  className,
}: AvailabilityIndicatorProps) {
  const statusColor = isOnline
    ? "bg-secondary"
    : isAvailable
    ? "bg-amber-400"
    : "bg-muted-foreground/50";

  const statusText = isOnline
    ? "Online now"
    : isAvailable
    ? "Available"
    : "Busy";

  const pulseClass = isOnline ? "animate-pulse" : "";

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "relative inline-flex",
          className
        )}
      >
        <span
          className={cn(
            "rounded-full",
            dotSizeClasses[size],
            statusColor,
            pulseClass
          )}
        />
        {isOnline && (
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-75",
              statusColor
            )}
          />
        )}
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
          isOnline
            ? "bg-secondary/10 text-secondary"
            : isAvailable
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-muted text-muted-foreground",
          textSizeClasses[size],
          className
        )}
      >
        <span
          className={cn(
            "rounded-full",
            dotSizeClasses[size],
            statusColor,
            pulseClass
          )}
        />
        <span className="font-medium">{statusText}</span>
      </span>
    );
  }

  // Detailed variant
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full",
            dotSizeClasses[size],
            statusColor,
            pulseClass
          )}
        />
        <span className={cn("font-medium", textSizeClasses[size])}>
          {statusText}
        </span>
      </div>
      {responseTime && (
        <span className="text-xs text-muted-foreground">
          Usually responds in {responseTime}
        </span>
      )}
    </div>
  );
}
