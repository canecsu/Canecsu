import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center relative z-10 px-6"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="font-heading text-[120px] md:text-[180px] font-bold gradient-text leading-none mb-4"
      >
        404
      </motion.div>
      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" className="gradient-primary text-primary-foreground" asChild>
          <Link to="/"><Home className="h-4 w-4 mr-2" />Go Home</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/search"><Search className="h-4 w-4 mr-2" />Browse Creators</Link>
        </Button>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
