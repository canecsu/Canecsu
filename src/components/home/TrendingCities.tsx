import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, ArrowUpRight } from "lucide-react";

const cities = [
  { name: "Mumbai", count: 2400, image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&h=500&fit=crop", color: "from-orange-500/80" },
  { name: "Delhi", count: 1800, image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=500&fit=crop", color: "from-red-500/80" },
  { name: "Bangalore", count: 1500, image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=500&fit=crop", color: "from-violet-500/80" },
  { name: "Jaipur", count: 900, image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=500&fit=crop", color: "from-pink-500/80" },
  { name: "Chennai", count: 1100, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=500&fit=crop", color: "from-teal-500/80" },
  { name: "Kolkata", count: 800, image: "https://images.unsplash.com/photo-1558431382-27e303142255?w=400&h=500&fit=crop", color: "from-amber-500/80" },
];

export function TrendingCities() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-secondary uppercase tracking-wider"
          >
            Popular Cities
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mt-2"
          >
            Trending Cities
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-3"
          >
            Explore top creators from India's most vibrant cities
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((city, i) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={`/cities/${city.name}`}
                className="group block relative aspect-[3/4] rounded-2xl overflow-hidden"
              >
                <img
                  src={city.image}
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${city.color} via-black/30 to-transparent`} />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-1 text-white/80 text-xs mb-1">
                    <MapPin className="h-3 w-3" />
                    {city.count.toLocaleString()} creators
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-white text-lg">{city.name}</h3>
                    <ArrowUpRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
