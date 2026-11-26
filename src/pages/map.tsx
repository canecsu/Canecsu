import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import {
  MapPin, Navigation, Star, ArrowRight, SlidersHorizontal, Zap, X, Filter,
  Users, TrendingUp, Globe, Sun, Moon, Map as MapIcon, Satellite,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CategoryPill } from "@/components/shared/CategoryPill";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS } from "@/types/creator";
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  { label: "Above ₹50,000", value: "50000-infinity", min: 50000, max: Infinity },
];

const INDIA_CENTER: [number, number] = [22.5, 82.0];

const cityCoords: Record<string, [number, number]> = {
  "mumbai": [19.076, 72.877], "delhi": [28.613, 77.209], "bangalore": [12.971, 77.594],
  "bengaluru": [12.971, 77.594], "chennai": [13.082, 80.270], "kolkata": [22.572, 88.363],
  "hyderabad": [17.385, 78.486], "pune": [18.520, 73.856], "ahmedabad": [23.022, 72.571],
  "jaipur": [26.912, 75.787], "lucknow": [26.846, 80.946], "patna": [25.605, 85.135],
  "chandigarh": [30.733, 76.779], "kochi": [9.931, 76.267], "goa": [15.299, 74.123],
  "panaji": [15.299, 74.123], "indore": [22.719, 75.857], "bhopal": [23.259, 77.412],
  "new delhi": [28.613, 77.209], "noida": [28.535, 77.391], "gurugram": [28.459, 77.026],
  "surat": [21.170, 72.831], "vadodara": [22.307, 73.181], "nagpur": [21.145, 79.088],
  "visakhapatnam": [17.686, 83.218], "thiruvananthapuram": [8.524, 76.936],
  "coimbatore": [11.016, 76.955], "madurai": [9.925, 78.119], "ranchi": [23.344, 85.309],
  "guwahati": [26.144, 91.736], "bhubaneswar": [20.296, 85.824],
};

const categories = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

/* ---------------------------------------------------------
   Map style switcher.
   CARTO now requires an API key for basemap tiles, so the
   default styles use OpenStreetMap tiles instead.
--------------------------------------------------------- */
const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const mapStyles = [
  {
    id: "light",
    label: "Light",
    icon: Sun,
    url: OSM_TILE_URL,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    url: OSM_TILE_URL,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "streets",
    label: "Streets",
    icon: MapIcon,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: "satellite",
    label: "Satellite",
    icon: Satellite,
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
] as const;

type MapStyleId = typeof mapStyles[number]["id"];

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: true, duration: 1.2 }); }, [center, zoom, map]);
  return null;
}

