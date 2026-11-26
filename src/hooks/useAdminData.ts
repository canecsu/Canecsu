
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const successfulPaymentStatuses = new Set(["captured", "paid", "active", "completed"]);

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        profilesRes,
        creatorsRes,
        bookingsRes,
        reviewsRes,
        paymentsRes,
        subscriptionsRes,
        badgeSubscriptionsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, type, is_verified, created_at, city", { count: "exact" }),
        supabase.from("creator_profiles").select("id, category, city_rank, rank_score", { count: "exact" }),
        supabase.from("bookings").select("id, status, total_price, created_at", { count: "exact" }),
        supabase.from("reviews").select("id, rating", { count: "exact" }),
        (supabase.from("payments" as any).select("amount, status, refunded_amount") as any),
        (supabase.from("subscriptions" as any).select("amount, status, refunded_amount") as any),
        (supabase.from("creator_verification_subscriptions" as any).select("amount, status, refunded_amount") as any),
      ]);

      const totalUsers = profilesRes.count || 0;
      const activeCreators = creatorsRes.count || 0;
      const totalBookings = bookingsRes.count || 0;
      const avgRating = reviewsRes.data?.length
        ? (reviewsRes.data.reduce((sum, review) => sum + review.rating, 0) / reviewsRes.data.length).toFixed(1)
        : "0";

      const netAmount = (rows: any[] | null | undefined) =>
        (rows || [])
          .filter((row) => successfulPaymentStatuses.has(String(row.status || "").toLowerCase()))
          .reduce((sum, row) => sum + Math.max(0, Number(row.amount || 0) - Number(row.refunded_amount || 0)), 0);

      const totalRevenue =
        netAmount(paymentsRes.data) +
        netAmount(subscriptionsRes.data) +
        netAmount(badgeSubscriptionsRes.data);

      return { totalUsers, activeCreators, totalBookings, avgRating, totalRevenue };
    },
  });
}

export function useAdminUsers(search: string, filter: "all" | "creator" | "client") {
  return useQuery({
    queryKey: ["admin-users", search, filter],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);

      if (filter !== "all") {
        query = query.eq("type", filter);
      }
      if (search) {
        query = query.ilike("name", "%" + search + "%");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, client:profiles!bookings_client_id_fkey(name), creator:profiles!bookings_creator_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatorsByCity() {
  return useQuery({
    queryKey: ["admin-creators-by-city"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("city")
        .eq("type", "creator")
        .not("city", "is", null);
      if (error) throw error;

      const cityMap: Record<string, number> = {};
      data?.forEach((profile) => {
        if (profile.city) cityMap[profile.city] = (cityMap[profile.city] || 0) + 1;
      });
      return Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });
}
