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
  { q: "How does Canecsu's ranking system work?", a: "Creator ranking uses a 100-point model: Portfolio Quality (25), Client Ratings (25), Response Rate (15), Activity Level (15), Verification Status (10), and Completed Bookings (10). Scores are recalculated when relevant profile, portfolio, service, review, booking, or badge data changes. A score supports discovery but does not guarantee a fixed position or a booking.", category: "Rankings" },
  { q: "How do I create a creator profile?", a: "Create a Creator account and complete your profile with an accurate name, city, category, bio, profile photo, portfolio, pricing, availability, and services. Upload only work that you own or are authorised to show. A complete profile helps clients understand your services and can improve ranking potential.", category: "Getting Started" },
  { q: "Is it free to join Canecsu?", a: "Creating an account and creator profile is free. Any optional paid service will show its price and terms before payment. Do not pay a person directly or rely on an offer that is not shown in the CANECSU checkout or dashboard.", category: "Pricing" },
  { q: "How do bookings work?", a: "A client selects a service, date, time, and requirements, then follows the booking flow shown on the creator profile. In the standard Book Now flow, the creator receives a request and can approve or reject it; after approval, a 50% advance is requested and the remaining 50% is requested after work is marked complete. The Request a Quote flow may start with an advance payment. Always check the status and amount summary shown before confirming. The current flow does not promise a counter-offer feature.", category: "Bookings" },
  { q: "What is the ₹99 CANECSU Verified Creator review fee?", a: "It is a ₹99 platform application/review fee paid from the creator dashboard. After successful checkout and system verification, the CANECSU platform badge is active for 12 months and contributes up to 5 points in the 100-point ranking model. It is not a government certificate, legal identity proof, or professional licence.", category: "Verification" },
  { q: "What does the CANECSU Verified Creator badge mean?", a: "It means the creator has an active CANECSU platform badge under the current badge terms. It is a trust signal within CANECSU; it does not confirm identity, portfolio originality, service quality, bookings, income, or client satisfaction.", category: "Verification" },
  { q: "What should I check before paying ₹99?", a: "Check that your name, category, city, bio, pricing, availability, and portfolio are accurate. Open the info button beside the badge in your dashboard and read the full Verification Terms before completing the Razorpay checkout.", category: "Verification" },
  { q: "Does the badge guarantee bookings or a top ranking?", a: "No. The badge contributes up to 5 ranking points, while the other points come from portfolio quality, ratings, response behaviour, activity, and completed bookings. It does not guarantee leads, bookings, income, search placement, or client satisfaction.", category: "Verification" },
  { q: "Is the ₹99 badge official identity verification?", a: "No. The ₹99 flow is for a CANECSU platform badge, not official identity verification, legal identity proof, a government certificate, or a professional licence. Do not send identity documents or payment to an individual account. Use only an authenticated CANECSU flow or contact support if an official process is announced.", category: "Verification" },
  { q: "What fee is added to a booking?", a: "The standard Book Now booking screen currently calculates a 10% CANECSU platform fee on the service amount. The payment summary shows the service amount, platform fee, advance amount, remaining amount, and total before payment. If a different Request a Quote flow is shown, rely on its final on-screen summary before confirming.", category: "Pricing" },
  { q: "Can I message creators before booking?", a: "Signed-in users can use the available Request a Quote or messaging flow to discuss requirements before booking. Availability depends on the creator profile and the feature shown on screen; never move payment outside CANECSU.", category: "Bookings" },
  { q: "How are reviews used?", a: "Creator profiles display review records when available. For ranking, a review is counted only when it is linked to a booking that matches the client and creator and has completed status. Do not assume that every displayed review has a separate verified-booking label.", category: "Reviews" },
  { q: "Can I cancel a booking?", a: "Cancellation depends on the booking status. The client can use Cancel only while the current flow allows it, and the button is shown in the dashboard. There is no fixed 48-hour full-refund promise in the current system. If payment has already been made, contact support and follow the applicable payment and refund policy.", category: "Bookings" },
  { q: "How do I improve my ranking?", a: "Keep your profile complete and accurate, publish strong portfolio work, add active services and availability, respond promptly, complete bookings professionally, and earn genuine reviews linked to completed bookings. The paid badge can add up to 5 points, but no action guarantees a particular rank or booking.", category: "Rankings" },
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

