import { useState, useEffect, useMemo } from "react";
import { format, addMonths, isBefore, startOfDay } from "date-fns";
import { Clock, MapPin, Check, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { computeAmounts } from "@/lib/booking";

interface AvailabilitySlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ServiceOption {
  id: string;
  title: string;
  price: number;
  duration: string | null;
  price_type: string;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
  services: ServiceOption[];
  preselectedService?: ServiceOption | null;
  userId: string;
}

const HOUR_SLOTS = [
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00","22:00",
];

const DURATION_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "2 hours", value: 2 },
  { label: "3 hours", value: 3 },
  { label: "4 hours", value: 4 },
  { label: "Half Day (5h)", value: 5 },
  { label: "Full Day (8h)", value: 8 },
  { label: "2 Days", value: 16 },
  { label: "3 Days", value: 24 },
  { label: "1 Week", value: 56 },
];

export function BookingDialog({
  open, onOpenChange, creatorId, creatorName, services, preselectedService, userId,
}: BookingDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(preselectedService || null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [bookedSlots, setBooSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const maxDate = addMonths(new Date(), 3);

  useEffect(() => {
    if (preselectedService) setSelectedService(preselectedService);
  }, [preselectedService]);

  useEffect(() => {
    if (selectedDate && creatorId) fetchAvailability(selectedDate);
  }, [selectedDate, creatorId]);

  const fetchAvailability = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data: bookingsRes } = await supabase
      .from("bookings")
      .select("booking_time")
      .eq("creator_id", creatorId)
      .eq("booking_date", dateStr)
      .neq("status", "cancelled");
    setBooSlots((bookingsRes || []).map((b: any) => b.booking_time).filter(Boolean));
  };

  const isSlotBooked = (time: string) => bookedSlots.includes(time);

  // --- Pricing Calculations ---
  const totalPrice = useMemo(() => {
    if (!selectedService) return 0;
    if (selectedService.price_type === "hourly") {
      return selectedService.price * selectedDuration;
    }
    return selectedService.price;
  }, [selectedService, selectedDuration]);

  const { platform_fee: platformFee, grand_total: grandTotal, advance_amount: advanceAmount, final_amount: balanceAmount } = computeAmounts(totalPrice);

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!user) { toast.error("Please log in"); return; }
    setSubmitting(true);

    try {
      const requirementsText = `Time: ${selectedTime}\nDuration: ${selectedDuration} hour(s)\nLocation: ${location || 'Not specified'}\n\nNotes: ${notes || 'None'}`;

      const { error } = await supabase.from("bookings").insert({
        client_id: user.id,
        creator_id: creatorId,
        service_id: selectedService.id,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        location: location || null,
        requirements: requirementsText,
        notes: notes || null,
        total_price: grandTotal,
        platform_fee: platformFee,
        advance_amount: advanceAmount,
        final_amount: balanceAmount,
        status: "requested" as any,
      });
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: creatorId,
        title: "New Booking Request",
        message: `New request for ${selectedService.title} on ${format(selectedDate, "PPP")} at ${selectedTime}.`,
        type: "booking",
        link: "/dashboard",
      });

      toast.success("Request sent! Awaiting creator approval.");
      onOpenChange(false);
      resetForm();
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send booking request.");
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedService(preselectedService || null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedDuration(1);
    setLocation("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-muted/30">
          <DialogTitle className="text-xl font-extrabold">Book {creatorName}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Select service, pick your slot, and confirm</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {[
              { n: 1, label: "Service" },
              { n: 2, label: "Schedule" },
              { n: 3, label: "Confirm" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step >= s.n ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                )}>
                  {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                </div>
                <span className={cn("text-xs font-medium hidden sm:block", step >= s.n ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                {i < 2 && <div className={cn("h-0.5 flex-1", step > s.n ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Choose a Service</h3>
              <div className="space-y-3">
                {services.map(svc => (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm",
                      selectedService?.id === svc.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">{svc.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {svc.duration && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{svc.duration}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[10px] capitalize">{svc.price_type}</Badge>
                        </div>
                      </div>
                      <p className="font-bold text-primary text-lg">
                        ₹{svc.price.toLocaleString()}
                        {svc.price_type === "hourly" && <span className="text-xs font-medium text-muted-foreground">/hr</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full h-12 rounded-xl font-bold" disabled={!selectedService} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Date, Time & Duration */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Pick Date & Time</h3>

              <CalendarUI
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-xl border pointer-events-auto flex justify-center bg-white"
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || date > maxDate}
                numberOfMonths={1}
              />

              <p className="text-xs text-muted-foreground text-center">
                Book up to 3 months in advance
              </p>

              {selectedDate && (
                <>
                  {/* Hourly Time Grid */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Select Start Time</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {HOUR_SLOTS.map(time => {
                        const booked = isSlotBooked(time);
                        const selected = selectedTime === time;
                        const hour = parseInt(time);
                        const period = hour < 12 ? "AM" : "PM";
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

                        return (
                          <button
                            key={time}
                            onClick={() => !booked && setSelectedTime(time)}
                            disabled={booked}
                            className={cn(
                              "py-3 px-2 rounded-xl text-sm font-semibold transition-all border",
                              selected
                                ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                                : booked
                                ? "bg-destructive/5 text-destructive/40 cursor-not-allowed line-through border-destructive/10"
                                : "bg-card hover:bg-muted border-border hover:border-primary/40 text-foreground"
                            )}
                          >
                            {displayHour}:00
                            <span className="text-[10px] ml-0.5 opacity-70">{period}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Selection */}
                  {selectedService?.price_type === "hourly" && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Duration</label>
                      <div className="flex flex-wrap gap-2">
                        {DURATION_OPTIONS.map(d => (
                          <button
                            key={d.value}
                            onClick={() => setSelectedDuration(d.value)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                              selectedDuration === d.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border hover:border-primary/40 text-foreground"
                            )}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                      <MapPin className="h-3 w-3 inline mr-1" />Location (optional)
                    </label>
                    <Input
                      placeholder="e.g. Studio, outdoor location..."
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Any specific requirements..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="rounded-xl resize-none p-4"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-bold"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                >
                  Review <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Pay */}
          {step === 3 && selectedService && selectedDate && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Review & Pay 50% Advance</h3>

              <div className="bg-muted/50 rounded-2xl p-5 space-y-3 border border-border/40">
                {[
                  { label: "Service", value: selectedService.title },
                  { label: "Date", value: format(selectedDate, "PPP") },
                  { label: "Time", value: selectedTime },
                  ...(selectedService.price_type === "hourly" ? [{ label: "Duration", value: `${selectedDuration} hour${selectedDuration > 1 ? "s" : ""}` }] : []),
                  ...(location ? [{ label: "Location", value: location }] : []),
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service Price</span>
                  <span className="text-sm font-medium text-foreground">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Platform Fee with GST (10%)</span>
                  <span className="text-sm font-medium text-foreground">₹{platformFee.toLocaleString()}</span>
                </div>

                <Separator />
                
                {/* 50% Breakdown */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Due After Work (50%)
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    ₹{balanceAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-primary/10 p-3 rounded-xl border border-primary/20 mt-3">
                  <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <Send className="w-4 h-4" /> Advance Payable After Approval
                  </span>
                  <span className="text-xl font-black text-primary">
                    ₹{advanceAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
                  <Send className="h-4 w-4" /> How it works
                </div>
                <p className="text-xs text-muted-foreground">
                  Send the request → creator approves → pay 50% advance → work happens → mark complete → pay remaining 50%.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-14 rounded-xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1 h-14 rounded-xl font-bold shadow-lg shadow-primary/20"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <>Send Request <Send className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
