import { motion } from "framer-motion";
import { Search, UserCheck, Calendar, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Search through thousands of verified creators by city, category, and budget.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: UserCheck,
    title: "Compare",
    description: "View portfolios, check rankings, read reviews, and shortlist your favorites.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Calendar,
    title: "Book",
    description: "Check availability, discuss requirements, and book directly through the platform.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Star,
    title: "Collaborate",
    description: "Work with amazing creators and leave reviews to help others discover great talent.",
    color: "bg-purple-500/10 text-purple-600",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary uppercase tracking-wider"
          >
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl md:text-4xl font-bold mt-2"
          >
            How Canecsu Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-3"
          >
            From discovery to collaboration, we make it seamless
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-border to-transparent" />
              )}
              
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center font-heading font-bold text-sm text-muted-foreground">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-4`}>
                  <step.icon className="h-8 w-8" />
                </div>
                
                {/* Content */}
                <h3 className="font-heading font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
