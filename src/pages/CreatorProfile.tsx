import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  MapPin, MessageCircle, Calendar, Star, Clock, Globe, Instagram, Youtube, 
  Share2, Heart, ArrowLeft, Send, X, Bookmark, Briefcase, Layers, 
  MessageSquare, PlayCircle, Shield, Zap, CheckCircle2, BadgeCheck, ArrowRight
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StarRating } from "@/components/shared/StarRating";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { AvailabilityIndicator } from "@/components/shared/AvailabilityIndicator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { ServicePackages } from "@/components/creator/ServicePackages";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORY_LABELS } from "@/types/creator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { checkContentViolations } from "@/lib/contentModeration";

export { checkContentViolations };
import type { Database } from "@/integrations/supabase/types";

// TypeScript definition for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type CreatorProfileT = Database["public"]["Tables"]["creator_profiles"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";

// Utility function to load the Razorpay script
const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// 🛡️ SECURITY: Censor info on rendering (so old data is hidden)
const censorText = (text: string) => {
  if (!text) return text;
  let censored = text;
  censored = censored.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[Hidden Email]");
  censored = censored.replace(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g, "[Hidden Phone]");
  censored = censored.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, "[Hidden Link]");
  return censored;
};

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user, profile: currentUserProfile } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileT | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<any[]>([]); 
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [creatorPlan, setCreatorPlan] = useState<string>("free");
  
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  
  const [viewingRichProject, setViewingRichProject] = useState<any | null>(null); 
  const [preselectedService, setPreselectedService] = useState<Service | null>(null);
  
  // BookMyShow Style Booking State
  const [quoteServiceId, setQuoteServiceId] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteFromDate, setQuoteFromDate] = useState("");
  const [quoteFromTime, setQuoteFromTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  
  // --- PROJECT STATS STATE ---
  const [projectLikesCount, setProjectLikesCount] = useState(0);
  const [isProjectLiked, setIsProjectLiked] = useState(false);
  const [projectViews, setProjectViews] = useState(0);

  // --- COMMENT STATE ---
  const [commentText, setCommentText] = useState("");
  const [projectComments, setProjectComments] = useState<any[]>([]);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  useEffect(() => { if (id) fetchCreator(id); }, [id]);
  useEffect(() => { if (user && id) checkShortlist(); }, [user, id]);

  useEffect(() => {
    if (viewingRichProject) {
      fetchProjectStats(viewingRichProject.id);
      fetchComments(viewingRichProject.id);
      recordAndFetchView(viewingRichProject.id, viewingRichProject.views_count);
    } else {
      setProjectComments([]);
      setProjectLikesCount(0);
      setIsProjectLiked(false);
      setProjectViews(0);
    }
  }, [viewingRichProject]);

  const recordAndFetchView = async (projectId: string, currentViews: number = 0) => {
    setProjectViews(currentViews + 1);
  };

  const fetchProjectStats = async (portfolioItemId: string) => {
    const { count, data, error } = await supabase
      .from('project_likes')
      .select('user_id', { count: 'exact' })
      .eq('portfolio_item_id', portfolioItemId);

    if (!error) {
      setProjectLikesCount(count || 0);
      if (user && data) {
        setIsProjectLiked(data.some(like => like.user_id === user.id));
      }
    }
  };

  const handleProjectLike = async () => {
    if (!requireAuth() || !viewingRichProject) return;

    const previousLikedState = isProjectLiked;
    const previousCount = projectLikesCount;

    setIsProjectLiked(!previousLikedState);
    setProjectLikesCount(prev => prev + (previousLikedState ? -1 : 1));

    if (previousLikedState) {
      const { error } = await supabase.from('project_likes')
        .delete()
        .eq('portfolio_item_id', viewingRichProject.id)
        .eq('user_id', user!.id);
      
      if (error) { 
        setIsProjectLiked(previousLikedState); 
        setProjectLikesCount(previousCount); 
        toast.error("Failed to remove like");
      }
    } else {
      const { error } = await supabase.from('project_likes')
        .insert({ portfolio_item_id: viewingRichProject.id, user_id: user!.id });
      
      if (error) { 
        setIsProjectLiked(previousLikedState); 
        setProjectLikesCount(previousCount); 
        toast.error("Failed to like project");
      }
    }
  };

  const fetchComments = async (portfolioItemId: string) => {
    const { data: commentsData, error: commentsError } = await supabase
      .from('project_comments')
      .select('*, profiles:user_id(name, avatar_url)')
      .eq('portfolio_item_id', portfolioItemId)
      .order('created_at', { ascending: false });
      
    if (!commentsError && commentsData) {
      setProjectComments(commentsData);

      if (user) {
        const commentIds = commentsData.map(c => c.id);
        if (commentIds.length > 0) {
          const { data: userLikes } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', user.id)
            .in('comment_id', commentIds);

          if (userLikes) {
            const likesMap: Record<string, boolean> = {};
            userLikes.forEach(like => likesMap[like.comment_id] = true);
            setLikedComments(likesMap);
          }
        }
      }
    }
  };

  const handlePostComment = async () => {
    if (!requireAuth() || !viewingRichProject) return;
    if (!commentText.trim()) return;

    // SECURITY CHECK: Block Contact Info in Comments
    const violation = checkContentViolations(commentText);
    if (violation) {
      toast.error("Action Blocked", {
        description: `Please remove ${violation.toLowerCase()} from your comment. Sharing contact info is strictly prohibited.`
      });
      return;
    }

    setIsPostingComment(true);
    const { error } = await supabase.from('project_comments').insert([{
      portfolio_item_id: viewingRichProject.id,
      user_id: user!.id,
      content: commentText.trim() 
    }]);

    setIsPostingComment(false);

    if (error) {
      toast.error("Failed to post comment");
    } else {
      toast.success("Comment posted successfully!");
      setCommentText("");
      fetchComments(viewingRichProject.id);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!requireAuth()) return;
    
    const isLiked = likedComments[commentId];
    setLikedComments(prev => ({ ...prev, [commentId]: !isLiked }));
    
    try {
      if (isLiked) {
        const { error } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: user!.id }]);
        if (error) throw error;
      }
    } catch (error) {
      setLikedComments(prev => ({ ...prev, [commentId]: isLiked }));
      toast.error("Failed to update like");
    }
  };

  const checkShortlist = async () => {
    if (!user || !id) return;
    const { data } = await supabase.from("shortlists").select("id").eq("client_id", user.id).eq("creator_id", id).maybeSingle();
    setIsSaved(!!data);
  };

  const fetchCreator = async (creatorId: string) => {
    setLoading(true);
    const [pRes, cpRes, svcRes, revRes, projRes, subRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", creatorId).single(),
      supabase.from("creator_profiles").select("*").eq("profile_id", creatorId).single(),
      supabase.from("services").select("*").eq("creator_id", creatorId).eq("is_active", true),
      supabase.from("reviews").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false }),
      (supabase.from("projects" as any).select("*").eq("creator_id", creatorId).eq("published", true).order("created_at", { ascending: false }) as any), 
      supabase.from("subscriptions").select("plan_name").eq("user_id", creatorId).maybeSingle()
    ]);
    
    setProfile(pRes.data);
    setCreatorProfile(cpRes.data);
    setServices(svcRes.data || []);
    setReviews(revRes.data || []);
    setProjects(projRes.data || []);
    setCreatorPlan(subRes.data?.plan_name?.toLowerCase() || "free"); 
    setLoading(false);
  };

  const requireAuth = () => {
    if (!user) { toast.error("Please log in first"); navigate("/login"); return false; }
    return true;
  };

  const handlePremiumAction = (_featureName: string, actionCallback: () => void) => {
    if (!requireAuth()) return;
    actionCallback();
  };

  const handleFreeContactAction = (actionCallback: () => void) => {
    if (!requireAuth()) return;
    actionCallback();
  };

  const handleSave = async () => {
    if (!requireAuth() || !id) return;
    if (isSaved) {
      await supabase.from("shortlists").delete().eq("client_id", user!.id).eq("creator_id", id);
      setIsSaved(false); toast.success("Removed from saved");
    } else {
      await supabase.from("shortlists").insert({ client_id: user!.id, creator_id: id });
      setIsSaved(true); toast.success("Saved to your shortlist!");
    }
  };

  // --- 50% Advance Booking via Razorpay ---
  const handleRequestQuote = async () => {
    if (!requireAuth() || !id) return;
    if (!quoteServiceId) {
        toast.error("Please select a service first.");
        return;
    }
    
    // SECURITY CHECK: Block Contact Info in Booking Notes
    const violation = checkContentViolations(quoteMessage);
    if (violation) {
      toast.error("Security Warning", {
        description: `Please remove ${violation.toLowerCase()} from your notes. Attempting to bypass the platform is strictly prohibited.`
      });
      return;
    }
    
    const selectedService = services.find(s => s.id === quoteServiceId);
    const totalPrice = selectedService?.price || 0;
    
    // Calculate 50% Advance
    const advanceAmount = Math.ceil(totalPrice / 2);
    const balanceAmount = totalPrice - advanceAmount;

    const requirementsText = `📅 Requested Slot for: ${selectedService?.title || 'Custom Service'}
Date: ${quoteFromDate} 
Time: ${quoteFromTime || 'Any Time'}

💰 Payment Info:
Total: ₹${totalPrice}
Advance Paid: ₹${advanceAmount}
Balance Due: ₹${balanceAmount}

💬 Message: 
${quoteMessage}`;

    setSubmitting(true);

    try {
      // --- ZERO AMOUNT BYPASS ---
      if (advanceAmount === 0) {
        const { error: freeBookingError } = await supabase.from('bookings').insert({
          client_id: user!.id,
          creator_id: id,
          service_id: selectedService?.id,
          booking_date: quoteFromDate || format(new Date(), "yyyy-MM-dd"),
          booking_time: quoteFromTime || null,
          total_price: 0,
          advance_paid: 0,
          requirements: requirementsText,
          status: "confirmed",
          notes: "Free Booking"
        });

        if (freeBookingError) throw new Error("Failed to save free booking.");
        
        toast.success("Booking confirmed successfully!");
        setQuoteOpen(false);
        setQuoteMessage(""); setQuoteServiceId("");
        setQuoteFromDate(""); setQuoteFromTime("");
        setSubmitting(false);
        return;
      }

      // --- PAID BOOKING ---
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Check your connection.");
        setSubmitting(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: { 
            amount: advanceAmount, 
            type: "booking",
            userId: user?.id,
            creatorId: id
          },
        }
      );

      if (orderError || !orderData?.orderId) {
        throw new Error("Failed to create secure payment order.");
      }

      const options = {
        key: orderData.keyId,
        amount: advanceAmount * 100,
        currency: "INR",
        name: profile?.name || "Creator Booking",
        description: `50% Advance for ${selectedService?.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                type: "booking",
                amount: advanceAmount,
                userId: user?.id,
                creatorId: id,
                bookingDetails: {
                  date: quoteFromDate || new Date().toISOString().split("T")[0],
                  totalPrice: totalPrice,
                  requirementsText: requirementsText,
                  time: quoteFromTime,
                  serviceId: selectedService?.id
                }
              },
            });

            if (verifyError || !verifyData?.success) {
              throw new Error("Backend verification failed.");
            }

            toast.success("Payment Verified! Booking confirmed."); 
            setQuoteOpen(false);
            setQuoteMessage(""); setQuoteServiceId("");
            setQuoteFromDate(""); setQuoteFromTime("");

          } catch (err) {
            console.error("Verification failed:", err);
            toast.error("Payment completed, but verification failed. Check dashboard logs.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            toast.info("Payment cancelled. Booking was not completed.");
          },
        },
        prefill: {
          name: currentUserProfile?.name || user?.email,
          email: user?.email || "",
        },
        theme: { color: "#2563eb" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong initiating the payment.");
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: profile?.name || "Creator", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied!");
    }
  };

  const getProjectThumbnail = (project: any) => {
    if (project.cover_image_url) return project.cover_image_url;
    
    const firstImg = project.content_blocks?.find((b: any) => b.type === 'image');
    if (firstImg) return firstImg.content;
    
    const firstGrid = project.content_blocks?.find((b: any) => b.type === 'grid');
    if (firstGrid && firstGrid.content && firstGrid.content.length > 0) return firstGrid.content[0];
    
    return DEFAULT_IMAGE;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></main></div>
  );
  if (!profile) return (
    <div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-2">Creator not found</h1><Button asChild><Link to="/search">Browse Creators</Link></Button></div></main></div>
  );

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
  const categoryLabel = creatorProfile ? (CATEGORY_LABELS[creatorProfile.category as keyof typeof CATEGORY_LABELS] || creatorProfile.category) : "";
  const startingRate = creatorProfile?.price_min || 0;
  const completedBookings = creatorProfile?.completed_bookings || 0;

  const isOwnProfile = user?.id === id;
  // Plan gating removed: show every project to every visitor.
  const displayedProjects = projects;
  const hiddenProjectsCount = 0;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto bg-card shadow-sm md:border-x border-border/50 pb-24 md:pb-12">

        {/* ═══════════ COVER SECTION ═══════════ */}
        <div className="w-full h-56 sm:h-72 md:h-[380px] relative bg-muted overflow-hidden">
          {profile.cover_url ? (
            <img 
              src={profile.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover" 
              onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-muted" />
          )}
          
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-black/20 backdrop-blur-sm shadow-sm" asChild>
              <Link to="/search"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-white hover:bg-white/20 rounded-full bg-black/20 backdrop-blur-sm shadow-sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSave} className="text-white hover:bg-white/20 rounded-full bg-black/20 backdrop-blur-sm shadow-sm">
                <Heart className={cn("h-4 w-4", isSaved && "fill-red-500 text-red-500")} />
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════ PROFILE HEADER ═══════════ */}
        <div className="flex flex-col md:flex-row w-full relative z-10">

          {/* LEFT SIDEBAR */}
          <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 px-6 sm:px-10 pb-10 md:border-r border-border/60 flex flex-col items-center md:items-start text-center md:text-left bg-card relative">

            <div className="relative -mt-16 md:-mt-24 z-20 mb-5">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-card flex items-center justify-center text-5xl font-bold text-primary border-[6px] border-card shadow-xl overflow-hidden">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=" + profile.name; }}
                  />
                ) : (
                  profile.name.charAt(0)
                )}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {profile.name}
                </h1>
                
                {(creatorPlan === 'business' || creatorPlan === 'business access') && (
                  <span title="Business Verified"><BadgeCheck className="w-6 h-6 text-white fill-yellow-500" /></span>
                )}
                {(creatorPlan === 'pro' || creatorPlan === 'premium pass') && (
                  <span title="Premium Verified"><BadgeCheck className="w-6 h-6 text-white fill-blue-500" /></span>
                )}
              </div>
              <p className="text-sm font-semibold tracking-wide text-muted-foreground mt-1">
                {categoryLabel || "Creator"}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap justify-center md:justify-start">
              {profile.city && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.city}{profile.state ? `, ${profile.state}` : ""}
                </span>
              )}
              <AvailabilityIndicator
                isOnline={creatorProfile?.is_available_now || false}
                variant="badge"
                size="sm"
              />
            </div>

            <div className="grid grid-cols-4 gap-3 w-full mt-7 py-6 border-y border-border/50">
              {[
                { label: "Projects", value: projects.length },
                { label: "Reviews", value: reviews.length },
                { label: "Completed", value: completedBookings },
                { label: "Rating", value: avgRating.toFixed(1) },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="font-bold text-xl">{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="w-full space-y-3 mt-8">
              <Button
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide text-sm shadow-md transition-transform active:scale-[0.98]"
                onClick={() => handlePremiumAction("Booking", () => {
                  setPreselectedService(null);
                  setBookingOpen(true);
                })}
              >
                <Briefcase className="h-4 w-4 mr-2" /> Book Now
              </Button>
              <Button
                variant="outline"
                className={cn("w-full h-12 rounded-xl font-bold text-sm border-border/80 hover:bg-muted/50", isSaved && "bg-primary/5 border-primary/30 text-primary")}
                onClick={handleSave}
              >
                <Bookmark className={cn("h-4 w-4 mr-1.5", isSaved && "fill-current")} />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </div>

            {startingRate > 0 && (
              <div className="w-full mt-8 p-5 bg-gradient-to-br from-muted/50 to-transparent rounded-2xl border border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Starting from</p>
                <p className="font-bold text-3xl">₹{startingRate.toLocaleString()}<span className="text-sm font-medium text-muted-foreground">/hr</span></p>
              </div>
            )}

            {profile.bio && (
              <div className="w-full mt-8">
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-widest">About</h3>
                {/* 🛡️ SECURITY: Masking existing bad bios */}
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {censorText(profile.bio)}
                </p>
              </div>
            )}

            {creatorProfile?.specializations && creatorProfile.specializations.length > 0 && (
              <div className="w-full mt-8">
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-widest">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {creatorProfile.specializations.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-muted/60 text-foreground text-xs font-semibold rounded-lg border border-border/30 shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-8 justify-center md:justify-start">
              {creatorProfile?.instagram && (
                <a href={`https://instagram.com/${creatorProfile.instagram}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {creatorProfile?.youtube && (
                <a href={`https://youtube.com/${creatorProfile.youtube}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-red-500/10 hover:text-red-500 transition-all">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-all">
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* ═══════════ RIGHT CONTENT AREA ═══════════ */}
          <div className="flex-1 p-5 sm:p-10 min-w-0">
            <Tabs defaultValue="projects" className="w-full">

              <TabsList className="flex w-full justify-start h-auto p-0 bg-transparent border-b border-border/50 rounded-none mb-8 gap-6 sm:gap-8 overflow-x-auto scrollbar-hide">
                {[
                  { value: "projects", label: "Portfolio", count: projects.length },
                  { value: "services", label: "Services", count: services.length },
                  { value: "availability", label: "Availability" },
                  { value: "reviews", label: "Reviews", count: reviews.length },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="pb-4 pt-1 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground transition-all whitespace-nowrap"
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-muted px-2 py-0.5 rounded-full text-[10px] text-foreground font-bold">{tab.count}</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ═══ PROJECTS TAB ═══ */}
              <TabsContent value="projects" className="mt-0 outline-none animate-in fade-in duration-500">
                <div className="space-y-12">
                  {displayedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedProjects.map(project => {
                        const hasVideo = project.content_blocks?.some((b: any) => b.type === 'video');
                        return (
                          <div 
                            key={project.id} 
                            onClick={() => setViewingRichProject(project)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-border/40 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                          >
                            <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                              <img 
                                src={getProjectThumbnail(project)} 
                                alt={project.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
                              />
                              
                              {hasVideo && (
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm p-2 rounded-full text-white">
                                  <PlayCircle className="h-5 w-5" />
                                </div>
                              )}

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="text-white font-bold bg-white/20 px-6 py-2.5 rounded-full border border-white/30 backdrop-blur-md shadow-lg flex items-center gap-2">
                                  View Project
                                </span>
                              </div>
                            </div>
                            <div className="p-5">
                              <h3 className="font-bold text-foreground text-base line-clamp-1">{project.title}</h3>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                                     {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : null}
                                  </div>
                                  <p className="text-xs font-medium text-muted-foreground line-clamp-1">{profile.name}</p>
                                  
                                  {(creatorPlan === 'business' || creatorPlan === 'business access') && (
                                    <span title="Business Verified"><BadgeCheck className="w-3.5 h-3.5 text-white fill-yellow-500" /></span>
                                  )}
                                  {(creatorPlan === 'pro' || creatorPlan === 'premium pass') && (
                                    <span title="Premium Verified"><BadgeCheck className="w-3.5 h-3.5 text-white fill-blue-500" /></span>
                                  )}
                                </div>
                                {project.views_count !== undefined && (
                                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    <PlayCircle className="h-3 w-3" /> {project.views_count}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-24 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/50">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg text-foreground">No projects published yet.</p>
                      <p className="text-sm mt-1">Check back later to see their portfolio.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ═══ SERVICES TAB ═══ */}
              <TabsContent value="services" className="mt-0 outline-none animate-in fade-in duration-500">
                <ServicePackages
                  services={services}
                  onSelect={(service) => handlePremiumAction("Booking", () => { 
                    const match = services.find(s => s.id === service.id);
                    setPreselectedService(match || null);
                    setBookingOpen(true);
                  })}
                  onRequestQuote={() => handleFreeContactAction(() => setQuoteOpen(true))} 
                />
              </TabsContent>

              {/* ═══ AVAILABILITY TAB ═══ */}
              <TabsContent value="availability" className="mt-0 outline-none animate-in fade-in duration-500">
                <div className="bg-card rounded-3xl p-6 sm:p-10 border border-border/50 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-primary" /> Availability Schedule
                      </h3>
                      <p className="text-sm text-muted-foreground">Select a date to view available slots.</p>
                    </div>
                    <AvailabilityIndicator
                      isOnline={creatorProfile?.is_available_now || false}
                      variant="badge"
                      size="sm"
                    />
                  </div>
                  {id && <AvailabilityCalendar creatorId={id} onSlotSelect={() => handlePremiumAction("Booking", () => setBookingOpen(true))} />}
                </div>
              </TabsContent>

              {/* ═══ REVIEWS TAB ═══ */}
              <TabsContent value="reviews" className="mt-0 outline-none animate-in fade-in duration-500">
                {reviews.length === 0 ? (
                  <div className="bg-muted/20 rounded-3xl p-16 text-center border border-dashed border-border/50">
                     <Star className="h-10 w-10 mx-auto mb-4 opacity-20 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm font-medium">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
                           <div className="flex items-start justify-between mb-4">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                 {review.client_avatar ? (
                                   <img src={review.client_avatar} alt="" className="w-full h-full object-cover" />
                                 ) : (
                                   <span className="text-sm font-bold text-muted-foreground">{review.client_name.charAt(0)}</span>
                                 )}
                               </div>
                               <div>
                                 <p className="font-bold text-sm text-foreground">{review.client_name}</p>
                                 <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                               </div>
                             </div>
                             <StarRating rating={review.rating} size="sm" />
                           </div>
                           <p className="text-sm text-muted-foreground leading-relaxed pl-14">{review.review_text}</p>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* ═══════════ MOBILE STICKY BOTTOM BAR ═══════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-card/90 backdrop-blur-md border-t border-border z-50 flex items-center gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <Button
          className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md"
          onClick={() => handlePremiumAction("Booking", () => {
            setPreselectedService(null);
            setBookingOpen(true);
          })}
        >
          Book Now
        </Button>
        <Button
          variant="outline"
          className={cn("flex-1 h-12 rounded-xl font-bold text-sm bg-card", isSaved && "bg-primary/5 border-primary/30 text-primary")}
          onClick={handleSave}
        >
          <Bookmark className={cn("h-4 w-4 mr-1.5", isSaved && "fill-current")} />
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      {/* ═══════════ BEHANCE STYLE FULLSCREEN DARK VIEWER ═══════════ */}
      <Dialog open={!!viewingRichProject} onOpenChange={(open) => !open && setViewingRichProject(null)}>
        <DialogContent className="max-w-[100vw] h-[100dvh] w-screen p-0 m-0 bg-[#0a0a0a] border-none shadow-none flex flex-col rounded-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          
          <div className="flex items-center justify-between px-6 py-4 bg-[#111] border-b border-white/10 shadow-lg shrink-0 z-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border border-white/10">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <span className="text-white text-sm">{profile?.name.charAt(0)}</span>}
              </div>
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">{viewingRichProject?.title}</h2>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-zinc-400">By {profile?.name}</p>
                  
                  {(creatorPlan === 'business' || creatorPlan === 'business access') && (
                    <span title="Business Verified"><BadgeCheck className="w-3.5 h-3.5 text-[#0a0a0a] fill-yellow-500" /></span>
                  )}
                  {(creatorPlan === 'pro' || creatorPlan === 'premium pass') && (
                    <span title="Premium Verified"><BadgeCheck className="w-3.5 h-3.5 text-[#0a0a0a] fill-blue-500" /></span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden sm:flex items-center gap-4 mr-4 text-zinc-400">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <PlayCircle className="h-4 w-4" /> {projectViews} Views
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Heart className="h-4 w-4" /> {projectLikesCount} Likes
                </div>
              </div>

              <Button 
                onClick={() => handlePremiumAction("Booking", () => {
                  setViewingRichProject(null);
                  setBookingOpen(true);
                })} 
                className="rounded-full font-bold px-6 bg-primary hover:bg-primary/90 text-primary-foreground border-none hidden sm:flex shadow-md"
              >
                Hire Me
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewingRichProject(null)} className="rounded-full hover:bg-white/10 text-white transition-colors">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-[#050505]">
            <div className="w-full max-w-6xl py-0 sm:py-12 flex flex-col items-center">
              {viewingRichProject?.content_blocks?.map((block: any, idx: number) => (
                <div key={idx} className="w-full flex justify-center mb-12 last:mb-0">
                  {block.type === 'text' && (
                    <div className="prose prose-lg prose-invert max-w-3xl w-full text-zinc-300 whitespace-pre-wrap font-serif px-6 py-4">
                      {block.content}
                    </div>
                  )}
                  {block.type === 'image' && (
                    <div className="w-full flex justify-center px-4">
                      <img 
                        src={block.content} 
                        alt="" 
                        className="max-w-full h-auto max-h-[85vh] object-contain shadow-2xl rounded-md border border-white/5" 
                        onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
                      />
                    </div>
                  )}
                  {block.type === 'video' && (
                    <div className="w-full flex justify-center px-4">
                      <video controls playsInline className="max-w-full w-full sm:w-auto h-auto max-h-[85vh] shadow-2xl rounded-lg bg-black outline-none border border-white/5" controlsList="nodownload">
                         <source src={block.content} />
                      </video>
                    </div>
                  )}
                  {block.type === 'grid' && (
                    <div className="w-full max-w-5xl px-4 mx-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {block.content.map((url: string, i: number) => (
                          <div key={i} className="aspect-square bg-zinc-900 rounded-lg overflow-hidden shadow-lg border border-white/5">
                            <img 
                              src={url} 
                              alt="" 
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" 
                              onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ACTION BAR (Like & Share Project) */}
            <div className="w-full max-w-4xl px-6 py-8 flex items-center justify-between border-t border-white/5 mt-4">
               <Button 
                 variant="ghost" 
                 size="lg" 
                 onClick={handleProjectLike}
                 className={cn("rounded-full font-bold gap-2 transition-all hover:bg-white/5", isProjectLiked ? "text-red-500 hover:text-red-400" : "text-white")}
               >
                 <Heart className={cn("h-6 w-6 transition-transform active:scale-75", isProjectLiked && "fill-current")} /> 
                 {isProjectLiked ? "Liked" : "Like Project"} ({projectLikesCount})
               </Button>
               <Button variant="outline" className="rounded-full bg-transparent text-white border-white/20 hover:bg-white/10 font-bold gap-2">
                 <Share2 className="h-4 w-4" /> Share
               </Button>
            </div>

            {/* COMMENT SECTION */}
            <div className="w-full max-w-4xl px-6 py-12 border-t border-white/10 mb-20 bg-[#0a0a0a]">
              <h3 className="text-white text-xl font-bold mb-8 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Comments ({projectComments.length})
              </h3>
              
              <div className="flex gap-4 mb-12 bg-[#111] p-5 rounded-2xl border border-white/5 shadow-inner">
                <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden border border-white/10">
                  {user?.user_metadata?.avatar_url ? (
                     <img src={user.user_metadata.avatar_url} alt="You" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium text-sm">You</div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <Textarea 
                    placeholder="Share your thoughts on this amazing project..."
                    className="w-full min-h-[100px] bg-[#1a1a1a] border-transparent text-white rounded-xl resize-none focus:ring-1 focus:ring-primary placeholder:text-zinc-600 transition-all p-4 pb-12 shadow-sm"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3">
                    <Button 
                      size="sm" 
                      className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 shadow-lg shadow-primary/20"
                      onClick={handlePostComment}
                      disabled={isPostingComment || !commentText.trim()}
                    >
                      {isPostingComment ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                 {projectComments.length === 0 ? (
                    <div className="text-center py-10 bg-[#111] rounded-2xl border border-white/5">
                      <MessageSquare className="h-8 w-8 mx-auto text-zinc-600 mb-3" />
                      <p className="text-zinc-400 font-medium">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                 ) : (
                   projectComments.map((comment) => (
                     <div key={comment.id} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center text-zinc-400 font-bold text-sm border border-white/5">
                           {comment.profiles?.avatar_url ? (
                             <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             comment.profiles?.name?.charAt(0) || "U"
                           )}
                        </div>
                        <div className="flex-1 bg-[#111] p-4 rounded-2xl rounded-tl-none border border-white/5">
                           <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-white font-bold text-sm">{comment.profiles?.name || "Anonymous User"}</p>
                                <span className="text-zinc-600 text-[10px]">•</span>
                                <p className="text-zinc-500 text-xs font-medium">{new Date(comment.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                           
                           {/* COMMENT LIKE BUTTON */}
                           <div className="mt-4 flex items-center gap-4">
                              <button 
                                onClick={() => handleLikeComment(comment.id)}
                                className={cn(
                                  "flex items-center gap-1.5 text-xs font-bold transition-all duration-200", 
                                  likedComments[comment.id] ? "text-red-500" : "text-zinc-500 hover:text-white"
                                )}
                              >
                                <Heart className={cn("h-4 w-4 transition-transform active:scale-75", likedComments[comment.id] && "fill-current")} /> 
                                {likedComments[comment.id] ? 'Liked' : 'Like'}
                              </button>
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ BOOKMYSHOW STYLE QUOTE / CUSTOM BOOKING ═══════════ */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-border/50 bg-card">
          <div className="bg-muted/30 px-6 py-5 border-b border-border/50">
            <DialogTitle className="font-extrabold text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Book a Slot
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Select your service, date, and preferred time.</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Step 1: Service */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span> Select Service
              </label>
              <select 
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={quoteServiceId}
                onChange={e => setQuoteServiceId(e.target.value)}
              >
                <option value="" disabled>Choose a service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.title} - ₹{s.price}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Date & Time */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span> Date & Time
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input 
                    type="date" 
                    className="h-12 rounded-xl border-input bg-background pl-10" 
                    value={quoteFromDate} 
                    onChange={e => setQuoteFromDate(e.target.value)} 
                  />
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <div className="relative">
                  <Input 
                    type="time" 
                    className="h-12 rounded-xl border-input bg-background pl-10" 
                    value={quoteFromTime} 
                    onChange={e => setQuoteFromTime(e.target.value)} 
                  />
                  <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
            
            {/* Step 3: Details */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span> Notes
              </label>
              <Textarea 
                className="rounded-xl resize-none border-input bg-background p-4 focus:ring-2 focus:ring-primary" 
                placeholder="Any specific requirements or location details for this booking?" 
                value={quoteMessage} 
                onChange={e => setQuoteMessage(e.target.value)} 
                rows={3} 
              />
            </div>
            
            <div className="pt-2 border-t border-border/50">
               {/* --- UPDATED PRICING SUMMARY UI --- */}
               <div className="space-y-2 mb-6">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Service Price</span>
                    <span className="text-sm font-bold">
                      {quoteServiceId ? `₹${services.find(s => s.id === quoteServiceId)?.price}` : "—"}
                    </span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Due After Work (50%)
                    </span>
                    <span className="text-sm font-bold">
                      {quoteServiceId ? `₹${Math.floor(services.find(s => s.id === quoteServiceId)?.price! / 2)}` : "—"}
                    </span>
                 </div>
                 
                 <div className="flex items-center justify-between bg-primary/10 p-3 rounded-xl border border-primary/20 mt-3">
                    <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Advance to Pay Now
                    </span>
                    <span className="text-xl font-black text-primary">
                      {quoteServiceId ? `₹${Math.ceil(services.find(s => s.id === quoteServiceId)?.price! / 2)}` : "—"}
                    </span>
                 </div>
               </div>

              <Button 
                className="w-full h-14 rounded-xl font-bold text-base shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]" 
                onClick={handleRequestQuote} 
                disabled={submitting || !quoteServiceId || !quoteFromDate}
              >
                {submitting ? "Processing Payment..." : (
                   <>Pay Advance & Confirm Booking <ArrowRight className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ DIRECT BOOKING (From services tab) ═══════════ */}
      {user && id && (
        <BookingDialog
          open={bookingOpen} onOpenChange={setBookingOpen}
          creatorId={id} creatorName={profile.name}
          services={services} preselectedService={preselectedService}
          userId={user.id}
        />
      )}

      <div className="pb-20 md:pb-0"><Footer /></div>
    </div>
  );
}
