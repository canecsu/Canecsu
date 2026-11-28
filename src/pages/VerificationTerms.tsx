import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CheckCircle2, ShieldAlert } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const terms = [
  {
    title: "1. What the ₹99 fee is for",
    body: "The ₹99 amount is a platform application/review fee for the CANECSU Verified Creator badge. It is not a fee for government verification, a professional licence, legal identity certification, or a guaranteed business result.",
  },
  {
    title: "2. Badge validity",
    body: "When the application is activated, the platform badge remains active for 12 months from the activation date. A new application or renewal fee may be required after expiry. Existing badge records follow the validity shown in the creator dashboard.",
  },
  {
    title: "3. What the badge provides",
    body: "The badge is a visible CANECSU trust signal and contributes up to 5 points in the 100-point creator ranking model. The other ranking factors include portfolio quality, reviews, response behaviour, activity, and completed bookings.",
  },
  {
    title: "4. What the badge does not provide",
    body: "The badge does not guarantee identity, portfolio originality, service quality, bookings, income, client satisfaction, a top ranking position, or a particular search placement. It is not a government-issued mark.",
  },
  {
    title: "5. Creator responsibilities",
    body: "Creators must keep their profile information accurate, use content they own or are authorised to publish, respond honestly to clients, and follow CANECSU community and payment rules. CANECSU may remove or suspend a badge where there is fraud, impersonation, misleading information, policy abuse, or a material account violation.",
  },
  {
    title: "6. Payment and support",
    body: "Payments are processed through Razorpay. Do not send the fee to a person or account outside the CANECSU checkout. If payment succeeds but activation fails, contact CANECSU support with the Razorpay order ID and payment ID. Refunds, where applicable, are handled under the platform payment and refund policy.",
  },
];

export default function VerificationTerms() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-14 md:py-20">
        <div className="container max-w-4xl">
          <Link to="/help" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Help Center
          </Link>

          <div className="mb-10 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-card md:p-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <BadgeCheck className="h-7 w-7 text-amber-500" />
            </div>
            <h1 className="font-heading text-3xl font-bold md:text-4xl">CANECSU Verified Creator Terms</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Please read these terms before paying the ₹99 application/review fee. Last updated: November 28, 2026.
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-green-950"><CheckCircle2 className="h-4 w-4" /> In simple words</h2>
              <p className="text-sm leading-relaxed text-green-900/80">You are paying for a CANECSU platform review and trust badge. Read the benefits and limits before you proceed.</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-950"><ShieldAlert className="h-4 w-4" /> Important limit</h2>
              <p className="text-sm leading-relaxed text-amber-900/80">This is not government, legal, identity, or professional verification.</p>
            </div>
          </div>

          <div className="space-y-4">
            {terms.map((term) => (
              <section key={term.title} className="rounded-2xl bg-card p-6 shadow-card md:p-8">
                <h2 className="mb-3 font-heading text-lg font-bold">{term.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{term.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Questions about this badge? <Link to="/contact" className="text-primary hover:underline">Contact support</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

