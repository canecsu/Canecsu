import { Heart, Briefcase, MapPin, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Creator } from "@/types/creator";
import { StarRating } from "./StarRating";
import { RankBadge } from "./RankBadge";
import { CategoryPill } from "./CategoryPill";
import { VerifiedBadge } from "./VerifiedBadge";
import { AvailabilityIndicator } from "./AvailabilityIndicator";
import { PriceRange } from "./PriceRange";
import { Button } from "@/components/ui/button";

interface CreatorCardProps {
  creator: Creator;
  variant?: "default" | "compact" | "featured";
  onView?: (id: string) => void;
  onShortlist?: (id: string) => void;
  onMessage?: (id: string) => void;
  onBook?: (id: string) => void;
  isShortlisted?: boolean;
  className?: string;
}

export function CreatorCard({
  creator,
  variant = "default",
  onView,
  onShortlist,
  onMessage,
  onBook,
  isShortlisted = false,
  className,
}: CreatorCardProps) {
  const handleClick = () => {
    onView?.(creator.id);
  };

  // Plan extract kiya
  const creatorPlan = (creator as any).plan || "free";
  const paidVerificationActive = Boolean((creator as any).isPaidBadge);

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "group relative flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover cursor-pointer",
          className
        )}
        onClick={handleClick}
      >
        <div className="relative">
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className="h-16 w-16 rounded-xl object-cover"
          />
          {creator.isVerified && creatorPlan === "free" && (
            <div className="absolute -bottom-1 -right-1">
              <VerifiedBadge size="sm" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-foreground truncate">
              {creator.name}
            </h3>
            
            {/* 🟡 🔵 NEW BADGES */}
            {creatorPlan === 'business' && <span title="Business Verified"><BadgeCheck className="w-4 h-4 text-white fill-yellow-500 shrink-0" /></span>}
            {creatorPlan === 'pro' && <span title="Premium Verified"><BadgeCheck className="w-4 h-4 text-white fill-blue-500 shrink-0" /></span>}
            {paidVerificationActive && <span title="Canecsu Creator Verification"><BadgeCheck className="w-4 h-4 text-white fill-amber-500 shrink-0" /></span>}
            
            <AvailabilityIndicator isOnline={creator.isOnline} size="sm" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <CategoryPill category={creator.category} size="sm" showIcon={false} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {creator.city}
            </span>
          </div>
          <StarRating rating={creator.rating} size="sm" reviewCount={creator.reviewCount} className="mt-1" />
        </div>

        <RankBadge rank={creator.cityRank} city={creator.city} size="sm" variant="compact" />
      </motion.div>
    );
  }

  if (variant === "featured") {
    return (
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className={cn(
          "group relative rounded-3xl bg-card overflow-hidden shadow-card transition-all hover:shadow-glow-primary cursor-pointer",
          className
        )}
        onClick={handleClick}
      >
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={creator.coverUrl || creator.avatarUrl}
            alt={creator.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Rank Badge */}
          <div className="absolute top-4 left-4">
            <RankBadge rank={creator.cityRank} city={creator.city} size="md" />
          </div>
          
          {/* Shortlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShortlist?.(creator.id);
            }}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-full transition-all",
              isShortlisted
                ? "bg-primary text-primary-foreground"
                : "bg-white/80 text-foreground hover:bg-white"
            )}
          >
            <Heart className={cn("h-5 w-5", isShortlisted && "fill-current")} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-14 w-14 rounded-xl object-cover border-2 border-card -mt-10 relative z-10"
                />
                {creator.isVerified && creatorPlan === "free" && (
                  <div className="absolute -bottom-1 -right-1">
                    <VerifiedBadge size="md" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    {creator.name}
                  </h3>
                  
                  {/* 🟡 🔵 NEW BADGES */}
                  {creatorPlan === 'business' && <span title="Business Verified"><BadgeCheck className="w-5 h-5 text-white fill-yellow-500 shrink-0" /></span>}
                  {creatorPlan === 'pro' && <span title="Premium Verified"><BadgeCheck className="w-5 h-5 text-white fill-blue-500 shrink-0" /></span>}
                    {paidVerificationActive && <span title="Canecsu Creator Verification"><BadgeCheck className="w-5 h-5 text-white fill-amber-500 shrink-0" /></span>}
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {creator.city}, {creator.state}
                </div>
              </div>
            </div>
            <AvailabilityIndicator isOnline={creator.isOnline} variant="badge" size="sm" />
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <CategoryPill category={creator.category} size="sm" />
            {creator.specializations.slice(0, 2).map((spec) => (
              <span
                key={spec}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <StarRating rating={creator.rating} reviewCount={creator.reviewCount} />
            <PriceRange
              min={creator.priceRange.min}
              max={creator.priceRange.max}
              currency={creator.priceRange.currency as "INR" | "USD"}
              size="sm"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                (onBook || onMessage)?.(creator.id);
              }}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Book Now
            </Button>
            <Button
              size="sm"
              className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
              onClick={handleClick}
            >
              View Profile
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={cn(
        "group relative rounded-2xl bg-card overflow-hidden shadow-card transition-all hover:shadow-card-hover cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={creator.avatarUrl}
          alt={creator.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Rank Badge */}
        <div className="absolute top-3 left-3">
          <RankBadge rank={creator.cityRank} city={creator.city} size="sm" variant="compact" />
        </div>
        
        {/* Shortlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShortlist?.(creator.id);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-all",
            isShortlisted
              ? "bg-primary text-primary-foreground"
              : "bg-white/80 text-foreground hover:bg-white"
          )}
        >
          <Heart className={cn("h-4 w-4", isShortlisted && "fill-current")} />
        </button>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-white text-lg drop-shadow-md">
                {creator.name}
              </h3>
              
              {/* 🟡 🔵 NEW BADGES */}
              {creatorPlan === 'business' && <span title="Business Verified"><BadgeCheck className="w-5 h-5 text-white fill-yellow-500 shrink-0 drop-shadow-md" /></span>}
              {creatorPlan === 'pro' && <span title="Premium Verified"><BadgeCheck className="w-5 h-5 text-white fill-blue-500 shrink-0 drop-shadow-md" /></span>}
              {paidVerificationActive && <span title="Canecsu Creator Verification"><BadgeCheck className="w-5 h-5 text-white fill-amber-500 shrink-0 drop-shadow-md" /></span>}
              
              {creator.isVerified && creatorPlan === "free" && <VerifiedBadge size="sm" />}
            </div>
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {creator.city}
            </div>
          </div>
          <AvailabilityIndicator isOnline={creator.isOnline} variant="badge" size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CategoryPill category={creator.category} size="sm" />
        </div>
        
        <div className="flex items-center justify-between">
          <StarRating rating={creator.rating} size="sm" reviewCount={creator.reviewCount} />
          <PriceRange
            min={creator.priceRange.min}
            max={creator.priceRange.max}
            currency={creator.priceRange.currency as "INR" | "USD"}
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
