import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      const message = error.message?.toLowerCase().includes("email not confirmed")
        ? "Please verify your email first, then log in."
        : error.message;
      toast.error(message);
    } else {
      toast.success("Welcome back!");
      // Fetch profile to determine type and redirect accordingly
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profileData } = await supabase.from("profiles").select("type").eq("id", authUser.id).single();
        navigate(profileData?.type === "client" ? "/client" : "/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first to reset password");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  };

  return (
    <div className="min-h-screen flex bg-background sm:bg-muted/30">
      
      {/* LEFT SIDE - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Brand Logo */}
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="flex items-center gap-3 mb-10 transition-transform hover:opacity-80">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow-sm border border-border/50 p-1 flex items-center justify-center">
              <img src="/Canecsu Logo.png" alt="Canecsu Logo" className="h-full w-full object-contain" />
            </div>
            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Canecsu
            </span>
          </button>

          {/* Form Card (Mobile transparent, Desktop solid) */}
          <div className="sm:bg-card sm:p-8 sm:rounded-3xl sm:shadow-xl sm:border border-border/40 backdrop-blur-sm">
            <h1 className="text-3xl font-extrabold mb-2 text-foreground tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mb-8 text-[15px]">Log in to your account to continue</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="pl-12 h-14 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-[15px]" 
                    required 
                  />
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="pl-12 pr-12 h-14 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-[15px]" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  className="text-[13px] font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-[#1a66c2] text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all" 
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log In"} 
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Sign-In - UPDATED SECTION */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-xl font-semibold text-[15px] gap-3 border-border/60 hover:bg-muted/50"
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/`
                  }
                });
                
                if (error) {
                  toast.error("Google sign-in failed: " + error.message);
                }
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            <div className="mt-6 text-center text-[14px] text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Premium Visual (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900 items-center justify-center p-12">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?q=80&w=2000&auto=format&fit=crop" 
            alt="Creative Collaboration" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-[#423068]/95" />
        </div>
        
        {/* Glassmorphism Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 text-center text-white max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold mb-8">
            ✨ The Creator Network
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Connect with <br/>Creative Talent
          </h2>
          <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed">
            Discover top-ranked creators, book seamlessly, and bring your vision to life on Canecsu.
          </p>
        </motion.div>
      </div>
      
    </div>
  );
};

export default Login;
