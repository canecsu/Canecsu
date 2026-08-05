import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, CreditCard, Hammer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeAmounts } from "@/lib/booking";
import { useAuth } from "@/contexts/AuthContext";

declare global { interface Window { Razorpay: any; } }

const loadRazorpay = () => new Promise<boolean>((resolve) => {
  if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
    return resolve(true);
  }
  const s = document.createElement("script");
  s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

interface Props {
  booking: any;
  role: "client" | "creator";
  onChanged: () => void;
}

/* -------------------- Creator actions -------------------- */
export function CreatorBookingActions({ booking, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const approve = async () => {
    setBusy(true);
    const total = booking.total_price || 0;
    const { advance_amount, final_amount, platform_fee } = computeAmounts(total);
    const { error } = await supabase.from("bookings").update({
      status: "advance_pending" as any,
      approved_at: new Date().toISOString(),
      advance_amount, final_amount, platform_fee,
    }).eq("id", booking.id);
    if (error) { toast.error("Failed"); setBusy(false); return; }
    await supabase.from("notifications").insert({
      user_id: booking.client_id,
      title: "Booking Approved",
      message: `Your booking has been approved. Pay 50% advance to confirm.`,
      type: "booking", link: "/client",
    });
    toast.success("Booking approved");
    setBusy(false);
    onChanged();
  };

  const reject = async () => {
    setBusy(true);
    const { error } = await supabase.from("bookings").update({
      status: "rejected" as any,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason || null,
    }).eq("id", booking.id);
    if (error) { toast.error("Failed"); setBusy(false); return; }
    await supabase.from("notifications").insert({
      user_id: booking.client_id,
      title: "Booking Rejected",
      message: reason ? `Reason: ${reason}` : "Your booking request was rejected.",
      type: "booking", link: "/client",
    });
    toast.success("Booking rejected");
    setBusy(false); setRejectOpen(false);
    onChanged();
  };

  const status = booking.status;

  if (status === "requested" || status === "pending") {
    return (
      <>
        <div className="flex gap-2">
          <Button size="sm" onClick={approve} disabled={busy} className="rounded-full">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} disabled={busy} className="rounded-full">
            <XCircle className="h-3 w-3" /> Reject
          </Button>
        </div>
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject booking</DialogTitle>
              <DialogDescription>Tell the client why (optional).</DialogDescription>
            </DialogHeader>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. unavailable on that date" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={reject} disabled={busy}>Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  return null;
}

/* -------------------- Client actions -------------------- */
export function ClientBookingActions({ booking, onChanged }: Props) {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState(false);

  const payMilestone = async (stage: "advance" | "final") => {
    const amount = stage === "advance" ? booking.advance_amount : booking.final_amount;
    if (!amount || amount <= 0) { toast.error("Invalid amount"); return; }
    setBusy(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error("Payment SDK failed"); setBusy(false); return; }
      const { data: order, error: orderErr } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount, type: "booking", userId: user?.id, creatorId: booking.creator_id },
      });
      if (orderErr || !order?.orderId) throw new Error("Order failed");

      const opts = {
        key: order.keyId,
        amount: amount * 100,
        currency: "INR",
        name: "Booking Payment",
        description: stage === "advance" ? "50% Advance" : "Final 50% Payment",
        order_id: order.orderId,
        handler: async (resp: any) => {
          try {
            const updates: any = stage === "advance"
              ? {
                  status: "work_in_progress",
                  advance_paid_at: new Date().toISOString(),
                  advance_payment_id: resp.razorpay_payment_id,
                }
              : {
                  status: "completed",
                  final_paid_at: new Date().toISOString(),
                  final_payment_id: resp.razorpay_payment_id,
                };
            const { error: uErr } = await supabase.from("bookings").update(updates).eq("id", booking.id);
            if (uErr) throw uErr;

            await supabase.from("payments").insert({
              booking_id: booking.id,
              client_id: booking.client_id,
              creator_id: booking.creator_id,
              stage,
              amount,
              status: "success",
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
            });

            await supabase.from("notifications").insert({
              user_id: booking.creator_id,
              title: stage === "advance" ? "Advance payment received" : "Final payment received",
              message: stage === "advance"
                ? "Client paid 50% advance. You can start the work."
                : "Booking is fully paid and complete.",
              type: "payment", link: "/dashboard",
            });

            toast.success(stage === "advance" ? "Advance paid! Work can start." : "Booking completed!");
            onChanged();
          } catch (e) {
            console.error(e);
            toast.error("Payment succeeded but update failed");
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => { setBusy(false); toast.info("Payment cancelled"); } },
        prefill: { name: profile?.name || user?.email, email: user?.email },
        theme: { color: "#2563eb" },
      };
      new window.Razorpay(opts).open();
    } catch (e) {
      console.error(e); toast.error("Payment init failed"); setBusy(false);
    }
  };

  const markWorkDone = async () => {
    setBusy(true);
    const { error } = await supabase.from("bookings").update({
      status: "final_pending" as any,
      work_completed_at: new Date().toISOString(),
    }).eq("id", booking.id);
    if (error) { toast.error("Failed"); setBusy(false); return; }
    await supabase.from("notifications").insert({
      user_id: booking.creator_id,
      title: "Client marked work as completed",
      message: "Awaiting final 50% payment from the client.",
      type: "booking", link: "/dashboard",
    });
    toast.success("Marked complete. Pay remaining 50% to close the booking.");
    setBusy(false); onChanged();
  };

  const cancel = async () => {
    setBusy(true);
    const { error } = await supabase.from("bookings").update({ status: "cancelled" as any }).eq("id", booking.id);
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: booking.creator_id, title: "Booking cancelled",
        message: "The client cancelled the booking.", type: "booking", link: "/dashboard",
      });
      toast.success("Cancelled"); onChanged();
    } else { toast.error("Failed"); }
    setBusy(false);
  };

  const status = booking.status;

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "advance_pending") && (
        <Button size="sm" onClick={() => payMilestone("advance")} disabled={busy} className="rounded-full bg-blue-600 hover:bg-blue-700">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
          Pay 50% Advance (₹{booking.advance_amount?.toLocaleString()})
        </Button>
      )}
      {(status === "work_in_progress" || status === "advance_paid" || status === "confirmed") && (
        <Button size="sm" onClick={markWorkDone} disabled={busy} className="rounded-full bg-teal-600 hover:bg-teal-700">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hammer className="h-3 w-3" />}
          Mark Work Completed
        </Button>
      )}
      {(status === "final_pending" || status === "work_completed") && (
        <Button size="sm" onClick={() => payMilestone("final")} disabled={busy} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
          Pay Remaining 50% (₹{booking.final_amount?.toLocaleString()})
        </Button>
      )}
      {(status === "requested" || status === "pending" || status === "approved" || status === "advance_pending") && (
        <Button size="sm" variant="ghost" onClick={cancel} disabled={busy} className="rounded-full text-destructive">
          Cancel
        </Button>
      )}
    </div>
  );
}