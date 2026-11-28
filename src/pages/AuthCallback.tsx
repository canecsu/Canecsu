import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const completeSignIn = async () => {
      const providerError = searchParams.get("error_description") || searchParams.get("error");
      if (providerError) {
        const message = decodeURIComponent(providerError.replace(/\+/g, " "));
        setErrorMessage(message);
        toast.error(`Google sign-in failed: ${message}`);
        window.setTimeout(() => navigate("/login", { replace: true }), 1600);
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMessage(error.message);
          toast.error(`Sign-in could not be completed: ${error.message}`);
          window.setTimeout(() => navigate("/login", { replace: true }), 1600);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error || !data.session) {
        const message = error?.message || "The sign-in session was not received. Please try again.";
        setErrorMessage(message);
        toast.error(message);
        window.setTimeout(() => navigate("/login", { replace: true }), 1600);
        return;
      }

      navigate("/", { replace: true });
    };

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {errorMessage ? (
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        ) : (
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
        )}
        <h1 className="text-xl font-semibold">
          {errorMessage ? "Sign-in could not be completed" : "Completing sign-in…"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {errorMessage || "Please wait while we securely finish your CANECSU session."}
        </p>
      </div>
    </main>
  );
};

export default AuthCallback;
