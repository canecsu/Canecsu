import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldX className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access the admin panel.</p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldX className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="font-heading text-2xl font-bold">Unauthorized</h1>
          <p className="text-muted-foreground">You don't have admin privileges to access this panel.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
