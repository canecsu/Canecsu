
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Globe, Shield } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  maintenance: boolean;
  notifySignups: boolean;
  notifyVerification: boolean;
  notifyReports: boolean;
  notifyDisputes: boolean;
  requireEmailVerification: boolean;
  autoSuspend: boolean;
};

const defaults: PlatformSettings = {
  platformName: "Canecsu",
  supportEmail: "support@canecsu.com",
  maintenance: false,
  notifySignups: true,
  notifyVerification: true,
  notifyReports: true,
  notifyDisputes: true,
  requireEmailVerification: true,
  autoSuspend: false,
};

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await (supabase.from("platform_settings" as any).select("key, value") as any);
      if (error) {
        toast.error("Settings could not be loaded", { description: error.message });
      } else {
        const next = { ...defaults } as Record<string, any>;
        (data || []).forEach((row: any) => {
          next[row.key] = row.value;
        });
        setSettings(next as PlatformSettings);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await (supabase.from("platform_settings" as any).upsert(rows, { onConflict: "key" }) as any);
      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Settings could not be saved", { description: error?.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mb-6">Settings are now stored securely in Supabase for all admins.</p>

        <div className="space-y-6 max-w-2xl">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold">General</h3>
            </div>
            <div className="space-y-4">
              <div><Label>Platform Name</Label><Input value={settings.platformName} onChange={(e) => update("platformName", e.target.value)} className="mt-1" disabled={loading} /></div>
              <div><Label>Support Email</Label><Input value={settings.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} className="mt-1" disabled={loading} /></div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Maintenance Mode</p><p className="text-xs text-muted-foreground">Store the platform-wide maintenance flag</p></div>
                <Switch checked={settings.maintenance} onCheckedChange={(value) => update("maintenance", value)} disabled={loading} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold">Notifications</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: "notifySignups" as const, label: "New user registrations", desc: "Store the signup notification preference" },
                { key: "notifyVerification" as const, label: "Verification requests", desc: "Store the verification alert preference" },
                { key: "notifyReports" as const, label: "Content reports", desc: "Store the flagged-content alert preference" },
                { key: "notifyDisputes" as const, label: "Dispute alerts", desc: "Store the dispute notification preference" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <Switch checked={settings[item.key]} onCheckedChange={(value) => update(item.key, value)} disabled={loading} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold">Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">Require email verification</p><p className="text-xs text-muted-foreground">Store the email-verification preference</p></div>
                <Switch checked={settings.requireEmailVerification} onCheckedChange={(value) => update("requireEmailVerification", value)} disabled={loading} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">Auto-suspend flagged accounts</p><p className="text-xs text-muted-foreground">Store the automatic moderation preference</p></div>
                <Switch checked={settings.autoSuspend} onCheckedChange={(value) => update("autoSuspend", value)} disabled={loading} />
              </div>
            </div>
          </div>

          <Button onClick={() => void save()} className="w-full" disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
