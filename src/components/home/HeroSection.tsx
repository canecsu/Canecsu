import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
  animate,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Sparkles, Users, Trophy, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "./HeroSearch";
import { useEffect, useRef } from "react";

const stats = [
  { icon: Users, value: 500, suffix: "+", label: "Creators" },
  { icon: Trophy, value: 50, suffix: "+", label: "Cities" },
  { icon: Sparkles, value: 100, suffix: "K+", label: "Bookings" },
  { icon: Star, value: 4.9, suffix: "", label: "Avg Rating", isDecimal: true },
];

const floatingAvatars = [
  "/IMG_20260330_135437.png",
  "/IMG_20260330_135547.png",
  "/IMG_20260330_135500.png",
  "/IMG_20260330_135525.png",
  "/IMG_20260330_135411.png",
];

function AnimatedCounter({ value, suffix, isDecimal }: { value: number; suffix: string; isDecimal?: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    isDecimal ? v.toFixed(1) : Math.floor(v).toLocaleString()
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return (
    <span className="font-heading text-2xl md:text-3xl font-bold text-foreground">
      <motion.span ref={ref}>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/* ---------------------------------------------------------
   Background 3D — animated particle constellation.
   Reads the theme's HSL vars so it matches primary/secondary.
--------------------------------------------------------- */
function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const isMobile = window.innerWidth < 768;

    const styles = getComputedStyle(document.documentElement);
    const primaryHsl = styles.getPropertyValue("--primary").trim() || "222 89% 55%";
    const secondaryHsl = styles.getPropertyValue("--secondary").trim() || "280 70% 60%";

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particleCount = isMobile ? 26 : 58;
    const linkDist = isMobile ? 85 : 130;
    const mouse = { x: -9999, y: -9999 };

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
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.7,
        accent: Math.random() > 0.55,
      }));
    }

    resize();
    seed();

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function handleResize() {
      resize();
      seed();
    }

    if (!isCoarsePointer) window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    let raf = 0;
    function tick() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 110) {
          p.x += (dx / d) * 0.5;
          p.y += (dy / d) * 0.5;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < linkDist) {
            const hue = a.accent ? secondaryHsl : primaryHsl;
            ctx!.strokeStyle = `hsl(${hue} / ${0.14 * (1 - d / linkDist)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.fillStyle = `hsl(${p.accent ? secondaryHsl : primaryHsl} / 0.55)`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!prefersReducedMotion) raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

/* ---------------------------------------------------------
   3D element — tilted orbit rings behind the headline.
   Real rotateX (tilt) + rotateZ (spin) composed by Framer Motion.
--------------------------------------------------------- */
function OrbitRings() {
  const shouldReduceMotion = useReducedMotion();

  const rings = [
    { size: 300, duration: 20, tilt: 62, opacity: 0.4, color: "--primary", reverse: false },
    { size: 420, duration: 28, tilt: 62, opacity: 0.26, color: "--secondary", reverse: true },
    { size: 540, duration: 38, tilt: 62, opacity: 0.16, color: "--primary", reverse: false },
  ];

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 scale-[0.55] sm:scale-[0.75] md:scale-90 lg:scale-100"
      style={{ perspective: 900 }}
      aria-hidden="true"
    >
      {/* soft central glow — the "spotlight" the rings orbit around */}
      <div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.18), transparent 70%)" }}
      />
      {rings.map((ring, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: ring.size,
            height: ring.size,
            marginLeft: -ring.size / 2,
            marginTop: -ring.size / 2,
            borderColor: `hsl(var(${ring.color}) / ${ring.opacity})`,
            borderWidth: 1,
            transformStyle: "preserve-3d",
            rotateX: ring.tilt,
          }}
          animate={shouldReduceMotion ? undefined : { rotateZ: ring.reverse ? -360 : 360 }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{
              top: -5,
              left: "50%",
              marginLeft: -5,
              background: `hsl(var(${ring.color}))`,
              boxShadow: `0 0 14px 3px hsl(var(${ring.color}) / 0.55)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------
   3D parallax tilt card — each floating avatar tilts toward
   the cursor with its own depth, using translateZ for layering.
--------------------------------------------------------- */
function CreatorTiltCard({
  avatar,
  posStyle,
  depth,
  mouseX,
  mouseY,
  entryDelay,
  floatDelay,
  floatDuration,
}: {
  avatar: string;
  posStyle: React.CSSProperties;
  depth: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  entryDelay: number;
  floatDelay: number;
  floatDuration: number;
}) {
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-depth * 12, depth * 12]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [depth * 12, -depth * 12]), {
    stiffness: 150,
    damping: 20,
  });
  const px = useSpring(useTransform(mouseX, [-0.5, 0.5], [-depth * 18, depth * 18]), {
    stiffness: 120,
    damping: 22,
  });
  const py = useSpring(useTransform(mouseY, [-0.5, 0.5], [-depth * 18, depth * 18]), {
    stiffness: 120,
    damping: 22,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: entryDelay, duration: 0.5 }}
      className="absolute hidden xl:block z-10"
      style={{ ...posStyle, x: px, y: py, perspective: 800 }}
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ delay: entryDelay + floatDelay, duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <div
          className="h-12 w-12 lg:h-14 lg:w-14 overflow-hidden rounded-2xl border-2 border-card opacity-70 shadow-xl"
          style={{ transform: `translateZ(${depth * 22}px)` }}
        >
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) return;

    function handleMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    }
    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  const cardPositions: { pos: React.CSSProperties; depth: number }[] = [
    { pos: { top: "15%", left: "8%" }, depth: 1.4 },
    { pos: { top: "25%", right: "6%" }, depth: 0.8 },
    { pos: { bottom: "30%", left: "5%" }, depth: 1.1 },
    { pos: { top: "60%", right: "8%" }, depth: 1.6 },
    { pos: { bottom: "15%", right: "15%" }, depth: 0.6 },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Layered background */}
      <div className="absolute inset-0 pt-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 50%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
                              radial-gradient(circle at 85% 20%, hsl(var(--secondary) / 0.08) 0%, transparent 50%),
                              radial-gradient(circle at 50% 80%, hsl(var(--primary) / 0.05) 0%, transparent 40%)`,
          }}
        />
        <NetworkBackground />
      </div>

      {/* Floating Blobs */}
      <motion.div
        animate={{ y: [-20, 20, -20], x: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[5%] w-40 h-40 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[10%] w-56 h-56 rounded-full bg-secondary/10 blur-3xl"
      />

      {/* 3D orbit rings — signature element */}
      <OrbitRings />

      {/* Floating 3D tilt cards (desktop only — mouse-driven) */}
      {floatingAvatars.map((avatar, i) => (
        <CreatorTiltCard
          key={i}
          avatar={avatar}
          posStyle={cardPositions[i].pos}
          depth={cardPositions[i].depth}
          mouseX={mouseX}
          mouseY={mouseY}
          entryDelay={1 + i * 0.5}
          floatDelay={0.5}
          floatDuration={3 + i}
        />
      ))}

      <div className="container relative z-20 py-16 md:py-28">
        <div className="max-w-5xl mx-auto text-center">
          {/* Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm"
          >
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span>India's #1 Creator Discovery Platform</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-5 sm:mb-6 leading-[0.95]"
          >
            Find Your Perfect
            <br />
            <span className="relative inline-block">
              <span className="gradient-text">Creator</span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-2 left-0 right-0 h-1.5 rounded-full gradient-primary origin-left"
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed px-2"
          >
            Discover top-rated photographers, influencers, and content creators in your city.
            Compare rankings, view portfolios, and book seamlessly.
          </motion.p>

          {/* Search Component */}
          <HeroSearch />

          {/* Social Proof Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 sm:mt-10 flex items-center justify-center gap-3"
          >
            <div className="flex -space-x-2">
              {floatingAvatars.slice(0, 4).map((avatar, i) => (
                <img
                  key={i}
                  src={avatar}
                  alt=""
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">2,500+</span> creators joined this month
            </p>
          </motion.div>

          {/* Stats — glass card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12 sm:mt-16 mx-auto max-w-3xl rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg px-4 sm:px-8 py-5 sm:py-6"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-16">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-2.5 sm:gap-3"
                >
                  <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10">
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} isDecimal={stat.isDecimal} />
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 sm:mt-12"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto gradient-primary text-primary-foreground hover:opacity-90 text-base px-8 h-13 shadow-glow-primary"
                asChild
              >
                <Link to="/search">
                  Explore Creators
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-13" asChild>
                <Link to="/register/creator">Join as Creator</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
