import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreatorCard } from "@/components/shared/CreatorCard";
import { supabase } from "@/integrations/supabase/client";
import { Creator } from "@/types/creator";

export type CreatorWithPlan = Creator & { plan?: string };

/* ---------------------------------------------------------
   3D element — cursor-reactive tilt card with a glare sheen
   that tracks the pointer. This is the section's signature.
--------------------------------------------------------- */
function TiltCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, { stiffness: 220, damping: 22 });
  const springRotateY = useSpring(rotateY, { stiffness: 220, damping: 22 });
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, hsl(var(--primary) / 0.15), transparent 60%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 12);
    rotateX.set((0.5 - py) * 12);
    glareX.set(px * 100);
    glareY.set(py * 100);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      style={{ perspective: 1000 }}
      className="group min-w-[280px] sm:min-w-[320px] md:min-w-[380px] shrink-0"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
        className="relative rounded-2xl will-change-transform"
      >
        {children}
        {/* Hidden on mobile to prevent sticky glare bugs, visible on desktop hover */}
        <motion.div
          aria-hidden="true"
          style={{ background: glareBackground }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden md:block"
        />
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------------------------------
   Small 3D accent ring next to the eyebrow — echoes the hero.
--------------------------------------------------------- */
function AccentRing() {
  return (
    <div className="relative hidden sm:block h-9 w-9" style={{ perspective: 400 }} aria-hidden="true">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/40"
        style={{ transformStyle: "preserve-3d", rotateX: 58 }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute h-1.5 w-1.5 rounded-full bg-primary"
          style={{ top: -3, left: "50%", marginLeft: -3, boxShadow: "0 0 8px 2px hsl(var(--primary) / 0.6)" }}
        />
      </motion.div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] shrink-0 rounded-2xl border border-border/50 overflow-hidden">
      <div className="h-44 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-8 w-full bg-muted rounded-lg animate-pulse mt-2" />
      </div>
    </div>
  );
}

export function FeaturedCreators() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [creators, setCreators] = useState<CreatorWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedCreators();
  }, []);

  const fetchFeaturedCreators = async () => {
    setLoading(true);

    const { data: profiles } = await supabase.from("profiles").select("*").eq("type", "creator");
    const { data: creatorProfiles } = await supabase.from("creator_profiles").select("*");
    const { data: reviewsData } = await supabase.from("reviews").select("creator_id, rating");
    const { data: subscriptionsData } = await supabase.from("subscriptions").select("user_id, plan_name");

    if (!profiles || !creatorProfiles) {
      setLoading(false);
      return;
    }

    const reviewAgg: Record<string, { total: number; count: number }> = {};
    (reviewsData || []).forEach(r => {
      if (!reviewAgg[r.creator_id]) reviewAgg[r.creator_id] = { total: 0, count: 0 };
      reviewAgg[r.creator_id].total += r.rating;
      reviewAgg[r.creator_id].count++;
    });

    const mapped: CreatorWithPlan[] = profiles.map(p => {
      const cp = creatorProfiles.find(c => c.profile_id === p.id);
      const rev = reviewAgg[p.id] || { total: 0, count: 0 };
      const sub = (subscriptionsData || []).find(s => s.user_id === p.id);
      const plan = sub?.plan_name || "free";

      return {
        id: p.id,
        name: p.name,
        bio: p.bio || undefined,
        avatarUrl: p.avatar_url || "/296fe121-5dfa-43f4-98b5-db50019738a7.jpg",
        coverUrl: p.cover_url || undefined,
        city: p.city || "Unknown",
        state: p.state || undefined,
        country: p.country || "India",
        category: (cp?.category || "photographer") as any,
        specializations: cp?.specializations || [],
        languages: cp?.languages || [],
        experienceYears: cp?.experience_years || 0,
        rating: rev.count > 0 ? rev.total / rev.count : 0,
        reviewCount: rev.count,
        responseRate: cp?.response_rate || 0,
        avgResponseTime: cp?.avg_response_time || "N/A",
        rankScore: cp?.rank_score || 0,
        cityRank: cp?.city_rank || 0,
        isVerified: p.is_verified,
        isOnline: false,
        priceRange: { min: cp?.price_min || 0, max: cp?.price_max || 0, currency: cp?.price_currency || "INR" },
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        plan: plan
      };
    });

    const getPlanWeight = (planName: string | undefined) => {
      const p = (planName || "free").toLowerCase();
      if (p.includes("business")) return 3;
      if (p.includes("pro") || p.includes("premium")) return 2;
      return 1;
    };

    const topRanked = mapped
      .sort((a, b) => {
        const weightA = getPlanWeight(a.plan);
        const weightB = getPlanWeight(b.plan);
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        return b.rankScore - a.rankScore;
      })
      .slice(0, 6);

    setCreators(topRanked);
    setLoading(false);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setActiveIndex(Math.round(progress * Math.max(creators.length - 1, 0)));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [creators]);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-20 right-[8%] w-72 h-72 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[4%] w-56 h-56 rounded-full bg-secondary/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2"
            >
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Top Talent</span>
              <AccentRing />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-heading text-3xl md:text-4xl font-bold mt-2"
            >
              Featured Creators
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground mt-2 max-w-lg"
            >
              Discover our highest-rated creators with exceptional portfolios and proven track records.
            </motion.p>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <motion.div whileHover={canScrollLeft ? { scale: 1.06 } : undefined} whileTap={canScrollLeft ? { scale: 0.94 } : undefined}>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full disabled:opacity-30"
                onClick={() => scroll("left")}
                disabled={loading || !canScrollLeft}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={canScrollRight ? { scale: 1.06 } : undefined} whileTap={canScrollRight ? { scale: 0.94 } : undefined}>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full disabled:opacity-30"
                onClick={() => scroll("right")}
                disabled={loading || !canScrollRight}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-6 overflow-x-hidden pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No featured creators available right now — check back soon.</p>
          </div>
        ) : (
          <div className="relative">
            {/* The white edge scroll shadow divs that obscured your cards have been removed here for perfect visibility */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {creators.map((creator, index) => (
                <div key={creator.id} style={{ scrollSnapAlign: "start" }}>
                  <TiltCard index={index}>
                    <CreatorCard
                      creator={creator}
                      variant="featured"
                      onView={(id) => navigate(`/creator/${id}`)}
                      onShortlist={(id) => console.log("Shortlist:", id)}
                      onMessage={(id) => navigate(`/creator/${id}`)}
                    />
                  </TiltCard>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && creators.length > 1 && (
          <div className="flex md:hidden justify-center gap-1.5 mt-5">
            {creators.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mt-10"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline" size="lg" asChild>
              <Link to="/search">
                View All Creators
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
