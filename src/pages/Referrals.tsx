import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Users, Crown, Star, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferrals();
      generateCode();
    } else {
      setLoading(false);
    }
  }, [user]);

  const generateCode = () => {
    if (!user) return;
    const code = `CANECSU-${user.id.substring(0, 8).toUpperCase()}`;
    setReferralCode(code);
  };

  const fetchReferrals = async () => {
    if (!user) return;
    const { data } = await supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
    setReferrals(data || []);
    setLoading(false);

    // Ensure referral code exists in DB
    const existing = (data || []).find(r => r.referrer_id === user.id);
    if (!existing) {
      const code = `CANECSU-${user.id.substring(0, 8).toUpperCase()}`;
      await supabase.from("referrals").insert({ referrer_id: user.id, referral_code: code });
    }
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    const { data, error } = await supabase.rpc("complete_referral", {
      p_referral_code: joinCode.trim().toUpperCase(),
    });

    if (error) {
      toast.error(error.message || "Failed to apply referral code");
      return;
    }

    setJoinCode("");
    const resultStatus = Array.isArray(data) ? data[0]?.result_status : data?.result_status;
    toast.success(
      resultStatus === "already_completed"
        ? "This referral was already applied."
        : "Referral applied! You both received 30 days of Pro access 🎉",
    );
  };

  const completedCount = referrals.filter(r => r.status === "completed").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/10">
        <section className="py-12 md:py-20">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">Invite & Earn</h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Share Canecsu with friends. When they join, you both get 30 days of free Pro access!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Users, title: "Invite Friends", desc: "Share your unique referral link" },
                { icon: Star, title: "They Join", desc: "Your friend signs up on Canecsu" },
                { icon: Crown, title: "Both Earn", desc: "30 days free Pro access for both" },
              ].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl p-6 shadow-card text-center border border-border/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            {user ? (
              <div className="space-y-6">
                <div className="bg-card rounded-3xl p-8 shadow-card border border-primary/10">
                  <h2 className="font-heading text-xl font-bold mb-4">Your Referral Link</h2>
                  <div className="flex gap-3">
                    <Input readOnly value={`${window.location.origin}/register?ref=${referralCode}`} className="bg-muted" />
                    <Button onClick={handleCopy} className="shrink-0">
                      {copied ? <><Check className="h-4 w-4 mr-2" />Copied</> : <><Copy className="h-4 w-4 mr-2" />Copy</>}
                    </Button>
                  </div>
                  <div className="flex items-center gap-6 mt-6">
                    <div className="text-center">
                      <p className="font-heading text-2xl font-bold text-primary">{referrals.length}</p>
                      <p className="text-xs text-muted-foreground">Invited</p>
                    </div>
                    <div className="text-center">
                      <p className="font-heading text-2xl font-bold text-secondary">{completedCount}</p>
                      <p className="text-xs text-muted-foreground">Joined</p>
                    </div>
                    <div className="text-center">
                      <p className="font-heading text-2xl font-bold text-amber-500">{completedCount * 30}</p>
                      <p className="text-xs text-muted-foreground">Days Earned</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-3xl p-8 shadow-card border border-border/50">
                  <h2 className="font-heading text-xl font-bold mb-4">Have a Referral Code?</h2>
                  <div className="flex gap-3">
                    <Input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter referral code" />
                    <Button onClick={handleJoin} variant="outline">Apply</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center bg-card rounded-3xl p-12 shadow-card">
                <p className="text-muted-foreground mb-4">Log in to get your referral link and start earning!</p>
                <Button asChild><a href="/login">Log In <ArrowRight className="h-4 w-4 ml-2" /></a></Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
