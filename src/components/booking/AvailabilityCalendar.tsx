import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AvailabilityCalendarProps {
  creatorId: string;
  onSlotSelect?: (date: Date, time: string, allSelected: string[]) => void;
  compact?: boolean;
}

interface SlotData {
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookingData {
  booking_date: string;
  booking_time: string | null;
}

export function AvailabilityCalendar({ creatorId, onSlotSelect, compact }: AvailabilityCalendarProps) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  
  // State to track multiple selected slots (format: "YYYY-MM-DD|HH:mm")
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = compact
    ? ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"]
    : ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  useEffect(() => {
    fetchData();
  }, [weekStart, creatorId]);

  const fetchData = async () => {
    setIsLoading(true);
    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const [slotsRes, bookingsRes] = await Promise.all([
      supabase.from("availability_slots").select("slot_date, start_time, end_time, is_available")
        .eq("creator_id", creatorId).gte("slot_date", startDate).lte("slot_date", endDate),
      supabase.from("bookings").select("booking_date, booking_time")
        .eq("creator_id", creatorId).gte("booking_date", startDate).lte("booking_date", endDate)
        .neq("status", "cancelled"),
    ]);

    setSlots((slotsRes.data || []) as SlotData[]);
    setBookings((bookingsRes.data || []) as BookingData[]);
    setIsLoading(false);
  };

  const getSlotStatus = (day: Date, time: string): "selected" | "available" | "booked" | "unavailable" | "past" => {
    const now = new Date();
    const slotDate = new Date(day);
    slotDate.setHours(parseInt(time.split(":")[0]), parseInt(time.split(":")[1]), 0, 0);
    
    // Check if past
    if (slotDate < now) return "past";

    const dateStr = format(day, "yyyy-MM-dd");
    const slotKey = `${dateStr}|${time}`;

    // Check if the user has clicked and selected this specific slot
    if (selectedSlots.includes(slotKey)) return "selected";

    // Check if booked
    const isBooked = bookings.some(b => b.booking_date === dateStr && b.booking_time === time);
    if (isBooked) return "booked";

    // Check if creator opened this slot explicitly
    const hasSlots = slots.some(s => s.slot_date === dateStr);
    if (hasSlots) {
      const isAvail = slots.some(s => s.slot_date === dateStr && s.is_available && s.start_time <= time && s.end_time > time);
      return isAvail ? "available" : "unavailable";
    }

    // Default to available if no specific rules are set (Change this to "unavailable" if you want strict scheduling)
    return "available";
  };

  const handleSlotClick = (day: Date, time: string, status: string) => {
    if (status !== "available" && status !== "selected") return;

    const dateStr = format(day, "yyyy-MM-dd");
    const slotKey = `${dateStr}|${time}`;

    // Toggle selection on or off
    let newSelected = [...selectedSlots];
    if (selectedSlots.includes(slotKey)) {
      newSelected = newSelected.filter(s => s !== slotKey); // Deselect
    } else {
      newSelected.push(slotKey); // Select
    }

    setSelectedSlots(newSelected);
    
    // Pass the new data to the parent component
    if (onSlotSelect) {
      onSlotSelect(day, time, newSelected);
    }
  };

  const clearSelections = () => {
    setSelectedSlots([]);
    if (onSlotSelect) onSlotSelect(new Date(), "", []);
  };

  // Premium UI Status Colors
  const statusColors = {
    selected: "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] scale-[1.02] border-primary z-10 font-bold",
    available: "bg-background border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02] transition-all cursor-pointer text-foreground",
    booked: "bg-destructive/5 border-destructive/20 text-destructive cursor-not-allowed",
    unavailable: "bg-muted/50 border-transparent text-muted-foreground/30 cursor-not-allowed",
    past: "bg-muted/20 border-transparent text-muted-foreground/20 cursor-not-allowed striped-bg",
  };

  return (
    <div className="space-y-5">
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-border/60 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-xl hover:bg-muted" 
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          disabled={isBefore(weekStart, startOfDay(new Date()))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-extrabold tracking-wide text-foreground">
            {format(weekStart, "MMMM yyyy")}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d")}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-xl hover:bg-muted" 
          onClick={() => setWeekStart(addDays(weekStart, 7))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Selected Slots Pill (Shows when slots are selected) */}
      {selectedSlots.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-bold text-primary flex items-center gap-2">
            <Check className="h-4 w-4" /> {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
          </p>
          <Button variant="ghost" size="sm" onClick={clearSelections} className="h-7 text-xs hover:bg-primary/20 text-primary">
            Clear
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className={cn("overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent transition-opacity duration-300", isLoading && "opacity-50 pointer-events-none")}>
        <div className="min-w-[600px] md:min-w-full">
          
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="text-xs text-muted-foreground p-1" /> {/* Empty corner */}
            {days.map(day => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={cn(
                  "text-center py-2.5 rounded-xl text-xs flex flex-col items-center justify-center transition-all border",
                  isToday 
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm" 
                    : "bg-card border-border/40 text-muted-foreground"
                )}>
                  <div className={cn("font-bold uppercase text-[10px] tracking-widest mb-1", isToday ? "text-primary" : "text-muted-foreground/70")}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn("font-extrabold text-base leading-none", isToday ? "text-primary" : "text-foreground")}>
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="space-y-2">
            {hours.map(time => (
              <div key={time} className="grid grid-cols-8 gap-2 items-center group">
                <div className="text-[11px] font-bold text-muted-foreground/60 text-right pr-3 group-hover:text-foreground transition-colors">
                  {time}
                </div>
                {days.map(day => {
                  const status = getSlotStatus(day, time);
                  return (
                    <div
                      key={`${day.toISOString()}-${time}`}
                      onClick={() => handleSlotClick(day, time, status)}
                      className={cn(
                        "h-11 rounded-xl transition-all duration-200 text-xs flex items-center justify-center border",
                        statusColors[status]
                      )}
                    >
                      {status === "selected" && <Check className="h-4 w-4" />}
                      {status === "booked" && <XCircle className="h-4 w-4 opacity-50" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] font-bold tracking-wide uppercase text-muted-foreground pt-4 border-t border-border/50">
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-primary shadow-sm shadow-primary/40" /> Selected
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-background border border-border" /> Available
        </span>
        <span className="flex items-center gap-2 text-destructive/70">
          <span className="w-3.5 h-3.5 rounded bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <XCircle className="h-2.5 w-2.5 text-destructive" />
          </span> Booked
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-muted/50" /> Unavailable
        </span>
      </div>
      
      {/* Global Style for Striped BG (Past slots) */}
      <style>{`
        .striped-bg {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(150, 150, 150, 0.05) 5px, rgba(150, 150, 150, 0.05) 10px);
        }
      `}</style>
    </div>
  );
}
