import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flag, Eye, Trash2, CheckCircle, Image } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminContent() {
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("portfolio_items")
      .select("*, profiles!portfolio_items_creator_id_fkey(name, city)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPortfolioItems(data || []);
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    await supabase.from("portfolio_items").delete().eq("id", id);
    toast.success("Content removed");
    fetchContent();
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Content Moderation</h1>
        <p className="text-muted-foreground text-sm mb-6">Review all portfolio content uploaded by creators</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <p className="font-heading text-2xl font-bold text-primary">{portfolioItems.length}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <p className="font-heading text-2xl font-bold text-secondary">{portfolioItems.filter(p => p.is_featured).length}</p>
            <p className="text-sm text-muted-foreground">Featured</p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <p className="font-heading text-2xl font-bold">{portfolioItems.filter(p => p.type === "image").length}</p>
            <p className="text-sm text-muted-foreground">Images</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3" />
            <p>No portfolio content uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {portfolioItems.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm group relative">
                <div className="aspect-square bg-muted">
                  <img src={item.url} alt={item.title || ""} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{item.profiles?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{item.profiles?.city || ""} · {item.type}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
