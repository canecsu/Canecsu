import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CreatorCard } from "@/components/shared/CreatorCard";
import { getCreatorsByCity, indianCities } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CityCreators = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const creators = city ? getCreatorsByCity(city) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 text-primary mb-4"><MapPin className="h-5 w-5" /><span className="font-medium capitalize">{city}</span></div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 capitalize">Creators in {city}</h1>
              <p className="text-muted-foreground text-lg">{creators.length} creators available</p>
            </motion.div>

            {creators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {creators.map((creator, i) => (
                  <motion.div key={creator.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <CreatorCard creator={creator} onView={(id) => navigate(`/creator/${id}`)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">No creators found in this city yet.</p>
                <Button asChild><Link to="/search">Browse All Creators</Link></Button>
              </div>
            )}

            <div className="mt-16">
              <h2 className="font-heading text-2xl font-bold text-center mb-6">Browse Other Cities</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {indianCities.filter(c => c.toLowerCase() !== city?.toLowerCase()).map(c => (
                  <Link key={c} to={`/cities/${c}`} className="px-4 py-2 bg-card rounded-full shadow-card text-sm font-medium hover:shadow-card-hover transition-all">{c}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CityCreators;
