import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { allCategories, mockCreators } from "@/data/mockData";
import { CATEGORY_LABELS, CATEGORY_ICONS, CreatorCategory } from "@/types/creator";

// Fixed the 'agency' to 'other' mapping to match the updated global types
const categoryImages: Record<CreatorCategory, string> = {
  photographer: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop",
  influencer: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
  videographer: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=400&fit=crop",
  model: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop",
  "artist": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
  "makeup-artist": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop",
  "video-editor": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  agency: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  "graphic-designer": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop",
  singer: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
  dj: "https://images.unsplash.com/photo-1571266028243-e4733b5b5d76?w=600&h=400&fit=crop",
  "music-band": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop",
};

const Categories = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <main className="flex-1 pb-24">
        
        <section className="pt-24 pb-16 px-6 bg-white border-b border-gray-200">
          <div className="container max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                Browse by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Category</span>
              </h1>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
                Find the perfect creative talent for your next project. Explore our curated network of professionals.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allCategories.map((cat, i) => {
                // Ensure typescript treats the category string as a CreatorCategory key
                const categoryKey = cat as CreatorCategory;
                const count = mockCreators.filter(c => c.category === categoryKey).length;
                
                return (
                  <motion.div 
                    key={categoryKey} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/search?category=${categoryKey}`)}
                    className="group relative rounded-3xl overflow-hidden cursor-pointer aspect-[4/3] shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-300 border border-gray-200"
                  >
                    {/* Background Image */}
                    <img 
                      src={categoryImages[categoryKey]} 
                      alt={CATEGORY_LABELS[categoryKey]} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    
                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="absolute bottom-6 left-6 right-6 transform transition-transform duration-300 group-hover:-translate-y-2">
                      <span className="text-3xl mb-3 block drop-shadow-md">
                        {CATEGORY_ICONS[categoryKey]}
                      </span>
                      <h3 className="text-2xl font-black text-white mb-1 drop-shadow-md">
                        {CATEGORY_LABELS[categoryKey]}
                      </h3>
                      <p className="text-blue-200 font-medium text-sm drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                        {count} creators available
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
        
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
