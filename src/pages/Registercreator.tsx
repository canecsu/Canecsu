import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Camera, Briefcase, Check, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const creatorCategories = [
  { value: "photographer", label: "Photographer", icon: "📸" },
  { value: "videographer", label: "Videographer", icon: "🎬" },
  { value: "influencer", label: "Influencer", icon: "✨" },
  { value: "artist", label: "Artist", icon: "🎨" },
  { value: "model", label: "Model", icon: "💃" },
  { value: "makeup-artist", label: "Makeup Artist", icon: "💄" },
  { value: "stylist", label: "Artist", icon: "🎨" },
  { value: "video-editor", label: "Video Editor", icon: "🎞️" },
  { value: "agency", label: "Agency", icon: "🏢" },
  { value: "graphic-designer", label: "Graphic Designer", icon: "🖌️" },
];

const BASE_PRICE = 499;
const EXTRA_ROLE_PRICE = 200;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const toggleRole = (value: string) => {
    setSelectedRoles(prev =>
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    );
  };

  const totalPrice = selectedRoles.length === 0
    ? 0
    : BASE_PRICE + Math.max(0, selectedRoles.length - 1) * EXTRA_ROLE_PRICE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one profession");
      return;
    }
    setLoading(true);
    // Use the first selected role as the primary category
    const primaryRole = selectedRoles[0];
    const { error } = await signUp(email, password, name, "creator", primaryRole);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify your account.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-6 group w-fit">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <span className="font-heading text-xl font-bold text-foreground">Canecsu</span>
          </Link>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-1">Create Creator Account</h1>
          <p className="text-muted-foreground mb-6 text-sm">Join the Canecsu community and grow your brand.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Multi-role selector */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Select your professions <span className="text-muted-foreground font-normal">(multiple allowed)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {creatorCategories.map((cat) => {
                  const isSelected = selectedRoles.includes(cat.value);
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleRole(cat.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-200 text-sm font-medium",
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="flex-1 truncate">{cat.label}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                        >
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic pricing */}
            <AnimatePresence>
              {selectedRoles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""} selected
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          ₹{BASE_PRICE} base{selectedRoles.length > 1 ? ` + ₹${(selectedRoles.length - 1) * EXTRA_ROLE_PRICE} (${selectedRoles.length - 1} extra)` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-extrabold text-foreground">{totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="pl-11 h-12 rounded-xl focus-visible:ring-primary/50" required />
            </div>

            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="pl-11 h-12 rounded-xl focus-visible:ring-primary/50" required />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="pl-11 pr-11 h-12 rounded-xl focus-visible:ring-primary/50" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button type="submit" disabled={loading || selectedRoles.length === 0}
              className="w-full h-12 mt-2 text-base font-semibold text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] gradient-secondary shadow-secondary/20">
              {loading ? "Creating Account..." : `Create Account — ₹${totalPrice}`} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-xs text-muted-foreground text-center leading-relaxed">
            By signing up, you agree to our <Link to="/terms" className="underline hover:text-foreground transition-colors">Terms</Link> and <Link to="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
          </p>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold transition-colors hover:underline text-secondary">Log in</Link>
          </div>
        </motion.div>
      </div>

      {/* Right Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 transition-colors duration-500 gradient-secondary">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="text-center text-white max-w-lg">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Showcase Your Unique Talent
          </h2>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed">
            Get discovered by top brands and local clients. Build your portfolio, set your rates, and grow your career with Canecsu.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
