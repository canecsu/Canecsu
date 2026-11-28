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

      // The Supabase client is configured with detectSessionInUrl=true, so it
      // exchanges the PKCE code automatically. Calling exchangeCodeForSession
      // here as well creates a race and can consume the one-time code twice.
      // Wait for that automatic exchange to finish, while still supporting a
      // session that was already restored before this route mounted.
      const getSessionAfterOAuth = async () => {
        const immediate = await supabase.auth.getSession();
        if (immediate.data.session || !searchParams.get("code")) return immediate;

        return await new Promise<typeof immediate>((resolve) => {
          let settled = false;
          let timeoutId: number | undefined;
          const finish = (result: typeof immediate) => {
            if (settled) return;
            settled = true;
            if (timeoutId) window.clearTimeout(timeoutId);
            subscription.unsubscribe();
            resolve(result);
          };

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (session) finish({ data: { session }, error: null });
            },
          );

          timeoutId = window.setTimeout(async () => {
            finish(await supabase.auth.getSession());
          }, 5000);
        });
      };

      const { data, error } = await getSessionAfterOAuth();
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

