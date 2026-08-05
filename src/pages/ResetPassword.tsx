import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event which fires when user clicks the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setChecking(false);
      } else if (event === "SIGNED_IN" && session) {
        // Sometimes the recovery comes as SIGNED_IN with the recovery token
        // Check if URL contains type=recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        if (hashParams.get("type") === "recovery" || urlParams.get("type") === "recovery") {
          setIsRecoveryMode(true);
        }
        setChecking(false);
      }
    });

    // Also check current URL hash for recovery tokens (in case event already fired)
    const checkHash = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      
      if (hashParams.get("type") === "recovery" || urlParams.get("type") === "recovery") {
        setIsRecoveryMode(true);
        setChecking(false);
        return;
      }

      // Check if user has an active session (might already be in recovery)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsRecoveryMode(true);
      }
      setChecking(false);
    };

    // Small delay to let auth state change fire first
    setTimeout(checkHash, 1000);

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/login");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2 text-foreground">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
          <Button onClick={() => navigate("/login")} className="w-full h-12 rounded-xl">
            Back to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2 text-center text-foreground">Reset Password</h1>
        <p className="text-muted-foreground mb-8 text-center">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="New password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="pl-10 pr-10 h-12 rounded-xl" 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="relative">
            <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirm new password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="pl-10 h-12 rounded-xl" 
              required 
            />
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="text-xs text-destructive">Password must be at least 6 characters</p>
          )}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
