import { BadgeCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "badge" | "inline";
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const badgeSizeClasses = {
  sm: "text-xs px-1.5 py-0.5 gap-1",
  md: "text-sm px-2 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export function VerifiedBadge({
  size = "md",
  variant = "icon",
  showTooltip = true,
  className,
}: VerifiedBadgeProps) {
  const Badge = () => {
    if (variant === "badge") {
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full bg-secondary/10 text-secondary font-medium",
            badgeSizeClasses[size],
            className
          )}
        >
          <ShieldCheck className={sizeClasses[size]} />
          <span>Verified</span>
        </span>
      );
    }

    if (variant === "inline") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-secondary font-medium",
            className
          )}
        >
          <BadgeCheck className={sizeClasses[size]} />
          <span className="text-sm">Verified Creator</span>
        </span>
      );
    }

    return (
      <BadgeCheck
        className={cn(
          sizeClasses[size],
          "text-secondary fill-secondary/20",
          className
        )}
      />
    );
  };

  if (!showTooltip || variant !== "icon") {
    return <Badge />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">
          <Badge />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">Verified Creator</p>
      </TooltipContent>
    </Tooltip>
  );
}
