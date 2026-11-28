import { motion } from "framer-motion";
import { BarChart3, Users, IndianRupee, Calendar, ArrowUpRight } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminStats, useCreatorsByCity } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminReports() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: cityData, isLoading: citiesLoading } = useCreatorsByCity();

  const { data: categoryData } = useQuery({
    queryKey: ["admin-category-distribution"],
    queryFn: async () => {
      const { data } = await supabase.from("creator_profiles").select("category");
      if (!data) return [];
      const catMap: Record<string, number> = {};
      data.forEach((c) => { catMap[c.category] = (catMap[c.category] || 0) + 1; });
      const total = data.length || 1;
      return Object.entries(catMap)
        .map(([category, count]) => ({ category, count, percentage: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count);
    },
  });

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Analytics & Reports</h1>
        <p className="text-muted-foreground text-sm mb-6">Platform performance metrics and insights</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: Users, color: "text-primary" },
            { label: "Total Bookings", value: stats?.totalBookings?.toLocaleString() || "0", icon: Calendar, color: "text-secondary" },
            { label: "Revenue (GMV)", value: `₹${((stats?.totalRevenue || 0) / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-green-500" },
            { label: "Avg Rating", value: stats?.avgRating || "0", icon: BarChart3, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : <p className="font-heading text-2xl font-bold">{s.value}</p>}
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="cities">
          <TabsList className="mb-4">
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="cities">
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">City</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Creators</th>
                  </tr>
                </thead>
                <tbody>
                  {citiesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border"><td className="p-4"><Skeleton className="h-6 w-24" /></td><td className="p-4"><Skeleton className="h-6 w-12" /></td></tr>
                    ))
                  ) : cityData?.map((city) => (
                    <tr key={city.city} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium text-sm">{city.city}</td>
                      <td className="p-4 text-sm text-muted-foreground">{city.count}</td>
                    </tr>
                  ))}
                  {!citiesLoading && (!cityData || cityData.length === 0) && (
                    <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-heading font-semibold mb-4">Creator Distribution by Category</h3>
              {categoryData && categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{cat.category.replace("-", " ")}</span>
                        <span className="text-muted-foreground">{cat.count} creators ({cat.percentage}%)</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${cat.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No creator data yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminLayout>
  );
}

