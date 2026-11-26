import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, MapPin, Save, Edit, Camera, Briefcase, Plus, Trash2, Search, Zap, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ARTIST_SUBCATEGORIES } from "@/types/creator";
import { DeleteAccountSection } from "@/components/privacy/DeleteAccountSection";
import { checkContentViolations, moderationDescription } from "@/lib/contentModeration";

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

const PROFILE_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const getProfileDraftKey = (userId: string) => `canecsu_profile_draft_${userId}`;

const normalizeProfilePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
};

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"creator" | "client">("client");
  const [category, setCategory] = useState<string>("photographer");
  const [subcategory, setSubcategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const profileHydratedFor = useRef<string | null>(null);
  const draftRestoredFor = useRef<string | null>(null);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [areaQuery, setAreaQuery] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [areaRadius, setAreaRadius] = useState("25");
  const [areaSaving, setAreaSaving] = useState(false);
  const [liveNow, setLiveNow] = useState(false);
  const [liveLocationLoading, setLiveLocationLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      profileHydratedFor.current = null;
      draftRestoredFor.current = null;
      if (!loading) navigate("/login");
      return;
    }

    if (!profile || profileHydratedFor.current === user.id) return;

    const draftKey = getProfileDraftKey(user.id);
    let draft: any = null;

    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (
          parsed?.updatedAt &&
          Date.now() - parsed.updatedAt <= PROFILE_DRAFT_TTL_MS
        ) {
          draft = parsed;
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    }

    if (draft) {
      setName(draft.name ?? profile.name ?? "");
      setBio(draft.bio ?? profile.bio ?? "");
      setCity(draft.city ?? profile.city ?? "");
      setState(draft.state ?? profile.state ?? "");
      setCountry(draft.country ?? profile.country ?? "India");
      setPhone(draft.phone ?? profile.phone ?? "");
      setWebsite(draft.website ?? profile.website ?? "");
      setAvatarUrl(draft.avatarUrl ?? profile.avatar_url);
      setCoverUrl(draft.coverUrl ?? profile.cover_url);
      setAccountType(draft.accountType ?? profile.type ?? "client");
      setCategory(draft.category ?? "photographer");
      setSubcategory(draft.subcategory ?? "");
      draftRestoredFor.current = user.id;
      setEditing(true);
    } else {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setCity(profile.city || "");
      setState(profile.state || "");
      setCountry(profile.country || "India");
      setPhone(profile.phone || "");
      setWebsite(profile.website || "");
      setAvatarUrl(profile.avatar_url);
      setCoverUrl(profile.cover_url);
      setAccountType(profile.type || "client");
      draftRestoredFor.current = null;
    }

    profileHydratedFor.current = user.id;
  }, [user, profile, loading, navigate]);

  // Fetch creator category if creator, unless a local draft already restored it.
  useEffect(() => {
    if (user && profile?.type === "creator") {
      supabase.from("creator_profiles").select("category, subcategory").eq("profile_id", user.id).maybeSingle().then(({ data }: any) => {
        if (draftRestoredFor.current === user.id) return;
        if (data?.category) setCategory(data.category);
        if (data?.subcategory) setSubcategory(data.subcategory);
      });
    }
  }, [user, profile?.type]);

  // Load creator service areas and consented live status.
  useEffect(() => {
    if (!user || profile?.type !== "creator") {
      setServiceAreas([]);
      setLiveNow(false);
      return;
    }

    let cancelled = false;
    const loadCreatorLocationSettings = async () => {
      const [areasResult, liveResult] = await Promise.all([
        (supabase.from("creator_service_areas" as any) as any)
          .select("*")
          .eq("creator_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        (supabase.from("creator_live_locations" as any) as any)
          .select("creator_id, expires_at, is_active")
          .eq("creator_id", user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (!areasResult.error) setServiceAreas(areasResult.data || []);
      const live = liveResult.data;
      setLiveNow(Boolean(live?.is_active && live?.expires_at && new Date(live.expires_at).getTime() > Date.now()));
    };

    loadCreatorLocationSettings();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.type]);

  // Search Indian cities/locations without requiring a Google Maps API key.
  useEffect(() => {
    const query = areaQuery.trim();
    if (query.length < 3 || selectedArea?.label === query) {
      setAreaSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(query)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        if (!response.ok) return;
        const results = await response.json();
        setAreaSuggestions(Array.isArray(results) ? results : []);
      } catch (error: any) {
        if (error?.name !== "AbortError") console.warn("Location search failed", error);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [areaQuery, selectedArea]);

  const selectServiceAreaSuggestion = (suggestion: any) => {
    const address = suggestion.address || {};
    const cityName = address.city || address.town || address.village || address.municipality || address.county || "";
    setSelectedArea({
      label: suggestion.display_name,
      city: cityName,
      state: address.state || "",
      latitude: Number(suggestion.lat),
      longitude: Number(suggestion.lon),
    });
    setAreaQuery(suggestion.display_name);
    setAreaSuggestions([]);
  };

  const addServiceArea = async () => {
    if (!user || !selectedArea) {
      toast.error("Select a city or location first", {
        description: "Search and choose a location from the suggestions.",
      });
      return;
    }

    setAreaSaving(true);
    const { data, error } = await (supabase.from("creator_service_areas" as any) as any)
      .insert({
        creator_id: user.id,
        label: selectedArea.label,
        area_type: "radius",
        city: selectedArea.city || null,
        state: selectedArea.state || null,
        latitude: selectedArea.latitude,
        longitude: selectedArea.longitude,
        radius_km: Number(areaRadius),
      })
      .select("*")
      .single();

    if (error) {
      toast.error("Service area could not be added", { description: error.message });
    } else {
      setServiceAreas((current) => [...current, data]);
      setAreaQuery("");
      setSelectedArea(null);
      toast.success("Service area added");
    }
    setAreaSaving(false);
  };

  const removeServiceArea = async (areaId: string) => {
    if (!user) return;
    const { error } = await (supabase.from("creator_service_areas" as any) as any)
      .delete()
      .eq("id", areaId)
      .eq("creator_id", user.id);

    if (error) {
      toast.error("Service area could not be removed", { description: error.message });
      return;
    }
    setServiceAreas((current) => current.filter((area) => area.id !== areaId));
    if (liveNow && serviceAreas.length <= 1) {
      await toggleLiveLocation(false);
    }
  };

  const toggleLiveLocation = async (enabled: boolean) => {
    if (!user) return;

    if (!enabled) {
      setLiveLocationLoading(true);
      const [{ error: locationError }, { error: profileError }] = await Promise.all([
        (supabase.from("creator_live_locations" as any) as any)
          .delete()
          .eq("creator_id", user.id),
        (supabase.from("creator_profiles") as any)
          .update({ is_available_now: false, available_until: null })
          .eq("profile_id", user.id),
      ]);
      setLiveLocationLoading(false);

      if (locationError || profileError) {
        toast.error("Live Now could not be turned off");
        return;
      }
      setLiveNow(false);
      toast.success("Live Now turned off");
      return;
    }

    if (serviceAreas.length === 0) {
      toast.error("Add a service area first", {
        description: "Clients can only find you where you choose to provide service.",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location access is not available in this browser");
      return;
    }

    setLiveLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { error: locationError } = await (supabase.from("creator_live_locations" as any) as any)
        .upsert({
          creator_id: user.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy_m: coords.accuracy,
          is_active: true,
          consented_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          expires_at: expiresAt,
        }, { onConflict: "creator_id" });

      if (!locationError) {
        const { error: profileError } = await (supabase.from("creator_profiles") as any)
          .update({ is_available_now: true, available_until: expiresAt })
          .eq("profile_id", user.id);

        if (profileError) {
          toast.error("Live status could not be updated", { description: profileError.message });
        } else {
          setLiveNow(true);
          toast.success("You are Live Now", {
            description: "Your location is shared with matching clients for 2 hours.",
          });
        }
      } else {
        toast.error("Live location could not be enabled", { description: locationError.message });
      }
      setLiveLocationLoading(false);
    }, (error) => {
      setLiveLocationLoading(false);
      toast.error("Location permission is required", {
        description: error.message || "Allow location access to turn on Live Now.",
      });
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };

  // Keep an editable profile draft on this device so tab switches/reloads do not erase work.
  useEffect(() => {
    if (!user || profileHydratedFor.current !== user.id || !editing) return;

    localStorage.setItem(getProfileDraftKey(user.id), JSON.stringify({
      updatedAt: Date.now(),
      name,
      bio,
      city,
      state,
      country,
      phone,
      website,
      avatarUrl,
      coverUrl,
      accountType,
      category,
      subcategory,
    }));
  }, [
    user,
    editing,
    name,
    bio,
    city,
    state,
    country,
    phone,
    website,
    avatarUrl,
    coverUrl,
    accountType,
    category,
    subcategory,
  ]);

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url);
    if (user) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    }
  };

  const handleCoverUpload = async (url: string) => {
    setCoverUrl(url);
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ cover_url: url })
        .eq("id", user.id);

      if (error) {
        toast.error("Banner image could not be saved");
      }
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const bioViolation = checkContentViolations(bio, "bio");
    if (bioViolation) {
      toast.error("Profile Update Blocked", {
        description: moderationDescription(bioViolation, "bio"),
      });
      setSaving(false);
      return;
    }

    const nameViolation = checkContentViolations(name, "name");
    if (nameViolation) {
      toast.error("Profile Update Blocked", {
        description: moderationDescription(nameViolation, "name"),
      });
      setSaving(false);
      return;
    }

    const normalizedPhone = normalizeProfilePhone(phone);
    if (phone.trim() && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Invalid mobile number", {
        description: "Please enter a valid 10-digit mobile number.",
      });
      setSaving(false);
      return;
    }

    if (normalizedPhone) {
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", normalizedPhone)
        .neq("id", user.id)
        .maybeSingle();

      if (phoneCheckError) {
        toast.error("Could not verify mobile number. Please try again.");
        setSaving(false);
        return;
      }

      if (existingPhone) {
        toast.error("Mobile number already registered", {
          description: "Please use another mobile number.",
        });
        setSaving(false);
        return;
      }
    }

    // Update profile
    const { error } = await supabase.from("profiles").update({
      name, bio, city, state, country, phone: normalizedPhone, website,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      type: accountType,
    }).eq("id", user.id);

    if (error) {
      toast.error("Failed to save profile");
      setSaving(false);
      return;
    }

    // Handle creator_profile
    if (accountType === "creator") {
      const { data: existingCp } = await supabase.from("creator_profiles").select("id").eq("profile_id", user.id).maybeSingle();
      if (existingCp) {
        await supabase.from("creator_profiles").update({ category: category as any, subcategory: category === "artist" ? subcategory : null } as any).eq("profile_id", user.id);
      } else {
        await supabase.from("creator_profiles").insert({ profile_id: user.id, category: category as any, subcategory: category === "artist" ? subcategory : null } as any);
      }
    }

    setSaving(false);
    localStorage.removeItem(getProfileDraftKey(user.id));
    toast.success("Profile updated!");
    setEditing(false);
    // Reload to refresh auth context
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-heading text-3xl font-bold">My Profile</h1>
              <Button variant={editing ? "default" : "outline"} onClick={() => editing ? saveProfile() : setEditing(true)} disabled={saving}>
                {editing ? <><Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save"}</> : <><Edit className="h-4 w-4 mr-2" />Edit</>}
              </Button>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Banner / Cover Image</h3>
                    <span className="text-xs text-muted-foreground">Shown behind your profile photo</span>
                  </div>
                  <ImageUpload
                    currentUrl={coverUrl}
                    userId={user?.id || ""}
                    folder="covers"
                    onUpload={handleCoverUpload}
                    variant="cover"
                    className="h-40 w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a safe image up to 5MB. Hover over the banner and click the camera icon to change it.
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <ImageUpload
                    currentUrl={avatarUrl}
                    userId={user?.id || ""}
                    folder="avatars"
                    onUpload={handleAvatarUpload}
                    variant="avatar"
                  />
                  <div className="flex-1">
                    <h2 className="font-heading text-xl font-bold">{profile?.name}</h2>
                    <p className="text-muted-foreground text-sm">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">Account type: {profile?.type || "client"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role & Category Card */}
            <Card className="mb-6">
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Role & Category</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Account Type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={!editing}
                      onClick={() => setAccountType("client")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                        accountType === "client"
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      } ${!editing ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/30"}`}
                    >
                      <User className={`h-5 w-5 mx-auto mb-1 ${accountType === "client" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-bold text-sm">Client</p>
                      <p className="text-[10px] text-muted-foreground">Hire creators</p>
                    </button>
                    <button
                      type="button"
                      disabled={!editing}
                      onClick={() => setAccountType("creator")}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                        accountType === "creator"
                          ? "border-secondary bg-secondary/5"
                          : "border-border"
                      } ${!editing ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-secondary/30"}`}
                    >
                      <Camera className={`h-5 w-5 mx-auto mb-1 ${accountType === "creator" ? "text-secondary" : "text-muted-foreground"}`} />
                      <p className="font-bold text-sm">Creator</p>
                      <p className="text-[10px] text-muted-foreground">Get hired</p>
                    </button>
                  </div>
                </div>

                {accountType === "creator" && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Category / Profession</label>
                    <Select value={category} onValueChange={setCategory} disabled={!editing}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {creatorCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {category === "artist" && (
                      <div className="mt-3">
                        <label className="text-sm font-medium mb-1.5 block">Artist Type</label>
                        <Select value={subcategory} onValueChange={setSubcategory} disabled={!editing}>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select artist type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ARTIST_SUBCATEGORIES.map((sc) => (
                              <SelectItem key={sc.value} value={sc.value}>{sc.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {accountType === "creator" && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> Service Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Choose the cities or locations where you provide services. Clients searching inside these areas can find your profile.
                    </p>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={areaQuery}
                            onChange={(event) => {
                              setAreaQuery(event.target.value);
                              setSelectedArea(null);
                            }}
                            placeholder="Search city or location..."
                            className="pl-9"
                          />
                        </div>
                        <Select value={areaRadius} onValueChange={setAreaRadius}>
                          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[5, 10, 25, 50, 100].map((radius) => (
                              <SelectItem key={radius} value={String(radius)}>{radius} km</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={addServiceArea} disabled={!selectedArea || areaSaving}>
                          {areaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                          Add
                        </Button>
                      </div>
                      {areaSuggestions.length > 0 && (
                        <div className="absolute left-0 right-32 top-14 z-30 overflow-hidden rounded-xl border bg-card shadow-xl">
                          {areaSuggestions.map((suggestion, index) => (
                            <button
                              type="button"
                              key={suggestion.place_id || `${suggestion.display_name}-${index}`}
                              onClick={() => selectServiceAreaSuggestion(suggestion)}
                              className="flex w-full items-start gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                            >
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="line-clamp-2">{suggestion.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {serviceAreas.length > 0 ? (
                      <div className="space-y-2">
                        {serviceAreas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{area.label}</p>
                              <p className="text-xs text-muted-foreground">Service radius: {area.radius_km} km</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeServiceArea(area.id)} aria-label={`Remove ${area.label}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                        No service area added yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-secondary" /> Live Now
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{liveNow ? "You are visible as Live Now" : "Turn on Live Now when you are available"}</p>
                      <p className="text-xs text-muted-foreground">
                        Your exact location is shared only while you give permission and expires automatically after 2 hours.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={liveNow ? "secondary" : "default"}
                      onClick={() => toggleLiveLocation(!liveNow)}
                      disabled={liveLocationLoading}
                    >
                      {liveLocationLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                      {liveNow ? "Turn Off" : "Go Live"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} disabled={!editing} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Bio</label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} disabled={!editing} rows={3} placeholder="Tell us about yourself..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-sm font-medium mb-1 block">City</label><Input value={city} onChange={e => setCity(e.target.value)} disabled={!editing} /></div>
                  <div><label className="text-sm font-medium mb-1 block">State</label><Input value={state} onChange={e => setState(e.target.value)} disabled={!editing} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Country</label><Input value={country} onChange={e => setCountry(e.target.value)} disabled={!editing} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-1 block">Phone</label><Input value={phone} onChange={e => setPhone(e.target.value)} disabled={!editing} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Website</label><Input value={website} onChange={e => setWebsite(e.target.value)} disabled={!editing} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Email</span></div>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Account Type</span></div>
                  <span className="text-sm text-muted-foreground capitalize">{profile?.type}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Joined</span></div>
                  <span className="text-sm text-muted-foreground">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <DeleteAccountSection />
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
