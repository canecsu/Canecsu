import { motion } from "framer-motion";
import { Users, Award, MapPin, Zap, Heart, Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const stats = [
  { label: "Active Creators", value: "10,000+", icon: Users },
  { label: "Cities Covered", value: "50+", icon: MapPin },
  { label: "Successful Bookings", value: "25,000+", icon: Award },
  { label: "Happy Clients", value: "15,000+", icon: Heart },
];

const values = [
  { title: "Creator First", description: "Every feature is built to empower creators and help them grow.", icon: Zap },
  { title: "Transparency", description: "Our ranking algorithm is open and fair — no hidden boosts.", icon: Shield },
  { title: "Community", description: "We're building more than a platform — we're building a creative community.", icon: Heart },
];

const About = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">About <span className="gradient-text">Canecsu</span></h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Canecsu is the modern platform connecting creative talent with real opportunities. We believe every creator deserves visibility, and every client deserves to find the perfect match — effortlessly.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-card rounded-2xl shadow-card">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="font-heading text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="font-heading text-3xl font-bold text-center mb-10">Our Values</h2>
            <div className="space-y-6">
              {values.map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex gap-5 p-6 bg-card rounded-2xl shadow-card">
                  <div className="shrink-0 w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <v.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{v.title}</h3>
                    <p className="text-muted-foreground mt-1">{v.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center bg-card rounded-3xl p-12 shadow-card">
            <h2 className="font-heading text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              To democratize the creative industry by providing a transparent, data-driven platform where talent speaks louder than connections. We're making it easy for creators to be discovered and for clients to find exactly who they need.
            </p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default About;
