import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const sections = [
  { title: "Acceptance of Terms", content: "By accessing or using Canecsu, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. We reserve the right to modify these terms at any time." },
  { title: "User Accounts", content: "You must create an account to access certain features. You are responsible for maintaining the security of your account credentials. You must provide accurate information and keep it updated. Users must be at least 18 years old." },
  { title: "Creator Profiles", content: "Creators are responsible for the accuracy of their profile information, portfolio content, pricing, and availability. All content must be original or properly licensed. Canecsu reserves the right to remove content that violates our guidelines." },
  { title: "Bookings & Payments", content: "Bookings made through Canecsu are agreements between creators and clients. Canecsu facilitates the connection but is not a party to the service agreement. Cancellation policies are set by individual creators." },
  { title: "Ranking System", content: "Our ranking algorithm considers multiple factors including portfolio quality, ratings, response rate, and booking history. Rankings are calculated automatically and updated regularly. Manipulation of rankings is strictly prohibited." },
  { title: "Reviews & Ratings", content: "Reviews must be honest, relevant, and based on actual interactions. Fake reviews, review manipulation, or harassment through reviews is prohibited and may result in account suspension." },
  { title: "Prohibited Conduct", content: "Users may not engage in fraudulent activity, harassment, spam, impersonation, or any illegal activity. Violation of these terms may result in immediate account termination without refund." },
  { title: "Limitation of Liability", content: "Canecsu provides the platform 'as is' and is not liable for disputes between creators and clients, quality of services delivered, or any indirect damages arising from platform use." },
];

const Terms = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: March 1, 2026</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl p-8 md:p-10 shadow-card mb-8">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Canecsu. These Terms of Service govern your use of our platform. Please read them carefully before creating an account or using any of our services.
            </p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card rounded-2xl p-6 md:p-8 shadow-card">
                <h2 className="font-heading text-lg font-bold mb-3">{i + 1}. {section.title}</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{section.content}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Questions about our terms? <a href="/contact" className="text-primary hover:underline">Contact us</a></p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Terms;
