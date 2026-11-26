import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, MapPin, Save, Edit, Camera, Briefcase } from "lucide-react";
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
  const [accountType, setAccountType] = useState<"creator" | "client">("client");
  const [category, setCategory] = useState<string>("photographer");
  const [subcategory, setSubcategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const profileHydratedFor = useRef<string | null>(null);
  const draftRestoredFor = useRef<string | null>(null);

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

    // Update profile
    const { error } = await supabase.from("profiles").update({
      name, bio, city, state, country, phone, website, avatar_url: avatarUrl,
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
              <CardContent className="pt-6">
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
