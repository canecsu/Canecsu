import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { BreachBanner } from "@/components/privacy/BreachBanner";

// Standard Pages
import Index from "./pages/Index";
import Search from "./pages/Search";
import CreatorProfile from "./pages/CreatorProfile";
import Categories from "./pages/Categories";
import Rankings from "./pages/Rankings";
import Registercreator from "./pages/Registercreator";
import About from "./pages/About";
import Map from "./pages/map";
import HowItWorks from "./pages/HowItWorks";
import Blog from "./pages/Blog";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatorDashboard from "./pages/CreatorDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Profile from "./pages/Profile";
import CityCreators from "./pages/CityCreators";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import CollabHub from "./pages/CollabHub";
import Referrals from "./pages/Referrals";
import Feed from "./pages/Feed";
import EscrowBooking from "./pages/EscrowBooking";
import Messages from "./pages/Messages";

// New Portfolio Editor Page
import Editor from "./pages/Editor";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminContent from "./pages/admin/AdminContent";
import AdminRankings from "./pages/admin/AdminRankings";
import AdminFeatured from "./pages/admin/AdminFeatured";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminPayments from "./pages/admin/AdminPayments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <BreachBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/creator/:id" element={<CreatorProfile />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/about" element={<About />} />
            <Route path="/map" element={<Map />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registercreator" element={<Registercreator />} />
            <Route path="/register/creator" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<RoleGuard role="creator"><CreatorDashboard /></RoleGuard>} />
            <Route path="/client" element={<RoleGuard role="client"><ClientDashboard /></RoleGuard>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cities/:city" element={<CityCreators />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<Help />} />
            <Route path="/collab" element={<CollabHub />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/escrow" element={<EscrowBooking />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/messages" element={<Messages />} />
            
            {/* NEW: Portfolio Editor Route */}
            <Route path="/portfolio/editor" element={<Editor />} />

            {/* Admin routes - protected */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/rankings" element={<AdminRankings />} />
            <Route path="/admin/featured" element={<AdminFeatured />} />
            <Route path="/admin/disputes" element={<AdminDisputes />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/blogs" element={<AdminBlogs />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/payments" element={<AdminPayments />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
