import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Link as LinkIcon, Briefcase, User as UserIcon, Building,
  Plus, Mail, MessageCircle, ExternalLink, Instagram, Heart, Eye,
  CheckCircle2, Folders
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// --- DUMMY DATA ---
const profileData = {
  name: "Abhishek Kumar",
  role: "3D Art & illustrator",
  location: "Patna, India",
  availability: "Available Now",
  team: "Sumirayandesign",
  instagram: "@ultimate_avhi",
  stats: {
    views: "132,413",
    appreciations: "13,597",
    followers: "6,276",
    following: "442"
  },
  // Added banner image
  banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
};

const portfolioItems = [
  { 
    id: 1, 
    title: "Dynamic Characters Vol. 2", 
    category: "3D Art", 
    likes: "2.1k", 
    views: "18k", 
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    featured: true // Takes up 2 columns
  },
  { 
    id: 2, 
    title: "Retro Tech UI", 
    category: "Product Design", 
    likes: "842", 
    views: "5.2k", 
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    title: "Lazy Bear", 
    category: "Character Design", 
    likes: "1.5k", 
    views: "12k", 
    image: "https://images.unsplash.com/photo-1580428180098-24b353d7e9d9?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: 4, 
    title: "Washing Machine Bot", 
    category: "3D Illustration", 
    likes: "3.2k", 
    views: "22k", 
    image: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: 5, 
    title: "Snowboarder", 
    category: "Character Design", 
    likes: "950", 
    views: "8.8k", 
    image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: 6, 
    title: "King Bull", 
    category: "3D Art", 
    likes: "4.1k", 
    views: "35k", 
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop" 
  },
];

// --- MAIN PROFILE COMPONENT ---
const BehanceProfile = () => {
  const [activeTab, setActiveTab] = useState("work");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-8">
        
        {/* 1. MAIN BANNER IMAGE */}
        <div className="w-full h-[120px] md:h-[250px] lg:h-[300px] bg-gray-100 rounded-xl overflow-hidden relative shadow-sm">
          <img 
            src={profileData.banner} 
            alt="Profile Banner" 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* 2. PROFILE & EVERYTHING ELSE */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mt-4 lg:mt-0">
          
          {/* LEFT SIDEBAR - PROFILE INFO */}
          {/* -mt-20 pulls the sidebar up so the avatar overlaps the banner perfectly */}
          <aside className="w-full lg:w-[300px] shrink-0 sticky top-8 flex flex-col gap-6 -mt-16 lg:-mt-24 z-10 px-2 lg:px-0">
            
            {/* Avatar & Status */}
            <div className="relative inline-block w-max">
              {/* Added a thick white border to punch through the banner image */}
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop" 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-sm tracking-wider shadow-sm border-2 border-white">
                PRO
              </div>
            </div>

            {/* Name */}
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-3">{profileData.name}</h1>
              <div className="inline-flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                {profileData.availability}
              </div>
            </div>

            {/* Profile Details */}
            <ul className="space-y-3 text-sm text-gray-600 font-medium">
              <li className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-gray-400" /> Available for Freelance</li>
              <li className="flex items-center gap-3"><UserIcon className="h-4 w-4 text-gray-400" /> {profileData.role}</li>
              <li className="flex items-center gap-3"><Building className="h-4 w-4 text-gray-400" /> {profileData.team}</li>
              <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-gray-400" /> {profileData.location}</li>
              <li className="flex items-center gap-3">
                <LinkIcon className="h-4 w-4 text-gray-400" /> 
                <a href="#" className="text-blue-600 hover:underline">instagram.com/{profileData.instagram}</a>
              </li>
            </ul>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full py-6 text-base shadow-sm">
                <Plus className="h-5 w-5 mr-1" /> Follow
              </Button>
              <Button variant="outline" className="w-full rounded-full font-bold border-gray-300 text-gray-700 hover:bg-gray-50">
                <Mail className="h-4 w-4 mr-2" /> Message
              </Button>
            </div>

            <hr className="border-gray-100 my-2" />

            {/* Stats */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Project Views</span>
                <span className="font-bold text-gray-900">{profileData.stats.views}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Appreciations</span>
                <span className="font-bold text-gray-900">{profileData.stats.appreciations}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Followers</span>
                <span className="font-bold text-gray-900">{profileData.stats.followers}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Following</span>
                <span className="font-bold text-gray-900">{profileData.stats.following}</span>
              </div>
            </div>

            <hr className="border-gray-100 my-2" />

            {/* Teams */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Teams</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">OD</div>
                    <span className="text-sm font-bold text-gray-700">ODOWORKS</span>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">+ Follow</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-xs text-white">ID</div>
                    <span className="text-sm font-bold text-gray-700">Indian design</span>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">+ Follow</button>
                </div>
              </div>
            </div>
            
          </aside>

          {/* RIGHT MAIN CONTENT - PORTFOLIO GRID */}
          <div className="flex-1 min-w-0 flex flex-col pt-6">
            
            {/* Top Navigation & Tool Badges */}
            <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-end border-b border-gray-200 pb-4 mb-8 relative">
              
              {/* Tabs */}
              <div className="flex gap-8 mt-6 md:mt-0">
                <button 
                  onClick={() => setActiveTab("work")}
                  className={`text-lg font-bold pb-4 -mb-[17px] transition-colors relative ${activeTab === 'work' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  Work
                  {activeTab === 'work' && (
                    <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab("moodboards")}
                  className={`text-lg font-bold pb-4 -mb-[17px] transition-colors relative ${activeTab === 'moodboards' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  Moodboards
                  {activeTab === 'moodboards' && (
                    <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab("appreciations")}
                  className={`text-lg font-bold pb-4 -mb-[17px] transition-colors relative ${activeTab === 'appreciations' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  Appreciations
                  {activeTab === 'appreciations' && (
                    <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                  )}
                </button>
              </div>

              {/* Software Tags (Top Right) */}
              <div className="flex gap-1">
                 {/* Dummy placeholder blocks to mimic the software banners in Behance */}
                <div className="bg-[#B59E54] text-white w-8 h-12 flex items-center justify-center rounded-sm shadow-sm relative overflow-hidden">
                   <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black/10 rotate-45"></div>
                  <span className="font-bold text-xs">Il</span>
                </div>
                <div className="bg-[#8A7967] text-white w-8 h-12 flex items-center justify-center rounded-sm shadow-sm relative overflow-hidden">
                   <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black/10 rotate-45"></div>
                  <span className="font-bold text-xs">3D</span>
                </div>
                <div className="bg-[#B58945] text-white w-8 h-12 flex items-center justify-center rounded-sm shadow-sm relative overflow-hidden">
                   <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black/10 rotate-45"></div>
                  <span className="font-bold text-xs">UI</span>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {activeTab === "work" ? (
                  portfolioItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`group cursor-pointer rounded-lg overflow-hidden bg-gray-100 relative ${
                        item.featured ? 'md:col-span-2 aspect-[16/9]' : 'aspect-square'
                      }`}
                    >
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      
                      {/* Behance-style Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                        <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                        <div className="flex items-center justify-between text-white/90">
                          <span className="text-xs font-medium">{item.category}</span>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-sm font-bold"><Heart className="h-4 w-4" fill="currentColor" /> {item.likes}</span>
                            <span className="flex items-center gap-1.5 text-sm font-bold"><Eye className="h-4 w-4" /> {item.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-500 flex flex-col items-center">
                    <Folders className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Nothing to show yet</h3>
                    <p>Items collected will appear in this tab.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BehanceProfile;
