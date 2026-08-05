import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AdminVerification() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [verified, setVerified] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pendingRes, verifiedRes] = await Promise.all([
      supabase.from("profiles").select("*, creator_profiles(category)").eq("type", "creator").eq("is_verified", false),
      supabase.from("profiles").select("*, creator_profiles(category)").eq("type", "creator").eq("is_verified", true).order("created_at", { ascending: false }).limit(20),
    ]);
    
    if (pendingRes.error) console.error("Pending fetch error:", pendingRes.error);
    if (verifiedRes.error) console.error("Verified fetch error:", verifiedRes.error);

    setPending(pendingRes.data || []);
    setVerified(verifiedRes.data || []);
    setLoading(false);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (action === "approve") {
      // 1. APPROVE LOGIC (Update Database)
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: true }) 
        .eq("id", id);

      if (error) {
        console.error("Verification Error:", error);
        toast.error(`Approval Failed: ${error.message}`);
        return; 
      }

      toast.success("Creator verified successfully!");
      
      // Update UI
      const approvedCreator = pending.find(p => p.id === id);
      setPending(prev => prev.filter(p => p.id !== id));
      if (approvedCreator) {
        setVerified(prev => [{ ...approvedCreator, is_verified: true }, ...prev]);
      }

    } else if (action === "reject") {
      // 2. REJECT & DELETE LOGIC (Delete from Database)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete Error:", error);
        toast.error(`Delete Failed: ${error.message}`);
        return;
      }

      toast.success("Request rejected & deleted from database!");
      
      // Update UI
      setPending(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleRevoke = async (id: string) => {
    // REVOKE LOGIC (Update Database)
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", id);

    if (error) {
      console.error("Revoke Error:", error);
      toast.error(`Failed to revoke: ${error.message}`);
      return;
    }

    toast.success("Verification revoked.");
    
    // Update UI
    const revokedCreator = verified.find(v => v.id === id);
    setVerified(prev => prev.filter(v => v.id !== id));
    if (revokedCreator) {
      setPending(prev => [{ ...revokedCreator, is_verified: false }, ...prev]);
    }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Verification Queue</h1>
        <p className="text-muted-foreground text-sm mb-6">Review and approve creator verification requests</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending", value: pending.length, icon: Clock, color: "text-yellow-500" },
            { label: "Verified", value: verified.length, icon: CheckCircle, color: "text-secondary" },
            { label: "Total Creators", value: pending.length + verified.length, icon: Eye, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="font-heading text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="verified">Recently Verified ({verified.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((item) => (
                  <div key={item.id} className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col md:flex-row md:items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                      {item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : item.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold">{item.name || "Unknown User"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.creator_profiles?.[0]?.category || "Creator"} · {item.city || "Unknown Location"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/creator/${item.id}`)}>
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                      <Button variant="default" size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => handleAction(item.id, "approve")}>
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleAction(item.id, "reject")}>
                        <XCircle className="h-4 w-4 mr-1" />Reject & Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {pending.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-secondary" />
                    <p className="font-medium">All caught up! No pending verifications.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verified">
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              {verified.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm overflow-hidden">
                      {d.avatar_url ? <img src={d.avatar_url} className="w-full h-full object-cover" /> : d.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{d.name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">{d.city || "Unknown location"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs bg-secondary">Verified</Badge>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleRevoke(d.id)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
              {verified.length === 0 && <p className="p-8 text-center text-muted-foreground">No verified creators yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminLayout>
  );
}
