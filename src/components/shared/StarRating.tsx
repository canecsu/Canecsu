import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = true,
  reviewCount,
  className,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], "fill-primary text-primary")}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn(sizeClasses[size], "text-muted-foreground/30")} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizeClasses[size], "fill-primary text-primary")} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], "text-muted-foreground/30")}
          />
        ))}
      </div>
      
      {showValue && (
        <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
