import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge, BookingProgress } from "./BookingStatusBadge";
import { CreatorBookingActions, ClientBookingActions } from "./BookingActions";
import { Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";

interface Props {
  userId: string;
  role: "client" | "creator";
}

export function BookingsList({ userId, role }: Props) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const otherFk = role === "client"
      ? "profiles!bookings_creator_id_fkey(name, avatar_url)"
      : "profiles!bookings_client_id_fkey(name, avatar_url)";
    const filterCol = role === "client" ? "client_id" : "creator_id";
    const { data } = await supabase.from("bookings")
      .select(`*, ${otherFk}, services(title)`)
      .eq(filterCol, userId)
      .order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [userId, role]);

  if (loading) return <p className="text-muted-foreground text-center py-8">Loading bookings…</p>;
  if (bookings.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No bookings yet.</p>;
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const other = b.profiles || {};
        return (
          <Card key={b.id} className="rounded-2xl border-gray-200 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                    {other.avatar_url
                      ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <User className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{other.name || (role === "client" ? "Creator" : "Client")}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.services?.title || "Custom service"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {b.booking_date ? format(new Date(b.booking_date), "PP") : "—"}
                        {b.booking_time && ` · ${b.booking_time}`}
                      </span>
                      {b.location && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />{b.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <BookingStatusBadge status={b.status} />
                  <p className="text-sm font-black text-primary">₹{b.total_price?.toLocaleString()}</p>
                </div>
              </div>

              {b.rejection_reason && b.status === "rejected" && (
                <div className="text-xs p-2 rounded-md bg-red-50 text-red-700 border border-red-100">
                  Reason: {b.rejection_reason}
                </div>
              )}

              {b.requirements && (
                <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line">{b.requirements}</p>
              )}

              <BookingProgress status={b.status} />

              <div className="pt-2 border-t border-border/50">
                {role === "creator"
                  ? <CreatorBookingActions booking={b} role="creator" onChanged={fetchBookings} />
                  : <ClientBookingActions booking={b} role="client" onChanged={fetchBookings} />}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}