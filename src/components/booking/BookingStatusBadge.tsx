import { Badge } from "@/components/ui/badge";
import { STATUS_META, STAGES, stageIndex } from "@/lib/booking";
import { cn } from "@/lib/utils";

export function BookingStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.requested;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-bold border", meta.tone)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

export function BookingProgress({ status }: { status: string }) {
  const idx = stageIndex(status);
  if (idx < 0) return null;
  const labels = ["Requested", "Approved", "Advance Paid", "In Progress", "Work Done", "Paid"];
  return (
    <div className="flex items-center gap-1 mt-2">
      {labels.map((l, i) => (
        <div key={l} className="flex-1">
          <div className={cn(
            "h-1.5 rounded-full transition-all",
            i <= idx ? "bg-primary" : "bg-muted"
          )} />
          <div className={cn(
            "text-[10px] mt-1 text-center font-medium hidden sm:block",
            i <= idx ? "text-foreground" : "text-muted-foreground"
          )}>{l}</div>
        </div>
      ))}
    </div>
  );
}