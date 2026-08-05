import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, GripVertical, Trash2, Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminFeatured() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCreators(); }, []);

  const fetchCreators = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, creator_profiles(category, rank_score)")
      .eq("type", "creator")
      .order("created_at", { ascending: false });
    setCreators(data || []);
    setLoading(false);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    await supabase.from("profiles").update({ is_verified: !current }).eq("id", id);
    toast.success(current ? "Removed featured status" : "Creator featured!");
    fetchCreators();
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Featured Listings</h1>
            <p className="text-muted-foreground text-sm">Manage featured/verified creators</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Creators", value: creators.length },
            { label: "Verified", value: creators.filter(c => c.is_verified).length },
            { label: "Unverified", value: creators.filter(c => !c.is_verified).length },
            { label: "Avg Rank", value: Math.round(creators.reduce((s, c) => s + (c.creator_profiles?.[0]?.rank_score || 0), 0) / (creators.length || 1)) },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <p className="font-heading text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm border border-border">
            <div className="p-5 border-b border-border">
              <h3 className="font-heading font-semibold">All Creators</h3>
            </div>
            <div className="divide-y divide-border">
              {creators.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                    {item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : item.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.creator_profiles?.[0]?.category || "Creator"} · {item.city || "Unknown"} · Score: {item.creator_profiles?.[0]?.rank_score || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{item.is_verified ? "Verified" : "Not verified"}</span>
                    <Switch checked={item.is_verified} onCheckedChange={() => toggleVerified(item.id, item.is_verified)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
