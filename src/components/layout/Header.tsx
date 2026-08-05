import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, X, Search, Heart, ChevronDown, FileText, Info, HelpCircle, 
  User, LogOut, Settings, LayoutDashboard, Star, MessageCircle, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/booking/NotificationBell";

// --- Navigation Config ---
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Explore" },
  { href: "/search", label: "Discover" },
  { href: "/categories", label: "Categories" },
  { href: "/rankings", label: "Rankings" },
  { href: "/map", label: "Map" },
  { href: "/collab", label: "Collab Hub" },
];

const moreLinks = [
  { id: "blog", href: "/blog", label: "Blog", icon: FileText, desc: "Read our latest articles" },
  { id: "how-it-works", href: "/how-it-works", label: "How It Works", icon: Info, desc: "Learn about our platform" },
  { id: "help", href: "/help", label: "Help Center", icon: HelpCircle, desc: "Get support and answers" },
  { id: "referrals", href: "/referrals", label: "Invite & Earn", icon: Heart, desc: "Refer friends, earn rewards" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreHovered, setIsMoreHovered] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsMenuOpen(false);
    }
  };

  // 🌟 Premium Animation Variants for Mobile Menu
  const menuVariants = {
    closed: { 
      opacity: 0, 
      y: "-10%", 
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const, when: "afterChildren" as const } 
    },
    open: { 
      opacity: 1, 
      y: "0%", 
      transition: { 
        type: "spring" as const, stiffness: 300, damping: 30, 
        staggerChildren: 0.05, delayChildren: 0.1 
      } 
    }
  };

  const linkVariants = {
    closed: { opacity: 0, x: -15 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <>
      <div className="h-16 sm:h-20 w-full shrink-0" />

      <header 
        className={cn(
          "fixed top-0 inset-x-0 z-50 w-full transition-all duration-300 ease-in-out",
          scrolled 
            ? "bg-white/95 dark:bg-[#0f111a]/95 backdrop-blur-xl border-b border-border/40 shadow-sm" 
            : "bg-white/80 dark:bg-[#0f111a]/80 backdrop-blur-md border-b border-border/20"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4 lg:gap-8">
            
            {/* 1. LEFT: LOGO & COMPANY NAME */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 transition-transform hover:opacity-90 group shrink-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-white shadow-sm border border-border/50 flex items-center justify-center transition-all shrink-0">
                <img src="/Canecsu Logo.png" alt="Canecsu Logo" className="h-full w-full object-contain p-0.5" />
              </div>
              <span className="font-extrabold text-lg sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 tracking-tight shrink-0">
                Canecsu
              </span>
            </Link>

            {/* 2. MIDDLE: DESKTOP NAV */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-1.5">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href}
                  className={cn("px-3.5 py-2 rounded-xl text-[14px] font-semibold transition-all duration-200 whitespace-nowrap",
                    isActive(link.href) 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}>
                  {link.label}
                </Link>
              ))}

              <div className="relative" onMouseEnter={() => setIsMoreHovered(true)} onMouseLeave={() => setIsMoreHovered(false)}>
                <button className={cn("flex items-center gap-1 px-3.5 py-2 rounded-xl text-[14px] font-semibold transition-all duration-200",
                  isMoreHovered ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  More <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isMoreHovered && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isMoreHovered && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-2 bg-white dark:bg-card border border-border/40 rounded-2xl shadow-xl z-50">
                      {moreLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.id} to={item.href} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Icon className="h-4 w-4" /></div>
                            <div><div className="text-sm font-bold text-foreground">{item.label}</div><div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div></div>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* 3. RIGHT SIDE: ACTIONS */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-primary rounded-full transition-colors shrink-0" onClick={() => navigate("/search")}>
                  <Search className="h-[20px] w-[20px]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-primary rounded-full transition-colors shrink-0" onClick={() => navigate("/messages")}>
                  <MessageCircle className="h-[20px] w-[20px]" />
                </Button>
              </div>
              
              {user ? (
                <>
                  <div className="hidden md:flex items-center gap-1 sm:gap-2">
                    <NotificationBell />
                    <div className="w-px h-6 bg-border/60 mx-2" />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full gap-2.5 px-1.5 md:px-3 hover:bg-muted/50 border border-transparent hover:border-border/50 h-10 shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-background shadow-sm overflow-hidden shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            profile?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                        <span className="text-sm font-extrabold hidden sm:inline-block truncate max-w-[150px] text-gray-800 dark:text-gray-200">
                          {profile?.name || "User"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-card shadow-2xl p-2 rounded-2xl border-border/40 z-[100]">
                      <div className="px-3 py-2.5 mb-1 border-b border-border/40">
                        <p className="text-sm font-bold truncate text-foreground">{profile?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize font-medium mt-0.5">{profile?.type}</p>
                      </div>
                      
                      <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 hover:bg-muted focus:bg-muted" onClick={() => navigate(profile?.type === "creator" ? "/dashboard" : "/client")}>
                        <LayoutDashboard className="h-4 w-4 mr-2.5 text-muted-foreground" /> <span className="font-medium">Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 hover:bg-muted focus:bg-muted" onClick={() => navigate("/profile")}>
                        <User className="h-4 w-4 mr-2.5 text-muted-foreground" /> <span className="font-medium">My Profile</span>
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 hover:bg-muted focus:bg-muted" onClick={() => navigate("/admin")}>
                          <Settings className="h-4 w-4 mr-2.5 text-muted-foreground" /> <span className="font-medium">Admin Panel</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="my-1 bg-border/40" />

                      <DropdownMenuItem 
                        className="cursor-pointer rounded-xl py-2.5 text-destructive hover:bg-destructive/10 focus:bg-destructive/10" 
                        onSelect={(e) => {
                          e.preventDefault(); 
                          handleSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2.5" /> <span className="font-bold">Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <div className="hidden lg:flex items-center gap-3 pl-2">
                    <div className="w-px h-6 bg-border/60 mx-1" />
                    <Button variant="ghost" className="rounded-xl px-5 font-bold hover:bg-muted" asChild>
                      <Link to="/login">Log in</Link>
                    </Button>
                    <Button className="rounded-xl px-6 font-bold bg-gradient-to-r from-primary to-[#1a66c2] text-white shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all gap-2" asChild>
                      <Link to="/register">
                        <Sparkles className="h-4 w-4" />
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              {/* Animated Hamburger */}
              <Button 
                variant="outline" 
                size="icon" 
                className="lg:hidden h-9 w-9 ml-1 rounded-xl text-foreground shrink-0 border-border/50 hover:bg-muted bg-transparent z-50" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <motion.div animate={{ rotate: isMenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </Button>
              
            </div>
          </div>
        </div>

        {/* 🌟 STAGGERED MOBILE DRAWER CONTENT */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 top-[64px] sm:top-[80px] bg-black/40 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsMenuOpen(false)}
              />

              <motion.div 
                variants={menuVariants}
                initial="closed" 
                animate="open" 
                exit="closed" 
                className="lg:hidden fixed inset-x-0 top-[64px] sm:top-[80px] bg-white dark:bg-[#0f111a] flex flex-col z-40 overflow-hidden shadow-2xl border-b border-border/40 max-h-[calc(100dvh-64px)]"
              >
                <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
                  <div className="container py-6 space-y-2">
                    <motion.p variants={linkVariants} className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Menu
                    </motion.p>
                    
                    {navLinks.map((link) => (
                      <motion.div key={link.href} variants={linkVariants}>
                        <Link to={link.href}
                          className={cn("block px-4 py-3.5 rounded-2xl text-[15px] font-bold transition-all duration-200 active:scale-95", isActive(link.href) ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/60")}
                          onClick={() => setIsMenuOpen(false)}>
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                    
                    <motion.div variants={linkVariants} className="pt-4 pb-2 mt-4 border-t border-border/40">
                      <p className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">More</p>
                      <div className="space-y-1 mt-1">
                        {moreLinks.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link key={item.id} to={item.href} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors active:scale-95" onClick={() => setIsMenuOpen(false)}>
                              <Icon className="h-5 w-5 text-primary/70" />{item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* BOTTOM ACTION AREA */}
                <motion.div variants={linkVariants} className="p-5 bg-card/50 backdrop-blur-md border-t border-border/50 shrink-0 pb-8 sm:pb-5">
                  {user ? (
                     <Button variant="destructive" className="w-full h-14 rounded-2xl text-base font-bold shadow-sm active:scale-95 transition-transform" onClick={handleSignOut}>
                       <LogOut className="h-5 w-5 mr-2" /> Log Out
                     </Button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-[#1a66c2] text-white font-bold text-base shadow-md shadow-primary/20 gap-2 active:scale-95 transition-transform" asChild>
                        <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                          <Sparkles className="h-5 w-5" /> Join as Creator
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full h-14 rounded-2xl text-base font-bold border-border/60 hover:bg-muted bg-transparent active:scale-95 transition-transform" asChild>
                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
