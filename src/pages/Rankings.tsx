import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Crown, Medal, BadgeCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StarRating } from "@/components/shared/StarRating";
import { CategoryPill } from "@/components/shared/CategoryPill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indianCities, allCategories } from "@/data/mockData";
import { CATEGORY_LABELS } from "@/types/creator";
import { supabase } from "@/integrations/supabase/client";

interface RankedCreator {
  id: string;
  name: string;
  avatar_url: string | null;
  is_verified: boolean;
  city: string | null;
  category: string;
  rank_score: number;
  avg_rating: number;
  review_count: number;
}

const Rankings = () => {
  const navigate = useNavigate();
  const [cityFilter, setCityFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [ranked, setRanked] = useState<RankedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRankings(); }, []);

  const fetchRankings = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, name, avatar_url, is_verified, city").eq("type", "creator");
    const { data: cps } = await supabase.from("creator_profiles").select("profile_id, category, rank_score");
    const { data: reviews } = await supabase.from("reviews").select("creator_id, rating");

    if (!profiles || !cps) { setLoading(false); return; }

    const revAgg: Record<string, { total: number; count: number }> = {};
    (reviews || []).forEach(r => {
      if (!revAgg[r.creator_id]) revAgg[r.creator_id] = { total: 0, count: 0 };
      revAgg[r.creator_id].total += r.rating;
      revAgg[r.creator_id].count++;
    });

    const list: RankedCreator[] = profiles.map(p => {
      const cp = cps.find(c => c.profile_id === p.id);
      const rv = revAgg[p.id] || { total: 0, count: 0 };
      return {
        id: p.id, name: p.name, avatar_url: p.avatar_url, is_verified: p.is_verified, city: p.city,
        category: cp?.category || "photographer",
        rank_score: cp?.rank_score || 0,
        avg_rating: rv.count > 0 ? rv.total / rv.count : 0,
        review_count: rv.count,
      };
    }).sort((a, b) => b.rank_score - a.rank_score);

    setRanked(list);
    setLoading(false);
  };

  let filtered = [...ranked];
  if (cityFilter && cityFilter !== "all") filtered = filtered.filter(c => c.city === cityFilter);
  if (catFilter && catFilter !== "all") filtered = filtered.filter(c => c.category === catFilter);

  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown className="h-6 w-6 text-primary" />;
    if (i === 1) return <Medal className="h-6 w-6 text-muted-foreground" />;
    if (i === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="font-heading font-bold text-lg text-muted-foreground">#{i + 1}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Trophy className="h-4 w-4" /> Leaderboard
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Creator Rankings</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Transparent, data-driven rankings updated weekly</p>
            </motion.div>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {indianCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card mb-8 max-w-2xl mx-auto">
              <h3 className="font-heading font-semibold text-sm mb-3 text-center">How Rankings Work</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                {[["Portfolio", "25%"], ["Ratings", "25%"], ["Response", "15%"], ["Activity", "15%"], ["Verified", "10%"], ["Bookings", "10%"]].map(([label, pct]) => (
                  <div key={label} className="p-2 bg-muted rounded-xl">
                    <p className="font-heading font-bold text-primary text-sm">{pct}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No creators found.</p>
                ) : filtered.map((creator, i) => (
                  <motion.div key={creator.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/creator/${creator.id}`)}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-card-hover ${i === 0 ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20" : "bg-card shadow-card"}`}>
                    <div className="w-10 text-center shrink-0">{getRankIcon(i)}</div>
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                      {creator.avatar_url ? <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{creator.name.charAt(0)}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold truncate">{creator.name}</span>
                        {/* Verified Badge Added Here */}
                        {creator.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryPill category={creator.category as any} size="sm" showIcon={false} />
                        {creator.city && <span className="text-xs text-muted-foreground">{creator.city}</span>}
                      </div>
                    </div>
                    <StarRating rating={creator.avg_rating} size="sm" />
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-primary">{creator.rank_score}</p>
                      <p className="text-xs text-muted-foreground">{creator.review_count} reviews</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Rankings;
