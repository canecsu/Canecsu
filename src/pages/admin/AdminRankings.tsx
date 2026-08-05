import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const rankingFactors = [
  { name: "Portfolio Quality", key: "portfolio", default: 25 },
  { name: "Client Ratings", key: "ratings", default: 25 },
  { name: "Response Rate", key: "response", default: 15 },
  { name: "Activity Level", key: "activity", default: 15 },
  { name: "Verification Status", key: "verified", default: 10 },
  { name: "Completed Bookings", key: "bookings", default: 10 },
];

export default function AdminRankings() {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(rankingFactors.map((f) => [f.key, f.default]))
  );
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCreators(); }, []);

  const fetchCreators = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*, creator_profiles(*)")
      .eq("type", "creator");

    const { data: reviews } = await supabase.from("reviews").select("creator_id, rating");
    const reviewAgg: Record<string, { total: number; count: number }> = {};
    (reviews || []).forEach(r => {
      if (!reviewAgg[r.creator_id]) reviewAgg[r.creator_id] = { total: 0, count: 0 };
      reviewAgg[r.creator_id].total += r.rating;
      reviewAgg[r.creator_id].count++;
    });

    const mapped = (profiles || []).map(p => {
      const cp = p.creator_profiles?.[0];
      const rev = reviewAgg[p.id] || { total: 0, count: 0 };
      return {
        id: p.id,
        name: p.name,
        category: cp?.category || "photographer",
        city: p.city || "Unknown",
        rank_score: cp?.rank_score || 0,
        rating: rev.count > 0 ? (rev.total / rev.count).toFixed(1) : "0",
        is_verified: p.is_verified,
        avatar_url: p.avatar_url,
      };
    }).sort((a, b) => b.rank_score - a.rank_score);

    setCreators(mapped);
    setLoading(false);
  };

  const updateScore = async (profileId: string, newScore: number) => {
    await supabase.from("creator_profiles").update({ rank_score: newScore }).eq("profile_id", profileId);
    toast.success("Score updated");
    fetchCreators();
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Ranking Controls</h1>
            <p className="text-muted-foreground text-sm">Configure ranking algorithm and manage scores</p>
          </div>
          <Button onClick={() => { fetchCreators(); toast.success("Rankings refreshed"); }} className="gap-2">
            <RefreshCw className="h-4 w-4" />Refresh
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-heading font-semibold mb-4">Algorithm Weights</h3>
              <p className={`text-xs mb-4 ${total === 100 ? "text-secondary" : "text-destructive"}`}>
                Total: {total}% {total !== 100 && "(must equal 100%)"}
              </p>
              <div className="space-y-5">
                {rankingFactors.map((factor) => (
                  <div key={factor.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{factor.name}</span>
                      <span className="font-medium">{weights[factor.key]}%</span>
                    </div>
                    <Slider
                      value={[weights[factor.key]]}
                      onValueChange={([v]) => setWeights(prev => ({ ...prev, [factor.key]: v }))}
                      max={50} step={5}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : (
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-heading font-semibold">Current Leaderboard ({creators.length})</h3>
                </div>
                <div className="divide-y divide-border">
                  {creators.map((creator, idx) => (
                    <div key={creator.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className="w-8 text-center">
                        {idx === 0 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> :
                         idx === 1 ? <Medal className="h-5 w-5 text-gray-400 mx-auto" /> :
                         idx === 2 ? <Medal className="h-5 w-5 text-amber-600 mx-auto" /> :
                         <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>}
                      </div>
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                        {creator.avatar_url ? <img src={creator.avatar_url} className="w-full h-full object-cover" /> : creator.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{creator.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{creator.category.replace("-", " ")} · {creator.city} · ⭐ {creator.rating}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          defaultValue={creator.rank_score}
                          className="w-20 h-8 text-sm text-center"
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== creator.rank_score) updateScore(creator.id, val);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
