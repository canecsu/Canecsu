import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  city: string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const getRankColor = (rank: number) => {
  if (rank === 1) return "from-yellow-400 to-amber-500 text-amber-900";
  if (rank === 2) return "from-gray-300 to-gray-400 text-gray-800";
  if (rank === 3) return "from-orange-300 to-orange-400 text-orange-900";
  if (rank <= 10) return "from-primary/80 to-primary text-primary-foreground";
  return "from-muted to-muted text-muted-foreground";
};

export function RankBadge({
  rank,
  city,
  trend,
  trendValue,
  size = "md",
  variant = "default",
  className,
}: RankBadgeProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-secondary" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-gradient-to-r font-bold",
          getRankColor(rank),
          sizeClasses[size],
          className
        )}
      >
        <Trophy className={iconSizeClasses[size]} />
        <span>#{rank}</span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-card border border-border p-3",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-br w-12 h-12",
            getRankColor(rank)
          )}
        >
          <span className="text-xl font-bold">#{rank}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            Rank #{rank} in {city}
          </span>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>
                {trend === "up" && "+"}
                {trend === "down" && "-"}
                {trendValue} this week
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r font-semibold",
        getRankColor(rank),
        sizeClasses[size],
        className
      )}
    >
      <Trophy className={iconSizeClasses[size]} />
      <span>Rank #{rank} in {city}</span>
    </div>
  );
}
