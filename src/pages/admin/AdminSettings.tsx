import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Bell, Shield } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformName: "Canecsu",
    supportEmail: "support@canecsu.com",
    maintenance: false,
    notifySignups: true,
    notifyVerification: true,
    notifyReports: true,
    notifyDisputes: true,
    requireEmailVerification: true,
    autoSuspend: false,
  });

  const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mb-6">Configure platform-wide settings</p>

        <div className="space-y-6 max-w-2xl">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-semibold">General</h3>
            </div>
            <div className="space-y-4">
              <div><Label>Platform Name</Label><Input value={settings.platformName} onChange={e => update("platformName", e.target.value)} className="mt-1" /></div>
              <div><Label>Support Email</Label><Input value={settings.supportEmail} onChange={e => update("supportEmail", e.target.value)} className="mt-1" /></div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Maintenance Mode</p><p className="text-xs text-muted-foreground">Temporarily disable public access</p></div>
                <Switch checked={settings.maintenance} onCheckedChange={v => update("maintenance", v)} />
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
                { key: "notifySignups", label: "New user registrations", desc: "Get notified on signup" },
                { key: "notifyVerification", label: "Verification requests", desc: "Alert on new requests" },
                { key: "notifyReports", label: "Content reports", desc: "Flagged content alerts" },
                { key: "notifyDisputes", label: "Dispute alerts", desc: "New dispute notifications" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <Switch checked={(settings as any)[item.key]} onCheckedChange={v => update(item.key, v)} />
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
                <div><p className="text-sm font-medium">Require email verification</p><p className="text-xs text-muted-foreground">Users must verify email before access</p></div>
                <Switch checked={settings.requireEmailVerification} onCheckedChange={v => update("requireEmailVerification", v)} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">Auto-suspend flagged accounts</p><p className="text-xs text-muted-foreground">After 5+ reports</p></div>
                <Switch checked={settings.autoSuspend} onCheckedChange={v => update("autoSuspend", v)} />
              </div>
            </div>
          </div>

          <Button onClick={() => toast.success("Settings saved successfully!")} className="w-full">Save Changes</Button>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
