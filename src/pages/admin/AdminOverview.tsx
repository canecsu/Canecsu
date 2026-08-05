import { motion } from "framer-motion";
import { Users, ShieldCheck, Flag, BarChart3, TrendingUp, Eye, DollarSign, Calendar } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminStats } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", icon: Users, color: "text-primary" },
    { label: "Active Creators", value: stats?.activeCreators?.toLocaleString() || "0", icon: TrendingUp, color: "text-secondary" },
    { label: "Total Bookings", value: stats?.totalBookings?.toLocaleString() || "0", icon: Calendar, color: "text-primary" },
    { label: "Avg. Rating", value: stats?.avgRating || "0", icon: BarChart3, color: "text-primary" },
    { label: "Revenue (GMV)", value: `₹${((stats?.totalRevenue || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-green-500" },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm mb-6">Welcome back, Admin. Here's what's happening on Canecsu.</p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
              {isLoading ? <Skeleton className="h-8 w-20 mb-1" /> : <p className="font-heading text-2xl font-bold">{stat.value}</p>}
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-heading font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Manage Users", desc: "View all users", href: "/admin/users" },
                { label: "Review Verifications", desc: "Pending requests", href: "/admin/verification" },
                { label: "Content Moderation", desc: "Reported content", href: "/admin/content" },
                { label: "View Reports", desc: "Analytics & insights", href: "/admin/reports" },
              ].map((action) => (
                <Link key={action.label} to={action.href} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors block">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h3 className="font-heading font-semibold text-lg mb-4">Platform Info</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />
                <div className="flex-1"><p className="font-medium text-sm">Database Connected</p><p className="text-xs text-muted-foreground">All tables operational</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />
                <div className="flex-1"><p className="font-medium text-sm">Auth System Active</p><p className="text-xs text-muted-foreground">Email authentication enabled</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />
                <div className="flex-1"><p className="font-medium text-sm">RLS Policies Active</p><p className="text-xs text-muted-foreground">All tables secured</p></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
