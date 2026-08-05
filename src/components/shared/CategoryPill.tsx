import { cn } from "@/lib/utils";
import { CreatorCategory, CATEGORY_LABELS, CATEGORY_ICONS } from "@/types/creator";

interface CategoryPillProps {
  category: CreatorCategory;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  variant?: "default" | "outline" | "filled";
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

const categoryColors: Record<CreatorCategory, string> = {
  'photographer': "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  'influencer': "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  'videographer': "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  'model': "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  'artist': "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  'makeup-artist': "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  'video-editor': "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  'agency': "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  'graphic-designer': "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  'singer': "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800",
  'dj': "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  'music-band': "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
};

export function CategoryPill({
  category,
  size = "md",
  showIcon = true,
  variant = "default",
  className,
  onClick,
  isSelected,
}: CategoryPillProps) {
  const label = CATEGORY_LABELS[category];
  const icon = CATEGORY_ICONS[category];
  
  const baseClasses = "inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200";
  
  const variantClasses = {
    default: cn(categoryColors[category], "border"),
    outline: "border-2 border-current bg-transparent",
    filled: "bg-primary text-primary-foreground",
  };

  const interactiveClasses = onClick 
    ? "cursor-pointer hover:scale-105 active:scale-95" 
    : "";

  const selectedClasses = isSelected
    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
    : "";

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        interactiveClasses,
        selectedClasses,
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showIcon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

interface CategoryPillsProps {
  categories: CreatorCategory[];
  selected?: CreatorCategory[];
  onSelect?: (category: CreatorCategory) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CategoryPills({
  categories,
  selected = [],
  onSelect,
  size = "md",
  className,
}: CategoryPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => (
        <CategoryPill
          key={category}
          category={category}
          size={size}
          onClick={onSelect ? () => onSelect(category) : undefined}
          isSelected={selected.includes(category)}
        />
      ))}
    </div>
  );
}
