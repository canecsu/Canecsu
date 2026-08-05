import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { allCategories } from "@/data/mockData";
import { CATEGORY_LABELS, CATEGORY_ICONS, CreatorCategory } from "@/types/creator";

const categoryImages: Record<CreatorCategory, string> = {
  photographer: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop",
  influencer: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop",
  videographer: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop",
  model: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop",
  "artist": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  "makeup-artist": "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  "video-editor": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop",
  agency: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
  "graphic-designer": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop",
  singer: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
  dj: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=600&h=450&fit=crop",
  "music-band": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=300&fit=crop",
};

// Framer Motion-wrapped Router Link — keeps client-side navigation
// working while letting motion values (rotateX/rotateY/spring) apply.
const MotionLink = motion(Link);

/* ---------------------------------------------------------
   3D element — a tiny orbit ring next to the eyebrow, echoing
   the hero/featured sections for visual continuity.
--------------------------------------------------------- */
function AccentRing() {
  return (
    <div className="relative hidden sm:block h-8 w-8" style={{ perspective: 400 }} aria-hidden="true">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-secondary/40"
        style={{ transformStyle: "preserve-3d", rotateX: 58 }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute h-1.5 w-1.5 rounded-full bg-secondary"
          style={{ top: -3, left: "50%", marginLeft: -3, boxShadow: "0 0 8px 2px hsl(var(--secondary) / 0.6)" }}
        />
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------
   3D tilt tile — rotates toward the cursor, icon + title pop
   forward via translateZ, background image gets a parallax
   nudge, and a glare sweeps across on hover.
--------------------------------------------------------- */
function CategoryTile({ category, index }: { category: CreatorCategory; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const imgShiftX = useTransform(springRotateY, [-8, 8], [6, -6]);
  const imgShiftY = useTransform(springRotateX, [-8, 8], [-6, 6]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, hsl(var(--secondary) / 0.35), transparent 55%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 16);
    rotateX.set((0.5 - py) * 16);
    glareX.set(px * 100);
    glareY.set(py * 100);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      style={{ perspective: 900 }}
    >
      <MotionLink
        ref={ref}
        to={`/search?category=${category}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
        className="group block relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 will-change-transform"
      >
        {/* Background image with subtle parallax + zoom */}
        <motion.img
          src={categoryImages[category]}
          alt={CATEGORY_LABELS[category]}
          style={{ x: imgShiftX, y: imgShiftY, scale: 1.08 }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.18]"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Glare sweep */}
        <motion.div
          aria-hidden="true"
          style={{ background: glareBackground }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Content — icon and title lift forward in real 3D depth */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end" style={{ transformStyle: "preserve-3d" }}>
          <motion.div
            className="flex items-center gap-2 mb-1"
            style={{ transform: "translateZ(30px)" }}
          >
            <span className="text-2xl drop-shadow-lg">{CATEGORY_ICONS[category]}</span>
            <ArrowRight className="h-4 w-4 text-white opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
          </motion.div>
          <h3
            className="font-heading font-bold text-white text-lg md:text-xl drop-shadow-lg"
            style={{ transform: "translateZ(20px)" }}
          >
            {CATEGORY_LABELS[category]}
          </h3>
        </div>

        {/* Rim light on hover — sells the 3D lift */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-white/20 transition-all duration-300" />
      </MotionLink>
    </motion.div>
  );
}

export function CategoryBrowse() {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-sm font-medium text-secondary uppercase tracking-wider">Explore</span>
            <AccentRing />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mt-2"
          >
            Browse by Category
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-3"
          >
            Find the perfect creative talent for your next project
          </motion.p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {allCategories.map((category, index) => (
            <CategoryTile key={category} category={category as CreatorCategory} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
