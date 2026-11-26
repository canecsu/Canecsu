import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Eye,
  Calendar,
  Star,
  TrendingUp,
  Plus,
  Edit,
  Package,
  Clock,
  Users,
  Image,
  Trash2,
  Save,
  Upload,
  DollarSign,
  Zap,
  CheckCircle,
  Layers,
  GripVertical,
  Crown,
  BadgeCheck,
  MapPin,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ScheduleManager } from "@/components/booking/ScheduleManager";
import { BookingsList } from "@/components/booking/BookingsList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkContentViolations, moderationDescription } from "@/lib/contentModeration";
import { CATEGORY_LABELS } from "@/types/creator";
import type { Database } from "@/integrations/supabase/types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => new Promise<boolean>((resolve) => {
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

const getVerificationExpiryReminder = (expiresAt: string) => {
  const hoursLeft = (new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursLeft <= 0 || hoursLeft > 5 * 24) return null;
  if (hoursLeft <= 1) {
    return {
      key: "one_hour",
      message: "Your Canecsu Creator Verification badge expires in about 1 hour. Renew now to keep your ranking benefit.",
    };
  }
  const daysLeft = Math.ceil(hoursLeft / 24);
  if (daysLeft <= 1) {
    return {
      key: "today",
      message: "Your Canecsu Creator Verification badge expires today. Renew now to keep your ranking benefit.",
    };
  }
  return {
    key: `${daysLeft}_days`,
    message: `Your Canecsu Creator Verification badge expires in ${daysLeft} days. Renew now to keep your ranking benefit.`,
  };
};

