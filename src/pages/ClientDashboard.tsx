import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Calendar, Star, Search, Eye, Trash2, DollarSign, Clock, CheckCircle, XCircle, RefreshCw, Zap, CreditCard, Loader2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { BookingsList } from "@/components/booking/BookingsList";

// TypeScript definition for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Utility function to load the Razorpay script
const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const statusConfig: Record<string, { color: string; variant: string; icon: any }> = {
  pending: { color: "text-amber-500", variant: "outline", icon: Clock },
  accepted: { color: "text-blue-500", variant: "default", icon: CheckCircle },
  confirmed: { color: "text-primary", variant: "default", icon: CheckCircle },
  in_progress: { color: "text-secondary", variant: "secondary", icon: RefreshCw },
  completed: { color: "text-green-500", variant: "secondary", icon: CheckCircle },
  cancelled: { color: "text-destructive", variant: "destructive", icon: XCircle },
};

const ClientDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("bookings");
  const [shortlists, setShortlists] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [escrowPayments, setEscrowPayments] = useState<any[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  
  // New state to track if a payment is processing
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (["bookings", "shortlist", "payments"].includes(hash)) {
      setActiveTab(hash === "shortlist" ? "shortlisted" : hash);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!loading && !user) { navigate("/login"); return; }
    if (user) fetchData();
  }, [user, loading]);

  const fetchData = async () => {
    if (!user) return;
    const [slRes, bkRes, rvRes, escRes] = await Promise.all([
      supabase.from("shortlists").select("*, profiles!shortlists_creator_id_fkey(name, avatar_url, city)").eq("client_id", user.id),
      supabase.from("bookings").select("*, profiles!bookings_creator_id_fkey(name, avatar_url), services(title)").eq("client_id", user.id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("id").eq("client_id", user.id),
      supabase.from("escrow_payments").select("*").eq("client_id", user.id),
    ]);
    setShortlists(slRes.data || []);
    setBookings(bkRes.data || []);
    setReviewCount(rvRes.data?.length || 0);
    setEscrowPayments(escRes.data || []);
  };

  // Plan-based gating removed: any logged-in client can use these actions.
  // Pricing enforcement (if any) must be done server-side.
  const isFreePlan = false;
  const handlePremiumAction = (action: () => void, _featureName: string) => action();

  const removeShortlist = async (id: string) => {
    const { error } = await supabase.from("shortlists").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); return; }
    setShortlists(prev => prev.filter(s => s.id !== id));
    toast.success("Removed from shortlist");
  };

  const cancelBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast.error("Failed to cancel"); return; }
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      await supabase.from("notifications").insert({
        user_id: booking.creator_id,
        title: "Booking Cancelled",
        message: `A booking has been cancelled by the client`,
        type: "booking", link: "/dashboard",
      });
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
    toast.success("Booking cancelled");
  };

  const rescheduleBooking = async () => {
    if (!rescheduleBookingId || !rescheduleDate) return;
    const newDate = format(rescheduleDate, "yyyy-MM-dd");
    const { error } = await supabase.from("bookings").update({ booking_date: newDate, status: "pending" }).eq("id", rescheduleBookingId);
    if (error) { toast.error("Failed to reschedule"); return; }
    setBookings(prev => prev.map(b => b.id === rescheduleBookingId ? { ...b, booking_date: newDate, status: "pending" } : b));
    setRescheduleBookingId(null);
    setRescheduleDate(undefined);
    toast.success("Booking rescheduled! Awaiting creator confirmation.");
  };

  // --- NEW: Pay Balance Logic ---
  const handlePayBalance = async (booking: any) => {
    const total = booking.total_price || 0;
    const advancePaid = booking.advance_paid || Math.ceil(total / 2);
    const balanceAmount = total - advancePaid;

    if (balanceAmount <= 0) {
      toast.info("Balance already fully paid.");
      return;
    }

    setIsProcessingPayment(booking.id);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Check your connection.");
        setIsProcessingPayment(null);
        return;
      }

      // Reusing the same create-razorpay-order Edge Function to generate the Order ID
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: { 
            amount: balanceAmount, 
            type: "balance_payment",
            userId: user?.id,
          },
        }
      );

      if (orderError || !orderData?.orderId) {
        throw new Error("Failed to create secure payment order.");
      }

      const options = {
        key: orderData.keyId,
        amount: balanceAmount * 100,
        currency: "INR",
        name: booking.profiles?.name || "Creator Booking",
        description: `Final 50% Balance Payment`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Update the booking status to 'completed' and record full payment
            const { error: updateError } = await supabase
              .from('bookings')
              .update({ 
                status: 'completed',
                advance_paid: total, // Marks as fully paid
                notes: (booking.notes || '') + '\n[Final 50% Balance Paid via Razorpay]'
              })
              .eq('id', booking.id);

            if (updateError) throw updateError;

            // Optional: Send notification to the creator
            await supabase.from("notifications").insert({
              user_id: booking.creator_id,
              title: "Payment Completed!",
              message: `Client has approved the work and paid the remaining balance.`,
              type: "payment", link: "/dashboard",
            });

            toast.success("Payment Successful! Booking marked as complete."); 
            
            // Update UI State
            setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "completed", advance_paid: total } : b));

          } catch (err) {
            console.error("Booking update failed:", err);
            toast.error("Payment succeeded, but failed to update booking status.");
          } finally {
            setIsProcessingPayment(null);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(null);
            toast.info("Payment cancelled.");
          },
        },
        prefill: {
          name: profile?.name || user?.email,
          email: user?.email || "",
        },
        theme: { color: "#2563eb" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong initiating the payment.");
      setIsProcessingPayment(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const activeBookings = bookings.filter(b => ["pending", "accepted", "confirmed", "in_progress"].includes(b.status)).length;
  const totalSpent = bookings.filter(b => b.status === "completed").reduce((s: number, b: any) => s + (b.total_price || 0), 0);

  return (
    <WorkspaceShell workspace="client">
      <div className="flex-1">
        <div className="container py-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            {isFreePlan && (
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Unlock Full Hiring Power</h3>
                    <p className="text-sm text-gray-600 mt-1">Free plan limits your ability to directly book and reschedule with top creators.</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/pricing')} className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
                  Get Premium Pass
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-heading text-3xl font-bold mb-2">My Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {profile?.name || "User"}</p>
              </div>
              
              <Button 
                onClick={() => handlePremiumAction(() => navigate('/search'), "Direct Hiring")}
                className="rounded-full shadow-md"
              >
                <Search className="h-4 w-4 mr-2" />Find Creators
              </Button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Shortlisted", value: shortlists.length, icon: Heart, color: "text-red-500" },
                { label: "Total Bookings", value: bookings.length, icon: Calendar, color: "text-blue-500" },
                { label: "Active", value: activeBookings, icon: MessageCircle, color: "text-green-500" },
                { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, icon: DollarSign, color: "text-purple-500" },
                { label: "Reviews Given", value: reviewCount, icon: Star, color: "text-yellow-500" },
              ].map(stat => (
                <Card key={stat.label} className="border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
                    <p className="font-heading text-3xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white shadow-sm border border-gray-200 w-full justify-start rounded-2xl p-2 h-auto flex-wrap">
                <TabsTrigger value="bookings" className="rounded-xl font-bold">Bookings</TabsTrigger>
                <TabsTrigger value="shortlisted" className="rounded-xl font-bold">Shortlisted</TabsTrigger>
                <TabsTrigger value="payments" className="rounded-xl font-bold">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" id="bookings">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader><CardTitle className="text-lg font-bold text-gray-900">Your Bookings</CardTitle></CardHeader>
                  <CardContent>
                    {user && <BookingsList userId={user.id} role="client" />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shortlisted" id="shortlist">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Shortlisted Creators</CardTitle>
                    <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={() => handlePremiumAction(() => navigate('/search'), "Creator Search")}>
                      <Search className="h-4 w-4 mr-2" />Find More
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {shortlists.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6 font-medium">No shortlisted creators yet. <span onClick={() => navigate('/search')} className="text-blue-600 hover:underline cursor-pointer">Discover creators</span></p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shortlists.map(sl => (
                          <div key={sl.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/creator/${sl.creator_id}`)}>
                              <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border border-blue-200">
                                {sl.profiles?.avatar_url ? <img src={sl.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-blue-600">{sl.profiles?.name?.charAt(0)}</span>}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{sl.profiles?.name}</p>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">{sl.profiles?.city || "Unknown Location"}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 text-blue-600 rounded-full" onClick={() => navigate(`/creator/${sl.creator_id}`)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => removeShortlist(sl.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" id="payments">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader><CardTitle className="text-lg font-bold text-gray-900">Payment History</CardTitle></CardHeader>
                  <CardContent>
                    {escrowPayments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6 font-medium">No payments yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {escrowPayments.map((payment: any) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div>
                              <p className="font-black text-blue-600 text-lg">₹{payment.amount.toLocaleString()}</p>
                              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{new Date(payment.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={payment.status === "released" ? "secondary" : payment.status === "refunded" ? "destructive" : "outline"} className="font-bold px-3 py-1">
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      <Dialog open={!!rescheduleBookingId} onOpenChange={(open) => !open && setRescheduleBookingId(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader><DialogTitle className="font-extrabold text-xl">Reschedule Booking</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <CalendarUI
              mode="single"
              selected={rescheduleDate}
              onSelect={setRescheduleDate}
              className={cn("rounded-2xl border border-gray-200 pointer-events-auto shadow-sm bg-white mx-auto")}
              disabled={(date) => date < new Date()}
            />
            <Button className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white" disabled={!rescheduleDate} onClick={rescheduleBooking}>
              Confirm New Date
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </WorkspaceShell>
  );
};

export default ClientDashboard;

