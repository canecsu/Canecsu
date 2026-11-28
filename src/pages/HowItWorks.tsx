import { motion } from "framer-motion";
import { Search, UserCheck, MessageCircle, CalendarCheck, Star, ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const clientSteps = [
  { icon: Search, title: "Search & Discover", description: "Browse creators by city, category, budget, and rating. Use our smart filters to find the perfect match." },
  { icon: UserCheck, title: "Compare & Shortlist", description: "View detailed profiles, portfolios, and reviews. Shortlist your favorites for easy comparison." },
  { icon: MessageCircle, title: "Connect & Discuss", description: "Send a direct inquiry or request a quote. Discuss your project requirements in detail." },
  { icon: CalendarCheck, title: "Book & Create", description: "Confirm the booking, agree on deliverables, and bring your vision to life." },
  { icon: Star, title: "Review & Rate", description: "Share your experience with a verified review to help other clients and reward great creators." },
];

const creatorSteps = [
  { icon: UserCheck, title: "Create Your Profile", description: "Sign up, add your bio, upload your portfolio, set your pricing and availability." },
  { icon: Search, title: "Get Discovered", description: "Our ranking algorithm promotes quality. The better your profile, the higher you rank." },
  { icon: MessageCircle, title: "Receive Inquiries", description: "Clients reach out to you directly. Respond quickly to boost your ranking." },
  { icon: CalendarCheck, title: "Complete Bookings", description: "Deliver exceptional work, build your reputation, and grow your client base." },
];

const HowItWorks = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">How <span className="gradient-text">Canecsu</span> Works</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Simple steps to connect creators with clients</p>
          </motion.div>

          {/* For Clients */}
          <div className="mb-20">
            <h2 className="font-heading text-2xl font-bold text-center mb-10">For Clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {clientSteps.map((step, i) => (
                <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="relative text-center p-6 bg-card rounded-2xl shadow-card">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <span className="absolute top-4 right-4 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{i + 1}</span>
                  <h3 className="font-heading font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* For Creators */}
          <div className="mb-20">
            <h2 className="font-heading text-2xl font-bold text-center mb-10">For Creators</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {creatorSteps.map((step, i) => (
                <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="relative text-center p-6 bg-card rounded-2xl shadow-card">
                  <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <span className="absolute top-4 right-4 text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{i + 1}</span>
                  <h3 className="font-heading font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mb-20 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <BadgeCheck className="h-7 w-7 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-700">For creators</p>
                    <h2 className="font-heading text-2xl font-bold">CANECSU Verified Creator badge</h2>
                  </div>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  Creators can submit a ₹99 application/review fee from the dashboard. If activated, the platform badge stays active for 12 months and contributes up to 5 points in the 100-point ranking model.
                </p>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  This is a CANECSU trust signal—not a government certificate, legal identity proof, professional licence, or guarantee of bookings, income, or top ranking.
                </p>
              </div>
              <Button variant="outline" className="shrink-0 rounded-full border-amber-300 bg-white/70" asChild>
                <Link to="/verification-terms">Read verification terms <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-12">
            <h2 className="font-heading text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Join thousands of creators and clients already using Canecsu.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="gradient-primary text-primary-foreground" asChild><Link to="/register">Join as Creator <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/search">Find Creators</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default HowItWorks;

