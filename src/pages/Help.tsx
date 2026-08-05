import { useState } from "react";
import { motion } from "framer-motion";
import { Search, HelpCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  { q: "How does Canecsu's ranking system work?", a: "Our ranking algorithm considers six factors: Portfolio Quality (25%), Client Ratings (25%), Response Rate (15%), Activity Level (15%), Verification Status (10%), and Completed Bookings (10%). Rankings are updated weekly and are transparent to all users.", category: "Rankings" },
  { q: "How do I create a creator profile?", a: "Sign up as a Creator, then complete your profile by adding a bio, uploading portfolio items, setting your pricing and availability, and linking your social media accounts. The more complete your profile, the higher your ranking potential.", category: "Getting Started" },
  { q: "Is it free to join Canecsu?", a: "Yes! Creating a profile and appearing in search results is completely free. We offer Pro and Business plans with additional features like priority ranking, advanced analytics, and featured placements.", category: "Pricing" },
  { q: "How do bookings work?", a: "Clients can send you an inquiry or booking request through your profile. You'll receive a notification and can accept, decline, or counter-offer. Once confirmed, both parties receive booking details and can communicate through the platform.", category: "Bookings" },
  { q: "How do I get verified?", a: "Submit a verification request through your dashboard. Our team will review your identity documents, portfolio authenticity, and professional credentials. Verified profiles receive a badge and a ranking boost.", category: "Verification" },
  { q: "What commission does Canecsu charge?", a: "Canecsu charges a 5% commission on successful bookings made through the platform. This covers payment processing, platform maintenance, and customer support.", category: "Pricing" },
  { q: "Can I message creators before booking?", a: "Yes! You can send a direct inquiry to any creator to discuss your project requirements, ask questions, or request a custom quote before committing to a booking.", category: "Bookings" },
  { q: "How are reviews verified?", a: "Reviews can only be left after a completed booking. Each review is tagged with a 'Verified Booking' badge. We also monitor for suspicious patterns and fake reviews.", category: "Reviews" },
  { q: "Can I cancel a booking?", a: "Cancellation policies are set by individual creators and displayed on their profile. Generally, cancellations made 48+ hours before the booking date are eligible for a full refund.", category: "Bookings" },
  { q: "How do I improve my ranking?", a: "Focus on completing your profile, uploading high-quality portfolio items, responding quickly to inquiries, getting positive reviews, and staying active on the platform. Consistent quality work is the best way to climb the rankings.", category: "Rankings" },
];

const Help = () => {
  const [search, setSearch] = useState("");
  const filtered = faqs.filter(f => 
    f.q.toLowerCase().includes(search.toLowerCase()) || 
    f.a.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
              <p className="text-muted-foreground text-lg mb-8">Find answers to commonly asked questions</p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-xl"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Accordion type="single" collapsible className="space-y-3">
                {filtered.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-2xl px-6 shadow-card border-none">
                    <AccordionTrigger className="hover:no-underline py-5 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{faq.category}</span>
                        <span className="font-medium text-sm">{faq.q}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No results found for "{search}"</p>
                  <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-center mt-12 bg-card rounded-3xl p-8 shadow-card">
              <h3 className="font-heading text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground text-sm mb-4">Can't find what you're looking for? Reach out to our support team.</p>
              <Button className="gradient-primary text-primary-foreground" asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Help;
