import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, CreditCard, CheckCircle, AlertCircle, Clock, ArrowRight, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EscrowPayment {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  released_at: string | null;
}

export default function EscrowBooking() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPayments();
    else setLoading(false);
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("escrow_payments")
      .select("*")
      .or(`client_id.eq.${user.id},creator_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    held: { color: "bg-amber-100 text-amber-700", icon: Clock, label: "Payment Held" },
    released: { color: "bg-secondary/10 text-secondary", icon: CheckCircle, label: "Released" },
    refunded: { color: "bg-destructive/10 text-destructive", icon: AlertCircle, label: "Refunded" },
    disputed: { color: "bg-primary/10 text-primary", icon: Shield, label: "In Dispute" },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/10">
        <section className="py-12 md:py-20">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">Secure Booking & Escrow</h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Your payments are held securely until the project is completed. Safe for both clients and creators.
              </p>
            </div>

            {/* How it works */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: CreditCard, title: "Client Pays", desc: "Advance payment when booking" },
                { icon: Lock, title: "Held Securely", desc: "Platform holds the funds" },
                { icon: CheckCircle, title: "Work Completed", desc: "Creator delivers the work" },
                { icon: DollarSign, title: "Payment Released", desc: "Creator gets paid (minus 10% fee)" },
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl p-5 shadow-card text-center border border-border/50 relative">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">{i + 1}</div>
                  <step.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <h3 className="font-heading font-bold text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Payment history */}
            {user ? (
              <div className="bg-card rounded-3xl p-8 shadow-card border border-border/50">
                <h2 className="font-heading text-xl font-bold mb-6">Your Escrow Payments</h2>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No escrow payments yet. They'll appear here when you book a creator.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map(p => {
                      const config = statusConfig[p.status] || statusConfig.held;
                      const StatusIcon = config.icon;
                      return (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">₹{p.amount.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} • Fee: ₹{p.platform_fee.toLocaleString()}</p>
                            </div>
                          </div>
                          <Badge className={config.color}>{config.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center bg-card rounded-3xl p-12 shadow-card">
                <p className="text-muted-foreground mb-4">Log in to view your escrow payments.</p>
                <Button asChild><a href="/login">Log In <ArrowRight className="h-4 w-4 ml-2" /></a></Button>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "🔒 SSL Encrypted",
                "🛡️ Fraud Protection",
                "⚡ Instant Refunds",
                "📞 24/7 Support",
              ].map((badge, i) => (
                <div key={i} className="bg-card rounded-xl p-4 text-center shadow-card border border-border/50">
                  <p className="text-sm font-medium">{badge}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
