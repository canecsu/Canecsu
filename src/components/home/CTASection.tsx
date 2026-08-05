import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const benefits = [
  "Get discovered by clients actively looking for talent",
  "Showcase your portfolio with a stunning profile page",
  "Track your city ranking and climb to the top",
  "Manage bookings and earnings in one place",
  "Build credibility with verified reviews",
];

export function CTASection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* 🌌 Premium Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D56A7] via-[#1a4b8c] to-[#423068] z-0 pointer-events-none" />
      
      {/* ✨ Subtle Animated Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* 📝 LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold mb-8 shadow-lg">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>For Creators & Professionals</span>
            </div>
            
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.15] tracking-tight">
              Ready to Grow Your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                Creative Career?
              </span>
            </h2>
            
            <p className="text-white/80 text-base sm:text-lg md:text-xl mb-10 leading-relaxed font-medium px-2 lg:px-0">
              Join thousands of photographers, influencers, and content creators who are building their brands and landing amazing opportunities on Canecsu.
            </p>

            <ul className="space-y-4 mb-10 text-left w-full max-w-md mx-auto lg:mx-0">
              {benefits.map((benefit, index) => (
                <motion.li 
                  key={benefit} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 text-white/90 font-medium text-sm sm:text-base md:text-lg"
                >
                  <div className="mt-1 bg-white/20 rounded-full p-1 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-[#0D56A7] hover:bg-gray-100 text-base font-bold px-8 h-14 rounded-xl shadow-[0_8px_30px_rgb(255,255,255,0.2)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.3)] transition-all hover:-translate-y-1"
                asChild
              >
                <Link to="/register/creator">
                  Join as Creator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent text-white border-2 border-white/30 hover:bg-white/10 hover:border-white text-base font-bold px-8 h-14 rounded-xl backdrop-blur-sm transition-all hover:-translate-y-1"
                asChild
              >
                <Link to="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </motion.div>

          {/* 🖼️ RIGHT VISUAL - Now visible & optimized for mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="relative mt-12 lg:mt-0 w-full max-w-lg mx-auto lg:max-w-none"
          >
            <div className="relative z-10 px-4 sm:px-8 lg:px-0">
              {/* Main Image with Premium Glow */}
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D56A7]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&fit=crop"
                  alt="Creator working"
                  className="w-full h-[350px] sm:h-[450px] lg:h-[600px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              
              {/* Floating Card 1 - Responsive Positioning */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-4 sm:top-12 -left-2 sm:-left-6 lg:-left-12 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-3 sm:p-5 z-20 scale-90 sm:scale-100"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-inner shrink-0">
                    <Trophy className="h-5 w-5 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-gray-900 text-sm sm:text-lg leading-tight">Top Ranked</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-500">#1 in Mumbai</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Card 2 - Responsive Positioning */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-4 sm:bottom-12 -right-2 sm:-right-6 lg:-right-12 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-3 sm:p-5 z-20 scale-90 sm:scale-100"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-green-100 flex items-center justify-center text-lg sm:text-2xl shadow-inner shrink-0">
                    💸
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-gray-900 text-base sm:text-xl leading-tight">₹2.5L+</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-500">Earned this month</div>
                  </div>
                </div>
              </motion.div>
              
              {/* Decorative Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
