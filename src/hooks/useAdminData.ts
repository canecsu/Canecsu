import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profilesRes, creatorsRes, bookingsRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("id, type, is_verified, created_at, city", { count: "exact" }),
        supabase.from("creator_profiles").select("id, category, city_rank, rank_score", { count: "exact" }),
        supabase.from("bookings").select("id, status, total_price, created_at", { count: "exact" }),
        supabase.from("reviews").select("id, rating", { count: "exact" }),
      ]);

      const totalUsers = profilesRes.count || 0;
      const activeCreators = creatorsRes.count || 0;
      const totalBookings = bookingsRes.count || 0;
      const avgRating = reviewsRes.data?.length
        ? (reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length).toFixed(1)
        : "0";
      const totalRevenue = bookingsRes.data?.reduce((sum, b) => sum + b.total_price, 0) || 0;

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
        query = query.ilike("name", `%${search}%`);
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
      data?.forEach((p) => {
        if (p.city) cityMap[p.city] = (cityMap[p.city] || 0) + 1;
      });
      return Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });
}
