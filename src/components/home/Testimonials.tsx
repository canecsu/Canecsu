import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Abhishek Kumar",
    role: "Brand Manager, Sumirayan desgin",
    avatar: "/IMG_20260330_135437.png",
    text: "Canecsu helped us find the perfect photographer for our campaign in under 24 hours. The ranking system made it so easy to compare and choose.",
    rating: 5,
  },
  {
    name: "Deepak Kumar",
    role: "Top Photographer, Mumbai",
    avatar: "/IMG_20260330_135500.png",
    text: "Since joining Canecsu, my bookings have increased by 300%. The platform gives me real visibility and the ranking system rewards quality work.",
    rating: 5,
  },
  {
    name: "Shubham Chaubey",
    role: "Startup Founder",
    avatar: "/IMG_20260330_135525.png",
    text: "We booked an influencer for our product launch and the entire process was seamless. The verified reviews gave us confidence in our choice.",
    rating: 5,
  },
  {
    name: "Sumit Singh",
    role: "Wedding Filmmaker, Patna",
    avatar: "/IMG_20260330_135547.png",
    text: "The creator dashboard is fantastic. I can track my rank, manage bookings, and see analytics all in one place. Game-changer for my business.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary uppercase tracking-wider"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mt-2"
          >
            Loved by Creators & Clients
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-3"
          >
            Hear from the people who trust Canecsu every day
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-card rounded-2xl p-6 md:p-8 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <p className="font-heading font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