/* ---------------------------------------------------------
   Ambient 3D-feeling backdrop — soft particle drift + blobs.
   Sits behind everything; content stays fully legible since
   every panel/card on top has its own solid background.
--------------------------------------------------------- */
function PageAmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth < 768;
    const styles = getComputedStyle(document.documentElement);
    const primaryHsl = styles.getPropertyValue("--primary").trim() || "222 89% 55%";
    const secondaryHsl = styles.getPropertyValue("--secondary").trim() || "280 70% 60%";

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particleCount = isMobile ? 16 : 34;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; accent: boolean };
    let particles: Particle[] = [];

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.3 + 0.6,
        accent: Math.random() > 0.6,
      }));
    }

    resize();
    seed();

    function handleResize() {
      resize();
      seed();
    }
    window.addEventListener("resize", handleResize);

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx!.fillStyle = `hsl(${p.accent ? secondaryHsl : primaryHsl} / 0.35)`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 10%, hsl(var(--primary) / 0.06) 0%, transparent 45%),
                            radial-gradient(circle at 90% 20%, hsl(var(--secondary) / 0.06) 0%, transparent 45%)`,
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <motion.div
        animate={{ y: [-15, 15, -15], x: [-8, 8, -8] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-[6%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"
      />
      <motion.div
        animate={{ y: [15, -15, 15], x: [8, -8, 8] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-[8%] w-72 h-72 rounded-full bg-secondary/5 blur-3xl"
      />
    </div>
  );
}

/* ---------------------------------------------------------
   Small 3D accent ring — visual continuity with other pages.
--------------------------------------------------------- */
function AccentRing() {
  return (
    <div className="relative h-8 w-8 shrink-0" style={{ perspective: 400 }} aria-hidden="true">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/40"
        style={{ transformStyle: "preserve-3d", rotateX: 58 }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute h-1.5 w-1.5 rounded-full bg-primary"
          style={{ top: -3, left: "50%", marginLeft: -3, boxShadow: "0 0 8px 2px hsl(var(--primary) / 0.6)" }}
        />
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------
   3D tilt wrapper — cursor-reactive rotate + glare, used for
   the active creator showcase card.
--------------------------------------------------------- */
function TiltPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 22 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 22 });
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, hsl(var(--primary) / 0.18), transparent 60%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 8);
    rotateX.set((0.5 - py) * 8);
    glareX.set(px * 100);
    glareY.set(py * 100);
  }
  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
    setIsHovering(false);
  }

  return (
    <div style={{ perspective: 1000 }} className={className}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
        className="relative will-change-transform"
      >
        {children}
        <motion.div
          aria-hidden="true"
          style={{ background: glareBackground }}
          animate={{ opacity: isHovering ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-0 rounded-3xl"
        />
      </motion.div>
    </div>
  );
}

export default function ExploreMap() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>("light");

  const [liveOnly, setLiveOnly] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("any");
  const [minRating, setMinRating] = useState(0);

  const availableCities = selectedState ? indiaLocations[selectedState] : [];
  const activeMapStyle = mapStyles.find(s => s.id === mapStyleId)!;

  // Inject marker keyframes once. Targets only the inner marker
  // element (never Leaflet's own positioning wrapper) so entrance
  // and hover animations never fight with marker placement.
  useEffect(() => {
    const styleId = "explore-map-marker-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes markerDrop3D {
        0% { transform: translateY(-22px) scale(0.4); opacity: 0; }
        60% { transform: translateY(3px) scale(1.08); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes liveDotPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
        70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
      }
      .avatar-marker-inner { transition: transform 0.2s ease; }
      .avatar-marker-inner:hover { transform: translateY(-3px) scale(1.08); z-index: 1000; }
      .avatar-marker-live-dot { animation: liveDotPulse 1.8s ease-in-out infinite; }
      .explore-map-dark .leaflet-tile-pane {
        filter: invert(0.88) hue-rotate(180deg) brightness(0.78) contrast(0.92) saturate(0.82);
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data: profiles, error: profileError } = await supabase.from("profiles").select("*, creator_profiles(*)").eq("type", "creator");
        const { data: reviews } = await supabase.from("reviews").select("creator_id, rating");
        
        if (profileError) throw profileError;

        const reviewAgg: Record<string, { total: number; count: number }> = {};
        (reviews || []).forEach(r => {
          if (!reviewAgg[r.creator_id]) reviewAgg[r.creator_id] = { total: 0, count: 0 };
          reviewAgg[r.creator_id].total += r.rating;
          reviewAgg[r.creator_id].count++;
        });

        const mapped = (profiles || []).map((p) => {
          const cp = p.creator_profiles?.[0];
          const rev = reviewAgg[p.id] || { total: 0, count: 0 };
          const cityKey = (p.city || "patna").toLowerCase();
          
          const baseCoords = cityCoords[cityKey] || [25.605, 85.135];
          const lat = baseCoords[0] + (Math.random() - 0.5) * 0.04;
          const lng = baseCoords[1] + (Math.random() - 0.5) * 0.04;
          
          return {
            id: p.id, name: p.name, 
            city: p.city || "Unknown", state: p.state || "Unknown",
            avatarUrl: p.avatar_url || "/296fe121-5dfa-43f4-98b5-db50019738a7.jpg",
            bio: p.bio, category: cp?.category || "photographer",
            isVerified: p.is_verified,
            rating: rev.count > 0 ? +(rev.total / rev.count).toFixed(1) : 0,
            reviewCount: rev.count,
            priceMin: cp?.price_min || 0,
            priceMax: cp?.price_max || 0,
            isAvailableNow: cp?.is_available_now || false,
            isSponsored: false,
            subscriptionTier: "free",
            lat, lng,
          };
        });
        setCreators(mapped);
      } catch (err) {
        console.error("Error fetching map data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCreators();
  }, []);

  const filtered = useMemo(() => {
    let results = [...creators];
    if (liveOnly) results = results.filter(c => c.isAvailableNow);
    if (selectedState && selectedState !== "all") results = results.filter(c => c.state?.toLowerCase() === selectedState.toLowerCase());
    if (selectedCity && selectedCity !== "all") results = results.filter(c => c.city?.toLowerCase() === selectedCity.toLowerCase());
    if (selectedCategory && selectedCategory !== "all") results = results.filter(c => c.category === selectedCategory);
    if (minRating > 0) results = results.filter(c => c.rating >= minRating);
    if (selectedBudget !== "any") {
      const budgetTier = budgetOptions.find(b => b.value === selectedBudget);
      if (budgetTier) results = results.filter(c => c.priceMin <= budgetTier.max && c.priceMax >= budgetTier.min);
    }
    results.sort((a, b) => (b.isSponsored ? 1 : 0) - (a.isSponsored ? 1 : 0));
    return results;
  }, [creators, liveOnly, selectedState, selectedCity, selectedCategory, selectedBudget, minRating]);

  const active = filtered.find(c => c.id === activeId);

  const liveCount = creators.filter(c => c.isAvailableNow).length;
  const totalCities = new Set(creators.map(c => c.city)).size;

  const createCustomIcon = (creator: any, isActive: boolean, index: number = 0) => {
    const isLive = creator.isAvailableNow;
    const borderColor = isActive ? 'hsl(221, 83%, 53%)' : isLive ? 'hsl(142, 71%, 45%)' : '#ffffff';
    const size = isActive ? 56 : 42;
    const shadow = isActive ? '0 10px 28px rgba(59,130,246,0.5)' : '0 4px 14px rgba(0,0,0,0.22)';
    const liveIndicator = isLive
      ? `<div class="avatar-marker-live-dot" style="position:absolute;top:-3px;right:-3px;width:14px;height:14px;background:hsl(142, 71%, 45%);border-radius:50%;border:2.5px solid white;z-index:10;"></div>`
      : '';

    return L.divIcon({
      className: "custom-avatar-marker bg-transparent border-0",
      html: `
        <div class="avatar-marker-inner" style="position:relative;width:${size}px;height:${size}px;cursor:pointer;animation:markerDrop3D 0.45s cubic-bezier(0.34,1.56,0.64,1) both;animation-delay:${Math.min(index * 25, 400)}ms;">
          <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;border:3px solid ${borderColor};box-shadow:${shadow};background:white;">
            <img src="${creator.avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />
          </div>
          ${liveIndicator}
        </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const activeFiltersCount = [
    liveOnly, selectedState && selectedState !== "all",
    selectedCity && selectedCity !== "all",
    selectedCategory && selectedCategory !== "all", 
    minRating > 0, selectedBudget !== "any"
  ].filter(Boolean).length;

  const clearFilters = () => {
    setLiveOnly(false); setSelectedState(""); setSelectedCity("");
    setSelectedCategory(""); setSelectedBudget("any"); setMinRating(0);
  };

  const filterPanelContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-xl border border-secondary/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-secondary" />
          <span className="font-medium text-sm">Available Now</span>
        </div>
        <Switch checked={liveOnly} onCheckedChange={setLiveOnly} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">State</label>
        <Select value={selectedState} onValueChange={(val) => { setSelectedState(val === "all" ? "" : val); setSelectedCity(""); }}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="All States" /></SelectTrigger>
          <SelectContent className="bg-card z-[100] border border-border shadow-xl max-h-60">
            <SelectItem value="all">All States</SelectItem>
            {Object.keys(indiaLocations).sort().map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">City {selectedState ? "" : "(Select State first)"}</label>
        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
          <SelectTrigger className={`bg-background ${!selectedState ? "opacity-50" : ""}`}><SelectValue placeholder="All Cities" /></SelectTrigger>
          <SelectContent className="bg-card z-[100] border border-border shadow-xl max-h-60">
            <SelectItem value="all">All Cities</SelectItem>
            {availableCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent className="bg-card z-[100] border border-border shadow-xl max-h-60">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Budget Range</label>
        <Select value={selectedBudget} onValueChange={setSelectedBudget}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Any Budget" /></SelectTrigger>
          <SelectContent className="bg-card z-[100] border border-border shadow-xl">
            {budgetOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Min Rating</label>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 4, 4.5].map(r => (
            <button key={r} onClick={() => setMinRating(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${minRating === r ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
              {r === 0 ? "Any" : `${r}+★`}
            </button>
          ))}
        </div>
      </div>
      <Button variant="outline" className="w-full mt-4 border-dashed" onClick={clearFilters}>
        <X className="h-4 w-4 mr-2" />Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <PageAmbientBackground />
      <Header />
      
      <main className="relative z-10 flex-1 flex flex-col container max-w-[1600px] mx-auto p-3 md:p-6 min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)]">
        
        {/* Hero Stats Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground tracking-tight">
                Explore Creators
              </h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">
                Discover top creative talent across India
              </p>
            </div>
            <AccentRing />
          </div>

          {/* Live Stats Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-sm"
            >
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{creators.length}</span>
              <span className="text-xs text-muted-foreground">Creators</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ y: -3 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary/10 border border-secondary/20 shadow-sm"
            >
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-sm font-bold text-secondary">{liveCount}</span>
              <span className="text-xs text-secondary/70">Live Now</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
              whileHover={{ y: -3 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-sm"
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{totalCities}</span>
              <span className="text-xs text-muted-foreground">Cities</span>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 mb-4 shrink-0 overflow-x-auto pb-1 scrollbar-hide">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden relative shrink-0 bg-card border-border shadow-sm rounded-xl">
                <SlidersHorizontal className="h-4 w-4 mr-2" />Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle className="font-heading font-bold">Map Filters</SheetTitle></SheetHeader>
              <div className="mt-6">{filterPanelContent}</div>
            </SheetContent>
          </Sheet>

          <Button
            variant={liveOnly ? "default" : "outline"}
            onClick={() => setLiveOnly(!liveOnly)}
            className={`shrink-0 rounded-xl transition-all ${liveOnly ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md" : "bg-card"}`}
          >
            <Zap className={`h-4 w-4 mr-2 ${liveOnly ? "" : "text-secondary"}`} />
            {liveOnly ? "Live Now" : "Available Now"}
          </Button>

          {/* Quick category pills */}
          {categories.slice(0, 5).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              className={`shrink-0 rounded-xl text-xs ${selectedCategory === cat ? "" : "bg-card"}`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
            >
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 shrink-0">
            {liveOnly && <Badge variant="secondary" className="gap-1 py-1 px-3 cursor-pointer hover:bg-secondary/80 rounded-xl" onClick={() => setLiveOnly(false)}>🟢 Available Now <X className="h-3 w-3 ml-1" /></Badge>}
            {selectedState && <Badge variant="secondary" className="gap-1 py-1 px-3 cursor-pointer hover:bg-secondary/80 rounded-xl" onClick={() => { setSelectedState(""); setSelectedCity(""); }}>{selectedState} <X className="h-3 w-3 ml-1" /></Badge>}
            {selectedCity && <Badge variant="secondary" className="gap-1 py-1 px-3 cursor-pointer hover:bg-secondary/80 rounded-xl" onClick={() => setSelectedCity("")}>{selectedCity} <X className="h-3 w-3 ml-1" /></Badge>}
            {selectedCategory && <Badge variant="secondary" className="gap-1 py-1 px-3 cursor-pointer hover:bg-secondary/80 rounded-xl" onClick={() => setSelectedCategory("")}>{CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]} <X className="h-3 w-3 ml-1" /></Badge>}
            {minRating > 0 && <Badge variant="secondary" className="gap-1 py-1 px-3 cursor-pointer hover:bg-secondary/80 rounded-xl" onClick={() => setMinRating(0)}>{minRating}+ ★ <X className="h-3 w-3 ml-1" /></Badge>}
            <button onClick={clearFilters} className="text-xs text-destructive font-semibold hover:underline px-2">Clear all</button>
          </div>
        )}

        {/* Main Split Layout */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 h-full mt-2">
          
          {/* Map */}
          <div className="w-full lg:w-2/3 xl:w-3/4 rounded-2xl md:rounded-3xl overflow-hidden border border-border shadow-lg relative bg-card h-[50vh] md:h-[60vh] lg:h-auto lg:flex-1 z-0 shrink-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                <p className="font-medium text-sm">Loading map...</p>
              </div>
            ) : (
              <>
                <MapContainer
                  center={INDIA_CENTER}
                  zoom={5}
                  className={mapStyleId === "dark" ? "explore-map-dark" : undefined}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    key={activeMapStyle.id}
                    url={activeMapStyle.url}
                    attribution={activeMapStyle.attribution}
                  />
                  <ZoomControl position="bottomright" />
                  {active && <ChangeView center={[active.lat, active.lng]} zoom={13} />}
                  {filtered.map((c, i) => (
                    <Marker
                      key={c.id}
                      position={[c.lat, c.lng]}
                      icon={createCustomIcon(c, activeId === c.id, i)}
                      eventHandlers={{ click: () => setActiveId(activeId === c.id ? null : c.id) }}
                    />
                  ))}
                </MapContainer>

                {/* Map Overlay - Result Count */}
                <div className="absolute top-4 left-4 z-[400]">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-border flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">{filtered.length} creators</span>
                    {liveOnly && <span className="text-xs text-secondary font-semibold">• Live</span>}
                  </motion.div>
                </div>

                {/* Map Style Switcher */}
                <div className="absolute top-4 right-4 z-[400]">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex items-center gap-1 bg-card/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-border"
                  >
                    {mapStyles.map(s => {
                      const Icon = s.icon;
                      const isSelected = mapStyleId === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setMapStyleId(s.id)}
                          aria-label={`${s.label} map style`}
                          className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                            isSelected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{s.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-3 overflow-hidden flex-1 lg:h-full pb-4 lg:pb-0">
            
            {/* Desktop Filter Panel */}
            <div className="hidden lg:block bg-card rounded-3xl p-5 shadow-sm border border-border/50 shrink-0">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-bold text-sm text-foreground">Filters</h3>
                {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary hover:bg-primary/20">{activeFiltersCount} Active</Badge>}
              </div>
              {filterPanelContent}
            </div>

            {/* Active Creator Card */}
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div key="active" initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.2 }}
                  className="shrink-0">
                  <TiltPanel>
                    <div className="bg-card rounded-3xl overflow-hidden shadow-lg border-2 border-primary/20">
                      {/* Mini cover */}
                      <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 relative">
                        <div className="absolute -bottom-7 left-5">
                          <div className="relative">
                            <img src={active.avatarUrl} alt={active.name} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-4 border-card" />
                            {active.isAvailableNow && (
                              <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider border-2 border-card shadow-sm">LIVE</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-10 px-5 pb-5">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <h3 className="font-heading text-lg font-black text-foreground truncate">{active.name}</h3>
                          {active.isVerified && <VerifiedBadge size="sm" />}
                          {active.isSponsored && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1 py-0 h-4">SPONSORED</Badge>}
                        </div>
                        <p className="text-muted-foreground text-xs font-medium flex items-center gap-1 mb-3">
                          <MapPin className="h-3 w-3 shrink-0" />{active.city}{active.state ? `, ${active.state}` : ""}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <CategoryPill category={active.category} size="sm" />
                          <div className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full text-xs font-bold">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />{active.rating} <span className="text-muted-foreground font-medium">({active.reviewCount})</span>
                          </div>
                        </div>
                        <Button className="w-full font-bold shadow-lg shadow-primary/20 rounded-xl" onClick={() => navigate(`/creator/${active.id}`)}>
                          View Profile <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </TiltPanel>
                </motion.div>
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-card/50 border border-dashed border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm mb-1 text-foreground">Select a Creator</h3>
                  <p className="text-muted-foreground text-xs">Click any map marker to view details</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Creator List */}
            <div className="flex-1 bg-card rounded-3xl p-4 shadow-sm border border-border/50 flex flex-col min-h-[250px] overflow-hidden">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50 shrink-0">
                <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Nearby Creators
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">{filtered.length}</span>
              </div>
              
              <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                {filtered.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-10">No creators match your filters.</div>
                ) : (
                  filtered.map((c) => (
                    <motion.div 
                      key={c.id} 
                      whileHover={{ scale: 1.015, y: -1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      onClick={() => setActiveId(c.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all border ${activeId === c.id ? "bg-primary/5 border-primary/30 shadow-sm" : "hover:bg-muted hover:shadow-sm border-transparent"}`}
                    >
                      <div className="relative shrink-0">
                        <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                        {c.isAvailableNow && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs truncate text-foreground">{c.name}</h4>
                          {c.isSponsored && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-amber-400 text-amber-600 bg-amber-50">AD</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />{c.city}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-foreground">
                          <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />{c.rating}
                        </div>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground capitalize">
                          {c.category.replace('-', ' ')}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
