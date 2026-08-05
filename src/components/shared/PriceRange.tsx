import { IndianRupee, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceRangeProps {
  min: number;
  max: number;
  currency?: "INR" | "USD";
  size?: "sm" | "md" | "lg";
  variant?: "compact" | "full" | "badge";
  className?: string;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const formatPrice = (price: number, currency: "INR" | "USD"): string => {
  if (currency === "INR") {
    if (price >= 100000) {
      return `${(price / 100000).toFixed(1)}L`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  }
  
  // USD
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`;
  }
  return price.toString();
};

export function PriceRange({
  min,
  max,
  currency = "INR",
  size = "md",
  variant = "compact",
  className,
}: PriceRangeProps) {
  const CurrencyIcon = currency === "INR" ? IndianRupee : DollarSign;
  const formattedMin = formatPrice(min, currency);
  const formattedMax = formatPrice(max, currency);

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium",
          sizeClasses[size],
          className
        )}
      >
        <CurrencyIcon className={iconSizeClasses[size]} />
        <span>{formattedMin} - {formattedMax}</span>
      </span>
    );
  }

  if (variant === "full") {
    return (
      <div className={cn("flex flex-col", className)}>
        <span className="text-xs text-muted-foreground">Starting from</span>
        <span className={cn("flex items-center font-semibold text-foreground", sizeClasses[size])}>
          <CurrencyIcon className={iconSizeClasses[size]} />
          {formattedMin}
          <span className="mx-1 text-muted-foreground">-</span>
          <CurrencyIcon className={iconSizeClasses[size]} />
          {formattedMax}
        </span>
      </div>
    );
  }

  // Compact variant
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium text-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      <CurrencyIcon className={cn(iconSizeClasses[size], "mr-0.5")} />
      <span>{formattedMin}</span>
      <span className="mx-0.5">-</span>
      <span>{formattedMax}</span>
    </span>
  );
}
