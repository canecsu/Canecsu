import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  role: "creator" | "client";
  children: ReactNode;
}

export function RoleGuard({ role, children }: Props) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (profile && profile.type && profile.type !== role) {
      navigate(profile.type === "creator" ? "/dashboard" : "/client", { replace: true });
    }
  }, [user, profile, loading, role, navigate]);

  if (loading || !user || (profile && profile.type && profile.type !== role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}