import { motion } from "framer-motion";
import { Mail, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PrivacyContactForm } from "@/components/privacy/PrivacyContactForm";
import { Link } from "react-router-dom";

const sections = [
  { title: "Information We Collect", content: "We collect information you provide directly, such as your name, email, profile details, portfolio content, and payment information. We also automatically collect usage data, device information, and cookies when you use our platform." },
  { title: "How We Use Your Information", content: "We use your information to provide and improve our services, process bookings, enable communication between creators and clients, personalize your experience, calculate rankings, and send relevant notifications." },
  { title: "Information Sharing", content: "We share your profile information publicly as part of the creator directory. We do not sell your personal data. We may share information with service providers who assist in operating our platform, and when required by law." },
  { title: "Data Security & Encryption", content: "All traffic to Canecsu is encrypted in transit using TLS 1.2+. Sensitive data is stored on encrypted-at-rest infrastructure with strict access controls. Passwords are hashed using industry-standard algorithms — staff never see your plaintext password." },
  { title: "Breach Notification", content: "If we ever discover a personal-data breach that is likely to put you at risk, we will notify affected users in-app and by email without undue delay, and report the incident to the relevant regulator as required by law." },
  { title: "Your Rights (Access, Correction, Erasure)", content: "You can access and update your data from your profile at any time. You can permanently delete your account and personal data from Settings → Delete My Account & Data, or by writing to privacy@canecsu.com. Records we must keep for tax or fraud-prevention will be retained in anonymized form only." },
  { title: "Minors", content: "Canecsu is not intended for children under 13. Users between 13 and 17 must provide a parent or guardian email at sign-up. We do not show behavioural advertising or send marketing emails to users under 18." },
  { title: "Cookies", content: "We use cookies and similar technologies to enhance your browsing experience, analyze platform usage, and personalize content. You can manage cookie preferences through your browser settings." },
  { title: "Changes to This Policy", content: "We may update this privacy policy from time to time. We will notify you of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance." },
];

const Privacy = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: March 1, 2026</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl p-8 md:p-10 shadow-card mb-8">
            <p className="text-muted-foreground leading-relaxed">
              At Canecsu, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
            </p>
          </motion.div>

          {/* DPO / Privacy contact card */}
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-card mb-8 flex flex-col sm:flex-row items-start gap-4 border border-primary/20">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-bold mb-1">Data Protection Officer</h2>
              <p className="text-sm text-muted-foreground mb-2">
                For any privacy question, data-access request or grievance you can reach our DPO directly.
              </p>
              <a href="mailto:privacy@canecsu.com" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                <Mail className="h-4 w-4" /> privacy@canecsu.com
              </a>
            </div>
          </div>

          {/* Right to erasure quick-action */}
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-card mb-8 border border-destructive/20">
            <div className="flex items-start gap-3 mb-3">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h2 className="font-heading text-lg font-bold">Right to Erasure</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You can delete your account and personal data at any time. We will
                  anonymize records we are legally required to retain.
                </p>
              </div>
            </div>
            <Link to="/profile" className="text-sm font-semibold text-destructive hover:underline">
              Go to settings → Delete My Account
            </Link>
          </div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card rounded-2xl p-6 md:p-8 shadow-card">
                <h2 className="font-heading text-lg font-bold mb-3">{i + 1}. {section.title}</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{section.content}</p>
              </motion.div>
            ))}
          </div>

          {/* Grievance / Privacy complaint form */}
          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-card mt-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h2 className="font-heading text-lg font-bold">File a Privacy Grievance</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us about any privacy or data-handling concern. Our DPO will respond within 7 days.
                </p>
              </div>
            </div>
            <PrivacyContactForm />
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Questions about our privacy practices? Email <a href="mailto:privacy@canecsu.com" className="text-primary hover:underline">privacy@canecsu.com</a> or <a href="/contact" className="text-primary hover:underline">contact support</a>.</p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Privacy;
