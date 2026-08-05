import { motion } from "framer-motion";
import { Shield, Zap, Clock, Award } from "lucide-react";

const badges = [
  { icon: Shield, title: "Verified Profiles", desc: "Every creator is manually verified" },
  { icon: Zap, title: "Instant Booking", desc: "Book and connect in minutes" },
  { icon: Clock, title: "24/7 Support", desc: "Round-the-clock assistance" },
  { icon: Award, title: "Quality Guarantee", desc: "Satisfaction or your money back" },
];

export function TrustBadges() {
  return (
    <section className="py-12 border-y border-border/50 bg-muted/30">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="p-2.5 rounded-xl bg-secondary/10 shrink-0">
                <badge.icon className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
