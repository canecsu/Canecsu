import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Play, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PortfolioItem {
  id: string;
  url: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  type: string;
  tags?: string[] | null;
  is_featured: boolean;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

interface PortfolioGridProps {
  items: PortfolioItem[];
  onItemClick: (item: PortfolioItem) => void;
  className?: string;
}

function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { rootMargin: "200px" });
    obs.observe(node);
  }, []);

  return (
    <div ref={ref} className={cn("bg-muted", className)}>
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.04]",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {(!inView || !loaded) && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
}

export function PortfolioGrid({ items, onItemClick, className }: PortfolioGridProps) {
  const { user } = useAuth();
  const [enrichedItems, setEnrichedItems] = useState<PortfolioItem[]>([]);

  useEffect(() => { enrichItems(); }, [items, user]);

  const enrichItems = async () => {
    if (items.length === 0) { setEnrichedItems([]); return; }
    const ids = items.map(i => i.id);
    const [likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("project_likes").select("portfolio_item_id").in("portfolio_item_id", ids),
      supabase.from("project_comments").select("portfolio_item_id").in("portfolio_item_id", ids),
      user ? supabase.from("project_likes").select("portfolio_item_id").eq("user_id", user.id).in("portfolio_item_id", ids) : Promise.resolve({ data: [] }),
    ]);
    const likeCounts: Record<string, number> = {};
    const commentCounts: Record<string, number> = {};
    const userLikedIds = new Set((userLikesRes.data || []).map((l: any) => l.portfolio_item_id));
    (likesRes.data || []).forEach((l: any) => { likeCounts[l.portfolio_item_id] = (likeCounts[l.portfolio_item_id] || 0) + 1; });
    (commentsRes.data || []).forEach((c: any) => { commentCounts[c.portfolio_item_id] = (commentCounts[c.portfolio_item_id] || 0) + 1; });
    setEnrichedItems(items.map(item => ({
      ...item,
      likesCount: likeCounts[item.id] || 0,
      commentsCount: commentCounts[item.id] || 0,
      isLiked: userLikedIds.has(item.id),
    })));
  };

  const toggleLike = async (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation();
    if (!user) { toast.error("Please log in"); return; }
    if (item.isLiked) {
      await supabase.from("project_likes").delete().eq("portfolio_item_id", item.id).eq("user_id", user.id);
    } else {
      await supabase.from("project_likes").insert({ portfolio_item_id: item.id, user_id: user.id });
    }
    enrichItems();
  };

  const handleShare = async (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation();
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: item.title || "Project", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  if (enrichedItems.length === 0) {
    return (
      <div className="bg-muted/30 rounded-2xl p-16 text-center border border-dashed border-border">
        <p className="text-muted-foreground text-sm">No projects yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", className)}>
      {enrichedItems.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
          onClick={() => onItemClick(item)}
          className="group relative rounded-xl overflow-hidden bg-card cursor-pointer border border-border/30 hover:border-border/60 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {item.type === "video" ? (
              <>
                <LazyImage src={item.url} alt={item.title || "Project"} className="absolute inset-0" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </>
            ) : (
              <LazyImage src={item.url} alt={item.title || "Project"} className="absolute inset-0" />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={(e) => toggleLike(e, item)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-lg",
                    item.isLiked ? "bg-primary text-primary-foreground" : "bg-white/20 text-white hover:bg-white/30"
                  )}
                >
                  <Heart className={cn("h-4 w-4", item.isLiked && "fill-current")} />
                </button>
                <button
                  onClick={(e) => handleShare(e, item)}
                  className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 flex items-center justify-center transition-all shadow-lg"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* View Project CTA */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Project</span>
                </div>
              </div>
            </div>

            {/* Featured badge */}
            {item.is_featured && (
              <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md text-primary-foreground px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                Featured
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="p-4">
            <h3 className="font-bold text-sm text-foreground truncate mb-1">
              {item.title || "Untitled Project"}
            </h3>
            {item.category && (
              <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                {item.category}
              </span>
            )}
            <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-border/30">
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Heart className={cn("h-3.5 w-3.5", item.isLiked && "fill-primary text-primary")} />
                {item.likesCount || 0}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <MessageCircle className="h-3.5 w-3.5" />
                {item.commentsCount || 0}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