type CreatorProfile = Database["public"]["Tables"]["creator_profiles"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type PortfolioItem = Database["public"]["Tables"]["portfolio_items"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

const statusColors: Record<string, string> = {
  pending: "outline",
  accepted: "default",
  confirmed: "default",
  in_progress: "secondary",
  completed: "secondary",
  cancelled: "destructive",
};

const CreatorDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [verificationBadge, setVerificationBadge] = useState<any | null>(null);
  const [badgePaymentLoading, setBadgePaymentLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  // Profile form
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Service form
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePriceType, setServicePriceType] = useState<"fixed" | "hourly" | "package">("fixed");
  const [serviceDeliverables, setServiceDeliverables] = useState("");
  const [serviceAddOns, setServiceAddOns] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
    if (user) fetchAll();
  }, [user, loading]);

  const enableBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      toast.info("This browser does not support phone notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      toast.success("Phone alerts enabled for badge expiry reminders");
    } else {
      toast.info("Allow notifications in browser settings to receive phone alerts.");
    }
  };

  const ensureBadgeExpiryReminder = async (badge: any) => {
    if (!user || !badge?.expires_at) return;
    const reminder = getVerificationExpiryReminder(badge.expires_at);
    if (!reminder) return;

    const { data: existingReminder } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "verification_expiry")
      .eq("message", reminder.message)
      .limit(1)
      .maybeSingle();

    if (!existingReminder) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Verification badge expiring",
        message: reminder.message,
        type: "verification_expiry",
        link: "/dashboard",
      });
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Canecsu badge reminder", { body: reminder.message });
      }
    }
  };

  const fetchAll = async () => {
    if (!user) return;

    const [pRes, cpRes, svcRes, portRes, projRes, bookRes, revRes, badgeRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("creator_profiles").select("*").eq("profile_id", user.id).single(),
      supabase.from("services").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
      supabase.from("portfolio_items").select("*").eq("creator_id", user.id).order("sort_order"),
      supabase.from("projects" as any).select("*").eq("creator_id", user.id).order("created_at", { ascending: false }) as any,
      supabase
        .from("bookings")
        .select("*, profiles!bookings_client_id_fkey(name, avatar_url)")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
      (supabase.from("creator_verification_subscriptions" as any) as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (cpRes.data) {
      setCreatorProfile(cpRes.data);
      setInstagram(cpRes.data.instagram || "");
      setYoutube(cpRes.data.youtube || "");
      setSpecializations(cpRes.data.specializations?.join(", ") || "");
      setExperienceYears(cpRes.data.experience_years || 0);
      setPriceMin(cpRes.data.price_min || 0);
      setPriceMax(cpRes.data.price_max || 0);
    }

    if (pRes.data) {
      setBio(pRes.data.bio || "");
      setCity(pRes.data.city || "");
      setState(pRes.data.state || "");
      setLat((pRes.data as any).lat || null);
      setLng((pRes.data as any).lng || null);
      setPhone(pRes.data.phone || "");
      setWebsite(pRes.data.website || "");
      setAvatarUrl(pRes.data.avatar_url);
      setCoverUrl(pRes.data.cover_url);
    }

    setServices(svcRes.data || []);
    setPortfolio(portRes.data || []);
    setProjects(projRes.data || []);
    setBookings(bookRes.data || []);
    setReviews(revRes.data || []);
    setVerificationBadge(badgeRes.data || null);
    if (badgeRes.data) void ensureBadgeExpiryReminder(badgeRes.data);
  };

  const handleBuyVerificationBadge = async () => {
    if (!user) return;
    setBadgePaymentLoading(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Razorpay checkout could not be loaded.");

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        { body: { amount: 99, planName: "Creator Verification", userId: user.id } },
      );

      if (orderError || !orderData?.orderId || !orderData?.keyId) {
        throw new Error(orderError?.message || "Could not create the verification order.");
      }

      const payment = new window.Razorpay({
        key: orderData.keyId,
        amount: 9900,
        currency: "INR",
        name: "Canecsu",
        description: "Creator Verification Badge - 30 days",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
            "verify-razorpay-payment",
            {
              body: {
                ...response,
                planName: "Creator Verification",
                amount: 99,
                userId: user.id,
              },
            },
          );

          if (verificationError || !verificationData?.success) {
            toast.error("Payment received but badge activation needs support", {
              description: verificationError?.message || verificationData?.error || "Please contact Canecsu support.",
            });
          } else {
            toast.success("Creator Verification badge activated", {
              description: "Your badge is active for 30 days and contributes 5 ranking points.",
            });
            await fetchAll();
          }
          setBadgePaymentLoading(false);
        },
        modal: {
          ondismiss: () => {
            setBadgePaymentLoading(false);
            toast.info("Verification payment cancelled");
          },
        },
        prefill: { name: profile?.name || "", email: user.email || "" },
        theme: { color: "#d49b17" },
      });

      payment.open();
    } catch (error: any) {
      setBadgePaymentLoading(false);
      toast.error("Verification payment could not be started", {
        description: error?.message || "Please try again.",
      });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);
    toast.info("Fetching your precise location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        
        setLat(currentLat);
        setLng(currentLng);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLng}`);
          const data = await res.json();
          
          if (data && data.address) {
            const fetchedCity = data.address.city || data.address.town || data.address.county || data.address.state_district || "";
            const fetchedState = data.address.state || "";
            
            if (fetchedCity) setCity(fetchedCity);
            if (fetchedState) setState(fetchedState);
            
            toast.success("Location updated successfully!");
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          toast.success("GPS coordinates saved, but couldn't fetch city name.");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get location. Please allow location permissions in your browser.");
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const maxServices = Infinity;
  const maxProjects = Infinity;
  const totalProjectsCount = projects.length + portfolio.length;

  const saveProfile = async () => {
    if (!user) return;

    // 🛡️ SECURITY: Run content checks to ensure no numbers/emails are in the public bio or specializations
    const bioViolation = checkContentViolations(bio, "bio");
    if (bioViolation) {
      toast.error("Profile Update Blocked", {
        description: moderationDescription(bioViolation, "bio")
      });
      return;
    }

    const specViolation = checkContentViolations(specializations, "specializations");
    if (specViolation) {
      toast.error("Profile Update Blocked", {
        description: moderationDescription(specViolation, "specializations")
      });
      return;
    }

    let updatedLat = lat;
    let updatedLng = lng;

    if ((city || state) && (lat === null || lng === null)) {
      try {
        const searchQuery = `${city ? city + ',' : ''} ${state ? state + ',' : ''} India`;
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          updatedLat = parseFloat(data[0].lat);
          updatedLng = parseFloat(data[0].lon);
          setLat(updatedLat);
          setLng(updatedLng);
        } else {
          toast.warning("Could not find exact map coordinates for this location.");
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    }

    const { error: pErr } = await supabase.from("profiles").update({
      bio,
      city,
      state,
      phone, // Phone is allowed to be saved here because it's never displayed publicly
      website,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      lat: updatedLat, 
      lng: updatedLng, 
    }).eq("id", user.id);

    const { error: cpErr } = await supabase.from("creator_profiles").update({
      instagram,
      youtube,
      specializations: specializations.split(",").map(s => s.trim()).filter(Boolean),
      experience_years: experienceYears,
      price_min: priceMin,
      price_max: priceMax,
    }).eq("profile_id", user.id);

    if (pErr || cpErr) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated!");
      setEditingProfile(false);
      fetchAll();
    }
  };

  const handlePortfolioUpload = async (url: string) => {
    if (!user) return;

    const { error } = await supabase.from("portfolio_items").insert({
      creator_id: user.id,
      url,
      type: "image",
      sort_order: portfolio.length,
    });

    if (error) {
      toast.error("Failed to add portfolio item");
    } else {
      toast.success("Portfolio image added!");
      fetchAll();
    }
  };

  const deletePortfolioItem = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (!error) {
      toast.success("Removed");
      fetchAll();
    }
  };

  const deleteProject = async (id: string) => {
    const project = projects.find((item) => item.id === id);
    const projectName = project?.title || "this project";
    const confirmed = window.confirm(
      "Delete \"" + projectName + "\"? This action cannot be undone.",
    );
    if (!confirmed) return;

    const { error } = await (supabase.from("projects" as any).delete().eq("id", id) as any);
    if (error) {
      toast.error("Failed to delete project");
      return;
    }

    toast.success("Project deleted");
    fetchAll();
  };

  const addService = async () => {
    if (!user || !serviceTitle) return;

    // 🛡️ SECURITY: Run content checks to ensure no numbers/emails are in the public services
    const combinedServiceText = `${serviceTitle} ${serviceDesc} ${serviceDeliverables} ${serviceAddOns}`;
    const svcViolation = checkContentViolations(combinedServiceText, "service");
    
    if (svcViolation) {
      toast.error("Service Creation Blocked", {
        description: moderationDescription(svcViolation, "service")
      });
      return;
    }

    const deliverables = serviceDeliverables.split("\n").map(d => d.trim()).filter(Boolean);
    const addOnsArr = serviceAddOns
      .split("\n")
      .map(line => {
        const parts = line.split("|").map(p => p.trim());
        return parts.length >= 2 ? { name: parts[0], price: parseInt(parts[1]) || 0 } : null;
      })
      .filter(Boolean);

    const { error } = await supabase.from("services").insert({
      creator_id: user.id,
      title: serviceTitle,
      description: serviceDesc,
      price: servicePrice,
      duration: serviceDuration,
      price_type: servicePriceType,
      deliverables,
      add_ons: addOnsArr,
    });

    if (error) {
      toast.error("Failed to add service");
    } else {
      toast.success("Service added!");
      setAddingService(false);
      setServiceTitle("");
      setServiceDesc("");
      setServicePrice(0);
      setServiceDuration("");
      setServiceDeliverables("");
      setServiceAddOns("");
      fetchAll();
    }
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      toast.success("Service deleted");
      fetchAll();
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", bookingId);
    if (error) {
      toast.error("Failed to update");
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      await supabase.from("notifications").insert({
        user_id: booking.client_id,
        title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your booking has been ${status} by ${profile?.name || "the creator"}`,
        type: "booking",
        link: "/client",
      });
    }

    toast.success(`Booking ${status}`);
    fetchAll();
  };

  const getProjectThumbnail = (project: any) => {
    if (project.cover_image_url) return project.cover_image_url;
    const firstImg = project.content_blocks?.find((b: any) => b.type === "image");
    return firstImg ? firstImg.content : "https://placehold.co/600x400/e2e8f0/94a3b8?text=Project";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  const confirmedBookings = bookings.filter(
    b => b.status === "confirmed" || b.status === "completed"
  ).length;

  const totalEarnings = bookings
    .filter(b => b.status === "completed")
    .reduce((s: number, b: any) => s + (b.total_price || 0), 0);

  const pendingBookings = bookings.filter(b => b.status === "pending");

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <Header />
      <main className="flex-1">
        <div className="container py-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            <div className="relative mb-10 rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-sm">
              <div className="h-48 md:h-64 w-full bg-muted relative">
                {profile?.cover_url ? (
                  <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              <div className="px-6 sm:px-10 pb-8 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end sm:justify-between gap-6 -mt-16 sm:-mt-12">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 z-10">
                  <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-bold text-blue-600">
                        {profile?.name?.charAt(0) || "C"}
                      </span>
                    )}
                  </div>
                  <div className="text-center sm:text-left mb-2">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        Welcome back, {profile?.name || "Creator"}
                      </h1>
                      {profile?.is_verified && <span title="Verified Creator"><BadgeCheck className="w-7 h-7 text-white fill-blue-500 shrink-0" /></span>}
                    </div>
                    <p className="text-gray-500 mt-1 font-medium text-sm">
                      Manage your portfolio, bookings, and services
                    </p>
                  </div>
                </div>

                <div className="z-10 sm:mb-2">
                  <Button
                    className="rounded-full font-bold shadow-md bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 h-11 px-6"
                    onClick={() => navigate(`/creator/${user?.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> View Public Profile
                  </Button>
                </div>
              </div>
            </div>

            {pendingBookings.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">
                      You have {pendingBookings.length} pending booking{pendingBookings.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-amber-700 font-medium">Review and respond to new requests</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                  View
                </Button>
              </div>
            )}

            <Card className={`mb-6 rounded-2xl border-2 ${verificationBadge ? "border-amber-300 bg-amber-50/60" : "border-blue-100 bg-white"}`}>
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${verificationBadge ? "bg-amber-100" : "bg-blue-50"}`}>
                    <BadgeCheck className={`h-7 w-7 ${verificationBadge ? "text-amber-600" : "text-blue-600"}`} />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-gray-900">
                      {verificationBadge ? "Creator Verification Badge is active" : "Get the Creator Verification Badge"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {verificationBadge
                        ? `Active until ${new Date(verificationBadge.expires_at).toLocaleDateString("en-IN")}. It contributes 5 of 100 ranking points.`
                        : "₹99 for 30 days. This is a paid platform badge, not an identity or government verification."}
                    </p>
                    {verificationBadge && (() => {
                      const reminder = getVerificationExpiryReminder(verificationBadge.expires_at);
                      return reminder ? (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-red-600">
                          <Clock className="h-4 w-4" /> {reminder.message.replace("Your Canecsu ", "").replace(" Renew now to keep your ranking benefit.", "")}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {notificationPermission !== "granted" && notificationPermission !== "unsupported" && (
                    <Button type="button" variant="outline" size="sm" onClick={enableBrowserNotifications} className="rounded-full border-red-200 text-red-600 hover:bg-red-50">
                      Enable phone alerts
                    </Button>
                  )}
                  <Button
                    onClick={handleBuyVerificationBadge}
                    disabled={badgePaymentLoading}
                    className="rounded-full bg-amber-500 text-white hover:bg-amber-600 font-bold"
                  >
                  {badgePaymentLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crown className="h-4 w-4 mr-2" />}
                  {verificationBadge ? "Renew for ₹99" : "Activate for ₹99"}
                </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: "Total Bookings", value: bookings.length, icon: Calendar, color: "text-blue-500" },
                { label: "Confirmed", value: confirmedBookings, icon: CheckCircle, color: "text-green-500" },
                { label: "Pending", value: pendingBookings.length, icon: Clock, color: "text-amber-500" },
                { label: "Reviews", value: reviews.length, icon: Star, color: "text-yellow-500" },
                { label: "Avg Rating", value: avgRating, icon: TrendingUp, color: "text-purple-500" },
                { label: "Earnings", value: `₹${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" },
              ].map(stat => (
                <Card key={stat.label} className="border-gray-200 shadow-sm rounded-2xl">
                  <CardContent className="p-5">
                    <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
                    <p className="font-heading text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="portfolio" className="space-y-6">
              <TabsList className="bg-white shadow-sm border border-gray-200 w-full justify-start rounded-2xl p-2 h-auto flex-wrap">
                <TabsTrigger value="portfolio" className="rounded-xl font-bold">
                  Projects ({totalProjectsCount})
                </TabsTrigger>
                <TabsTrigger value="bookings" className="rounded-xl font-bold">
                  Bookings ({bookings.length})
                </TabsTrigger>
                <TabsTrigger value="schedule" className="rounded-xl font-bold">
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-xl font-bold">
                  Services
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-xl font-bold">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl font-bold">
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-900">Your Projects</CardTitle>
                    <p className="text-sm text-gray-500 font-medium">
                      {totalProjectsCount} of {maxProjects === Infinity ? "Unlimited" : maxProjects} used
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-8">
                      <div
                          onClick={() => navigate("/portfolio/editor")}
                          className="w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center justify-center text-center py-16 px-4 group"
                        >
                          <div className="w-16 h-16 bg-white border border-gray-200 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 rounded-full flex items-center justify-center mb-4 transition-colors">
                            <Plus className="text-gray-400 group-hover:text-blue-600 transition-colors" size={28} strokeWidth={2.5} />
                          </div>
                          <h3 className="font-extrabold text-gray-900 text-[18px] mb-2">Create a New Project</h3>
                          <p className="text-gray-500 text-[14px] max-w-[500px]">
                            Build rich, interactive case studies with images, videos, and text grids using the advanced editor.
                          </p>
                        </div>

                      {projects.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers size={16} /> Your Projects
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(proj => (
                              <div key={proj.id} className="group rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                                  <img
                                    src={getProjectThumbnail(proj)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={proj.title || "Project"}
                                  />
                                  <div className="absolute top-3 left-3">
                                    <Badge variant={proj.published ? "default" : "secondary"}>
                                      {proj.published ? "Published" : "Draft"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-4 border-t border-gray-100">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{proj.title}</h4>
                                      <p className="text-xs font-medium text-gray-400 mt-1">
                                        {new Date(proj.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title={proj.published ? "View project" : "Preview draft"}
                                        onClick={() =>
                                          proj.published
                                            ? navigate("/creator/" + user?.id + "?project=" + proj.id)
                                            : navigate("/portfolio/editor?projectId=" + proj.id)
                                        }
                                        className="hover:bg-blue-50 hover:text-blue-600 rounded-full"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Edit project"
                                        onClick={() => navigate("/portfolio/editor?projectId=" + proj.id)}
                                        className="hover:bg-amber-50 hover:text-amber-600 rounded-full"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Delete project"
                                        onClick={() => deleteProject(proj.id)}
                                        className="hover:bg-red-50 hover:text-red-500 rounded-full"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {portfolio.length > 0 && (
                        <div className="border-t border-gray-100 pt-8 mt-4">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                              Legacy Images
                            </h3>
                            <ImageUpload
                              currentUrl={null}
                              userId={user?.id || ""}
                              folder="portfolio"
                              onUpload={handlePortfolioUpload}
                              variant="portfolio"
                            />
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {portfolio.map(item => (
                              <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100 group border border-gray-200">
                                <img src={item.url} alt={item.title || ""} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => deletePortfolioItem(item.id)}
                                  className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">Booking Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user && <BookingsList userId={user.id} role="creator" />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule">
                {user && <ScheduleManager creatorId={user.id} />}
              </TabsContent>

              <TabsContent value="services">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">Your Services</CardTitle>
                      <p className="text-sm text-gray-500 mt-1 font-medium">
                        {services.length} of {maxServices === Infinity ? "Unlimited" : maxServices} used
                      </p>
                    </div>

                    <Dialog open={addingService} onOpenChange={setAddingService}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="rounded-full font-bold">
                            <Plus className="h-4 w-4 mr-2" />Add Service
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="font-extrabold text-xl">Add New Service Package</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 mt-4">
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Title
                              </label>
                              <Input
                                className="h-11 rounded-xl"
                                value={serviceTitle}
                                onChange={e => setServiceTitle(e.target.value)}
                                placeholder="e.g. Wedding Photography Package"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Description
                              </label>
                              <Textarea
                                className="rounded-xl"
                                value={serviceDesc}
                                onChange={e => setServiceDesc(e.target.value)}
                                placeholder="What's included..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                  Price (₹)
                                </label>
                                <Input
                                  className="h-11 rounded-xl"
                                  type="number"
                                  value={servicePrice}
                                  onChange={e => setServicePrice(Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                  Duration
                                </label>
                                <Input
                                  className="h-11 rounded-xl"
                                  value={serviceDuration}
                                  onChange={e => setServiceDuration(e.target.value)}
                                  placeholder="e.g. 4 hours"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Price Type
                              </label>
                              <Select value={servicePriceType} onValueChange={(v) => setServicePriceType(v as any)}>
                                <SelectTrigger className="h-11 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed Price</SelectItem>
                                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                                  <SelectItem value="package">Package</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Deliverables (one per line)
                              </label>
                              <Textarea
                                className="rounded-xl"
                                value={serviceDeliverables}
                                onChange={e => setServiceDeliverables(e.target.value)}
                                placeholder={"50 edited photos\n2 minute video\nOnline gallery"}
                                rows={3}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                                Add-ons (name|price per line)
                              </label>
                              <Textarea
                                className="rounded-xl"
                                value={serviceAddOns}
                                onChange={e => setServiceAddOns(e.target.value)}
                                placeholder={"Extra hour|5000\nDrone shots|3000"}
                                rows={3}
                              />
                            </div>
                            <Button
                              className="w-full h-11 rounded-xl font-bold text-base mt-2"
                              onClick={addService}
                            >
                              Add Service
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {services.length === 0 ? (
                      <p className="text-gray-400 font-medium text-center py-12">
                        No services added yet. Add your first service package!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {services.map(svc => (
                          <div
                            key={svc.id}
                            className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-200 shadow-sm"
                          >
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <p className="font-bold text-gray-900 text-base">{svc.title}</p>
                                <Badge variant="secondary" className="font-bold">
                                  {svc.price_type}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-gray-500">{svc.description}</p>
                              {svc.duration && (
                                <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-2 uppercase tracking-widest">
                                  <Clock className="h-3 w-3" />
                                  {svc.duration}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-heading font-black text-blue-600 text-xl">
                                ₹{svc.price.toLocaleString()}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-red-50 rounded-full"
                                onClick={() => deleteService(svc.id)}
                              >
                                <Trash2 className="h-5 w-5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Profile Information</CardTitle>
                    <Button
                      variant={editingProfile ? "default" : "outline"}
                      size="sm"
                      className="rounded-full font-bold"
                      onClick={() => editingProfile ? saveProfile() : setEditingProfile(true)}
                    >
                      {editingProfile ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
                          Cover Photo
                        </label>
                        <ImageUpload
                          currentUrl={coverUrl}
                          userId={user?.id || ""}
                          folder="covers"
                          onUpload={(url) => setCoverUrl(url)}
                          variant="cover"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
                          Profile Photo
                        </label>
                        <ImageUpload
                          currentUrl={avatarUrl}
                          userId={user?.id || ""}
                          folder="avatars"
                          onUpload={(url) => setAvatarUrl(url)}
                          variant="avatar"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                          Bio
                        </label>
                        <Textarea
                          className="rounded-xl min-h-[140px]"
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          disabled={!editingProfile}
                        />
                      </div>
                      <div className="space-y-4">
                        
                        {editingProfile && (
                          <div className="mb-2">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={handleGetLocation}
                              disabled={isFetchingLocation}
                              className="w-full rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              {isFetchingLocation ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Locating...</>
                              ) : (
                                <><MapPin className="h-4 w-4 mr-2" /> Use Current GPS Location</>
                              )}
                            </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                              City
                            </label>
                            <Input
                              className="h-11 rounded-xl"
                              value={city}
                              onChange={e => {
                                setCity(e.target.value);
                                setLat(null); 
                                setLng(null);
                              }}
                              disabled={!editingProfile}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                              State
                            </label>
                            <Input
                              className="h-11 rounded-xl"
                              value={state}
                              onChange={e => {
                                setState(e.target.value);
                                setLat(null); 
                                setLng(null);
                              }}
                              disabled={!editingProfile}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Phone
                          </label>
                          <Input
                            className="h-11 rounded-xl"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            disabled={!editingProfile}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Website
                          </label>
                          <Input
                            className="h-11 rounded-xl"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            disabled={!editingProfile}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-extrabold text-gray-900 mb-6">Professional Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Category
                          </label>
                          <Input
                            className="h-11 rounded-xl bg-gray-50"
                            value={
                              creatorProfile
                                ? CATEGORY_LABELS[creatorProfile.category as keyof typeof CATEGORY_LABELS] || creatorProfile.category
                                : ""
                            }
                            disabled
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Experience (years)
                          </label>
                          <Input
                            className="h-11 rounded-xl"
                            type="number"
                            value={experienceYears}
                            onChange={e => setExperienceYears(Number(e.target.value))}
                            disabled={!editingProfile}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Specializations (comma sep.)
                          </label>
                          <Input
                            className="h-11 rounded-xl"
                            value={specializations}
                            onChange={e => setSpecializations(e.target.value)}
                            disabled={!editingProfile}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Instagram Handle
                          </label>
                          <Input
                            className="h-11 rounded-xl"
                            value={instagram}
                            onChange={e => setInstagram(e.target.value)}
                            disabled={!editingProfile}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            YouTube Channel
                          </label>
                          <Input
                            className="h-11 rounded-xl"
                            value={youtube}
                            onChange={e => setYoutube(e.target.value)}
                            disabled={!editingProfile}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                              Min Price (₹)
                            </label>
                            <Input
                              className="h-11 rounded-xl"
                              type="number"
                              value={priceMin}
                              onChange={e => setPriceMin(Number(e.target.value))}
                              disabled={!editingProfile}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                              Max Price (₹)
                            </label>
                            <Input
                              className="h-11 rounded-xl"
                              type="number"
                              value={priceMax}
                              onChange={e => setPriceMax(Number(e.target.value))}
                              disabled={!editingProfile}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="border-gray-200 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Client Reviews ({reviews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length === 0 ? (
                      <p className="text-gray-400 font-medium text-center py-12">No reviews yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <div key={review.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                                  {review.client_avatar ? (
                                    <img src={review.client_avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-bold text-gray-500">
                                      {review.client_name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{review.client_name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-yellow-500">
                                {Array.from({ length: review.rating }, (_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl">
                              {review.review_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreatorDashboard;
