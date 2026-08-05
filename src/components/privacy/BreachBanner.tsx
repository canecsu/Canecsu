import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BreachItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

export function BreachBanner() {
  const { user } = useAuth();
  const [items, setItems] = useState<BreachItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("breach_dismissed") || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("breach_notifications")
      .select("id,title,message,severity,created_at")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setItems((data || []) as BreachItem[]));
  }, [user]);

  const visible = items.filter((i) => !dismissed.has(i.id));
  if (!user || visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("breach_dismissed", JSON.stringify([...next]));
  };

  return (
    <div className="sticky top-0 z-50 space-y-1">
      {visible.map((b) => (
        <div
          key={b.id}
          className={`flex items-start gap-3 px-4 py-2.5 text-sm border-b ${
            b.severity === "critical"
              ? "bg-destructive text-destructive-foreground"
              : "bg-amber-500/95 text-white"
          }`}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">{b.title}: </span>
            <span>{b.message}</span>
          </div>
          <button onClick={() => dismiss(b.id)} aria-label="Dismiss" className="opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}