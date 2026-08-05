import { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Plus, Trash2, Save, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScheduleManagerProps {
  creatorId: string;
}

interface SlotEntry {
  id?: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleManager({ creatorId }: ScheduleManagerProps) {
  const [weekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isAvailableNow, setIsAvailableNow] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, { start: string; end: string; enabled: boolean }>>({
    0: { start: "09:00", end: "18:00", enabled: true },
    1: { start: "09:00", end: "18:00", enabled: true },
    2: { start: "09:00", end: "18:00", enabled: true },
    3: { start: "09:00", end: "18:00", enabled: true },
    4: { start: "09:00", end: "18:00", enabled: true },
    5: { start: "10:00", end: "16:00", enabled: false },
    6: { start: "10:00", end: "16:00", enabled: false },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentStatus();
  }, [creatorId]);

  const fetchCurrentStatus = async () => {
    const { data } = await supabase
      .from("creator_profiles")
      .select("is_available_now")
      .eq("profile_id", creatorId)
      .single();
    if (data) setIsAvailableNow(data.is_available_now || false);
  };

  const toggleAvailableNow = async (checked: boolean) => {
    setIsAvailableNow(checked);
    const updateData: Record<string, any> = { is_available_now: checked };
    if (checked) {
      updateData.available_until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    } else {
      updateData.available_until = null;
    }
    await supabase.from("creator_profiles").update(updateData).eq("profile_id", creatorId);
    toast.success(checked ? "You're now shown as available!" : "Available status turned off");
  };

  const applyWeeklySchedule = async () => {
    setSaving(true);
    const slots: Omit<SlotEntry, "id">[] = [];
    
    // Generate slots for next 4 weeks
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const schedule = weeklySchedule[day];
        if (!schedule.enabled) continue;
        
        const date = addDays(weekStart, week * 7 + day);
        if (date < new Date()) continue;
        
        slots.push({
          slot_date: format(date, "yyyy-MM-dd"),
          start_time: schedule.start,
          end_time: schedule.end,
          is_available: true,
        });
      }
    }

    // Delete existing future slots and insert new ones
    const today = format(new Date(), "yyyy-MM-dd");
    await supabase.from("availability_slots").delete().eq("creator_id", creatorId).gte("slot_date", today);
    
    if (slots.length > 0) {
      const { error } = await supabase.from("availability_slots").insert(
        slots.map(s => ({ ...s, creator_id: creatorId }))
      );
      if (error) {
        toast.error("Failed to save schedule");
      } else {
        toast.success(`Schedule applied for next 4 weeks (${slots.length} slots)`);
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Available Now Toggle */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading font-semibold">Available Now</p>
              <p className="text-sm text-muted-foreground">Show as available for the next 2 hours</p>
            </div>
            <div className="flex items-center gap-3">
              {isAvailableNow && (
                <Badge className="bg-secondary text-secondary-foreground animate-pulse">
                  🟢 Live
                </Badge>
              )}
              <Switch checked={isAvailableNow} onCheckedChange={toggleAvailableNow} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />Weekly Schedule
          </CardTitle>
          <Button onClick={applyWeeklySchedule} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Apply Schedule"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div key={day} className="flex items-center gap-4 p-3 rounded-xl bg-muted">
                <div className="w-12">
                  <Switch
                    checked={weeklySchedule[idx].enabled}
                    onCheckedChange={checked =>
                      setWeeklySchedule(prev => ({ ...prev, [idx]: { ...prev[idx], enabled: checked } }))
                    }
                  />
                </div>
                <span className="w-10 font-medium text-sm">{day}</span>
                {weeklySchedule[idx].enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={weeklySchedule[idx].start}
                      onValueChange={v => setWeeklySchedule(prev => ({ ...prev, [idx]: { ...prev[idx], start: v } }))}
                    >
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm">to</span>
                    <Select
                      value={weeklySchedule[idx].end}
                      onValueChange={v => setWeeklySchedule(prev => ({ ...prev, [idx]: { ...prev[idx], end: v } }))}
                    >
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Day off</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
