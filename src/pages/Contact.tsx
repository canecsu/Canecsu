import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "info@canecsu.com", desc: "We respond within 24 hours" },
  { icon: Phone, label: "Call Us", value: "+91 92968 41201", desc: "Mon-Fri, 9am-6pm IST" },
  { icon: MapPin, label: "Visit Us", value: "Patna, Bihar", desc: "By appointment only" },
  { icon: Clock, label: "Support Hours", value: "24/7 Available", desc: "Live chat support" },
];

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) { toast.error("Please fill required fields"); return; }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name, email, subject: subject || null, message,
    });
    setSending(false);
    if (error) { toast.error("Failed to send message. Please try again."); return; }
    setSubmitted(true);
    toast.success("Message sent! We'll get back to you shortly.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
              <p className="text-muted-foreground text-lg">Have a question, feedback, or need help? We'd love to hear from you.</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {contactInfo.map((info, i) => (
                <motion.div key={info.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="text-center p-6 bg-card rounded-2xl shadow-card">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <info.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm">{info.label}</h3>
                  <p className="font-medium text-sm mt-1">{info.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="max-w-2xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-card rounded-3xl p-8 md:p-10 shadow-card">
                <h2 className="font-heading text-2xl font-bold mb-2">Send us a message</h2>
                <p className="text-muted-foreground text-sm mb-8">Fill out the form below and we'll respond as quickly as possible.</p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="font-heading font-bold text-xl mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                    <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}>Send Another</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Name</label>
                        <Input placeholder="Your name" className="h-12" required value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Email</label>
                        <Input type="email" placeholder="you@example.com" className="h-12" required value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Subject</label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Choose a topic" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                          <SelectItem value="Technical Support">Technical Support</SelectItem>
                          <SelectItem value="Creator Questions">Creator Questions</SelectItem>
                          <SelectItem value="Business Partnership">Business Partnership</SelectItem>
                          <SelectItem value="Feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Message</label>
                      <Textarea placeholder="Tell us more..." className="min-h-[120px]" required value={message} onChange={e => setMessage(e.target.value)} />
                    </div>
                    <Button type="submit" size="lg" className="w-full gradient-primary text-primary-foreground" disabled={sending}>
                      <Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
