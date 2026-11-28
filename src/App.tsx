import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { BreachBanner } from "@/components/privacy/BreachBanner";
import Analytics from "@/components/Analytics";
import Seo from "@/components/Seo";

const Index = lazy(() => import("./pages/Index"));
const Search = lazy(() => import("./pages/Search"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const Categories = lazy(() => import("./pages/Categories"));
const Rankings = lazy(() => import("./pages/Rankings"));
const Registercreator = lazy(() => import("./pages/Registercreator"));
const About = lazy(() => import("./pages/About"));
const Map = lazy(() => import("./pages/map"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Blog = lazy(() => import("./pages/Blog"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const CityCreators = lazy(() => import("./pages/CityCreators"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const VerificationTerms = lazy(() => import("./pages/VerificationTerms"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CollabHub = lazy(() => import("./pages/CollabHub"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Feed = lazy(() => import("./pages/Feed"));
const EscrowBooking = lazy(() => import("./pages/EscrowBooking"));
const Messages = lazy(() => import("./pages/Messages"));
const Editor = lazy(() => import("./pages/Editor"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminVerification = lazy(() => import("./pages/admin/AdminVerification"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminRankings = lazy(() => import("./pages/admin/AdminRankings"));
const AdminFeatured = lazy(() => import("./pages/admin/AdminFeatured"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Analytics />
          <Seo />
          <BreachBanner />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
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
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<RoleGuard role="creator"><CreatorDashboard /></RoleGuard>} />
            <Route path="/client" element={<RoleGuard role="client"><ClientDashboard /></RoleGuard>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cities/:city" element={<CityCreators />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/verification-terms" element={<VerificationTerms />} />
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
