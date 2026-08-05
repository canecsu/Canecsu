import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Map, Wallet, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allCategories } from "@/data/mockData";
import { CATEGORY_LABELS, CreatorCategory } from "@/types/creator";

// --- 1. STATE & CITY DATA (Matching your Search page) ---
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

// --- 2. BUDGET TIERS ---
const budgetOptions = [
  { label: "Any Budget", value: "any" },
  { label: "Under ₹1,000", value: "0-1000" },
  { label: "₹1,000 - ₹5,000", value: "1000-5000" },
  { label: "₹5,000 - ₹10,000", value: "5000-10000" },
  { label: "₹10,000 - ₹25,000", value: "10000-25000" },
  { label: "₹25,000 - ₹50,000", value: "25000-50000" },
  { label: "Above ₹50,000", value: "50000-infinity" },
];

interface HeroSearchProps {
  className?: string;
}

export function HeroSearch({ className }: HeroSearchProps) {
  const navigate = useNavigate();
  
  const [selectedState, setSelectedState] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string>("");
  const [budget, setBudget] = useState("any");

  const availableCities = selectedState ? indiaLocations[selectedState] : [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedState && selectedState !== "all") params.set("state", selectedState);
    if (city && city !== "all") params.set("city", city);
    if (category) params.set("category", category);
    if (budget && budget !== "any") params.set("budget", budget);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        "w-full max-w-5xl mx-auto",
        className
      )}
    >
      <div className="bg-card rounded-2xl shadow-card-hover p-2 md:p-3 border border-border/50">
        {/* Changed to a 5-column grid on desktop for a sleek, single-row layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          
          {/* 1. State Search */}
          <div className="relative">
            <Map className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select 
              value={selectedState} 
              onValueChange={(val) => {
                setSelectedState(val === "all" ? "" : val);
                setCity(""); // Reset city when state changes
              }}
            >
              <SelectTrigger className="h-12 md:h-14 pl-11 border-0 bg-muted/50 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary shadow-none">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50 border border-border shadow-md max-h-60">
                <SelectItem value="all">All States</SelectItem>
                {Object.keys(indiaLocations).sort().map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. City Search */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select 
              value={city} 
              onValueChange={setCity}
              disabled={!selectedState}
            >
              <SelectTrigger className={cn("h-12 md:h-14 pl-11 border-0 bg-muted/50 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary shadow-none", !selectedState && "opacity-50")}>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50 border border-border shadow-md max-h-60">
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Category */}
          <div className="relative">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 md:h-14 pl-11 border-0 bg-muted/50 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary shadow-none">
                <SelectValue placeholder="Creator type" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50 border border-border shadow-md max-h-60">
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Budget Dropdown */}
          <div className="relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger className="h-12 md:h-14 pl-11 border-0 bg-muted/50 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary shadow-none">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent className="bg-card z-50 border border-border shadow-md">
                {budgetOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Search Button */}
          <Button
            onClick={handleSearch}
            className="h-12 md:h-14 w-full bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold tracking-wide shadow-sm"
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Search</span>
          </Button>
        </div>
      </div>

      {/* Quick Filters - Updated to include States automatically */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-1">Popular:</span>
        {[
          { label: "Photographers in Mumbai", state: "Maharashtra", city: "Mumbai", cat: "photographer" },
          { label: "Influencers in Delhi", state: "Delhi", city: "New Delhi", cat: "influencer" },
          { label: "Models in Bangalore", state: "Karnataka", city: "Bengaluru", cat: "model" }
        ].map(
          (shortcut) => (
            <button
              key={shortcut.label}
              onClick={() => {
                setSelectedState(shortcut.state);
                setCity(shortcut.city);
                setCategory(shortcut.cat as CreatorCategory);
                setBudget("any");
              }}
              className="px-3 py-1.5 text-[11px] font-medium rounded-full bg-card/50 hover:bg-muted text-foreground transition-colors border border-border shadow-sm backdrop-blur-sm"
            >
              {shortcut.label}
            </button>
          )
        )}
      </div>
    </motion.div>
  );
}
