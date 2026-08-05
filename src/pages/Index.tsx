import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { FeaturedCreators } from "@/components/home/FeaturedCreators";
import { CategoryBrowse } from "@/components/home/CategoryBrowse";
import { TrendingCities } from "@/components/home/TrendingCities";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";
import { RoleSelectionModal } from "@/components/auth/RoleSelectionModal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (localStorage.getItem("canecsu_role_prompted_v2")) return;
    const t = setTimeout(() => setRoleModalOpen(true), 1500);
    return () => clearTimeout(t);
  }, [user, loading]);

  const handleRoleSelect = (role: "client" | "creator") => {
    localStorage.setItem("canecsu_role_prompted_v2", "1");
    localStorage.setItem("canecsu_signup_type", role);
    setRoleModalOpen(false);
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <FeaturedCreators />
        <CategoryBrowse />
        <TrendingCities />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
      <RoleSelectionModal
        open={roleModalOpen}
        onSelect={handleRoleSelect}
        onOpenChange={(o) => {
          if (!o) localStorage.setItem("canecsu_role_prompted_v2", "1");
          setRoleModalOpen(o);
        }}
      />
    </div>
  );
};

export default Index;
