import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  name?: string;
  type?: "creator" | "client";
  category?: string;
  plan?: string;
  pro_verified_badge?: boolean;
  business_verified_badge?: boolean;
  search_ranking_score?: number;
  [key: string]: any;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    type: "creator" | "client",
    category?: string,
    profileData?: Record<string, unknown>,
  ) => Promise<{ error: any; user: User | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const completePendingReferral = async () => {
    const pendingCode = localStorage.getItem("canecsu_pending_referral");
    if (!pendingCode) return;

    const { error } = await supabase.rpc("complete_referral", {
      p_referral_code: pendingCode,
    });

    if (!error) {
      localStorage.removeItem("canecsu_pending_referral");
      return;
    }

    const message = error.message?.toLowerCase() || "";
    if (
      message.includes("invalid referral") ||
      message.includes("already been used") ||
      message.includes("already used a referral") ||
      message.includes("own referral") ||
      message.includes("new accounts only")
    ) {
      localStorage.removeItem("canecsu_pending_referral");
    }

    console.error("Referral reward could not be applied:", error);
  };

  useEffect(() => {
    let mounted = true; // Prevents memory leaks if component unmounts

    const fetchUserData = async (userId: string) => {
      try {
        let profileData = null;
        let retries = 4; // We will try 4 times to let the database catch up

        // 1. Wait for the database trigger to create the profile first!
        while (retries > 0) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle(); // maybeSingle doesn't throw an error if it finds 0 rows

          if (data) {
            profileData = data;
            break; // Profile found! Exit the loop.
          }
          
          // Wait 500ms before trying again to give Postgres time to finish
          await new Promise(resolve => setTimeout(resolve, 500));
          retries--;
        }

        if (!profileData) {
          console.error("Timeout: Profile was never created by the database.");
          throw new Error("Profile not found");
        }

        // 2. NOW check if this is a Google OAuth signup that needs a profile type update
        const pendingType = localStorage.getItem("canecsu_signup_type");
        
        if (pendingType) {
          const pendingCategory = localStorage.getItem("canecsu_signup_category");
          
          // Attempt to update the profile type
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ type: pendingType as "creator" | "client" })
            .eq("id", userId);
            
          if (updateError) {
             console.error("Failed to update profile type. Check your RLS policies!", updateError);
          } else {
            // Update local state so the UI reflects it immediately
            profileData.type = pendingType;

            // If creator, ensure creator_profile exists
            if (pendingType === "creator") {
              const { data: existingCp } = await supabase
                .from("creator_profiles")
                .select("id")
                .eq("profile_id", userId)
                .maybeSingle();
              
              if (!existingCp) {
                await supabase.from("creator_profiles").insert({
                  profile_id: userId,
                  category: (pendingCategory || "photographer") as any,
                });
              } else if (pendingCategory) {
                await supabase.from("creator_profiles").update({ category: pendingCategory as any }).eq("profile_id", userId);
              }
            }
            
            // Only clear localStorage IF the update was successful
            localStorage.removeItem("canecsu_signup_type");
            localStorage.removeItem("canecsu_signup_category");
          }
        }

        await completePendingReferral();

        if (mounted) setProfile(profileData as UserProfile);

        // Fetch Admin Role
        const { data: hasAdmin, error: adminError } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });

        if (adminError) throw adminError;
        if (mounted) setIsAdmin(!!hasAdmin);

      } catch (error) {
        console.error("Error fetching user data:", error);
        if (mounted) {
          setProfile(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Get initial session and set up listener
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          fetchUserData(initialSession.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            fetchUserData(currentSession.user.id);
          } else {
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    type: "creator" | "client",
    category?: string,
    profileData: Record<string, unknown> = {},
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ...profileData, name, type, category },
        emailRedirectTo: window.location.origin,
      },
    });
    return {
      error,
      user: data.user ?? null,
      session: data.session ?? null,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Performance Optimization: useMemo prevents unnecessary re-renders of all child components
  const value = useMemo(
    () => ({ session, user, profile, loading, isAdmin, signUp, signIn, signOut }),
    [session, user, profile, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
