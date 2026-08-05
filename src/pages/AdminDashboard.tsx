import { motion } from "framer-motion";
import { Users, Shield, Flag, Award, TrendingUp, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const AdminDashboard = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground mb-8">Platform management and moderation tools.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Users", value: "10,432", icon: Users, change: "+124 this week" },
              { label: "Pending Verification", value: "18", icon: Shield, change: "5 urgent" },
              { label: "Reported Content", value: "7", icon: Flag, change: "3 new today" },
              { label: "Active Bookings", value: "156", icon: BarChart3, change: "+12% vs last week" },
            ].map(stat => (
              <div key={stat.label} className="bg-card rounded-2xl p-5 shadow-card">
                <stat.icon className="h-5 w-5 text-primary mb-3" />
                <p className="font-heading text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-secondary mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-6 shadow-card">
              <h3 className="font-heading font-semibold text-lg mb-4">Verification Queue</h3>
              <div className="space-y-3">
                {[
                  { name: "Riya Mehta", type: "Photographer", submitted: "2 hours ago" },
                  { name: "Amit Shah", type: "Videographer", submitted: "5 hours ago" },
                  { name: "Kavya Nair", type: "Model", submitted: "1 day ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.type} · {item.submitted}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20"><CheckCircle className="h-4 w-4" /></button>
                      <button className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><AlertTriangle className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card">
              <h3 className="font-heading font-semibold text-lg mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {[
                  { reason: "Inappropriate portfolio image", reporter: "User #4521", severity: "High" },
                  { reason: "Fake reviews suspected", reporter: "User #3892", severity: "Medium" },
                  { reason: "Profile impersonation", reporter: "User #5103", severity: "High" },
                ].map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                    <div>
                      <p className="font-medium text-sm">{report.reason}</p>
                      <p className="text-xs text-muted-foreground">By {report.reporter}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${report.severity === "High" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-600"}`}>{report.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
    <Footer />
  </div>
);

export default AdminDashboard;
