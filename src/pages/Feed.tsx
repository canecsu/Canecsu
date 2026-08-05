import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Heart, RefreshCw, Search, TrendingUp, Grid3X3, LayoutGrid, X, BadgeCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Photography", "Videography", "Design", "Content", "Modeling", "Styling"];

export default function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [layout, setLayout] = useState<"masonry" | "grid">("masonry");

  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchProjects = useCallback(async (pageNum: number) => {
    if (loading) return;
    setLoading(true);

    const from = pageNum * 16;
    const to = from + 15;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast.error("Failed to load feed");
      setLoading(false);
      return;
    }

    if (!data || data.length < 16) setHasMore(false);

    // Fetch creator profiles - Added 'is_verified' to the select query
    const creatorIds = [...new Set((data || []).map((p: any) => p.creator_id))];
    if (creatorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, city, is_verified")
        .in("id", creatorIds);
      if (profilesData) {
        const profileMap = Object.fromEntries(profilesData.map(p => [p.id, p]));
        setProfiles(prev => ({ ...prev, ...profileMap }));
      }
    }

    setProjects(prev => pageNum === 0 ? (data || []) : [...prev, ...(data || [])]);
    setPage(pageNum);
    setLoading(false);
  }, [loading]);

  useEffect(() => { fetchProjects(0); }, []);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        fetchProjects(page + 1);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, loading, hasMore]);

  const getThumbnail = (project: any) => {
    if (project.cover_image_url) return project.cover_image_url;
    const img = project.content_blocks?.find((b: any) => b.type === "image");
    if (img) return typeof img.content === 'string' ? img.content : img.content?.[0];
    const grid = project.content_blocks?.find((b: any) => b.type === "grid");
    if (grid && Array.isArray(grid.content) && grid.content.length > 0) return grid.content[0];
    return null;
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [projects, searchQuery]);

  const refreshFeed = async () => {
    setProjects([]);
    setHasMore(true);
    await fetchProjects(0);
    toast.success("Feed refreshed!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero / Search Bar */}
      <section className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-7xl px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Layout Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
              <button
                onClick={() => setLayout("masonry")}
                className={cn("p-2 rounded-md transition-colors", layout === "masonry" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout("grid")}
                className={cn("p-2 rounded-md transition-colors", layout === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>

            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={refreshFeed}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feed Grid */}
      <section className="container max-w-7xl px-4 py-6">
        {filteredProjects.length === 0 && !loading ? (
          <div className="text-center py-24">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No projects found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <div className={cn(
            layout === "masonry"
              ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
              : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          )}>
            <AnimatePresence>
              {filteredProjects.map((project, i) => {
                const thumb = getThumbnail(project);
                const creator = profiles[project.creator_id];
                if (!thumb) return null;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className={cn(
                      "group cursor-pointer",
                      layout === "masonry" ? "break-inside-avoid" : ""
                    )}
                    onClick={() => navigate(`/creator/${project.creator_id}`)}
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-muted border border-border/30 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                      <img
                        src={thumb}
                        alt={project.title || "Project"}
                        className={cn(
                          "w-full object-cover group-hover:scale-[1.03] transition-transform duration-500",
                          layout === "grid" ? "aspect-square" : ""
                        )}
                        loading="lazy"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-white font-bold text-sm line-clamp-2 mb-2">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-3 text-white/80 text-xs">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" /> {project.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> {project.views || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center gap-2.5 mt-3 px-1">
                      <div className="w-7 h-7 rounded-full bg-muted overflow-hidden shrink-0 border border-border/50">
                        {creator?.avatar_url ? (
                          <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {creator?.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                            {creator?.name || "Creator"}
                          </p>
                          {/* Verified Badge Added Here */}
                          {creator?.is_verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                        {creator?.city && (
                          <p className="text-[10px] text-muted-foreground truncate">{creator.city}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        <div ref={loaderRef} className="h-16 flex justify-center items-center mt-4">
          {loading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm font-medium">Loading more...</span>
            </div>
          )}
          {!hasMore && projects.length > 0 && (
            <p className="text-sm text-muted-foreground">You've reached the end ✨</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
