import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, Grid3X3, List, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CreatorCard } from "@/components/shared/CreatorCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { allCategories } from "@/data/mockData";
import { CATEGORY_LABELS, Creator } from "@/types/creator";
import { supabase } from "@/integrations/supabase/client";

export type CreatorWithPlan = Creator & {
  plan?: string;
  isPaidBadge?: boolean;
  completedBookings?: number;
};

const indiaLocations: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Bihar": [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur",
    "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger",
    "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur",
    "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
  ],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Mandi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Dimapur", "Kohima"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"],
  "Puducherry": ["Pondicherry", "Auroville"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Chandigarh", "Patiala"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Noida", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol"],
};

const budgetOptions = [
  { label: "Any Budget", value: "any", min: 0, max: Infinity },
  { label: "Under ₹1,000", value: "0-1000", min: 0, max: 1000 },
  { label: "₹1,000 - ₹5,000", value: "1000-5000", min: 1000, max: 5000 },
  { label: "₹5,000 - ₹10,000", value: "5000-10000", min: 5000, max: 10000 },
  { label: "₹10,000 - ₹25,000", value: "10000-25000", min: 10000, max: 25000 },
  { label: "₹25,000 - ₹50,000", value: "25000-50000", min: 25000, max: 50000 },
  { label: "₹50,000 - ₹1,00,000", value: "50000-100000", min: 25000, max: 50000 },
  { label: "Above ₹1,00,000", value: "100000-infinity", min: 50000, max: Infinity },
];

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("rank");
  
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBudget, setSelectedBudget] = useState("any");
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  const [creators, setCreators] = useState<CreatorWithPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const availableCities = selectedState ? indiaLocations[selectedState] : [];

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setLoading(true);

    const [
      { data: profiles },
      { data: creatorProfiles },
      { data: rankingScores },
      { data: subscriptionsData },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("type", "creator"),
      supabase.from("creator_profiles").select("*"),
      (supabase.from("creator_ranking_scores" as any) as any).select("*"),
      supabase.from("subscriptions").select("user_id, plan_name"),
    ]);

    if (!profiles || !creatorProfiles) {
      setLoading(false);
      return;
    }

    const mapped: CreatorWithPlan[] = profiles.map(p => {
      const cp = creatorProfiles.find(c => c.profile_id === p.id);
      const score = (rankingScores || []).find((item: any) => item.creator_id === p.id);
      const sub = (subscriptionsData || []).find(item => item.user_id === p.id);

      return {
        id: p.id,
        name: p.name,
        bio: p.bio || undefined,
        avatarUrl: p.avatar_url || "/296fe121-5dfa-43f4-98b5-db50019738a7.jpg",
        coverUrl: p.cover_url || undefined,
        city: p.city || "Unknown",
        state: p.state || undefined,
        country: p.country || "India",
        category: (cp?.category || "photographer") as any,
        specializations: cp?.specializations || [],
        languages: cp?.languages || [],
        experienceYears: cp?.experience_years || 0,
        rating: Number(score?.avg_rating || 0),
        reviewCount: Number(score?.review_count || 0),
        responseRate: cp?.response_rate || 0,
        avgResponseTime: cp?.avg_response_time || "N/A",
        rankScore: Number(score?.total_score ?? cp?.rank_score ?? 0),
        cityRank: cp?.city_rank || 0,
        isVerified: p.is_verified,
        isOnline: false,
        priceRange: { min: cp?.price_min || 0, max: cp?.price_max || 0, currency: cp?.price_currency || "INR" },
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        plan: sub?.plan_name || "free",
        isPaidBadge: Boolean(
          score?.is_paid_badge
          && score?.badge_expires_at
          && new Date(score.badge_expires_at).getTime() > Date.now()
        ),
        completedBookings: Number(score?.completed_bookings || 0),
      };
    });

    setCreators(mapped);
    setLoading(false);
  };

  const filteredCreators = useMemo(() => {
    let results = [...creators];
    
    if (selectedState) results = results.filter(c => c.state?.toLowerCase() === selectedState.toLowerCase());
    if (selectedCity) results = results.filter(c => c.city.toLowerCase() === selectedCity.toLowerCase());
    if (selectedCategory) results = results.filter(c => c.category === selectedCategory);
    if (verifiedOnly) results = results.filter(c => c.isVerified);
    if (minRating > 0) results = results.filter(c => c.rating >= minRating);
    
    if (selectedBudget !== "any") {
      const budgetTier = budgetOptions.find(b => b.value === selectedBudget);
      if (budgetTier) {
        results = results.filter(c => 
          (c.priceRange.min <= budgetTier.max && c.priceRange.max >= budgetTier.min)
        );
      }
    }

    switch (sortBy) {
      case "rank":
        return results.sort((a, b) => (
          b.rankScore - a.rankScore
          || Number(Boolean(b.isPaidBadge)) - Number(Boolean(a.isPaidBadge))
          || (b.completedBookings || 0) - (a.completedBookings || 0)
          || b.rating - a.rating
        ));
      case "rating": return results.sort((a, b) => b.rating - a.rating);
      case "price-low": return results.sort((a, b) => a.priceRange.min - b.priceRange.min);
      case "price-high": return results.sort((a, b) => b.priceRange.max - a.priceRange.max);
      case "reviews": return results.sort((a, b) => b.reviewCount - a.reviewCount);
      default: return results;
    }
  }, [creators, selectedState, selectedCity, selectedCategory, selectedBudget, minRating, verifiedOnly, sortBy]);

  const clearFilters = () => {
    setSelectedState(""); 
    setSelectedCity(""); 
    setSelectedCategory(""); 
    setSelectedBudget("any"); 
    setMinRating(0); 
    setVerifiedOnly(false);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">State</label>
        <Select 
          value={selectedState} 
          onValueChange={(val) => {
            setSelectedState(val === "all" ? "" : val);
            setSelectedCity(""); 
          }}
        >
          <SelectTrigger><SelectValue placeholder="All States" /></SelectTrigger>
          <SelectContent className="bg-card z-50 border border-border shadow-md max-h-60">
            <SelectItem value="all">All States</SelectItem>
            {Object.keys(indiaLocations).sort().map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">
          City {selectedState ? "" : "(Select a State first)"}
        </label>
        <Select 
          value={selectedCity} 
          onValueChange={setSelectedCity} 
          disabled={!selectedState} 
        >
          <SelectTrigger className={!selectedState ? "opacity-50" : ""}><SelectValue placeholder="All Cities" /></SelectTrigger>
          <SelectContent className="bg-card z-50 border border-border shadow-md max-h-60">
            <SelectItem value="all">All Cities</SelectItem>
            {availableCities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-3 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Budget Range</label>
        <Select value={selectedBudget} onValueChange={setSelectedBudget}>
          <SelectTrigger><SelectValue placeholder="Any Budget" /></SelectTrigger>
          <SelectContent className="bg-card z-50 border border-border shadow-md">
            {budgetOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Min Rating</label>
        <div className="flex gap-2">
          {[0, 4, 4.5, 4.8].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${minRating === r ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Verified Only</label>
        <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>Clear All Filters</Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold">Discover Creators</h1>
              <p className="text-muted-foreground mt-1">{loading ? "Loading..." : `${filteredCreators.length} creators found`}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card z-50 border border-border shadow-md">
                  <SelectItem value="rank">Top Ranked</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="hidden md:flex border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}><Grid3X3 className="h-4 w-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}><List className="h-4 w-4" /></button>
              </div>
              
              <Sheet>
                <SheetTrigger asChild><Button variant="outline" className="md:hidden"><SlidersHorizontal className="h-4 w-4 mr-2" />Filters</Button></SheetTrigger>
                <SheetContent><SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader><div className="mt-6"><FilterPanel /></div></SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            <aside className="hidden md:block w-72 shrink-0">
              <div className="sticky top-24 bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="font-heading font-semibold mb-4">Filters</h3>
                <FilterPanel />
              </div>
            </aside>
            
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
              ) : filteredCreators.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border">
                  <p className="text-muted-foreground text-lg mb-4">No creators match your filters.</p>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                  {filteredCreators.map((creator, i) => (
                    <motion.div key={creator.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <CreatorCard creator={creator} variant={viewMode === "list" ? "compact" : "default"} onView={(id) => navigate(`/creator/${id}`)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Search;
