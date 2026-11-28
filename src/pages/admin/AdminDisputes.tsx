import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, CheckCircle, Calendar, IndianRupee } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminDisputes() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, creator:profiles!bookings_creator_id_fkey(name), client:profiles!bookings_client_id_fkey(name)")
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status: status as any }).eq("id", id);
    toast.success(`Booking ${status}`);
    fetchBookings();
  };

  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed");
  const completed = bookings.filter(b => b.status === "completed");
  const totalRev = bookings.filter(b => b.status === "completed").reduce((s, b) => s + b.total_price, 0);

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Booking & Dispute Management</h1>
        <p className="text-muted-foreground text-sm mb-6">View all bookings and manage disputes</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pending", value: pending.length, icon: AlertOctagon, color: "text-yellow-500" },
            { label: "Confirmed", value: confirmed.length, icon: Calendar, color: "text-primary" },
            { label: "Completed", value: completed.length, icon: CheckCircle, color: "text-secondary" },
            { label: "Total Revenue", value: `₹${(totalRev / 1000).toFixed(1)}K`, icon: IndianRupee, color: "text-green-500" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="font-heading text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No bookings found.</div>
            ) : bookings.map((b) => (
              <div key={b.id} className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-heading font-semibold text-sm">#{b.id.slice(0, 8)}</p>
                    <Badge variant={b.status === "confirmed" ? "default" : b.status === "completed" ? "secondary" : b.status === "cancelled" ? "destructive" : "outline"} className="text-[10px] capitalize">
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {b.client?.name || "Client"} → {b.creator?.name || "Creator"} · ₹{b.total_price.toLocaleString()} · {b.booking_date}
                  </p>
                </div>
                <div className="flex gap-2">
                  {b.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => updateStatus(b.id, "confirmed")}>
                        <CheckCircle className="h-4 w-4 mr-1" />Confirm
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => updateStatus(b.id, "cancelled")}>Cancel</Button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <Button size="sm" onClick={() => updateStatus(b.id, "completed")}>
                      <CheckCircle className="h-4 w-4 mr-1" />Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}

