import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Camera, Sparkles, Briefcase, Phone, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const creatorCategories = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "influencer", label: "Influencer" },
  { value: "artist", label: "Artist" },
  { value: "model", label: "Model" },
  { value: "makeup-artist", label: "Makeup Artist" },
  { value: "stylist", label: "Stylist" },
  { value: "agency", label: "Agency" },
  { value: "graphic-designer", label: "Graphic Designer" },
  { value: "singer", label: "Singer" },
  { value: "dj", label: "DJ" },
  { value: "music-band", label: "Music Band" },
];

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
};

const Register = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get("ref")?.trim().toUpperCase();
    if (referralCode) {
      localStorage.setItem("canecsu_pending_referral", referralCode);
    }
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"client" | "creator">("client");
  const [creatorType, setCreatorType] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const computeAge = (iso: string): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };
  const age = computeAge(dob);
  const isMinor = age !== null && age < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === "creator" && !creatorType) {
      toast.error("Please select your profession");
      return;
    }
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!dob || age === null) {
      toast.error("Please enter your date of birth");
      return;
    }
    if (age < 13) {
      toast.error("You must be at least 13 years old to use Canecsu");
      return;
    }
    if (isMinor && !guardianEmail) {
      toast.error("Parent or guardian email is required for users under 18");
      return;
    }
    if (!consentTerms || !consentData) {
      toast.error("Please accept the consent notices to continue");
      return;
    }
    setLoading(true);

    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (phoneCheckError) {
      setLoading(false);
      toast.error("We couldn't verify this mobile number. Please try again.");
      return;
    }

    if (existingPhone) {
      setLoading(false);
      toast.error("This mobile number is already registered. Please use another number.");
      return;
    }

    const { error } = await signUp(
      email,
      password,
      name,
      accountType,
      creatorType || undefined,
      {
        phone: normalizedPhone,
        dob,
        is_minor: isMinor,
        guardian_email: isMinor ? guardianEmail : null,
        marketing_opt_in: isMinor ? false : marketingOptIn,
        consent_at: new Date().toISOString(),
      },
    );
    if (error) {
      localStorage.removeItem("canecsu_pending_referral");
      setLoading(false);
      toast.error(error.message);
      return;
    }
    setLoading(false);
    toast.success("Account created! Please check your email to verify your account.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background sm:bg-muted/30">
      
      {/* LEFT SIDE - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[440px] my-auto pt-8 pb-12"
        >
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8 transition-transform hover:opacity-80">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white shadow-sm border border-border/50 p-1 flex items-center justify-center">
              <img src="/Canecsu Logo.png" alt="Canecsu Logo" className="h-full w-full object-contain" />
            </div>
            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Canecsu
            </span>
          </Link>

          {/* Form Card (Mobile transparent, Desktop solid) */}
          <div className="sm:bg-card sm:p-8 sm:rounded-3xl sm:shadow-xl sm:border border-border/40 backdrop-blur-sm">
            <h1 className="text-3xl font-extrabold mb-2 text-foreground tracking-tight">Create an account</h1>
            <p className="text-muted-foreground mb-6 text-[15px]">Join the Canecsu community and grow.</p>

            {/* Plain-language data notice */}
            <div className="mb-5 p-3 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground leading-relaxed flex gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>
                We collect your name, email, phone and profile content so you can
                sign in, get booked or hire creators, and receive service updates.
                You can delete your account and data at any time from settings.
              </span>
            </div>

            {/* Account Type Toggle */}
            <div className="flex gap-3 mb-6">
              <button 
                type="button" 
                onClick={() => setAccountType("client")}
                className={`flex-1 p-3 rounded-2xl border-2 transition-all duration-300 text-center relative overflow-hidden group ${
                  accountType === "client" 
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" 
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <Sparkles className={`h-5 w-5 mx-auto mb-1.5 transition-colors duration-300 ${accountType === "client" ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`} />
                <p className={`font-bold text-sm ${accountType === "client" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"}`}>Client</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Hire creators</p>
              </button>
              
              <button 
                type="button" 
                onClick={() => setAccountType("creator")}
                className={`flex-1 p-3 rounded-2xl border-2 transition-all duration-300 text-center relative overflow-hidden group ${
                  accountType === "creator" 
                    ? "border-secondary bg-secondary/5 shadow-sm shadow-secondary/10" 
                    : "border-border hover:border-secondary/30 hover:bg-muted/50"
                }`}
              >
                <Camera className={`h-5 w-5 mx-auto mb-1.5 transition-colors duration-300 ${accountType === "creator" ? "text-secondary" : "text-muted-foreground group-hover:text-secondary/70"}`} />
                <p className={`font-bold text-sm ${accountType === "creator" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"}`}>Creator</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Get hired</p>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {accountType === "creator" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10, overflow: "hidden" }} 
                    animate={{ 
                      opacity: 1, 
                      height: "auto", 
                      y: 0,
                      transitionEnd: { overflow: "visible" } 
                    }} 
                    exit={{ opacity: 0, height: 0, y: -10, overflow: "hidden" }} 
                    transition={{ duration: 0.3 }} 
                  >
                    <label className="text-sm font-bold text-foreground mb-1.5 block">What kind of creator are you?</label>
                    <Select value={creatorType} onValueChange={setCreatorType}>
                      <SelectTrigger className="h-14 w-full rounded-xl bg-muted/50 border-transparent hover:bg-muted focus:ring-2 focus:ring-secondary/20 transition-all text-[15px]">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-5 w-5" />
                          <SelectValue placeholder="Select your profession" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border shadow-xl bg-background z-[100]">
                        {creatorCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="cursor-pointer font-medium py-2.5">
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 pt-1">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Full name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="pl-12 h-14 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-[15px]" 
                    required 
                  />
                </div>
                
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
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="tel" 
                    placeholder="Phone number" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
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
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Date of birth (age gate) */}
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="pl-12 h-14 rounded-xl bg-muted/50 border-transparent hover:bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-[15px]"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 ml-1">
                    We need your date of birth to comply with age-protection laws.
                  </p>
                </div>

                {isMinor && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      Because you are under 18, a parent or guardian must consent.
                      We will not show you behavioural advertising or marketing.
                    </div>
                    <Input
                      type="email"
                      placeholder="Parent / guardian email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      className="h-14 rounded-xl bg-muted/50 border-transparent focus-visible:ring-2 focus-visible:ring-primary/20"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Consent block */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={consentTerms}
                    onCheckedChange={(v) => setConsentTerms(!!v)}
                    className="mt-0.5"
                  />
                  <span className="text-[12px] text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="font-semibold text-foreground hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="font-semibold text-foreground hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={consentData}
                    onCheckedChange={(v) => setConsentData(!!v)}
                    className="mt-0.5"
                  />
                  <span className="text-[12px] text-muted-foreground leading-relaxed">
                    I consent to Canecsu collecting and processing my account data
                    (name, email, phone, profile content) to operate the service.
                  </span>
                </label>
                {!isMinor && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={marketingOptIn}
                      onCheckedChange={(v) => setMarketingOptIn(!!v)}
                      className="mt-0.5"
                    />
                    <span className="text-[12px] text-muted-foreground leading-relaxed">
                      Optional: send me product updates and offers by email.
                    </span>
                  </label>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={loading || !consentTerms || !consentData}
                className={`w-full h-14 mt-6 text-base font-bold text-white rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
                  accountType === "creator" 
                    ? "bg-gradient-to-r from-secondary to-[#5a428c] shadow-secondary/25 hover:shadow-secondary/40" 
                    : "bg-gradient-to-r from-primary to-[#1a66c2] shadow-primary/25 hover:shadow-primary/40"
                }`}
              >
                {loading ? "Creating Account..." : "Create Account"} 
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">or sign up with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-xl font-semibold text-[15px] gap-3 border-border/60 hover:bg-muted/50"
              onClick={async () => {
                // 1. Clear any old data just in case
                localStorage.removeItem("canecsu_signup_type");
                localStorage.removeItem("canecsu_signup_category");

                // 2. Store selected type & category so we can update profile after redirect
                localStorage.setItem("canecsu_signup_type", accountType);
                if (accountType === "creator" && creatorType) {
                  localStorage.setItem("canecsu_signup_category", creatorType);
                }

                // 3. Trigger Google Auth
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/`
                  }
                });
                
                if (error) {
                  toast.error("Google sign-up failed: " + error.message);
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

            <p className="mt-5 text-[12px] text-muted-foreground text-center leading-relaxed px-4">
              By signing up, you agree to our <Link to="/terms" className="font-semibold hover:text-foreground hover:underline transition-colors">Terms</Link> and <Link to="/privacy" className="font-semibold hover:text-foreground hover:underline transition-colors">Privacy Policy</Link>.
            </p>
            
            <div className="mt-5 pt-5 border-t border-border/50 text-center text-[14px] text-muted-foreground">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className={`font-bold hover:underline transition-colors ${accountType === "creator" ? "text-secondary" : "text-primary"}`}
              >
                Log in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Dynamic Premium Visual (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-900 items-center justify-center p-12">
        {/* Dynamic Background Image overlaying gradient */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={accountType}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={accountType === "creator" 
                ? "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop" 
                : "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?q=80&w=2000&auto=format&fit=crop"
              } 
              alt="Background" 
              className="w-full h-full object-cover opacity-25 mix-blend-overlay"
            />
            <div className={`absolute inset-0 transition-colors duration-700 ${
              accountType === "creator" 
                ? "bg-gradient-to-br from-[#423068]/95 to-slate-900/95" 
                : "bg-gradient-to-br from-primary/95 to-[#423068]/95"
            }`} />
          </motion.div>
        </AnimatePresence>

        {/* Glassmorphism Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-700 ${
          accountType === "creator" ? "bg-purple-500/20" : "bg-blue-500/20"
        }`} />

        <AnimatePresence mode="wait">
          <motion.div 
            key={accountType} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            transition={{ duration: 0.4 }} 
            className="relative z-10 text-center text-white max-w-lg"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl backdrop-blur-md border border-white/20 ${
              accountType === "creator" ? "bg-secondary/30" : "bg-white/20"
            }`}>
              {accountType === "creator" ? <Camera className="h-8 w-8 text-white" /> : <Sparkles className="h-8 w-8 text-amber-300" />}
            </div>
            
            <h2 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              {accountType === "creator" ? "Showcase Your Unique Talent" : "Find Perfect Creators Instantly"}
            </h2>
            
            <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed">
              {accountType === "creator" 
                ? "Get discovered by top brands and local clients. Build your portfolio, set your rates, and grow your career with Canecsu." 
                : "Browse verified, top-ranked creators in your city. Compare portfolios, read reviews, and book talent with complete confidence."}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      
    </div>
  );
};

export default Register;
